// Box: outlined rectangle. Size = stroke width.
(function (Annot) {
  const applyStyle = (obj, { color, size }) => obj.set({ stroke: color, strokeWidth: size });

  Annot.registerTool({
    id: 'box',
    label: 'Box',
    create: (point, style) =>
      applyStyle(new fabric.Rect({ left: point.x, top: point.y, width: 160, height: 100, fill: 'transparent', strokeUniform: true }), style),
    applyStyle,
  });
})(globalThis.Annot ??= {});
