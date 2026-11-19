// Circle: outlined ellipse, dragged corner to corner. Shift makes it a circle. Size = stroke width.
(function (Annot) {
  // Type 'Oval', not 'Circle': Step builds on fabric.Circle, and setClass would replace it in the registry.
  // Defaults in the constructor, not in create: undo rebuilds objects from JSON (see box.js).
  class Oval extends fabric.Ellipse {
    static type = 'Oval';

    constructor(options) {
      super({ fill: 'transparent', strokeUniform: true, perPixelTargetFind: true, ...options });
    }
  }
  fabric.classRegistry.setClass(Oval);

  const applyStyle = (obj, { color, size }) => obj.set({ stroke: color, strokeWidth: size });

  Annot.registerTool({
    id: 'circle',
    label: 'Circle',
    key: 'c',
    create: (point, style) => applyStyle(new Oval(), style),
    drag: (obj, start, end) => {
      const { left, top, width, height } = Annot.rectBetween(start, end);
      obj.set({ left, top, rx: width / 2, ry: height / 2 });
    },
    snap: Annot.snapSquare,
    applyStyle,
  });
})(globalThis.Annot ??= {});
