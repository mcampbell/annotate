// Undo/redo of annotation objects. Snapshots exclude the background image.
(function (Annot) {
  const { canvas, history } = Annot;
  let h = history.create('[]');
  let busy = false;
  let pending = false;

  // canvas.toObject() puts objects inside a multi-selection back into scene coords.
  const snapshot = () => JSON.stringify(canvas.toObject().objects);
  // One record per task: a multi-object delete or style change fires one event per object.
  const record = () => {
    if (busy || pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      if (!busy) h = history.record(h, snapshot());
    });
  };

  async function restore(next) {
    if (next === h) return;
    busy = true;
    try {
      const objects = await fabric.util.enlivenObjects(JSON.parse(next.present));
      canvas.discardActiveObject();
      canvas.remove(...canvas.getObjects());
      canvas.add(...objects);
      canvas.requestRenderAll();
      h = next;
    } catch (err) {
      Annot.status(`Undo failed: ${err.message}`, true);
    } finally {
      busy = false;
    }
  }

  ['object:added', 'object:modified', 'object:removed'].forEach((event) => canvas.on(event, record));
  canvas.on('annot:loaded', () => (h = history.create(snapshot())));

  document.addEventListener('keydown', (e) => {
    if (busy || Annot.isTyping(e) || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
    e.preventDefault();
    restore(e.shiftKey ? history.redo(h) : history.undo(h));
  });

  Annot.undoBusy = () => busy;
})(globalThis.Annot ??= {});
