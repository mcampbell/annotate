// Crop: one frame, dragged corner to corner. Copy keeps the area inside it (see export.js). Shift keeps it square.
(function (Annot) {
  const { canvas } = Annot;
  const DASH = 6; // screen px

  // perPixelTargetFind: only the outline hits, so a press inside the frame goes to the active tool.
  // No rotation: export takes an axis-aligned area. No cache: the dim draws outside the bounding box.
  class Crop extends fabric.Rect {
    static type = 'Crop';

    constructor(options) {
      super({ fill: 'transparent', strokeWidth: 0, objectCaching: false, perPixelTargetFind: true, lockRotation: true, lockScalingFlip: true, ...options });
      this.setControlsVisibility({ mtr: false });
    }

    // Dim the image outside the frame, then draw a black and white dashed outline 1 screen px wide.
    _render(ctx) {
      const img = this.canvas?.backgroundImage;
      if (!img) return;
      const w = this.width * this.scaleX;
      const h = this.height * this.scaleY;
      const { x, y } = this.getPointByOrigin('left', 'top');
      const px = 1 / this.canvas.getZoom(); // 1 screen px in scene px
      ctx.save();
      ctx.scale(1 / this.scaleX, 1 / this.scaleY);
      ctx.beginPath();
      ctx.rect(-w / 2 - x, -h / 2 - y, img.width, img.height);
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill('evenodd');
      ctx.lineWidth = px;
      ctx.setLineDash([DASH * px, DASH * px]);
      ['#fff', '#000'].forEach((color, i) => {
        ctx.lineDashOffset = i * DASH * px;
        ctx.strokeStyle = color;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
      });
      ctx.restore();
    }
  }
  fabric.classRegistry.setClass(Crop);

  // One frame at a time: a committed frame removes the others. Same task as the commit, so one undo step.
  canvas.on('object:modified', ({ target }) => {
    if (!(target instanceof Crop)) return;
    const old = canvas.getObjects().filter((o) => o instanceof Crop && o !== target);
    if (old.length) canvas.remove(...old);
  });

  Annot.registerTool({
    id: 'crop',
    label: 'Crop',
    key: 'x',
    create: () => new Crop(),
    drag: (obj, start, end) => obj.set(Annot.rectBetween(start, end)),
    snap: Annot.snapSquare,
    applyStyle: (obj) => obj, // color and size do not apply to a crop frame
  });
})(globalThis.Annot ??= {});
