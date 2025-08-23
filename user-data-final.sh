#!/bin/bash
# PersonaChain - Final Validator Startup Script
set -ex
exec > >(tee /var/log/user-data.log) 2>&1

echo "--- Starting PersonaChain Deployment ---"
date

# --- 1. System Setup ---
apt-get update -y
apt-get install -y jq curl unzip

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# --- 2. Create Application User ---
useradd -m -s /bin/bash personachain || echo "User 'personachain' already exists."

# --- 3. Download the Working Binary from S3 ---
echo "Downloading the personachaind binary from S3..."
aws s3 cp s3://personachain-testnet-shared-19310483/binaries/personachaind-v0.47.4 /usr/local/bin/personachaind
chmod +x /usr/local/bin/personachaind
echo "Binary downloaded and installed."

# --- 4. Initialize and Configure the Chain ---
echo "Initializing the chain..."
export DAEMON="/usr/local/bin/personachaind"
export HOME_DIR="/home/personachain/.personachain"
export CHAIN_ID="personachain-1"
export DENOM="upersona"

sudo -u personachain $DAEMON init "genesis-validator" --chain-id $CHAIN_ID --home $HOME_DIR

echo "Configuring genesis and app files..."
sudo -u personachain sed -i 's/"stake/"/'"$DENOM"'"/g' $HOME_DIR/config/genesis.json
sudo -u personachain sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.025'"$DENOM"'"/' $HOME_DIR/config/app.toml
sudo -u personachain sed -i 's/laddr = "tcp:\/\/127.0.0.1:26657"/laddr = "tcp:\/\/0.0.0.0:26657"/' $HOME_DIR/config/config.toml
sudo -u personachain sed -i 's/enable = false/enable = true/' $HOME_DIR/config/app.toml # Enable API server

# --- 5. Create the Genesis Validator ---
echo "Creating genesis validator..."
# Use the 'file' backend for non-interactive scripting
sudo -u personachain $DAEMON keys add validator --keyring-backend file --home $HOME_DIR
VALIDATOR_ADDR=$(sudo -u personachain $DAEMON keys show validator -a --keyring-backend file --home $HOME_DIR)
sudo -u personachain $DAEMON add-genesis-account $VALIDATOR_ADDR 1000000000$DENOM --keyring-backend file --home $HOME_DIR
sudo -u personachain $DAEMON gentx validator 500000000$DENOM --chain-id $CHAIN_ID --keyring-backend file --home $HOME_DIR
sudo -u personachain $DAEMON collect-gentxs --home $HOME_DIR
sudo -u personachain $DAEMON validate-genesis --home $HOME_DIR
echo "Genesis validator created successfully."

# --- 6. Create and Start the Systemd Service ---
echo "Setting up systemd service..."
cat > /etc/systemd/system/personachain.service << EOF
[Unit]
Description=PersonaChain Node
After=network-online.target
Wants=network-online.target

[Service]
User=personachain
ExecStart=/usr/local/bin/personachaind start --home /home/personachain/.personachain
Restart=on-failure
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable personachain.service
systemctl start personachain.service

echo "--- PersonaChain Deployment Complete ---"
