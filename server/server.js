const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log("API Key:", process.env.OPENAI_API_KEY ? "Loaded" : "Not Loaded");

app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: req.body.prompt }],
  });
  res.json({ text: completion.choices[0].message.content });
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
