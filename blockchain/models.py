"""
Pydantic models for blockchain API requests and responses.
"""
from pydantic import BaseModel
from typing import List


class Transaction(BaseModel):
    """Transaction model."""
    sender: str
    receiver: str
    amount: float


class TransactionRequest(BaseModel):
    """Request model for POST /transaction/new endpoint."""
    sender: str
    receiver: str
    amount: float


class BalanceResponse(BaseModel):
    """Response model for GET /balances/{address} endpoint."""
    address: str
    balance: float  # Total Coco balance


class ChainResponse(BaseModel):
    """Response model for GET /chain endpoint."""
    length: int
    chain: List[dict]

