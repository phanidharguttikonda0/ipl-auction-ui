import {
  DollarSign,
  Users,
  Shield,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { TEAM_COLORS } from "../../constants";
import type { ParticipantState, TeamName } from "../../types";

interface AudioControls {
  joinAudio: () => void;
  leaveAudio: () => void;
  toggleMute: () => void;
  isJoined: boolean;
  localMuted: boolean;
  remoteMuteMap: Record<string, boolean>;
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
    joinAudio,
    leaveAudio,
    toggleMute,
    isJoined,
    localMuted,
    remoteMuteMap,
    remoteStreamsList,
    error,
  } = audioControls;

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const sortedParticipants = useMemo(
    () => Array.from(participants.values()).sort((a, b) => b.balance - a.balance),
    [participants],
  );

  const handleJoinLeave = () => {
    if (isJoined) {
      leaveAudio();
    } else {
      joinAudio();
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Participants</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-900/60 text-gray-200">
            {participants.size}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleJoinLeave}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isJoined
                ? "bg-red-500/20 text-red-200 hover:bg-red-500/35"
                : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35"
            }`}
            title={isJoined ? "Leave audio room" : "Join audio room"}
          >
            {isJoined ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
            {isJoined ? "Leave Audio" : "Join Audio"}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            disabled={!isJoined}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              localMuted
                ? "border-red-500/60 text-red-200"
                : "border-emerald-500/60 text-emerald-200"
            } ${!isJoined ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5"}`}
            title={localMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {localMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {localMuted ? "Muted" : "Live"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-200 border border-red-500/40 rounded-md px-3 py-2 mb-3 bg-red-500/10">
          {error}
        </p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {sortedParticipants.map((participant) => {
          const colors = TEAM_COLORS[participant.team_name as TeamName];
          const isMe = participant.participant_id === myParticipantId;
          const remoteId = participant.participant_id.toString();
          const muted = isMe ? localMuted : remoteMuteMap[remoteId] ?? false;

          return (
            <div
              key={participant.participant_id}
              className={`p-4 rounded-lg border transition ${
                isMe
                  ? localMuted
                    ? "border-red-500/60 bg-red-500/5"
                    : "border-blue-500/50 bg-blue-500/5"
                  : "border-gray-700 bg-gray-900/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => onSelectParticipant(participant.participant_id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors?.primary }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {participant.team_name}
                      {isMe && <span className="text-xs text-blue-200 ml-2">(You)</span>}
                    </p>
                    <p className="text-[11px] text-gray-400">#{participant.participant_id}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  {participant.connected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      muted
                        ? "border-gray-600 text-gray-400"
                        : "border-emerald-500/50 text-emerald-100"
                    }`}
                    title={
                      muted
                        ? isMe
                          ? "Tap the mute button above to unmute yourself"
                          : "Participant muted"
                        : "Participant live"
                    }
                  >
                    {muted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    {muted ? "Muted" : "Live"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className="text-white font-semibold">
                      ₹{participant.balance.toFixed(1)}Cr
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Players</p>
                    <p className="text-white font-semibold">
                      {participant.total_players_brought}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
  );
};
