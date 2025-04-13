const tmi = require('tmi.js');

function startTwitchChat(io) {
    const twitchChannel = process.env.TWITCH_CHANNEL;
    const twitchUser = process.env.TWITCH_USERNAME;
    const twitchToken = process.env.TWITCH_OAUTH;

    const client = new tmi.Client({
        options: { debug: false },
        identity: {
            username: twitchUser,
            password: twitchToken,
        },
        channels: [twitchChannel],
    });

    client.connect().then(() => {
        console.log(`🎮 Подключено к Twitch каналу: ${twitchChannel}`);
    });

    client.on('message', (channel, tags, message, self) => {
        if (self) return;
        const payload = {
            source: 'twitch',
            user: tags['display-name'] || tags.username,
            message,
            timestamp: new Date().toISOString(),
            avatar: null, // добавить позже
        };
        io.emit('chatMessage', payload);
    });
}

module.exports = { startTwitchChat };
