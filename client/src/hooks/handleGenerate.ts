const API_BASE =
  import.meta.env.MODE === "production"
    ? "https://syllabus-to-calendar-yjkk.onrender.com"
    : import.meta.env.VITE_API_BASE_URL;
/**
 * Generates the response from the LLM by making a call to the backend
 * @param prompt - The string to pass into the LLM.
 * @returns The response generated.
 * @error Throws and error if the operation was unsuccessful
 */
export const handleGenerate = async (prompt: string) => {
  console.log("Sending prompt to /api/generate...");
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Server error ${res.status}:`, errorText);
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
};
