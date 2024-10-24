const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

let hardships = [];

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// Helper function to sort hardships by comment count (least to most)
const sortHardshipsByComments = () => {
    return hardships.sort((a, b) => a.comments.length - b.comments.length);
};

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('initialHardships', sortHardshipsByComments());

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// POST - Submit a new hardship
app.post('/api/hardships', (req, res) => {
    const { text, category, userId } = req.body;

    if (!text || !category || !userId) {
        return res.status(400).json({ error: 'Text, category, and userId are required.' });
    }

    const newHardship = {
        id: Date.now(),
        userId,
        text,
        category,
        comments: [],
        likes: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        lastEdited: null
    };

    hardships.push(newHardship);
    io.emit('hardshipsUpdated', sortHardshipsByComments());
    return res.status(201).json(newHardship);
});

// GET - Fetch all hardships
app.get('/api/hardships', (req, res) => {
    return res.json(sortHardshipsByComments());
});

// POST - Add a comment to a hardship
app.post('/api/hardships/:id/comments', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    const hardship = hardships.find(h => h.id === parseInt(id));
    if (!hardship) {
        return res.status(404).json({ error: 'Hardship not found' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required.' });
    }

    const newComment = {
        id: Date.now(),
        text,
        createdAt: new Date().toISOString()
    };

    hardship.comments.push(newComment);
    io.emit('hardshipsUpdated', sortHardshipsByComments());
    return res.status(201).json(newComment);
});

// POST - Like or unlike a hardship
app.post('/api/hardships/:id/like', (req, res) => {
    const { id } = req.params;
    const hardship = hardships.find(h => h.id === parseInt(id));

    if (!hardship) {
        return res.status(404).json({ error: 'Hardship not found' });
    }

    hardship.isLiked = !hardship.isLiked;
    hardship.likes += hardship.isLiked ? 1 : -1;

    io.emit('hardshipsUpdated', sortHardshipsByComments());
    return res.status(200).json({ likes: hardship.likes, isLiked: hardship.isLiked });
});

// PUT - Edit an existing hardship
app.put('/api/hardships/:id', (req, res) => {
    const { id } = req.params;
    const { text, category } = req.body;

    const hardship = hardships.find(h => h.id === parseInt(id));
    if (!hardship) {
        return res.status(404).json({ error: 'Hardship not found' });
    }

    if (text) hardship.text = text;
    if (category) hardship.category = category;

    hardship.lastEdited = new Date().toISOString();
    io.emit('hardshipsUpdated', sortHardshipsByComments());
    return res.status(200).json(hardship);
});

// DELETE - Remove a hardship
app.delete('/api/hardships/:id', (req, res) => {
    const { id } = req.params;
    const hardshipIndex = hardships.findIndex(h => h.id === parseInt(id));

    if (hardshipIndex === -1) {
        return res.status(404).json({ error: 'Hardship not found' });
    }

    hardships.splice(hardshipIndex, 1);
    io.emit('hardshipsUpdated', sortHardshipsByComments());
    return res.status(204).send();
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});