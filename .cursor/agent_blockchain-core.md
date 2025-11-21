✅ FILE 1 — agent_blockchain-core.md
Goal: Build the minimal working blockchain backend in Python (Version 1).
# Blockchain Core Agent — Task Description

## Goal
Create a minimal blockchain backend in Python using FastAPI.  
This is Version 1: single-node blockchain, no networking, no signatures.

The purpose is:  
- Accept transactions  
- Mine blocks  
- View chain state from API  
- Provide JSON endpoints for a frontend explorer

## Requirements

### 1. Block Structure
Each block MUST contain:
- index (int)
- timestamp (ISO format string)
- transactions (array)
- previous_hash (string)
- nonce (int)
- hash (string) → SHA-256 of block contents

### 2. Transaction Structure
For V1:
- sender (string)
- receiver (string)
- amount (number)

No signatures until V2.

### 3. Pending Transaction Pool
Implement a global list `pending_transactions`.

### 4. Blockchain Initialization
On startup, create:
- empty chain array
- genesis block with:
  - index = 0
  - previous_hash = "0"
  - empty transactions
  - valid hash

### 5. Mining Logic
Implement simple Proof-of-Work:
- Find a hash starting with `"0000"`.
- Increment nonce until valid.

### 6. Balances
Add helper function:
- compute_balance(address): sum of all txs across chain.

### 7. FastAPI Endpoints
Implement:

#### POST `/transaction/new`
Body:
```json
{
  "sender": "cody",
  "receiver": "ezzy",
  "amount": 50
}


Adds the transaction to the pending pool.

GET /mine

Mines new block with all pending transactions.

Clears pending transactions afterward.

GET /chain

Returns JSON:

{
  "length": <num>,
  "chain": [ ...blocks ]
}

GET /balances/{address}

Returns:

{
  "address": "...",
  "balance": 123
}

8. Project Structure
/blockchain
  main.py
  blockchain.py
  models.py
  requirements.txt

9. Acceptance Criteria

API boots successfully on localhost:8000

New transactions append to pending list

/mine creates a new block with proper hash + prev_hash

/chain shows all blocks including genesis

/balances/<addr> returns correct balance

Code is clean, readable, and documented