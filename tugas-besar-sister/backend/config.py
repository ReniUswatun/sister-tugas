"""
Peer Configuration System
Define each peer with name, port, and encryption keys
"""
import os
from pathlib import Path

# Get current peer port from environment (default 5003 for Alice)
PEER_PORT = int(os.getenv('PEER_PORT', '5003'))

# Get peer name from environment (optional override)
# Usage: PEER_NAME_OVERRIDE=MyCustomName
PEER_NAME_OVERRIDE = os.getenv('PEER_NAME_OVERRIDE', None)

# Configuration for each peer (backend ports: 5003-5005)
PEER_CONFIG = {
    5003: {
        'name': 'Alice',
        'port': 5003,
        'private_key_file': 'keys/alice_private.pem',
        'public_key_file': 'keys/alice_public.pem',
    },
    5004: {
        'name': 'Bob',
        'port': 5004,
        'private_key_file': 'keys/bob_private.pem',
        'public_key_file': 'keys/bob_public.pem',
    },
    5005: {
        'name': 'Charlie',
        'port': 5005,
        'private_key_file': 'keys/charlie_private.pem',
        'public_key_file': 'keys/charlie_public.pem',
    }
}

# Current peer info
CURRENT_PEER = PEER_CONFIG.get(PEER_PORT, PEER_CONFIG[5003])
PEER_NAME = PEER_NAME_OVERRIDE or CURRENT_PEER['name']
PEER_PRIVATE_KEY_FILE = CURRENT_PEER['private_key_file']
PEER_PUBLIC_KEY_FILE = CURRENT_PEER['public_key_file']

# Group settings
GROUP_PUBLIC_KEY = "chat123"  # Simple string key for joining group
GROUP_PRIVATE_KEY_FILE = 'keys/group_private.pem'
GROUP_PUBLIC_KEY_FILE = 'keys/group_public.pem'
ALL_PEERS = [
    {'name': 'Alice', 'port': 5003, 'url': 'http://localhost:5003'},
    {'name': 'Bob', 'port': 5004, 'url': 'http://localhost:5004'},
    {'name': 'Charlie', 'port': 5005, 'url': 'http://localhost:5005'},
]

# Database
DB_PATH = f'data/peer{PEER_PORT}.db'

# Ensure keys directory exists
Path('keys').mkdir(exist_ok=True)
Path('data').mkdir(exist_ok=True)
