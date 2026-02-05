# Nebula Chat - WebSocket Demo

A premium, real-time chat application built with **Vanilla JavaScript** and **Node.js WebSockets**.

## ✨ Updated for Hosting
This version handles environment variables and automatic connection string detection.

## 📂 Project Structure
```
websocket_test/
├── client/          
│   ├── index.html
│   ├── style.css
│   └── app.js       # Auto-detects WS vs WSS
├── server/          
│   ├── .env         # Environment config (Port)
│   ├── package.json
│   └── server.js    # Uses process.env.PORT
└── README.md
```

## 🚀 Local Setup
1. `cd server`
2. `npm install`
3. `npm start`
4. Open `client/index.html` in browser.

## 🇺🇦 Hosting on Hosting Ukraine (ukraine.com.ua)

### 1. Server Configuration
- Upload the `server` folder.
- Ensure `server.js` is set as the entry point in your Node.js settings.
- The code now uses `process.env.PORT`, which is required for the hosting panel to correctly route traffic.
- You can create/edit the `.env` file on the server if you need to specify other variables, though `PORT` is usually injected by the host automatically.

### 2. Client Configuration
- Open `client/app.js`.
- The code tries to auto-detect the domain:
  ```javascript
  const WS_URL = isProduction 
      ? 'wss://' + location.host
      : 'ws://localhost:8080';
  ```
- **If your setup is complex** (e.g. client and server are on different subdomains), uncomment and edit the line:
  ```javascript
  // const WS_URL = 'wss://your-domain.com'; 
  ```
  replace `your-domain.com` with your actual server address.

# websocket-test
