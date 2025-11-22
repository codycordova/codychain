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

export async function getUserAddress(username: string): Promise<{ username: string; address: string }> {
  const response = await fetch(`${API_BASE}/user-address/${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error("Failed to get user address");
  }
  return response.json();
}

export async function postTransaction(
  sender: string,
  receiver: string,
  amount: number,
  signature?: string,
  timestamp?: string,
  sessionToken?: string
): Promise<void> {
  const body: any = { sender, receiver, amount };
  if (signature) {
    body.signature = signature;
  }
  if (timestamp) {
    body.timestamp = timestamp;
  }
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  
  const response = await fetch(`${API_BASE}/transaction/new`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to create transaction" }));
    throw new Error(error.detail || error.message || "Failed to create transaction");
  }
}

export async function postMine(minerAddress?: string, sessionToken?: string): Promise<MineResponse> {
  const url = minerAddress 
    ? `${API_BASE}/mine?miner_address=${encodeURIComponent(minerAddress)}`
    : `${API_BASE}/mine`;
  
  const headers: HeadersInit = {};
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to mine block" }));
    throw new Error(error.detail || "Failed to mine block");
  }
  return response.json();
}

// Authentication API
export interface ChallengeResponse {
  challenge_token: string;
  challenge_message: string;
}

export interface LoginRequest {
  challenge_token: string;
  signature: string;
}

export interface LoginResponse {
  session_token: string;
  username: string;
}

export interface VerifyResponse {
  username: string;
  authenticated: boolean;
}

export async function getChallenge(username: string): Promise<ChallengeResponse> {
  const response = await fetch(`${API_BASE}/auth/challenge?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get challenge" }));
    throw new Error(error.detail || "Failed to get challenge");
  }
  return response.json();
}

export async function login(challengeToken: string, signature: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge_token: challengeToken,
      signature: signature,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail || "Login failed");
  }
  return response.json();
}

export async function verifySession(sessionToken: string): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${sessionToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Session invalid");
  }
  return response.json();
}

export async function logout(sessionToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Logout failed");
  }
}

