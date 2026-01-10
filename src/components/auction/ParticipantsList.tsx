// src/components/auction/ParticipantsList.tsx
import {
  DollarSign,
  Users,
  Shield,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Plane,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { TEAM_LOGOS } from "../../constants";
import type { ParticipantState, TeamName } from "../../types";

interface AudioControls {
  toggleMute: () => void;
  isJoined: boolean;
  localMuted: boolean;
  remoteStreamsList: Array<[string, MediaStream]>;
  error: string | null;
}

interface ParticipantsListProps {
  participants: Map<number, ParticipantState>;
  myParticipantId: number;
  onSelectParticipant: (id: number) => void;
  audioControls: AudioControls;
}

export const ParticipantsList = ({
  participants,
  myParticipantId,
  onSelectParticipant,
  audioControls,
}: ParticipantsListProps) => {
  const {
    toggleMute,
    isJoined,
    localMuted,
    remoteStreamsList,
    error,
  } = audioControls;

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const sortedParticipants = useMemo(
    () => Array.from(participants.values()).sort((a, b) => b.balance - a.balance),
    [participants],
  );

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
      <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Participants</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300">
              {participants.size}
            </span>
          </div>

          {/* Local mute button */}
          <button
            type="button"
            onClick={toggleMute}
            disabled={!isJoined}
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${localMuted
                ? "border-red-500/60 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                : "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              } ${!isJoined ? "opacity-40 cursor-not-allowed" : "hover:scale-105"}`}
            title={localMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {localMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {localMuted ? "Muted" : "Live"}
          </button>
        </div>

        {/* Audio error */}
        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl animate-fade-in">
            <p className="text-xs text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Participant list */}
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
          {sortedParticipants.map((participant) => {
            const isMe = participant.participant_id === myParticipantId;
            const muted = isMe ? localMuted : !participant.is_unmuted;

            return (
              <div
                key={participant.participant_id}
                className={`relative group/participant rounded-xl border-2 transition-all duration-200 ${isMe
                    ? muted
                      ? "border-red-500/60 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:border-red-400/70"
                      : "border-blue-500/60 bg-gradient-to-br from-blue-500/10 to-purple-500/5 hover:border-blue-400/70"
                    : "border-gray-700/50 bg-gray-900/40 hover:bg-gray-800/50 hover:border-gray-600/60"
                  }`}
              >
                <div className="p-4">
                  {/* Title Row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => onSelectParticipant(participant.participant_id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left group/name hover:scale-[1.02] transition-transform"
                    >
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 p-1.5 border-2 border-gray-600 group-hover/name:border-blue-500 transition-colors">
                        <img
                          src={TEAM_LOGOS[participant.team_name as TeamName]}
                          alt={participant.team_name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-white truncate flex items-center gap-2">
                          {participant.team_name}
                          {isMe && (
                            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-[10px] font-bold text-blue-300 uppercase">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">ID: #{participant.participant_id}</p>
                      </div>
                    </button>

                    {/* Status Icons */}
                    <div className="flex items-center gap-2">
                      {participant.connected ? (
                        <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/30">
                          <Wifi className="w-4 h-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/30">
                          <WifiOff className="w-4 h-4 text-red-400" />
                        </div>
                      )}

                      {/* Mic Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-xs font-bold transition-colors ${muted
                            ? "border-red-500/50 bg-red-500/10 text-red-300"
                            : isMe
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-gray-600/50 bg-gray-700/30 text-gray-300"
                          }`}
                        title={isMe ? (muted ? "You are muted" : "You are live") : (muted ? "This participant is muted" : "This participant is live")}
                      >
                        {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        {muted ? "Muted" : "Live"}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-400" />
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Balance</p>
                      </div>
                      <p className="text-sm text-white font-bold">₹{participant.balance.toFixed(1)}Cr</p>
                    </div>

                    <div className="flex flex-col gap-1 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Players</p>
                      </div>
                      <p className="text-sm text-white font-bold">{participant.total_players_brought}</p>
                    </div>

                    <div className="flex flex-col gap-1 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-orange-400" />
                        <p className="text-[10px] text-gray-400 uppercase font-medium">RTMs</p>
                      </div>
                      <p className="text-sm text-white font-bold">{participant.remaining_rtms}</p>
                    </div>
                  </div>

                  {/* Foreign Players Badge */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20">
                      <Plane className="w-4 h-4 text-cyan-400 transform -rotate-45" />
                      <p className="text-xs text-cyan-300 font-semibold">
                        Foreign Players:{" "}
                        <span className="text-white font-bold">{participant.foreign_players_brought}/8</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invisible audio elements */}
        <div className="sr-only" aria-hidden="true">
          {remoteStreamsList.map(([id, stream]) => (
            <audio
              key={id}
              ref={(el) => {
                audioRefs.current[id] = el;
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
              autoPlay
              playsInline
            />
          ))}
        </div>
      </div>
    </div>
  );
};
