// src/hooks/usePdfTableExtractor.ts
import { useState } from "react";
import pdfjsLib from "../lib/pdfSetup";

/**
 * Uses the pdfjs Library to parse and extract the syllabus text.
 * @returns extractFromFile (function), prompt (to pass into LLM), and loading (boolean)
 */
export function usePdfTableExtractor() {
  const [prompt, setPrompt] = useState<string>("");

  const extractFromFile = async (file: File, tolerance = 3) => {
    const buffer = await file.arrayBuffer();

    // Load PDF
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const contents = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      if (!content) continue;
      contents.push(content.items);
    }

    let text = contents
      .flat()
      .flatMap((pageItems: any) => {
        const text = pageItems.str;
        if (text === "") return "\n";
        if (text === " ") return " ";
        return text.trim();
      })
      .join("");

    const prompt = `
      Extract **all** assignments from the syllabus text below.
      Return ONLY a valid JSON array where each object represents one week and uses this schema:

      [
        {
          "week": "number or string",
          "date": "YYYY-MM-DD of class meeting (or array if multiple meetings), or 'No class'/'TBD' if none",
          "time_location": "class time & room, or 'N/A'",
          "course": "course name",
          "assignments": [
            {
              "assignment": "full text of the task (add '(TBD exact date)' if due date is unknown)",
              "due_date": "YYYY-MM-DD of actual or first-day-of-week due date, or 'TBD'"
            }
          ],
          "details": "notes for the week's work"
        }
      ]

      Rules:
      • Include **every** assignment, required or optional, even if no due date is given.
      • If due date is right before class, set it to 30 minutes before class starts.
      • If a due date is missing or unclear, set \`due_date\` to the Monday of that week in YYYY-MM-DD format and append "(TBD exact date)" to the assignment text.
      • Do not summarize or omit anything.

      Example:
      [ { "week": "1", "date": "2025-01-08", "time_location": "Wed 9:00–10:50, Room F108", "course": "Legal Communication and Research Skills II", "assignments": [ { "assignment": "Read Chapters 1–3", "due_date": "2025-01-08T8:30:00" } ], "details": "Intro class and syllabus review." } ]

      Syllabus text:
      ${text}
    `;

    setPrompt(prompt);
  };

  return { prompt, extractFromFile };
}
