import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const OUT='docs/qa/campaign/production';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const earned=JSON.parse(await fs.readFile('docs/qa/campaign/earned-storage-state.json','utf8'));
// Port-only copy of genuinely earned progress, unchanged, for compiled-preview replays.
const storageState={...earned,origins:earned.origins.map(o=>({...o,origin:o.origin.replace(':5262',':4262')}))};
const context=await browser.newContext({viewport:{width:900,height:760},deviceScaleFactor:1,storageState});
const page=await context.newPage();page.setDefaultTimeout(60000);const errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const state=async()=>JSON.parse(await page.evaluate(()=>window.render_game_to_text()));
try{
 await page.goto('http://localhost:4262/',{waitUntil:'domcontentloaded'});
 assert.equal((await state()).campaign.highestUnlocked,30);
 for(const[level,side]of[[21,'left'],[30,'right']]){
  await page.locator('#levels').click();await page.locator(`[data-level="${level}"]`).click();
  if(await page.locator('#start').isVisible())await page.locator('#start').click();
  await page.locator('[data-page="switches"]').click();await page.locator('#operate').click();
  await page.evaluate(()=>window.advanceTime(1800));
  await page.screenshot({path:`${OUT}/tag-${side}-before.png`});
  const pt=(await state()).controls.find(c=>c.module==='switches'&&c.control===`tag-${side}`);
  assert.ok(pt);assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,pt),'scene');
  await page.mouse.click(pt.x,pt.y);
  assert.equal((await state()).modules[2].world.maintenanceTag,side);assert.equal((await state()).strikes,0);
  await page.screenshot({path:`${OUT}/tag-${side}-after.png`});
  checks.push({level,side,result:'physical raycast accepted, correct tag, zero strikes'});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${OUT}/tag-results.json`,JSON.stringify({setup:'Unchanged QA-earned progress copied from dev origin5262 to preview origin4262 for replays; no fabricated unlocks/wins.',checks,errors},null,2));console.log('Both physical maintenance tags pass');
}finally{await browser.close();}
