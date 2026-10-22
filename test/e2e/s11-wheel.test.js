const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, toScreen, clickScene, useTool, dragRect, objects } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => {
  ({ browser, page, errors } = await open());
  await pasteImage(page);
});
test.afterEach(() => teardown(browser, errors));

const slider = () => page.$eval('#size', (s) => Number(s.value));
const wheel = async (dy, n = 1) => {
  await page.mouse.move(...(await toScreen(page, 1200, 800)));
  for (let i = 0; i < n; i++) await page.mouse.wheel(0, dy);
};
const selectFirst = async () => {
  await useTool(page, 'select');
  await page.evaluate(() => Annot.canvas.setActiveObject(Annot.canvas.getObjects()[0]));
};

test('Box tool: wheel up 100 -> 4, down 200 -> 2', async () => {
  await useTool(page, 'box');
  await wheel(-100);
  assert.equal(await slider(), 4);
  await wheel(100, 2);
  assert.equal(await slider(), 2);
});

test('clamps at 10 and 1', async () => {
  await useTool(page, 'box');
  await wheel(-120, 20);
  assert.equal(await slider(), 10);
  await wheel(120, 20);
  assert.equal(await slider(), 1);
});

test('Select tool, nothing selected: unchanged', async () => {
  await wheel(-120);
  assert.equal(await slider(), 3);
});

test('selected box is resized with the slider', async () => {
  await useTool(page, 'box');
  await dragRect(page, 1200, 800);
  await selectFirst();
  await wheel(-120);
  assert.equal(await slider(), 4);
  assert.equal((await objects(page))[0].strokeWidth, 4);
});

// page.mouse.wheel always reports wheelDeltaY 120 (even for deltaY -10), so send synthetic events.
const fire = (deltaY, wheelDeltaY, n = 1) =>
  page.evaluate(([deltaY, wheelDeltaY, n]) => {
    for (let i = 0; i < n; i++) {
      const e = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
      if (wheelDeltaY) Object.defineProperty(e, 'wheelDeltaY', { value: wheelDeltaY });
      document.getElementById('stage').dispatchEvent(e);
    }
  }, [deltaY, wheelDeltaY, n]);

// macOS can report a small deltaY for a notch: the step must not depend on the distance.
test('mouse: one notch is one step, even with a small deltaY', async () => {
  await useTool(page, 'box');
  await fire(-4, 120);
  assert.equal(await slider(), 4);
});

test('trackpad: 10 events of deltaY -10 are one step', async () => {
  await useTool(page, 'box');
  await fire(-10, 0, 10);
  assert.equal(await slider(), 4);
});

test('trackpad: the remainder carries to the next step', async () => {
  await useTool(page, 'box');
  await fire(-10, 0, 15);
  assert.equal(await slider(), 4);
  await fire(-10, 0, 5);
  assert.equal(await slider(), 5);
});

test('one spin is one undo step', async () => {
  await useTool(page, 'box');
  await dragRect(page, 1200, 800);
  await selectFirst();
  await wheel(-120, 3);
  await page.waitForTimeout(400);
  assert.equal((await objects(page))[0].strokeWidth, 6);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal((await objects(page))[0].strokeWidth, 3);
});

// Under Select, a click that clears the selection before the idle commit must not lose the spin's undo step.
test('a spin then an immediate deselect is still one undo step', async () => {
  await useTool(page, 'box');
  await dragRect(page, 1200, 800);
  await selectFirst();
  await wheel(-120, 2);
  await clickScene(page, 200, 200);
  await page.waitForTimeout(400);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.deepEqual((await objects(page)).map((o) => o.strokeWidth), [3]);
});

// The spin has not committed yet: undo must commit it first, then undo it, not the step before.
test('undo right after a spin undoes the spin', async () => {
  await useTool(page, 'box');
  await dragRect(page, 1200, 800);
  await selectFirst();
  await wheel(-120, 2);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.deepEqual((await objects(page)).map((o) => o.strokeWidth), [3]);
});

test('Ctrl + wheel leaves the slider', async () => {
  await useTool(page, 'box');
  await page.keyboard.down('Control');
  await wheel(-120);
  await page.keyboard.up('Control');
  assert.equal(await slider(), 3);
});

test('wheel over the toolbar leaves the slider', async () => {
  await useTool(page, 'box');
  await page.hover('#tools');
  await page.mouse.wheel(0, -120);
  assert.equal(await slider(), 3);
});
