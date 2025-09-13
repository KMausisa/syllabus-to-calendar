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

    let fullText = contents
      .flat()
      .flatMap((pageItems: any) => pageItems.str)
      .filter((t) => t.length > 0)
      .join(" ");

    const prompt =
      "Extract the assignments from the syllabus text below. " +
      "Return the results as a JSON array of objects with the following keys: " +
      "'date' (in YYYY-MM-DD format), 'assignment', and 'details'. " +
      "If the date is not specified, use 'TBD'. " +
      "Here is the syllabus text:\n\n" +
      fullText;

    setPrompt(prompt);
  };

  return { prompt, loading, extractFromFile };
}
