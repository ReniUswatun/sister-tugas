"""
P2P Group Chat Backend - Multi-port Single-IP Architecture
Uses RSA asymmetric encryption for secure group messaging
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from core.connection import P2PConnection
from core.security import SecurityManager
from config import PEER_NAME, PEER_PORT, GROUP_PUBLIC_KEY, ALL_PEERS, DB_PATH, PEER_PRIVATE_KEY_FILE, PEER_PUBLIC_KEY_FILE, GROUP_PRIVATE_KEY_FILE, GROUP_PUBLIC_KEY_FILE
import json

app = Flask(__name__)
CORS(app)

# Initialize P2P connection for this peer
connection = P2PConnection(PEER_NAME, PEER_PORT, DB_PATH)
connection.listen()

# Load individual peer keys (for future use if needed)
private_key = SecurityManager.get_private_key(PEER_PRIVATE_KEY_FILE, PEER_PUBLIC_KEY_FILE)
public_key = SecurityManager.get_public_key(PEER_PRIVATE_KEY_FILE, PEER_PUBLIC_KEY_FILE)

# Load GROUP keypair - shared by all peers for message encryption/decryption
group_private_key = SecurityManager.get_private_key(GROUP_PRIVATE_KEY_FILE, GROUP_PUBLIC_KEY_FILE)
group_public_key = SecurityManager.get_public_key(GROUP_PRIVATE_KEY_FILE, GROUP_PUBLIC_KEY_FILE)

print(f"✓ Started {PEER_NAME} peer on port {PEER_PORT}")
print(f"✓ Database: {DB_PATH}")
print(f"✓ Private key: {PEER_PRIVATE_KEY_FILE}")
print(f"✓ Public key: {PEER_PUBLIC_KEY_FILE}")
print(f"✓ Group encryption: {GROUP_PRIVATE_KEY_FILE} / {GROUP_PUBLIC_KEY_FILE}")


@app.route('/api/verify-key', methods=['POST'])
def verify_key():
    """Verify group public key - simple auth to access chat"""
    data = request.json
    provided_key = data.get('public_key', '')
    
    if provided_key == GROUP_PUBLIC_KEY:
        return jsonify({
            "status": "authorized",
            "message": "Access granted to group chat",
            "group_name": "Group Chat Room",
            "peers": ALL_PEERS
        })
    else:
        return jsonify({
            "status": "unauthorized",
            "message": "Invalid group public key"
        }), 401


@app.route('/api/peers', methods=['GET'])
def get_peers():
    """Get all peers in the group"""
    return jsonify(ALL_PEERS)


@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get all messages in the group chat
    Optionally decrypt if group's private key is requested
    """
    decrypt = request.args.get('decrypt', 'false').lower() == 'true'
    rows = connection.get_all_messages()
    
    messages = []
    for row in rows:
        msg_id, sender_name, sender_port, msg, encrypted, timestamp = row
        
        # Decrypt if requested and message is encrypted
        decrypted_msg = msg
        if decrypt and encrypted and group_private_key:
            decrypted_msg = SecurityManager.decrypt_message(msg, group_private_key)
            if decrypted_msg is None:
                decrypted_msg = "[Failed to decrypt - wrong key?]"
        
        messages.append({
            "id": msg_id,
            "sender_name": sender_name,
            "sender_port": sender_port,
            "sender_display": f"{sender_name} @ localhost:{sender_port}",
            "text": decrypted_msg,
            "encrypted": bool(encrypted),
            "time": timestamp,
            "is_me": sender_port == PEER_PORT  # Check if message is from this peer
        })
    
    return jsonify(messages)


@app.route('/api/send', methods=['POST'])
def send_message():
    """Send a message to the group chat
    Message is encrypted with the GROUP's public key (all peers can decrypt with group private key)
    """
    try:
        data = request.json
        message_text = data.get('message', '')
        
        if not message_text:
            return jsonify({"status": "failed", "error": "Message cannot be empty"}), 400
        
        print(f"[{PEER_NAME}] Encrypting message: {message_text[:50]}")
        
        # Encrypt message with GROUP public key (all peers can decrypt)
        encrypted_msg = SecurityManager.encrypt_message(message_text, group_public_key)
        
        if encrypted_msg is None:
            return jsonify({"status": "failed", "error": "Encryption failed"}), 500
        
        # Save to own database
        connection._save_to_db(
            sender_name=PEER_NAME,
            sender_port=PEER_PORT,
            msg=encrypted_msg,
            encrypted=1
        )
        
        # Broadcast to other peers
        connection.broadcast_to_peers(encrypted_msg, PEER_PORT, encrypted=1)
        
        return jsonify({
            "status": "ok",
            "message": "Message sent to group",
            "sender": PEER_NAME,
            "port": PEER_PORT
        })
    
    except Exception as e:
        print(f"[{PEER_NAME}] Send error: {e}")
        return jsonify({
            "status": "failed",
            "error": str(e)
        }), 500


@app.route('/api/peer-info', methods=['GET'])
def peer_info():
    """Get current peer information"""
    return jsonify({
        "peer_name": PEER_NAME,
        "peer_port": PEER_PORT,
        "display": f"{PEER_NAME} @ localhost:{PEER_PORT}",
        "database": DB_PATH,
        "group_public_key": GROUP_PUBLIC_KEY
    })


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "peer": PEER_NAME,
        "port": PEER_PORT
    })


@app.route('/api/receive-message', methods=['POST'])
def receive_message():
    """Receive message from other peer"""
    data = request.json
    connection._save_to_db(
        sender_name=data.get('sender_name'),
        sender_port=data.get('sender_port'),
        msg=data.get('msg'),
        encrypted=data.get('encrypted', 0)
    )
    print(f"✓ {PEER_NAME} received message from {data.get('sender_name')}")
    return jsonify({"status": "received"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PEER_PORT, debug=False)