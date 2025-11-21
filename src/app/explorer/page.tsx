"use client";

import { useState, useEffect } from "react";
import { getChain, type Block } from "@/lib/api";
import BlockCard from "@/components/BlockCard";

export default function ExplorerPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        setLoading(true);
        const chain = await getChain();
        // Display blocks in reverse order (latest first)
        setBlocks([...chain].reverse());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blocks");
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading blocks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
      {blocks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No blocks found (except genesis)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block) => (
            <BlockCard key={block.index} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

