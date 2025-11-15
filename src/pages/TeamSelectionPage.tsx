import { useState, useCallback } from "react";
import { Shield, CheckCircle2 } from "lucide-react";
import { apiClient } from "../services/api";
import { TEAMS, TEAM_COLORS } from "../constants";
import type { TeamName } from "../types";

interface TeamSelectionPageProps {
  gmail: string;
  googleSid: string;
  onSuccess: () => void;
}

export const TeamSelectionPage = ({
  gmail,
  googleSid,
  onSuccess,
}: TeamSelectionPageProps) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = useCallback(async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      setError("");
      await apiClient.continueWithGoogle(gmail, googleSid, selectedTeam);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save team selection");
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, gmail, googleSid, onSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 overflow-auto">
      <div className="max-w-5xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Team</h1>
          <p className="text-gray-400">Select your favorite IPL team to continue</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {TEAMS.map((team) => {
            const colors = TEAM_COLORS[team];
            const isSelected = selectedTeam === team;

            return (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`relative p-6 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-gray-800/80 scale-105"
                    : "bg-gray-800/50 hover:bg-gray-800/70"
                } border border-gray-700 group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <h3 className="text-white font-semibold text-left text-sm line-clamp-2">{team}</h3>
                <div className="mt-3 flex gap-1">
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{ backgroundColor: colors.secondary }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedTeam || loading}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              !selectedTeam || loading
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
