import * as pdfjs from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjs.GlobalWorkerOptions.workerSrc = worker;

export async function loadPDF() {

  const response = await fetch("/trinity.pdf");

  const blob = await response.blob();

  const pdf = await pdfjs.getDocument({
    data: await blob.arrayBuffer()
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {

    const page = await pdf.getPage(i);

    const content = await page.getTextContent();

    const pageText = content.items.map(item => item.str).join(" ");

    text += pageText + "\n";

  }

  return text;
}