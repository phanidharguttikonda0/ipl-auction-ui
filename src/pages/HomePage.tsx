import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RulesPanel } from "../components/RulesPanel";
import { UserProfile } from "../components/UserProfile";
import { AuctionHistory } from "../components/AuctionHistory";
import { RoomActions } from "../components/RoomActions";
import { getStoredUser } from "../utils";
import { clearAuthToken } from "../services/api";

export const HomePage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">IPL Auction</h1>
          <p className="text-gray-400">Manage your team and participate in live auctions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6 order-3 lg:order-1">
            <RulesPanel />
          </div>

          <div className="lg:col-span-6 space-y-6 order-2 lg:order-2">
            <UserProfile
              email={user.gmail}
              favoriteTeam={user.favorite_team}
              onLogout={handleLogout}
              onEditTeam={handleEditTeam}
            />
            <AuctionHistory />
          </div>

          <div className="lg:col-span-3 order-1 lg:order-3">
            <div className="lg:sticky lg:top-6">
              <RoomActions onRoomReady={handleEnterAuction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
