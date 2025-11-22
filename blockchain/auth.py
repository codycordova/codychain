"""
Authentication system using Ed25519 signatures.
"""
import secrets
import time
from typing import Dict, Optional
from datetime import datetime, timedelta
from .crypto import verify_signature, load_public_key_from_file
import os


class AuthManager:
    """Manages authentication sessions and challenges."""
    
    def __init__(self, keys_dir: str = "data/keys"):
        self.keys_dir = keys_dir
        self.challenges: Dict[str, Dict] = {}  # challenge_token -> {username, timestamp, challenge}
        self.sessions: Dict[str, Dict] = {}  # session_token -> {username, expires_at}
        self.public_keys: Dict[str, str] = {}  # username -> public_key_hex
        self._load_public_keys()
        self.challenge_expiry = timedelta(minutes=5)  # Challenges expire after 5 minutes
        self.session_expiry = timedelta(hours=24)  # Sessions expire after 24 hours
    
    def _load_public_keys(self):
        """Load public keys for cody and ezzy from files."""
        for username in ["cody", "ezzy"]:
            key_file = os.path.join(self.keys_dir, f"{username}_public.pem")
            if os.path.exists(key_file):
                try:
                    public_key = load_public_key_from_file(key_file)
                    self.public_keys[username] = public_key
                except Exception as e:
                    print(f"Warning: Could not load public key for {username}: {e}")
    
    def generate_challenge(self, username: str) -> str:
        """
        Generate a challenge token for a user.
        
        Args:
            username: Username (cody or ezzy)
        
        Returns:
            Challenge token (hex string)
        """
        if username not in self.public_keys:
            raise ValueError(f"No public key registered for user: {username}")
        
        # Generate random challenge
        challenge_message = f"codychain_login_{username}_{secrets.token_hex(16)}"
        challenge_token = secrets.token_hex(32)
        
        # Store challenge
        self.challenges[challenge_token] = {
            "username": username,
            "challenge": challenge_message,
            "timestamp": datetime.utcnow()
        }
        
        # Clean up expired challenges
        self._cleanup_expired_challenges()
        
        return challenge_token, challenge_message
    
    def verify_login(self, challenge_token: str, signature_hex: str) -> Optional[str]:
        """
        Verify a login signature and create a session.
        
        Args:
            challenge_token: The challenge token from generate_challenge
            signature_hex: Signature of the challenge message
        
        Returns:
            Session token if valid, None otherwise
        """
        # Check if challenge exists
        if challenge_token not in self.challenges:
            return None
        
        challenge_data = self.challenges[challenge_token]
        
        # Check if challenge expired
        if datetime.utcnow() - challenge_data["timestamp"] > self.challenge_expiry:
            del self.challenges[challenge_token]
            return None
        
        username = challenge_data["username"]
        challenge_message = challenge_data["challenge"]
        
        # Verify signature
        if username not in self.public_keys:
            return None
        
        public_key = self.public_keys[username]
        is_valid = verify_signature(challenge_message, signature_hex, public_key)
        
        if not is_valid:
            return None
        
        # Remove used challenge
        del self.challenges[challenge_token]
        
        # Create session
        session_token = secrets.token_hex(32)
        self.sessions[session_token] = {
            "username": username,
            "expires_at": datetime.utcnow() + self.session_expiry
        }
        
        # Clean up expired sessions
        self._cleanup_expired_sessions()
        
        return session_token
    
    def verify_session(self, session_token: str) -> Optional[str]:
        """
        Verify a session token and return username if valid.
        
        Args:
            session_token: The session token
        
        Returns:
            Username if session is valid, None otherwise
        """
        if session_token not in self.sessions:
            return None
        
        session = self.sessions[session_token]
        
        # Check if session expired
        if datetime.utcnow() > session["expires_at"]:
            del self.sessions[session_token]
            return None
        
        return session["username"]
    
    def logout(self, session_token: str) -> bool:
        """
        Logout a user by invalidating their session.
        
        Args:
            session_token: The session token
        
        Returns:
            True if session was found and removed, False otherwise
        """
        if session_token in self.sessions:
            del self.sessions[session_token]
            return True
        return False
    
    def _cleanup_expired_challenges(self):
        """Remove expired challenges."""
        now = datetime.utcnow()
        expired = [
            token for token, data in self.challenges.items()
            if now - data["timestamp"] > self.challenge_expiry
        ]
        for token in expired:
            del self.challenges[token]
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions."""
        now = datetime.utcnow()
        expired = [
            token for token, session in self.sessions.items()
            if now > session["expires_at"]
        ]
        for token in expired:
            del self.sessions[token]

