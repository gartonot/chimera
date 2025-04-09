// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { startTwitchChat } = require('./twitch');
const { startYouTubeChat } = require('./youtube');


const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Отдача фронта
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket
io.on('connection', (socket) => {
    console.log('🟢 Клиент подключен');

    socket.emit('chatMessage', {
        source: 'chimera',
        user: 'System',
        message: 'Добро пожаловать в Chimera!',
        timestamp: new Date().toISOString(),
    });

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключен');
    });
});

// ▶️ Twitch-чат запускается после старта
startTwitchChat(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Chimera запущен на http://localhost:${PORT}`);
});


// ▶️ Youtube-чат
const YOUTUBE_STREAM_URL = 'https://www.youtube.com/watch?v=Xy6nHsUJrsc';

startYouTubeChat(io, YOUTUBE_STREAM_URL);
