export type TeamName =
  | "Mumbai Indians"
  | "Chennai Super Kings"
  | "Sun Risers Hyderabad"
  | "Punjab Kings"
  | "Rajasthan Royals"
  | "Royal Challengers Bangalore"
  | "Kolkata Knight Riders"
  | "Delhi Capitals"
  | "Lucknow Super Gaints"
  | "Gujarat Titans";

export interface UserAuth {
  gmail: string;
  favorite_team: TeamName;
  google_sid?: string;
}

export interface AuctionRoom {
  room_id: string;
  created_at: string;
  status: string;
}

export interface Participant {
  participant_id: number;
  team_name: string;
  user_id: number;
  foreign_players_brought: number;
}

export interface TeamDetails {
  remaining_balance: number;
  total_players: number;
  total_batsmans: number;
  total_bowlers: number;
  all_rounders: number;
}

export interface PlayerDetails {
  player_id: number;
  player_name: string;
  role: string;
  brought_price: number;
}

export interface SoldPlayerOutput {
  player_id: number;
  player_name: string;
  team_name: string;
  bought_price: number;
  role: string;
}

export interface UnSoldPlayerOutput {
  player_id: number;
  player_name: string;
  role: string;
  base_price: number;
}

export interface RoomResponse {
  room_id: string;
  team_name: string;
  participant_id: number;
  message: string;
}

export interface CurrentPlayer {
  id: number;
  name: string;
  base_price: number;
  role?: string;
  is_indian: boolean;
  profile_url?: string;
  country?: string;
  pool_no?: number;
}

export interface BidUpdateMessage {
  bid_amount: number;
  team: string;
}

export interface SoldPlayerMessage {
  team_name: string;
  sold_price: number;
  remaining_balance: number;
  remaining_rtms: number;
  foreign_players_brought: number;
}

export interface NewJoinerMessage {
  participant_id: number;
  team_name: string;
  balance: number;
}

export interface OldParticipantMessage {
  id: number;
  team: string;
  balance: number;
  total_players_brought: number;
  foreign_players_brought: number;
}

export interface DisconnectedMessage {
  participant_id: number;
  team_name: string;
}

export interface ParticipantAudioMessage {
  participant_id: number;
  is_unmuted: boolean;
}

export type AuctionStatus = "pending" | "in_progress" | "stopped" | "completed" | "ended_by_host";

export interface ParticipantState {
  participant_id: number;
  team_name: string;
  balance: number;
  total_players_brought: number;
  remaining_rtms: number;
  is_bot: boolean;
  connected: boolean;
  is_unmuted: boolean;
  foreign_players_brought: number;
}

export interface SoldUnsoldState {
  page1: SoldPlayerOutput[] | UnSoldPlayerOutput[];
  page2: SoldPlayerOutput[] | UnSoldPlayerOutput[];
  currentPage: number;
  loading: boolean;
}

export interface AuctionState {
  participants: Map<number, ParticipantState>;
  currentPlayer: CurrentPlayer | null;
  previousPlayer: CurrentPlayer | null; // Store previous player for sold/unsold
  currentBid: number;
  highestBidder: string | null;
  soldPlayers: SoldUnsoldState;
  unsoldPlayers: SoldUnsoldState;
  timerRemaining: number;
  myBalance: number;
  myTeamName: string;
  myParticipantId: number;
  auctionStatus: AuctionStatus;
  isStrictMode?: boolean;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  team_name: string;
  message: string;
}

// ... existing code ...
export interface FeedBackRequest {
  feedback_type: string;
  rating_value?: number;
  title?: string;
  description?: string;
}

export interface PoolPlayer {
  id: number;
  name: string;
  base_price: number;
  country: string;
  role: string;
  previous_team: string;
  is_indian: boolean;
}

export interface PoolPlayersState {
  allPlayers: PoolPlayer[];
  currentPage: number;
  loading: boolean;
  selectedPoolId: number | null;
}
