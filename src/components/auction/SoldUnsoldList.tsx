import { CheckCircle, XCircle } from "lucide-react";
import { TEAM_COLORS } from "../../constants";
import type { PlayerDetails, TeamName } from "../../types";

interface SoldUnsoldListProps {
  soldPlayers: Array<PlayerDetails & { team_name: string }>;
  unsoldPlayers: string[];
}

export const SoldUnsoldList = ({ soldPlayers, unsoldPlayers }: SoldUnsoldListProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">Sold Players</h2>
          <span className="ml-auto text-sm font-semibold text-gray-400">
            {soldPlayers.length}
          </span>
        </div>

        {soldPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No players sold yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {soldPlayers.map((player, index) => {
              const colors = TEAM_COLORS[player.team_name as TeamName];
              return (
                <div
                  key={`${player.player_id}-${index}`}
                  className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-900/80 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: colors?.primary }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {player.player_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{player.team_name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-400 flex-shrink-0 ml-2">
                    ₹{player.brought_price}Cr
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-bold text-white">Unsold Players</h2>
          <span className="ml-auto text-sm font-semibold text-gray-400">
            {unsoldPlayers.length}
          </span>
        </div>

        {unsoldPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No unsold players</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {unsoldPlayers.map((player, index) => (
              <div
                key={`unsold-${index}`}
                className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300 hover:bg-gray-900/80 transition-colors"
              >
                {player}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
