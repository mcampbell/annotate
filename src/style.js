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
      obj.annotSize = Annot.style().size;
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };
  // Show the selection's size. Set the value only: an input event would restyle it.
  const showSize = () => {
    const sizes = new Set(Annot.canvas.getActiveObjects().map((obj) => obj.annotSize));
    if (sizes.size === 1 && !sizes.has(undefined)) size.value = [...sizes][0];
  };
  Annot.canvas.on({ 'selection:created': showSize, 'selection:updated': showSize });
  const commit = () => Annot.canvas.getActiveObjects().forEach((target) => Annot.canvas.fire('object:modified', { target }));
  [color, size].forEach((input) => {
    input.addEventListener('input', applyToSelection);
    input.addEventListener('change', commit);
  });
})(globalThis.Annot ??= {});
