// Zoom that fits an image inside a viewport. Never upscales.
(function (exports) {
  exports.fitZoom = (w, h, maxW, maxH) => Math.min(1, maxW / w, maxH / h);
})(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}));
