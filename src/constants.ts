import type { TeamName } from "./types";

export const TEAMS: TeamName[] = [
  "Mumbai Indians",
  "Chennai Super Kings",
  "Sun Risers Hyderabad",
  "Punjab Kings",
  "Rajasthan Royals",
  "Royal Challengers Bangalore",
  "Kolkata Knight Riders",
  "Delhi Capitals",
  "Lucknow Super Gaints",
  "Gujarat Titans",
];

export const TEAM_COLORS: Record<TeamName, { primary: string; secondary: string; light: string }> = {
  "Mumbai Indians": { primary: "#004BA0", secondary: "#D1AB3E", light: "#0066D6" },
  "Chennai Super Kings": { primary: "#FDB913", secondary: "#004BA0", light: "#FFE135" },
  "Sun Risers Hyderabad": { primary: "#FF6600", secondary: "#000000", light: "#FF8533" },
  "Punjab Kings": { primary: "#DD1F2D", secondary: "#C0C0C0", light: "#FF1F3D" },
  "Rajasthan Royals": { primary: "#254AA5", secondary: "#E94B8B", light: "#3D5AB4" },
  "Royal Challengers Bangalore": { primary: "#D32F2F", secondary: "#000000", light: "#FF3333" },
  "Kolkata Knight Riders": { primary: "#3A225D", secondary: "#B3A123", light: "#5A3A8D" },
  "Delhi Capitals": { primary: "#004C93", secondary: "#EF1B23", light: "#0066CC" },
  "Lucknow Super Gaints": { primary: "#1C8ACE", secondary: "#F6C033", light: "#24A8E8" },
  "Gujarat Titans": { primary: "#1C2841", secondary: "#6CACE4", light: "#2C3A6E" },
};

export const AUCTION_RULES = [
  "Minimum 3 participants required to start auction",
  "Each team must have minimum 15 players in squad",
  "Starting budget: 100 Crores per team",
  "Maximum squad size: 25 players",
  "Bid increments based on current bid amount",
  "Team can bid only if they have sufficient balance",
];

export const UPCOMING_FEATURES = [
  "Introducing RTM soon [done] ",
  "No retained players (implementing in future)",
  "Custom bid time configuration",
  "Automatic unsold when everyone clicks not interested",
  "Managing players into different pools",
  "Auto-allocation after 14 players purchased",
  "Unsold players list and stop current list",
  "WebRTC implementation for future",
  "Loading profile pictures from email",
  "Foreign player buying limits",
  "Auction pausing capability [done]",
];

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
