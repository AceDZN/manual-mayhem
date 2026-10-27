import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const c=await b.newContext({viewport:{width:1100,height:760},deviceScaleFactor:1});const p=await c.newPage();const records=[],errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});const dir='docs/qa/source-sequence';let zero;
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
async function at(seconds,action,label){const remaining=zero+seconds*1000-Date.now();if(remaining>0)await p.waitForTimeout(remaining);await action();const elapsed=(Date.now()-zero)/1000;await p.screenshot({path:`${dir}/${String(seconds).padStart(2,'0')}-${label}.png`});const st=await state();await fs.writeFile(`${dir}/${String(seconds).padStart(2,'0')}-${label}.json`,JSON.stringify(st,null,2));records.push({targetSecond:seconds,actualSecond:Number(elapsed.toFixed(2)),label,mode:st.mode,strikes:st.strikes,stable:st.modules.filter(m=>m.complete).length,events:st.evidence.events.length});console.log(seconds,label,st.mode)}
try{
await p.goto('http://localhost:5262');await p.locator('#start').click();await p.waitForTimeout(1500);zero=Date.now();
await at(0,async()=>{await p.locator('#manual-toggle').click()},'read-manual');
await at(10,async()=>{await p.locator('#close-manual').click();await p.locator('[data-module="valves"]').click();await p.waitForTimeout(500);await p.locator('[data-control="large"]').click();assert.equal((await state()).strikes,1)},'wrong-order-vent');
await at(20,async()=>{await p.locator('#recover').click();await p.locator('[data-control="small"]').click();await p.locator('[data-control="large"]').click();assert.equal((await state()).modules[0].complete,true)},'recover-valves');
// Settle the front-facing camera before the physical cable drag at 30s.
await p.locator('[data-module="cable"]').click();await p.waitForTimeout(2300);
await at(30,async()=>{await p.mouse.move(544,562);await p.mouse.down();await p.mouse.move(461,422,{steps:12});await p.mouse.up();assert.equal((await state()).modules[1].world.connected,'square')},'physical-cable');
await at(40,async()=>{await p.locator('[data-control="clip-a"]').click();await p.locator('[data-control="clip-b"]').click();await p.locator('[data-control="test"]').click();assert.equal((await state()).modules[1].complete,true)},'patch-stable');
await at(50,async()=>{await p.locator('[data-module="switches"]').click();await p.locator('[data-control="left"]').click();await p.locator('[data-control="test"]').click();assert.equal((await state()).mode,'ready')},'ready-startup');
await at(60,async()=>{await p.locator('#engine-start').click();assert.equal((await state()).mode,'won')},'festival-online');
}catch(e){records.push({error:String(e)});console.log(e.stack);try{await p.screenshot({path:`${dir}/failure.png`})}catch{}}
finally{await fs.writeFile(`${dir}/sequence.json`,JSON.stringify({recordedAt:new Date().toISOString(),records,errors},null,2));await b.close();console.log(JSON.stringify({records,errors},null,2))}
