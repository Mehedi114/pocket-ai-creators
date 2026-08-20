export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { url } = req.body || {};

        if (!url || !url.trim()) {
            return res.status(400).json({
                error: "Please provide a YouTube channel URL."
            });
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({
                error: "YOUTUBE_API_KEY is not configured in Vercel."
            });
        }

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                error: "GROQ_API_KEY is not configured in Vercel."
            });
        }

        const inputUrl = url.trim();

        let channelId = null;
        let handle = null;

        // --------------------------------
        // Extract YouTube channel info
        // --------------------------------

        try {
            const parsed = new URL(inputUrl);

            const pathname = parsed.pathname;

            // /channel/UCxxxxxxxx
            const channelMatch = pathname.match(
                /\/channel\/([a-zA-Z0-9_-]+)/
            );

            if (channelMatch) {
                channelId = channelMatch[1];
            }

            // /@handle
            const handleMatch = pathname.match(
                /\/@([^\/]+)/
            );

            if (handleMatch) {
                handle = handleMatch[1];
            }

        } catch {
            return res.status(400).json({
                error: "Please provide a valid YouTube URL."
            });
        }

        // --------------------------------
        // Find channel
        // --------------------------------

        let channelData = null;

        if (channelId) {

            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
            );

            const channelText = await channelResponse.text();

            let channelJson;

            try {
                channelJson = JSON.parse(channelText);
            } catch {
                throw new Error(
                    "YouTube API returned an invalid response."
                );
            }

            if (!channelResponse.ok) {
                throw new Error(
                    channelJson?.error?.message ||
                    "Unable to access YouTube channel."
                );
            }

            channelData = channelJson.items?.[0];
        }

        else if (handle) {

            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
            );

            const channelText = await channelResponse.text();

            let channelJson;

            try {
                channelJson = JSON.parse(channelText);
            } catch {
                throw new Error(
                    "YouTube API returned an invalid response."
                );
            }

            if (!channelResponse.ok) {
                throw new Error(
                    channelJson?.error?.message ||
                    "Unable to find this YouTube channel."
                );
            }

            channelData = channelJson.items?.[0];
        }

        // --------------------------------
        // Fallback: search YouTube
        // --------------------------------

        if (!channelData) {

            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(inputUrl)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
            );

            const searchText = await searchResponse.text();

            let searchJson;

            try {
                searchJson = JSON.parse(searchText);
            } catch {
                throw new Error(
                    "YouTube search returned an invalid response."
                );
            }

            if (!searchResponse.ok) {
                throw new Error(
                    searchJson?.error?.message ||
                    "YouTube search failed."
                );
            }

            const result = searchJson.items?.[0];

            if (!result?.snippet?.channelId) {
                return res.status(404).json({
                    error: "YouTube channel could not be found."
                });
            }

            const foundChannelId = result.snippet.channelId;

            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(foundChannelId)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
            );

            const channelText = await channelResponse.text();

            let channelJson;

            try {
                channelJson = JSON.parse(channelText);
            } catch {
                throw new Error(
                    "YouTube API returned an invalid response."
                );
            }

            if (!channelResponse.ok) {
                throw new Error(
                    channelJson?.error?.message ||
                    "Unable to load channel information."
                );
            }

            channelData = channelJson.items?.[0];
        }

        if (!channelData) {
            return res.status(404).json({
                error: "YouTube channel not found."
            });
        }

        // --------------------------------
        // Channel information
        // --------------------------------

        const snippet = channelData.snippet || {};
        const statistics = channelData.statistics || {};
        const contentDetails = channelData.contentDetails || {};

        const uploadsPlaylistId =
            contentDetails.relatedPlaylists?.uploads;

        let videos = [];

        // --------------------------------
        // Get recent videos
        // --------------------------------

        if (uploadsPlaylistId) {

            const playlistResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=15&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
            );

            const playlistText = await playlistResponse.text();

            let playlistJson;

            try {
                playlistJson = JSON.parse(playlistText);
            } catch {
                throw new Error(
                    "YouTube video data returned an invalid response."
                );
            }

            if (playlistResponse.ok) {

                const videoIds = (playlistJson.items || [])
                    .map(item => item.contentDetails?.videoId)
                    .filter(Boolean);

                if (videoIds.length) {

                    const videoResponse = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`
                    );

                    const videoText = await videoResponse.text();

                    let videoJson;

                    try {
                        videoJson = JSON.parse(videoText);
                    } catch {
                        throw new Error(
                            "YouTube video statistics returned an invalid response."
                        );
                    }

                    if (videoResponse.ok) {
                        videos = videoJson.items || [];
                    }
                }
            }
        }

        // --------------------------------
        // Prepare research data
        // --------------------------------

        const channelInfo = {
            title: snippet.title || "",
            description: snippet.description || "",
            publishedAt: snippet.publishedAt || "",
            country: snippet.country || "",
            subscribers: statistics.subscriberCount || "0",
            totalViews: statistics.viewCount || "0",
            totalVideos: statistics.videoCount || "0"
        };

        const videoInfo = videos.map(video => ({
            title: video.snippet?.title || "",
            publishedAt: video.snippet?.publishedAt || "",
            views: video.statistics?.viewCount || "0",
            likes: video.statistics?.likeCount || "0",
            comments: video.statistics?.commentCount || "0",
            duration: video.contentDetails?.duration || "",
            description: video.snippet?.description || ""
        }));

        // --------------------------------
        // Ask Groq AI to analyze
        // --------------------------------

        const prompt = `
You are Pocket AI, an expert YouTube creator strategist.

Analyze this YouTube channel using the data below.

CHANNEL:
${JSON.stringify(channelInfo, null, 2)}

RECENT VIDEOS:
${JSON.stringify(videoInfo, null, 2)}

Give a practical creator research report.

Include:

1. Channel overview
2. Main content niche
3. Target audience
4. Content style
5. What appears to perform best
6. Recent video performance patterns
7. Title strategy
8. Topic opportunities
9. Content gaps
10. 10 video ideas inspired by the channel
11. Recommendations for growing the channel

Important:
- Base the analysis on the supplied data.
- Do not invent statistics.
- Clearly say when something cannot be determined from the available data.
- If the channel content is Bangla, write the report in natural Bangla.
- Be practical and specific.
`;

        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${GROQ_API_KEY}`
                },

                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are Pocket AI for Creators. Give accurate, practical YouTube strategy analysis."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0.7,
                    max_completion_tokens: 4096
                })
            }
        );

        const groqText = await groqResponse.text();

        let groqData;

        try {
            groqData = JSON.parse(groqText);
        } catch {
            throw new Error(
                "AI service returned an invalid response."
            );
        }

        if (!groqResponse.ok) {
            throw new Error(
                groqData?.error?.message ||
                "AI analysis failed."
            );
        }

        const result =
            groqData?.choices?.[0]?.message?.content;

        if (!result) {
            throw new Error(
                "AI returned an empty research report."
            );
        }

        // --------------------------------
        // Final response
        // --------------------------------

        return res.status(200).json({
            success: true,

            channel: channelInfo,

            videos: videoInfo,

            result: result
        });

    } catch (error) {

        console.error("Research API Error:", error);

        return res.status(500).json({
            error:
                error?.message ||
                "Research failed."
        });
    }
}
