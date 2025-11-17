import { API_BASE_URL } from "../constants";
import type { AuctionRoom, Participant, TeamDetails, PlayerDetails, RoomResponse, TeamName } from "../types";

export const getAuthToken = (): string | null => localStorage.getItem("auth_token");

export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);

export const clearAuthToken = () => localStorage.removeItem("auth_token");

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

    if (!response.ok) throw new Error("Failed to fetch auctions");
    return response.json();
  },

  async getParticipants(roomId: string): Promise<Participant[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/get-participants/${roomId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error("Failed to fetch participants");
    return response.json();
  },

  async getTeamDetails(participantId: number): Promise<TeamDetails> {
    const response = await fetch(`${API_BASE_URL}/players/get-team-details/${participantId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error("Failed to fetch team details");
    return response.json();
  },

  async getTeamPlayers(participantId: number): Promise<PlayerDetails[]> {
    const response = await fetch(`${API_BASE_URL}/players/get-team-players/${participantId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error("Failed to fetch team players");
    return response.json();
  },

  async createRoom(teamName: TeamName): Promise<RoomResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/create-room/${encodeURIComponent(teamName)}`, {
      headers: getHeaders(),
    });

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to join room" }));
      throw new Error(error.message || "Failed to join room");
    }

    return response.json();
  },
};
