"use client";

import { useState, useEffect } from "react";
import { postTransaction, getUserAddress, getDevUsers } from "@/lib/api";
import { getAuthState, getSessionToken } from "@/lib/auth";
import LoginModal from "@/components/LoginModal";

export default function SendPage() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [devUsers, setDevUsers] = useState<Record<string, string>>({});

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isAuthenticated || !userAddress) {
      setError("Please log in first");
      setShowLoginModal(true);
      return;
    }

    if (!receiver.trim() || !amount.trim()) {
      setError("All fields are required");
      return;
    }

    if (!privateKey.trim()) {
      setError("Private key is required to sign the transaction");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    try {
      setLoading(true);
      
      // Sign the transaction
      const timestamp = new Date().toISOString();
      const signature = await signTransaction(userAddress, receiver.trim(), amountNum, privateKey.trim(), timestamp);
      const sessionToken = getSessionToken();
      
      await postTransaction(userAddress, receiver.trim(), amountNum, signature, timestamp, sessionToken || undefined);
      setSuccess(true);
      setReceiver("");
      setAmount("");
      // Don't clear private key - user might want to send again
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create transaction";
      setError(errorMessage);
      
      // If authentication error, clear auth state and show login modal
      if (errorMessage.includes("Authentication") || errorMessage.includes("401") || errorMessage.includes("Invalid or expired session")) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        const { clearAuthState } = await import("@/lib/auth");
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  }

  async function signTransaction(sender: string, receiver: string, amount: number, privateKeyHex: string, timestamp: string): Promise<string> {
    try {
      const nacl = await import("tweetnacl");
      
      // Format amount to match Python's float formatting (e.g., 3.0 not 3, 3.5 stays 3.5)
      // Python formats floats with decimal point, so we need to ensure consistency
      const amountStr = amount % 1 === 0 ? amount.toFixed(1) : amount.toString();
      
      // Create message to sign: hash of transaction data
      // Must match Python format exactly: f"{sender}:{receiver}:{amount}:{timestamp}"
      const message = `${sender}:${receiver}:${amountStr}:${timestamp}`;
      
      // Hash the message using SHA-256 (same as Python's hashlib.sha256)
      const messageHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
      const messageHashHex = Array.from(new Uint8Array(messageHash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      // Convert hex private key to Uint8Array
      // Python's pynacl stores keys as 64-byte secret keys (32-byte seed + 32-byte public key)
      // But users might enter just the 32-byte seed
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      let signingKey: nacl.SigningKey;
      
      if (privateKeyBytes.length === 64) {
        // Full 64-byte secret key (seed + public key)
        signingKey = nacl.sign.keyPair.fromSecretKey(privateKeyBytes);
      } else if (privateKeyBytes.length === 32) {
        // Just the 32-byte seed - generate keypair from seed
        signingKey = nacl.sign.keyPair.fromSeed(privateKeyBytes);
      } else {
        throw new Error(`Invalid private key length: expected 32 bytes (64 hex chars) or 64 bytes (128 hex chars), got ${privateKeyBytes.length} bytes (${privateKeyHex.length} hex chars)`);
      }
      
      // Sign the message hash (as hex string, convert to bytes)
      const messageHashBytes = new Uint8Array(
        messageHashHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const signature = nacl.sign.detached(messageHashBytes, signingKey.secretKey);
      
      // Return signature as hex string
      return Array.from(signature)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (err) {
      console.error("Signing error details:", err);
      throw new Error(`Failed to sign transaction: ${err instanceof Error ? err.message : "Unknown error"}`);
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
        })
        .catch((err) => {
          console.error("Failed to get user address:", err);
        });
    }
  }

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
      <h1 className="text-3xl font-bold mb-6">Send Transaction</h1>
      {isAuthenticated && userAddress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Sending as: <span className="font-mono font-semibold">{username}</span> ({userAddress})
          </p>
        </div>
      )}
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAuthenticated && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-600">Please log in to send transactions.</p>
            </div>
          )}
          <div>
            <label htmlFor="receiver" className="block text-sm font-medium text-gray-700 mb-2">
              Receiver
            </label>
            {Object.keys(devUsers).length > 0 ? (
              <select
                id="receiver"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                required
                disabled={!isAuthenticated}
              >
                <option value="">Select a receiver...</option>
                {Object.entries(devUsers)
                  .filter(([addr]) => addr !== userAddress) // Exclude current user
                  .map(([addr, name]) => (
                    <option key={addr} value={addr}>
                      {name} ({addr})
                    </option>
                  ))}
              </select>
            ) : (
              <input
                id="receiver"
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Receiver address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                required
                disabled={!isAuthenticated}
              />
            )}
            {Object.keys(devUsers).length > 0 && userAddress && (
              <p className="mt-1 text-xs text-gray-500">
                Select a dev account from the dropdown (your own account is excluded).
              </p>
            )}
            {Object.keys(devUsers).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                  Or enter a custom address
                </summary>
                <div className="mt-2">
                  <input
                    id="receiver-custom"
                    type="text"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    placeholder="Enter custom receiver address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                    disabled={!isAuthenticated}
                    onClick={(e) => {
                      // Clear dropdown selection when typing custom address
                      const select = document.getElementById('receiver') as HTMLSelectElement;
                      if (select) select.value = '';
                    }}
                  />
                </div>
              </details>
            )}
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (Coco)
            </label>
            <input
              id="amount"
              type="number"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!isAuthenticated}
            />
          </div>
          <div>
            <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (to sign transaction)
            </label>
            <input
              id="privateKey"
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your private key (64 or 128 hex characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              required
              disabled={!isAuthenticated}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your private key is used to sign the transaction and is not stored.
              <br />
              Accepts both 32-byte seed (64 hex chars) or full 64-byte key (128 hex chars).
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Transaction created successfully!</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !isAuthenticated || !userAddress}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Send Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}

