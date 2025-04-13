require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Подключаем сервисы ютуба и твича
const { startTwitchChat } = require('./twitch');
const { startYouTubeChat } = require('./youtube');

// Настройка сервера и вебсокетов
const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Отдача статики фронта
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket
io.on('connection', (socket) => {
    console.log('🟢 Клиент подключен');

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключен');
    });
});

// ▶️ Twitch-чат запускается
startTwitchChat(io);

// ▶️ Youtube-чат запускается
const YOUTUBE_STREAM_URL = 'https://www.youtube.com/watch?v=Q-ttbX02RWo';
startYouTubeChat(io, YOUTUBE_STREAM_URL);


// Запускаем сервер
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Chimera запущен на http://localhost:${PORT}`);
});
