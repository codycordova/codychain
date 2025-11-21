---

# ✅ **FILE 3 — `agent_blockchain-architecture.md`**
### **Goal:** High-level coordination agent for your entire blockchain project.

```md
# Blockchain Architecture Agent — Task Specification

## Purpose
Coordinate the work of the sub-agents and ensure the blockchain ecosystem remains consistent, correct, and extensible.

This file defines architectural rules for the entire project.

---

## Versioning
We are building:

- **Blockchain V1** → Python FastAPI  
- **Explorer UI V1** → Next.js 16  
- **No networking or consensus** (single node only)  
- **No cryptographic signatures yet**  

Future Versions:
- V2 → Add public/private keys + signatures  
- V3 → Add P2P node networking  
- V4 → Add consensus rules  
- V5 → Optional WASM smart contract VM  

---

## System Overview

### Python Node
Defines:
- Block
- Transaction
- Blockchain
- Mining
- Balance calculations
- REST API

State stored in-memory only.

---

### Next.js Explorer
Reads:
- `/chain`
- `/mine`
- `/transaction/new`
- `/balances/<addr>`

Writes:
- new transactions
- mining requests

---

## API Contract

### Block JSON Example
```json
{
  "index": 3,
  "timestamp": "2025-11-20T02:15:32Z",
  "transactions": [
    { "sender": "cody", "receiver": "ezzy", "amount": 10 }
  ],
  "previous_hash": "0000abcdef...",
  "nonce": 4821,
  "hash": "0000cd9123..."
}
Transaction JSON Example
json
Copy code
{
  "sender": "cody",
  "receiver": "ezzy",
  "amount": 20
}
Directory Layout Across Entire Project
bash
Copy code
/codychain
  /node         ← Python FastAPI blockchain
  /explorer     ← Next.js 16 frontend UI
  /docs         ← these markdown files
Agent Coordination Rules
Blockchain-Core Agent owns backend logic.

Explorer UI Agent owns frontend/UI implementation.

Architecture Agent ensures:

JSON structure sync

endpoint naming consistency

no feature divergence

shared understanding of upcoming versions (V2, V3…)

Acceptance Criteria
Python node and Next.js explore communicate without errors.

JSON fields remain consistent across all agents.

All endpoints respond with valid JSON.

Mining and transaction flow works end-to-end:

user submits tx via UI

UI POSTs to Python backend

backend mines block

explorer shows new block

yaml
Copy code

---