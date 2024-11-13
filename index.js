const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage for deployed bots
let activeBots = {};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Deploy a bot
app.post('/deploy', (req, res) => {
  const { repo, sessionId, name } = req.body;

  if (!repo || !sessionId || !name) {
    return res.status(400).json({ error: 'Repository link, session ID, and bot name are required' });
  }

  if (activeBots[name]) {
    return res.status(400).json({ error: `A bot with the name "${name}" is already running.` });
  }

  const botFolder = path.join(__dirname, 'bots', name);
  const command = `git clone ${repo} ${botFolder} && cd ${botFolder} && npm install && BOT_SESSION=${sessionId} npm start`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: 'Deployment failed' });
    }

    console.log(`Stdout: ${stdout}`);
    activeBots[name] = { sessionId, startedAt: new Date() };

    res.json({ message: 'Bot deployed successfully', botName: name });
  });
});

// Stop a bot
app.post('/stop', (req, res) => {
  const { name } = req.body;

  if (!activeBots[name]) {
    return res.status(404).json({ error: `No bot with the name "${name}" is running.` });
  }

  const command = `pkill -f ${name}`;
  exec(command, (error) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to stop bot' });
    }

    delete activeBots[name];
    res.json({ message: `Bot "${name}" stopped successfully.` });
  });
});

// List all active bots
app.get('/bots', (req, res) => {
  const bots = Object.keys(activeBots).map((name) => ({
    name,
    sessionId: activeBots[name].sessionId,
    startedAt: activeBots[name].startedAt,
    expiresAt: new Date(
      new Date(activeBots[name].startedAt).getTime() + 14 * 24 * 60 * 60 * 1000
    ),
  }));

  res.json(bots);
});

// Clean up expired bots (runs every 12 hours)
setInterval(() => {
  const now = new Date();
  for (const name in activeBots) {
    const expiryDate = new Date(
      new Date(activeBots[name].startedAt).getTime() + 14 * 24 * 60 * 60 * 1000
    );
    if (now > expiryDate) {
      exec(`pkill -f ${name}`, () => {
        console.log(`Bot "${name}" expired and stopped.`);
        delete activeBots[name];
      });
    }
  }
}, 12 * 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
