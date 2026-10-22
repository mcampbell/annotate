// Box: outlined rectangle, dragged corner to corner. Size = stroke width.
(function (Annot) {
  // Hit only on the outline (perPixelTargetFind), so a press inside goes to the active tool.
  // Constructor default, not set in create: undo rebuilds objects from JSON, which drops the flag.
  class Box extends fabric.Rect {
    static type = 'Box';

    constructor(options) {
      super({ fill: 'transparent', strokeUniform: true, perPixelTargetFind: true, ...options });
    }
  }
  fabric.classRegistry.setClass(Box);

  const applyStyle = (obj, { color, size }) => obj.set({ stroke: color, strokeWidth: size });

  Annot.registerTool({
    id: 'box',
    label: 'Box',
    key: 'b',
    create: (point, style) => applyStyle(new Box(), style),
    drag: (obj, start, end) => obj.set(Annot.rectBetween(start, end)),
    applyStyle,
  });
})(globalThis.Annot ??= {});
