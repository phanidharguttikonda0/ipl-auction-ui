import { API_BASE_URL } from "../constants";
import type { AuctionRoom, Participant, TeamDetails, PlayerDetails, RoomResponse, TeamName, SoldPlayerOutput, UnSoldPlayerOutput } from "../types";

export const getAuthToken = (): string | null => localStorage.getItem("auth_token");

export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);

export const clearAuthToken = () => localStorage.removeItem("auth_token");

/**
 * Handles unauthorized (401) responses by clearing auth token and redirecting to authentication
 */
const handleUnauthorized = () => {
  clearAuthToken();
  // Use window.location for navigation from API service (works outside React Router context)
  window.location.href = "/authentication";
};

/**
 * Checks response for 401 status and handles unauthorized access
 */
const checkUnauthorized = (response: Response): void => {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized - Please login again");
  }
};

const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = token;
  }
  return headers;
};

export const apiClient = {
  async continueWithGoogle(gmail: string, googleSid: string, team?: TeamName) {
    const params = new URLSearchParams();
    params.append("gmail", gmail);
    params.append("google_sid", googleSid);
    if (team) params.append("favorite_team", team);

    const response = await fetch(`${API_BASE_URL}/continue-with-google`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    // Check for authorization header first, even if response status is not ok
    // Backend might return 400 but still include auth header if user exists
    // Try multiple possible header names and case variations
    const authHeader = 
      response.headers.get("authorization") || 
      response.headers.get("Authorization") ||
      response.headers.get("AUTHORIZATION");

    console.log("API Response Status:", response.status);
    console.log("Authorization Header Present:", !!authHeader);
    console.log("Team Provided:", !!team);
    
    if (authHeader) {
      // Store the authorization token in localStorage
      setAuthToken(authHeader);
      console.log("Authorization token stored in localStorage");
      
      // Verify it was stored
      const storedToken = getAuthToken();
      if (storedToken) {
        console.log("Token verified in localStorage");
      } else {
        console.error("Token storage verification failed");
      }
      
      // If we have auth header, treat as success regardless of status code
      return { hasAuth: true };
    }

    // Check for 401 before checking other errors (except we check auth header first)
    checkUnauthorized(response);

    // If no auth header and response is not ok, check what the error is
    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, ignore - we'll use status-based handling
      }
      
      // If it's a 400 error (likely means team is required), allow user to select team
      if (response.status === 400) {
        // This is expected when team is not provided - user needs to select team
        if (errorData?.message) {
          console.log("Team selection required:", errorData.message);
        }
        return { hasAuth: false };
      }
      
      // For other errors, get error message and throw
      const errorMessage = errorData?.message || errorData?.detail || `Authentication failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // If response is ok (200) but no auth header, something is wrong
    // This should not happen - backend should send auth header on success
    console.warn("Response OK but no authorization header received");
    return { hasAuth: false };
  },

  async getAuctionsPlayed(): Promise<AuctionRoom[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/get-auctions-played`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) throw new Error("Failed to fetch auctions");
    return response.json();
  },

  async getParticipants(roomId: string): Promise<Participant[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/get-participants/${roomId}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) throw new Error("Failed to fetch participants");
    return response.json();
  },

  async getTeamDetails(participantId: number): Promise<TeamDetails> {
    const response = await fetch(`${API_BASE_URL}/players/get-team-details/${participantId}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) throw new Error("Failed to fetch team details");
    return response.json();
  },

  async getTeamPlayers(participantId: number): Promise<PlayerDetails[]> {
    const response = await fetch(`${API_BASE_URL}/players/get-team-players/${participantId}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) throw new Error("Failed to fetch team players");
    return response.json();
  },

  async createRoom(teamName: TeamName): Promise<RoomResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/create-room/${encodeURIComponent(teamName)}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create room" }));
      throw new Error(error.message || "Failed to create room");
    }

    return response.json();
  },

  async joinRoomGetTeams(roomId: string): Promise<string | TeamName[] | any> {
    const response = await fetch(`${API_BASE_URL}/rooms/join-room-get-teams/${roomId}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) {
      // Try to get error message from response
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
        errorData = { message: response.statusText || "Failed to fetch available teams" };
      }
      
      // If error has message, return it or throw with that message
      if (errorData?.message) {
        // If it's "Already a participant", return the full error object
        if (errorData.message.includes("Already a participant") || errorData.participant_id) {
          return errorData;
        }
        // Otherwise throw with the backend message
        throw new Error(errorData.message);
      }
      
      throw new Error(errorData?.detail || "Failed to fetch available teams");
    }

    return response.json();
  },

  async joinRoom(roomId: string, teamName: TeamName): Promise<RoomResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/join-room/${roomId}/${encodeURIComponent(teamName)}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to join room" }));
      throw new Error(error.message || "Failed to join room");
    }

    return response.json();
  },

  async getSoldPlayers(roomId: string, pageNo: number, offset: number = 10): Promise<SoldPlayerOutput[]> {
    const response = await fetch(`${API_BASE_URL}/players/get-sold-players/${roomId}/${pageNo}/${offset}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) {
      throw new Error("Failed to fetch sold players");
    }

    return response.json();
  },

  async getUnsoldPlayers(roomId: string, pageNo: number, offset: number = 10): Promise<UnSoldPlayerOutput[]> {
    const response = await fetch(`${API_BASE_URL}/players/get-unsold-players/${roomId}/${pageNo}/${offset}`, {
      headers: getHeaders(),
    });

    checkUnauthorized(response);
    if (!response.ok) {
      throw new Error("Failed to fetch unsold players");
    }

    return response.json();
  },
};

export function getUserIdFromAuthToken(): number | null {
  try {
    const rawToken = getAuthToken(); // your existing function
    console.log(rawToken, " here is the token");
    if (!rawToken) return null;

    // Remove "Bearer "
    const token = rawToken.startsWith("Bearer ")
      ? rawToken.split(" ")[1]
      : rawToken;

    console.log(token, " cleaned token");

    // Split JWT into 3 parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format:", token);
      return null;
    }

    // Only decode the payload (2nd part)
    const payloadBase64Url = parts[1];
    console.log(payloadBase64Url, " payload base64url");

    // Convert base64url → base64
    const payloadBase64 = payloadBase64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(payloadBase64Url.length + (4 - (payloadBase64Url.length % 4)) % 4, "=");

    console.log(payloadBase64, " normalized payload base64");

    // Decode token payload
    const decodedPayload = atob(payloadBase64);
    console.log(decodedPayload, " decoded payload");

    // Parse JSON
    const authObj = JSON.parse(decodedPayload);
    console.log(authObj, " here is the auth obj");

    return authObj.user_id ?? null;

  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
}

