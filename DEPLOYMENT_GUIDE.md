# SafnexBD — Multi-Site VPS Deployment & GitHub Actions CI/CD Guide

This guide explains how to deploy **SafnexBD** on your VPS alongside your existing website with **zero downtime or conflict to the existing site**, and how to enable automatic updates whenever you push code from VS Code.

---

## Architecture Overview

```
                          Internet / Visitors
                                   │
                                   ▼
                       Nginx Reverse Proxy (VPS)
                  ┌────────────────┴────────────────┐
                  │ (safnexbd.com)                  │ (your-existing-site.com)
                  ▼                                 ▼
      ┌───────────────────────┐         ┌───────────────────────┐
      │  SafnexBD (Multi-App) │         │  Existing Website     │
      │  - Frontend: Port 3000│         │  - Completely         │
      │  - Backend:  Port 5000│         │    Untouched & Safe!  │
      │  - DB: 'safnexbd'     │         └───────────────────────┘
      │  - PM2: safnexbd-*    │
      └───────────────────────┘
```

---

## Step 1: Initialize Git & Push to GitHub

In your VS Code terminal, run:

```bash
# 1. Initialize Git (if not already initialized)
git init

# 2. Add all files to Git (all sensitive files are protected by .gitignore)
git add .

# 3. Commit your initial code
git commit -m "feat: complete SafnexBD platform with CI/CD deployment"

# 4. Set default branch to main
git branch -M main

# 5. Create a new repository on GitHub (e.g. named 'safnexbd')
# Then link it and push:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/safnexbd.git
git push -u origin main
```

---

## Step 2: Configure GitHub Secrets (For Auto-Deployment)

In your GitHub repository, go to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ Click **New repository secret**:

| Secret Name | Value | Description |
|---|---|---|
| `VPS_HOST` | `123.45.67.89` | Your VPS Public IP Address |
| `VPS_USERNAME` | `root` or `ubuntu` | SSH login username |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Your private SSH key (from `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`) |
| `VPS_PORT` | `22` | SSH Port (default is 22) |

> **How to generate an SSH Key on your PC (if you don't have one):**
> ```bash
> ssh-keygen -t ed25519 -C "deploy@safnexbd.com"
> ```
> Then copy the public key (`~/.ssh/id_ed25519.pub`) to your VPS `~/.ssh/authorized_keys`, and put the private key (`~/.ssh/id_ed25519`) into the GitHub Secret `VPS_SSH_KEY`.

---

## Step 3: Domain DNS Setup

In your domain registrar (Namecheap, Cloudflare, GoDaddy, etc.) for `safnexbd.com`:
- Add an **A Record**:
  - **Type**: `A`
  - **Host / Name**: `@`
  - **Value / IP**: Your VPS IP address (e.g. `123.45.67.89`)
  - **TTL**: `Automatic` (or `300`)
- Add a **CNAME** or **A Record** for `www`:
  - **Type**: `CNAME`
  - **Host / Name**: `www`
  - **Value**: `safnexbd.com`

---

## Step 4: Initial VPS Setup (One-Time Only)

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

### 1. Clone the repository into `/var/www/safnexbd`:
```bash
sudo mkdir -p /var/www/safnexbd
sudo chown -R $USER:$USER /var/www/safnexbd
git clone https://github.com/YOUR_GITHUB_USERNAME/safnexbd.git /var/www/safnexbd
cd /var/www/safnexbd
```

### 2. Configure Environment Files:
```bash
# Backend .env
cp /var/www/safnexbd/backend/.env.example /var/www/safnexbd/backend/.env
nano /var/www/safnexbd/backend/.env
# Set your MySQL password, strong JWT secrets, etc.

# Frontend .env
cp /var/www/safnexbd/frontend/.env.example /var/www/safnexbd/frontend/.env
```

### 3. Create the Database:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS safnexbd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Configure Nginx (Isolated - Won't Affect Existing Sites):
```bash
sudo cp /var/www/safnexbd/deploy/nginx/safnexbd.conf /etc/nginx/sites-available/safnexbd.conf
sudo ln -s /etc/nginx/sites-available/safnexbd.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Issue Free SSL with Certbot:
```bash
sudo certbot --nginx -d safnexbd.com -d www.safnexbd.com
```

### 6. Start PM2 Services for the first time:
```bash
cd /var/www/safnexbd
npm ci
cd backend && npm ci && npx prisma generate && npx prisma db push && npm run build
cd ../frontend && npm ci && npm run build
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## Step 5: The Magic — Automatic Deployment on Every Git Push!

Once Step 1 to 4 are done, you never have to SSH into the VPS again to deploy!

Whenever you make changes in VS Code:
```bash
git add .
git commit -m "Update feature XYZ"
git push origin main
```

**What happens next:**
1. GitHub Actions detects your push to `main`.
2. Connects to your VPS securely via SSH.
3. Pulls the latest code.
4. Compiles the Backend & applies any database migrations.
5. Compiles the Frontend.
6. Reloads PM2 (`safnexbd-backend` and `safnexbd-frontend`) with **zero downtime**.
7. Your live website at `https://safnexbd.com` is instantly updated!
