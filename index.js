
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory bot tracker
let deployedBots = [];

// Load bots from file on startup
if (fs.existsSync('bots.json')) {
  deployedBots = JSON.parse(fs.readFileSync('bots.json', 'utf8'));
}

// API: Deploy a bot
app.post('/deploy', (req, res) => {
  const { repo, sessionId, name } = req.body;

  if (!repo || !sessionId || !name) {
    return res.status(400).json({ error: 'Repository link, session ID, and bot name are required.' });
  }

  // Deploy the bot
  const command = `git clone ${repo} && cd ${name} && npm install && npm start`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: 'Deployment failed.' });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: 'Deployment encountered issues.' });
    }

    // Track deployed bot
    const newBot = { name, sessionId, repo, status: 'running' };
    deployedBots.push(newBot);
    fs.writeFileSync('bots.json', JSON.stringify(deployedBots, null, 2));

    console.log(`Stdout: ${stdout}`);
    res.json({ message: 'Bot deployed successfully', bot: newBot });
  });
});

// API: Stop a bot
app.post('/stop', (req, res) => {
  const { name } = req.body;

  const botIndex = deployedBots.findIndex(bot => bot.name === name);
  if (botIndex === -1) {
    return res.status(404).json({ error: 'Bot not found.' });
  }

  // Simulate stopping the bot (add actual logic if needed)
  deployedBots[botIndex].status = 'stopped';
  fs.writeFileSync('bots.json', JSON.stringify(deployedBots, null, 2));

  res.json({ message: `Bot "${name}" stopped successfully.` });
});

// API: List all deployed bots
app.get('/bots', (req, res) => {
  res.json(deployedBots);
});

// API: Get bot details
app.get('/bots/:name', (req, res) => {
  const { name } = req.params;
  const bot = deployedBots.find(bot => bot.name === name);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found.' });
  }

  res.json(bot);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
