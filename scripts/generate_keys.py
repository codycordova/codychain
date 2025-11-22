"""
Script to generate Ed25519 keypairs for users cody and ezzy.
Keys are stored in data/keys/ directory.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import blockchain modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from blockchain.crypto import generate_keypair


def save_keypair(username: str, private_key: bytes, public_key: bytes, keys_dir: str = "data/keys"):
    """
    Save a keypair to files.
    
    Args:
        username: Username (cody or ezzy)
        private_key: Private key bytes (hex encoded)
        public_key: Public key bytes (hex encoded)
        keys_dir: Directory to save keys
    """
    os.makedirs(keys_dir, exist_ok=True)
    
    # Save private key (hex format)
    private_key_file = os.path.join(keys_dir, f"{username}_private.pem")
    with open(private_key_file, 'w') as f:
        f.write(private_key.decode('utf-8'))
    print(f"✓ Private key saved to {private_key_file}")
    
    # Save public key (hex format)
    public_key_file = os.path.join(keys_dir, f"{username}_public.pem")
    with open(public_key_file, 'w') as f:
        f.write(public_key.decode('utf-8'))
    print(f"✓ Public key saved to {public_key_file}")
    
    print(f"✓ Keypair generated for {username}")
    print(f"  Private key (hex): {private_key.decode('utf-8')[:64]}...")
    print(f"  Public key (hex): {public_key.decode('utf-8')[:64]}...")
    print()


def main():
    """Generate keypairs for cody and ezzy."""
    print("Generating Ed25519 keypairs for cody and ezzy...")
    print()
    
    users = ["cody", "ezzy"]
    
    for username in users:
        print(f"Generating keys for {username}...")
        private_key, public_key = generate_keypair()
        save_keypair(username, private_key, public_key)
    
    print("=" * 60)
    print("Key generation complete!")
    print()
    print("IMPORTANT: Keep private keys secure and never share them.")
    print("Public keys can be shared and are used for signature verification.")
    print("=" * 60)


if __name__ == "__main__":
    main()

