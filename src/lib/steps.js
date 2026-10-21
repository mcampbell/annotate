// Step numbers for canvas objects, by z-order. Non-step objects get null.
(function (exports) {
  exports.stepNumbers = (tools) => {
    let n = 0;
    return tools.map((tool) => (tool === 'step' ? ++n : null));
  };
})(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}));
