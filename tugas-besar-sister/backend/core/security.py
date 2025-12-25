"""
Security Manager with RSA Asymmetric Encryption
Public key encrypts, private key decrypts
"""
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
import base64
import os
from pathlib import Path

class SecurityManager:
    """Handles RSA encryption/decryption for group chat"""
    
    _private_key = None
    _public_key = None
    
    @staticmethod
    def generate_keypair(private_key_path, public_key_path):
        """Generate RSA keypair for a peer"""
        # Generate 2048-bit RSA key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Ensure directory exists
        Path(private_key_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Save private key
        with open(private_key_path, 'wb') as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Save public key
        with open(public_key_path, 'wb') as f:
            f.write(public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        
        return private_key, public_key
    
    @staticmethod
    def load_private_key(key_path):
        """Load private key from file"""
        if not os.path.exists(key_path):
            return None
        
        with open(key_path, 'rb') as f:
            key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
        return key
    
    @staticmethod
    def load_public_key(key_path):
        """Load public key from file"""
        if not os.path.exists(key_path):
            return None
        
        with open(key_path, 'rb') as f:
            key = serialization.load_pem_public_key(
                f.read(),
                backend=default_backend()
            )
        return key
    
    @staticmethod
    def get_private_key(private_key_path, public_key_path):
        """Get or load private key"""
        private_key = SecurityManager.load_private_key(private_key_path)
        if private_key is None:
            # Generate if not exists
            priv, pub = SecurityManager.generate_keypair(private_key_path, public_key_path)
            return priv
        return private_key
    
    @staticmethod
    def get_public_key(private_key_path, public_key_path):
        """Get or load public key"""
        public_key = SecurityManager.load_public_key(public_key_path)
        if public_key is None:
            # Generate if not exists
            priv, pub = SecurityManager.generate_keypair(private_key_path, public_key_path)
            return pub
        return public_key
    
    @staticmethod
    def encrypt_message(message: str, public_key) -> str:
        """Encrypt message using public key
        Returns base64-encoded ciphertext
        """
        try:
            plaintext = message.encode('utf-8')
            ciphertext = public_key.encrypt(
                plaintext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            # Return base64 encoded for safe transmission
            return base64.b64encode(ciphertext).decode('utf-8')
        except Exception as e:
            print(f"Encryption error: {e}")
            return None
    
    @staticmethod
    def decrypt_message(encrypted_message: str, private_key) -> str:
        """Decrypt message using private key
        Input is base64-encoded ciphertext
        """
        try:
            ciphertext = base64.b64decode(encrypted_message.encode('utf-8'))
            plaintext = private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return plaintext.decode('utf-8')
        except Exception as e:
            print(f"Decryption error: {e}")
            return None
    
    @staticmethod
    def export_public_key_pem(public_key) -> str:
        """Export public key as PEM string"""
        return public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')