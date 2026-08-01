import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'app'), { recursive: true });
await mkdir(path.join(dist, 'core'), { recursive: true });

for (const file of ['index.html', 'styles.css', 'manifest.webmanifest']) {
  await cp(path.join(root, 'spirolab-ui', 'public', file), path.join(dist, file));
}
for (const file of ['solver.js', 'reference.js', 'interpretation.js', 'index.js']) {
  await cp(path.join(root, 'spirolab-core', 'src', file), path.join(dist, 'core', file));
}
let main = await readFile(path.join(root, 'spirolab-ui', 'src', 'main.js'), 'utf8');
main = main
  .replaceAll('../../spirolab-core/src/reference.js', '../core/reference.js')
  .replaceAll('../../spirolab-core/src/solver.js', '../core/solver.js')
  .replaceAll('../../spirolab-core/src/interpretation.js', '../core/interpretation.js');
await writeFile(path.join(dist, 'app', 'main.js'), main);
let html = await readFile(path.join(dist, 'index.html'), 'utf8');
html = html.replace('src/main.js', 'app/main.js');
await writeFile(path.join(dist, 'index.html'), html);
await writeFile(path.join(dist, '.nojekyll'), '');
console.log('SpiroLab AI-UCH construido en dist/');
