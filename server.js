import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

/* =========================
   AI ENDPOINT
========================= */

app.post("/ask", async (req, res) => {
    const { message, night, history, type, scale } = req.body;

    let systemPrompt = "";

    if (type === "survivor") {
        systemPrompt = `
You are roleplaying a distressed civilian trapped somewhere unknown.
Respond ONLY in valid JSON:
{
  "message": "string",
  "emotion": "fearful | calm | desperate | manipulative",
  "clarity": 0-100
}
Keep under 80 words.
Night: ${night}
History: ${history}
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

Manipulation Intensity: ${scale}
Night: ${night}
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
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || "{}";

        res.json({
            reply: content
        });

    } catch (err) {
        res.status(500).json({ error: "AI request failed" });
    }
});


/* =========================
   TEXT TO SPEECH ENDPOINT
========================= */

app.post("/tts", async (req, res) => {

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        const response = await fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": process.env.ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_multilingual_v2"
                })
            }
        );

        if (!response.ok) {
            return res.status(500).json({ error: "TTS API failed" });
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        res.json({
            audioUrl: "data:audio/mpeg;base64," + base64Audio
        });

    } catch (err) {
        res.status(500).json({ error: "TTS generation failed" });
    }
});


/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
