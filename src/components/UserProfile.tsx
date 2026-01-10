import { Mail, LogOut, Edit2 } from "lucide-react";
import { TEAM_COLORS, TEAM_LOGOS } from "../constants";
import type { TeamName } from "../types";

interface UserProfileProps {
  email: string;
  favoriteTeam: TeamName;
  onLogout: () => void;
  onEditTeam: () => void;
}

export const UserProfile = ({ email, favoriteTeam, onLogout, onEditTeam }: UserProfileProps) => {
  const teamColors = TEAM_COLORS[favoriteTeam];

  return (
    <div className="relative group">
      {/* Gradient Border Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur"></div>

      <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Your Profile
          </h2>
          <button
            onClick={onLogout}
            className="p-2.5 hover:bg-red-500/10 rounded-xl transition-all duration-200 group/logout border border-transparent hover:border-red-500/30"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover/logout:text-red-400 transition-colors" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Email Section */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm text-white truncate font-medium bg-gray-700/30 px-3 py-1.5 rounded-lg border border-gray-600/30">{email}</p>
            </div>
          </div>

          {/* Favorite Team Section */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 p-2 border-2 transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: `${teamColors?.primary}15`,
                borderColor: `${teamColors?.primary}40`
              }}
            >
              <img
                src={TEAM_LOGOS[favoriteTeam]}
                alt={favoriteTeam}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Favorite Team</p>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-lg border font-semibold text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: `${teamColors?.primary}10`,
                    borderColor: `${teamColors?.primary}30`,
                    color: teamColors?.primary
                  }}
                >
                  <span>{favoriteTeam}</span>
                </div>
                <button
                  onClick={onEditTeam}
                  className="group/edit relative p-2 rounded-xl transition-all duration-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30"
                  title="Change Favorite Team"
                >
                  <div className="absolute inset-0 rounded-xl bg-blue-400/10 blur-md opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                  <Edit2 className="relative w-4 h-4 text-gray-400 group-hover/edit:text-blue-300 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
