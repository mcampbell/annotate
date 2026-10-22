// Canvas, tool registry, click-to-place and drag-to-draw, Delete key, image loading.
(function (Annot) {
  // Base class: toObject always merges this list, even for subclasses with their own customProperties.
  fabric.BaseFabricObject.customProperties = ['annotTool'];
  // targetFindTolerance (screen px): a size 1 outline is under 1 screen px wide when zoomed out.
  const canvas = new fabric.Canvas('canvas', { width: 0, height: 0, preserveObjectStacking: true, targetFindTolerance: 4 });
  const toolbar = document.getElementById('tools');
  const statusEl = document.getElementById('status');
  const stage = document.getElementById('stage');
  const tools = {};
  const keys = {}; // key -> tool id
  let activeTool = null;
  let loadSeq = 0;
  let drawing = null; // { tool, obj, start } while a drag tool draws
  const MIN_DRAG_PX = 5; // shorter drags are clicks: they make nothing

  const status = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', isError);
  };

  // True while the user types into text: key shortcuts must leave it alone.
  const isTyping = (e) => e.target.matches?.('textarea') || canvas.getActiveObject()?.isEditing;

  const selectTool = (id) => {
    activeTool = tools[id] ?? null;
    canvas.selection = !activeTool;
    canvas.defaultCursor = activeTool ? 'crosshair' : 'default';
    toolbar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === id));
    canvas.fire('annot:tool', { id });
  };

  const addButton = (id, label, key) => {
    if (keys[key]) throw new Error(`Tool ${id}: key "${key}" is taken by ${keys[key]}`);
    keys[key] = id;
    const button = Object.assign(document.createElement('button'), { textContent: label, title: `${label} (${key.toUpperCase()})` });
    button.setAttribute('aria-keyshortcuts', key.toUpperCase());
    button.dataset.tool = id;
    button.addEventListener('click', () => selectTool(id));
    toolbar.append(button);
  };

  const registerTool = (tool) => {
    tools[tool.id] = tool;
    addButton(tool.id, tool.label, tool.key);
  };

  async function loadImage(blob) {
    const seq = ++loadSeq;
    const url = URL.createObjectURL(blob);
    try {
      const img = await fabric.FabricImage.fromURL(url);
      if (seq !== loadSeq) return; // a newer load started while this one decoded
      img.set({ originX: 'left', originY: 'top', left: 0, top: 0 });
      canvas.clear();
      canvas.backgroundImage = img;
      // 32 = 2 x #stage padding in app.css.
      const zoom = Annot.fitZoom(img.width, img.height, stage.clientWidth - 32, stage.clientHeight - 32);
      canvas.setDimensions({ width: Math.round(img.width * zoom), height: Math.round(img.height * zoom) });
      canvas.setZoom(zoom);
      canvas.requestRenderAll();
      document.body.classList.add('loaded');
      status('');
      canvas.fire('annot:loaded');
    } catch (err) {
      if (seq !== loadSeq) return;
      status(`Could not load image: ${err.message ?? err}`, true);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const cancelDrawing = () => {
    if (!drawing) return;
    canvas.remove(drawing.obj);
    drawing = null;
  };

  // Left button only. Touch events have no button, so `> 0` keeps taps working.
  canvas.on('mouse:down', ({ e, target, scenePoint }) => {
    cancelDrawing(); // a lost mouse-up must not leave a stale preview
    if (e.button > 0 || target || !activeTool || !canvas.backgroundImage) return;
    const tool = activeTool;
    const obj = tool.create(scenePoint, Annot.style());
    obj.annotTool = tool.id;
    if (tool.drag) {
      obj.excludeFromExport = true; // keeps it out of undo snapshots until the drag commits
      tool.drag(obj, scenePoint, scenePoint);
      drawing = { tool, obj, start: scenePoint };
      canvas.add(obj);
      return;
    }
    canvas.add(obj);
    canvas.setActiveObject(obj);
    tool.afterDrop?.(obj);
    canvas.requestRenderAll();
  });

  canvas.on('mouse:move', ({ scenePoint }) => {
    if (!drawing) return;
    drawing.tool.drag(drawing.obj, drawing.start, scenePoint);
    drawing.obj.setCoords();
    canvas.requestRenderAll();
  });

  canvas.on('mouse:up', ({ scenePoint }) => {
    if (!drawing) return;
    const { tool, obj, start } = drawing;
    tool.drag(obj, start, scenePoint); // the release point is the end, even with no move after the last one
    if (Math.hypot(scenePoint.x - start.x, scenePoint.y - start.y) * canvas.getZoom() < MIN_DRAG_PX) return cancelDrawing();
    drawing = null;
    if (!canvas.contains(obj)) return; // undo or a new image removed it mid-drag
    obj.excludeFromExport = false;
    canvas.setActiveObject(obj);
    canvas.fire('object:modified', { target: obj });
    canvas.requestRenderAll();
  });

  document.addEventListener('keydown', (e) => {
    if (isTyping(e) || !['Delete', 'Backspace'].includes(e.key)) return;
    const objects = canvas.getActiveObjects();
    if (!objects.length) return;
    e.preventDefault();
    canvas.discardActiveObject();
    canvas.remove(...objects);
  });

  // Tool keys. Mid-drag, only Escape acts: it cancels the drag but keeps the tool,
  // because Select would turn on Fabric's box selection under the held mouse button.
  document.addEventListener('keydown', (e) => {
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (drawing) {
      if (e.key === 'Escape') cancelDrawing();
      return;
    }
    const id = e.key === 'Escape' ? 'select' : keys[e.key.toLowerCase()];
    if (id) selectTool(id);
  });

  // Fabric has no touchcancel path, so a cancelled touch would never fire mouse:up.
  canvas.upperCanvasEl.addEventListener('touchcancel', cancelDrawing);

  addButton('select', 'Select', 'v');
  selectTool('select');
  Object.assign(Annot, { activeTool: () => activeTool?.id ?? null, canvas, tools, registerTool, loadImage, status, isTyping });
})(globalThis.Annot ??= {});
