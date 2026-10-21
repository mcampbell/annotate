const test = require('node:test');
const assert = require('node:assert/strict');
const { open, pasteImage, clickScene, useTool } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(async () => {
  assert.deepEqual(errors, []);
  await browser.close();
});

const texts = (page) =>
  page.evaluate(() => Annot.canvas.getObjects().map(({ annotTool, text, fill, fontSize, isEditing }) => ({ annotTool, text, fill, fontSize, isEditing })));

const dropText = async () => {
  await pasteImage(page);
  await useTool(page, 'text');
  await clickScene(page, 600, 400);
};

test('drop text enters editing; typing replaces text and uses panel style', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await page.fill('#size', '5');
  await useTool(page, 'text');
  await clickScene(page, 600, 400);
  assert.equal((await texts(page))[0].isEditing, true);
  await page.keyboard.type('Hello');
  await page.keyboard.press('Escape');
  assert.deepEqual(await texts(page), [{ annotTool: 'text', text: 'Hello', fill: '#00ff00', fontSize: 32, isEditing: false }]);
});

test('Backspace while editing does not delete the object', async () => {
  await dropText();
  await page.keyboard.type('Hi');
  await page.keyboard.press('Backspace');
  assert.equal((await texts(page)).length, 1);
});

test('color change while selected applies fill', async () => {
  await dropText();
  await page.keyboard.type('Hi');
  await page.keyboard.press('Escape');
  await page.fill('#color', '#0000ff');
  assert.equal((await texts(page))[0].fill, '#0000ff');
});

test('emptied text is removed on exit', async () => {
  await dropText();
  await page.keyboard.press('Backspace'); // selectAll active: clears text
  await page.keyboard.press('Escape');
  assert.deepEqual(await texts(page), []);
});
