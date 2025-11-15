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

  const isJsonMessage = useCallback((data: string): boolean => {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleMessage = useCallback((data: string) => {
    if (isJsonMessage(data)) {
      const parsed = JSON.parse(data);
      handleJsonMessage(parsed);
    } else {
      handleStringMessage(data);
    }
  }, [isJsonMessage]);

  const handleStringMessage = useCallback((data: string) => {
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
  }, [onMessage]);

  const handleJsonMessage = useCallback((data: any) => {
    if (data.participant_id && data.team_name && data.balance !== undefined && data.total_players_brought === undefined) {
      handleNewJoiner(data as NewJoinerMessage);
    } else if (data.id && data.team && typeof data.balance === "number" && data.total_players_brought !== undefined) {
      handleOldParticipant(data as OldParticipantMessage);
    } else if (data.id && data.name && typeof data.base_price === "number") {
      handleNewPlayer(data as CurrentPlayer);
    } else if (data.bid_amount && data.team) {
      handleBidUpdate(data as BidUpdateMessage);
    } else if (data.team_name && typeof data.sold_price === "number" && data.remaining_balance !== undefined) {
      handleSoldPlayer(data as SoldPlayerMessage);
    } else if (data.participant_id && data.team_name && data.balance === undefined) {
      handleParticipantDisconnected(data as DisconnectedMessage);
    }
  }, []);

  const handleNewJoiner = useCallback((data: NewJoinerMessage) => {
    setAuctionState((prev) => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(data.participant_id, {
        participant_id: data.participant_id,
        team_name: data.team_name,
        balance: data.balance,
        total_players_brought: 0,
        connected: true,
      });
      return { ...prev, participants: newParticipants };
    });
    onMessage?.(`${data.team_name} joined the room`);
  }, [onMessage]);

  const handleOldParticipant = useCallback((data: OldParticipantMessage) => {
    setAuctionState((prev) => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(data.id, {
        participant_id: data.id,
        team_name: data.team,
        balance: data.balance,
        total_players_brought: data.total_players_brought,
        connected: true,
      });

      if (data.id === participantId) {
        return {
          ...prev,
          participants: newParticipants,
          myBalance: data.balance,
        };
      }

      return { ...prev, participants: newParticipants };
    });
  }, [participantId]);

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

  const handleSoldPlayer = useCallback((data: SoldPlayerMessage) => {
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
  }, [teamName, onMessage]);

  const handleParticipantDisconnected = useCallback((data: DisconnectedMessage) => {
    setAuctionState((prev) => {
      const newParticipants = new Map(prev.participants);
      const participant = newParticipants.get(data.participant_id);
      if (participant) {
        newParticipants.set(data.participant_id, { ...participant, connected: false });
      }
      return { ...prev, participants: newParticipants };
    });
    onMessage?.(`${data.team_name} disconnected`);
  }, [onMessage]);

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

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      onConnectionError?.("No authentication token found");
      return;
    }
    console.log(`the url was ${WS_BASE_URL}/ws/${roomId}/${participantId}`)
    const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${participantId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        handleMessage(event.data);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    ws.onerror = () => {
      onConnectionError?.("Connection error occurred");
    };

    ws.onclose = (event) => {
        console.warn(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ws.close();
    };
  }, [roomId, participantId, onConnectionError, handleMessage]);

  const sendMessage = useCallback((msg: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    }
  }, []);

  const startAuction = useCallback(() => sendMessage("start"), [sendMessage]);
  const placeBid = useCallback(() => sendMessage("bid"), [sendMessage]);
  const endAuction = useCallback(() => sendMessage("end"), [sendMessage]);

  return {
    connected,
    auctionState,
    startAuction,
    placeBid,
    endAuction,
  };
};
