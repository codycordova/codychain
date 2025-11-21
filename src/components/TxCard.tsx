import type { Transaction } from "@/lib/api";

interface TxCardProps {
  transaction: Transaction;
  index?: number;
}

export default function TxCard({ transaction, index }: TxCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      {index !== undefined && (
        <p className="text-xs text-gray-500 mb-2">Transaction #{index + 1}</p>
      )}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">From:</span>
          <span className="font-mono text-sm text-gray-900">{transaction.sender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">To:</span>
          <span className="font-mono text-sm text-gray-900">{transaction.receiver}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="font-semibold text-sm text-gray-900">
            {transaction.amount.toFixed(1)} <span className="text-xs text-gray-600">Coco</span>
          </span>
        </div>
      </div>
    </div>
  );
}

