"""
Core blockchain implementation with Block and Blockchain classes.
"""
import hashlib
import json
import os
import random
import string
from datetime import datetime
from typing import List, Dict, Any, Optional
from .models import Transaction


class Block:
    """Represents a single block in the blockchain."""
    
    def __init__(self, index: int, timestamp: str, transactions: List[Transaction], 
                 previous_hash: str, nonce: int = 0):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()
    
    def compute_hash(self) -> str:
        """Compute SHA-256 hash of the block."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": [tx.model_dump() for tx in self.transactions],
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary for JSON serialization."""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": [tx.model_dump() for tx in self.transactions],
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }


class Blockchain:
    """Main blockchain class managing the chain and transactions."""
    
    def __init__(self, data_dir: str = "data"):
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.dev_users: Dict[str, str] = {}  # address -> name mapping
        self.public_keys: Dict[str, str] = {}  # username -> public_key_hex mapping
        self.data_dir = data_dir
        self.data_file = os.path.join(data_dir, "blockchain.json")
        self.keys_dir = os.path.join(data_dir, "keys")
        
        # Create data directory if it doesn't exist
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(self.keys_dir, exist_ok=True)
        
        # Load public keys if they exist
        self._load_public_keys()
        
        # Try to load existing chain, otherwise create genesis block
        if not self.load_from_file():
            self.create_genesis_block()
            self._initialize_dev_users()
            self.save_to_file()
    
    def _initialize_dev_users(self):
        """Initialize dev user accounts with 4-digit alphanumeric addresses."""
        names = ["cody", "ezzy", "alice", "bob", "charlie", "diana", "eve", "frank"]
        for name in names:
            address = self._generate_dev_address()
            self.dev_users[address] = name
    
    def _generate_dev_address(self) -> str:
        """Generate a 4-digit alphanumeric address."""
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(4))
    
    def _load_public_keys(self):
        """Load public keys from files in the keys directory."""
        from .crypto import load_public_key_from_file
        
        for username in ["cody", "ezzy"]:
            key_file = os.path.join(self.keys_dir, f"{username}_public.pem")
            if os.path.exists(key_file):
                try:
                    public_key = load_public_key_from_file(key_file)
                    self.public_keys[username] = public_key
                except Exception as e:
                    print(f"Warning: Could not load public key for {username}: {e}")
    
    def register_public_key(self, username: str, public_key_hex: str):
        """Register a public key for a user."""
        self.public_keys[username] = public_key_hex
    
    def get_dev_users(self) -> Dict[str, str]:
        """Get all dev user accounts."""
        return self.dev_users.copy()
    
    def create_genesis_block(self):
        """Create the first block (genesis block) in the chain."""
        genesis_block = Block(
            index=0,
            timestamp=datetime.utcnow().isoformat(),
            transactions=[],
            previous_hash="0"
        )
        # Mine the genesis block to get a valid hash
        self.mine_block(genesis_block)
        self.chain.append(genesis_block)
    
    def create_block(self) -> Block:
        """Create a new block with current pending transactions."""
        previous_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.utcnow().isoformat(),
            transactions=self.pending_transactions.copy(),
            previous_hash=previous_block.hash
        )
        return new_block
    
    def mine_block(self, block: Block) -> Block:
        """
        Mine a block using Proof-of-Work.
        Finds a hash starting with "0000" by incrementing nonce.
        """
        while not block.hash.startswith("0000"):
            block.nonce += 1
            block.hash = block.compute_hash()
        return block
    
    def add_transaction(self, transaction: Transaction):
        """
        Add a transaction to the pending transactions pool.
        Verifies signature if provided.
        """
        # Verify signature if present
        if transaction.signature:
            from .crypto import verify_transaction_signature
            
            # Check if sender has a registered public key
            sender_username = None
            for addr, name in self.dev_users.items():
                if addr == transaction.sender or name == transaction.sender:
                    sender_username = name
                    break
            
            if sender_username and sender_username in self.public_keys:
                public_key = self.public_keys[sender_username]
                timestamp = transaction.timestamp or datetime.utcnow().isoformat()
                
                is_valid = verify_transaction_signature(
                    transaction.sender,
                    transaction.receiver,
                    transaction.amount,
                    transaction.signature,
                    public_key,
                    timestamp
                )
                
                if not is_valid:
                    # Add debug info
                    print(f"Signature verification failed for {sender_username}")
                    print(f"  Sender: {transaction.sender}, Receiver: {transaction.receiver}")
                    print(f"  Amount: {transaction.amount}, Timestamp: {timestamp}")
                    print(f"  Signature: {transaction.signature[:32]}...")
                    raise ValueError("Invalid transaction signature")
            else:
                # Signature provided but no public key registered - allow but warn
                print(f"Warning: Signature provided for {transaction.sender} but no public key registered")
        
        # Verify ZK proof if present
        if transaction.zk_proof:
            try:
                from .zk_proof import verify_zk_proof
                if not verify_zk_proof(transaction.zk_proof, transaction.sender, transaction.receiver, transaction.amount):
                    raise ValueError("Invalid zero-knowledge proof")
            except ImportError:
                # zk_proof module not available yet
                pass
        
        self.pending_transactions.append(transaction)
        self.save_to_file()  # Auto-save after adding transaction
    
    def _calculate_mining_reward(self) -> float:
        """
        Calculate mining reward based on probability distribution:
        - 55% chance: 0.1-0.5 Coco
        - 25% chance: 0.6-0.7 Coco
        - 10% chance: 0.8-0.9 Coco
        - 10% chance: 1.0-1.4 Coco
        """
        rand = random.random()
        if rand < 0.55:  # 55% chance
            return round(random.uniform(0.1, 0.5), 1)
        elif rand < 0.80:  # 25% chance (0.55 to 0.80)
            return round(random.uniform(0.6, 0.7), 1)
        elif rand < 0.90:  # 10% chance (0.80 to 0.90)
            return round(random.uniform(0.8, 0.9), 1)
        else:  # 10% chance (0.90 to 1.0)
            return round(random.uniform(1.0, 1.4), 1)
    
    def mine_pending_transactions(self, miner_address: Optional[str] = None) -> Block:
        """
        Mine a new block with all pending transactions.
        If miner_address is provided, adds a mining reward transaction (Coco tokens).
        Clears pending transactions after mining.
        Returns the newly mined block.
        """
        # Create a copy of pending transactions
        transactions_to_mine = self.pending_transactions.copy()
        
        # Add mining reward if miner address is provided
        if miner_address:
            reward_amount = self._calculate_mining_reward()
            # Create reward transaction: system sends Coco to miner
            reward_tx = Transaction(
                sender="SYSTEM",
                receiver=miner_address,
                amount=reward_amount
            )
            transactions_to_mine.append(reward_tx)
        
        # Create block with transactions (even if empty)
        previous_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.utcnow().isoformat(),
            transactions=transactions_to_mine,
            previous_hash=previous_block.hash
        )
        
        mined_block = self.mine_block(new_block)
        self.chain.append(mined_block)
        self.pending_transactions = []
        self.save_to_file()  # Auto-save after mining block
        return mined_block
    
    def compute_balance(self, address: str) -> float:
        """
        Compute the Coco balance for a given address.
        Sums all transactions where address is receiver, 
        subtracts all transactions where address is sender.
        """
        balance = 0.0
        for block in self.chain:
            for tx in block.transactions:
                if tx.receiver == address:
                    balance += tx.amount
                if tx.sender == address:
                    balance -= tx.amount
        return balance
    
    def validate_chain(self) -> bool:
        """
        Validate the integrity of the blockchain.
        Checks that each block's hash is valid and previous_hash matches.
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check that the hash is valid
            if current_block.hash != current_block.compute_hash():
                return False
            
            # Check that previous_hash matches
            if current_block.previous_hash != previous_block.hash:
                return False
        
        return True
    
    def save_to_file(self) -> bool:
        """
        Save the blockchain state to a JSON file.
        Returns True if successful, False otherwise.
        """
        try:
            data = {
                "chain": [block.to_dict() for block in self.chain],
                "pending_transactions": [tx.model_dump() for tx in self.pending_transactions],
                "dev_users": self.dev_users,
                "last_saved": datetime.utcnow().isoformat()
            }
            
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving blockchain to file: {e}")
            return False
    
    def load_from_file(self) -> bool:
        """
        Load the blockchain state from a JSON file.
        Returns True if successful, False if file doesn't exist or error occurred.
        """
        if not os.path.exists(self.data_file):
            return False
        
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
            
            # Load chain
            self.chain = []
            for block_data in data.get("chain", []):
                transactions = [
                    Transaction(**tx_data) 
                    for tx_data in block_data.get("transactions", [])
                ]
                block = Block(
                    index=block_data["index"],
                    timestamp=block_data["timestamp"],
                    transactions=transactions,
                    previous_hash=block_data["previous_hash"],
                    nonce=block_data.get("nonce", 0)
                )
                block.hash = block_data["hash"]  # Restore computed hash
                self.chain.append(block)
            
            # Load pending transactions
            self.pending_transactions = [
                Transaction(**tx_data)
                for tx_data in data.get("pending_transactions", [])
            ]
            
            # Load dev users
            self.dev_users = data.get("dev_users", {})
            
            # Re-initialize dev users if empty (backward compatibility)
            if not self.dev_users:
                self._initialize_dev_users()
            
            return True
        except Exception as e:
            print(f"Error loading blockchain from file: {e}")
            return False

