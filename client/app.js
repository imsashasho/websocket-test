const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username-input');
const statusIndicator = document.getElementById('connection-status');
const userBadge = document.getElementById('user-badge');

// Game Elements
const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turn-indicator');
const restartBtn = document.getElementById('restart-btn');

// Tabs
const tabs = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view-section');

let ws;

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const isProduction = location.protocol === 'https:';
let WS_URL = isProduction
    ? 'wss://' + location.host
    : 'ws://localhost:8080';

// const WS_URL = 'wss://your-domain.com'; 

console.log('Connecting to WebSocket at:', WS_URL);

// ---------------------------------------------------------
// APP LOGIC
// ---------------------------------------------------------

function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        statusIndicator.classList.add('connected');
        addSystemMessage('Connected to server');
        console.log('Connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    ws.onclose = () => {
        statusIndicator.classList.remove('connected');
        addSystemMessage('Disconnected. Retrying in 3s...');
        console.log('Disconnected');
        setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

function handleMessage(data) {
    if (data.type === 'system') {
        addSystemMessage(data.content);
    } else if (data.type === 'init') {
        addSystemMessage(data.content);
        updateGameState(data.gameState, data.xIsNext);
    } else if (data.type === 'message') {
        const isSelf = data.user === usernameInput.value;
        addMessage(data.user, data.content, isSelf);
    } else if (data.type === 'update_game') {
        updateGameState(data.gameState, data.xIsNext);
    }
}

// ---------------------------------------------------------
// CHAT LOGIC
// ---------------------------------------------------------

function addMessage(user, content, isSelf) {
    const div = document.createElement('div');
    div.className = `message ${isSelf ? 'self' : 'other'}`;

    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = user;

    const text = document.createElement('span');
    text.textContent = content;

    div.appendChild(meta);
    div.appendChild(text);

    chatWindow.appendChild(div);
    scrollToBottom();
}

function addSystemMessage(content) {
    const div = document.createElement('div');
    div.className = 'message system-message';
    div.innerHTML = `<span>${content}</span>`;
    chatWindow.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    const user = usernameInput.value.trim() || 'Anonymous';

    userBadge.textContent = user;

    if (content && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            user: user,
            content: content
        }));
        messageInput.value = '';
    }
});

usernameInput.addEventListener('change', () => {
    userBadge.textContent = usernameInput.value || 'Guest';
});

// ---------------------------------------------------------
// GAME LOGIC
// ---------------------------------------------------------

function updateGameState(boardState, xIsNext) {
    cells.forEach((cell, index) => {
        cell.textContent = boardState[index];
        cell.className = 'cell'; // reset classes
        if (boardState[index] === 'X') cell.classList.add('x');
        if (boardState[index] === 'O') cell.classList.add('o');
    });

    turnIndicator.textContent = xIsNext ? "Player X's Turn" : "Player O's Turn";

    const userRole = checkUserRole();
    // Optional: Highlight if it's your turn? 
    // For this simple demo, any user can play as any side.
}

function checkUserRole() {
    // In a real app, you'd assign X or O to specific users.
    // Here, it's a free-for-all shared board.
    return 'spectator';
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        // Simple client-side check to avoid spam, mostly handled by server
        if (!cell.textContent && ws && ws.readyState === WebSocket.OPEN) {
            // We determine player based on current turn (shared state)
            // In a real game, you would match this against your assigned role.
            const currentPlayer = turnIndicator.textContent.includes('X') ? 'X' : 'O';

            ws.send(JSON.stringify({
                type: 'move',
                index: index,
                player: currentPlayer
            }));
        }
    });
});

restartBtn.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'restart' }));
    }
});

// ---------------------------------------------------------
// TABS LOGIC
// ---------------------------------------------------------

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        // Add active to clicked
        tab.classList.add('active');

        // Show content
        const targetId = tab.getAttribute('data-tab') + '-view';
        document.getElementById(targetId).classList.add('active');
    });
});

// Start connection
connect();
