import React from "react";
import { useEffect } from "react";
import { usePdfTableExtractor } from "./hooks/usePdfTableExtractor";
import { handleGenerate } from "./hooks/handleGenerate";

export default function PdfUploader() {
  const { prompt, loading, extractFromFile } = usePdfTableExtractor();

  useEffect(() => {
    if (!prompt) return;

    const run = async () => {
      console.log("Prompt updated in App component:", prompt);
      const response = await handleGenerate(prompt);
      console.log("Response from handleGenerate:", response);
    };

    run();
  }, [prompt]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      extractFromFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-4">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {loading && <p>Extracting...</p>}
      <pre className="text-xs mt-4 whitespace-pre-wrap">
        Testing....
      </pre>
    </div>
  );
}
