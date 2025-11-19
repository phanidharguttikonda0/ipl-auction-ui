import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, AlertCircle, Gavel, Copy } from "lucide-react";
import { useAuctionWebSocket } from "../hooks/useAuctionWebSocket";
import { PlayerCard } from "../components/auction/PlayerCard";
import { ParticipantsList } from "../components/auction/ParticipantsList";
import { AuctionControls } from "../components/auction/AuctionControls";
import { SoldUnsoldList } from "../components/auction/SoldUnsoldList";
import { Toast, type ToastType } from "../components/Toast";
import { TeamDetailsModal } from "../components/TeamDetailsModal.tsx";
import { apiClient } from "../services/api";

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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  
  // RTM states
  const [showRTMDialog, setShowRTMDialog] = useState(false);
  const [showRTMAmountInput, setShowRTMAmountInput] = useState(false);
  const [rtmAmountInput, setRtmAmountInput] = useState("");
  const [showRTMAcceptDialog, setShowRTMAcceptDialog] = useState(false);
  const [rtmOfferAmount, setRtmOfferAmount] = useState<number | null>(null);

  const handleMessage = useCallback((message: string) => {
    // Handle "Use RTM" message
    if (message === "Use RTM" || message.includes("Use RTM")) {
      setShowRTMDialog(true);
      return;
    }

    // Handle "rtm-amount-{amount}" message
    if (message.startsWith("rtm-amount-")) {
      const amountStr = message.replace("rtm-amount-", "").trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        setRtmOfferAmount(amount);
        setShowRTMAcceptDialog(true);
      }
      return;
    }

    // Handle other messages
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
  const { connected, auctionState, startAuction, placeBid, pauseAuction, endAuction, changeSoldPage, changeUnsoldPage, sendRTMAmount, sendRTMAccept, sendRTMCancel } =
    useAuctionWebSocket({
      roomId,
      participantId: participantId ?? 0,
      teamName: teamName ?? "",
      onConnectionError: (error) => setToast({ message: error, type: "error" }),
      onMessage: handleMessage,
      enabled: shouldConnect,
    });

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
      setToast({ message: `RTM amount of ₹${amount.toFixed(2)}Cr sent`, type: "info" });
    }
  }, [rtmAmountInput, sendRTMAmount]);

  // Handle RTM accept
  const handleRTMAccept = useCallback(() => {
    sendRTMAccept();
    setShowRTMAcceptDialog(false);
    setRtmOfferAmount(null);
    setToast({ message: "RTM offer accepted", type: "success" });
  }, [sendRTMAccept]);

  // Handle RTM cancel/reject
  const handleRTMCancel = useCallback(() => {
    sendRTMCancel();
    setShowRTMAcceptDialog(false);
    setRtmOfferAmount(null);
    setToast({ message: "RTM offer cancelled", type: "info" });
  }, [sendRTMCancel]);

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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  connected
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
                  <div className="sticky top-24">
                      <ParticipantsList
                          participants={auctionState.participants}
                          myParticipantId={participantId}
                          onSelectParticipant={setSelectedParticipant}
                      />
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
                                  : auctionState.auctionStatus === "stopped"
                                      ? auctionState.currentPlayer === null && auctionState.timerRemaining === 0
                                          ? "Auction Paused"
                                          : "Auction Paused"
                                      : "Waiting to Start"}
                          </h3>
                          <p className="text-gray-400">
                              {auctionState.auctionStatus === "completed"
                                  ? "Thank you for participating!"
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
                      onPause={pauseAuction}
                      onEnd={endAuction}
                  />

              </div>

              {/* RIGHT SIDEBAR */}
              <div className="lg:col-span-3 order-3">
                  <div className="sticky top-24">
                      <SoldUnsoldList
                          soldPlayers={auctionState.soldPlayers}
                          unsoldPlayers={auctionState.unsoldPlayers}
                          onChangeSoldPage={changeSoldPage}
                          onChangeUnsoldPage={changeUnsoldPage}
                      />
                  </div>
              </div>

          </div>

      </div>
        {selectedParticipant && (
            <TeamDetailsModal
                participantId={selectedParticipant}
                onClose={() => setSelectedParticipant(null)}
            />
        )}

        {/* RTM Use Dialog */}
        {showRTMDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Use Right To Match (RTM)?</h3>
              <p className="text-gray-300 mb-6">
                You have the option to use RTM. Would you like to use it?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRTMDialog(false);
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
        )}

        {/* RTM Amount Input Dialog */}
        {showRTMAmountInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Enter RTM Amount</h3>
              <p className="text-gray-300 mb-4">
                Current bid: ₹{auctionState.currentBid.toFixed(2)}Cr
              </p>
              <p className="text-sm text-gray-400 mb-4">
                How much do you want to add to the current bid amount?
              </p>
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
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRTMAmountSubmit}
                  disabled={!rtmAmountInput || parseFloat(rtmAmountInput) <= 0 || isNaN(parseFloat(rtmAmountInput))}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !rtmAmountInput || parseFloat(rtmAmountInput) <= 0 || isNaN(parseFloat(rtmAmountInput))
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RTM Accept/Reject Dialog */}
        {showRTMAcceptDialog && rtmOfferAmount !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">RTM Offer Received</h3>
              <p className="text-gray-300 mb-4">
                You have received an RTM offer of <span className="text-green-400 font-bold">₹{rtmOfferAmount.toFixed(2)}Cr</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Do you want to accept this offer?
              </p>
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
        )}
    </div>
  );
};
