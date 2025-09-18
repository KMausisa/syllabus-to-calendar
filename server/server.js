const express = require("express");
const OpenAI = require("openai");
const google = require("googleapis").google;
require("dotenv").config();

const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("API Key:", process.env.OPENAI_API_KEY ? "Loaded" : "Not Loaded");

let savedTokens = null;

app.use(express.json());

// Configure Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/oauth2callback"
);

// Redirect user to Google's consent screen
app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  savedTokens = tokens;

  res.send("Authentication successful! You can close this window.");
});

// Separate endpoint to add events
app.post("/api/add-events", async (req, res) => {
  try {
    // retrieve and set saved tokens first
    console.log(savedTokens);
    oauth2Client.setCredentials(savedTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const events = req.body;
    console.log(events);
    for (const event of events) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
    }

    res.json({ message: "Events added!" });
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to add events");
  }
});

app.post("/api/generate", async (req, res) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: req.body.prompt }],
    response_format: { type: "json_object" },
  });

  res.json({ text: completion.choices[0].message.content });
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
