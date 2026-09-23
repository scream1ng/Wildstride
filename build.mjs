import {cp,mkdir,rm} from 'node:fs/promises';
const files=['index.html','style.css','app.js','model.js','runner.js','renderer.js','icons.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','assets'];
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await Promise.all(files.map(file=>cp(file,`dist/${file}`,{recursive:true})));
