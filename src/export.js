// Copy the annotated image to the clipboard as PNG at native resolution.
(function (Annot) {
  const button = document.getElementById('copy');

  const toCanvas = () => {
    const { canvas } = Annot;
    const { width, height } = canvas.backgroundImage;
    const zoom = canvas.getZoom();
    // Zoom 1 + exact size avoids float rounding that toCanvasElement(1 / zoom) would add.
    canvas.setZoom(1);
    try {
      return canvas.toCanvasElement(1, { width, height });
    } finally {
      canvas.setZoom(zoom);
    }
  };

  const toBlob = () =>
    new Promise((resolve, reject) =>
      toCanvas().toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'));

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob() })]);
      Annot.status('Copied to clipboard.');
    } catch (err) {
      Annot.status(`Copy failed: ${err.message}`, true);
    }
  });

  Annot.canvas.on('annot:loaded', () => (button.disabled = false));
  Annot.toCanvas = toCanvas;
})(globalThis.Annot ??= {});
