import hashlib
import os
def hash_password(plain: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 80_000)
    return salt.hex() + ":" + digest.hex()
def password_matches(plain: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":")
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode(), bytes.fromhex(salt_hex), 80_000)
    return digest.hex() == digest_hex
