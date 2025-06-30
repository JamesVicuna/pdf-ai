import { useState, useRef, type ChangeEvent } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // Note '?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function PdfPreview() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdf, setPdf] = useState<any>();

  const handleNext = async () => {
    try {
      // Load the PDF
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const page = await pdf.getPage(newPage);

      // Set up canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Calculate scale for good quality
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport, 
      };

      await page.render(renderContext).promise;

      // Convert canvas to image URL
      const imageDataUrl = canvas.toDataURL("image/png");
      setImageUrl(imageDataUrl);
    } catch (err) {
      console.error("Error converting PDF:", err);
      setError("Failed to convert PDF to image");
    } finally {
      setLoading(false);
    }
  };

  const convertPDFToImage = async (pdfPath : string) => {
    setLoading(true);
    setError(null);

    try {
      // Load the PDF
      const loadingTask = pdfjsLib.getDocument(pdfPath);
      const pdf = await loadingTask.promise;
      setPdf(pdf);
      // Get the first page
      const page = await pdf.getPage(1);
      setCurrentPage(1)
      console.log(pdf._pdfInfo);

      // Set up canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Calculate scale for good quality
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to image URL
      const imageDataUrl = canvas.toDataURL("image/png");
      setImageUrl(imageDataUrl);
    } catch (err) {
      console.error("Error converting PDF:", err);
      setError("Failed to convert PDF to image");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: ChangeEvent) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(file);
      convertPDFToImage(fileUrl);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        PDF to Image Converter
      </h1>
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload PDF to Convert
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Converting PDF to image...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Hidden Canvas for PDF rendering */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Display converted image */}
      {imageUrl && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">PDF Preview (First Page)</h3>
            <div className="flex">
              <button
                className="button bg-blue-300 rounded px-2 py-1"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img
              src={imageUrl}
              alt="PDF Preview"
              className="max-w-full h-auto shadow-lg rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
