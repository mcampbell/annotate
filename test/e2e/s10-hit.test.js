const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, toScreen, clickScene, dragScene, useTool, exportedPixel } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const count = () => page.evaluate(() => Annot.canvas.getObjects().length);
const active = () => page.evaluate(() => Annot.canvas.getActiveObject()?.annotTool ?? null);

// Box outline runs along x = 100..400, y = 100..300 (scene px). Interior point: (250, 200).
const drawBox = async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragScene(page, 100, 100, 400, 300);
};

test('an Arrow drag inside a box draws an arrow', async () => {
  await drawBox();
  await useTool(page, 'arrow');
  await dragScene(page, 180, 260, 320, 140);
  assert.equal(await count(), 2);
});

test('a Box drag inside the selected box draws a second box', async () => {
  await drawBox();
  assert.equal(await active(), 'box');
  await dragScene(page, 180, 160, 320, 240);
  assert.equal(await count(), 2);
});

test('Select: a click inside a box selects nothing', async () => {
  await drawBox();
  await useTool(page, 'select');
  await clickScene(page, 250, 200);
  assert.equal(await active(), null);
});

test('Select: a click on the box outline selects the box', async () => {
  await drawBox();
  await useTool(page, 'select');
  await clickScene(page, 250, 200);
  await clickScene(page, 100, 200);
  assert.equal(await active(), 'box');
});

// Undo rebuilds objects from JSON, which drops flags that are not constructor defaults.
test('a box restored by undo still lets interior clicks through', async () => {
  await drawBox();
  await useTool(page, 'step');
  await clickScene(page, 600, 600);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy() && Annot.canvas.getObjects().length === 1);
  await useTool(page, 'select');
  await clickScene(page, 250, 200);
  assert.equal(await active(), null);
});

test('a click 3 screen px inside a size 1 outline selects the box', async () => {
  await pasteImage(page);
  await page.fill('#size', '1');
  await useTool(page, 'box');
  await dragScene(page, 100, 100, 400, 300);
  await useTool(page, 'select');
  await clickScene(page, 250, 200);
  const [x, y] = await toScreen(page, 100, 200);
  await page.mouse.click(x + 3, y);
  assert.equal(await active(), 'box');
});

// Arrow from (100, 500) to (400, 200): the line is x + y = 600. (380, 480) is empty bounding-box space.
const drawArrow = async () => {
  await pasteImage(page);
  await useTool(page, 'arrow');
  await dragScene(page, 100, 500, 400, 200);
  await useTool(page, 'select');
};

test('Select: a click in the empty corner of an arrow bounding box selects nothing', async () => {
  await drawArrow();
  await clickScene(page, 380, 480);
  assert.equal(await active(), null);
});

test('Select: a click on the arrow line selects the arrow', async () => {
  await drawArrow();
  await clickScene(page, 380, 480);
  await clickScene(page, 250, 350);
  assert.equal(await active(), 'arrow');
});

// Size 10 box dragged over x = 1000..1100, scaled 2x about its center: the left edge moves to about x = 948.5.
// A uniform stroke stays 10 px (943.5..953.5). A scaled stroke would be 20 px (938.5..958.5) and cover x = 955.
test('a scaled box keeps its stroke width', async () => {
  await pasteImage(page);
  await page.fill('#size', '10');
  await useTool(page, 'box');
  await dragScene(page, 1000, 600, 1100, 700);
  await page.evaluate(() => Annot.canvas.getActiveObject().set({ scaleX: 2, scaleY: 2 }));
  const [r, g, b] = await exportedPixel(page, 955, 650);
  assert.notDeepEqual([r, g, b], [0xe5, 0x39, 0x35]);
  assert.deepEqual((await exportedPixel(page, 950, 650)).slice(0, 3), [0xe5, 0x39, 0x35]);
});


test('a click 10 screen px inside a size 1 outline selects nothing', async () => {
  await pasteImage(page);
  await page.fill('#size', '1');
  await useTool(page, 'box');
  await dragScene(page, 100, 100, 400, 300);
  await useTool(page, 'select');
  await clickScene(page, 250, 200);
  const [x, y] = await toScreen(page, 100, 200);
  await page.mouse.click(x + 10, y);
  assert.equal(await active(), null);
});

// Owner choice: a blur's interior is its content, so a click there still selects it.
// A blur draws image pixels, so it would hit there even with per-pixel hit.
test('Select: a click inside a blur selects the blur', async () => {
  await pasteImage(page);
  await useTool(page, 'blur');
  await dragScene(page, 100, 100, 400, 300);
  await useTool(page, 'select');
  await clickScene(page, 600, 600);
  await clickScene(page, 250, 200);
  assert.equal(await active(), 'blur');
});
