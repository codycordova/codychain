/**
 * Frontend authentication utilities.
 */
"use client";

const SESSION_TOKEN_KEY = "codychain_session_token";
const USERNAME_KEY = "codychain_username";

export interface AuthState {
  sessionToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
}

/**
 * Get current authentication state from localStorage.
 */
export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { sessionToken: null, username: null, isAuthenticated: false };
  }

  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
  const username = localStorage.getItem(USERNAME_KEY);

  return {
    sessionToken,
    username,
    isAuthenticated: !!sessionToken && !!username,
  };
}

/**
 * Save authentication state to localStorage.
 */
export function saveAuthState(sessionToken: string, username: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * Clear authentication state from localStorage.
 */
export function clearAuthState(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

/**
 * Get session token for API requests.
 */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Logout function that clears auth state.
 * Call this when user explicitly logs out.
 */
export function logout(): void {
  clearAuthState();
  // Trigger a page refresh to update UI
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

