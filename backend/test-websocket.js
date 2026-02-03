const WebSocket = require('ws');

console.log('Starting WebSocket test server...');

const wss = new WebSocket.Server({ port: 5002 });

wss.on('connection', function connection(ws) {
    console.log('Client connected to WebSocket test server!');
    
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        ws.send('Echo: ' + message);
    });
    
    ws.on('close', function close() {
        console.log('Client disconnected');
    });
});

console.log('WebSocket test server running on port 5002');
