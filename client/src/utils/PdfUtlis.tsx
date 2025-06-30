type HandleNextProps = {
  currentPage: number;
  setCurrentPage: Function;
};

export const handleNext = async ({
  currentPage,
  setCurrentPage,
}: HandleNextProps) => {
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
