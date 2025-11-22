"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthState, clearAuthState, type AuthState } from "@/lib/auth";
import { logout as apiLogout } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  // Start with unauthenticated state to match SSR
  const [authState, setAuthState] = useState<AuthState>({
    sessionToken: null,
    username: null,
    isAuthenticated: false,
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only check auth state after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setAuthState(getAuthState());
  }, []);

  // Refresh auth state when pathname changes (only after mount)
  useEffect(() => {
    if (mounted) {
      setAuthState(getAuthState());
    }
  }, [pathname, mounted]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      const sessionToken = authState.sessionToken;
      
      // Call backend logout if we have a session token
      if (sessionToken) {
        try {
          await apiLogout(sessionToken);
        } catch (err) {
          // Even if backend logout fails, clear local state
          console.error("Backend logout failed:", err);
        }
      }
      
      // Clear local auth state
      clearAuthState();
      setAuthState({ sessionToken: null, username: null, isAuthenticated: false });
      
      // Redirect to home or current page to trigger login modal if needed
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-lg font-semibold text-gray-900 hover:text-gray-700"
            >
              Codychain Explorer
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/explorer"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/explorer"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Explorer
            </Link>
            <Link
              href="/balances"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/balances"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Balances
            </Link>
            <Link
              href="/send"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/send"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Send
            </Link>
            <Link
              href="/mine"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                pathname === "/mine"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Mine
            </Link>
            {mounted && authState.isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-600">
                  Logged in as <span className="font-semibold">{authState.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : mounted ? (
              <div className="ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-500">Not logged in</span>
              </div>
            ) : (
              <div className="ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

