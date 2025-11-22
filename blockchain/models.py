"""
Pydantic models for blockchain API requests and responses.
"""
from pydantic import BaseModel
from typing import List, Optional


class Transaction(BaseModel):
    """Transaction model."""
    sender: str
    receiver: str
    amount: float
    signature: Optional[str] = None  # Ed25519 signature in hex format
    zk_proof: Optional[dict] = None  # Optional zero-knowledge proof
    timestamp: Optional[str] = None  # Transaction timestamp for signature verification


class TransactionRequest(BaseModel):
    """Request model for POST /transaction/new endpoint."""
    sender: str
    receiver: str
    amount: float
    signature: Optional[str] = None  # Ed25519 signature in hex format
    zk_proof: Optional[dict] = None  # Optional zero-knowledge proof
    timestamp: Optional[str] = None  # Transaction timestamp for signature verification


class BalanceResponse(BaseModel):
    """Response model for GET /balances/{address} endpoint."""
    address: str
    balance: float  # Total Coco balance


class ChainResponse(BaseModel):
    """Response model for GET /chain endpoint."""
    length: int
    chain: List[dict]

