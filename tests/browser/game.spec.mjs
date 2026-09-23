import {test,expect} from '@playwright/test';
import {freshSave} from '../../model.js';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';

async function openGame(page,save=freshSave(),url='/'){
 await page.addInitScript(({save})=>{if(!localStorage.getItem('pwa-test-seeded')){localStorage.setItem('wildstride-v1',JSON.stringify(save));localStorage.setItem('wildstride-preferences',JSON.stringify({sound:false,haptics:false,tutorial:true}));localStorage.setItem('pwa-test-seeded','true');}},{save});
 await page.goto(url);
 await expect(page.locator('#loading-screen')).toBeHidden();
}

test('phone home, small-screen navigation, world previews and companion sheets',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await openGame(page);
 await expect(page.locator('#world-title')).toHaveText('Verdant Ruins');
 await page.screenshot({path:`.artifacts/${info.project.name}-home.png`});
 await page.locator('#next-world').click();
 await expect(page.locator('#world-title')).toHaveText('Neon District');
 await expect(page.locator('#play')).toBeDisabled();
 await page.locator('#next-world').click();
 await expect(page.locator('#world-title')).toHaveText('Coral Drift');
 await page.screenshot({path:`.artifacts/${info.project.name}-ocean.png`});
 await page.locator('[data-tab="companions"]').click();
 await page.locator('[data-companion="0"]').click();
 await expect(page.locator('#sheet')).toBeVisible();
 await expect(page.locator('.sheet-title h2')).toHaveText('Mossling');
 await page.locator('[data-close-sheet]').click();
 await page.setViewportSize({width:375,height:667});
 await page.locator('[data-tab="explore"]').click();
 const bounds=await page.locator('.tab-bar').boundingBox();
 expect(bounds.y+bounds.height).toBeLessThanOrEqual(667);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);
 await page.screenshot({path:`.artifacts/${info.project.name}-small.png`});
 expect(errors).toEqual([]);
});

test('unlocks, upgrades, evolution, equipped companion and save survive reload',async({page},info)=>{
 const save=freshSave();save.energy=400;save.creatures[0].xp=350;
 await openGame(page,save);
 await page.locator('#next-world').click();await page.locator('#play').click();
 await expect(page.locator('#balance')).toHaveText('300');
 await page.locator('#next-world').click();await page.locator('#play').click();
 await expect(page.locator('#balance')).toHaveText('120');
 await page.locator('[data-tab="upgrades"]').click();await page.locator('[data-upgrade="vitality"]').click();
 await expect(page.locator('#balance')).toHaveText('80');
 await page.locator('[data-tab="companions"]').click();await page.locator('[data-companion="0"]').click();
 await page.locator('[data-evolve="0"]').click();
 await expect(page.locator('#evolution-name')).toHaveText('Fernhorn');
 await expect(page.locator('#finish-evolution')).toBeEnabled();
 await page.screenshot({path:`.artifacts/${info.project.name}-evolution.png`});
 await page.locator('#finish-evolution').click();await page.locator('[data-companion="0"]').click();
 await page.locator('[data-evolve="0"]').click();await expect(page.locator('#evolution-name')).toHaveText('Sylvanox');
 await expect(page.locator('#finish-evolution')).toBeEnabled();await page.locator('#finish-evolution').click();
 await page.locator('[data-companion="0"]').click();await page.locator('[data-select="0"]').click();
 await page.reload();await expect(page.locator('#loading-screen')).toBeHidden();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('wildstride-v1')));
 expect(stored.unlocked).toEqual([true,true,true]);expect(stored.energy).toBe(80);expect(stored.creatures[0].stage).toBe(2);expect(stored.upgrades.vitality).toBe(1);expect(stored.active).toBe(0);
});

test('renderer advances, controls work, pause freezes, and end banks rewards once',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{Math.random=()=>.4;});
 await openGame(page);await page.locator('#play').click();
 await expect(page.locator('#countdown')).toBeHidden();
 await page.locator('[data-action="right"]').click();
 await expect.poll(async()=>Number(await page.locator('#distance').textContent())).toBeGreaterThan(230);
 await expect.poll(async()=>Number(await page.locator('#run-energy').textContent())).toBeGreaterThan(0);
 await page.screenshot({path:`.artifacts/${info.project.name}-gameplay.png`});
 const colorCount=await page.locator('#scene').evaluate(canvas=>{const c=canvas.getContext('2d');const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;const colors=new Set();for(let i=0;i<pixels.length;i+=4000)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);return colors.size;});
 expect(colorCount).toBeGreaterThan(50);
 await page.locator('#pause').click();const distance=await page.locator('#distance').textContent();
 await page.waitForTimeout(250);await expect(page.locator('#distance')).toHaveText(distance);
 await page.locator('[data-end]').click();await expect(page.locator('#run-overlay h2')).toContainText('Well earned');
 await page.locator('[data-camp]').click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('wildstride-v1')));
 expect(stored.energy).toBeGreaterThan(0);expect(stored.creatures[0].xp).toBeGreaterThan(40);expect(stored.best).toBe(Number(distance));
 await page.reload();await expect(page.locator('#loading-screen')).toBeHidden();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wildstride-v1')).energy)).toBe(stored.energy);
 expect(errors).toEqual([]);
});

test('installed cache loads artwork and starts gameplay fully offline',async({page})=>{
 // Stop a real origin instead of relying on browser-specific offline emulation.
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=new URL('../../'+(path==='/'?'index.html':path.slice(1)),import.meta.url);const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp'})[extname(file.pathname)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 try {
  await openGame(page,freshSave(),origin);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();await expect(page.locator('#loading-screen')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await expect(fetch(origin)).rejects.toThrow();
  await page.goto(origin+'/?source=offline');await expect(page.locator('#loading-screen')).toBeHidden();
  await page.locator('#play').click();await expect(page.locator('#countdown')).toBeHidden();
  await expect.poll(async()=>Number(await page.locator('#distance').textContent())).toBeGreaterThan(5);
 } finally {if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
});
