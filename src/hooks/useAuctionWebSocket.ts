import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "../constants";
import { apiClient } from "../services/api";
import type {
  AuctionState,
  CurrentPlayer,
  BidUpdateMessage,
  SoldPlayerMessage,
  DisconnectedMessage,
  ParticipantState,
  AuctionStatus,
  SoldPlayerOutput,
  UnSoldPlayerOutput,
} from "../types";

interface UseAuctionWebSocketProps {
  roomId: string;
  participantId: number;
  teamName: string;
  onConnectionError?: (error: string) => void;
  onMessage?: (message: string) => void;
  enabled?: boolean;
}

export const useAuctionWebSocket = ({
  roomId,
  participantId,
  teamName,
  onConnectionError,
  onMessage,
  enabled = true,
}: UseAuctionWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // For WebRTC / audio signaling
  const signalHandlersRef = useRef(new Set<(message: any) => boolean>());

  const [connected, setConnected] = useState(false);

  const [auctionState, setAuctionState] = useState<AuctionState>({
    participants: new Map(),
    currentPlayer: null,
    previousPlayer: null,
    currentBid: 0,
    highestBidder: null,
    soldPlayers: {
      page1: [],
      page2: [],
      currentPage: 1,
      loading: false,
    },
    unsoldPlayers: {
      page1: [],
      page2: [],
      currentPage: 1,
      loading: false,
    },
    timerRemaining: 0,
    myBalance: 100,
    myTeamName: teamName,
    myParticipantId: participantId,
    auctionStatus: "pending",
  });

  // ---------- Helpers ----------

  const isJsonMessage = useCallback((data: string): boolean => {
    const trimmed = data.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return false;
    }
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setAuctionState((prev) => ({ ...prev, timerRemaining: 0 }));
  }, []);

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

  // ---------- Auction participants ----------

  const handleAuctionParticipant = useCallback(
    (data: any) => {
      console.log("⚙️ handleAuctionParticipant() called with:", data);

      setAuctionState((prev) => {
        const newParticipants = new Map<number, ParticipantState>(
          prev.participants,
        );

        newParticipants.set(data.id, {
          participant_id: data.id,
          team_name: data.team_name,
          balance: data.balance,
          total_players_brought: data.total_players_brought,
          connected: true,
        });

        const myBalance =
          data.id === participantId ? data.balance : prev.myBalance;

        const nextState = {
          ...prev,
          participants: newParticipants,
          myBalance,
        };

        console.log(
          "👥 participants after update:",
          Array.from(newParticipants.values()),
        );
        return nextState;
      });

      onMessage?.(`${data.team_name} joined / updated`);
      console.log(`🟢 Participant processed: ${data.team_name} (id=${data.id})`);
    },
    [participantId, onMessage],
  );

  const handleParticipantList = useCallback(
    (list: any[]) => {
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
    },
    [onMessage],
  );

  // ---------- String messages ----------

  const handleStringMessage = useCallback(
    (data: string) => {
      if (data === "UnSold") {
        onMessage?.("Player UNSOLD!");
        setAuctionState((prev) => {
          const playerToUse = prev.previousPlayer || prev.currentPlayer;

          if (!playerToUse) {
            return {
              ...prev,
              currentPlayer: null,
              currentBid: 0,
              highestBidder: null,
            };
          }

          const unsoldPlayer: UnSoldPlayerOutput = {
            player_id: playerToUse.id,
            player_name: playerToUse.name,
            role: playerToUse.role || "Unknown",
            base_price: playerToUse.base_price,
          };

          const newPage1 = [unsoldPlayer, ...prev.unsoldPlayers.page1];
          if (newPage1.length > 10) {
            newPage1.pop();
          }

          return {
            ...prev,
            unsoldPlayers: {
              ...prev.unsoldPlayers,
              page1: newPage1,
            },
            currentPlayer: null,
            previousPlayer: null,
            currentBid: 0,
            highestBidder: null,
          };
        });
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
      } else if (
        data.includes("Auction was Paused") ||
        data === "Auction was Paused"
      ) {
        onMessage?.(data);
        setAuctionState((prev) => ({
          ...prev,
          auctionStatus: "stopped",
          currentPlayer: null,
          currentBid: 0,
          highestBidder: null,
          timerRemaining: 0,
        }));
        stopTimer();
      } else {
        onMessage?.(data);
      }
    },
    [onMessage, stopTimer],
  );

  // ---------- Auction JSON handlers ----------

  const handleNewPlayer = useCallback(
    (data: CurrentPlayer) => {
      setAuctionState((prev) => ({
        ...prev,
        previousPlayer: prev.currentPlayer,
        currentPlayer: data,
        currentBid: data.base_price,
        highestBidder: null,
        auctionStatus: "in_progress" as AuctionStatus,
      }));
      startTimer(20);
    },
    [startTimer],
  );

  const handleBidUpdate = useCallback(
    (data: BidUpdateMessage) => {
      setAuctionState((prev) => ({
        ...prev,
        currentBid: data.bid_amount,
        highestBidder: data.team,
      }));
      startTimer(20);
    },
    [startTimer],
  );

  const handleSoldPlayer = useCallback(
    (data: SoldPlayerMessage) => {
      setAuctionState((prev) => {
        const newParticipants = new Map(prev.participants);
        const participant = Array.from(newParticipants.values()).find(
          (p) => p.team_name === data.team_name,
        );

        if (participant) {
          newParticipants.set(participant.participant_id, {
            ...participant,
            balance: data.remaining_balance,
            total_players_brought: participant.total_players_brought + 1,
          });
        }

        const playerToUse = prev.previousPlayer || prev.currentPlayer;

        if (!playerToUse) {
          return {
            ...prev,
            participants: newParticipants,
            currentPlayer: null,
            previousPlayer: null,
            currentBid: 0,
            highestBidder: null,
            myBalance:
              data.team_name === teamName
                ? data.remaining_balance
                : prev.myBalance,
          };
        }

        const soldPlayer: SoldPlayerOutput = {
          player_id: playerToUse.id,
          player_name: playerToUse.name,
          role: playerToUse.role || "Unknown",
          bought_price: data.sold_price,
          team_name: data.team_name,
        };

        const newPage1 = [soldPlayer, ...prev.soldPlayers.page1];
        if (newPage1.length > 10) {
          newPage1.pop();
        }

        const myBalance =
          data.team_name === teamName
            ? data.remaining_balance
            : prev.myBalance;

        return {
          ...prev,
          participants: newParticipants,
          soldPlayers: {
            ...prev.soldPlayers,
            page1: newPage1,
          },
          currentPlayer: null,
          previousPlayer: null,
          currentBid: 0,
          highestBidder: null,
          myBalance,
        };
      });

      onMessage?.(`SOLD to ${data.team_name} for ₹${data.sold_price}Cr`);
      stopTimer();
    },
    [teamName, onMessage, stopTimer],
  );

  const handleParticipantDisconnected = useCallback(
    (data: DisconnectedMessage) => {
      setAuctionState((prev) => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(data.participant_id);
        if (participant) {
          newParticipants.set(data.participant_id, {
            ...participant,
            connected: false,
          });
        }
        return { ...prev, participants: newParticipants };
      });
      onMessage?.(`${data.team_name} disconnected`);
    },
    [onMessage],
  );

  // ---------- JSON router (incl. signaling) ----------

  const handleJsonMessage = useCallback(
    (data: any) => {
      // 1) Give WebRTC / audio signaling handlers first chance
      if (
        data &&
        typeof data === "object" &&
        ["offer", "answer", "ice-candidate"].includes(data.type)
      ) {
        let handled = false;
        signalHandlersRef.current.forEach((handler) => {
          if (!handled) {
            try {
              handled = handler(data) || handled;
            } catch (e) {
              console.warn("signal handler threw", e);
            }
          }
        });

        if (handled) return;
      }

      console.log("🔍 JSON message received:", data);

      // 2) Auction-specific JSON

      // AuctionParticipant (single)
      if (
        data &&
        typeof data === "object" &&
        "id" in data &&
        "team_name" in data &&
        "balance" in data &&
        "total_players_brought" in data
      ) {
        console.log("📌 Detected AuctionParticipant:", data);
        handleAuctionParticipant(data);
        return;
      }

      // Current Player
      if (data && data.id && data.name && typeof data.base_price === "number") {
        handleNewPlayer(data as CurrentPlayer);
        return;
      }

      // Bid Update
      if (data && data.bid_amount && data.team) {
        handleBidUpdate(data as BidUpdateMessage);
        return;
      }

      // Sold Player
      if (
        data &&
        data.team_name &&
        typeof data.sold_price === "number" &&
        data.remaining_balance !== undefined
      ) {
        handleSoldPlayer(data as SoldPlayerMessage);
        return;
      }

      // Participant Disconnected
      if (
        data &&
        data.participant_id &&
        data.team_name &&
        data.balance === undefined
      ) {
        handleParticipantDisconnected(data as DisconnectedMessage);
        return;
      }

      console.log("⚠️ Unhandled JSON message:", data);
    },
    [
      handleAuctionParticipant,
      handleNewPlayer,
      handleBidUpdate,
      handleSoldPlayer,
      handleParticipantDisconnected,
    ],
  );

  const handleMessage = useCallback(
    (data: string) => {
      if (isJsonMessage(data)) {
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed) && parsed.length && parsed[0].id !== undefined) {
          handleParticipantList(parsed);
          return;
        }

        handleJsonMessage(parsed);
      } else {
        handleStringMessage(data);
      }
    },
    [isJsonMessage, handleJsonMessage, handleParticipantList, handleStringMessage],
  );

  // ---------- Initial sold/unsold players ----------

  const fetchInitialPlayers = useCallback(async () => {
    try {
      setAuctionState((prev) => ({
        ...prev,
        soldPlayers: { ...prev.soldPlayers, loading: true },
        unsoldPlayers: { ...prev.unsoldPlayers, loading: true },
      }));

      const [soldPlayers, unsoldPlayers] = await Promise.all([
        apiClient.getSoldPlayers(roomId, 1, 10),
        apiClient.getUnsoldPlayers(roomId, 1, 10),
      ]);

      setAuctionState((prev) => ({
        ...prev,
        soldPlayers: {
          ...prev.soldPlayers,
          page1: soldPlayers,
          loading: false,
        },
        unsoldPlayers: {
          ...prev.unsoldPlayers,
          page1: unsoldPlayers,
          loading: false,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch initial players:", error);
      setAuctionState((prev) => ({
        ...prev,
        soldPlayers: { ...prev.soldPlayers, loading: false },
        unsoldPlayers: { ...prev.unsoldPlayers, loading: false },
      }));
    }
  }, [roomId]);

  // ---------- WebSocket lifecycle ----------

  useEffect(() => {
    if (!enabled || participantId <= 0 || !teamName) {
      return;
    }

    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      onConnectionError?.("No authentication token found");
      return;
    }

    const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${participantId}`;
    console.log("🔌 Opening WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnected(true);
      fetchInitialPlayers();
    };

    ws.onmessage = (event) => {
      console.log("WS RECEIVED:", event.data);
      handleMessage(event.data);
    };

    ws.onerror = (event) => {
      console.error("❌ WebSocket error", event);
      onConnectionError?.("Connection error occurred");
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
      setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, participantId, teamName, enabled, fetchInitialPlayers]);

  // ---------- Outgoing messages ----------

  const sendMessage = useCallback((msg: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WS SENDING (text):", msg);
      wsRef.current.send(msg);
    } else {
      console.warn("WS not open, cannot send text:", msg);
    }
  }, []);

  const sendJsonMessage = useCallback((payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WS SENDING (json):", payload);
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("WS not open, cannot send JSON:", payload);
    }
  }, []);

  const registerSignalHandler = useCallback(
    (handler: (message: any) => boolean) => {
      signalHandlersRef.current.add(handler);
      return () => {
        signalHandlersRef.current.delete(handler);
      };
    },
    [],
  );

  // ---------- Pagination helpers ----------

  const changeSoldPage = useCallback(
    async (page: number) => {
      if (page === 1) {
        setAuctionState((prev) => ({
          ...prev,
          soldPlayers: { ...prev.soldPlayers, currentPage: 1 },
        }));
        return;
      }

      if (page === 2) {
        setAuctionState((prev) => ({
          ...prev,
          soldPlayers: { ...prev.soldPlayers, loading: true },
        }));

        try {
          const players = await apiClient.getSoldPlayers(roomId, 2, 10);
          setAuctionState((prev) => ({
            ...prev,
            soldPlayers: {
              ...prev.soldPlayers,
              page2: players,
              currentPage: 2,
              loading: false,
            },
          }));
        } catch (error) {
          console.error("Failed to fetch sold players page 2:", error);
          setAuctionState((prev) => ({
            ...prev,
            soldPlayers: { ...prev.soldPlayers, loading: false },
          }));
        }
      }
    },
    [roomId],
  );

  const changeUnsoldPage = useCallback(
    async (page: number) => {
      if (page === 1) {
        setAuctionState((prev) => ({
          ...prev,
          unsoldPlayers: { ...prev.unsoldPlayers, currentPage: 1 },
        }));
        return;
      }

      if (page === 2) {
        setAuctionState((prev) => ({
          ...prev,
          unsoldPlayers: { ...prev.unsoldPlayers, loading: true },
        }));

        try {
          const players = await apiClient.getUnsoldPlayers(roomId, 2, 10);
          setAuctionState((prev) => ({
            ...prev,
            unsoldPlayers: {
              ...prev.unsoldPlayers,
              page2: players,
              currentPage: 2,
              loading: false,
            },
          }));
        } catch (error) {
          console.error("Failed to fetch unsold players page 2:", error);
          setAuctionState((prev) => ({
            ...prev,
            unsoldPlayers: { ...prev.unsoldPlayers, loading: false },
          }));
        }
      }
    },
    [roomId],
  );

  // ---------- RTM helpers ----------

  const sendRTMAmount = useCallback(
    (amount: number) => {
      sendMessage(`rtm-${amount.toFixed(2)}`);
    },
    [sendMessage],
  );

  const sendRTMAccept = useCallback(() => {
    sendMessage("rtm-accept");
  }, [sendMessage]);

  const sendRTMCancel = useCallback(() => {
    sendMessage("rtm-cancel");
  }, [sendMessage]);

  // ---------- Public API ----------

  return {
    connected,
    auctionState,
    startAuction: () => sendMessage("start"),
    placeBid: () => sendMessage("bid"),
    pauseAuction: () => sendMessage("pause"),
    endAuction: () => sendMessage("end"),
    changeSoldPage,
    changeUnsoldPage,
    sendRTMAmount,
    sendRTMAccept,
    sendRTMCancel,
    sendJsonMessage,       // used by useAuctionAudio
    registerSignalHandler, // used by useAuctionAudio
  };
};
