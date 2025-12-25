import socket
import threading
import sqlite3
import json
import os
import requests
from datetime import datetime
from config import PEER_NAME, PEER_PORT, ALL_PEERS, DB_PATH

class P2PConnection:
    def __init__(self, peer_name, peer_port, db_path):
        self.peer_name = peer_name
        self.peer_port = peer_port
        self.db_path = db_path
        # Memastikan folder data ada
        os.makedirs(os.path.dirname(db_path) or 'data', exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize group chat database"""
        conn = sqlite3.connect(self.db_path)
        conn.execute('''CREATE TABLE IF NOT EXISTS messages 
            (id INTEGER PRIMARY KEY AUTOINCREMENT, 
             sender_name TEXT,
             sender_port INTEGER,
             msg TEXT,
             encrypted INTEGER,
             timestamp TEXT)''')
        conn.commit()
        conn.close()

    def listen(self):
        """Initialize listening (Flask handles network, this is legacy)"""
        print(f"[{self.peer_name}] P2PConnection initialized (Flask will handle networking)")

    def _save_to_db(self, sender_name, sender_port, msg, encrypted=0):
        """Save message to database"""
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            "INSERT INTO messages (sender_name, sender_port, msg, encrypted, timestamp) VALUES (?, ?, ?, ?, ?)",
            (sender_name, sender_port, msg, encrypted, datetime.now().strftime("%H:%M:%S"))
        )
        conn.commit()
        conn.close()

    def broadcast_to_peers(self, message, sender_port, encrypted=1):
        """Broadcast message to all other peers via HTTP"""
        for peer in ALL_PEERS:
            if peer['port'] != self.peer_port:  # Don't send to self
                try:
                    # Use localhost for direct communication
                    url = f"http://localhost:{peer['port']}/api/receive-message"
                    payload = {
                        'sender_name': self.peer_name,
                        'sender_port': self.peer_port,
                        'msg': message,
                        'encrypted': encrypted
                    }
                    response = requests.post(url, json=payload, timeout=2)
                    if response.status_code == 200:
                        print(f"[{self.peer_name}] Sent to {peer['name']} @ {peer['port']}")
                    else:
                        print(f"[{self.peer_name}] Failed to send to {peer['name']}: {response.status_code}")
                except Exception as e:
                    print(f"[{self.peer_name}] Cannot reach {peer['name']} @ {peer['port']}: {e}")
    
    def get_all_messages(self):
        """Get all messages in group chat"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, sender_name, sender_port, msg, encrypted, timestamp FROM messages ORDER BY id DESC"
        )
        rows = cursor.fetchall()
        conn.close()
        return rows