import { useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { HomePage } from "./pages/HomePage";
import { AuctionRoomPage } from "./pages/AuctionRoomPage";
import { getStoredUser, decodeToken } from "./utils";
import { GOOGLE_CLIENT_ID } from "./constants";
import { clearAuthToken, getAuthToken } from "./services/api";
import type { UserAuth } from "./types";

type AppView = "login" | "team-selection" | "home" | "auction";

interface AuctionRoomData {
  roomId: string;
  participantId: number;
  teamName: string;
}

interface GoogleCredentials {
  gmail: string;
  googleSid: string;
}

function AppContent() {
  const [view, setView] = useState<AppView>("login");
  const [user, setUser] = useState<UserAuth | null>(null);
  const [googleCredentials, setGoogleCredentials] = useState<GoogleCredentials | null>(null);
  const [auctionRoom, setAuctionRoom] = useState<AuctionRoomData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setView("home");
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setView("home");
    }
  }, []);

  const handleNeedTeamSelection = useCallback((gmail: string, googleSid: string) => {
    setGoogleCredentials({ gmail, googleSid });
    setView("team-selection");
  }, []);

  const handleTeamSelectionSuccess = useCallback(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setView("home");
    }
  }, []);

  const handleEnterAuction = useCallback(
    (roomId: string, participantId: number, teamName: string) => {
      setAuctionRoom({ roomId, participantId, teamName });
      setView("auction");
    },
    []
  );

  const handleBackFromAuction = useCallback(() => {
    setAuctionRoom(null);
    setView("home");
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setView("login");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <LoginPage
        onSuccess={handleLoginSuccess}
        onNeedTeamSelection={handleNeedTeamSelection}
      />
    );
  }

  if (view === "team-selection" && googleCredentials) {
    return (
      <TeamSelectionPage
        gmail={googleCredentials.gmail}
        googleSid={googleCredentials.googleSid}
        onSuccess={handleTeamSelectionSuccess}
      />
    );
  }

  if (view === "auction" && auctionRoom) {
    return (
      <AuctionRoomPage
        roomId={auctionRoom.roomId}
        participantId={auctionRoom.participantId}
        teamName={auctionRoom.teamName}
        onBack={handleBackFromAuction}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HomePage
      user={user}
      onLogout={handleLogout}
      onEnterAuction={handleEnterAuction}
    />
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}

export default App;
