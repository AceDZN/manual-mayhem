// Independent revision QA: visible UI actions only; no solved-state injection.
// The read/operate selector is finalized against the lead's revised interface.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const ROOT='http://localhost:5262';
const OUT='docs/qa/revision';
const OPERATE='#operate';
const SOLUTIONS={
'g7-guided':{valves:['small','large'],cable:['connect-square','clip-a','clip-b','test'],switches:['left','test']},
'g7-independent':{valves:['large','small'],cable:['connect-round','clip-b','clip-a','test'],switches:['right','test']},
'g7-transfer':{valves:['small','large'],cable:['clip-b','clip-a','connect-round','test'],switches:['right','left','test']},
'g8-guided':{valves:['small','large'],cable:['connect-square','clip-b','clip-a','test'],switches:['left','test']},
'g8-independent':{valves:['large','small'],cable:['clip-b','clip-a','connect-square','test'],switches:['right','test']},
'g8-transfer':{valves:['small','large'],cable:['clip-a','clip-b','connect-round','test'],switches:['left','test']},
'g9-guided':{valves:['small','test','small','test','small','test'],cable:['connect-square','clip-a','clip-b','test'],switches:['fan','test']},
'g9-independent':{valves:['large','small'],cable:['connect-round','clip-b','clip-a','test'],switches:['tag-left','right','test']},
'g9-transfer':{valves:['small','large'],cable:['clip-a','clip-b','connect-round','test'],switches:['fan','test']}};
const RELAY={'g8-independent':1,'g8-transfer':2,'g9-transfer':1};
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const results=[],errors=[];
const context=await b.newContext({viewport:{width:900,height:760},deviceScaleFactor:1});
const p=await context.newPage();
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
async function shot(name){await p.screenshot({path:`${OUT}/${name}.png`});await fs.writeFile(`${OUT}/${name}.json`,JSON.stringify(await state(),null,2));}
async function currentPaper(id){assert.equal(await p.locator('#manual').isVisible(),true);const st=await state();const serial=st.modules.find(m=>m.id===id).serial;assert.match(await p.locator('#manual').innerText(),new RegExp(serial));}
async function operate(){await p.locator(OPERATE).click();if(!await p.locator('#inspect').isVisible())await p.locator('#controls-toggle').click();}
async function select(id){if(await p.locator('#inspect').isVisible())await p.locator('#controls-toggle').click();await p.locator(`[data-page="${id}"]`).click();await currentPaper(id);assert.equal((await state()).manual.page,id);assert.equal(await p.locator('.english-procedure').innerText(),(await state()).manual.text);}
async function fullViewport(selector){const box=await p.locator(selector).boundingBox();assert.ok(box,selector+' box missing');assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=900&&box.y+box.height<=760,selector+' must be fully visible, not just auto-scroll-clickable');assert.equal(await p.evaluate(()=>document.documentElement.scrollTop||document.body.scrollTop),0);}
async function action(id){await p.locator(`[data-control="${id}"]`).click();}
async function load(id){await p.locator('#grade').selectOption(id[1]);await p.locator('#mission').selectOption(id);assert.equal((await state()).mission.id,id);}
try{
await p.goto(ROOT,{waitUntil:'domcontentloaded'});
assert.equal(await p.locator('#manual').isVisible(),true,'paper must be visible before Start');
assert.match(await p.locator('#start').innerText(),/קראתי|קודם קוראים/,'Start must explain the reading-first sequence');
await shot('900-initial');await fullViewport('#start');await p.locator('#start').click();assert.equal(await p.evaluate(()=>document.documentElement.scrollTop||document.body.scrollTop),0);await p.locator('#read-mode').click();await currentPaper('valves');await shot('900-first-read');await p.locator(OPERATE).click();await shot('900-first-operate');
results.push({check:'900px novice opening exposes paper and explicit read→operate action',status:'pass'});
for(const id of Object.keys(SOLUTIONS)){
await load(id);
for(const [module,actions] of Object.entries(SOLUTIONS[id])){
await select(module);
if(id.endsWith('transfer')&&module==='switches')await shot(id+'-read');
await operate();for(const a of actions)await action(a);
assert.equal((await state()).modules.find(m=>m.id===module).complete,true);
}
if(id in RELAY){await p.locator('#next-module').click();assert.equal((await state()).manual.page,'operator');if(id==='g9-transfer')await p.locator('[data-choice="prediction"][data-index="0"]').click();if(id.endsWith('transfer'))await shot(id+'-message');await p.locator(`[data-choice="relay"][data-index="${RELAY[id]}"]`).click();}assert.equal((await state()).mode,'ready');await p.locator('#engine-start').click();const st=await state();assert.equal(st.mode,'won');assert.equal(st.strikes,0);assert.equal(st.evidence.retries,0);if(!id.endsWith('guided'))assert.equal(st.evidence.assisted,false);
if(id.endsWith('transfer'))await shot(id+'-won');results.push({check:'900px visible read→operate mission win',mission:id,events:st.evidence.events.length,status:'pass'});console.log('WON',id);
}
// Reversible contextual navigation and wrong interpretation/recovery.
await load('g7-independent');await select('valves');await operate();await action('small');assert.equal((await state()).strikes,1);await shot('900-wrong-order');await p.locator('#recover').click();await action('large');await action('small');assert.equal((await state()).modules[0].complete,true);results.push({check:'wrong order, precise feedback, recovery and corrected procedure',status:'pass'});
// Desktop first encounter in a fresh viewport/context.
const desktop=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const dp=await desktop.newPage();await dp.goto(ROOT);assert.equal(await dp.locator('#manual').isVisible(),true);await dp.screenshot({path:`${OUT}/1440-initial.png`});await dp.locator('#start').click();await dp.locator('#read-mode').click();await dp.screenshot({path:`${OUT}/1440-first-read.png`});await dp.locator(OPERATE).click();await dp.screenshot({path:`${OUT}/1440-first-operate.png`});await desktop.close();
// Mobile: manual and operation have explicit controls instead of relying on M.
const mobile=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const mp=await mobile.newPage();await mp.goto(ROOT);assert.equal(await mp.locator('#manual').isVisible(),true);await mp.screenshot({path:`${OUT}/390-initial.png`});await mp.locator('#start').tap();await mp.screenshot({path:`${OUT}/390-first-operate.png`});await mp.locator('#controls-toggle').tap();await mp.locator('[data-control="small"]').tap();await mp.locator('[data-control="large"]').tap();assert.equal(JSON.parse(await mp.evaluate(()=>window.render_game_to_text())).modules[0].complete,true);await mp.screenshot({path:`${OUT}/390-first-module.png`});await mp.locator('#manual-toggle').tap();await mp.screenshot({path:`${OUT}/390-return-manual.png`});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.setViewportSize({width:844,height:390});await mp.screenshot({path:`${OUT}/844-landscape.png`});await mobile.close();results.push({check:'1440 desktop and390 mobile initial/read/operate; touch module success and landscape resize',status:'pass'});
}catch(e){results.push({check:'failure',error:String(e)});console.log(e.stack);try{await shot('failure')}catch{}process.exitCode=1;}
finally{await fs.writeFile(`${OUT}/results.json`,JSON.stringify({results,errors},null,2));await b.close();console.log(JSON.stringify({results,errors},null,2));}
