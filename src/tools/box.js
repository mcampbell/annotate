// Box: outlined rectangle, dragged corner to corner. Size = stroke width.
(function (Annot) {
  const applyStyle = (obj, { color, size }) => obj.set({ stroke: color, strokeWidth: size });

  Annot.registerTool({
    id: 'box',
    label: 'Box',
    create: (point, style) => applyStyle(new fabric.Rect({ fill: 'transparent', strokeUniform: true }), style),
    drag: (obj, start, end) => obj.set(Annot.rectBetween(start, end)),
    applyStyle,
  });
})(globalThis.Annot ??= {});
