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
- **Probabilistic Mining Rewards**: Dynamic reward distribution system
  - 55% chance: 0.1-0.5 Coco
  - 25% chance: 0.6-0.7 Coco
  - 10% chance: 0.8-0.9 Coco
  - 10% chance: 1.0-1.4 Coco
- **Balance Tracking**: Real-time balance calculation for any address
- **Dev User System**: Pre-configured test accounts for development
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

### Blockchain
- **Custom Implementation** - Proof-of-Work consensus
- **SHA-256** - Cryptographic hashing
- **Transaction Pool** - Pending transaction management

## 📁 Project Structure

```
codychain/
├── blockchain/          # Python backend
│   ├── __init__.py
│   ├── blockchain.py    # Core blockchain implementation
│   ├── main.py          # FastAPI application
│   └── models.py        # Pydantic models
├── src/                 # Next.js frontend
│   ├── app/             # App Router pages
│   │   ├── explorer/    # Block explorer page
│   │   ├── balances/    # Balance viewer
│   │   ├── send/        # Send transactions
│   │   ├── mine/        # Mining interface
│   │   └── block/       # Individual block view
│   ├── components/      # React components
│   └── lib/             # API client utilities
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
Create a new transaction and add it to the pending pool.

**Request Body:**
```json
{
  "sender": "A1B2",
  "receiver": "C3D4",
  "amount": 1.5
}
```

**Response:**
```json
{
  "message": "Transaction added to pending pool",
  "transaction": {
    "sender": "A1B2",
    "receiver": "C3D4",
    "amount": 1.5
  }
}
```

#### `POST /mine?miner_address=<address>`
Mine a new block with all pending transactions. Optionally provide a miner address to receive mining rewards.

**Query Parameters:**
- `miner_address` (optional): Address to receive mining reward

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
    "C3D4": "ezzy",
    ...
  }
}
```

### Interactive API Docs

When the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🎮 Usage Guide

### Creating Transactions

1. Navigate to the **Send** page
2. Enter sender address, receiver address, and amount
3. Submit the transaction
4. The transaction is added to the pending pool

### Mining Blocks

1. Navigate to the **Mine** page
2. Optionally enter a miner address to receive rewards
3. Click "Mine Block"
4. The block is mined with all pending transactions

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

### Code Style

- **Python**: Follow PEP 8 conventions
- **TypeScript/React**: Use TypeScript strict mode, functional components with hooks

## 🔒 Security Notes

This is a **development/educational** blockchain implementation. It is not suitable for production use. Key limitations:

- No cryptographic signatures for transactions
- No network consensus (single node)
- No persistence layer (in-memory only)
- Simplified Proof-of-Work (educational difficulty)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👤 Author

**Cody (cocopuff)**
- Music Producer/DJ
- Junior Developer building Stellar dApps

---

⭐ If you find this project interesting, please give it a star!

