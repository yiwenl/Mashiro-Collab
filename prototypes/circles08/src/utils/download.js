export function saveImage(canvas) {
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "");
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `circles08-${stamp}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
