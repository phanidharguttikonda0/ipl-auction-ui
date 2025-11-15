import { DollarSign, Users, Shield, Wifi, WifiOff } from "lucide-react";
import { useState, useCallback } from "react";
import { TEAM_COLORS } from "../../constants";
import type { ParticipantState, TeamName } from "../../types";
import { TeamDetailsModal } from "../TeamDetailsModal";

interface ParticipantsListProps {
  participants: Map<number, ParticipantState>;
  myParticipantId: number;
}

export const ParticipantsList = ({
  participants,
  myParticipantId,
}: ParticipantsListProps) => {
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  const participantsList = useCallback(() => {
    return Array.from(participants.values()).sort((a, b) => b.balance - a.balance);
  }, [participants]);

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Participants</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 rounded-full">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">
              {participants.size}
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          {participantsList().map((participant) => {
            const colors = TEAM_COLORS[participant.team_name as TeamName];
            const isMe = participant.participant_id === myParticipantId;

            return (
              <button
                key={participant.participant_id}
                onClick={() => setSelectedParticipant(participant.participant_id)}
                className={`w-full text-left p-4 rounded-lg transition-all border ${
                  isMe
                    ? "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20"
                    : "bg-gray-900/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors?.primary }}
                    ></div>
                    <h3 className="text-sm font-semibold text-white truncate">
                      {participant.team_name}
                      {isMe && (
                        <span className="ml-2 text-xs text-blue-400">(You)</span>
                      )}
                    </h3>
                  </div>
                  {participant.connected ? (
                    <Wifi className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Balance</p>
                      <p className="text-sm font-bold text-white">
                        ₹{participant.balance.toFixed(1)}Cr
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Players</p>
                      <p className="text-sm font-bold text-white">
                        {participant.total_players_brought}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
