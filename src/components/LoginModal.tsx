"use client";

import { useState } from "react";
import { getChallenge, login } from "@/lib/api";
import { saveAuthState } from "@/lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("cody");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "challenge">("input");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [challengeToken, setChallengeToken] = useState("");

  if (!isOpen) return null;

  async function handleGetChallenge() {
    if (!username.trim()) {
      setError("Please select a username");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getChallenge(username);
      setChallengeMessage(response.challenge_message);
      setChallengeToken(response.challenge_token);
      setStep("challenge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get challenge");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!privateKey.trim()) {
      setError("Please enter your private key");
      return;
    }

    if (!challengeToken || !challengeMessage) {
      setError("Please get a challenge first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Sign the challenge message with the private key
      // Note: In a real app, this would use a crypto library in the browser
      // For this demo, we'll send the private key to sign (NOT RECOMMENDED FOR PRODUCTION)
      // In production, use Web Crypto API or a wallet extension
      const signature = await signMessage(challengeMessage, privateKey.trim());

      const response = await login(challengeToken, signature);
      saveAuthState(response.session_token, response.username);
      onLoginSuccess();
      onClose();
      
      // Reset form
      setPrivateKey("");
      setStep("input");
      
      // Refresh the page to update navbar and other components
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // Sign message using tweetnacl (Ed25519 compatible)
  async function signMessage(message: string, privateKeyHex: string): Promise<string> {
    try {
      // Dynamically import tweetnacl
      const nacl = await import("tweetnacl");
      
      // Convert hex private key to Uint8Array
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      // Create signing key from private key
      // Note: tweetnacl uses the full 64-byte seed for SigningKey
      // Ed25519 private keys are 32 bytes, but SigningKey expects 64 bytes (32-byte seed + 32-byte public key)
      // If we only have 32 bytes, we need to generate the keypair differently
      
      // For hex-encoded keys from our Python backend, we need to handle the format
      // The Python backend stores keys as hex strings of the signing key bytes
      let signingKey: nacl.SigningKey;
      
      if (privateKeyBytes.length === 64) {
        // Full keypair (seed + public key)
        signingKey = nacl.sign.keyPair.fromSecretKey(privateKeyBytes);
      } else if (privateKeyBytes.length === 32) {
        // Just the seed - generate keypair from seed
        signingKey = nacl.sign.keyPair.fromSeed(privateKeyBytes);
      } else {
        throw new Error("Invalid private key length. Expected 32 or 64 bytes.");
      }
      
      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, signingKey.secretKey);
      
      // Return signature as hex string
      return Array.from(signature)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (err) {
      console.error("Signing error:", err);
      throw new Error(`Failed to sign message: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Login Required</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You need to authenticate to access the mining page. Please sign in with your private key.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <select
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="cody">cody</option>
                <option value="ezzy">ezzy</option>
              </select>
            </div>

            <div>
              <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-2">
                Private Key (hex)
              </label>
              <input
                id="privateKey"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key in hex format"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Your private key is stored locally and never sent to the server (except for signing).
              </p>
            </div>

            <button
              onClick={handleGetChallenge}
              disabled={loading || !username || !privateKey}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Get Challenge"}
            </button>
          </div>
        )}

        {step === "challenge" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Message
              </label>
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs break-all">
                {challengeMessage}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Sign this message with your private key to authenticate.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep("input");
                  setChallengeMessage("");
                  setChallengeToken("");
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Signing..." : "Sign & Login"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

