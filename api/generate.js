export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { tool, input } = req.body || {};

        if (!input || !input.trim()) {
            return res.status(400).json({
                error: "Please provide your topic."
            });
        }

        let prompt;

        switch (tool) {

            case "YouTube Title Generator":

                prompt = `
You are Pocket AI, an expert YouTube strategist and viral content consultant.

Create 10 strong YouTube titles for this topic:

${input}

Rules:
- Write naturally like a professional human creator.
- Focus on curiosity, emotion and click-worthiness.
- Do NOT use fake claims or misleading clickbait.
- Keep titles reasonably short.
- Avoid repetitive titles.
- Make each title meaningfully different.
- If the topic is Bangla, write the titles in natural Bangla.
- Return ONLY the numbered titles.
`;

                break;


            case "SEO Description Generator":

                prompt = `
You are an expert YouTube SEO strategist.

Create a high-quality YouTube SEO description for:

${input}

Include:
- Strong opening hook
- Natural keywords
- Useful context
- Viewer engagement
- Clear CTA

Do not keyword-stuff.
Write naturally.
`;

                break;


            case "YouTube Tags":

                prompt = `
You are a YouTube SEO expert.

Generate highly relevant YouTube search tags for:

${input}

Give:
- Primary keywords
- Long-tail keywords
- Related searches
- Topic variations

Return the tags separated by commas.
Do not add explanations.
`;

                break;


            case "Facebook Caption":

                prompt = `
You are an expert Facebook content strategist.

Write an engaging Facebook caption for:

${input}

Make it:
- Natural
- Human
- Scroll-stopping
- Easy to read
- Suitable for Facebook
- Include a strong CTA when appropriate

Do not sound like generic AI writing.
`;

                break;


            case "Product Description":

                prompt = `
You are an expert e-commerce copywriter.

Create a persuasive product description for:

${input}

Include:
- Strong product introduction
- Key benefits
- Important features
- Why the customer should care
- Natural sales language
- CTA

Do not invent specifications that were not provided.
`;

                break;


            case "Ad Copy":

                prompt = `
You are an expert performance marketing copywriter.

Create advertising copy for:

${input}

Give:
1. Hook
2. Main ad copy
3. Benefits
4. CTA

Make it persuasive but believable.
Avoid fake promises.
`;

                break;


            case "Blog Writer":

                prompt = `
You are a professional SEO blog writer.

Write a useful, well-structured blog article about:

${input}

Use:
- Strong title
- Introduction
- Clear headings
- Helpful information
- Natural keyword usage
- Conclusion

Write for real human readers, not search engines.
`;

                break;


            case "Script Generator":

                prompt = `
You are an experienced YouTube scriptwriter.

Create a compelling video script about:

${input}

Structure:
1. Powerful opening hook
2. Introduction
3. Main story/information
4. Curiosity loops
5. Strong conclusion
6. Call to action

Keep the narration natural and engaging.
`;

                break;


            default:

                prompt = `
You are Pocket AI, an AI assistant built specifically for creators.

Creator request:

${input}

Give a practical, useful and high-quality answer.
`;
        }


        const response = await fetch(
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
                                "You are Pocket AI for Creators. Give high-quality, practical creator-focused responses."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0.8,

                    max_completion_tokens: 2048

                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            console.error("Groq API Error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Groq API request failed."
            });
        }


        const result =
            data?.choices?.[0]?.message?.content;


        if (!result) {

            return res.status(500).json({
                error: "AI returned an empty response."
            });
        }


        return res.status(200).json({
            success: true,
            result: result
        });


    } catch (error) {

        console.error("Server Error:", error);

        return res.status(500).json({
            error: "Something went wrong on the server."
        });
    }
}
