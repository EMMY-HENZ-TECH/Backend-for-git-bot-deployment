const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let deployedBots = {};

// Endpoint to deploy a bot
app.post("/deploy", (req, res) => {
  const { repo, sessionId, botName } = req.body;

  if (!repo || !sessionId || !botName) {
    return res.status(400).json({
      message: "Please provide a repository link, session ID, and bot name",
    });
  }

  if (deployedBots[botName]) {
    return res.status(400).json({ message: "Bot name is already deployed!" });
  }

  const command = `
    git clone ${repo} ${botName} &&
    cd ${botName} &&
    npm install &&
    SESSION_ID=${sessionId} npm start
  `;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ message: "Deployment failed", error });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }

    deployedBots[botName] = {
      repo,
      sessionId,
      stdout,
    };
    console.log(`Bot deployed successfully: ${stdout}`);
    res.json({ message: "Bot deployed successfully", botName });
  });
});

// Endpoint to list all deployed bots
app.get("/bots", (req, res) => {
  res.json(deployedBots);
});

// Endpoint to stop a bot
app.post("/stop", (req, res) => {
  const { botName } = req.body;

  if (!botName || !deployedBots[botName]) {
    return res.status(400).json({ message: "Bot name not found" });
  }

  const stopCommand = `pkill -f ${botName}`;
  exec(stopCommand, (error) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ message: "Failed to stop the bot", error });
    }

    delete deployedBots[botName];
    res.json({ message: `Bot ${botName} stopped successfully` });
  });
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the WhatsApp Bot Deployment Backend" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
