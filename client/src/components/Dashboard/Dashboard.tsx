import React from "react";
import { useEffect, useState } from "react";
import { usePdfTableExtractor } from "../../hooks/usePdfTableExtractor";
import { useCreateTasks } from "../../hooks/createTasks";
import { handleGenerate } from "../../hooks/handleGenerate";

import CalendarView from "../CalendarView/CalendarView";
import "./Dashboard.css";

export default function DashBoard({ url }: { url: string }) {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [exiting, setExiting] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [refresh, setRefresh] = useState<number>(0);
  const [fileError, setFileError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { prompt, extractFromFile } = usePdfTableExtractor();
  const { createTasks, success, error } = useCreateTasks();

  useEffect(() => {
    if (localStorage.getItem("welcomeHidden") === "true") setShowWelcome(false);
  }, []);

  useEffect(() => {
    if (!prompt) return;

    const run = async () => {
      setLoading(true);
      const result = await handleGenerate(prompt);
      console.log("Course assignments:", result);
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
      • If an assignment is due before class, set the "end" time of the assignment to the "start" time of the class.
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

      console.log("Tasks to be added to Google Calendar:", tasks);

      await createTasks(tasks);
      setRefresh((prev) => prev + 1);
      setLoading(false);
    };

    run();
  }, [prompt]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type != "application/pdf") {
      setFileError("Please upload a PDF file");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("The file must have a .pdf extension.");
      return;
    }

    setFileError("");
    extractFromFile(file);
  };

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setShowWelcome(false);
      localStorage.setItem("welcomeHidden", "true");
    }, 300);
  };

  return (
    <div className="dashboard">
      {/* Modal Overlay */}
      {showWelcome && (
        <div className={`welcome-overlay ${exiting ? "exit" : "enter"}`}>
          <div className={`welcome-modal ${exiting ? "exit" : "enter"}`}>
            <h2>Welcome to Syllabus-to-Calendar!</h2>
            <p>
              Upload a PDF syllabus to automatically add assignment dates to
              your Google Calendar.
            </p>
            <button onClick={handleDismiss}>Got it!</button>
          </div>
        </div>
      )}

      {/* Regular Content */}
      <div className="header">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        {fileError && <p className="file-error">{fileError}</p>}
        <a
          href={`${url}/logout`}
          className="logout-button"
          onClick={() => localStorage.removeItem("welcomeHidden")}
        >
          Log out
        </a>
      </div>

      {loading && <p>Extracting...</p>}
      {success && <p>{success}</p>}
      {error && <p>{error}</p>}

      <div className="calendar-container">
        <CalendarView refresh={refresh} />
      </div>
    </div>
  );
}
