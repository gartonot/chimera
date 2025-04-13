const socket = io();

const chatEl = document.getElementById('chat');
const messageQueue = [];
const INTERVAL_DELAY = 100;

// Приходящие сообщения от сервера
socket.on('chatMessage', (msg) => {
    messageQueue.push(msg);
});

// Каждые 300мс вытаскиваем одно сообщение из очереди
setInterval(() => {
    if (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        showMessage(msg);
    }
}, INTERVAL_DELAY);

function showMessage({ user, message, source }) {
    const el = document.createElement('div');
    el.className = 'chat-line';
    el.innerHTML = `<b>[${source}] ${user}:</b> ${message}`;
    chatEl.appendChild(el);
}
