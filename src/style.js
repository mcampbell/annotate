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
  const commit = () => Annot.canvas.getActiveObjects().forEach((target) => Annot.canvas.fire('object:modified', { target }));
  [color, size].forEach((input) => {
    input.addEventListener('input', applyToSelection);
    input.addEventListener('change', commit);
  });
})(globalThis.Annot ??= {});
