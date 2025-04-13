const tmi = require('tmi.js');
import { Server as SocketIOServer } from 'socket.io';
import { IChatPayload, IServerToClientEvents } from './shared/interfaces'
import { TTwitchMessageHandler } from './shared/types'

function startTwitchChat(io: SocketIOServer<IServerToClientEvents>) {
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

    const onMessage: TTwitchMessageHandler = (channel, tags, message, self) => {
        if (self) return;

        const payload: IChatPayload = {
            source: 'twitch',
            user: tags['display-name'] || tags.username || '',
            message,
            timestamp: new Date().toISOString(),
            avatar: null, // добавить позже
        };
        io.emit('chatMessage', payload);
    }

    client.on('message', onMessage);
}

module.exports = { startTwitchChat };
