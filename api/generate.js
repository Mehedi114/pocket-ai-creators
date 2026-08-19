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
                error: "Input is required"
            });
        }

        let prompt = "";

        if (tool === "YouTube Title Generator") {

            prompt = `
You are an expert YouTube content strategist.

Generate 10 highly clickable YouTube titles for the creator.

Topic:
${input}

Rules:
- Make titles curiosity-driven.
- Do not use fake claims.
- Avoid generic AI-sounding titles.
- Make them natural for real creators.
- Prefer strong emotional curiosity.
- Keep titles reasonably short.
- Give only the 10 titles.
- Number them 1 to 10.
`;

        } else {

            prompt = `
You are Pocket AI, an AI assistant built specifically for content creators.

Tool:
${tool}

Creator request:
${input}

Give a useful, practical and creator-focused response.
`;
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini error:", data);

            return res.status(response.status).json({
                error: data?.error?.message || "AI request failed"
            });
        }

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({
                error: "AI returned an empty response"
            });
        }

        return res.status(200).json({
            success: true,
            result: text
        });

    } catch (error) {

        console.error("Server error:", error);

        return res.status(500).json({
            error: "Something went wrong"
        });
    }
}
