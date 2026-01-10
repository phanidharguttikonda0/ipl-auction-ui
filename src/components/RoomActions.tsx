import { useState, useCallback } from "react";
import { Plus, LogIn } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "../constants";
import { apiClient } from "../services/api";
import { StrictModeModal } from "./StrictModeModal";
import type { TeamName } from "../types";

interface RoomActionsProps {
    onRoomReady: (roomId: string, participantId: number, teamName: string) => void;
}

export const RoomActions = ({ onRoomReady }: RoomActionsProps) => {
    const [showCreateTeams, setShowCreateTeams] = useState(false);
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(null);
    const [roomIdInput, setRoomIdInput] = useState("");
    const [availableTeams, setAvailableTeams] = useState<TeamName[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState<"input" | "select">("input");
    const [isStrictMode, setIsStrictMode] = useState(false);
    const [showStrictModeModal, setShowStrictModeModal] = useState(false);

    const resetState = useCallback(() => {
        setShowCreateTeams(false);
        setShowJoinRoom(false);
        setSelectedTeam(null);
        setRoomIdInput("");
        setAvailableTeams([]);
        setError("");
        setStep("input");
        setIsStrictMode(false);
    }, []);

    const handleCreateRoom = useCallback(async () => {
        if (!selectedTeam) return;

        try {
            setLoading(true);
            setError("");
            const response = await apiClient.createRoom(selectedTeam, isStrictMode);
            resetState();
            onRoomReady(response.room_id, response.participant_id, response.team_name);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create room");
        } finally {
            setLoading(false);
        }
    }, [selectedTeam, onRoomReady, resetState, isStrictMode]);

    const handleJoinRoomStep1 = useCallback(async () => {
        if (!roomIdInput.trim()) {
            setError("Please enter a room ID");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result = await apiClient.joinRoomGetTeams(roomIdInput);

            // Case 1: backend sends participant object (already in room)
            if (result && typeof result === "object" && "participant_id" in result) {
                resetState();
                onRoomReady(result.room_id, result.participant_id, result.team_name);
                return;
            }

            // Case 2: backend sends remaining teams array (wrapped or plain)
            const remainingTeamsRaw =
                (result && typeof result === "object" && Array.isArray(result.remaining_teams)
                    ? result.remaining_teams
                    : Array.isArray(result)
                        ? result
                        : null) as unknown[] | null;

            if (remainingTeamsRaw) {
                const normalizedTeams = remainingTeamsRaw
                    .map((team) => {
                        if (typeof team === "string") {
                            return team as TeamName;
                        }
                        if (team && typeof team === "object") {
                            return (
                                ((team as { team_name?: string; team?: string; name?: string }).team_name ||
                                    (team as { team?: string }).team ||
                                    (team as { name?: string }).name) as TeamName | undefined
                            );
                        }
                        return undefined;
                    })
                    .filter((team): team is TeamName => Boolean(team));

                if (normalizedTeams.length > 0) {
                    setAvailableTeams(normalizedTeams);
                    setStep("select");
                    return;
                }
            }

            // Case 3: backend sends message (error)
            if (result && typeof result === "object" && "message" in result) {
                setError(String(result.message));
                return;
            }

            if (typeof result === "string") {
                setError(result);
                return;
            }

            setError("Unexpected response from server");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === "object" && err && "message" in err) {
                setError(String((err as { message: unknown }).message));
            } else {
                setError("Failed to fetch teams. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [roomIdInput, onRoomReady, resetState]);

    const handleJoinRoom = useCallback(async () => {
        if (!selectedTeam) return;

        try {
            setLoading(true);
            setError("");
            const response = await apiClient.joinRoom(roomIdInput, selectedTeam);
            resetState();
            onRoomReady(response.room_id, response.participant_id, response.team_name);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to join room");
        } finally {
            setLoading(false);
        }
    }, [selectedTeam, roomIdInput, onRoomReady, resetState]);

    return (
        <div className="space-y-5">
            {/* Create Room Button */}
            <button
                onClick={() => {
                    resetState();
                    setShowCreateTeams(true);
                }}
                className="group relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:via-blue-600 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] flex items-center justify-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold">Create Room</div>
                        <div className="text-xs text-blue-100 font-normal">Start a new auction</div>
                    </div>
                </div>
            </button>

            {/* Join Room Button */}
            <button
                onClick={() => {
                    resetState();
                    setShowJoinRoom(true);
                }}
                className="group relative w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] flex items-center justify-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <LogIn className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold">Join Room</div>
                        <div className="text-xs text-emerald-100 font-normal">Enter existing auction</div>
                    </div>
                </div>
            </button>

            {showCreateTeams && (
                <div className="relative group/modal">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-2xl blur opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/70 rounded-2xl p-6 space-y-5 animate-scale-in shadow-2xl">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">🏏</span>
                            Select Your Team
                        </h3>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                            {TEAMS.map((team) => {
                                const colors = TEAM_COLORS[team];
                                const isSelected = selectedTeam === team;

                                return (
                                    <button
                                        key={team}
                                        onClick={() => setSelectedTeam(team)}
                                        className={`group/team p-4 rounded-xl transition-all duration-200 text-left ${isSelected
                                            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20"
                                            : "bg-gray-900/50 border border-gray-700 hover:bg-gray-700/50 hover:border-gray-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full flex-shrink-0 transition-all ${isSelected ? 'scale-125' : 'group-hover/team:scale-110'
                                                    }`}
                                                style={{ backgroundColor: colors.primary }}
                                            ></div>
                                            <span className={`font-medium ${isSelected ? 'text-white text-base' : 'text-gray-300 text-sm'}`}>
                                                {team}
                                            </span>
                                            {isSelected && (
                                                <span className="ml-auto text-blue-400">✓</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/70 to-gray-800/70 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isStrictMode}
                                        onChange={(e) => setIsStrictMode(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600 shadow-inner"></div>
                                </label>
                                <span className="text-sm font-semibold text-gray-200">Enable Strict Mode</span>
                            </div>

                            <button
                                onClick={() => setShowStrictModeModal(true)}
                                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium px-2 py-1 rounded transition-colors"
                            >
                                Why Strict Mode?
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={resetState}
                                className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-gray-600 hover:border-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRoom}
                                disabled={!selectedTeam || loading}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${!selectedTeam || loading
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02]"
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Room"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showJoinRoom && (
                <div className="relative group/modal">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-600/30 rounded-2xl blur opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/70 rounded-2xl p-6 space-y-5 animate-scale-in shadow-2xl">
                        {step === "input" ? (
                            <>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🔑</span>
                                    Enter Room ID
                                </h3>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                                        <p className="text-red-400 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Room ID</label>
                                    <input
                                        type="text"
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoomStep1()}
                                        placeholder="e.g., abc123xyz"
                                        className="w-full px-4 py-3.5 bg-gray-900/70 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={resetState}
                                        className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-gray-600 hover:border-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleJoinRoomStep1}
                                        disabled={!roomIdInput.trim() || loading}
                                        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${!roomIdInput.trim() || loading
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-emerald-500/50 hover:scale-[1.02]"
                                            }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                Checking...
                                            </span>
                                        ) : (
                                            "Continue"
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🏏</span>
                                    Select Your Team
                                </h3>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                                        <p className="text-red-400 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                    {availableTeams.map((team) => {
                                        const colors = TEAM_COLORS[team];
                                        const isSelected = selectedTeam === team;

                                        return (
                                            <button
                                                key={team}
                                                onClick={() => setSelectedTeam(team)}
                                                className={`group/team p-4 rounded-xl transition-all duration-200 text-left ${isSelected
                                                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20"
                                                        : "bg-gray-900/50 border border-gray-700 hover:bg-gray-700/50 hover:border-gray-600"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-5 h-5 rounded-full flex-shrink-0 transition-all ${isSelected ? 'scale-125' : 'group-hover/team:scale-110'
                                                            }`}
                                                        style={{ backgroundColor: colors.primary }}
                                                    ></div>
                                                    <span className={`font-medium ${isSelected ? 'text-white text-base' : 'text-gray-300 text-sm'}`}>
                                                        {team}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="ml-auto text-emerald-400">✓</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep("input")}
                                        className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-gray-600 hover:border-gray-500"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={!selectedTeam || loading}
                                        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${!selectedTeam || loading
                                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                                : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-emerald-500/50 hover:scale-[1.02]"
                                            }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                Joining...
                                            </span>
                                        ) : (
                                            "Join Now"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <StrictModeModal
                isOpen={showStrictModeModal}
                onClose={() => setShowStrictModeModal(false)}
            />
        </div>
    );
};
