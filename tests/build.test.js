import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('la plantilla contiene el punto de montaje de la aplicación', async () => {
  const html = await readFile(new URL('../spirolab-ui/public/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="app"/);
});
