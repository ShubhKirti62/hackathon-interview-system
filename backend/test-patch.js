const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test PATCH endpoint
app.patch('/api/slots/:id', (req, res) => {
    console.log('PATCH request received:', req.params.id, req.body);
    res.json({ message: 'PATCH endpoint working', data: req.body });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
