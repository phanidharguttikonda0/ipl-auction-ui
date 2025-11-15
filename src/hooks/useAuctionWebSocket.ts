import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "../constants";
import type {
    AuctionState,
    CurrentPlayer,
    BidUpdateMessage,
    SoldPlayerMessage,
    NewJoinerMessage,
    OldParticipantMessage,
    DisconnectedMessage,
    ParticipantState,
    AuctionStatus,
} from "../types";

interface UseAuctionWebSocketProps {
    roomId: string;
    participantId: number;
    teamName: string;
    onConnectionError?: (error: string) => void;
    onMessage?: (message: string) => void;
}

export const useAuctionWebSocket = ({
                                        roomId,
                                        participantId,
                                        teamName,
                                        onConnectionError,
                                        onMessage,
                                    }: UseAuctionWebSocketProps) => {
    const wsRef = useRef<WebSocket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [connected, setConnected] = useState(false);

    const [auctionState, setAuctionState] = useState<AuctionState>({
        participants: new Map(),
        currentPlayer: null,
        currentBid: 0,
        highestBidder: null,
        soldPlayers: [],
        unsoldPlayers: [],
        timerRemaining: 0,
        myBalance: 100,
        myTeamName: teamName,
        myParticipantId: participantId,
        auctionStatus: "pending",
    });
    const handleAuctionParticipant = useCallback((data: any) => {
        console.log("⚙️ handleAuctionParticipant() called with:", data);

        setAuctionState((prev) => {
            // clone map so React notices the change
            const newParticipants = new Map<number, ParticipantState>(prev.participants);

            newParticipants.set(data.id, {
                participant_id: data.id,
                team_name: data.team_name,
                balance: data.balance,
                total_players_brought: data.total_players_brought,
                connected: true,
            });

            const myBalance = data.id === participantId ? data.balance : prev.myBalance;

            const nextState = {
                ...prev,
                participants: newParticipants,
                myBalance,
            };

            console.log("👥 participants after update:", Array.from(newParticipants.values()));
            return nextState;
        });

        onMessage?.(`${data.team_name} joined / updated`);
        console.log(`🟢 Participant processed: ${data.team_name} (id=${data.id})`);
    }, [participantId, onMessage]);

    const isJsonMessage = useCallback((data: string): boolean => {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return false;
        }
    }, []);

    const handleMessage = useCallback(
        (data: string) => {
            if (isJsonMessage(data)) {
                const parsed = JSON.parse(data);

                // 🆕 Detects an array of AuctionParticipant
                if (Array.isArray(parsed) && parsed.length && parsed[0].id !== undefined) {
                    handleParticipantList(parsed);
                    return;
                }

                handleJsonMessage(parsed);
            } else {
                handleStringMessage(data);
            }
        },
        [isJsonMessage]
    );

    const handleStringMessage = useCallback(
        (data: string) => {
            if (data === "UnSold") {
                onMessage?.("Player UNSOLD!");
                setAuctionState((prev) => ({
                    ...prev,
                    unsoldPlayers: [...prev.unsoldPlayers, prev.currentPlayer?.name || "Unknown"],
                    currentPlayer: null,
                    currentBid: 0,
                    highestBidder: null,
                }));
                stopTimer();
            } else if (data === "exit") {
                onMessage?.("Auction ended by host");
                setAuctionState((prev) => ({ ...prev, auctionStatus: "completed" }));
                wsRef.current?.close();
            } else if (data === "Auction Completed") {
                onMessage?.("Auction completed!");
                setAuctionState((prev) => ({ ...prev, auctionStatus: "completed" }));
            } else if (data.includes("Auction Stopped Temporarily")) {
                onMessage?.(data);
                setAuctionState((prev) => ({ ...prev, auctionStatus: "stopped" }));
            } else {
                onMessage?.(data);
            }
        },
        [onMessage]
    );

    const handleJsonMessage = useCallback((data: any) => {
        console.log("🔍 JSON message received:", data);

        // 🟦 Handle AuctionParticipant (new or old)
        if (
            data.hasOwnProperty("id") &&
            data.hasOwnProperty("team_name") &&
            data.hasOwnProperty("balance") &&
            data.hasOwnProperty("total_players_brought")
        ) {
            console.log("📌 Detected AuctionParticipant:", data);
            handleAuctionParticipant(data);
            return;
        }

        // 🟧 Handle Current Player
        if (data.id && data.name && typeof data.base_price === "number") {
            handleNewPlayer(data as CurrentPlayer);
            return;
        }

        // 🟨 Handle Bid Update
        if (data.bid_amount && data.team) {
            handleBidUpdate(data as BidUpdateMessage);
            return;
        }

        // 🟥 Sold Player Update
        if (
            data.team_name &&
            typeof data.sold_price === "number" &&
            data.remaining_balance !== undefined
        ) {
            handleSoldPlayer(data as SoldPlayerMessage);
            return;
        }

        // ⚫ Participant Disconnected
        if (data.participant_id && data.team_name && data.balance === undefined) {
            handleParticipantDisconnected(data as DisconnectedMessage);
            return;
        }

    }, []);


    const handleParticipantList = useCallback((list: any[]) => {
        const newMap = new Map<number, ParticipantState>();

        list.forEach((p) => {
            newMap.set(p.id, {
                participant_id: p.id,
                team_name: p.team_name,
                balance: p.balance,
                total_players_brought: p.total_players_brought,
                connected: true,
            });
        });

        setAuctionState((prev) => ({
            ...prev,
            participants: newMap,
        }));

        onMessage?.("Loaded participant list");
    }, [onMessage]);
    

    const handleNewPlayer = useCallback((data: CurrentPlayer) => {
        setAuctionState((prev) => ({
            ...prev,
            currentPlayer: data,
            currentBid: data.base_price,
            highestBidder: null,
            auctionStatus: "in_progress" as AuctionStatus,
        }));
        startTimer(30);
    }, []);

    const handleBidUpdate = useCallback((data: BidUpdateMessage) => {
        setAuctionState((prev) => ({
            ...prev,
            currentBid: data.bid_amount,
            highestBidder: data.team,
        }));
        startTimer(30);
    }, []);

    const handleSoldPlayer = useCallback(
        (data: SoldPlayerMessage) => {
            setAuctionState((prev) => {
                const newParticipants = new Map(prev.participants);
                const participant = Array.from(newParticipants.values()).find(
                    (p) => p.team_name === data.team_name
                );

                if (participant) {
                    newParticipants.set(participant.participant_id, {
                        ...participant,
                        balance: data.remaining_balance,
                        total_players_brought: participant.total_players_brought + 1,
                    });
                }

                const soldPlayer = {
                    player_id: prev.currentPlayer?.id || 0,
                    player_name: prev.currentPlayer?.name || "Unknown",
                    role: prev.currentPlayer?.role || "Unknown",
                    brought_price: data.sold_price,
                    team_name: data.team_name,
                };

                const myBalance = data.team_name === teamName ? data.remaining_balance : prev.myBalance;

                return {
                    ...prev,
                    participants: newParticipants,
                    soldPlayers: [...prev.soldPlayers, soldPlayer],
                    currentPlayer: null,
                    currentBid: 0,
                    highestBidder: null,
                    myBalance,
                };
            });

            onMessage?.(`SOLD to ${data.team_name} for ₹${data.sold_price}Cr`);
            stopTimer();
        },
        [teamName, onMessage]
    );

    const handleParticipantDisconnected = useCallback(
        (data: DisconnectedMessage) => {
            setAuctionState((prev) => {
                const newParticipants = new Map(prev.participants);
                const participant = newParticipants.get(data.participant_id);
                if (participant) {
                    newParticipants.set(data.participant_id, { ...participant, connected: false });
                }
                return { ...prev, participants: newParticipants };
            });
            onMessage?.(`${data.team_name} disconnected`);
        },
        [onMessage]
    );

    const startTimer = useCallback((seconds: number) => {
        if (timerRef.current) clearInterval(timerRef.current);

        setAuctionState((prev) => ({ ...prev, timerRemaining: seconds }));

        timerRef.current = setInterval(() => {
            setAuctionState((prev) => {
                const newTime = Math.max(0, prev.timerRemaining - 1);
                if (newTime === 0 && timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                return { ...prev, timerRemaining: newTime };
            });
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setAuctionState((prev) => ({ ...prev, timerRemaining: 0 }));
    }, []);

    // 🆕 FETCH PARTICIPANTS AFTER CONNECTION
    const requestParticipantList = useCallback(() => {
        wsRef.current?.send("get_participants");
    }, []);

    useEffect(() => {
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) {
            onConnectionError?.("No authentication token found");
            return;
        }

        const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${participantId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setConnected(true);
            requestParticipantList();  // 🆕 load participants immediately
        };

        ws.onmessage = (event) => handleMessage(event.data);
        ws.onerror = () => onConnectionError?.("Connection error occurred");
        ws.onclose = () => setConnected(false);

        wsRef.current = ws;

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            ws.close();
        };
    }, [roomId, participantId]);

    const sendMessage = useCallback((msg: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(msg);
        }
    }, []);

    return {
        connected,
        auctionState,
        startAuction: () => sendMessage("start"),
        placeBid: () => sendMessage("bid"),
        endAuction: () => sendMessage("end"),
    };
};
