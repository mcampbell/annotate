// Canvas, tool registry, click-to-drop, Delete key, image loading.
(function (Annot) {
  fabric.FabricObject.customProperties = ['annotTool'];
  const canvas = new fabric.Canvas('canvas', { width: 0, height: 0, preserveObjectStacking: true });
  const toolbar = document.getElementById('tools');
  const statusEl = document.getElementById('status');
  const stage = document.getElementById('stage');
  const tools = {};
  let activeTool = null;

  const status = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', isError);
  };

  const selectTool = (id) => {
    activeTool = tools[id] ?? null;
    canvas.selection = !activeTool;
    canvas.defaultCursor = activeTool ? 'crosshair' : 'default';
    toolbar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === id));
  };

  const addButton = (id, label) => {
    const button = Object.assign(document.createElement('button'), { textContent: label });
    button.dataset.tool = id;
    button.addEventListener('click', () => selectTool(id));
    toolbar.append(button);
  };

  const registerTool = (tool) => {
    tools[tool.id] = tool;
    addButton(tool.id, tool.label);
  };

  async function loadImage(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = await fabric.FabricImage.fromURL(url);
      img.set({ originX: 'left', originY: 'top', left: 0, top: 0 });
      canvas.clear();
      canvas.backgroundImage = img;
      const zoom = Annot.fitZoom(img.width, img.height, stage.clientWidth - 32, stage.clientHeight - 32);
      canvas.setDimensions({ width: Math.round(img.width * zoom), height: Math.round(img.height * zoom) });
      canvas.setZoom(zoom);
      canvas.requestRenderAll();
      document.body.classList.add('loaded');
      status('');
      canvas.fire('annot:loaded');
    } catch (err) {
      status(`Could not load image: ${err.message ?? err}`, true);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  canvas.on('mouse:down', ({ target, scenePoint }) => {
    if (target || !activeTool || !canvas.backgroundImage) return;
    const obj = activeTool.create(scenePoint, Annot.style());
    obj.annotTool = activeTool.id;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    activeTool.afterDrop?.(obj);
    canvas.requestRenderAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('textarea') || !['Delete', 'Backspace'].includes(e.key)) return;
    const objects = canvas.getActiveObjects();
    if (!objects.length) return;
    e.preventDefault();
    canvas.discardActiveObject();
    canvas.remove(...objects);
  });

  addButton('select', 'Select');
  selectTool('select');
  Object.assign(Annot, { canvas, tools, registerTool, loadImage, status });
})(globalThis.Annot ??= {});
