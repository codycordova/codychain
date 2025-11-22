"use client";

import { useState, useEffect } from "react";
import { postMine, getDevUsers, getUserAddress, type Block } from "@/lib/api";
import { getAuthState, getSessionToken } from "@/lib/auth";
import LoginModal from "@/components/LoginModal";
import TxCard from "@/components/TxCard";

export default function MinePage() {
  const [minedBlock, setMinedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minerAddress, setMinerAddress] = useState<string>("");
  const [devUsers, setDevUsers] = useState<Record<string, string>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    async function loadDevUsers() {
      try {
        const response = await getDevUsers();
        setDevUsers(response.users);
      } catch (err) {
        console.error("Failed to load dev users:", err);
      }
    }
    
    async function checkAuth() {
      const authState = getAuthState();
      
      // If we have a session token, verify it's still valid
      if (authState.sessionToken) {
        try {
          const { verifySession } = await import("@/lib/api");
          const verifyResult = await verifySession(authState.sessionToken);
          if (verifyResult.authenticated) {
            setIsAuthenticated(true);
            setUsername(verifyResult.username);
            // Load user address
            if (verifyResult.username) {
              const addressData = await getUserAddress(verifyResult.username);
              setUserAddress(addressData.address);
              setMinerAddress(addressData.address);
            }
            return;
          }
        } catch (err) {
          // Session invalid, clear it
          console.error("Session verification failed:", err);
          const { clearAuthState } = await import("@/lib/auth");
          clearAuthState();
        }
      }
      
      // Not authenticated or session invalid
      setIsAuthenticated(false);
      setShowLoginModal(true);
    }
    
    checkAuth();
    loadDevUsers();
  }, []);

  async function handleMine() {
    if (!isAuthenticated || !userAddress) {
      setShowLoginModal(true);
      return;
    }

    // Only allow mining with logged-in user's address
    if (minerAddress && minerAddress !== userAddress) {
      setError(`You can only mine with your own address (${userAddress}). You are logged in as ${username}.`);
      setMinerAddress(userAddress);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sessionToken = getSessionToken();
      // Force use of logged-in user's address
      const response = await postMine(userAddress, sessionToken || undefined);
      setMinedBlock(response.block);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mine block";
      setError(errorMessage);
      setMinedBlock(null);
      
      // If authentication error, clear auth state and show login modal
      if (errorMessage.includes("Authentication") || errorMessage.includes("401") || errorMessage.includes("Invalid or expired session")) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        // Clear auth state
        const { clearAuthState } = await import("@/lib/auth");
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLoginSuccess() {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    const authState = getAuthState();
    setUsername(authState.username);
    if (authState.username) {
      getUserAddress(authState.username)
        .then((data) => {
          setUserAddress(data.address);
          setMinerAddress(data.address);
        })
        .catch((err) => {
          console.error("Failed to get user address:", err);
        });
    }
  }

  const timestamp = minedBlock ? new Date(minedBlock.timestamp).toLocaleString() : null;

  return (
    <div>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          if (isAuthenticated) {
            setShowLoginModal(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
      />
      <h1 className="text-3xl font-bold mb-6">Mine Block</h1>
      {isAuthenticated && userAddress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Mining as: <span className="font-mono font-semibold">{username}</span> ({userAddress})
          </p>
        </div>
      )}
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl mb-6 space-y-4">
        {isAuthenticated && userAddress ? (
          <div>
            <label htmlFor="miner-address" className="block text-sm font-medium text-gray-700 mb-2">
              Miner Address (to receive rewards)
            </label>
            <input
              id="miner-address"
              type="text"
              value={userAddress}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500">
              You can only mine with your own address ({userAddress}) since you're logged in as {username}.
              <br />
              <span className="text-xs">
                Reward distribution: 55% chance 0.1-0.5, 25% chance 0.6-0.7, 10% chance 0.8-0.9, 10% chance 1.0-1.4 Coco
              </span>
            </p>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-600">Please log in to mine blocks.</p>
          </div>
        )}
        <button
          onClick={handleMine}
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Mining..." : "Mine Block"}
        </button>
      </div>
      {error && (
        <div className="bg-white border border-red-300 rounded-lg p-6 max-w-2xl mb-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      {minedBlock && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Mined Block</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Index</p>
              <p className="font-mono text-lg">{minedBlock.index}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Timestamp</p>
              <p className="text-lg">{timestamp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Previous Hash</p>
              <p className="font-mono text-sm break-all">{minedBlock.previous_hash}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hash</p>
              <p className="font-mono text-sm break-all">{minedBlock.hash}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nonce</p>
              <p className="font-mono text-lg">{minedBlock.nonce}</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4">
                Transactions ({minedBlock.transactions?.length || 0})
              </h3>
              {minedBlock.transactions && minedBlock.transactions.length > 0 ? (
                <div className="space-y-3">
                  {minedBlock.transactions.map((tx, idx) => (
                    <TxCard key={idx} transaction={tx} index={idx} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No transactions in this block</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

