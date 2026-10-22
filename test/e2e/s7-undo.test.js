const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, dragRect, useTool, objects } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const undo = () => page.keyboard.press('ControlOrMeta+z');
const redo = () => page.keyboard.press('ControlOrMeta+Shift+z');
const count = async () => (await objects(page)).length;
const settle = () => page.waitForFunction(() => !Annot.undoBusy());

async function twoBoxes() {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragRect(page, 400, 400);
  await dragRect(page, 1200, 400);
}

test('undo and redo object adds', async () => {
  await twoBoxes();
  await undo(); await settle();
  assert.equal(await count(), 1);
  await undo(); await settle();
  assert.equal(await count(), 0);
  await redo(); await settle();
  assert.equal(await count(), 1);
});

test('undo restores a deleted object with its style', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await useTool(page, 'box');
  await dragRect(page, 600, 400);
  await page.keyboard.press('Delete');
  await undo(); await settle();
  assert.deepEqual((await objects(page)).map((o) => o.stroke), ['#00ff00']);
});

test('undo reverts a style change', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await useTool(page, 'box');
  await dragRect(page, 600, 400);
  await page.fill('#color', '#0000ff');
  await undo(); await settle();
  assert.equal((await objects(page))[0].stroke, '#00ff00');
});

test('loading a new image clears history', async () => {
  await twoBoxes();
  await pasteImage(page, 800, 600);
  await undo(); await settle();
  assert.equal(await count(), 0);
});

test('undo/redo restores custom objects with their behavior', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await clickScene(page, 400, 400);
  await clickScene(page, 800, 400);
  await useTool(page, 'pixelate');
  await dragRect(page, 1600, 800, 200, 120);
  await page.keyboard.press('Delete');
  await undo(); await settle();
  const restored = await page.evaluate(() =>
    Annot.canvas.getObjects().map((o) => ({
      type: o.constructor.type,
      text: o.annotTool === 'step' ? o.item(1).text : undefined,
      sideControl: o.isControlVisible('mt'),
      objectCaching: o.objectCaching,
    })));
  assert.deepEqual(restored.map((o) => [o.type, o.text]), [['Step', '1'], ['Step', '2'], ['Blur', undefined]]);
  assert.equal(restored[0].sideControl, false);
  assert.equal(restored[2].objectCaching, false);
});

test('multi-object delete is one undo step', async () => {
  await twoBoxes();
  await page.evaluate(() => {
    const { canvas } = Annot;
    canvas.setActiveObject(new fabric.ActiveSelection(canvas.getObjects(), { canvas }));
  });
  await page.keyboard.press('Delete');
  await undo(); await settle();
  assert.equal(await count(), 2);
});

test('a slider drag is one undo step', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragRect(page, 600, 400);
  await page.evaluate(() => {
    const size = document.getElementById('size');
    for (const v of ['4', '5', '6', '7']) {
      size.value = v;
      size.dispatchEvent(new Event('input'));
    }
    size.dispatchEvent(new Event('change'));
  });
  assert.equal((await objects(page))[0].strokeWidth, 7);
  await undo(); await settle();
  assert.equal((await objects(page))[0].strokeWidth, 3);
});

test('Ctrl+Z while editing text does not restore', async () => {
  await pasteImage(page);
  await useTool(page, 'text');
  await clickScene(page, 600, 400);
  await page.keyboard.type('Hi');
  await page.click('#tools [data-tool="box"]'); // focus leaves the textarea, text still editing
  await undo(); await page.keyboard.press('Backspace');
  assert.equal(await count(), 1);
});

// Windows habit: Ctrl+Y redoes, as Ctrl+Shift+Z does.
test('Ctrl+Y redoes', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await dragRect(page, 600, 400);
  await undo();
  await page.waitForFunction(() => !Annot.undoBusy());
  await page.keyboard.press('ControlOrMeta+y');
  await page.waitForFunction(() => !Annot.undoBusy());
  assert.equal((await objects(page)).length, 1);
});
