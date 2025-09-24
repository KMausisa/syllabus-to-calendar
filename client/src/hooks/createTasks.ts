// Create tasks to add to calendar
import { useState } from "react";

const API_BASE =
  import.meta.env.MODE === "production"
    ? "https://syllabus-to-calendar-yjkk.onrender.com"
    : import.meta.env.VITE_API_BASE_URL;

/**
 * Hook that creates tasks by making a call to the backend. Passes tasks into the body.
 * @returns createTasks function and three different states: "loading", "error", and "success"
 */
export function useCreateTasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createTasks = async (tasks: any[]) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await fetch(`${API_BASE}/api/add-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tasks),
      });
      setSuccess(
        "Tasks successfully added to calendar! Please check your google calendar for reference."
      );
    } catch (err) {
      console.error("Error creating tasks:", err);
      setError("Failed to create tasks. Please try again.");
    }
    setLoading(false);
  };

  return { createTasks, loading, error, success };
}
