import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { TEAM_COLORS } from "../../constants";
import type { TeamName, SoldUnsoldState, SoldPlayerOutput, UnSoldPlayerOutput } from "../../types";

interface SoldUnsoldListProps {
  soldPlayers: SoldUnsoldState;
  unsoldPlayers: SoldUnsoldState;
  onChangeSoldPage: (page: number) => void;
  onChangeUnsoldPage: (page: number) => void;
}

export const SoldUnsoldList = ({ soldPlayers, unsoldPlayers, onChangeSoldPage, onChangeUnsoldPage }: SoldUnsoldListProps) => {
  const currentSoldPlayers = soldPlayers.currentPage === 1 
    ? (soldPlayers.page1 as SoldPlayerOutput[])
    : (soldPlayers.page2 as SoldPlayerOutput[]);

  const currentUnsoldPlayers = unsoldPlayers.currentPage === 1
    ? (unsoldPlayers.page1 as UnSoldPlayerOutput[])
    : (unsoldPlayers.page2 as UnSoldPlayerOutput[]);

  const totalSoldCount = soldPlayers.page1.length + soldPlayers.page2.length;
  const totalUnsoldCount = unsoldPlayers.page1.length + unsoldPlayers.page2.length;

  return (
    <div className="space-y-6">
      {/* Sold Players */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">Sold Players</h2>
          <span className="ml-auto text-sm font-semibold text-gray-400">
            {totalSoldCount}
          </span>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onChangeSoldPage(1)}
            disabled={soldPlayers.currentPage === 1 || soldPlayers.loading}
            className={`p-1 rounded transition-colors ${
              soldPlayers.currentPage === 1 || soldPlayers.loading
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 font-medium">
            Page {soldPlayers.currentPage}
          </span>
          <button
            onClick={() => onChangeSoldPage(2)}
            disabled={soldPlayers.currentPage === 2 || soldPlayers.loading}
            className={`p-1 rounded transition-colors ${
              soldPlayers.currentPage === 2 || soldPlayers.loading
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {soldPlayers.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentSoldPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No players sold yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {currentSoldPlayers.map((player, index) => {
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
                    ₹{player.bought_price}Cr
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unsold Players */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-bold text-white">Unsold Players</h2>
          <span className="ml-auto text-sm font-semibold text-gray-400">
            {totalUnsoldCount}
          </span>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onChangeUnsoldPage(1)}
            disabled={unsoldPlayers.currentPage === 1 || unsoldPlayers.loading}
            className={`p-1 rounded transition-colors ${
              unsoldPlayers.currentPage === 1 || unsoldPlayers.loading
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 font-medium">
            Page {unsoldPlayers.currentPage}
          </span>
          <button
            onClick={() => onChangeUnsoldPage(2)}
            disabled={unsoldPlayers.currentPage === 2 || unsoldPlayers.loading}
            className={`p-1 rounded transition-colors ${
              unsoldPlayers.currentPage === 2 || unsoldPlayers.loading
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {unsoldPlayers.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentUnsoldPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No unsold players</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {currentUnsoldPlayers.map((player, index) => (
              <div
                key={`unsold-${player.player_id}-${index}`}
                className="bg-gray-900/50 rounded-lg p-3 hover:bg-gray-900/80 transition-colors"
              >
                <p className="text-sm font-semibold text-white">{player.player_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{player.role}</p>
                  <p className="text-xs text-gray-400">₹{player.base_price}Cr</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
