import { useCallback, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Users } from "lucide-react";
import { apiClient } from "../services/api";

interface LoginPageProps {
  onSuccess: () => void;
  onNeedTeamSelection: (gmail: string, googleSid: string) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface DecodedGoogle {
  email: string;
  sub: string;
}

export const LoginPage = ({ onSuccess, onNeedTeamSelection }: LoginPageProps) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("No credential received from Google");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const decoded = jwtDecode<DecodedGoogle>(response.credential);
        const gmail = decoded.email;
        const googleSid = decoded.sub;

        const result = await apiClient.continueWithGoogle(gmail, googleSid);

        if (result.hasAuth) {
          onSuccess();
        } else {
          onNeedTeamSelection(gmail, googleSid);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onNeedTeamSelection]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">IPL Auction</h1>
            <p className="text-gray-400 text-sm">Welcome to the ultimate auction experience</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center">
            {loading ? (
              <div className="w-full py-4 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-3 text-sm">Authenticating...</p>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google authentication failed")}
                useOneTap={false}
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to participate in the IPL Auction platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
