import { User, Clock, TrendingUp } from "lucide-react";
import type { CurrentPlayer } from "../../types";

interface PlayerCardProps {
  player: CurrentPlayer;
  currentBid: number;
  highestBidder: string | null;
  timerRemaining: number;
}

export const PlayerCard = ({
  player,
  currentBid,
  highestBidder,
  timerRemaining,
}: PlayerCardProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500/50 rounded-2xl p-8 shadow-2xl hover:border-blue-400 transition-colors">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{player.name}</h2>
        {player.role && (
          <p className="text-blue-400 text-sm font-medium uppercase tracking-wide">
            {player.role}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Base Price</p>
          <p className="text-xl font-bold text-green-400">₹{player.base_price}Cr</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Current Bid</p>
          <p className="text-xl font-bold text-yellow-400">₹{currentBid.toFixed(2)}Cr</p>
        </div>
      </div>

      {highestBidder && (
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">Highest Bidder</p>
          </div>
          <p className="text-lg font-bold text-white truncate">{highestBidder}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg p-4">
        <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
          {timerRemaining > 0 ? (
            <p className="text-2xl font-bold text-white">{timerRemaining}s</p>
          ) : (
            <div className="text-2xl font-bold text-orange-200 flex items-center gap-2 animate-pulse">
              Finalizing
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-300"></span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
