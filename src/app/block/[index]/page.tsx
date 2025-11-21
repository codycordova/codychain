"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getBlock, type Block } from "@/lib/api";
import TxCard from "@/components/TxCard";

export default function BlockDetailPage() {
  const params = useParams();
  const index = parseInt(params.index as string, 10);
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlock() {
      try {
        setLoading(true);
        const blockData = await getBlock(index);
        if (!blockData) {
          setError("Block not found");
        } else {
          setBlock(blockData);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load block");
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(index)) {
      fetchBlock();
    } else {
      setError("Invalid block index");
      setLoading(false);
    }
  }, [index]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading block...</p>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error || "Block not found"}</p>
      </div>
    );
  }

  const timestamp = new Date(block.timestamp).toLocaleString();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Block #{block.index}</h1>
      <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600">Index</p>
          <p className="font-mono text-lg">{block.index}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Timestamp</p>
          <p className="text-lg">{timestamp}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Previous Hash</p>
          <p className="font-mono text-sm break-all">{block.previous_hash}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Hash</p>
          <p className="font-mono text-sm break-all">{block.hash}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Nonce</p>
          <p className="font-mono text-lg">{block.nonce}</p>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            Transactions ({block.transactions?.length || 0})
          </h2>
          {block.transactions && block.transactions.length > 0 ? (
            <div className="space-y-3">
              {block.transactions.map((tx, idx) => (
                <TxCard key={idx} transaction={tx} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No transactions in this block</p>
          )}
        </div>
      </div>
    </div>
  );
}

