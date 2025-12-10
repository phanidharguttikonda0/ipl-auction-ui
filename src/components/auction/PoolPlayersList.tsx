import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { PoolPlayer } from "../../types";

interface PoolPlayersListProps {
    players: PoolPlayer[];
    loading: boolean;
    poolName: string;
}

export const PoolPlayersList = ({ players, loading, poolName }: PoolPlayersListProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [players]);

    const totalPages = Math.ceil(players.length / itemsPerPage);

    const currentPlayers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return players.slice(start, start + itemsPerPage);
    }, [players, currentPage]);

    if (!poolName) return null;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white truncate pr-2">{poolName}</h2>
                <span className="ml-auto text-sm font-semibold text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full bg-gray-900/50">
                    {players.length}
                </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className={`p-1 rounded transition-colors ${currentPage === 1 || loading
                            ? "text-gray-600 cursor-not-allowed"
                            : "text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 font-medium">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading || totalPages === 0}
                    className={`p-1 rounded transition-colors ${currentPage === totalPages || loading || totalPages === 0
                            ? "text-gray-600 cursor-not-allowed"
                            : "text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : players.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No players in this pool</p>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                    {currentPlayers.map((player) => (
                        <div
                            key={player.id}
                            className={`bg-gray-900/50 rounded-lg p-3 hover:bg-gray-900/80 transition-colors border-l-2 ${player.is_indian ? "border-orange-500" : "border-blue-500"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {player.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {player.role} • {player.country}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <p className="text-sm font-bold text-gray-300">
                                        ₹{player.base_price}Cr
                                    </p>
                                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded mt-0.5">
                                        {player.previous_team}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
