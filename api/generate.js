export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sourceText } = req.body;
  if (!sourceText) return res.status(400).json({ error: "Missing sourceText" });

  const source = sourceText.trim().slice(0, 30000);
  const prompt = `
Create exactly 15 study flashcards from the text below.
Return ONLY valid JSON with this exact shape:
[
  { "question": "string", "answer": "string" }
]

Rules:
- Exactly 15 objects
- Clear concise question and answer
- No extra keys
- No markdown, no explanation, only JSON

Text:
${source}
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a precise flashcard generation assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) return res.status(500).json({ error: "Groq error" });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No content" });

  const match = content.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = match ? match[1].trim() : content.trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return res.status(500).json({ error: "Could not parse response" });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return res.status(500).json({ error: "Invalid cards format" });
  }

  let cards;
  try {
    cards = parsed.map((item, idx) => {
      const question = String(item?.question || "").trim();
      const answer = String(item?.answer || "").trim();
      if (!question || !answer) {
        throw new Error(`Flashcard ${idx + 1} is missing question or answer.`);
      }
      return { question, answer };
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Invalid card data" });
  }

  return res.status(200).json({ cards });
}
