import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Trophy } from "lucide-react";
import { apiClient } from "../services/api";
import { LandingContent } from "../components/LandingContent";

interface GoogleCredentialResponse {
  credential?: string;
}

interface DecodedGoogle {
  email: string;
  sub: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
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
          navigate("/home");
        } else {
          navigate("/authentication/team-selection", {
            state: { gmail, googleSid },
          });
        }
      } catch (err) {
        console.error("Authentication error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "object" && err !== null && "message" in err) {
          setError(String(err.message));
        } else {
          setError("Authentication failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleGoogleError = useCallback(() => {
    setError("Google authentication failed. Please ensure your origin is authorized in Google Cloud Console.");
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      {/* Main Grid Layout */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* Left Panel - Authentication */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md animate-slide-in-left">

            {/* Logo & Brand */}
            <div className="mb-10">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">IPL Auction</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Welcome back
              </h1>
              <p className="text-slate-400 text-lg">
                Sign in to continue your auction journey
              </p>
            </div>

            {/* Auth Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Google Sign In */}
              <div className="space-y-4">
                {loading ? (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center space-x-3">
                      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-300 font-medium">Authenticating...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        theme="filled_black"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                      />
                    </div>

                    {/* Divider */}
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 text-xs text-slate-500 bg-[#0a0e27]/50">
                          SECURE AUTHENTICATION
                        </span>
                      </div>
                    </div>

                    {/* Info Text */}
                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                      By continuing, you agree to our terms and join the most advanced IPL auction platform
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Additional Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                New user?{" "}
                <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
                  Explore features →
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Landing Content (Desktop Only) */}
        <div className="hidden lg:flex items-center">
          <div className="w-full h-full animate-slide-in-right">
            <LandingContent />
          </div>
        </div>
      </div>

      {/* Mobile Features Section */}
      <div className="lg:hidden px-6 pb-16 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Why Choose IPL Auction?
            </h2>
            <ul className="space-y-3">
              {[
                "Create or join private auction rooms with friends",
                "Pick your favorite IPL team and build a squad",
                "Bid live with 100 Crore budget per team",
                "Build a complete squad of 15-25 players",
              ].map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
