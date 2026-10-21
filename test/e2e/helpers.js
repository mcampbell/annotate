// Playwright helpers. Runs installed Google Chrome against dist/annotate.html over file://.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

const url = 'file://' + path.resolve(__dirname, '../../dist/annotate.html');

async function open(contextOptions = {}) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, ...contextOptions });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e));
  await page.goto(url);
  return { browser, page, errors };
}

// Always close Chrome, even when the assert fails. An open browser keeps node alive.
async function teardown(browser, errors) {
  try {
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

// Checkerboard PNG (10px squares) as base64, made in the page.
const makePng = (page, w, h) =>
  page.evaluate(async ([w, h]) => {
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = c.getContext('2d');
    for (let x = 0; x < w; x += 10)
      for (let y = 0; y < h; y += 10) {
        ctx.fillStyle = (x + y) % 20 ? '#000' : '#fff';
        ctx.fillRect(x, y, 10, 10);
      }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dataUrl = await new Promise((r) => Object.assign(new FileReader(), { onload: (e) => r(e.target.result) }).readAsDataURL(blob));
    return dataUrl.split(',')[1];
  }, [w, h]);

async function pasteImage(page, w = 2400, h = 1600) {
  const b64 = await makePng(page, w, h);
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'x.png', { type: 'image/png' }));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, b64);
  await page.waitForFunction(([w, h]) => Annot.canvas.backgroundImage?.width === w && Annot.canvas.backgroundImage.height === h, [w, h]);
}

async function clickScene(page, x, y) {
  const box = await page.locator('.upper-canvas').boundingBox();
  const zoom = await page.evaluate(() => Annot.canvas.getZoom());
  await page.mouse.click(box.x + x * zoom, box.y + y * zoom);
}

const useTool = (page, id) => page.click(`#tools [data-tool="${id}"]`);

const objects = (page) =>
  page.evaluate(() => Annot.canvas.getObjects().map(({ annotTool, stroke, strokeWidth, fill }) => ({ annotTool, stroke, strokeWidth, fill })));

// RGBA of one pixel of the exported image, in image coords.
const exportedPixel = (page, x, y) =>
  page.evaluate(([x, y]) => [...Annot.toCanvas().getContext('2d').getImageData(x, y, 1, 1).data], [x, y]);

module.exports = { open, teardown, makePng, pasteImage, clickScene, useTool, objects, exportedPixel };
