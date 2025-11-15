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
    if (team) params.append("team", team);

    const response = await fetch(`${API_BASE_URL}/continue-with-google`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const authHeader = response.headers.get("authorization");
    if (authHeader) setAuthToken(authHeader);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Authentication failed" }));
      throw new Error(error.message || "Failed to authenticate");
    }

    return { hasAuth: !!authHeader };
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

  async joinRoomGetTeams(roomId: string): Promise<string | TeamName[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/join-room-get-teams/${roomId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.message?.includes("Already a participant")) {
        return error;
      }
      throw new Error("Failed to fetch available teams");
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
