// Color/size panel. Applies to new objects and to the current selection.
(function (Annot) {
  const color = document.getElementById('color');
  const size = document.getElementById('size');

  Annot.style = () => ({ color: color.value, size: Number(size.value) });

  // Live preview on input. Commit on change, so one slider drag is one undo step.
  const applyToSelection = (e) => {
    const { canvas, tools } = Annot;
    canvas.getActiveObjects().forEach((obj) => {
      // A color change keeps each object's size: the slider does not show a mixed selection's sizes.
      const style = e.target === color ? { ...Annot.style(), size: obj.annotSize ?? Annot.style().size } : Annot.style();
      tools[obj.annotTool]?.applyStyle(obj, style);
      obj.annotSize = style.size;
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };
  // Show the selection's size. Set the value only: an input event would restyle it.
  const showSize = () => {
    const found = new Set(Annot.canvas.getActiveObjects().map((obj) => obj.annotSize));
    if (found.size === 1 && !found.has(undefined)) size.value = [...found][0];
  };
  Annot.canvas.on({ 'selection:created': showSize, 'selection:updated': showSize });

  // Each drawing tool keeps its own size until reload. Editing a selection changes only the objects.
  const sizes = {};
  const showToolSize = () => {
    const id = Annot.activeTool();
    if (id) size.value = sizes[id] ?? size.defaultValue;
  };
  size.addEventListener('input', () => {
    const id = Annot.activeTool();
    if (id && !Annot.canvas.getActiveObjects().length) sizes[id] = size.value;
  });
  Annot.canvas.on('annot:tool', () => {
    if (!Annot.canvas.getActiveObjects().length) showToolSize();
  });
  Annot.canvas.on('selection:cleared', showToolSize);

  const commit = () => Annot.canvas.getActiveObjects().forEach((target) => Annot.canvas.fire('object:modified', { target }));
  [color, size].forEach((input) => {
    input.addEventListener('input', applyToSelection);
    input.addEventListener('change', commit);
  });

  // Wheel steps the slider as if dragged: selection wins, else the active tool, else nothing.
  const STEP_PX = 100;
  const IDLE_MS = 300;
  let acc = 0;
  let idle;
  // One spin is one undo step: commit once the wheel stops.
  const commitWheel = () => {
    clearTimeout(idle);
    idle = undefined;
    acc = 0;
    size.dispatchEvent(new Event('change'));
  };
  const resetLater = () => {
    clearTimeout(idle);
    idle = setTimeout(commitWheel, IDLE_MS);
  };
  // A press can change the selection: commit a pending spin first, while its objects are still selected.
  Annot.canvas.on('mouse:down:before', () => {
    if (idle) commitWheel();
  });
  document.getElementById('stage').addEventListener('wheel', (e) => {
    if (e.ctrlKey || (!Annot.canvas.getActiveObjects().length && !Annot.activeTool())) return;
    e.preventDefault();
    // A mouse notch reports wheelDeltaY in multiples of 120: one step per event. A trackpad adds up.
    acc += e.deltaY;
    const notch = e.wheelDeltaY && e.wheelDeltaY % 120 === 0;
    const steps = notch ? 1 : Math.trunc(Math.abs(acc) / STEP_PX);
    if (!steps) return resetLater();
    const up = (notch ? e.deltaY : acc) < 0;
    acc = notch ? 0 : acc % STEP_PX;
    size[up ? 'stepUp' : 'stepDown'](steps);
    size.dispatchEvent(new Event('input'));
    resetLater();
  }, { passive: false });
})(globalThis.Annot ??= {});
