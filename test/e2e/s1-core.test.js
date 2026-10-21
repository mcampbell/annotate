const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, useTool, objects, exportedPixel } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

test('paste loads image at native size and enables Copy', async () => {
  assert.equal(await page.isDisabled('#copy'), true);
  await pasteImage(page);
  const size = await page.evaluate(() => [Annot.canvas.backgroundImage.width, Annot.canvas.backgroundImage.height]);
  assert.deepEqual(size, [2400, 1600]);
  assert.ok((await page.evaluate(() => Annot.canvas.getZoom())) < 1, 'large image zooms to fit');
  assert.equal(await page.isDisabled('#copy'), false);
});

test('box drops with panel style, click on it selects instead of dropping', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await page.fill('#size', '5');
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await clickScene(page, 600, 400);
  assert.deepEqual(await objects(page), [{ annotTool: 'box', stroke: '#00ff00', strokeWidth: 5, fill: 'transparent' }]);
});

test('style change applies to selected object', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await page.fill('#color', '#0000ff');
  assert.equal((await objects(page))[0].stroke, '#0000ff');
});

test('Select tool click on empty canvas does not drop', async () => {
  await pasteImage(page);
  await useTool(page, 'select');
  await clickScene(page, 600, 400);
  assert.deepEqual(await objects(page), []);
});

test('Delete removes selected object', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await page.keyboard.press('Delete');
  assert.deepEqual(await objects(page), []);
});

test('export is native size and contains the box', async () => {
  await pasteImage(page);
  await page.fill('#color', '#ff0000');
  await page.fill('#size', '6');
  await useTool(page, 'box');
  await clickScene(page, 600, 400); // box 160x100 centered: left edge x=520
  const [r, g, b] = await exportedPixel(page, 520, 400);
  assert.ok(r > 200 && g < 50 && b < 50, `expected red, got ${[r, g, b]}`);
});

test('Copy puts a native-size PNG on the clipboard', async () => {
  await pasteImage(page);
  await page.click('#copy');
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('Copied'));
  const dims = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const bmp = await createImageBitmap(await item.getType('image/png'));
    return [bmp.width, bmp.height];
  });
  assert.deepEqual(dims, [2400, 1600]);
});

test('right-click does not drop', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  const box = await page.locator('.upper-canvas').boundingBox();
  await page.mouse.click(box.x + 100, box.y + 100, { button: 'right' });
  await page.mouse.click(box.x + 100, box.y + 100, { button: 'middle' });
  assert.deepEqual(await objects(page), []);
});

test('Copy failure shows an error', async () => {
  await pasteImage(page);
  await page.evaluate(() => (navigator.clipboard.write = () => Promise.reject(new Error('denied'))));
  await page.click('#copy');
  await page.waitForFunction(() => document.getElementById('status').classList.contains('error'));
  assert.equal(await page.textContent('#status'), 'Copy failed: denied');
});

test('second paste replaces image and clears annotations', async () => {
  await pasteImage(page);
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await pasteImage(page, 800, 600);
  assert.deepEqual(await objects(page), []);
});

test('touch tap drops', async () => {
  await browser.close();
  ({ browser, page, errors } = await open({ hasTouch: true }));
  await pasteImage(page);
  await useTool(page, 'box');
  const box = await page.locator('.upper-canvas').boundingBox();
  await page.touchscreen.tap(box.x + 100, box.y + 100);
  assert.equal((await objects(page)).length, 1);
});
