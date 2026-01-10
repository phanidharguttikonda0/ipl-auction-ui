import { useState, useEffect } from "react";
import { Clock, TrendingUp, Plane, User } from "lucide-react";
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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [player.id, player.profile_url]);

  // Calculate timer percentage for progress bar
  const timerPercentage = Math.min(100, (timerRemaining / 30) * 100);

  return (
    <div className="relative group animate-fade-in-up">
      {/* Gradient Border Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 blur-lg"></div>

      <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
        {/* Player Info */}
        <div className="text-center mb-8">
          {/* Player Image with modern frame */}
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full opacity-50 blur-xl animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full p-1 shadow-2xl">
              <div className="w-full h-full bg-gray-900 rounded-full overflow-hidden">
                {player.profile_url && !imgError ? (
                  <img
                    src={player.profile_url}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Name */}
          <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {player.name}
            </span>
            {!player.is_indian && (
              <span className="inline-flex ml-3 items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <Plane className="w-5 h-5 text-cyan-400 transform -rotate-45" />
                <span className="text-xs font-bold text-cyan-400 uppercase">Overseas</span>
              </span>
            )}
          </h2>

          {/* Role & Country */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {player.role && (
              <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wide">{player.role}</span>
              </span>
            )}
            {player.country && (
              <span className="px-4 py-1.5 bg-gray-700/30 border border-gray-600/30 rounded-full">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{player.country}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Base Price */}
          <div className="relative group/stat">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-20 group-hover/stat:opacity-40 transition-opacity blur"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-green-500/20 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Base Price</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ₹{player.base_price}Cr
              </p>
            </div>
          </div>

          {/* Current Bid */}
          <div className="relative group/stat">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl opacity-20 group-hover/stat:opacity-40 transition-opacity blur"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-yellow-500/20 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Current Bid</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ₹{currentBid.toFixed(2)}Cr
              </p>
            </div>
          </div>
        </div>

        {/* Highest Bidder */}
        {highestBidder && (
          <div className="relative mb-6 group/bidder">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover/bidder:opacity-30 transition-opacity blur"></div>
            <div className="relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">Highest Bidder</p>
              </div>
              <p className="text-xl font-bold text-white truncate pl-2">{highestBidder}</p>
            </div>
          </div>
        )}

        {/* Timer Section with Progress Bar */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl opacity-30 blur-lg"></div>
          <div className="relative bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-2xl p-6 overflow-hidden">
            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-900/50">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
                style={{ width: `${timerPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Time Remaining</p>
                {timerRemaining > 0 ? (
                  <p className={`text-3xl font-extrabold ${timerRemaining <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {timerRemaining}s
                  </p>
                ) : (
                  <div className="text-2xl font-bold text-orange-200 flex items-center gap-2 animate-pulse">
                    Finalizing
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-200"></span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
