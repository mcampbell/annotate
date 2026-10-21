// Image sources: clipboard paste.
(function (Annot) {
  document.addEventListener('paste', (e) => {
    if (e.target.matches?.('input, textarea')) return;
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (!file) return Annot.status('Clipboard has no image.', true);
    e.preventDefault();
    Annot.loadImage(file);
  });
})(globalThis.Annot ??= {});
