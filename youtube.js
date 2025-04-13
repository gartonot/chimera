const { google } = require('googleapis');

// --- Парсинг videoId из ссылки
function getVideoIdFromLink(link) {
    try {
        const parsed = new URL(link);
        if (parsed.hostname === 'youtu.be') {
            return parsed.pathname.slice(1);
        }
        if (parsed.hostname.includes('youtube.com')) {
            return parsed.searchParams.get('v');
        }
    } catch (error) {
        console.warn('[YouTube] Невалидная ссылка:', link);
    }

    return null;
}

// --- Получение liveChatId по videoId
async function getLiveChatId(videoId, apiKey) {
    try {
        const youtube = google.youtube({ version: 'v3', auth: apiKey });
        const res = await youtube.videos.list({
            part: 'liveStreamingDetails',
            id: videoId,
        });
        const item = res.data.items?.[0];

        return item?.liveStreamingDetails?.activeLiveChatId || null;
    } catch (err) {
        console.error('[YouTube] Ошибка при получении liveChatId:', err.message);
        return null;
    }
}

// --- Запуск YouTube чата
async function startYouTubeChat(io, streamUrl) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const pollInterval = parseInt(process.env.YOUTUBE_POLL_INTERVAL || '12000', 10);

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
    let nextPageToken = null;

    // Мини-кэш сообщений для защиты от дублей
    const seenMessages = new Map(); // id → timestamp

    // Очистка кэша каждые 5 минут (можно менять)
    setInterval(() => {
        const cutoff = Date.now() - 5 * 60 * 1000;
        for (const [id, ts] of seenMessages) {
            if (ts < cutoff) seenMessages.delete(id);
        }
    }, 60 * 1000);

    // --- Основной polling-функция
    async function pollChat() {
        try {
            const res = await youtube.liveChatMessages.list({
                liveChatId,
                part: 'snippet,authorDetails',
                maxResults: 50,
                pageToken: nextPageToken || undefined,
            });

            const messages = res.data.items || [];
            nextPageToken = res.data.nextPageToken;

            messages.forEach((item) => {
                if (seenMessages.has(item.id)) return;
                seenMessages.set(item.id, Date.now());

                const payload = {
                    source: 'youtube',
                    user: item.authorDetails.displayName,
                    message: item.snippet.displayMessage,
                    timestamp: item.snippet.publishedAt,
                    avatar: item.authorDetails.profileImageUrl,
                };

                io.emit('chatMessage', payload);
            });
        } catch (err) {
            console.error('[YouTube] Ошибка при получении сообщений:', err.response?.data?.error?.message || err.message);
        }
    }

    // Запускаем первый polling и дальше по таймеру
    pollChat();
    setInterval(pollChat, pollInterval);
}

module.exports = { startYouTubeChat };
