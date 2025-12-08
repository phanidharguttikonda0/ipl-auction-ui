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
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Profile</h2>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Email</p>
            <p className="text-sm text-white truncate font-medium">{email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 p-1.5"
            style={{ backgroundColor: `${teamColors?.primary}33` }}
          >
            <img
              src={TEAM_LOGOS[favoriteTeam]}
              alt={favoriteTeam}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Favorite Team</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white font-medium">{favoriteTeam}</p>
              <button
                onClick={onEditTeam}
                className="group relative p-1.5 rounded-lg transition-all duration-300 hover:bg-blue-500/20"
                title="Change Favorite Team"
              >
                <div className="absolute inset-0 rounded-lg bg-blue-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Edit2 className="relative w-3.5 h-3.5 text-gray-400 group-hover:text-blue-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
