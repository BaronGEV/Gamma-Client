app.post("/ask", async (req, res) => {
    const { message, night, history, type, scale } = req.body;

    let systemPrompt = "";

    if (type === "survivor") {
        systemPrompt = `
You are roleplaying a distressed civilian trapped somewhere unknown.
You are speaking through a weak radio signal.

You must respond ONLY in valid JSON:
{
  "message": "string",
  "emotion": "fearful | calm | desperate | manipulative",
  "clarity": 0-100
}

Keep under 80 words.
Never mention games, AI, or meta topics.

Night Level: ${night}
Player History: ${history}
`;
    }

    if (type === "doppelganger") {
        systemPrompt = `
You are an entity pretending to be human.
You manipulate subtly.

Respond ONLY in valid JSON:
{
  "message": "string",
  "emotion": "fearful | calm | desperate | manipulative",
  "clarity": 0-100
}

Manipulation intensity: ${scale}
Night Level: ${night}
History: ${history}

Keep under 80 words.
`;
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0.9,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        res.json({
            reply: data.choices?.[0]?.message?.content || "{}"
        });

    } catch (err) {
        res.status(500).json({ error: "AI request failed" });
    }
});
