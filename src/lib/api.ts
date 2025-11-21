export const API_BASE = "http://localhost:8000";

export interface Block {
  index: number;
  timestamp: string;
  transactions: Transaction[];
  previous_hash: string;
  hash: string;
  nonce: number;
}

export interface Transaction {
  sender: string;
  receiver: string;
  amount: number;
}

export interface ChainResponse {
  chain: Block[];
  length: number;
}

export interface BalanceResponse {
  address: string;
  balance: number;  // Total Coco balance
}

export interface MineResponse {
  message: string;
  block: Block;
}

export async function getChain(): Promise<Block[]> {
  const response = await fetch(`${API_BASE}/chain`);
  if (!response.ok) {
    throw new Error("Failed to fetch chain");
  }
  const data: ChainResponse = await response.json();
  return data.chain;
}

export async function getBlock(index: number): Promise<Block | null> {
  const chain = await getChain();
  return chain.find((block) => block.index === index) || null;
}

export async function getBalance(address: string): Promise<BalanceResponse> {
  const response = await fetch(`${API_BASE}/balances/${address}`);
  if (!response.ok) {
    throw new Error("Failed to fetch balance");
  }
  const data: BalanceResponse = await response.json();
  return data;
}

export interface DevUsersResponse {
  users: Record<string, string>;  // address -> name
}

export async function getDevUsers(): Promise<DevUsersResponse> {
  const response = await fetch(`${API_BASE}/dev-users`);
  if (!response.ok) {
    throw new Error("Failed to fetch dev users");
  }
  return response.json();
}

export async function postTransaction(
  sender: string,
  receiver: string,
  amount: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/transaction/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sender, receiver, amount }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create transaction" }));
    throw new Error(error.message || "Failed to create transaction");
  }
}

export async function postMine(minerAddress?: string): Promise<MineResponse> {
  const url = minerAddress 
    ? `${API_BASE}/mine?miner_address=${encodeURIComponent(minerAddress)}`
    : `${API_BASE}/mine`;
  const response = await fetch(url, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to mine block" }));
    throw new Error(error.detail || "Failed to mine block");
  }
  return response.json();
}

