// Step: numbered bubble. Number = z-order rank among steps. Size = scale.
(function (Annot) {
  class Step extends fabric.Group {
    static type = 'Step';
    constructor(...args) {
      super(...args);
      this.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
    }
  }
  fabric.classRegistry.setClass(Step);

  const applyStyle = (obj, { color, size }) => {
    obj.item(0).set({ fill: color });
    obj.set({ scaleX: (size + 2) / 5, scaleY: (size + 2) / 5, dirty: true });
    return obj;
  };

  const renumber = () => {
    const objs = Annot.canvas.getObjects();
    Annot.stepNumbers(objs.map((o) => o.annotTool)).forEach((n, i) => {
      if (n === null) return;
      objs[i].item(1).set({ text: String(n) });
      objs[i].set({ dirty: true });
    });
    Annot.canvas.requestRenderAll();
  };
  Annot.canvas.on('object:added', renumber);
  Annot.canvas.on('object:removed', renumber);

  Annot.registerTool({
    id: 'step',
    label: 'Step',
    key: 'n',
    create: (point, style) =>
      applyStyle(
        new Step(
          [
            new fabric.Circle({ radius: 20 }),
            new fabric.FabricText('1', { fill: '#fff', fontWeight: 'bold', fontSize: 22, fontFamily: 'sans-serif' }),
          ],
          { left: point.x, top: point.y },
        ),
        style,
      ),
    applyStyle,
  });
})(globalThis.Annot ??= {});
