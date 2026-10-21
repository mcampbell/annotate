const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, makePng } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const bgSize = () => page.evaluate(() => Annot.canvas.backgroundImage && [Annot.canvas.backgroundImage.width, Annot.canvas.backgroundImage.height]);

test('file upload loads image', async () => {
  const buffer = Buffer.from(await makePng(page, 800, 600), 'base64');
  await page.setInputFiles('#file', { name: 'x.png', mimeType: 'image/png', buffer });
  await page.waitForFunction(() => Annot.canvas.backgroundImage);
  assert.deepEqual(await bgSize(), [800, 600]);
});

test('drop loads image', async () => {
  const b64 = await makePng(page, 800, 600);
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'x.png', { type: 'image/png' }));
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, b64);
  await page.waitForFunction(() => Annot.canvas.backgroundImage);
  assert.deepEqual(await bgSize(), [800, 600]);
});

test('drop of non-image shows error', async () => {
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['hi'], 'a.txt', { type: 'text/plain' }));
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  });
  assert.equal(await page.getAttribute('#status', 'class'), 'error');
  assert.match(await page.textContent('#status'), /Not an image/);
  assert.equal(await bgSize(), undefined);
});

test('broken image shows an error', async () => {
  await page.evaluate(() => Annot.loadImage(new Blob(['x'], { type: 'image/png' })));
  await page.waitForFunction(() => document.getElementById('status').classList.contains('error'));
  assert.match(await page.textContent('#status'), /^Could not load image/);
});

test('paste without an image shows an error', async () => {
  await page.evaluate(() => document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: new DataTransfer() })));
  assert.equal(await page.textContent('#status'), 'Clipboard has no image.');
});
