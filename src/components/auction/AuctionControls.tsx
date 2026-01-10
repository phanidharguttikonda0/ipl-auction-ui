import { useState } from "react";
import { Play, Gavel, StopCircle, Pause, X } from "lucide-react";
import type { AuctionStatus } from "../../types";

interface AuctionControlsProps {
  auctionStatus: AuctionStatus;
  participantCount: number;
  myBalance: number;
  currentBid: number;
  onStart: () => void;
  onBid: () => void;
  onSkip: () => void;
  onSkipPool: () => void;
  onPause: () => void;
  onEnd: () => void;
  timerRemaining: number;
  disablePlaceBid: boolean;
  disableSkip: boolean;
  isSkippedPool?: boolean;
  currentPoolNo?: number;
}

export const AuctionControls = ({
  auctionStatus,
  participantCount,
  myBalance,
  currentBid,
  onStart,
  onBid,
  onSkip,
  onSkipPool,
  onPause,
  onEnd,
  timerRemaining,
  disablePlaceBid,
  disableSkip,
  isSkippedPool = false,
  currentPoolNo,
}: AuctionControlsProps) => {
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [endConfirmText, setEndConfirmText] = useState("");

  // Can start if pending and has enough participants, or can resume if paused
  const canStart = participantCount >= 3 && (auctionStatus === "pending" || auctionStatus === "stopped");
  const canResume = auctionStatus === "stopped";
  const canPause = auctionStatus === "in_progress";
  const canBidBase =
    auctionStatus === "in_progress" &&
    participantCount >= 3 &&
    myBalance >= currentBid &&
    timerRemaining > 0;
  const canBid = canBidBase && !disablePlaceBid;
  const canSkip = auctionStatus === "in_progress" && timerRemaining > 0 && !disableSkip;
  const isStopped = auctionStatus === "stopped";

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
      <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          Controls
        </h2>

        <div className="space-y-3">
          {/* Start/Resume Button */}
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${canStart
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
          >
            <Play className="w-6 h-6" fill="currentColor" />
            {canResume ? "Resume Auction" : "Start Auction"}
          </button>

          {!canStart && participantCount < 3 && auctionStatus === "pending" && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs text-yellow-400 text-center font-medium">
                Waiting for minimum 3 participants... ({participantCount}/3)
              </p>
            </div>
          )}

          {/* Place Bid Button - PRIMARY ACTION */}
          <div className="relative">
            {canBid && (
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur-md opacity-40 animate-shimmer"></div>
            )}
            <button
              onClick={onBid}
              disabled={!canBid}
              className={`relative w-full py-5 rounded-xl font-extrabold text-xl transition-all duration-200 flex items-center justify-center gap-3 ${canBid
                ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98]"
                : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                }`}
            >
              <Gavel className="w-7 h-7" />
              Place Bid
            </button>
          </div>

          {/* Skip Player Button */}
          <button
            onClick={() => onSkip()}
            disabled={!canSkip}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canSkip
              ? "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30 border-2 border-orange-500/40 hover:border-orange-400/60 text-orange-300 hover:text-orange-200 hover:scale-[1.02]"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-700"
              }`}
          >
            <X className="w-5 h-5" />
            Skip Player
          </button>

          {/* SKIP POOL button */}
          {!isSkippedPool && (
            <button
              onClick={() => onSkipPool()}
              disabled={!canSkip || currentPoolNo === 12}
              title={currentPoolNo === 12 ? "Cannot skip the last pool. Please use End Auction instead." : "Vote to skip this pool"}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canSkip && currentPoolNo !== 12
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-500/40 hover:border-purple-400/60 text-purple-300 hover:text-purple-200 hover:scale-[1.02]"
                : "bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-700"
                }`}
            >
              <span className="text-sm uppercase tracking-wider">🗳️ Vote: Skip Pool</span>
            </button>
          )}

          {currentPoolNo === 12 && !isSkippedPool && (
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400 text-center font-medium">
                Last pool - use End Auction instead
              </p>
            </div>
          )}

          {!canBid && myBalance < currentBid && auctionStatus === "in_progress" && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-xs text-red-400 text-center font-medium">
                ⚠️ Insufficient balance to bid
              </p>
            </div>
          )}

          {/* Pause Button */}
          <button
            onClick={onPause}
            disabled={!canPause}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canPause
              ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border border-gray-500/50 text-white hover:scale-[1.02]"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-700"
              }`}
          >
            <Pause className="w-5 h-5" />
            Pause Auction
          </button>

          {isStopped && (
            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/40 rounded-xl">
              <p className="text-sm text-yellow-300 text-center font-medium">
                ⏸️ Auction is paused. Click Resume to continue from the last player.
              </p>
            </div>
          )}

          {/* End Auction Button */}
          <div className="pt-4 border-t-2 border-gray-700/50">
            <button
              onClick={() => setShowEndConfirmation(true)}
              className="w-full py-3 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 border-2 border-red-500/40 hover:border-red-400/60 text-red-400 hover:text-red-300 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <StopCircle className="w-5 h-5" />
              End Auction
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="pt-6 border-t-2 border-gray-700/50 mt-6">
          <div className="relative group/balance">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-20 group-hover/balance:opacity-30 transition-opacity blur"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-2 border-green-500/20 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Your Balance</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ₹{myBalance.toFixed(2)}Cr
              </p>
            </div>
          </div>
        </div>

        {/* End Auction Confirmation Dialog */}
        {showEndConfirmation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="relative group/modal">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    Confirm End Auction
                  </h3>
                  <button
                    onClick={() => {
                      setShowEndConfirmation(false);
                      setEndConfirmText("");
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">
                    Are you sure you want to end the auction? This action will disconnect all participants.
                  </p>
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">
                      Type <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded text-red-300 font-bold">"end"</span> below to confirm:
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={endConfirmText}
                  onChange={(e) => setEndConfirmText(e.target.value)}
                  placeholder="Type 'end' to confirm"
                  className="w-full px-4 py-3.5 bg-gray-900/70 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all mb-6 font-medium"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && endConfirmText.toLowerCase() === "end") {
                      onEnd();
                      setShowEndConfirmation(false);
                      setEndConfirmText("");
                    }
                  }}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEndConfirmation(false);
                      setEndConfirmText("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-all duration-200 font-semibold border border-gray-600 hover:border-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (endConfirmText.toLowerCase() === "end") {
                        onEnd();
                        setShowEndConfirmation(false);
                        setEndConfirmText("");
                      }
                    }}
                    disabled={endConfirmText.toLowerCase() !== "end"}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${endConfirmText.toLowerCase() === "end"
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg hover:shadow-red-500/50 hover:scale-[1.02]"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    Confirm End
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
