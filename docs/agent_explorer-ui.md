---

# ✅ **FILE 2 — `agent_explorer-ui.md`**
### **Goal:** Build the *Next.js 16 blockchain explorer* (Version 1 UI).

```md
# Blockchain Explorer UI Agent — Task Description

## Goal
Create a minimal blockchain explorer frontend using Next.js 16.  
This UI will connect to the Python blockchain node API.

## Requirements

### 1. Pages
Create the following pages:

### `/explorer`
Display:
- Latest blocks list
- For each block:
  - index
  - timestamp
  - number of txs
  - hash (truncate to 12 chars)
  - link to `/block/[index]`

### `/block/[index]`
Fetch `chain` from API and extract block by index.  
Display:
- index
- timestamp
- previous_hash
- hash
- nonce
- full transaction list

### `/balances`
Simple UI with an input box:
- User types address
- Fetch `/balances/<address>`
- Display balance dynamically

### `/send`
Form:
- sender
- receiver
- amount  
→ Submit POST request to `/transaction/new`

### `/mine`
Button:
- Calls `/mine`
- Shows mined block details

---

## 2. Data Fetching
Use `fetch()` with full URLs:
- `http://localhost:8000/chain`
- `http://localhost:8000/mine`
- etc.

No server actions required — pure client components allowed.

---

## 3. Global Config
Make a config file:

`src/lib/api.ts`
```ts
export const API_BASE = "http://localhost:8000";
4. Styling
Keep UI minimal but clean:

centered container

soft borders

12px–16px spacing

readable monospace font for hashes

collapsible tx list is allowed but optional

5. Project Structure
bash
Copy code
/src
  /app
    /explorer/page.tsx
    /block/[index]/page.tsx
    /balances/page.tsx
    /send/page.tsx
    /mine/page.tsx
  /lib
    api.ts
  /components
    BlockCard.tsx
    TxCard.tsx
6. Acceptance Criteria
Fetches chain and renders block list

Can drill down into an individual block

Sending a transaction works

Mining block shows correct new block

Balance lookup works

No crashing when chain is empty except genesis