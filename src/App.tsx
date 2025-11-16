import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LoginPage } from "./pages/LoginPage";
import { TeamSelectionPage } from "./pages/TeamSelectionPage";
import { HomePage } from "./pages/HomePage";
import { AuctionRoomPage } from "./pages/AuctionRoomPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GOOGLE_CLIENT_ID } from "./constants";
import { getAuthToken } from "./services/api";

function RootRedirect() {
  const token = getAuthToken();
  return <Navigate to={token ? "/home" : "/authentication"} replace />;
}

function AuctionRoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <Navigate to="/home" replace />;
  }

  return <AuctionRoomPage roomId={roomId} />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/authentication" element={<LoginPage />} />
          <Route
            path="/authentication/team-selection"
            element={<TeamSelectionPage />}
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/room/:roomId"
            element={
              <ProtectedRoute>
                <AuctionRoomWrapper />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
