import { useState, useRef, type ChangeEvent, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // Vite/webpack5
import axios from "axios";
import { useRecoilState, atom, useSetRecoilState } from "recoil";

export const docIdState = atom({
  key: "docIdState",
  default: "",
});

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function NewPdf() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const setDocId = useSetRecoilState(docIdState)

  useEffect(() => {
    if (pdfDoc) {
      renderPage(1);
    }
  }, [pdfDoc]);

  const renderPage = async (pageNumber: number) => {
    if (!pdfDoc) return;

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas && container) {
      const context = canvas.getContext("2d");
      const containerWidth = container.clientWidth;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context!,
        viewport: scaledViewport,
      }).promise;
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    setPdfDoc(pdf);
    setCurrentPage(1);


    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await axios.post(
        "http://localhost:5001/uploadPdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Uploaded successfully:", res.data);
      setDocId(res.data.docId)
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleNextPage = () => {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      renderPage(nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (pdfDoc && currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      renderPage(prevPage);
    }
  };

  return (
    <>
      <div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Upload PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button onClick={handlePreviousPage}>-</button>
        <button onClick={handleNextPage}>+</button>
        <div
          ref={containerRef}
          className="rounded border-black"
          style={{
            width: "600px",
            // height: "500px",
            aspectRatio: "612 / 792",
            border: "",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    </>
  );
}
