"""
FastAPI application for the blockchain backend.
"""
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from .blockchain import Blockchain
from .models import TransactionRequest, BalanceResponse, ChainResponse
from .auth import AuthManager

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

# Initialize auth manager
auth_manager = AuthManager()


@app.post("/transaction/new")
async def create_transaction(
    transaction: TransactionRequest,
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    Add a new transaction to the pending transactions pool.
    REQUIRES AUTHENTICATION - must provide valid session token in Authorization header.
    
    The sender must be the logged-in user's address.
    
    Body:
    - sender: string (must match logged-in user's address)
    - receiver: string
    - amount: number (in Coco)
    - signature: optional string (Ed25519 signature in hex)
    - zk_proof: optional dict (zero-knowledge proof)
    - timestamp: optional string (transaction timestamp)
    """
    from .models import Transaction
    from datetime import datetime
    
    # Check authentication
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Extract session token
    session_token = authorization.replace("Bearer ", "").strip()
    username = auth_manager.verify_session(session_token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Get user's address
    dev_users = blockchain.get_dev_users()
    user_address = None
    for address, name in dev_users.items():
        if name == username:
            user_address = address
            break
    
    if not user_address:
        raise HTTPException(status_code=404, detail=f"Address not found for user {username}")
    
    # Validate that sender matches logged-in user
    if transaction.sender != user_address:
        raise HTTPException(
            status_code=403,
            detail=f"You can only send transactions from your own address ({user_address}). You are logged in as {username}."
        )
    
    tx = Transaction(
        sender=transaction.sender,
        receiver=transaction.receiver,
        amount=transaction.amount,
        signature=transaction.signature,
        zk_proof=transaction.zk_proof,
        timestamp=transaction.timestamp or datetime.utcnow().isoformat()
    )
    
    try:
        blockchain.add_transaction(tx)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "Transaction added to pending pool",
        "transaction": tx.model_dump()
    }


@app.post("/mine")
async def mine_block(
    miner_address: Optional[str] = Query(None, description="Address of the miner to receive Coco rewards"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    Mine a new block with all pending transactions.
    REQUIRES AUTHENTICATION - must provide valid session token in Authorization header.
    
    The miner_address must belong to the logged-in user. If not provided, uses the logged-in user's address.
    
    If miner_address is provided, adds a mining reward in Coco tokens.
    Reward distribution:
    - 55% chance: 0.1-0.5 Coco
    - 25% chance: 0.6-0.7 Coco
    - 10% chance: 0.8-0.9 Coco
    - 10% chance: 1.0-1.4 Coco
    Clears pending transactions after mining.
    """
    # Check authentication
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Extract session token (format: "Bearer <token>" or just "<token>")
    session_token = authorization.replace("Bearer ", "").strip()
    username = auth_manager.verify_session(session_token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Get user's address
    dev_users = blockchain.get_dev_users()
    user_address = None
    for address, name in dev_users.items():
        if name == username:
            user_address = address
            break
    
    if not user_address:
        raise HTTPException(status_code=404, detail=f"Address not found for user {username}")
    
    # Validate that miner_address belongs to logged-in user
    if miner_address and miner_address != user_address:
        raise HTTPException(
            status_code=403, 
            detail=f"You can only mine with your own address ({user_address}). You are logged in as {username}."
        )
    
    # Use logged-in user's address if miner_address not provided
    final_miner_address = miner_address or user_address
    
    try:
        mined_block = blockchain.mine_pending_transactions(miner_address=final_miner_address)
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


@app.get("/user-address/{username}")
async def get_user_address(username: str):
    """
    Get the address for a given username.
    
    Returns:
        address: The address associated with the username, or None if not found
    """
    dev_users = blockchain.get_dev_users()
    # Find address for this username
    for address, name in dev_users.items():
        if name == username:
            return {"username": username, "address": address}
    raise HTTPException(status_code=404, detail=f"User {username} not found")


# Authentication endpoints
class ChallengeRequest(BaseModel):
    username: str


class LoginRequest(BaseModel):
    challenge_token: str
    signature: str


class ChallengeResponse(BaseModel):
    challenge_token: str
    challenge_message: str


class LoginResponse(BaseModel):
    session_token: str
    username: str


@app.get("/auth/challenge", response_model=ChallengeResponse)
async def get_challenge(username: str = Query(..., description="Username (cody or ezzy)")):
    """
    Generate a challenge token for authentication.
    
    Returns:
        challenge_token: Token to use in login request
        challenge_message: Message to sign with private key
    """
    try:
        challenge_token, challenge_message = auth_manager.generate_challenge(username)
        return ChallengeResponse(
            challenge_token=challenge_token,
            challenge_message=challenge_message
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """
    Login with a signed challenge.
    
    Body:
        challenge_token: Token from /auth/challenge
        signature: Signature of challenge_message (hex format)
    
    Returns:
        session_token: Token to use for authenticated requests
        username: Authenticated username
    """
    session_token = auth_manager.verify_login(
        login_request.challenge_token,
        login_request.signature
    )
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Invalid challenge or signature")
    
    # Get username from session
    username = auth_manager.verify_session(session_token)
    
    return LoginResponse(
        session_token=session_token,
        username=username
    )


@app.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None, alias="Authorization")):
    """
    Logout by invalidating session token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    session_token = authorization.replace("Bearer ", "").strip()
    success = auth_manager.logout(session_token)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Logged out successfully"}


@app.get("/auth/verify")
async def verify_auth(authorization: Optional[str] = Header(None, alias="Authorization")):
    """
    Verify if a session token is valid.
    
    Returns:
        username if valid, error if not
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    session_token = authorization.replace("Bearer ", "").strip()
    username = auth_manager.verify_session(session_token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return {"username": username, "authenticated": True}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Codychain Backend V1",
        "endpoints": {
            "POST /transaction/new": "Add a new transaction",
            "POST /mine?miner_address=<addr>": "Mine a new block (REQUIRES AUTH, optional miner address for rewards)",
            "GET /chain": "Get the full blockchain",
            "GET /balances/{address}": "Get token balances for an address",
            "GET /dev-users": "Get all dev user accounts",
            "GET /auth/challenge": "Get authentication challenge",
            "POST /auth/login": "Login with signed challenge",
            "POST /auth/logout": "Logout (invalidate session)",
            "GET /auth/verify": "Verify session token"
        }
    }

