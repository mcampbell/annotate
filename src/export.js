// Copy the annotated image to the clipboard as PNG at native resolution.
(function (Annot) {
  const button = document.getElementById('copy');

  // The area inside the crop frame, or the whole image with no frame. 'crop' is the tool id in tools/crop.js.
  // A frame off the image throws: a silent whole-image copy would leak the part the user meant to cut.
  const exportArea = (canvas) => {
    const { width, height } = canvas.backgroundImage;
    const frame = canvas.getObjects().find((o) => o.annotTool === 'crop');
    if (!frame) return { frame, area: { left: 0, top: 0, width, height } };
    const area = Annot.cropBounds(frame.getBoundingRect(), width, height);
    if (!area) throw new Error('the crop frame is off the image');
    return { frame, area };
  };

  const toCanvas = () => {
    const { canvas } = Annot;
    const { frame, area } = exportArea(canvas);
    const zoom = canvas.getZoom();
    // Zoom 1 + exact size avoids float rounding that toCanvasElement(1 / zoom) would add.
    canvas.setZoom(1);
    if (frame) frame.visible = false; // the frame marks the area; it is not part of the image
    try {
      return canvas.toCanvasElement(1, area);
    } finally {
      if (frame) frame.visible = true;
      canvas.setZoom(zoom);
    }
  };

  // toCanvas runs before the promise: its throw then reaches the click handler's catch,
  // not a ClipboardItem promise that Chrome also reports as an uncaught rejection.
  const toBlob = () => {
    const canvas = toCanvas();
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'));
  };

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
