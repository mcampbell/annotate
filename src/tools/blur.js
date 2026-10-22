// Blur / Pixelate: rect that re-renders the background image region under it. Size = strength.
(function (Annot) {
  class Blur extends fabric.Rect {
    static type = 'Blur';
    static customProperties = ['mode', 'strength'];

    // Defaults here, not in create, so undo-restored objects keep them. No cache: must re-render live as it moves.
    constructor(options) {
      super({ objectCaching: false, lockRotation: true, lockScalingFlip: true, strokeWidth: 0, fill: 'transparent', ...options });
      this.setControlsVisibility({ mtr: false });
    }

    _render(ctx) {
      const src = this.canvas?.backgroundImage?.getElement();
      if (!src) return;
      const w = this.width * this.scaleX;
      const h = this.height * this.scaleY;
      const { x, y } = this.getPointByOrigin('left', 'top');
      ctx.save();
      ctx.scale(1 / this.scaleX, 1 / this.scaleY);
      if (this.mode === 'pixelate') {
        const block = this.strength * 4;
        const small = Object.assign(document.createElement('canvas'), {
          width: Math.max(1, Math.ceil(w / block)),
          height: Math.max(1, Math.ceil(h / block)),
        });
        small.getContext('2d').drawImage(src, x, y, w, h, 0, 0, small.width, small.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, -w / 2, -h / 2, w, h);
      } else {
        const r = this.strength * 2;
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.clip();
        ctx.filter = `blur(${r}px)`;
        ctx.drawImage(src, x - 2 * r, y - 2 * r, w + 4 * r, h + 4 * r, -w / 2 - 2 * r, -h / 2 - 2 * r, w + 4 * r, h + 4 * r);
      }
      ctx.restore();
    }
  }
  fabric.classRegistry.setClass(Blur);

  const applyStyle = (obj, { size }) => obj.set({ strength: size });
  const tool = (id, label, key, mode) =>
    Annot.registerTool({
      id,
      label,
      key,
      create: (point, style) => applyStyle(new Blur({ mode }), style),
      drag: (obj, start, end) => obj.set(Annot.rectBetween(start, end)),
      applyStyle,
    });
  tool('blur', 'Blur', 'u', 'blur');
  tool('pixelate', 'Pixelate', 'p', 'pixelate');
})(globalThis.Annot ??= {});
