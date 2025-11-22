"""
Cryptographic operations using Ed25519 (Stellar-compatible).
"""
import base64
import hashlib
from typing import Optional
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import HexEncoder, Base64Encoder


def generate_keypair() -> tuple[bytes, bytes]:
    """
    Generate a new Ed25519 keypair.
    
    Returns:
        tuple: (private_key_bytes, public_key_bytes)
    """
    signing_key = SigningKey.generate()
    private_key = signing_key.encode(encoder=HexEncoder)
    public_key = signing_key.verify_key.encode(encoder=HexEncoder)
    return private_key, public_key


def sign_message(message: str, private_key_hex: str) -> str:
    """
    Sign a message with a private key.
    
    Args:
        message: The message to sign (string) - if it's a hex string, it will be converted to bytes
        private_key_hex: Private key in hex format
    
    Returns:
        Signature in hex format
    """
    try:
        signing_key = SigningKey(private_key_hex, encoder=HexEncoder)
        # If message looks like a hex string (even length, only hex chars), convert it to bytes
        # Otherwise, encode as UTF-8
        if len(message) % 2 == 0 and all(c in '0123456789abcdefABCDEF' for c in message):
            # It's a hex string, convert to bytes
            message_bytes = bytes.fromhex(message)
        else:
            # Regular string, encode as UTF-8
            message_bytes = message.encode('utf-8')
        signature = signing_key.sign(message_bytes)
        return signature.signature.hex()
    except Exception as e:
        raise ValueError(f"Error signing message: {e}")


def verify_signature(message: str, signature_hex: str, public_key_hex: str) -> bool:
    """
    Verify a signature against a message and public key.
    
    Args:
        message: The original message (string) - if it's a hex string, it will be converted to bytes
        signature_hex: Signature in hex format
        public_key_hex: Public key in hex format
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        verify_key = VerifyKey(public_key_hex, encoder=HexEncoder)
        # If message looks like a hex string (even length, only hex chars), convert it to bytes
        # Otherwise, encode as UTF-8
        if len(message) % 2 == 0 and all(c in '0123456789abcdefABCDEF' for c in message):
            # It's a hex string, convert to bytes
            message_bytes = bytes.fromhex(message)
        else:
            # Regular string, encode as UTF-8
            message_bytes = message.encode('utf-8')
        signature_bytes = bytes.fromhex(signature_hex)
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except Exception:
        return False


def sign_transaction(sender: str, receiver: str, amount: float, private_key_hex: str, timestamp: Optional[str] = None) -> str:
    """
    Sign a transaction using Ed25519.
    
    Creates a hash of transaction data and signs it.
    Format: hash(sender + receiver + amount + timestamp)
    
    Args:
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        private_key_hex: Private key in hex format
        timestamp: Optional timestamp (uses current time if not provided)
    
    Returns:
        Signature in hex format
    """
    from datetime import datetime
    
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()
    
    # Create message to sign: hash of transaction data
    # Format amount to match JavaScript: integers as "X.0", decimals as-is
    if isinstance(amount, float) and amount.is_integer():
        amount_str = f"{int(amount)}.0"
    else:
        amount_str = str(amount)
    message = f"{sender}:{receiver}:{amount_str}:{timestamp}"
    message_hash = hashlib.sha256(message.encode('utf-8')).hexdigest()
    
    return sign_message(message_hash, private_key_hex)


def verify_transaction_signature(sender: str, receiver: str, amount: float, signature_hex: str, public_key_hex: str, timestamp: Optional[str] = None) -> bool:
    """
    Verify a transaction signature.
    
    Args:
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        signature_hex: Signature in hex format
        public_key_hex: Public key in hex format
        timestamp: Optional timestamp (uses current time if not provided)
    
    Returns:
        True if signature is valid, False otherwise
    """
    from datetime import datetime
    
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()
    
    # Recreate the message hash
    # Format amount to match JavaScript: integers as "X.0", decimals as-is
    if isinstance(amount, float) and amount.is_integer():
        amount_str = f"{int(amount)}.0"
    else:
        amount_str = str(amount)
    message = f"{sender}:{receiver}:{amount_str}:{timestamp}"
    message_hash = hashlib.sha256(message.encode('utf-8')).hexdigest()
    
    return verify_signature(message_hash, signature_hex, public_key_hex)


def load_private_key_from_file(filepath: str) -> str:
    """
    Load a private key from a file.
    Expects hex-encoded key.
    
    Args:
        filepath: Path to the private key file
    
    Returns:
        Private key as hex string
    """
    try:
        with open(filepath, 'r') as f:
            key_data = f.read().strip()
            # Remove any PEM-like headers/footers if present
            key_data = key_data.replace('-----BEGIN PRIVATE KEY-----', '')
            key_data = key_data.replace('-----END PRIVATE KEY-----', '')
            key_data = key_data.replace('-----BEGIN ED25519 PRIVATE KEY-----', '')
            key_data = key_data.replace('-----END ED25519 PRIVATE KEY-----', '')
            key_data = key_data.replace('\n', '').replace(' ', '')
            return key_data
    except Exception as e:
        raise ValueError(f"Error loading private key: {e}")


def load_public_key_from_file(filepath: str) -> str:
    """
    Load a public key from a file.
    Expects hex-encoded key.
    
    Args:
        filepath: Path to the public key file
    
    Returns:
        Public key as hex string
    """
    try:
        with open(filepath, 'r') as f:
            key_data = f.read().strip()
            # Remove any PEM-like headers/footers if present
            key_data = key_data.replace('-----BEGIN PUBLIC KEY-----', '')
            key_data = key_data.replace('-----END PUBLIC KEY-----', '')
            key_data = key_data.replace('-----BEGIN ED25519 PUBLIC KEY-----', '')
            key_data = key_data.replace('-----END ED25519 PUBLIC KEY-----', '')
            key_data = key_data.replace('\n', '').replace(' ', '')
            return key_data
    except Exception as e:
        raise ValueError(f"Error loading public key: {e}")

