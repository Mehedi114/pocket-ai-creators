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

        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "YOUTUBE_API_KEY is not configured."
            });
        }

        // Extract YouTube handle or channel ID
        let handle = null;
        let channelId = null;

        const handleMatch = url.match(/youtube\.com\/@([^/?]+)/i);
        const channelMatch = url.match(/youtube\.com\/channel\/([^/?]+)/i);

        if (handleMatch) {
            handle = handleMatch[1];
        } else if (channelMatch) {
            channelId = channelMatch[1];
        } else {
            return res.status(400).json({
                error: "Please use a YouTube channel URL such as https://youtube.com/@channel"
            });
        }

        // Get channel information
        let channelUrl =
            "https://www.googleapis.com/youtube/v3/channels" +
            "?part=snippet,statistics,contentDetails" +
            (handle
                ? "&forHandle=" + encodeURIComponent(handle)
                : "&id=" + encodeURIComponent(channelId)) +
            "&key=" + encodeURIComponent(apiKey);

        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();

        if (!channelResponse.ok) {
            return res.status(channelResponse.status).json({
                error:
                    channelData?.error?.message ||
                    "YouTube API request failed."
            });
        }

        if (!channelData.items || !channelData.items.length) {
            return res.status(404).json({
                error: "YouTube channel not found."
            });
        }

        const channel = channelData.items[0];

        const uploadsPlaylist =
            channel.contentDetails.relatedPlaylists.uploads;

        // Get latest videos
        const playlistUrl =
            "https://www.googleapis.com/youtube/v3/playlistItems" +
            "?part=snippet,contentDetails" +
            "&playlistId=" + encodeURIComponent(uploadsPlaylist) +
            "&maxResults=15" +
            "&key=" + encodeURIComponent(apiKey);

        const playlistResponse = await fetch(playlistUrl);
        const playlistData = await playlistResponse.json();

        if (!playlistResponse.ok) {
            return res.status(playlistResponse.status).json({
                error:
                    playlistData?.error?.message ||
                    "Could not load channel videos."
            });
        }

        const videoIds = (playlistData.items || [])
            .map(item => item.contentDetails.videoId)
            .filter(Boolean);

        let videos = [];

        if (videoIds.length) {
            const videosUrl =
                "https://www.googleapis.com/youtube/v3/videos" +
                "?part=snippet,statistics,contentDetails" +
                "&id=" + encodeURIComponent(videoIds.join(",")) +
                "&key=" + encodeURIComponent(apiKey);

            const videosResponse = await fetch(videosUrl);
            const videosData = await videosResponse.json();

            if (videosResponse.ok) {
                videos = videosData.items || [];
            }
        }

        // Prepare compact research data for AI
        const researchData = {
            channel: {
                title: channel.snippet.title,
                description: channel.snippet.description,
                country: channel.snippet.country || null,
                publishedAt: channel.snippet.publishedAt,
                subscribers:
                    channel.statistics.hiddenSubscriberCount
                        ? null
                        : channel.statistics.subscriberCount,
                totalViews: channel.statistics.viewCount,
                totalVideos: channel.statistics.videoCount
            },

            recentVideos: videos.map(video => ({
                title: video.snippet.title,
                publishedAt: video.snippet.publishedAt,
                views: video.statistics.viewCount || "0",
                likes: video.statistics.likeCount || "0",
                comments: video.statistics.commentCount || "0",
                duration: video.contentDetails.duration
            }))
        };

        // Send data to Groq for analysis
        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are Pocket AI, an expert YouTube channel strategist. Analyze the provided real YouTube channel data carefully. Do not invent statistics."
                        },
                        {
                            role: "user",
                            content: `
Analyze this YouTube channel and create a practical creator research report.

CHANNEL DATA:
${JSON.stringify(researchData, null, 2)}

Give the report in this structure:

1. CHANNEL OVERVIEW
2. CONTENT NICHE
3. CONTENT PATTERNS
4. TOP PERFORMING RECENT VIDEOS
5. TITLE PATTERNS
6. AUDIENCE OPPORTUNITIES
7. CONTENT GAPS
8. 5 NEW VIDEO IDEAS
9. STRATEGIC RECOMMENDATIONS

Use actual numbers from the data when available.
Be specific and practical.
If something cannot be determined from the data, clearly say so.
`
                        }
                    ],

                    temperature: 0.5,
                    max_completion_tokens: 3000
                })
            }
        );

        const groqData = await groqResponse.json();

        if (!groqResponse.ok) {
            return res.status(groqResponse.status).json({
                error:
                    groqData?.error?.message ||
                    "AI analysis failed."
            });
        }

        const result =
            groqData?.choices?.[0]?.message?.content;

        if (!result) {
            return res.status(500).json({
                error: "AI returned an empty research report."
            });
        }

        return res.status(200).json({
            success: true,
            channel: researchData.channel,
            recentVideos: researchData.recentVideos,
            result
        });

    } catch (error) {
        console.error("Research Error:", error);

        return res.status(500).json({
            error: "Something went wrong during YouTube research."
        });
    }
}
