// Arrow: 2-point polyline, dragged from foot to tip, with a filled head at the tip. Size = stroke width.
(function (Annot) {
  class Arrow extends fabric.Polyline {
    static type = 'Arrow';

    constructor(points, options) {
      super(points, { fill: '', strokeLineCap: 'round', objectCaching: false, ...options });
      this.controls = fabric.controlsUtils.createPolyControls(this);
    }

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

  Annot.registerTool({
    id: 'arrow',
    label: 'Arrow',
    key: 'a',
    create: (p, style) => applyStyle(new Arrow([{ x: p.x, y: p.y }, { x: p.x, y: p.y }]), style),
    drag: (obj, foot, tip) => {
      obj.set({ points: [{ x: foot.x, y: foot.y }, { x: tip.x, y: tip.y }] });
      obj.setBoundingBox(true); // recenter the object on the new points
    },
    applyStyle,
  });
})(globalThis.Annot ??= {});
