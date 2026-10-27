import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='docs/qa';const results=[];const errors=[];
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
const relay={'g8-independent':1,'g8-transfer':2,'g9-transfer':1};
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext({viewport:{width:1100,height:760},deviceScaleFactor:1});const p=await c.newPage();
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
const shot=async name=>{await p.screenshot({path:`${out}/${name}.png`,timeout:30000});await fs.writeFile(`${out}/${name}.json`,JSON.stringify(await state(),null,2));};
async function load(id){await p.locator('#grade').selectOption(id[1]);await p.locator('#mission').selectOption(id);assert.equal((await state()).mission.id,id);}
async function module(id){await p.locator(`[data-module="${id}"]`).click();assert.equal((await state()).selected,id);}
async function action(id){await p.locator(`[data-control="${id}"]`).click();}
try{
await p.goto('http://localhost:5262',{waitUntil:'domcontentloaded'});await p.locator('#start').click({timeout:30000});
await p.waitForFunction(()=>JSON.parse(window.render_game_to_text()).audio.activeLoops>0,{timeout:30000});
results.push({check:'gesture starts real AudioContext + loops',audio:(await state()).audio});
// Full nine-mission causal paths; the controls, not a solved-state injection, execute every step.
for(const id of Object.keys(SOLUTIONS)){
await load(id);await p.locator('#manual-toggle').click();assert.equal((await state()).mode,'manual');assert.equal((await state()).audio.ducked,true);
if(id==='g9-transfer')await p.locator('[data-choice="prediction"][data-index="0"]').click();
if(id in relay)await p.locator(`[data-choice="relay"][data-index="${relay[id]}"]`).click();
if(id.endsWith('transfer'))await shot(id+'-manual');
await p.locator('#close-manual').click();
for(const [mod,actions] of Object.entries(SOLUTIONS[id])){await module(mod);for(const a of actions)await action(a);assert.equal((await state()).modules.find(m=>m.id===mod).complete,true);}
assert.equal((await state()).mode,'ready');await p.locator('#engine-start').click();const s=await state();assert.equal(s.mode,'won');assert.equal(s.strikes,0);assert.equal(s.evidence.retries,0);if(!id.endsWith('guided'))assert.equal(s.evidence.assisted,false);
if(id.endsWith('transfer'))await shot(id+'-won');results.push({check:'complete mission via controls',mission:id,status:s.mode,events:s.evidence.events.length,assisted:s.evidence.assisted});console.log('WON',id);
}
await load('g7-independent');const priorRetries=(await state()).evidence.retries;await module('valves');await action('small');let s=await state();assert.equal(s.strikes,1);assert.equal(s.modules[0].fault,true);assert.match(s.feedback,/before \/ after/);await shot('wrong-order');await p.locator('#recover').click();assert.equal((await state()).strikes,1);await action('large');await action('small');assert.equal((await state()).modules[0].complete,true);results.push({check:'wrong order / visible strike / recovery / correct order',status:'pass'});
await module('cable');await p.locator('#help').click();assert.equal((await state()).evidence.assisted,true);await p.locator('#restart').click();assert.equal((await state()).evidence.retries,priorRetries+2);assert.equal((await state()).strikes,0);results.push({check:'hint assistance + restart retry persistence',status:'pass'});
// Audio settings/pause/restart: use the actual visible controls.
await p.locator('#settings').click();assert.equal((await state()).mode,'settings');const music=p.locator('[data-gain="music"]');await music.press('Home');assert.equal((await state()).audio.gains.music,0);await p.locator('#sound-check').click();await p.locator('#close-overlay').click();await p.locator('#pause').click();await p.waitForTimeout(600);s=await state();assert.equal(s.mode,'paused');assert.equal(s.audio.paused,true);assert.equal(s.audio.state,'suspended');await p.keyboard.press('Escape');await p.waitForTimeout(300);s=await state();assert.equal(s.mode,'playing');assert.equal(s.audio.paused,false);const loops=s.audio.activeLoops;await p.locator('#restart').click();await p.waitForTimeout(300);assert.equal((await state()).audio.activeLoops,loops);await p.reload();await p.locator('#start').click();await p.waitForFunction(()=>JSON.parse(window.render_game_to_text()).audio.activeLoops>0);assert.equal((await state()).audio.gains.music,0);results.push({check:'settings saved / pause suspends / Escape resumes / restart no doubled loops',loops,status:'pass'});
// Keyboard-only core module through Tab + Enter; no direct focus injection.
await load('g7-guided');
async function tabTo(selector){for(let i=0;i<70;i++){if(await p.evaluate(sel=>document.activeElement?.matches(sel),selector))return;await p.keyboard.press('Tab');}throw new Error('Tab target unreachable: '+selector);}
for(const [selector,press] of [['[data-module="valves"]','Enter'],['[data-control="small"]','Enter'],['[data-control="large"]','Enter']]){await tabTo(selector);await p.keyboard.press(press);}assert.equal((await state()).modules[0].complete,true);await p.keyboard.press('KeyM');assert.equal((await state()).mode,'manual');await p.keyboard.press('Escape');assert.equal((await state()).mode,'playing');assert.equal((await state()).selected,'valves');await p.keyboard.press('Escape');assert.equal((await state()).selected,null);results.push({check:'keyboard Tab/Enter core actions + M + layered Escape',status:'pass'});
// Physical key code remains available under a Hebrew character event.
await p.keyboard.press('Digit2');assert.equal((await state()).selected,'cable');await shot('keyboard-cable');
// Native mobile touch controls and manual scroll; separate context.
const mobile=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const mp=await mobile.newPage();await mp.goto('http://localhost:5262');await mp.locator('#start').tap();await mp.locator('#grade').selectOption('8');await mp.locator('#mission').selectOption('g8-transfer');await mp.locator('[data-module="switches"]').tap();await mp.locator('[data-control="left"]').tap();await mp.locator('[data-control="test"]').tap();const ms=JSON.parse(await mp.evaluate(()=>window.render_game_to_text()));assert.equal(ms.modules[2].complete,true);await mp.locator('#manual-toggle').tap();await mp.screenshot({path:`${out}/mobile-manual.png`});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.keyboard.press('Escape');await mp.setViewportSize({width:844,height:390});await mp.screenshot({path:`${out}/mobile-landscape.png`});results.push({check:'390px touch module and manual; 844px landscape resize',status:'pass'});await mobile.close();
// Static reader is independent of the completed live machine.
const reader=await c.newPage();await reader.goto('http://localhost:5262/?manual=1');assert.equal(await reader.locator('.manual-mission').count(),9);assert.equal(await reader.locator('#scene').count(),0);assert.equal(await reader.locator('[data-choice]').count(),0);await reader.screenshot({path:`${out}/partner-manual.png`});results.push({check:'static partner manual contains nine serial procedures and no live machine',status:'pass'});await reader.close();
}catch(e){console.log('FAILED',e.stack);results.push({check:'failure',error:String(e)});try{await shot('failure')}catch{}}
finally{await fs.writeFile(`${out}/browser-results.json`,JSON.stringify({results,errors},null,2));await b.close();console.log(JSON.stringify({results,errors},null,2));}
