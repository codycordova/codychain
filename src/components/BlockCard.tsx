import Link from "next/link";
import type { Block } from "@/lib/api";

interface BlockCardProps {
  block: Block;
}

export default function BlockCard({ block }: BlockCardProps) {
  const truncatedHash = block.hash.substring(0, 12);
  const txCount = block.transactions?.length || 0;
  const timestamp = new Date(block.timestamp).toLocaleString();

  return (
    <Link href={`/block/${block.index}`}>
      <div className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">Block #{block.index}</h3>
            <p className="text-sm text-gray-600">{timestamp}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{txCount} transaction{txCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-500">Hash:</p>
          <p className="font-mono text-sm text-gray-900">{truncatedHash}...</p>
        </div>
      </div>
    </Link>
  );
}

