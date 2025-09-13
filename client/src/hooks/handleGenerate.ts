export const handleGenerate = async (prompt: string) => {
  console.log("Sending prompt to /api/generate:", prompt);
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    // Read raw text so you can see the backend error page or message
    const errorText = await res.text();
    console.error(`Server error ${res.status}:`, errorText);
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
};
