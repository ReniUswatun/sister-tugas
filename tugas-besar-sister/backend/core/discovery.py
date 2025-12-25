import socket
import threading
import json
import time

class DiscoveryService:
    def __init__(self, username, listen_port=5001):
        self.username = username
        self.listen_port = listen_port
        self.peers = {} # Format: {ip: username}
        self.running = True

    def start(self):
        # Thread untuk "Berteriak" (Broadcast)
        threading.Thread(target=self._broadcast_presence, daemon=True).start()
        # Thread untuk "Mendengar" (Listen)
        threading.Thread(target=self._listen_for_peers, daemon=True).start()

    def _broadcast_presence(self):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            while self.running:
                message = json.dumps({"username": self.username, "action": "hello"})
                s.sendto(message.encode(), ('<broadcast>', self.listen_port))
                time.sleep(5) # Ulangi setiap 5 detik

    def _listen_for_peers(self):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.bind(('0.0.0.0', self.listen_port))
            while self.running:
                data, addr = s.recvfrom(1024)
                info = json.loads(data.decode())
                if info['action'] == "hello" and addr[0] != socket.gethostbyname(socket.gethostname()):
                    self.peers[addr[0]] = info['username']