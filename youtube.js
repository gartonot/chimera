// youtube.js
const { google } = require('googleapis');
const url = require('url');

async function getVideoIdFromLink(link) {
    try {
        const parsed = new URL(link);
        if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
            if (parsed.hostname === 'youtu.be') {
                return parsed.pathname.slice(1);
            }
            return parsed.searchParams.get('v');
        }
    } catch (e) {
        console.warn('[YouTube] Невалидная ссылка:', link);
    }
    return null;
}

async function getLiveChatId(videoId, apiKey) {
    const youtube = google.youtube({ version: 'v3', auth: apiKey });
    const res = await youtube.videos.list({
        part: 'liveStreamingDetails',
        id: videoId,
    });

    const item = res.data.items?.[0];
    return item?.liveStreamingDetails?.activeLiveChatId || null;
}

async function startYouTubeChat(io, streamUrl) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const pollInterval = parseInt(process.env.YOUTUBE_POLL_INTERVAL || '12000', 10);

    const videoId = await getVideoIdFromLink(streamUrl);
    if (!videoId) {
        console.error('[YouTube] Не удалось получить videoId из ссылки.');
        return;
    }

    const liveChatId = await getLiveChatId(videoId, apiKey);
    if (!liveChatId) {
        console.error('[YouTube] Стрим не найден или чат отключён.');
        return;
    }

    console.log(`[YouTube] Получен liveChatId: ${liveChatId}`);

    const youtube = google.youtube({ version: 'v3', auth: apiKey });
    let nextPageToken = null;

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
            console.error('[YouTube] Ошибка при получении чата:', err.message);
        }
    }

    pollChat();
    setInterval(pollChat, pollInterval);
}

module.exports = { startYouTubeChat };
