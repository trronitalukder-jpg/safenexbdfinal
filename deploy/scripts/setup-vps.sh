#!/bin/bash
# ==============================================================================
# SafnexBD - Initial VPS Setup Script (Multi-Site VPS Friendly)
# Run as root or with sudo: bash setup-vps.sh
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 SafnexBD - Initial VPS Setup"
echo "=========================================================="

# 1. Verify Node.js, PM2, and Nginx
echo "🔍 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node -v) is installed."
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
    pm2 startup || true
else
    echo "✅ PM2 $(pm2 -v) is installed."
fi

if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt-get update && sudo apt-get install -y nginx
else
    echo "✅ Nginx is installed."
fi

# 2. Create Isolated Project Directory
echo "📁 Setting up project directory at /var/www/safnexbd..."
sudo mkdir -p /var/www/safnexbd
sudo mkdir -p /var/www/safnexbd/uploads
sudo chown -R $USER:$USER /var/www/safnexbd
sudo chmod -R 755 /var/www/safnexbd/uploads

# 3. Create MySQL Database if not exists
echo "🗄️ Checking MySQL database..."
if command -v mysql &> /dev/null; then
    echo "Creating 'safnexbd' database (if not already existing)..."
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS safnexbd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || echo "Note: Run database creation manually if root password is required."
fi

echo "=========================================================="
echo "✅ VPS Base Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Clone your GitHub repository into /var/www/safnexbd:"
echo "   git clone https://github.com/YOUR_GITHUB_USERNAME/safnexbd.git /var/www/safnexbd"
echo ""
echo "2. Copy and configure backend/.env:"
echo "   cp /var/www/safnexbd/backend/.env.example /var/www/safnexbd/backend/.env"
echo "   nano /var/www/safnexbd/backend/.env"
echo ""
echo "3. Copy and configure frontend/.env:"
echo "   cp /var/www/safnexbd/frontend/.env.example /var/www/safnexbd/frontend/.env"
echo ""
echo "4. Copy Nginx configuration and enable site:"
echo "   sudo cp /var/www/safnexbd/deploy/nginx/safnexbd.conf /etc/nginx/sites-available/safnexbd.conf"
echo "   sudo ln -s /etc/nginx/sites-available/safnexbd.conf /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "5. Issue SSL Certificate with Certbot:"
echo "   sudo certbot --nginx -d safnexbd.com -d www.safnexbd.com"
echo "=========================================================="
