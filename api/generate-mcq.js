// IMPORTANT: Set GROQ_API_KEY in Vercel → Settings → Environment Variables

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a precise quiz generation assistant. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Groq MCQ error:", response.status, errBody);
      return res.status(500).json({ error: "Groq error" });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "No content" });

    const match = content.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonStr = match ? match[1].trim() : content.trim();

    let options;
    try {
      options = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ error: "Could not parse response" });
    }

    if (!Array.isArray(options) || options.length !== 3) {
      return res.status(500).json({ error: "Invalid options format" });
    }

    return res.status(200).json({ options });
  } catch (err) {
    console.error("generate-mcq failed:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
