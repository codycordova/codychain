import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Codychain Explorer</h1>
      <p className="text-gray-600 mb-8">Explore blocks, transactions, and balances</p>
      <div className="flex justify-center gap-4">
        <Link
          href="/explorer"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Explorer
        </Link>
      </div>
    </div>
  );
}

