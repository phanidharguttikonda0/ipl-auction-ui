import { useEffect, useState, useCallback } from "react";
import { X, DollarSign, Users as UsersIcon, TrendingUp } from "lucide-react";
import { apiClient } from "../services/api";
import type { TeamDetails, PlayerDetails } from "../types";

interface TeamDetailsModalProps {
  participantId: number;
  onClose: () => void;
}

export const TeamDetailsModal = ({ participantId, onClose }: TeamDetailsModalProps) => {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [players, setPlayers] = useState<PlayerDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeamData();
  }, [participantId]);

  const loadTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const [details, playersList] = await Promise.all([
        apiClient.getTeamDetails(participantId),
        apiClient.getTeamPlayers(participantId),
      ]);
      setTeamDetails(details);
      setPlayers(playersList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Team Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teamDetails && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-gray-400">Balance</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      ₹{teamDetails.remaining_balance.toFixed(2)}Cr
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UsersIcon className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400">Players</p>
                    </div>
                    <p className="text-xl font-bold text-white">{teamDetails.total_players}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-gray-400">Batsmans</p>
                    </div>
                    <p className="text-xl font-bold text-white">{teamDetails.total_batsmans}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                      <p className="text-xs text-gray-400">Bowlers</p>
                    </div>
                    <p className="text-xl font-bold text-white">{teamDetails.total_bowlers}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      <p className="text-xs text-gray-400">All Rounders</p>
                    </div>
                    <p className="text-xl font-bold text-white">{teamDetails.all_rounders}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Squad ({players.length})</h3>
                {players.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No players yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                    {players.map((player) => (
                      <div
                        key={player.player_id}
                        className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-900/80 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{player.player_name}</p>
                          <p className="text-xs text-gray-400">{player.role}</p>
                        </div>
                        <p className="text-green-400 font-semibold flex-shrink-0 ml-2">
                          ₹{player.brought_price.toFixed(2)}Cr
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
