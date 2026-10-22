const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, toScreen, useTool } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const KEYS = { select: 'V', box: 'B', arrow: 'A', text: 'T', step: 'N', blur: 'U', pixelate: 'P' };
const LABELS = { select: 'Select', box: 'Box', arrow: 'Arrow', text: 'Text', step: 'Step', blur: 'Blur', pixelate: 'Pixelate' };

test('each tool button shows its key', async () => {
  const hints = await page.$$eval('#tools button', (bs) =>
    Object.fromEntries(bs.map((b) => [b.dataset.tool, [b.title, b.getAttribute('aria-keyshortcuts')]])));
  assert.deepEqual(hints, Object.fromEntries(Object.entries(KEYS).map(([id, k]) => [id, [`${LABELS[id]} (${k})`, k]])));
});

const pressed = () => page.$eval('#tools [aria-pressed="true"]', (b) => b.dataset.tool);
const count = () => page.evaluate(() => Annot.canvas.getObjects().length);

test('each key selects its tool', async () => {
  for (const [id, key] of Object.entries(KEYS)) {
    await useTool(page, id === 'select' ? 'box' : 'select');
    await page.keyboard.press(key.toLowerCase());
    assert.equal(await pressed(), id, `key ${key}`);
  }
});

test('Shift+A selects Arrow', async () => {
  await page.keyboard.press('Shift+A');
  assert.equal(await pressed(), 'arrow');
});

test('Escape selects Select', async () => {
  await useTool(page, 'box');
  await page.keyboard.press('Escape');
  assert.equal(await pressed(), 'select');
});

test('a key does not place anything', async () => {
  await pasteImage(page);
  await page.keyboard.press('b');
  assert.equal(await count(), 0);
});

test('typing a in text adds the letter and keeps the Text tool', async () => {
  await pasteImage(page);
  await useTool(page, 'text');
  await clickScene(page, 600, 400);
  await page.keyboard.type('a');
  assert.equal(await page.evaluate(() => Annot.canvas.getObjects()[0].text), 'a');
  assert.equal(await pressed(), 'text');
});

for (const mod of ['Meta', 'Control', 'Alt']) {
  test(`${mod}+A leaves the tool`, async () => {
    await useTool(page, 'box');
    await page.keyboard.press(`${mod}+a`);
    assert.equal(await pressed(), 'box');
  });
}

// Start a Box drag, press a key mid-drag, then release.
async function dragWithKey(key) {
  await pasteImage(page);
  await useTool(page, 'box');
  await page.mouse.move(...(await toScreen(page, 100, 100)));
  await page.mouse.down();
  await page.mouse.move(...(await toScreen(page, 300, 300)), { steps: 5 });
  await page.keyboard.press(key);
  await page.mouse.move(...(await toScreen(page, 400, 300)), { steps: 5 });
  await page.mouse.up();
}

test('a tool key mid-drag does nothing', async () => {
  await dragWithKey('a');
  assert.equal(await count(), 1);
  assert.equal(await pressed(), 'box');
});

test('Escape mid-drag cancels the drag and keeps the tool', async () => {
  await dragWithKey('Escape');
  assert.equal(await count(), 0);
  assert.equal(await pressed(), 'box');
});

test('a duplicate key throws', async () => {
  const message = await page.evaluate(() => {
    try {
      Annot.registerTool({ id: 'dup', label: 'Dup', key: 'a' });
    } catch (e) {
      return e.message;
    }
  });
  assert.equal(message, 'Tool dup: key "a" is taken by arrow');
});

test('an unmapped key leaves the tool', async () => {
  await useTool(page, 'box');
  await page.keyboard.press('z');
  assert.equal(await pressed(), 'box');
});

test('a tool with no key throws', async () => {
  const threw = await page.evaluate(() => {
    try {
      Annot.registerTool({ id: 'nokey', label: 'No key' });
    } catch {
      return true;
    }
    return false;
  });
  assert.equal(threw, true);
});

// Escape belongs to the text editor here: it ends editing and must not switch to Select.
test('Escape while editing text ends editing and keeps the Text tool', async () => {
  await pasteImage(page);
  await useTool(page, 'text');
  await clickScene(page, 600, 400);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => Annot.canvas.getObjects()[0].isEditing), false);
  assert.equal(await pressed(), 'text');
});
