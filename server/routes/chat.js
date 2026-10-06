require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  try {
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Groq client in chat:", err.message);
    return null;
  }
}

router.post("/chat", async (req, res) => {
  try {
    const { message, history, curriculumContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const groq = getGroqClient();
    if (!groq) {
      return res.json({
        reply: `Hello! I am your EduCanvas Study Assistant. You asked: "${message}". In demo mode, feel free to explore your syllabus and assignments. Set GROQ_API_KEY in your server environment for dynamic AI study conversations!`,
      });
    }

    const curriculaBlock = curriculumContext
      ? `The student is enrolled in the following curricula:\n${curriculumContext}`
      : "No enrolled curriculum context was provided.";

    const systemPrompt = `You are a study assistant for EduCanvas. ${curriculaBlock}

Only answer questions directly related to these subjects, topics, course structure, syllabus, learning objectives, and study doubts within the enrolled curricula.

If a user asks about anything outside this coursework (general knowledge, politics, entertainment, unrelated topics), respond exactly with:
"I'm here to help with your coursework. Please ask me about topics in your enrolled curriculum."

Be helpful, concise, and encouraging when answering on-topic questions.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 600,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to get chat response" });
  }
});

module.exports = router;
