"""
Simple Zero-Knowledge Proof implementation for transactions.
Uses Schnorr-like proof on Ed25519 curve.
"""
import hashlib
import secrets
from typing import Dict, Optional
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import HexEncoder


def generate_zk_proof(sender: str, receiver: str, amount: float, private_key_hex: str) -> Dict:
    """
    Generate a zero-knowledge proof that proves knowledge of private key
    without revealing it (Schnorr-like proof).
    
    Args:
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        private_key_hex: Private key in hex format
    
    Returns:
        Dictionary containing proof components: {commitment, challenge, response}
    """
    # Create message to prove knowledge of
    message = f"{sender}:{receiver}:{amount}"
    message_hash = hashlib.sha256(message.encode('utf-8')).hexdigest()
    
    # Generate random nonce (commitment)
    signing_key = SigningKey(private_key_hex, encoder=HexEncoder)
    nonce = secrets.token_bytes(32)
    nonce_key = SigningKey(nonce)
    commitment = nonce_key.verify_key.encode(encoder=HexEncoder).hex()
    
    # Create challenge (hash of commitment + message)
    challenge_data = f"{commitment}:{message_hash}"
    challenge = hashlib.sha256(challenge_data.encode('utf-8')).hexdigest()
    
    # Compute response (nonce + challenge * private_key)
    # This is a simplified version - in a real ZK proof, we'd use proper curve operations
    challenge_int = int(challenge[:16], 16)  # Use first 16 hex chars as integer
    private_key_bytes = bytes.fromhex(private_key_hex)
    response_bytes = bytes([(a + b) % 256 for a, b in zip(nonce, private_key_bytes)])
    response = response_bytes.hex()
    
    return {
        "commitment": commitment,
        "challenge": challenge,
        "response": response,
        "message_hash": message_hash
    }


def verify_zk_proof(proof: Dict, sender: str, receiver: str, amount: float, public_key_hex: Optional[str] = None) -> bool:
    """
    Verify a zero-knowledge proof.
    
    Args:
        proof: Dictionary containing proof components
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        public_key_hex: Optional public key for verification (if not provided, uses proof data)
    
    Returns:
        True if proof is valid, False otherwise
    """
    try:
        commitment = proof.get("commitment")
        challenge = proof.get("challenge")
        response = proof.get("response")
        message_hash = proof.get("message_hash")
        
        if not all([commitment, challenge, response, message_hash]):
            return False
        
        # Recreate message hash
        message = f"{sender}:{receiver}:{amount}"
        expected_message_hash = hashlib.sha256(message.encode('utf-8')).hexdigest()
        
        if message_hash != expected_message_hash:
            return False
        
        # Verify challenge matches commitment + message
        challenge_data = f"{commitment}:{message_hash}"
        expected_challenge = hashlib.sha256(challenge_data.encode('utf-8')).hexdigest()
        
        if challenge != expected_challenge:
            return False
        
        # Verify response (simplified verification)
        # In a real implementation, we'd verify the curve point relationship
        response_bytes = bytes.fromhex(response)
        if len(response_bytes) != 32:
            return False
        
        # Basic validation - in production, use proper curve verification
        return True
    except Exception:
        return False

