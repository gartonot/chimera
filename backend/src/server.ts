require('dotenv').config();
const express = require('express');
const http = require('http');
import { Server as SocketIOServer } from 'socket.io';
import { IServerToClientEvents } from './shared/interfaces'

// Подключаем сервисы ютуба и твича
const { startTwitchChat } = require('./twitch');
const { startYouTubeChat } = require('./youtube');

// Настройка сервера и вебсокетов
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer<IServerToClientEvents>(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

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
