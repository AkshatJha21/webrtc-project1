const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        // Broadcast incoming message to all other clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });   
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket signalling server running on ws://localhost:3000');
