import os
import sys
import secrets
import subprocess
import re

def main():
    keystores_dir = "android/keystores"
    os.makedirs(keystores_dir, exist_ok=True)
    
    keystore_path = os.path.join(keystores_dir, "synqsquad-upload-key.jks")
    if os.path.exists(keystore_path):
        os.remove(keystore_path)
        
    # Generate secure 32-char random password
    new_password = secrets.token_hex(16)
    
    # Generate new RSA 2048-bit keystore with 25-year validity
    keytool = "/opt/homebrew/opt/openjdk@21/bin/keytool"
    if not os.path.exists(keytool):
        keytool = "/usr/bin/keytool"
    alias = "synqsquad-upload"
    dname = "CN=SynqSquad Upload, OU=Mobile Engineering, O=SynqSquad, L=New Delhi, ST=Delhi, C=IN"
    
    cmd_gen = [
        keytool,
        "-genkeypair",
        "-v",
        "-keystore", keystore_path,
        "-alias", alias,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", new_password,
        "-keypass", new_password,
        "-dname", dname
    ]
    
    res_gen = subprocess.run(cmd_gen, capture_output=True, text=True)
    if res_gen.returncode != 0:
        print(f"Keytool generation error: {res_gen.stderr}", file=sys.stderr)
        sys.exit(1)
        
    # Write strictly to untracked keystore.properties and secret file
    props_path = "android/keystore.properties"
    with open(props_path, "w", encoding="utf-8") as f:
        f.write(f"storeFile=../keystores/synqsquad-upload-key.jks\n")
        f.write(f"storePassword={new_password}\n")
        f.write(f"keyAlias={alias}\n")
        f.write(f"keyPassword={new_password}\n")

    secret_file = os.path.join(keystores_dir, ".keystore-secret.txt")
    with open(secret_file, "w", encoding="utf-8") as f:
        f.write(new_password)
        
    # Extract SHA-256 fingerprint
    cmd_fp = [
        keytool,
        "-list",
        "-v",
        "-keystore", keystore_path,
        "-alias", alias,
        "-storepass", new_password
    ]
    res_fp = subprocess.run(cmd_fp, capture_output=True, text=True)
    match = re.search(r"SHA256:\s*([0-9A-Fa-f:]+)", res_fp.stdout)
    if not match:
        print("Could not find SHA-256 fingerprint", file=sys.stderr)
        sys.exit(1)
        
    sha256_fp = match.group(1).strip().upper()
    print(f"ROTATED_SHA256_FINGERPRINT={sha256_fp}")

if __name__ == "__main__":
    main()
