import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.argv[2]||'http://localhost:5262/docs/audio/audio-harness.html';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const context=await browser.newContext();const page=await context.newPage();const checks=[];const errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const snapshot=()=>page.evaluate(()=>window.audioHarness.engine.snapshot());
const slider=async(name,value)=>page.locator('#'+name).evaluate((element,value)=>{element.value=value;element.dispatchEvent(new Event('input',{bubbles:true}))},String(value));
const record=async(name,fn)=>{await fn();checks.push({name,pass:true,snapshot:await snapshot()})};
try{
 await page.goto(url);await page.waitForFunction(()=>!!window.audioHarness);
 await record('No context or playback before user gesture',async()=>assert.equal((await snapshot()).state,'not-started'));
 await page.locator('#start').click();await page.waitForFunction(()=>{const s=window.audioHarness.engine.snapshot();return s.loaded===16&&s.activeLoops===5&&s.rms>0},null,{timeout:15000});
 await record('Gesture starts 16 decoded assets and exactly five loop sources',async()=>{const s=await snapshot();assert.equal(s.state,'running');assert.equal(s.activeLoops,5);assert.equal(s.error,null);assert.ok(s.rms>0)});
 for(let i=0;i<3;i++)await page.locator('#progress').click();await page.waitForTimeout(700);
 await record('Each stabilized module adds a score stem',async()=>{const s=await snapshot();assert.equal(s.moduleStems,3);assert.ok(s.stemLevels.every(n=>n>0))});
 for(const name of ['master','music','sfx','voice']){
   await slider(name,.31);
   await record(`Independent ${name} gain persists`,async()=>{assert.equal((await snapshot()).gains[name],.31);assert.equal(await page.evaluate(n=>JSON.parse(localStorage.getItem('manual-mayhem-audio-v1'))[n],name),.31)});
 }
 await slider('master',0);await page.waitForTimeout(120);
 await record('Master zero mutes actual output',async()=>assert.ok((await snapshot()).rms<.000001));
 await slider('master',.8);
 await page.locator('#duck').click();await record('Reading duck applies',async()=>assert.equal((await snapshot()).ducked,true));
 await page.locator('#duck').click();
 for(let i=0;i<11;i++){await page.locator('#cue').click();await page.waitForTimeout(70)}
 await record('All eleven tactile cue names are playable with bounded concurrency',async()=>{const s=await snapshot();assert.equal(s.cueCount,11);assert.ok(s.activeShots<=10);assert.equal(s.lastCue,'victory')});
 await page.locator('#pause').click();await page.waitForTimeout(220);
 const frozen=(await snapshot()).transportSeconds;await page.waitForTimeout(200);
 await record('Pause fades, suspends and freezes transport',async()=>{const s=await snapshot();assert.equal(s.state,'suspended');assert.equal(s.transportSeconds,frozen)});
 await page.locator('#resume').click();await page.waitForTimeout(200);
 await record('Resume reuses five sources',async()=>{const s=await snapshot();assert.equal(s.state,'running');assert.equal(s.activeLoops,5)});
 for(let i=0;i<4;i++)await page.locator('#restart').click();await page.waitForTimeout(200);
 await record('Four restarts reset layering without duplicate loops',async()=>{const s=await snapshot();assert.equal(s.moduleStems,0);assert.equal(s.activeLoops,5)});
 const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(220);
 const nativeFocus=await snapshot();checks.push({name:'Native headless tab focus observation',pass:null,note:'Observation only: headless Chromium may keep all pages visible.',snapshot:nativeFocus});
 await page.bringToFront();await other.close();await page.waitForTimeout(150);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(220);
 await record('Blur handler suspends transport (synthetic browser event)',async()=>{const s=await snapshot();assert.equal(s.background,true);assert.equal(s.state,'suspended')});
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(150);
 await record('Focus handler resumes existing transport (synthetic browser event)',async()=>{const s=await snapshot();assert.equal(s.background,false);assert.equal(s.state,'running');assert.equal(s.activeLoops,5)});
 await page.locator('#pause').click();await page.waitForTimeout(150);
 await page.locator('#preview').evaluate(async a=>{await a.play()});await page.waitForTimeout(400);
 const preview=await page.locator('#preview').evaluate(a=>({duration:a.duration,currentTime:a.currentTime,paused:a.paused,readyState:a.readyState,error:a.error?.message||null}));
 assert.equal(preview.duration,25);assert.ok(preview.currentTime>0);assert.equal(preview.paused,false);assert.equal(preview.error,null);
 checks.push({name:'HTML audio preview decodes and plays in browser',pass:true,preview});
 await page.locator('#preview').evaluate(a=>a.pause());
 await page.screenshot({path:'docs/audio/audio-browser-qa.png',fullPage:true});
 assert.equal(errors.length,0);
 const result={url,date:new Date().toISOString(),browser:'Playwright Chromium headless',listening:'Automated browser playback only; no human listening or subjective audition claimed.',checks,errors};
 await fs.writeFile('docs/audio/browser-audio-qa.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.pass===true).length,observations:checks.filter(c=>c.pass===null).length,errors},null,2));
}catch(e){console.error(e);await fs.writeFile('docs/audio/browser-audio-qa-failure.json',JSON.stringify({checks,errors,failure:String(e)},null,2));process.exitCode=1}
finally{await browser.close()}
