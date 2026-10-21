// Rect spanning two corner points, as center-origin Fabric props. Corner order does not matter.
(function (exports) {
  exports.rectBetween = (a, b) => ({
    left: (a.x + b.x) / 2,
    top: (a.y + b.y) / 2,
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  });
})(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}));
