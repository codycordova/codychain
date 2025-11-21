"""
FastAPI application for the blockchain backend.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from .blockchain import Blockchain
from .models import TransactionRequest, BalanceResponse, ChainResponse

# Initialize FastAPI app
app = FastAPI(title="Codychain Backend V1", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize blockchain instance
blockchain = Blockchain()


@app.post("/transaction/new")
async def create_transaction(transaction: TransactionRequest):
    """
    Add a new transaction to the pending transactions pool.
    
    Body:
    - sender: string
    - receiver: string
    - amount: number (in Coco)
    """
    from .models import Transaction
    
    tx = Transaction(
        sender=transaction.sender,
        receiver=transaction.receiver,
        amount=transaction.amount
    )
    blockchain.add_transaction(tx)
    
    return {
        "message": "Transaction added to pending pool",
        "transaction": tx.model_dump()
    }


@app.post("/mine")
async def mine_block(miner_address: Optional[str] = Query(None, description="Address of the miner to receive Coco rewards")):
    """
    Mine a new block with all pending transactions.
    If miner_address is provided, adds a mining reward in Coco tokens.
    Reward distribution:
    - 55% chance: 0.1-0.5 Coco
    - 25% chance: 0.6-0.7 Coco
    - 10% chance: 0.8-0.9 Coco
    - 10% chance: 1.0-1.4 Coco
    Clears pending transactions after mining.
    """
    try:
        mined_block = blockchain.mine_pending_transactions(miner_address=miner_address)
        return {
            "message": "Block mined successfully",
            "block": mined_block.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/chain", response_model=ChainResponse)
async def get_chain():
    """
    Get the full blockchain.
    
    Returns:
    - length: number of blocks
    - chain: array of all blocks
    """
    return ChainResponse(
        length=len(blockchain.chain),
        chain=[block.to_dict() for block in blockchain.chain]
    )


@app.get("/balances/{address}", response_model=BalanceResponse)
async def get_balance(address: str):
    """
    Get the Coco balance for a given address.
    
    Returns:
    - address: the queried address
    - balance: total Coco balance
    """
    balance = blockchain.compute_balance(address)
    return BalanceResponse(address=address, balance=balance)


@app.get("/dev-users")
async def get_dev_users():
    """Get all dev user accounts with their addresses."""
    return {
        "users": blockchain.get_dev_users()
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Codychain Backend V1",
        "endpoints": {
            "POST /transaction/new": "Add a new transaction",
            "POST /mine?miner_address=<addr>": "Mine a new block (optional miner address for rewards)",
            "GET /chain": "Get the full blockchain",
            "GET /balances/{address}": "Get token balances for an address",
            "GET /dev-users": "Get all dev user accounts"
        }
    }

