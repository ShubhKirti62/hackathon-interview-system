const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Room users endpoint
app.get('/api/room/:roomId/users', (req, res) => {
    const { roomId } = req.params;
    console.log('Getting users for room:', roomId);
    res.json([{ id: 'test1', userName: 'Test User', role: 'tester' }]);
});

// Signaling endpoint
app.post('/api/signaling/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { type, data } = req.body;
    console.log('Signaling request:', { roomId, type, data });
    res.json({ success: true, message: 'Signaling received' });
});

app.listen(PORT, () => {
    console.log(`Minimal server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
