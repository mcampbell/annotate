// Image sources: clipboard paste, file picker, drag-drop.
(function (Annot) {
  const load = (file) => {
    if (!file) return;
    if (file.type.startsWith('image/')) Annot.loadImage(file);
    else Annot.status(`Not an image: ${file.name}`, true);
  };
  const input = document.getElementById('file');
  document.getElementById('open').addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    load(input.files[0]);
    input.value = '';
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    load(e.dataTransfer.files[0]);
  });
  document.addEventListener('paste', (e) => {
    if (Annot.isTyping(e)) return;
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (!file) return Annot.status('Clipboard has no image.', true);
    e.preventDefault();
    Annot.loadImage(file);
  });
})(globalThis.Annot ??= {});
