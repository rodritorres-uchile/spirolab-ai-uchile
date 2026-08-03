import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();let html=fs.readFileSync(path.join(root,'index.template.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/styles.css'),'utf8');
let engine=fs.readFileSync(path.join(root,'src/core/engine.js'),'utf8').replace(/export\s+/g,'');
let app=fs.readFileSync(path.join(root,'src/ui/app.js'),'utf8').replace(/^import .*$/m,'');
html=html.replace('/*__CSS__*/',css).replace('/*__JS__*/',engine+'\n'+app);
fs.writeFileSync(path.join(root,'index.html'),html);fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);
console.log('Built index.html and dist/index.html');
