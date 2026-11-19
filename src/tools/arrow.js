// Line and Arrow: 2-point polylines, dragged from foot to tip. Arrow adds a filled head at the tip. Size = stroke width.
(function (Annot) {
  class Line extends fabric.Polyline {
    static type = 'Line';

    constructor(points, options) {
      // perPixelTargetFind: hit only on the drawn pixels, not the empty bounding box.
      super(points, { fill: '', strokeLineCap: 'round', objectCaching: false, perPixelTargetFind: true, ...options });
      this.controls = fabric.controlsUtils.createPolyControls(this);
    }
  }
  fabric.classRegistry.setClass(Line);

  class Arrow extends Line {
    static type = 'Arrow';

    _render(ctx) {
      super._render(ctx);
      const [a, b] = this.points.map((p) => ({ x: p.x - this.pathOffset.x, y: p.y - this.pathOffset.y }));
      const len = 4 * this.strokeWidth + 8;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.fillStyle = this.stroke;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - len * Math.cos(ang - Math.PI / 6), b.y - len * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(b.x - len * Math.cos(ang + Math.PI / 6), b.y - len * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  fabric.classRegistry.setClass(Arrow);

  const applyStyle = (obj, { color, size }) => obj.set({ stroke: color, strokeWidth: size });
  const drag = (obj, foot, tip) => {
    obj.set({ points: [{ x: foot.x, y: foot.y }, { x: tip.x, y: tip.y }] });
    obj.setBoundingBox(true); // recenter the object on the new points
  };
  const register = (Cls, id, label, key) =>
    Annot.registerTool({ id, label, key, create: (p, style) => applyStyle(new Cls([{ x: p.x, y: p.y }, { x: p.x, y: p.y }]), style), drag, snap: Annot.snapAngle, applyStyle });

  register(Arrow, 'arrow', 'Arrow', 'a');
  register(Line, 'line', 'Line', 'l');
})(globalThis.Annot ??= {});
