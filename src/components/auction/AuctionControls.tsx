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
  onPause: () => void;
  onEnd: () => void;
  timerRemaining: number;
  disablePlaceBid: boolean;
  disableSkip: boolean;
}

export const AuctionControls = ({
  auctionStatus,
  participantCount,
  myBalance,
  currentBid,
  onStart,
  onBid,
  onSkip,
  onPause,
  onEnd,
  timerRemaining,
  disablePlaceBid,
  disableSkip,
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
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors space-y-4">
      <h2 className="text-lg font-bold text-white">Controls</h2>

      <div className="space-y-3">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canStart
            ? "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/50"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
        >
          <Play className="w-5 h-5" />
          {canResume ? "Resume Auction" : "Start Auction"}
        </button>

        {!canStart && participantCount < 3 && auctionStatus === "pending" && (
          <p className="text-xs text-yellow-400 text-center">
            Waiting for minimum 3 participants... ({participantCount}/3)
          </p>
        )}

        <button
          onClick={onBid}
          disabled={!canBid}
          className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canBid
            ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/50"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
        >
          <Gavel className="w-5 h-5" />
          Place Bid
        </button>

        <button
          onClick={() => onSkip()}
          disabled={!canSkip}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canSkip
            ? "bg-gray-100/10 hover:bg-gray-100/20 border border-gray-100/30 text-white"
            : "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-700"
            }`}
        >
          Skip
        </button>

        {!canBid && myBalance < currentBid && auctionStatus === "in_progress" && (
          <p className="text-xs text-red-400 text-center">
            Insufficient balance to bid
          </p>
        )}

        {/* Pause button - always visible, below Bid button, above End Auction */}
        <button
          onClick={onPause}
          disabled={!canPause}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${canPause
            ? "bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 text-yellow-400"
            : "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-700"
            }`}
        >
          <Pause className="w-5 h-5" />
          Pause Auction
        </button>

        {isStopped && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              Auction is paused. Click Resume to continue from the last player.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setShowEndConfirmation(true)}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <StopCircle className="w-5 h-5" />
            End Auction
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-2">Your Balance</p>
          <p className="text-2xl font-bold text-green-400">₹{myBalance.toFixed(2)}Cr</p>
        </div>
      </div>

      {/* End Auction Confirmation Dialog */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Confirm End Auction</h3>
              <button
                onClick={() => {
                  setShowEndConfirmation(false);
                  setEndConfirmText("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-4">
              Are you sure you want to end the auction? This action will disconnect all participants.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Type <span className="font-mono text-red-400 font-bold">"end"</span> in the box below to confirm:
            </p>
            <input
              type="text"
              value={endConfirmText}
              onChange={(e) => setEndConfirmText(e.target.value)}
              placeholder="Type 'end' to confirm"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all mb-4"
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
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Close
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
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${endConfirmText.toLowerCase() === "end"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
