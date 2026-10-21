// Color/size panel. Applies to new objects and to the current selection.
(function (Annot) {
  const color = document.getElementById('color');
  const size = document.getElementById('size');

  Annot.style = () => ({ color: color.value, size: Number(size.value) });

  const applyToSelection = () => {
    const { canvas, tools } = Annot;
    canvas.getActiveObjects().forEach((obj) => {
      tools[obj.annotTool]?.applyStyle(obj, Annot.style());
      obj.setCoords();
      canvas.fire('object:modified', { target: obj });
    });
    canvas.requestRenderAll();
  };
  color.addEventListener('input', applyToSelection);
  size.addEventListener('input', applyToSelection);
})(globalThis.Annot ??= {});
