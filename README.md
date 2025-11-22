# 🔗 Codychain

A full-stack blockchain explorer built with Next.js and FastAPI. Explore blocks, transactions, and balances in a custom blockchain implementation featuring Proof-of-Work consensus and probabilistic mining rewards.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat-square&logo=python)

## ✨ Features

- **Blockchain Explorer**: Browse blocks, transactions, and chain history
- **Proof-of-Work Mining**: SHA-256 hashing with difficulty target (hash starting with "0000")
- **Transaction System**: Send and receive Coco tokens between addresses
- **Ed25519 Authentication**: Challenge-response login system with session management
- **Cryptographic Signatures**: Ed25519 signatures for transaction authorization (Stellar-compatible)
- **Zero-Knowledge Proofs**: Optional ZK proofs for transaction privacy
- **Probabilistic Mining Rewards**: Dynamic reward distribution system
  - 55% chance: 0.1-0.5 Coco
  - 25% chance: 0.6-0.7 Coco
  - 10% chance: 0.8-0.9 Coco
  - 10% chance: 1.0-1.4 Coco
- **Balance Tracking**: Real-time balance calculation for any address
- **Dev User System**: Pre-configured test accounts (cody, ezzy) with keypair management
- **Modern UI**: Built with Tailwind CSS and responsive design

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **FastAPI** - High-performance Python web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **PyNaCl** - Ed25519 cryptographic operations (Stellar-compatible)

### Blockchain
- **Custom Implementation** - Proof-of-Work consensus
- **SHA-256** - Cryptographic hashing
- **Ed25519** - Digital signatures and authentication
- **Transaction Pool** - Pending transaction management

## 📁 Project Structure

```
codychain/
├── blockchain/          # Python backend
│   ├── __init__.py
│   ├── blockchain.py    # Core blockchain implementation
│   ├── main.py          # FastAPI application
│   ├── models.py        # Pydantic models
│   ├── auth.py          # Authentication system
│   ├── crypto.py        # Ed25519 cryptographic operations
│   └── zk_proof.py      # Zero-knowledge proof implementation
├── src/                 # Next.js frontend
│   ├── app/             # App Router pages
│   │   ├── explorer/    # Block explorer page
│   │   ├── balances/    # Balance viewer
│   │   ├── send/        # Send transactions
│   │   ├── mine/        # Mining interface
│   │   └── block/       # Individual block view
│   ├── components/      # React components
│   │   ├── LoginModal.tsx  # Authentication modal
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── BlockCard.tsx   # Block display
│   │   └── TxCard.tsx       # Transaction display
│   └── lib/             # API client utilities
│       ├── api.ts       # API client functions
│       └── auth.ts      # Frontend auth utilities
├── scripts/             # Utility scripts
│   └── generate_keys.py # Generate Ed25519 keypairs
├── data/                # Data storage
│   ├── blockchain.json  # Blockchain persistence
│   └── keys/            # User keypairs (cody, ezzy)
├── docs/                # Documentation
├── package.json         # Node.js dependencies
├── requirements.txt     # Python dependencies
└── run.py              # Backend server entry point
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **pip** (Python package manager)

### Installation

1. **Clone the repository**
   ```powershell
   git clone https://github.com/yourusername/codychain.git
   cd codychain
   ```

2. **Install Python dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```powershell
   npm install
   ```

4. **Generate cryptographic keypairs** (for authentication)
   ```powershell
   python scripts/generate_keys.py
   ```
   This creates Ed25519 keypairs for users `cody` and `ezzy` in `data/keys/`.

### Running the Application

1. **Start the backend server** (Terminal 1)
   ```powershell
   python run.py
   ```
   The API will be available at `http://localhost:8000`

2. **Start the frontend development server** (Terminal 2)
   ```powershell
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

3. **Open your browser**
   Navigate to `http://localhost:3000` to view the Codychain Explorer

## 📖 API Documentation

### Endpoints

#### `POST /transaction/new`
Create a new transaction and add it to the pending pool. **REQUIRES AUTHENTICATION** - must provide valid session token in `Authorization: Bearer <token>` header.

The sender must match the logged-in user's address.

**Request Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "sender": "A1B2",
  "receiver": "C3D4",
  "amount": 1.5,
  "signature": "optional_ed25519_signature_hex",
  "zk_proof": {},
  "timestamp": "optional_iso_timestamp"
}
```

**Response:**
```json
{
  "message": "Transaction added to pending pool",
  "transaction": {
    "sender": "A1B2",
    "receiver": "C3D4",
    "amount": 1.5,
    "signature": "...",
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

#### `POST /mine?miner_address=<address>`
Mine a new block with all pending transactions. **REQUIRES AUTHENTICATION** - must provide valid session token in `Authorization: Bearer <token>` header.

The miner address must belong to the logged-in user. If not provided, uses the logged-in user's address.

**Request Headers:**
- `Authorization: Bearer <session_token>`

**Query Parameters:**
- `miner_address` (optional): Address to receive mining reward (must match logged-in user)

**Response:**
```json
{
  "message": "Block mined successfully",
  "block": {
    "index": 1,
    "timestamp": "2024-01-01T12:00:00",
    "transactions": [...],
    "previous_hash": "...",
    "hash": "0000...",
    "nonce": 12345
  }
}
```

#### `GET /chain`
Get the full blockchain.

**Response:**
```json
{
  "length": 5,
  "chain": [...]
}
```

#### `GET /balances/{address}`
Get the Coco token balance for a given address.

**Response:**
```json
{
  "address": "A1B2",
  "balance": 10.5
}
```

#### `GET /dev-users`
Get all pre-configured dev user accounts.

**Response:**
```json
{
  "users": {
    "A1B2": "cody",
    "C3D4": "ezzy"
  }
}
```

#### `GET /user-address/{username}`
Get the address for a given username.

**Response:**
```json
{
  "username": "cody",
  "address": "A1B2"
}
```

### Authentication Endpoints

#### `GET /auth/challenge?username=<username>`
Generate a challenge token for authentication. Username must be `cody` or `ezzy`.

**Query Parameters:**
- `username`: Username (cody or ezzy)

**Response:**
```json
{
  "challenge_token": "hex_token",
  "challenge_message": "codychain_login_cody_<random>"
}
```

#### `POST /auth/login`
Login with a signed challenge. Sign the `challenge_message` from `/auth/challenge` using your private key.

**Request Body:**
```json
{
  "challenge_token": "hex_token_from_challenge",
  "signature": "ed25519_signature_hex"
}
```

**Response:**
```json
{
  "session_token": "hex_session_token",
  "username": "cody"
}
```

#### `POST /auth/logout`
Logout by invalidating session token. **REQUIRES AUTHENTICATION**.

**Request Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### `GET /auth/verify`
Verify if a session token is valid. **REQUIRES AUTHENTICATION**.

**Request Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "username": "cody",
  "authenticated": true
}
```

### Interactive API Docs

When the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🎮 Usage Guide

### Authentication

1. Navigate to any page that requires authentication (Send, Mine)
2. A login modal will appear
3. Select your username (cody or ezzy)
4. The app will generate a challenge and sign it with your private key
5. You'll be logged in with a session token (stored in localStorage)

**Note**: Private keys are stored in `data/keys/{username}_private.pem`. The frontend loads these keys to sign challenges and transactions.

### Creating Transactions

1. **Log in** first (see Authentication above)
2. Navigate to the **Send** page
3. Enter receiver address and amount (sender is automatically set to your address)
4. Optionally sign the transaction with your private key
5. Submit the transaction
6. The transaction is added to the pending pool

### Mining Blocks

1. **Log in** first (see Authentication above)
2. Navigate to the **Mine** page
3. Click "Mine Block"
4. The block is mined with all pending transactions
5. Mining rewards are automatically sent to your address

### Viewing Blocks

1. Navigate to the **Explorer** page
2. Browse all blocks in the chain (latest first)
3. Click on a block to view details

### Checking Balances

1. Navigate to the **Balances** page
2. Enter an address
3. View the current Coco token balance

## 🧪 Development

### Building for Production

**Frontend:**
```powershell
npm run build
npm start
```

**Backend:**
The backend runs with auto-reload in development. For production, use:
```powershell
uvicorn blockchain.main:app --host 0.0.0.0 --port 8000
```

### Key Management

Generate new Ed25519 keypairs for users:
```powershell
python scripts/generate_keys.py
```

Keys are stored in `data/keys/`:
- `{username}_private.pem` - Private key (hex format)
- `{username}_public.pem` - Public key (hex format)

**Security**: Keep private keys secure. Never share or commit them to version control.

### Code Style

- **Python**: Follow PEP 8 conventions
- **TypeScript/React**: Use TypeScript strict mode, functional components with hooks

## 🔒 Security Notes

This is a **development/educational** blockchain implementation. It is not suitable for production use. Key limitations:

- **Ed25519 signatures are implemented** but transaction validation may not enforce them in all cases
- No network consensus (single node)
- Limited persistence (JSON file storage)
- Simplified Proof-of-Work (educational difficulty - hash starting with "0000")
- Private keys stored in plaintext files (for development only)
- Session tokens stored in localStorage (not httpOnly cookies)
- Zero-knowledge proofs are simplified/educational implementations

**Important**: Never commit private keys to version control. The `data/keys/` directory should be in `.gitignore`.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👤 Author

**Cody Cordova(cocopuff)**
- Music Producer/DJ
- Junior Developer building Stellar dApps

---

⭐ If you find this project interesting, please give it a star!

