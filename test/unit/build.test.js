const test = require('node:test');
const assert = require('node:assert/strict');
const { inline } = require('../../build.js');

const files = { 'a.js': 'var a = "</script>";', 'b.css': 'body{}' };
const read = (p) => files[p];

test('inline replaces script src with file contents', () => {
  const out = inline('<script src="a.js"></script>', read);
  assert.equal(out, '<script>var a = "<\\/script>";</script>');
});

test('inline replaces stylesheet link', () =>
  assert.equal(inline('<link rel="stylesheet" href="b.css">', read), '<style>body{}</style>'));

test('inline leaves other markup alone', () =>
  assert.equal(inline('<p>hi</p><script>x()</script>', read), '<p>hi</p><script>x()</script>'));
