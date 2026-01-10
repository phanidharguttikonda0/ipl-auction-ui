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
  const [selectedParticipant, setSelectedParticipant] = useState<{
    participantId: number;
    roomId: string;
  } | null>(null);
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<{ roomId: string; createdAt: string }[]>([]);
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
      const cursor = currentPage > 1 ? cursors[currentPage - 2] : undefined;
      const data = await apiClient.getAuctionsPlayed(
        PER_PAGE,
        cursor?.roomId,
        cursor?.createdAt
      );
      setAuctions(data);

      if (data.length > 0) {
        const lastItem = data[data.length - 1];
        setCursors((prev) => {
          // Prevent unnecessary updates if cursor already exists and matches
          if (
            prev[currentPage - 1]?.roomId === lastItem.room_id &&
            prev[currentPage - 1]?.createdAt === lastItem.created_at
          ) {
            return prev;
          }
          const newCursors = [...prev];
          newCursors[currentPage - 1] = {
            roomId: lastItem.room_id,
            createdAt: lastItem.created_at,
          };
          return newCursors;
        });
      }
    } catch (error) {
      console.error("Failed to load auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, cursors]);

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
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-yellow-600/20 rounded-2xl blur opacity-30"></div>
        <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📜</span>
            Auction History
          </h2>
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-yellow-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📜</span>
              Auction History
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className={`p-2 rounded-xl transition-all duration-200 ${currentPage === 1 || loading
                    ? "text-gray-600 cursor-not-allowed bg-gray-800/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600"
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1.5 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <span className="text-sm text-gray-300 font-semibold">
                  Page {currentPage}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={auctions.length < PER_PAGE || loading}
                className={`p-2 rounded-xl transition-all duration-200 ${auctions.length < PER_PAGE || loading
                    ? "text-gray-600 cursor-not-allowed bg-gray-800/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600"
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {auctions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No auction history yet</p>
              <p className="text-gray-500 text-sm mt-1">Create or join a room to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auctions.map((auction) => (
                <div
                  key={auction.room_id}
                  className="border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/70 transition-all duration-200 bg-gray-900/30 backdrop-blur-sm"
                >
                  <button
                    onClick={() => toggleAuction(auction.room_id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-700/20 transition-colors"
                  >
                    {/* Left Section */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {expandedAuction === auction.room_id ? (
                        <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}

                      <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>

                      <div className="text-left min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">
                            {auction.room_id}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${auction.status === "not_started"
                                ? "text-green-400 bg-green-400/10 border border-green-400/30"
                                : auction.status === "in_progress"
                                  ? "text-blue-400 bg-blue-400/10 border border-blue-400/30"
                                  : auction.status === "completed"
                                    ? "text-purple-400 bg-purple-400/10 border border-purple-400/30"
                                    : "text-gray-400 bg-gray-400/10 border border-gray-400/30"
                              }`}
                          >
                            {auction.status?.replace("_", " ") || "UNKNOWN"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(auction.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
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
                        className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-600"
                        title="Copy Room ID"
                      >
                        <CopyIcon className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                      </button>

                      {copiedRoom === auction.room_id && (
                        <span className="text-xs text-green-400 font-medium animate-fade-in">
                          Copied!
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Section */}
                  {expandedAuction === auction.room_id && (
                    <div className="border-t border-gray-700/50 p-4 bg-gray-900/50">
                      {loadingParticipants[auction.room_id] ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="relative">
                            <div className="w-8 h-8 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <UsersIcon className="w-4 h-4 text-blue-400" />
                            <p className="text-sm text-gray-400 font-semibold">
                              {participants[auction.room_id]?.length || 0} Participants
                            </p>
                          </div>

                          <div className="grid gap-2">
                            {participants[auction.room_id]?.map((participant) => (
                              <button
                                key={participant.participant_id}
                                onClick={() =>
                                  setSelectedParticipant({
                                    participantId: participant.participant_id,
                                    roomId: auction.room_id,
                                  })
                                }
                                className="group/participant text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-200 border border-gray-700/30 hover:border-gray-600"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                                      <span className="text-blue-400 text-xs font-bold">
                                        {participant.team_name.slice(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm text-white font-semibold">
                                        {participant.team_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        ID: {participant.participant_id}
                                      </p>
                                    </div>
                                  </div>

                                  {participant.user_id === getUserIdFromAuthToken() && (
                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full font-semibold border border-green-500/30">
                                      You
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedParticipant && (
        <TeamDetailsModal
          participantId={selectedParticipant.participantId}
          roomStatus={auctions.find((a) => a.room_id === selectedParticipant.roomId)?.status || ""}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </>
  );
};
