/**
 * Read an image file as base64 JPEG, scaled down so a bill photo stays well under the API's
 * request limit (the backend accepts ~4MB of JSON) while text stays readable for OCR.
 */
export async function imageFileToBase64(file: File, maxDim = 1600, maxChars = 3_000_000): Promise<{ base64: string; mimeType: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image."));
      el.src = url;
    });
    let dim = maxDim;
    let quality = 0.82;
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(1, dim / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Couldn't process that image.");
      ctx.fillStyle = "#fff"; // transparent PNGs → white, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", quality).replace(/^data:image\/jpeg;base64,/, "");
      if (base64.length <= maxChars) return { base64, mimeType: "image/jpeg" };
      dim = Math.round(dim * 0.8);
      quality = Math.max(0.5, quality - 0.08);
    }
    throw new Error("That image is too large. Try a smaller photo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
