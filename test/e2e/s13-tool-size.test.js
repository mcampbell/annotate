const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, dragRect, useTool, objects } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => {
  ({ browser, page, errors } = await open());
  await pasteImage(page, 800, 600);
});
test.afterEach(() => teardown(browser, errors));

const slider = () => page.$eval('#size', (el) => el.value);
const setSize = async (tool, value) => {
  await useTool(page, tool);
  await page.fill('#size', String(value));
};

test('each tool keeps its own size', async () => {
  await setSize('box', 7);
  await setSize('text', 2);
  await useTool(page, 'box');
  assert.equal(await slider(), '7');
  await useTool(page, 'text');
  assert.equal(await slider(), '2');
});

test('a new object uses its tool size', async () => {
  await setSize('box', 7);
  await setSize('text', 2);
  await useTool(page, 'box');
  await dragRect(page, 400, 300);
  assert.equal((await objects(page))[0].strokeWidth, 7);
});

test('deselect restores the tool size after an object edit', async () => {
  await setSize('box', 4);
  await dragRect(page, 400, 300);
  await page.evaluate(() => Annot.canvas.discardActiveObject());
  await setSize('box', 7);
  await useTool(page, 'select');
  await clickScene(page, 320, 300);
  await page.fill('#size', '5');
  assert.equal((await objects(page))[0].strokeWidth, 5);
  await page.keyboard.press('b');
  assert.equal(await slider(), '5'); // a tool key keeps the object's size
  await page.evaluate(() => Annot.canvas.discardActiveObject());
  assert.equal(await slider(), '7');
});
