const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, toScreen, clickScene, dragScene, useTool, objects } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

// Drags map through screen pixels at zoom < 1, so allow a few scene px of error.
const near = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) <= 4, `${label}: ${actual} not near ${expected}`);
const geometry = () =>
  page.evaluate(() => Annot.canvas.getObjects().map((o) => ({ left: o.left, top: o.top, w: o.width * o.scaleX, h: o.height * o.scaleY })));
const assertRect = async ({ left, top, w, h }) => {
  const [g] = await geometry();
  near(g.left, left, 'left'); near(g.top, top, 'top'); near(g.w, w, 'width'); near(g.h, h, 'height');
};

for (const tool of ['box', 'blur', 'pixelate']) {
  test(`${tool} spans the drag corners`, async () => {
    await pasteImage(page);
    await useTool(page, tool);
    await dragScene(page, 100, 100, 400, 300);
    await assertRect({ left: 250, top: 200, w: 300, h: 200 });
  });
}

test('reverse drag gives the same rect', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragScene(page, 400, 300, 100, 100);
  await assertRect({ left: 250, top: 200, w: 300, h: 200 });
});

test('arrow foot is the drag start, tip is the drag end', async () => {
  await pasteImage(page);
  await useTool(page, 'arrow');
  await dragScene(page, 100, 500, 400, 200);
  const [foot, tip] = await page.evaluate(() => {
    const o = Annot.canvas.getObjects()[0];
    const m = o.calcTransformMatrix();
    return o.points.map((p) => fabric.util.transformPoint(new fabric.Point(p.x - o.pathOffset.x, p.y - o.pathOffset.y), m));
  });
  near(foot.x, 100, 'foot x'); near(foot.y, 500, 'foot y');
  near(tip.x, 400, 'tip x'); near(tip.y, 200, 'tip y');
});

test('object shows while dragging', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await page.mouse.move(...(await toScreen(page, 100, 100)));
  await page.mouse.down();
  await page.mouse.move(...(await toScreen(page, 300, 300)), { steps: 3 });
  assert.equal((await objects(page)).length, 1);
  await page.mouse.up();
});

test('plain click with a drag tool makes nothing and no undo step', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragScene(page, 100, 100, 400, 300);
  await clickScene(page, 1200, 800);
  assert.equal((await objects(page)).length, 1);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal((await objects(page)).length, 0, 'one undo removes the dragged box');
});

test('a drag is one undo step', async () => {
  await pasteImage(page);
  await useTool(page, 'arrow');
  await dragScene(page, 100, 500, 400, 200);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal((await objects(page)).length, 0);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await page.waitForFunction(() => Annot.canvas.getObjects().length === 1);
});

test('dragged object ends selected', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragScene(page, 100, 100, 400, 300);
  assert.equal(await page.evaluate(() => Annot.canvas.getActiveObject()?.annotTool), 'box');
});
