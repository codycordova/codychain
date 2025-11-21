"use client";

import { useState, useEffect } from "react";
import { getBalance, getDevUsers, type BalanceResponse } from "@/lib/api";

export default function BalancesPage() {
  const [address, setAddress] = useState("");
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devUsers, setDevUsers] = useState<Record<string, string>>({});
  const [allBalances, setAllBalances] = useState<Record<string, number>>({});

  async function loadAllBalances() {
    try {
      const response = await getDevUsers();
      setDevUsers(response.users);
      // Load balances for all dev users
      const balances: Record<string, number> = {};
      for (const addr of Object.keys(response.users)) {
        try {
          const balanceResp = await getBalance(addr);
          balances[addr] = balanceResp.balance;
        } catch (err) {
          balances[addr] = 0;
        }
      }
      setAllBalances(balances);
    } catch (err) {
      console.error("Failed to load dev users:", err);
    }
  }

  useEffect(() => {
    loadAllBalances();
  }, []);

  async function handleFetchBalance() {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const balanceResponse = await getBalance(address.trim());
      setBalanceData(balanceResponse);
      // Refresh all balances if this is a dev user
      if (devUsers[address.trim()]) {
        await loadAllBalances();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalanceData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Check Balance</h1>
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="flex gap-3">
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFetchBalance();
                  }
                }}
                placeholder="Enter address (e.g., A1B2)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleFetchBalance}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Check"}
              </button>
            </div>
            {Object.keys(devUsers).length > 0 && (
              <div className="text-xs text-gray-500">
                <p className="mb-1">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(devUsers).map(([addr, name]) => (
                    <button
                      key={addr}
                      onClick={() => {
                        setAddress(addr);
                        handleFetchBalance();
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono"
                    >
                      {name} ({addr})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {balanceData && !error && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="text-lg font-mono font-semibold text-gray-900">
                  {balanceData.address}
                  {devUsers[balanceData.address] && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({devUsers[balanceData.address]})
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Coco Balance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {balanceData.balance.toFixed(1)} <span className="text-xl">Coco</span>
                </p>
              </div>
            </div>
          )}
          
          {Object.keys(devUsers).length > 0 && (
            <div className="mt-6 bg-white border border-gray-300 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">All Dev Account Balances</h2>
                <button
                  onClick={loadAllBalances}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(devUsers).map(([addr, name]) => (
                  <div
                    key={addr}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs font-mono text-gray-500">{addr}</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {allBalances[addr]?.toFixed(1) || "0.0"} <span className="text-sm">Coco</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

