const socket = io();

socket.on('chatMessage', (msg) => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<strong>[${msg.source}]</strong> ${msg.user}: ${msg.message}`;
    document.getElementById('chat').appendChild(div);
});
