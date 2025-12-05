import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users as UsersIcon,
  CopyIcon,
} from "lucide-react";

import { apiClient, getUserIdFromAuthToken } from "../services/api";
import type { AuctionRoom, Participant } from "../types";
import { TeamDetailsModal } from "./TeamDetailsModal";

interface AuctionHistoryProps {
  onSelectAuction?: (roomId: string, participant: Participant) => void;
}

export const AuctionHistory = ({ onSelectAuction }: AuctionHistoryProps) => {
  const [auctions, setAuctions] = useState<AuctionRoom[]>([]);
  const [expandedAuction, setExpandedAuction] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    Record<string, Participant[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState<
    Record<string, boolean>
  >({});
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(
    null
  );
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const copyToClipboard = async (roomId: string) => {
    await navigator.clipboard.writeText(roomId);
    setCopiedRoom(roomId);

    setTimeout(() => {
      setCopiedRoom(null);
    }, 1200);
  };

  useEffect(() => {
    loadAuctions();
  }, [currentPage]);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAuctionsPlayed(currentPage, PER_PAGE);
      setAuctions(data);
    } catch (error) {
      console.error("Failed to load auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const toggleAuction = useCallback(
    async (roomId: string) => {
      if (expandedAuction === roomId) {
        setExpandedAuction(null);
        return;
      }

      setExpandedAuction(roomId);

      // Fetch participants only first time
      if (!participants[roomId]) {
        setLoadingParticipants((prev) => ({ ...prev, [roomId]: true }));

        try {
          const data = await apiClient.getParticipants(roomId);
          setParticipants((prev) => ({ ...prev, [roomId]: data }));
        } catch (error) {
          console.error("Failed to load participants:", error);
        } finally {
          setLoadingParticipants((prev) => ({ ...prev, [roomId]: false }));
        }
      }
    },
    [expandedAuction, participants]
  );

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Auction History</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Auction History</h2>

          <div className="flex items-center gap-3">
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
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={auctions.length < PER_PAGE || loading}
              className={`p-1 rounded transition-colors ${auctions.length < PER_PAGE || loading
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>You have not participated in any auctions yet.</p>
          </div>
        ) : (
          auctions.map((auction) => (
            <div
              key={auction.room_id}
              className="border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
            >
              <button
                onClick={() => toggleAuction(auction.room_id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
              >
                {/* Left Section */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {expandedAuction === auction.room_id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}

                  <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />

                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {auction.room_id}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${auction.status === "not_started"
                            ? "text-green-400 bg-green-400/10 border-green-400/20"
                            : auction.status === "in_progress"
                              ? "text-gray-400 bg-gray-400/10 border-gray-400/20"
                              : auction.status === "completed"
                                ? "text-red-400 bg-red-400/10 border-red-400/20"
                                : "text-blue-400 bg-blue-400/10 border-blue-400/20"
                          }`}
                      >
                        {auction.status?.replace("_", " ").toUpperCase() ||
                          "UNKNOWN"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(auction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Copy Icon */}
                <div className="ml-3 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(auction.room_id);
                    }}
                    className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                  >
                    <CopyIcon className="w-4 h-4 text-gray-300" />
                  </button>

                  {copiedRoom === auction.room_id && (
                    <span className="text-xs text-green-400 animate-pulse">
                      Copied!
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Section */}
              {expandedAuction === auction.room_id && (
                <div className="border-t border-gray-700 p-4 bg-gray-900/30">
                  {loadingParticipants[auction.room_id] ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {participants[auction.room_id]?.length || 0} Participants
                        </p>
                      </div>

                      {participants[auction.room_id]?.map((participant) => (
                        <button
                          key={participant.participant_id}
                          onClick={() =>
                            setSelectedParticipant(participant.participant_id)
                          }
                          className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white font-medium">
                              {participant.team_name}
                            </p>

                            <p className="text-xs text-green-400">
                              {participant.user_id === getUserIdFromAuthToken()
                                ? "(You)"
                                : ""}
                            </p>
                          </div>

                          <p className="text-xs text-gray-500">
                            ID: {participant.participant_id}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedParticipant && (
        <TeamDetailsModal
          participantId={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </>
  );
};
