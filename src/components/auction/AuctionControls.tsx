import { Play, Gavel, StopCircle } from "lucide-react";
import type { AuctionStatus } from "../../types";

interface AuctionControlsProps {
  auctionStatus: AuctionStatus;
  participantCount: number;
  myBalance: number;
  currentBid: number;
  onStart: () => void;
  onBid: () => void;
  onEnd: () => void;
}

export const AuctionControls = ({
  auctionStatus,
  participantCount,
  myBalance,
  currentBid,
  onStart,
  onBid,
  onEnd,
}: AuctionControlsProps) => {
  const canStart = participantCount >= 3 && auctionStatus === "pending";
  const canBid =
    auctionStatus === "in_progress" &&
    participantCount >= 3 &&
    myBalance >= currentBid;
  const isStopped = auctionStatus === "stopped";

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors space-y-4">
      <h2 className="text-lg font-bold text-white">Controls</h2>

      <div className="space-y-3">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            canStart
              ? "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/50"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Play className="w-5 h-5" />
          Start Auction
        </button>

        {!canStart && participantCount < 3 && auctionStatus === "pending" && (
          <p className="text-xs text-yellow-400 text-center">
            Waiting for minimum 3 participants... ({participantCount}/3)
          </p>
        )}

        <button
          onClick={onBid}
          disabled={!canBid}
          className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            canBid
              ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/50"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Gavel className="w-5 h-5" />
          Place Bid
        </button>

        {!canBid && myBalance < currentBid && auctionStatus === "in_progress" && (
          <p className="text-xs text-red-400 text-center">
            Insufficient balance to bid
          </p>
        )}

        {isStopped && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              Auction paused: Need minimum 3 participants
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={onEnd}
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
    </div>
  );
};
