import { useState, useCallback } from "react";
import { ArrowLeft, Wifi, WifiOff, AlertCircle, Gavel } from "lucide-react";
import { useAuctionWebSocket } from "../hooks/useAuctionWebSocket";
import { PlayerCard } from "../components/auction/PlayerCard";
import { ParticipantsList } from "../components/auction/ParticipantsList";
import { AuctionControls } from "../components/auction/AuctionControls";
import { SoldUnsoldList } from "../components/auction/SoldUnsoldList";
import { Toast, type ToastType } from "../components/Toast";

interface AuctionRoomPageProps {
  roomId: string;
  participantId: number;
  teamName: string;
  onBack: () => void;
}

export const AuctionRoomPage = ({
  roomId,
  participantId,
  teamName,
  onBack,
}: AuctionRoomPageProps) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleMessage = useCallback((message: string) => {
    if (message.toLowerCase().includes("sold")) {
      setToast({ message, type: "success" });
    } else if (message.toLowerCase().includes("unsold")) {
      setToast({ message, type: "warning" });
    } else if (message.toLowerCase().includes("error") || message.toLowerCase().includes("fail")) {
      setToast({ message, type: "error" });
    } else {
      setToast({ message, type: "info" });
    }
  }, []);

  const { connected, auctionState, startAuction, placeBid, endAuction } =
    useAuctionWebSocket({
      roomId,
      participantId,
      teamName,
      onConnectionError: (error) => setToast({ message: error, type: "error" }),
      onMessage: handleMessage,
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Auction Room
                </h1>
                <p className="text-sm text-gray-400">Room ID: {roomId}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  connected
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-red-500/20 border border-red-500/50"
                }`}
              >
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      Disconnected
                    </span>
                  </>
                )}
              </div>

              <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-sm font-semibold text-blue-400">{teamName}</p>
              </div>
            </div>
          </div>
        </header>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={3000}
            onClose={() => setToast(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-6">
              <ParticipantsList
                participants={auctionState.participants}
                myParticipantId={participantId}
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            {auctionState.currentPlayer ? (
              <PlayerCard
                player={auctionState.currentPlayer}
                currentBid={auctionState.currentBid}
                highestBidder={auctionState.highestBidder}
                timerRemaining={auctionState.timerRemaining}
              />
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                  <Gavel className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {auctionState.auctionStatus === "completed"
                    ? "Auction Completed"
                    : auctionState.auctionStatus === "stopped"
                    ? "Auction Paused"
                    : "Waiting to Start"}
                </h3>
                <p className="text-gray-400">
                  {auctionState.auctionStatus === "completed"
                    ? "Thank you for participating!"
                    : auctionState.auctionStatus === "stopped"
                    ? "Need minimum 3 participants to continue"
                    : "Press Start Auction to begin"}
                </p>
              </div>
            )}

            <AuctionControls
              auctionStatus={auctionState.auctionStatus}
              participantCount={auctionState.participants.size}
              myBalance={auctionState.myBalance}
              currentBid={auctionState.currentBid}
              onStart={startAuction}
              onBid={placeBid}
              onEnd={endAuction}
            />
          </div>

          <div className="lg:col-span-3 order-3">
            <div className="sticky top-6">
              <SoldUnsoldList
                soldPlayers={auctionState.soldPlayers}
                unsoldPlayers={auctionState.unsoldPlayers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
