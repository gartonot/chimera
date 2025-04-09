const socket = io();

socket.on('chatMessage', (msg) => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<strong>[${msg.source}] ${msg.user}:</strong> ${msg.message}`;
    document.getElementById('chat').appendChild(div);
});
