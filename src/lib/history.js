// Immutable undo/redo stacks of snapshots.
// shortcut: unbounded stack, cap it if long sessions use too much memory.
(function (exports) {
  const create = (present) => ({ past: [], present, future: [] });
  const record = (h, snap) => (snap === h.present ? h : { past: [...h.past, h.present], present: snap, future: [] });
  const undo = (h) =>
    h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future] } : h;
  const redo = (h) =>
    h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h;
  exports.history = { create, record, undo, redo };
})(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}));
