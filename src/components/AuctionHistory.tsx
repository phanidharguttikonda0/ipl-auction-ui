import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Calendar, Users as UsersIcon } from "lucide-react";
import { apiClient } from "../services/api";
import type { AuctionRoom, Participant } from "../types";
import { TeamDetailsModal } from "./TeamDetailsModal";

interface AuctionHistoryProps {
  onSelectAuction?: (roomId: string, participant: Participant) => void;
}

export const AuctionHistory = ({ onSelectAuction }: AuctionHistoryProps) => {
  const [auctions, setAuctions] = useState<AuctionRoom[]>([]);
  const [expandedAuction, setExpandedAuction] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({});
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = useCallback(async () => {
    try {
      const data = await apiClient.getAuctionsPlayed();
      setAuctions(data);
    } catch (error) {
      console.error("Failed to load auctions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAuction = useCallback(async (roomId: string) => {
    if (expandedAuction === roomId) {
      setExpandedAuction(null);
      return;
    }

    setExpandedAuction(roomId);

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
  }, [expandedAuction, participants]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Auction History</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <h2 className="text-lg font-bold text-white mb-4">Auction History</h2>

        {auctions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No auction history yet. Create or join a room to get started!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {auctions.map((auction) => (
              <div key={auction.room_id} className="border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
                <button
                  onClick={() => toggleAuction(auction.room_id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {expandedAuction === auction.room_id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-white truncate">{auction.room_id}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(auction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>

                {expandedAuction === auction.room_id && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/30">
                    {loadingParticipants[auction.room_id] ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                            onClick={() => setSelectedParticipant(participant.participant_id)}
                            className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                          >
                            <p className="text-sm text-white font-medium">{participant.team_name}</p>
                            <p className="text-xs text-gray-500">ID: {participant.participant_id}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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
