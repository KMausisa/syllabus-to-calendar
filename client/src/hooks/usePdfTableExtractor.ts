// src/hooks/usePdfTableExtractor.ts
import { useState } from "react";
import pdfjsLib from "../lib/pdfSetup";

export function usePdfTableExtractor() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string>("");

  const extractFromFile = async (file: File, tolerance = 3) => {
    setLoading(true);
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

    console.log("Raw extracted contents:", contents);

    let text = contents
      .flat()
      .flatMap((pageItems: any) => {
        const text = pageItems.str;
        if (text === "") return "\n";
        if (text === " ") return " ";
        return text.trim(); // replace empty string with one space
      })
      .join("");

    const prompt =
      "Extract the assignments from the syllabus text below. " +
      "Return the results as a JSON array of objects with the following keys: " +
      "'week', 'date' (in YYYY-MM-DD format), 'time and location (if not specified use 'N/A') of class', 'list of assignments and when to complete them', and 'details'. " +
      "If the date is not specified, use 'TBD'. " +
      "Here is the syllabus text:\n\n" +
      text;

    setPrompt(prompt);
  };

  return { prompt, loading, extractFromFile };
}
