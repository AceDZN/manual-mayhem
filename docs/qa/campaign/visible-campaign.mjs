// Independent, hand-read procedures from solutions.json. No state writes or unlock injection.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const OUT='docs/qa/campaign',URL='http://localhost:5262/';
const {levels}=JSON.parse(await fs.readFile(`${OUT}/solutions.json`,'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:900,height:760},deviceScaleFactor:1});
const p=await ctx.newPage(),results=[],errors=[];
p.setDefaultTimeout(12000);
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
const snap=async name=>{await p.screenshot({path:`${OUT}/${name}.png`});await fs.writeFile(`${OUT}/${name}.json`,JSON.stringify(await state(),null,2));};
async function read(id){if(await p.locator('#inspect').isVisible())await p.locator('#controls-toggle').click();await p.locator(`[data-page="${id}"]`).click();const s=await state();assert.equal(s.manual.page,id);assert.equal(s.manual.reading,true);if(id!=='operator'){assert.equal(await p.locator('.english-procedure').innerText(),s.manual.text);assert.match(await p.locator('#manual').innerText(),new RegExp(s.modules.find(m=>m.id===id).serial));}}
async function operate(){await p.locator('#operate').click();if(!await p.locator('#inspect').isVisible())await p.locator('#controls-toggle').click();}
function alias(a){return a.replace(/-(open|close|on|off)$/,'');}
async function act(id,a){const before=(await state()).modules.find(m=>m.id===id).world;const match=a.match(/^(small|large|left|right|fan)-(open|close|on|off)$/);if(match)assert.notEqual(before[match[1]],['open','on'].includes(match[2]),'intended toggle must change actual state');await p.locator(`[data-control="${alias(a)}"]`).click();const s=await state();assert.equal(s.strikes,0,`${s.mission.level}/${id}/${a}: ${s.feedback}`);}
async function pick(type,index){await read('operator');await p.locator(`[data-choice="${type}"][data-index="${index}"]`).click();assert.equal((await state())[type],true);}
try{
 await p.goto(URL,{waitUntil:'domcontentloaded'});assert.equal(await p.locator('#grade,#mission').count(),0);assert.equal((await state()).campaign.highestUnlocked,1);assert.equal((await state()).campaign.currentLevel,1);assert.deepEqual((await state()).modules.filter(m=>m.active).map(m=>m.id),['valves']);assert.ok((await state()).modules.filter(m=>!m.active).every(m=>!m.complete));await snap('900-opening');
 await p.locator('#levels').click();assert.equal(await p.locator('[data-level]').count(),30);assert.equal(await p.locator('[data-level]:disabled').count(),29);await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement?.closest('.campaign-map')),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#levels').evaluate(e=>e===document.activeElement),true);results.push({check:'fresh campaign, no grade selection, active-only opening,30-level lock map and keyboard Escape',status:'pass'});
 await p.locator('#start').click();
 for(const sol of levels){
  assert.equal((await state()).mission.level,sol.level);
  // Predict from the explicit initial scenario, then perform the prevention plan.
  if(sol.prediction!==undefined)await pick('prediction',sol.prediction);
  const readings=[];
  for(const[id,actions]of Object.entries(sol.modules)){
   await read(id);if([12,21,23,24,26,30].includes(sol.level)&&id==='switches')await snap(`level-${sol.level}-switches-read`);await operate();
   for(const a of actions){await act(id,a);if(id==='valves'&&a==='test')readings.push((await state()).modules.find(m=>m.id===id).world.pressure);}
   assert.equal((await state()).modules.find(m=>m.id===id).complete,true);
   if([17,20].includes(sol.level)&&id==='cable')await snap(`level-${sol.level}-connected-cable`);if([21,23,24,26,30].includes(sol.level)&&id==='switches')await snap(`level-${sol.level}-switches-done`);
  }
  if(sol.relay!==undefined)await pick('relay',sol.relay);
  const ready=await state();assert.equal(ready.mode,'ready');assert.equal(ready.campaign.highestUnlocked,sol.level,'repair/choice must not unlock before engine start');assert.equal(ready.evidence.assisted,[1,2,3,11,21,24,27].includes(sol.level));assert.equal(ready.evidence.retries,0);
  const expected={24:[3,1,3],25:[2,4,2],26:[2,4,3,1],30:[3,1,3]}[sol.level];if(expected)assert.deepEqual(readings,expected);
  await p.locator('#engine-start').click();const won=await state();assert.equal(won.mode,'won');assert.equal(won.campaign.highestUnlocked,Math.min(30,sol.level+1));assert.ok(won.campaign.completed.includes(sol.level));assert.equal(won.strikes,0);
  if([1,10,15,20,24,26,30].includes(sol.level))await snap(`level-${sol.level}-won`);
  results.push({check:'visible manual→operate→messages→engine start',level:sol.level,status:'pass',readings,events:won.evidence.events.length});console.log(`WON ${sol.level}/30`);
  await fs.writeFile(`${OUT}/campaign-results.json`,JSON.stringify({results,errors},null,2));
  if(sol.level%5===0)await ctx.storageState({path:`${OUT}/earned-storage-state.json`});
  if(sol.level<30)await p.locator('#next').click();
 }
 await ctx.storageState({path:`${OUT}/earned-storage-state.json`});
 await p.locator('#campaign-finished').click();assert.equal(await p.locator('[data-level]:disabled').count(),0);await snap('900-completed-map');await p.keyboard.press('Escape');
 await p.reload();assert.equal((await state()).mission.level,30);assert.equal((await state()).campaign.highestUnlocked,30);await p.locator('#levels').click();await p.locator('[data-level="5"]').click();await read('valves');await operate();await p.locator('[data-control="small"]').click();assert.equal((await state()).strikes,1);await snap('level-5-wrong-order');await p.locator('#recover').click();await p.locator('[data-control="large"]').click();await p.locator('[data-control="small"]').click();assert.equal((await state()).modules[0].complete,true);assert.ok((await state()).evidence.retries>=1);assert.equal((await state()).campaign.highestUnlocked,30);results.push({check:'final replay/reload keeps30 unlocked; wrong order→recovery preserves retry evidence',status:'pass'});
 const partner=await ctx.newPage();await partner.goto(URL+'?manual=1');assert.equal(await partner.locator('.manual-mission').count(),30);assert.equal(await partner.locator('#scene,[data-control]').count(),0);await partner.locator('#reader-level').selectOption('30');assert.ok((await partner.locator('#manual-level-30').boundingBox()).y<200);await partner.screenshot({path:`${OUT}/partner-level-30.png`});await partner.close();results.push({check:'static30-procedure partner reader, direct level30 jump, no live controls',status:'pass'});
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,storageState:`${OUT}/earned-storage-state.json`});const mp=await mobile.newPage();await mp.goto(URL);await mp.screenshot({path:`${OUT}/390-level30-read.png`});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.locator('#levels').tap();assert.equal(await mp.locator('[data-level]').count(),30);await mp.screenshot({path:`${OUT}/390-map.png`});await mp.locator('[data-level="1"]').tap();if(await mp.locator('#start').isVisible())await mp.locator('#start').tap();else await mp.locator('#operate').tap();await mp.locator('#controls-toggle').tap();await mp.locator('[data-control="small"]').tap();assert.equal(JSON.parse(await mp.evaluate(()=>window.render_game_to_text())).mode,'ready');await mp.locator('#engine-start').tap();assert.equal(JSON.parse(await mp.evaluate(()=>window.render_game_to_text())).mode,'won');await mp.screenshot({path:`${OUT}/390-level1-replay-won.png`});await mobile.close();results.push({check:'390px earned map/touch replay and win, no document overflow',status:'pass'});
 assert.deepEqual(errors,[]);
}catch(e){results.push({check:'failure',error:String(e)});console.error(e.stack);try{await snap('failure')}catch{}process.exitCode=1;}
finally{await fs.writeFile(`${OUT}/campaign-results.json`,JSON.stringify({results,errors},null,2));await browser.close();console.log(JSON.stringify({results,errors},null,2));}
