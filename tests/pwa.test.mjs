import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function worker(){
 const handlers={},stored=new Map();let networkCalls=0;
 const cache={addAll:async files=>{for(const file of files)stored.set(new URL(file,'http://localhost:3000').href,await readFile(new URL('../'+(file==='./'?'index.html':file),import.meta.url)));}};
 const context={URL,caches:{open:async()=>cache,match:async req=>stored.get(new URL(typeof req==='string'?req:req.url,'http://localhost:3000').href),keys:async()=>['wildstride-pwa-v5']},fetch:async()=>{networkCalls++;throw Error('Offline');},self:{location:{origin:'http://localhost:3000'},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 vm.runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
 await new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}));
 return {stored,handlers,get networkCalls(){return networkCalls;}};
}
test('service worker preloads every game asset and serves cached assets without network',async()=>{
 const w=await worker();
 const required=['/','/index.html','/style.css','/app.js','/model.js','/runner.js','/renderer.js','/icons.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/assets/forest.webp','/assets/neon.webp','/assets/ocean.webp','/assets/creatures.webp','/assets/runners.webp','/assets/props.webp'];
 assert.equal(w.stored.size,required.length);
 for(const file of required){const url=new URL(file,'http://localhost:3000').href;assert.ok(w.stored.has(url),`${file} must work offline`);const response=await new Promise((resolve,reject)=>w.handlers.fetch({request:{method:'GET',url},respondWith:p=>p.then(resolve,reject)}));assert.ok(response.length>0);}
 assert.equal(w.networkCalls,0);
});
test('offline navigation returns the app even with a new query string',async()=>{
 const w=await worker();const response=await new Promise((resolve,reject)=>w.handlers.fetch({request:{method:'GET',mode:'navigate',url:'http://localhost:3000/?source=home'},respondWith:p=>p.then(resolve,reject)}));
 assert.ok(response.toString().includes('id="app"'));assert.equal(w.networkCalls,1);
});
