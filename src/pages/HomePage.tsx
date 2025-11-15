import { useCallback } from "react";
import { RulesPanel } from "../components/RulesPanel";
import { UserProfile } from "../components/UserProfile";
import { AuctionHistory } from "../components/AuctionHistory";
import { RoomActions } from "../components/RoomActions";
import type { UserAuth } from "../types";

interface HomePageProps {
  user: UserAuth;
  onLogout: () => void;
  onEnterAuction: (roomId: string, participantId: number, teamName: string) => void;
}

export const HomePage = ({ user, onLogout, onEnterAuction }: HomePageProps) => {
  const handleEnterAuction = useCallback((roomId: string, participantId: number, teamName: string) => {
    onEnterAuction(roomId, participantId, teamName);
  }, [onEnterAuction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">IPL Auction</h1>
          <p className="text-gray-400">Manage your team and participate in live auctions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <RulesPanel />
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <UserProfile
              email={user.gmail}
              favoriteTeam={user.favorite_team}
              onLogout={onLogout}
            />
            <AuctionHistory />
          </div>

          <div className="lg:col-span-3 order-3">
            <div className="sticky top-6">
              <RoomActions onRoomReady={handleEnterAuction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
