# Ethereum Sweeper Bot

Minimal, secure sweeper bot for native chain token (ETH/BNB/MATIC...). 
**This repository must never contain a real `.env` file with private keys.**

## Quick start (local)
1. Copy `.env.example` to `.env` and fill your values.
2. `npm install`
3. `node bot.js`

## Run with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Systemd unit example
Create `/etc/ethbot.env` with the same variables, `chmod 600 /etc/ethbot.env`.
Create `/etc/systemd/system/ethbot.service` with the content of `ethbot.service` included in this repo.
Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ethbot
sudo journalctl -u ethbot -f
```

## Security
- Never push `.env` to GitHub.
- If `.env` is ever committed, rotate the key immediately.
- Prefer using a keystore or signer for production.

## Deploy (server)
Example pull & restart:
```bash
cd /opt/ethbot
git pull origin main
npm install
pm2 restart ethbot
```
