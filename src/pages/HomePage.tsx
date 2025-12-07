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
