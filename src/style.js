// Color/size panel. Applies to new objects and to the current selection.
(function (Annot) {
  const color = document.getElementById('color');
  const size = document.getElementById('size');

  Annot.style = () => ({ color: color.value, size: Number(size.value) });

  // Live preview on input. Commit on change, so one slider drag is one undo step.
  const applyToSelection = () => {
    const { canvas, tools } = Annot;
    canvas.getActiveObjects().forEach((obj) => {
      tools[obj.annotTool]?.applyStyle(obj, Annot.style());
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };
  // Each drawing tool keeps its own size until reload. Editing a selection changes only the objects.
  const sizes = {};
  const showToolSize = () => {
    const id = Annot.activeTool();
    if (id) size.value = sizes[id] ?? size.defaultValue;
  };
  size.addEventListener('input', () => {
    const id = Annot.activeTool();
    if (id && !Annot.canvas.getActiveObjects().length) sizes[id] = size.value;
  });
  Annot.canvas.on('annot:tool', () => Annot.canvas.getActiveObjects().length || showToolSize());
  Annot.canvas.on('selection:cleared', showToolSize);
  const commit = () => Annot.canvas.getActiveObjects().forEach((target) => Annot.canvas.fire('object:modified', { target }));
  [color, size].forEach((input) => {
    input.addEventListener('input', applyToSelection);
    input.addEventListener('change', commit);
  });
})(globalThis.Annot ??= {});
