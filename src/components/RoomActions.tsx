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
        <div className="space-y-4">
            <button
                onClick={() => {
                    resetState();
                    setShowCreateTeams(true);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Create Room
            </button>

            <button
                onClick={() => {
                    resetState();
                    setShowJoinRoom(true);
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 border border-gray-700 flex items-center justify-center gap-2"
            >
                <LogIn className="w-5 h-5" />
                Join Room
            </button>

            {showCreateTeams && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-white">Select Your Team</h3>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                        {TEAMS.map((team) => {
                            const colors = TEAM_COLORS[team];
                            const isSelected = selectedTeam === team;

                            return (
                                <button
                                    key={team}
                                    onClick={() => setSelectedTeam(team)}
                                    className={`p-3 rounded-lg transition-all text-left ${isSelected
                                        ? "bg-blue-500/20 border-2 border-blue-500"
                                        : "bg-gray-900/50 border border-gray-700 hover:bg-gray-700/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: colors.primary }}
                                        ></div>
                                        <span className="text-sm text-white">{team}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isStrictMode}
                                    onChange={(e) => setIsStrictMode(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <span className="text-sm font-medium text-gray-200">Enable Strict Mode</span>
                        </div>

                        <button
                            onClick={() => setShowStrictModeModal(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                        >
                            Why Strict Mode?
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={resetState}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateRoom}
                            disabled={!selectedTeam || loading}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${!selectedTeam || loading
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </div>
            )}

            {showJoinRoom && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-4 animate-fade-in">
                    {step === "input" ? (
                        <>
                            <h3 className="text-lg font-bold text-white">Enter Room ID</h3>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <input
                                type="text"
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleJoinRoomStep1()}
                                placeholder="Enter room ID"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={resetState}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleJoinRoomStep1}
                                    disabled={!roomIdInput.trim() || loading}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${!roomIdInput.trim() || loading
                                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                        }`}
                                >
                                    {loading ? "Checking..." : "Continue"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-white">Select Your Team</h3>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                                {availableTeams.map((team) => {
                                    const colors = TEAM_COLORS[team];
                                    const isSelected = selectedTeam === team;

                                    return (
                                        <button
                                            key={team}
                                            onClick={() => setSelectedTeam(team)}
                                            className={`p-3 rounded-lg transition-all text-left ${isSelected
                                                ? "bg-blue-500/20 border-2 border-blue-500"
                                                : "bg-gray-900/50 border border-gray-700 hover:bg-gray-700/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: colors.primary }}
                                                ></div>
                                                <span className="text-sm text-white">{team}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStep("input")}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={!selectedTeam || loading}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${!selectedTeam || loading
                                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                        }`}
                                >
                                    {loading ? "Joining..." : "Join Now"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <StrictModeModal
                isOpen={showStrictModeModal}
                onClose={() => setShowStrictModeModal(false)}
            />
        </div>
    );
};
