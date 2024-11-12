const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post('/deploy', (req, res) => {
  const repoLink = req.body.repo;
  if (!repoLink) return res.status(400).send('Repository link is required');

  // Command to clone and set up the repository
  const command = `
    git clone ${repoLink} bot-folder &&
    cd bot-folder &&
    npm install &&
    node index.js
  `;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Deployment failed');
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).send('Deployment issue encountered');
    }
    console.log(`Stdout: ${stdout}`);
    res.send({ message: 'Bot deployed successfully', sessionId: 'session_12345678' });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
