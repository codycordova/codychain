"use client";

import { useState, useEffect } from "react";
import { postMine, getDevUsers, type Block } from "@/lib/api";
import TxCard from "@/components/TxCard";

export default function MinePage() {
  const [minedBlock, setMinedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minerAddress, setMinerAddress] = useState<string>("");
  const [devUsers, setDevUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadDevUsers() {
      try {
        const response = await getDevUsers();
        setDevUsers(response.users);
        // Set first user as default
        const firstAddress = Object.keys(response.users)[0];
        if (firstAddress) {
          setMinerAddress(firstAddress);
        }
      } catch (err) {
        console.error("Failed to load dev users:", err);
      }
    }
    loadDevUsers();
  }, []);

  async function handleMine() {
    try {
      setLoading(true);
      setError(null);
      const response = await postMine(minerAddress || undefined);
      setMinedBlock(response.block);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mine block");
      setMinedBlock(null);
    } finally {
      setLoading(false);
    }
  }

  const timestamp = minedBlock ? new Date(minedBlock.timestamp).toLocaleString() : null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mine Block</h1>
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl mb-6 space-y-4">
        <div>
          <label htmlFor="miner-address" className="block text-sm font-medium text-gray-700 mb-2">
            Miner Address (to receive rewards)
          </label>
          <select
            id="miner-address"
            value={minerAddress}
            onChange={(e) => setMinerAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">No rewards (mine without reward)</option>
            {Object.entries(devUsers).map(([address, name]) => (
              <option key={address} value={address}>
                {name} ({address})
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Select a miner address to receive Coco tokens as a mining reward.
            <br />
            <span className="text-xs">
              Reward distribution: 55% chance 0.1-0.5, 25% chance 0.6-0.7, 10% chance 0.8-0.9, 10% chance 1.0-1.4 Coco
            </span>
          </p>
        </div>
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

