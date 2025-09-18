// Create tasks to add to calendar
import { useState } from "react";
import { google } from "googleapis";

export function useCreateTasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createTasks = async (tasks: any[]) => {
    console.log(`Tasks passed into createTasks: ${tasks}`);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await fetch("/api/add-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasks),
      });
      setSuccess("Tasks successfully added to calendar!");
    } catch (err) {
      console.error("Error creating tasks:", err);
      setError("Failed to create tasks. Please try again.");
    }
    setLoading(false);
  };

  return { createTasks, loading, error, success };
}
