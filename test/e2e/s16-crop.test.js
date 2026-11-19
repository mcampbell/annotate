const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, dragScene, dragRect, useTool, exportedPixel, near } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => {
  ({ browser, page, errors } = await open());
  await pasteImage(page); // 2400 x 1600 checkerboard of 10 px squares
});
test.afterEach(() => teardown(browser, errors));

const exportSize = () => page.evaluate(() => (({ width, height }) => ({ width, height }))(Annot.toCanvas()));
const crops = () => page.evaluate(() => Annot.canvas.getObjects().filter((o) => o.annotTool === 'crop').length);
const moveFrame = (left) =>
  page.evaluate((left) => Annot.canvas.getObjects()[0].set({ left }).setCoords(), left);
const crop = async (x1, y1, x2, y2) => {
  await useTool(page, 'crop');
  await dragScene(page, x1, y1, x2, y2);
};

test('Copy keeps the area inside the crop frame', async () => {
  await crop(100, 100, 400, 300);
  const { width, height } = await exportSize();
  near(width, 300, 'width');
  near(height, 200, 'height');
});

test('Shift keeps the crop frame square', async () => {
  await page.keyboard.down('Shift');
  await crop(100, 100, 400, 250);
  await page.keyboard.up('Shift');
  const { width, height } = await exportSize();
  near(width, 300, 'width');
  near(height, 300, 'height');
});

// Each probe must equal the source image pixel at the frame offset. The checkerboard repeats every 20 px,
// so the crop starts at (110, 130): an export that ignored the offset would differ.
test('export shows the image under the frame, with no outline and no dim', async () => {
  await crop(110, 130, 400, 300);
  const probes = [[0, 0], [3, 0], [7, 0], [13, 0], [0, 3], [0, 7], [0, 13], [55, 33], [150, 100]];
  const r = await page.evaluate((probes) => {
    const c = Annot.canvas;
    const frame = c.getObjects()[0];
    const { left, top } = Annot.cropBounds(frame.getBoundingRect(), 2400, 1600);
    const img = c.backgroundImage.getElement();
    const src = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height }).getContext('2d');
    src.drawImage(img, 0, 0);
    const out = Annot.toCanvas().getContext('2d');
    const px = (ctx, x, y) => [...ctx.getImageData(x, y, 1, 1).data];
    return {
      visible: frame.visible,
      diffs: probes.filter(([x, y]) => px(out, x, y).join() !== px(src, left + x, top + y).join()),
    };
  }, probes);
  assert.deepEqual(r, { visible: true, diffs: [] });
});

test('a new crop frame replaces the old one', async () => {
  await crop(100, 100, 400, 300);
  await crop(500, 500, 600, 700);
  assert.equal(await crops(), 1);
  const { width, height } = await exportSize();
  near(width, 100, 'width');
  near(height, 200, 'height');
});

test('undo removes the crop frame and Copy gives the whole image', async () => {
  await crop(100, 100, 400, 300);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal(await crops(), 0);
  assert.deepEqual(await exportSize(), { width: 2400, height: 1600 });
});

test('undo after a second crop brings back the first frame', async () => {
  await crop(100, 100, 400, 300);
  await crop(500, 500, 600, 700);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal(await crops(), 1);
  near((await exportSize()).width, 300, 'width');
});

test('a press inside the frame goes to the active tool', async () => {
  await crop(100, 100, 700, 600);
  await useTool(page, 'box');
  await dragRect(page, 400, 350);
  const tools = await page.evaluate(() => Annot.canvas.getObjects().map((o) => o.annotTool));
  assert.deepEqual(tools, ['crop', 'box']);
});

test('a frame that runs off the image is clamped', async () => {
  await crop(100, 100, 400, 300);
  await moveFrame(50); // center x 50, width ~300: left edge ~-100
  near((await exportSize()).width, 200, 'clamped width');
});

test('Copy with the frame off the image shows an error', async () => {
  await crop(100, 100, 400, 300);
  await moveFrame(-1000);
  await page.click('#copy');
  await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Copy failed'));
  const r = await page.$eval('#status', (e) => [e.textContent, e.classList.contains('error')]);
  assert.deepEqual(r, ['Copy failed: the crop frame is off the image', true]);
});

test('crop frame: type Crop, outline hit, no rotation, round trip', async () => {
  await crop(100, 100, 400, 300);
  const r = await page.evaluate(async () => {
    const o = Annot.canvas.getObjects()[0];
    const [copy] = await fabric.util.enlivenObjects([o.toObject()]);
    const pick = (x) => ({ type: x.constructor.type, annotTool: x.annotTool, hit: x.perPixelTargetFind, lockRotation: x.lockRotation, mtr: x.isControlVisible('mtr') });
    return [pick(o), pick(copy)];
  });
  const want = { type: 'Crop', annotTool: 'crop', hit: true, lockRotation: true, mtr: false };
  assert.deepEqual(r, [want, want]);
});

test('color and size leave a selected crop frame as it is', async () => {
  await crop(100, 100, 400, 300);
  const before = await exportSize();
  await page.fill('#color', '#00ff00');
  await page.fill('#size', '9');
  const r = await page.evaluate(() => (({ fill, strokeWidth, annotTool }) => ({ fill, strokeWidth, annotTool }))(Annot.canvas.getActiveObject()));
  assert.deepEqual(r, { fill: 'transparent', strokeWidth: 0, annotTool: 'crop' });
  assert.deepEqual(await exportSize(), before);
});

// On screen, the frame dims only the outside. Both probes sit in the middle of a white square.
test('on screen, the frame dims the outside and not the inside', async () => {
  await crop(100, 100, 400, 300);
  await page.evaluate(() => {
    Annot.canvas.discardActiveObject();
    Annot.canvas.renderAll();
  });
  const screenGray = (x, y) =>
    page.evaluate(([x, y]) => {
      const c = Annot.canvas;
      const s = c.getZoom() * c.getRetinaScaling();
      return c.lowerCanvasEl.getContext('2d').getImageData(Math.round(x * s), Math.round(y * s), 1, 1).data[0];
    }, [x, y]);
  const inside = await screenGray(205, 205);
  const outside = await screenGray(605, 205);
  assert.ok(inside > 200, `inside not dimmed: ${inside}`);
  assert.ok(outside > 90 && outside < 170, `outside dimmed to about half: ${outside}`);
});
