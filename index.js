const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Store deployed bots
let deployedBots = {};

// Endpoint to deploy a bot
app.post('/deploy', (req, res) => {
  const { repo, sessionId } = req.body;

  if (!repo || !sessionId) {
    return res.status(400).send('Repository link and Session ID are required');
  }

  const botName = `bot_${Date.now()}`; // Generate a unique bot name

  // Simulate deployment command
  const command = `echo "Deploying bot from ${repo} with session ID ${sessionId}"`;

  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      return res.status(500).send('Error occurred while deploying the bot');
    }
    deployedBots[botName] = { repo, sessionId };
    res.send({ message: 'Bot deployed successfully', botName });
  });
});

// Endpoint to stop a bot
app.post('/stop', (req, res) => {
  const { botName } = req.body;

  if (!botName || !deployedBots[botName]) {
    return res.status(400).send('Invalid bot name');
  }

  // Simulate stopping the bot
  const command = `echo "Stopping bot ${botName}"`;

  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      return res.status(500).send('Error occurred while stopping the bot');
    }
    delete deployedBots[botName];
    res.send({ message: `Bot ${botName} stopped successfully` });
  });
});

// Endpoint to list all deployed bots
app.get('/bots', (req, res) => {
  res.send({ deployedBots });
});

// Home route
app.get('/', (req, res) => {
  res.send('Backend for Custom Bot Deployment is running.');
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
