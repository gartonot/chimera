const socket = io();

const chatEl = document.getElementById('chat');
const messageQueue = [];
const INTERVAL_DELAY = 100;
const storageKey = 'chat-history';

// Загрузка из localStorage
const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
history.forEach(showMessage);

// Слушаем новые сообщения
socket.on('chatMessage', (msg) => {
    messageQueue.push(msg);
});

// Каждые 300 мс рендерим по одному
setInterval(() => {
    if (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        showMessage(msg);
        saveMessage(msg);
    }
}, INTERVAL_DELAY);

// Показать сообщение на экране
function showMessage({ user, message, source }) {
    const el = document.createElement('div');
    el.className = 'chat-line';
    el.innerHTML = `<b>[${source}] ${user}:</b> ${message}`;
    chatEl.appendChild(el);
    chatEl.scrollTop = chatEl.scrollHeight;
}

// Сохраняем сообщение в localStorage
function saveMessage(msg) {
    const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    messages.push(msg);

    // Храним не больше 200 сообщений
    const limited = messages.slice(-200);
    localStorage.setItem(storageKey, JSON.stringify(limited));
}
