// Rect spanning two corner points, as center-origin Fabric props. Corner order does not matter.
// Shift snaps for drag tools: each takes the drag start and end and returns a new end.
(function (exports) {
  exports.rectBetween = (a, b) => ({
    left: (a.x + b.x) / 2,
    top: (a.y + b.y) / 2,
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  });

  // End of a square from a, side = the larger of |dx| and |dy|. A zero side counts as positive.
  const snapSquare = (a, b) => {
    const side = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return { x: a.x + (b.x < a.x ? -side : side), y: a.y + (b.y < a.y ? -side : side) };
  };

  // End at 0, 45, or 90 degrees from a. tan(22.5 deg) splits the sectors.
  const TAN_HALF_45 = Math.tan(Math.PI / 8);
  const snapAngle = (a, b) => {
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    if (dy <= dx * TAN_HALF_45) return { x: b.x, y: a.y };
    if (dx <= dy * TAN_HALF_45) return { x: a.x, y: b.y };
    return snapSquare(a, b);
  };

  Object.assign(exports, { snapSquare, snapAngle });
})(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}));
