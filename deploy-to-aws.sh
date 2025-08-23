#!/bin/bash

# PersonaPass Backend Deployment Script for AWS EC2
# Deploys to production instance at 44.201.59.57

set -e  # Exit on any error

echo "🚀 Starting PersonaPass Backend Deployment to AWS..."

# Configuration
AWS_IP="44.201.59.57"
DEPLOY_USER="ubuntu"
APP_DIR="/home/ubuntu/persona-services"
SERVICE_NAME="personapass-backend"

echo "📦 Creating deployment package..."

# Create a clean deployment directory
rm -rf deploy-package
mkdir -p deploy-package

# Copy essential files
cp -r src deploy-package/
cp package.json deploy-package/
cp package-lock.json deploy-package/

# Create logs directory
mkdir -p deploy-package/logs

# Create systemd service file
cat > deploy-package/personapass-backend.service << 'EOF'
[Unit]
Description=PersonaPass Backend API Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/persona-services
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=personapass-backend

[Install]
WantedBy=multi-user.target
EOF

# Create deployment script to run on server
cat > deploy-package/remote-deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
cd /home/ubuntu/persona-services
npm ci --only=production

echo "🔧 Setting up systemd service..."
sudo cp personapass-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable personapass-backend

echo "🛑 Stopping existing service if running..."
sudo systemctl stop personapass-backend || true

echo "🚀 Starting PersonaPass Backend Service..."
sudo systemctl start personapass-backend

echo "📊 Checking service status..."
sudo systemctl status personapass-backend --no-pager

echo "✅ PersonaPass Backend deployed successfully!"
echo "📍 Service available at: http://44.201.59.57:3001"
echo "🔍 Health check: curl http://44.201.59.57:3001/health"
EOF

chmod +x deploy-package/remote-deploy.sh

echo "📤 Uploading to AWS instance..."

# Upload deployment package to AWS
scp -r deploy-package/* ubuntu@${AWS_IP}:${APP_DIR}/

echo "🔧 Running deployment on AWS..."

# Execute deployment on remote server
ssh ubuntu@${AWS_IP} "cd ${APP_DIR} && bash remote-deploy.sh"

echo "🎯 Testing deployment..."

# Test the deployed service
sleep 5
curl -f http://${AWS_IP}:3001/health || {
    echo "❌ Health check failed!"
    exit 1
}

echo "✅ PersonaPass Backend successfully deployed to AWS!"
echo "🌐 Service URLs:"
echo "   Health Check: http://${AWS_IP}:3001/health"
echo "   API Status:   http://${AWS_IP}:3001/api/status"
echo "   TOTP Setup:   POST http://${AWS_IP}:3001/api/auth/totp-setup"
echo "   Create Account: POST http://${AWS_IP}:3001/api/auth/create-account"

# Clean up
rm -rf deploy-package

echo "🎉 Deployment complete!"