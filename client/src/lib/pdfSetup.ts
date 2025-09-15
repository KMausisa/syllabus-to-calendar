// pdfSetup.ts
import * as pdfjsLib from "pdfjs-dist";

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export default pdfjsLib;
