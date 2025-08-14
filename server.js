const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 4000;
const ENV_PATH = path.resolve(__dirname, '.env');

app.use(bodyParser.urlencoded({ extended: true }));

// Basic Authentication (change username/password as needed)
const auth = (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== 'admin' || user.pass !== 'jsSbeCwPUD6MCv') {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

app.use(auth);

// Function to read .env file into an object
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const lines = content.split('\n');
  const envObj = {};
  lines.forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key) envObj[key.trim()] = vals.join('=').trim();
  });
  return envObj;
}

// Function to write object back to .env file
function writeEnv(envObj) {
  const lines = Object.entries(envObj).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf8');
}

// Main page: configuration form
app.get('/', (req, res) => {
  const env = readEnv();
  res.send(`
    <h1>Ethereum Bot Configuration Manager</h1>
    <form method="POST" action="/update">
      <label>Ethereum Private Key:<br>
        <input type="text" name="PRIVATE_KEY" value="${env.PRIVATE_KEY || ''}" style="width: 600px;" />
      </label><br><br>

      <label>Master Wallet (address):<br>
        <input type="text" name="MASTER_WALLET" value="${env.MASTER_WALLET || ''}" style="width: 600px;" />
      </label><br><br>

      <label>RPC URL:<br>
        <input type="text" name="RPC_URL" value="${env.RPC_URL || ''}" style="width: 600px;" />
      </label><br><br>

      <button type="submit">Update Configuration</button>
    </form>
  `);
});

// POST route to update configuration and restart the bot
app.post('/update', (req, res) => {
  const { PRIVATE_KEY, MASTER_WALLET, RPC_URL } = req.body;

  if (!PRIVATE_KEY || !MASTER_WALLET || !RPC_URL) {
    return res.status(400).send('All fields are required.<br><a href="/">Go back</a>');
  }

  // Read existing .env and update values
  const env = readEnv();
  env.PRIVATE_KEY = PRIVATE_KEY.trim();
  env.MASTER_WALLET = MASTER_WALLET.trim();
  env.RPC_URL = RPC_URL.trim();

  try {
    writeEnv(env);
  } catch (err) {
    return res.status(500).send(`Error saving configuration: ${err.message}<br><a href="/">Go back</a>`);
  }

  // Restart the bot using PM2
  exec('pm2 restart ethbot', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error restarting the bot: ${error.message}<br><a href="/">Go back</a>`);
    }
    res.send(`<p>Configuration updated and bot successfully restarted.</p><a href="/">Go back</a>`);
  });
});

app.listen(PORT, () => {
  console.log(`Configuration management server started at http://localhost:${PORT}`);
});

