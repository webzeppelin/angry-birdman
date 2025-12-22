#!/bin/bash
# Generate self-signed SSL certificate for test environment
# This should be run once on the test server

set -e

SSL_DIR="./ssl"
mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo "SSL certificates already exist in $SSL_DIR"
    exit 0
fi

echo "Generating self-signed SSL certificate for test environment..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=US/ST=Test/L=Test/O=AngryBirdman/CN=192.168.0.70" \
    -addext "subjectAltName=IP:192.168.0.70,DNS:localhost"

chmod 644 "$SSL_DIR/cert.pem"
chmod 600 "$SSL_DIR/key.pem"

echo "✓ SSL certificate generated successfully"
echo "  Certificate: $SSL_DIR/cert.pem"
echo "  Private key: $SSL_DIR/key.pem"
echo ""
echo "Note: This is a self-signed certificate. Browsers will show a warning."
echo "You'll need to accept the security exception in your browser."
