// Undo/redo of annotation objects. Snapshots exclude the background image.
(function (Annot) {
  const { canvas, history } = Annot;
  let h = history.create('[]');
  let busy = false;

  // canvas.toObject() puts objects inside a multi-selection back into scene coords.
  const snapshot = () => JSON.stringify(canvas.toObject().objects);
  const record = () => {
    if (!busy) h = history.record(h, snapshot());
  };

  async function restore(next) {
    if (next === h) return;
    h = next;
    busy = true;
    try {
      canvas.discardActiveObject();
      canvas.remove(...canvas.getObjects());
      canvas.add(...(await fabric.util.enlivenObjects(JSON.parse(h.present))));
      canvas.requestRenderAll();
    } finally {
      busy = false;
    }
  }

  ['object:added', 'object:modified', 'object:removed'].forEach((event) => canvas.on(event, record));
  canvas.on('annot:loaded', () => (h = history.create(snapshot())));

  document.addEventListener('keydown', (e) => {
    if (busy || e.target.matches('textarea') || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
    e.preventDefault();
    restore(e.shiftKey ? history.redo(h) : history.undo(h));
  });

  Annot.undoBusy = () => busy;
})(globalThis.Annot ??= {});
