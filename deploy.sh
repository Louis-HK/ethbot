#!/usr/bin/env bash
set -e
cd /opt/ethbot
git pull origin main
npm install
pm2 restart ethbot || pm2 start ecosystem.config.js --name ethbot
