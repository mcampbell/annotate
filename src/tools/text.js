// Text: click-to-place IText, edits immediately. Size = font size. Empty text is removed on exit.
(function (Annot) {
  const applyStyle = (obj, { color, size }) => obj.set({ fill: color, fontSize: 12 + size * 4 });

  // Canvas-level so text restored by undo gets it too. Deferred: Fabric still uses target.canvas after this event.
  Annot.canvas.on('text:editing:exited', ({ target }) => {
    if (target.text.trim() === '') queueMicrotask(() => Annot.canvas.remove(target));
  });

  Annot.registerTool({
    id: 'text',
    label: 'Text',
    key: 't',
    create: (point, style) =>
      applyStyle(new fabric.IText('Text', { left: point.x, top: point.y, fontFamily: 'system-ui, sans-serif' }), style),
    applyStyle,
    afterDrop: (obj) => {
      obj.enterEditing();
      obj.selectAll();
    },
  });
})(globalThis.Annot ??= {});
