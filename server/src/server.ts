import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";

import { Credentials } from "google-auth-library";
const google = require("googleapis").google;

import OpenAI from "openai";
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET as string;

function generateJWT(tokens: Credentials) {
  return jwt.sign({ tokens }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { tokens: Credentials };
  } catch {
    return null;
  }
}

const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("API Key:", process.env.OPENAI_API_KEY ? "Loaded" : "Not Loaded");

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://syllabus-to-calendar-lake.vercel.app"
    : "http://localhost:5173";

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://syllabus-to-calendar-yjkk.onrender.com"
    : "http://localhost:5000";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
  })
);

// Configure Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/oauth2callback`
);

// Get the Home Page where the use signs in with Google.
app.get("/", (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) {
    res.send(`
      <html>
        <body>
          <h1>Private Google Calendar</h1>
          <a href="/auth/google">Sign in with Google</a>
        </body>
      </html>
    `);
  } else {
    // User is logged in; serve a simple page with a script to fetch events
    res.send(`
      <html>
        <body>
          <h1>Your Calendar Events</h1>
          <div id="calendar"></div>
          <script>
            fetch('/api/events')
              .then(res => res.json())
              .then(events => {
                document.getElementById('calendar').innerText =
                  JSON.stringify(events, null, 2);
              });
          </script>
        </body>
      </html>
    `);
  }
});

// Redirect user to Google's consent screen
app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req: Request, res: Response) => {
  // Check if code was retrieved
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  const { tokens } = await oauth2Client.getToken(code as string);
  oauth2Client.setCredentials(tokens);

  const token = generateJWT(tokens);
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res.redirect(FRONTEND_URL);
});

// Check if tokens are generated and return result as boolean.
app.get("/api/session", (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ loggedIn: false });

  const payload = verifyJWT(token);
  res.json({ loggedIn: !!payload });
});

// Grab the events in user's primary calendar of the current year.
app.get("/api/events", async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    oauth2Client.setCredentials(payload.tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00`).toISOString();
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59`).toISOString();

    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfYear,
      timeMax: endOfYear,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500, // optional, to fetch more events
    });

    res.json(events.data.items);
  } catch (error) {
    console.log("Error in fetching calendar events: ", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Add the parsed events to the user's calendar
app.post("/api/add-events", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = verifyJWT(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    oauth2Client.setCredentials(payload.tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Body must be an array of events." });
    }
    const events = req.body;
    for (const event of events) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
    }

    res.json({ message: "Events added! Please check your google calendar." });
  } catch (error) {
    console.error("Events were not added: ", error);
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
  console.log(`Server is running on ${BACKEND_URL}`);
});
