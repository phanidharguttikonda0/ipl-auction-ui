// src/pages/AuctionRoomPage.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, Gavel, Copy, Users, ShieldAlert, MessageSquare } from "lucide-react";
import { useAuctionWebSocket } from "../hooks/useAuctionWebSocket";
import { useAuctionAudio } from "../hooks/useAuctionAudio";
import { PlayerCard } from "../components/auction/PlayerCard";
import { ParticipantsList } from "../components/auction/ParticipantsList";
import { ChatBox } from "../components/auction/ChatBox";
import { AuctionControls } from "../components/auction/AuctionControls";
import { SoldUnsoldList } from "../components/auction/SoldUnsoldList";
import { Toast, type ToastType } from "../components/Toast";
import { TeamDetailsModal } from "../components/TeamDetailsModal.tsx";
import { apiClient } from "../services/api";
import { PoolsList } from "../components/auction/PoolsList";
import { PoolPlayersList } from "../components/auction/PoolPlayersList";
import { POOL_NAMES } from "../constants";
import type { PoolPlayer } from "../types";

const RTM_RESPONSE_TIMEOUT = 17;

interface AuctionRoomPageProps {
  roomId: string;
}

interface LocationState {
  participantId: number;
  teamName: string;
}

export const AuctionRoomPage = ({ roomId }: AuctionRoomPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [copied, setCopied] = useState(false);

  // Pool states
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [poolPlayers, setPoolPlayers] = useState<PoolPlayer[]>([]);
  const [isPoolLoading, setIsPoolLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000); // hide in 1 sec
  };

  const [participantId, setParticipantId] = useState<number | null>(
    state?.participantId ?? null
  );
  const [teamName, setTeamName] = useState<string | null>(
    state?.teamName ?? null
  );
  const [loading, setLoading] = useState(!state);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleSelectPool = useCallback(async (poolId: number) => {
    setSelectedPoolId(poolId);
    setIsPoolLoading(true);
    try {
      const players = await apiClient.getPoolPlayers(poolId);
      setPoolPlayers(players);
    } catch (err) {
      console.error("Failed to fetch pool players:", err);
      setToast({ message: "Failed to fetch pool players", type: "error" });
    } finally {
      setIsPoolLoading(false);
    }
  }, []);



  // If state is missing, try to fetch participant info from API
  useEffect(() => {
    if (!state && roomId) {
      const fetchParticipantInfo = async () => {
        try {
          setLoading(true);
          // Try to get participant info - you may need to adjust this based on your API
          const result = await apiClient.joinRoomGetTeams(roomId);
          if (result && typeof result === "object" && "participant_id" in result) {
            setParticipantId(result.participant_id as number);
            setTeamName(result.team_name as string);
          } else {
            // If not a participant, redirect to home
            navigate("/home", { replace: true });
          }
        } catch (err) {
          console.error("Failed to fetch participant info:", err);
          navigate("/home", { replace: true });
        } finally {
          setLoading(false);
        }
      };
      fetchParticipantInfo();
    }
  }, [state, roomId, navigate]);

  const handleBack = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  // RTM states
  const [showRTMDialog, setShowRTMDialog] = useState(false);
  const [showRTMAmountInput, setShowRTMAmountInput] = useState(false);
  const [rtmAmountInput, setRtmAmountInput] = useState("");
  const [showRTMAcceptDialog, setShowRTMAcceptDialog] = useState(false);
  const [rtmOfferAmount, setRtmOfferAmount] = useState<number | null>(null);
  const [rtmResponseSecondsLeft, setRtmResponseSecondsLeft] = useState(0);
  const [isRtmTimerActive, setIsRtmTimerActive] = useState(false);
  const [rtmAcceptSecondsLeft, setRtmAcceptSecondsLeft] = useState(0);
  const [isRtmAcceptTimerActive, setIsRtmAcceptTimerActive] = useState(false);
  const [hasSkippedCurrentPlayer, setHasSkippedCurrentPlayer] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Skip pool confirmation states
  const [showSkipPoolConfirm, setShowSkipPoolConfirm] = useState(false);
  const [skipPoolConfirmChecked, setSkipPoolConfirmChecked] = useState(false);



  // Refs to handle circular dependencies and stale closures
  const hasSkippedRef = useRef(hasSkippedCurrentPlayer);
  const handleSkipRef = useRef<(reason?: string) => void>(() => { });

  useEffect(() => {
    hasSkippedRef.current = hasSkippedCurrentPlayer;
  }, [hasSkippedCurrentPlayer]);

  const handleMessage = useCallback((message: string) => {
    // Handle "Use RTM" message
    if (message === "Use RTM" || message.includes("Use RTM")) {
      setShowRTMDialog(true);
      setShowRTMAmountInput(false);
      setRtmAmountInput("");
      setRtmResponseSecondsLeft(RTM_RESPONSE_TIMEOUT);
      setIsRtmTimerActive(true);
      return;
    }

    // Handle "rtm-amount-{amount}" message
    if (message.startsWith("rtm-amount-")) {
      const amountStr = message.replace("rtm-amount-", "").trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        setRtmOfferAmount(amount);
        setShowRTMAcceptDialog(true);
        setRtmAcceptSecondsLeft(RTM_RESPONSE_TIMEOUT);
        setIsRtmAcceptTimerActive(true);
      }
      return;
    }

    // Handle other messages
    if (message === "Bid not allowed, Check strict mode rules") {
      setToast({ message, type: "error" });
      if (!hasSkippedRef.current) {
        handleSkipRef.current("strict_mode stage wise bidding");
      }
      return;
    }

    if (message.toLowerCase().includes("sold")) {
      setToast({ message, type: "success" });
    } else if (message.toLowerCase().includes("unsold")) {
      setToast({ message, type: "warning" });
    } else if (message.toLowerCase().includes("error") || message.toLowerCase().includes("fail")) {
      setToast({ message, type: "error" });
    } else {
      setToast({ message, type: "info" });
    }
  }, []);

  // Don't initialize WebSocket until we have participant info
  const shouldConnect = participantId !== null && teamName !== null && !loading;
  const {
    connected,
    auctionState,
    startAuction,
    placeBid,
    pauseAuction,
    endAuction,
    changeSoldPage,
    changeUnsoldPage,
    sendRTMAmount,
    sendRTMAccept,
    sendRTMCancel,
    sendInstantRTMCancel,
    sendSkip,
    sendJsonMessage,
    registerSignalHandler,
    sendTextMessage, // NEW
    sendChatMessage,
    timerRemaining, // the remaining time for the current player to bid 
    sendGetIsSkippedPool,
  } = useAuctionWebSocket({
    roomId,
    participantId: participantId ?? 0,
    teamName: teamName ?? "",
    onConnectionError: (error) => setToast({ message: error, type: "error" }),
    onMessage: handleMessage,
    enabled: shouldConnect,
  });

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevChatLengthRef = useRef(0);

  // Manage unread messages
  useEffect(() => {
    const currentLength = auctionState.chatMessages.length;
    if (currentLength > prevChatLengthRef.current) {
      if (!isChatOpen) {
        setHasUnreadMessages(true);
      }
    }
    prevChatLengthRef.current = currentLength;
  }, [auctionState.chatMessages.length, isChatOpen]);

  // Clear unread messages when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setHasUnreadMessages(false);
    }
  }, [isChatOpen]);

  const audioControls = useAuctionAudio({
    participantId: participantId ?? 0,
    participants: auctionState.participants,
    sendSignalMessage: sendJsonMessage,
    sendTextMessage, // pass text sender so audio can send "mute"/"unmute"
    registerSignalHandler,
    connected,
    enabled: shouldConnect,
  });

  useEffect(() => {
    setHasSkippedCurrentPlayer(false);
  }, [auctionState.currentPlayer?.id]);

  // Send "get-is-skipped-pool" message when WebSocket is connected
  useEffect(() => {
    if (connected && sendTextMessage) {
      sendTextMessage("get-is-skipped-pool");
    }
  }, [connected, sendTextMessage]);
  // Reset pool skip state when pool number changes
  const prevPoolNoForSkipRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const currentPoolNo = auctionState.currentPlayer?.pool_no;
    if (currentPoolNo && currentPoolNo !== prevPoolNoForSkipRef.current) {
      prevPoolNoForSkipRef.current = currentPoolNo;
      // Request current pool skip status when pool changes
      sendGetIsSkippedPool();
    }
  }, [auctionState.currentPlayer?.pool_no, sendGetIsSkippedPool]);

  // Auto-select current pool when it changes (only once per pool change)
  const prevPoolNoRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentPoolNo = auctionState.currentPlayer?.pool_no;
    // Only auto-switch if we have a pool number and it's different from the last one we saw
    if (currentPoolNo && currentPoolNo !== prevPoolNoRef.current) {
      handleSelectPool(currentPoolNo);
      prevPoolNoRef.current = currentPoolNo;
    }
  }, [auctionState.currentPlayer?.pool_no, handleSelectPool]);

  useEffect(() => {
    if (!isRtmTimerActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRtmResponseSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRtmTimerActive(false);
          if (showRTMDialog || showRTMAmountInput) {
            setShowRTMDialog(false);
            setShowRTMAmountInput(false);
            setRtmAmountInput("");
            setToast({ message: "RTM response timed out", type: "info" });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRtmTimerActive, showRTMDialog, showRTMAmountInput]);

  // Handle RTM dialog "Yes" button
  const handleRTMConfirm = useCallback(() => {
    setShowRTMDialog(false);
    setShowRTMAmountInput(true);
  }, []);

  // Handle RTM amount submission
  const handleRTMAmountSubmit = useCallback(() => {
    const amount = parseFloat(rtmAmountInput);
    if (!isNaN(amount) && amount > 0) {
      sendRTMAmount(amount);
      setShowRTMAmountInput(false);
      setRtmAmountInput("");
      setIsRtmTimerActive(false);
      setToast({ message: `RTM amount of ₹${amount.toFixed(2)}Cr sent`, type: "info" });
    }
  }, [rtmAmountInput, sendRTMAmount]);

  useEffect(() => {
    if (!isRtmAcceptTimerActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRtmAcceptSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRtmAcceptTimerActive(false);
          if (showRTMAcceptDialog) {
            setShowRTMAcceptDialog(false);
            setRtmOfferAmount(null);
            setToast({ message: "RTM offer response timed out", type: "info" });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRtmAcceptTimerActive, showRTMAcceptDialog]);

  // Handle RTM accept
  const handleRTMAccept = useCallback(() => {
    sendRTMAccept();
    setShowRTMAcceptDialog(false);
    setRtmOfferAmount(null);
    setIsRtmTimerActive(false);
    setIsRtmAcceptTimerActive(false);
    setToast({ message: "RTM offer accepted", type: "success" });
  }, [sendRTMAccept]);

  // Handle RTM cancel/reject
  const handleRTMCancel = useCallback(() => {
    sendRTMCancel();
    setShowRTMAcceptDialog(false);
    setRtmOfferAmount(null);
    setIsRtmTimerActive(false);
    setIsRtmAcceptTimerActive(false);
    setToast({ message: "RTM offer cancelled", type: "info" });
  }, [sendRTMCancel]);

  const handleSkip = useCallback((reason?: string) => {
    if (hasSkippedCurrentPlayer) {
      return;
    }
    sendSkip(reason);
    setHasSkippedCurrentPlayer(true);
    setToast({ message: "You skipped this player", type: "info" });
  }, [hasSkippedCurrentPlayer, sendSkip]);

  // Handle SKIP POOL button - shows confirmation dialog
  const handleSkipPool = useCallback(() => {
    if (hasSkippedCurrentPlayer) {
      return;
    }

    // Check if this is the last pool (pool_no 12)
    if (auctionState.currentPlayer?.pool_no === 12) {
      setToast({
        message: "Cannot skip the last pool. Please use End Auction instead.",
        type: "warning"
      });
      return;
    }

    // Show confirmation dialog
    setShowSkipPoolConfirm(true);
  }, [hasSkippedCurrentPlayer, auctionState.currentPlayer?.pool_no]);

  // Handle skip pool confirmation - sends "skip-current-pool" message
  const handleSkipPoolConfirm = useCallback(() => {
    if (!skipPoolConfirmChecked) {
      setToast({ message: "Please confirm by checking the box", type: "warning" });
      return;
    }

    // Send ONLY "skip-current-pool" message, no additional skip message
    sendTextMessage("skip-current-pool");
    // Don't disable bid/skip buttons - user can still bid after voting
    setShowSkipPoolConfirm(false);
    setSkipPoolConfirmChecked(false);
    setToast({ message: "Your vote to skip this pool has been registered", type: "info" });
  }, [skipPoolConfirmChecked, sendTextMessage]);

  // Keep handleSkipRef updated
  useEffect(() => {
    handleSkipRef.current = handleSkip;
  }, [handleSkip]);

  // Auto-skip scenarios logic
  useEffect(() => {
    if (auctionState.auctionStatus !== "in_progress" || !auctionState.currentPlayer || hasSkippedCurrentPlayer) {
      return;
    }

    const myParticipant = auctionState.participants.get(participantId ?? 0);
    if (!myParticipant) return;

    // 1. Foreign player limit
    const foreignLimitReached = (myParticipant.foreign_players_brought ?? 0) >= 8;
    const isForeignPlayer = !auctionState.currentPlayer.is_indian;
    const shouldSkipForeign = foreignLimitReached && isForeignPlayer;

    // 2. Insufficient balance (Strict check: if balance < currentBid, you can't match/raise)
    const insufficientBalance = auctionState.myBalance < auctionState.currentBid;

    if (shouldSkipForeign) {
      handleSkip("foreign_limit");
    } else if (insufficientBalance) {
      handleSkip("insufficient balance");
    }
  }, [
    auctionState.auctionStatus,
    auctionState.currentPlayer,
    auctionState.myBalance,
    auctionState.currentBid,
    auctionState.participants,
    participantId,
    hasSkippedCurrentPlayer,
    handleSkip
  ]);

  if (loading || participantId === null || teamName === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Auction Room
                </h1>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition text-gray-300"
                    title="Copy Room ID"
                  >
                    <Copy size={16} />
                  </button>

                  <p className="text-sm text-gray-400">Room ID: {roomId}</p>

                  {auctionState.isStrictMode && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-900/30 border border-red-500/30 animate-pulse">
                      <ShieldAlert size={12} className="text-red-400" />
                      <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Strict Mode</span>
                    </div>
                  )}
                  {/* Copied message */}
                  {copied && (
                    <span className="text-green-400 text-xs ml-2 animate-fade-in">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${connected
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-red-500/20 border border-red-500/50"
                  }`}
              >
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      Disconnected
                    </span>
                  </>
                )}
              </div>

              {/* Chat Toggle (Mobile Only) */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 transition relative"
              >
                <MessageSquare className="w-5 h-5" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>

              <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-sm font-semibold text-blue-400">{teamName}</p>
              </div>
            </div>
          </div>
        </header>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={3000}
            onClose={() => setToast(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR (Sticky OK here) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              <ParticipantsList
                participants={auctionState.participants}
                myParticipantId={participantId}
                onSelectParticipant={setSelectedParticipant}
                audioControls={audioControls}
              />
              {/* Desktop Chat */}
              <div className="hidden lg:block h-[400px]">
                <ChatBox
                  messages={auctionState.chatMessages}
                  onSendMessage={sendChatMessage}
                  myTeamName={teamName}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* CENTER (Player card + Controls) — sticky removed */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
            {auctionState.currentPlayer ? (
              <PlayerCard
                player={auctionState.currentPlayer}
                currentBid={auctionState.currentBid}
                highestBidder={auctionState.highestBidder}
                timerRemaining={auctionState.timerRemaining}
              />
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                  <Gavel className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {auctionState.auctionStatus === "completed"
                    ? "Auction Completed"
                    : auctionState.auctionStatus === "ended_by_host"
                      ? "Auction was Ended by Host"
                      : auctionState.auctionStatus === "stopped"
                        ? auctionState.currentPlayer === null && auctionState.timerRemaining === 0
                          ? "Auction Paused"
                          : "Auction Paused"
                        : "Waiting to Start"}
                </h3>
                <p className="text-gray-400">
                  {auctionState.auctionStatus === "completed"
                    ? "Thank you for participating!"
                    : auctionState.auctionStatus === "ended_by_host"
                      ? "The host has ended the auction session."
                      : auctionState.auctionStatus === "stopped"
                        ? auctionState.currentPlayer === null && auctionState.timerRemaining === 0
                          ? "Auction is paused. Click Start to resume from the last player."
                          : "Need minimum 3 participants to continue"
                        : "Press Start Auction to begin"}
                </p>
              </div>
            )}

            <AuctionControls
              auctionStatus={auctionState.auctionStatus}
              participantCount={auctionState.participants.size}
              myBalance={auctionState.myBalance}
              currentBid={auctionState.currentBid}
              onStart={startAuction}
              onBid={placeBid}
              onSkip={handleSkip}
              onSkipPool={handleSkipPool}
              onPause={pauseAuction}
              onEnd={endAuction}
              timerRemaining={timerRemaining}
              disablePlaceBid={
                hasSkippedCurrentPlayer ||
                ((auctionState.participants.get(participantId ?? 0)?.foreign_players_brought ?? 0) >= 8 &&
                  !!auctionState.currentPlayer &&
                  !auctionState.currentPlayer.is_indian)
              }
              disableSkip={hasSkippedCurrentPlayer}
              isSkippedPool={auctionState.isPoolSkipped}
              currentPoolNo={auctionState.currentPlayer?.pool_no}
            />
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-3 order-3">
            <div className="sticky top-24 space-y-6">

              {/* Current Pool Banner */}
              {auctionState.currentPlayer?.pool_no && POOL_NAMES[auctionState.currentPlayer.pool_no] && (
                <div className="bg-gradient-to-r from-blue-900/80 to-blue-800/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-blue-500/30 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">Current Pool</h3>
                      <p className="text-white text-base font-bold truncate leading-tight">
                        {POOL_NAMES[auctionState.currentPlayer.pool_no]}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <PoolsList
                selectedPoolId={selectedPoolId}
                onSelectPool={handleSelectPool}
                currentAuctionPoolId={auctionState.currentPlayer?.pool_no}
              />

              {selectedPoolId && (
                <PoolPlayersList
                  players={poolPlayers}
                  loading={isPoolLoading}
                  poolName={POOL_NAMES[selectedPoolId]}
                />
              )}

              <SoldUnsoldList
                soldPlayers={auctionState.soldPlayers}
                unsoldPlayers={auctionState.unsoldPlayers}
                onChangeSoldPage={changeSoldPage}
                onChangeUnsoldPage={changeUnsoldPage}
              />
            </div>
          </div>
        </div>
      </div >

      {selectedParticipant && (
        <TeamDetailsModal
          participantId={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {/* RTM dialogs ... (unchanged, keep the same markup) */}
      {
        showRTMDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Use Right To Match (RTM)?</h3>
              <p className="text-gray-300 mb-6">
                You have the option to use RTM. Would you like to use it?
              </p>
              {isRtmTimerActive && (
                <p className="text-sm text-gray-400 mb-4">
                  Auto closing in {rtmResponseSecondsLeft}s
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    sendInstantRTMCancel();
                    setShowRTMDialog(false);
                    setIsRtmTimerActive(false);
                    setRtmResponseSecondsLeft(0);
                    setToast({ message: "RTM declined", type: "info" });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  No
                </button>
                <button
                  onClick={handleRTMConfirm}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showRTMAmountInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Enter RTM Amount</h3>
              <p className="text-gray-300 mb-4">
                Current bid: ₹{auctionState.currentBid.toFixed(2)}Cr
              </p>
              <p className="text-sm text-gray-400 mb-4">
                How much do you want to add to the current bid amount?
              </p>
              {isRtmTimerActive && (
                <p className="text-sm text-gray-400 mb-4">
                  Auto closing in {rtmResponseSecondsLeft}s
                </p>
              )}
              <input
                type="number"
                value={rtmAmountInput}
                onChange={(e) => setRtmAmountInput(e.target.value)}
                placeholder="Enter amount (e.g., 10.00)"
                step="0.01"
                min="0.01"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRTMAmountSubmit();
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRTMAmountInput(false);
                    setRtmAmountInput("");
                    setIsRtmTimerActive(false);
                    setRtmResponseSecondsLeft(0);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRTMAmountSubmit}
                  disabled={!rtmAmountInput || parseFloat(rtmAmountInput) <= 0 || isNaN(parseFloat(rtmAmountInput))}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${!rtmAmountInput || parseFloat(rtmAmountInput) <= 0 || isNaN(parseFloat(rtmAmountInput))
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showRTMAcceptDialog && rtmOfferAmount !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">RTM Offer Received</h3>
              <p className="text-gray-300 mb-4">
                You have received an RTM offer of <span className="text-green-400 font-bold">₹{rtmOfferAmount.toFixed(2)}Cr</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Do you want to accept this offer?
              </p>
              {isRtmAcceptTimerActive && (
                <p className="text-sm text-gray-400 mb-6">
                  Auto closing in {rtmAcceptSecondsLeft}s
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleRTMCancel}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRTMAccept}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Skip Pool Confirmation Dialog */}
      {
        showSkipPoolConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Skip Pool Vote</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to vote to skip the current pool?
              </p>
              <p className="text-sm text-yellow-400 mb-6">
                ⚠️ Your vote to skip pool {auctionState.currentPlayer?.pool_no} will be counted. The pool will only be skipped if all participants vote to skip.
              </p>

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={skipPoolConfirmChecked}
                  onChange={(e) => setSkipPoolConfirmChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I understand that my vote to skip this pool cannot be reverted
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSkipPoolConfirm(false);
                    setSkipPoolConfirmChecked(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSkipPoolConfirm}
                  disabled={!skipPoolConfirmChecked}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${skipPoolConfirmChecked
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Confirm Vote
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Chat Overlay */}
      {
        isChatOpen && (
          <ChatBox
            messages={auctionState.chatMessages}
            onSendMessage={sendChatMessage}
            myTeamName={teamName}
            isMobileOverlay={true}
            onClose={() => setIsChatOpen(false)}
          />
        )
      }
    </div >
  );
};
