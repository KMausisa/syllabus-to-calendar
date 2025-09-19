import React from "react";
import { useEffect, useState } from "react";
import { usePdfTableExtractor } from "./hooks/usePdfTableExtractor";
import { useCreateTasks } from "./hooks/createTasks";
import { handleGenerate } from "./hooks/handleGenerate";

import CalendarView from "./components/CalendarView"

const API_BASE =
import.meta.env.MODE === "production"
  ? "https://syllabus-to-calendar-yjkk.onrender.com"
  : import.meta.env.VITE_API_BASE_URL; 

export default function PdfUploader() {
  const [response, setResponse] = useState<string>("");
  const [refresh, setRefresh] = useState<number>(0);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const { prompt, loading, extractFromFile } = usePdfTableExtractor();
  const { createTasks, success, error } = useCreateTasks();


  // Check session on mount
  useEffect(() => {
    // Check the user login status
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/session`, {credentials: "include"})
        const data = await response.json()
        setLoggedIn(data.loggedIn)
      } catch (error) {
        console.log("Error in validating user session: ", error);
        setLoggedIn(false)
      }
    };

    checkStatus();
  }, [])

  useEffect(() => {
    if (!prompt) return;

    const run = async () => {
      const result = await handleGenerate(prompt);
      console.log("Course assignments:", result)
      setResponse(result);

      const createTaskPrompt = `
      You are a scheduling assistant.

      From the JSON array of assignments below, generate **one single JSON array** of Google Calendar events.
      Return a JSON object with a single key "events" whose value is an array of event objects.
      Create an event for **every class session** and **every assignment**.

      Each event object must strictly follow this schema:
      {
        "summary": "Course name",
        "start": { "dateTime": "YYYY-MM-DDTHH:MM:SS", "timeZone": "America/Los_Angeles" },
        "end":   { "dateTime": "YYYY-MM-DDTHH:MM:SS", "timeZone": "America/Los_Angeles" },
        "location": "Room or 'N/A'",
        "description": "Assignment details or class topic (omit if none)"
      }

      Rules:
      • Output only valid JSON — **no code fences, no extra text**.
      • Include **every** class meeting and **every** assignment, even optional ones.
      • If an assignment is due in a week with no class, set start and end to the **Monday of that week at 09:00 and 10:50** and append "(TBD exact date)" to the description.
      • If a date or time is missing and cannot be inferred, use the Monday of the week and default times 09:00–10:50.
      • If multiple assignments appear in one item, create a separate event for each.
      • Ensure dateTime strings are in full ISO format: "YYYY-MM-DDTHH:MM:SS".

      Assignments JSON:
      ${result}
      `;

      const tasksResponse = await handleGenerate(createTaskPrompt);
      const parsed = JSON.parse(tasksResponse);
      const tasks = parsed.events ?? parsed.result ?? parsed;

      console.log("Tasks to be added to Google Calendar:", tasks)

      await createTasks(tasks);
      setRefresh(prev => prev + 1);
    };

    run();
  }, [prompt]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      extractFromFile(e.target.files[0]);
    }
  };

  if (loggedIn === null) return <p>Checking sign-in...</p>

  // Direct user to sign in if not already
  if (!loggedIn) {
    return (
      <div className="p-4">
        <h3>Please sign in to Google first</h3>
        <a
          href={`${API_BASE}/auth/google`}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  return (
    <div className="p-4">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {loading && <p>Extracting...</p>}
      {success ?? <p>{success}</p>}
      {error ?? <p>{error}</p>}
      <CalendarView refresh={refresh}/>
    </div>
  );
}
