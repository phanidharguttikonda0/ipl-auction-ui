import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { RulesPanel } from "../components/RulesPanel";
import { UserProfile } from "../components/UserProfile";
import { AuctionHistory } from "../components/AuctionHistory";
import { RoomActions } from "../components/RoomActions";
import { DonateModal } from "../components/DonateModal";
import { getStoredUser } from "../utils";
import { clearAuthToken } from "../services/api";

export const HomePage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [showDonateModal, setShowDonateModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/authentication", { replace: true });
    }
  }, [user, navigate]);

  const handleEnterAuction = useCallback(
    (roomId: string, participantId: number, teamName: string) => {
      navigate(`/home/room/${roomId}`, {
        state: { participantId, teamName },
      });
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    clearAuthToken();
    navigate("/authentication", { replace: true });
  }, [navigate]);

  const handleEditTeam = useCallback(() => {
    if (user) {
      // Navigate to team selection with current user details to allow "editing"
      // We pass a dummy sid or handle it in TeamSelectionPage if needed, but standard flow uses gmail/sid
      // Since we don't have the original googleSid stored in localStorage (only token), 
      // we might need to rely on the backend recognizing the update for the email, or re-auth.
      // However, usually "edit" implies just picking a new team for the *current* session/user.
      // Let's check TeamSelectionPage. It takes gmail/googleSid.
      // If we don't have googleSid stored, we can't easily re-use the exact same API call `continueWithGoogle` 
      // without re-login unless we change the API or the page logic.

      // OPTION 1: Re-use TeamSelectionPage but we need 'googleSid'.
      // The `UserAuth` type in `types.ts` only has `gmail` and `favorite_team`. 
      // So `getStoredUser` doesn't return `google_sid`.

      // If the goal is just to change the team locally and on backend for the *authenticated* user:
      // We might need a new API endpoint `updateFavoriteTeam` or modify `TeamSelectionPage` to support "update mode" with an auth token.

      // Let's assume we want to send them to TeamSelectionPage. 
      // If we lack googleSid, we can't use `continueWithGoogle` as is.
      // CHECK: `apiClient.continueWithGoogle` takes `gmail`, `googleSid`.

      // WORKAROUND: For now, let's navigate them there. If we don't have SID, we might need to decode it from token if it's there?
      // `utils.ts` decodes token. Let's see if 'sub' (google sid) is in the token.
      // `getStoredUser` only picks gmail/team. 
      // We should check `decodeToken` usage.

      // Let's look at `utils.ts` again. It returns `DecodedToken` which extends `UserAuth`.
      // `UserAuth` is just `gmail` and `favorite_team`. `DecodedToken` adds `exp`.
      // The actual JWT from backend likely contains `sub` (which is usually user_id or google_sid).
      // `getUserIdFromAuthToken` in `api.ts` shows `decodedPayload` is logged.

      // Let's try to pass `user.gmail` and a placeholder or try to extract `sub` if possible. 
      // Better approach: Modify `TeamSelectionPage` to accept an `isEditMode` flag where it uses the *existing* Auth Token 
      // to call a new or modified API endpoint, OR just extraction 'sub' if the token has it.

      // Let's try navigating for now, and we will update TeamSelectionPage to handle "already logged in" state.
      navigate("/authentication/team-selection", {
        state: {
          isEditMode: true,
          gmail: user.gmail,
          googleSid: user.google_sid
        },
      });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Hero Section */}
        <header className="pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="space-y-2 animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold">
                <span className="gradient-text-ipl">IPL</span>
                <span className="text-white"> Auction</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl animate-fade-in-up delay-100">
                Experience the thrill of building your dream cricket team in real-time multiplayer auctions
              </p>
            </div>

            <button
              onClick={() => setShowDonateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-size-200 hover:bg-right-bottom text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 group self-start sm:self-auto animate-fade-in-up delay-200"
              style={{ backgroundSize: '200% 100%', backgroundPosition: 'left bottom' }}
            >
              <Heart className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              <span>Support This Project</span>
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up delay-300">
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium text-blue-300">🏏 Live Multiplayer</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium text-purple-300">⚡ Real-time Bidding</span>
            </div>
            <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium text-orange-300">🎯 Strategic Gameplay</span>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* Left Sidebar - Rules & Feedback */}
          <div className="lg:col-span-3 space-y-6 order-3 lg:order-1">
            <div className="animate-slide-in-left delay-400">
              <RulesPanel />
            </div>
          </div>

          {/* Center Column - Primary Actions & History */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            {/* Room Actions - Primary CTA */}
            <div className="animate-fade-in-up delay-100">
              <RoomActions onRoomReady={handleEnterAuction} />
            </div>

            {/* User Profile */}
            <div className="animate-fade-in-up delay-200">
              <UserProfile
                email={user.gmail}
                favoriteTeam={user.favorite_team}
                onLogout={handleLogout}
                onEditTeam={handleEditTeam}
              />
            </div>

            {/* Auction History */}
            <div className="animate-fade-in-up delay-300">
              <AuctionHistory />
            </div>
          </div>

          {/* Right Sidebar - Quick Stats or Additional Info */}
          <div className="lg:col-span-3 order-2 lg:order-3">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Quick Start Guide Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all duration-300 animate-slide-in-right delay-400">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  Quick Start
                </h3>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-semibold text-xs">1</span>
                    <span>Create a new auction room or join an existing one</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-semibold text-xs">2</span>
                    <span>Select your favorite IPL team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-semibold text-xs">3</span>
                    <span>Wait for other players to join</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-semibold text-xs">4</span>
                    <span>Start bidding and build your dream team!</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
    </div>
  );
};
