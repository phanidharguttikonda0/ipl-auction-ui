import { jwtDecode } from "jwt-decode";
import type { UserAuth } from "./types";

interface DecodedToken extends UserAuth {
  exp?: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
};

export const getStoredUser = (): UserAuth | null => {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return { gmail: decoded.gmail, favorite_team: decoded.favorite_team };
};
