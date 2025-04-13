import { google, youtube_v3 } from 'googleapis';
import { Server as SocketIOServer } from 'socket.io';
import { IChatPayload, IServerToClientEvents } from './shared/interfaces';

// --- Парсинг videoId из ссылки
function getVideoIdFromLink(link: string) {
    try {
        const parsed = new URL(link);
        if (parsed.hostname === 'youtu.be') {
            return parsed.pathname.slice(1);
        }
        if (parsed.hostname.includes('youtube.com')) {
            return parsed.searchParams.get('v');
        }
    } catch (_) {
        console.warn('[YouTube] Невалидная ссылка:', link);
    }

    return null;
}

// --- Получение liveChatId по videoId
async function getLiveChatId(videoId: string, apiKey: string) {
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    try {
        const res = await youtube.videos.list({
            part: ['liveStreamingDetails'],
            id: [videoId],
        });
        const item = res.data.items?.[0];

        return item?.liveStreamingDetails?.activeLiveChatId || null;
    } catch (error) {
        const err = error as Error;
        console.error('[YouTube] Ошибка при получении liveChatId:', err.message);
        return null;
    }
}

// --- Запуск YouTube чата
async function startYouTubeChat(
    io: SocketIOServer<IServerToClientEvents>,
    streamUrl: string
) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const pollInterval = parseInt(process.env.YOUTUBE_POLL_INTERVAL || '3000', 10);

    if (!apiKey) {
        throw new Error('❌ Не найден YOUTUBE_API_KEY');
    }

    const videoId = getVideoIdFromLink(streamUrl);
    if (!videoId) {
        console.error('[YouTube] Не удалось извлечь videoId из ссылки.');
        return;
    }

    const liveChatId = await getLiveChatId(videoId, apiKey);
    if (!liveChatId) {
        console.error('[YouTube] Стрим не найден или чат отключён.');
        return;
    }

    console.log(`[YouTube] ✅ Чат подключён к videoId: ${videoId}, liveChatId: ${liveChatId}`);

    const youtube = google.youtube({ version: 'v3', auth: apiKey });
    let nextPageToken: string | null = null;

    // Мини-кэш сообщений для защиты от дублей
    const seenMessages: Map<string, number> = new Map(); // id → timestamp

    // Очистка кэша каждые 5 минут (можно менять)
    setInterval(() => {
        const cutoff = Date.now() - 5 * 60 * 1000;
        for (const [id, ts] of seenMessages) {
            if (ts < cutoff) seenMessages.delete(id);
        }
    }, 60 * 1000);

    // --- Основной polling-функция
    async function pollChat() {
        if (!liveChatId) {
            console.warn('[YouTube] liveChatId отсутствует, пропускаем poll');
            return;
        }

        try {
            const res = await youtube.liveChatMessages.list({
                liveChatId,
                part: ['snippet', 'authorDetails'],
                maxResults: 25,
                pageToken: nextPageToken || undefined,
            });

            const messages: youtube_v3.Schema$LiveChatMessage[] = res.data.items || [];

            messages.forEach((item) => {
                if (!item.id || seenMessages.has(item.id)) return;
                seenMessages.set(item.id, Date.now());

                const payload: IChatPayload = {
                    source: 'youtube',
                    user: item.authorDetails?.displayName || 'Unknown',
                    message: item.snippet?.displayMessage || '',
                    timestamp: item.snippet?.publishedAt || new Date().toISOString(),
                    avatar: item.authorDetails?.profileImageUrl || null,
                };

                io.emit('chatMessage', payload);
            });

            nextPageToken = res.data.nextPageToken ?? null;
        } catch (error) {
            const err = error as Error & { response?: { data?: { error?: { message?: string } } } };
            console.error('[YouTube] Ошибка при получении сообщений:', err.response?.data?.error?.message || err.message);
        }
    }

    // Запускаем первый polling и дальше по таймеру
    pollChat();
    setInterval(pollChat, pollInterval);
}

module.exports = { startYouTubeChat };
