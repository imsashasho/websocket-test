require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

// 1. Create a basic HTTP server to serve the website
const server = http.createServer((req, res) => {
  // Default to index.html
  let filePath = req.url === '/' ? '/client/index.html' : `/client${req.url}`;

  // Resolve absolute path based on current directory
  const absolutePath = path.join(__dirname, filePath);

  // Get file extension to set correct Content-Type
  const extname = path.extname(absolutePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
  };
  const contentType = contentTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(absolutePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        res.writeHead(404);
        res.end('404: File Not Found (Check if client/ folder exists)');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// 2. Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

let gameState = Array(9).fill(null);
let xIsNext = true;

console.log(`Server started on http://${host}:${port}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    content: 'Connected to Nebula Server',
    gameState: gameState,
    xIsNext: xIsNext
  }));

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'message') {
        // Chat Logic
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              user: parsedMessage.user || 'Anonymous',
              content: parsedMessage.content,
              timestamp: new Date().toISOString()
            }));
          }
        });
      } else if (parsedMessage.type === 'move') {
        // Game Logic
        const index = parsedMessage.index;
        if (!gameState[index] && parsedMessage.player === (xIsNext ? 'X' : 'O')) {
          gameState[index] = parsedMessage.player;
          xIsNext = !xIsNext;

          broadcast({
            type: 'update_game',
            gameState: gameState,
            xIsNext: xIsNext
          });
        }
      } else if (parsedMessage.type === 'restart') {
        gameState = Array(9).fill(null);
        xIsNext = true;
        broadcast({
          type: 'update_game',
          gameState: gameState,
          xIsNext: xIsNext
        });
      }

    } catch (e) {
      console.error('Error:', e);
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// 3. Start listening
server.listen(port, host, () => {
  console.log(`Listening on ${host}:${port}`);
});
