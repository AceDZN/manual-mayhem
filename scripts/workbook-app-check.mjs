import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const BASE=process.env.WORKBOOK_APP_URL||'http://127.0.0.1:4218';
const OUT=process.env.WORKBOOK_APP_OUTPUT||'docs/qa/workbook-app';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const errors=[],requests=[],results=[];
async function setup(options={}){
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,...options});
 await context.addInitScript(()=>{window.__mmMessages=[];window.addEventListener('message',e=>{if(e.data?.source==='workbook-game'&&e.data.slug==='manual-mayhem')window.__mmMessages.push({data:e.data,origin:e.origin,fromFrame:e.source===document.querySelector('iframe[title="בלגן לפי המדריך"]')?.contentWindow});});});
 const page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/play/manual-mayhem/'))requests.push({url:r.url(),status:r.status()});});
 return {context,page};
}
async function essentialOnly(page){
 const choice=page.getByRole('button',{name:/חיוניות בלבד/}).first();
 if(await choice.isVisible())await choice.click();
}
async function frame(page){
 await page.waitForFunction(()=>window.__mmMessages.some(m=>m.data.type==='ready'));
 const f=page.frames().find(f=>f.url().includes('/play/manual-mayhem/')&&f.url().includes('index.html'));
 assert.ok(f);assert.equal(new URL(f.url()).origin,new URL(BASE).origin);
 await f.waitForFunction(()=>typeof window.render_game_to_text==='function');return f;
}
const state=async f=>JSON.parse(await f.evaluate(()=>window.render_game_to_text()));
async function firstWin(f,touch=false){
 const click=async s=>touch?f.locator(s).tap():f.locator(s).click();
 await click('#levels');await click('[data-level="1"]');
 if(await f.locator('#start').isVisible())await click('#start');else await click('#operate');
 await click('#controls-toggle');await click('[data-control="small"]');
 assert.equal((await state(f)).mode,'ready');await click('#engine-start');assert.equal((await state(f)).mode,'won');
}
try{
 const {context,page}=await setup();
 await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:180000});
 const card=page.locator('a[href="/manual-mayhem"]').first();await card.waitFor();await essentialOnly(page);assert.match(await card.innerText(),/30/);await card.click();
 await page.waitForURL('**/manual-mayhem');assert.equal(await page.locator('[id^="level-"]').count(),30);
 const lessons=await page.locator('a[href*="english.workbook.co.il/grade-"]').evaluateAll(xs=>[...new Set(xs.map(x=>x.href).filter(x=>/\/grade-\d+\/chapter-\d+\/[^/]+$/.test(x)))]);
 assert.equal(lessons.length,8);await page.screenshot({path:OUT+'/desktop-game-page.png',fullPage:false});results.push({check:'Workbook home card→detail,30levels/eight unique lesson links',status:'pass'});
 await page.goto(BASE+'/manual-mayhem?level=24',{waitUntil:'domcontentloaded',timeout:180000});
 await page.locator('#level-24[data-requested="true"]').waitFor();await page.locator('#level-24 a[href="/manual-mayhem/play?level=24"]').click();
 const f=await frame(page);let s=await state(f);assert.equal(s.mission.level,24);assert.equal(s.campaign.completed.length,0);assert.equal(await f.locator('#grade,#mission').count(),0);assert.equal(await f.locator('#start').isVisible(),true);assert.match(s.manual.text,/Fixed rule/);
 await page.getByText('טוענים את בלגן לפי המדריך…',{exact:true}).waitFor({state:'hidden'});await page.screenshot({path:OUT+'/desktop-linked-level24.png'});results.push({check:'Lesson24 play link→same-origin public released iframe, realready, no invented earlier completions',status:'pass'});
 await essentialOnly(page);await firstWin(f);await page.waitForFunction(()=>window.__mmMessages.filter(m=>m.data.type==='level-complete'&&m.data.level===1).length===1);const messages=await page.evaluate(()=>window.__mmMessages);assert.equal(messages.filter(m=>m.data.type==='level-complete'&&m.data.level===1).length,1);assert.ok(messages.every(m=>m.origin===new URL(BASE).origin&&m.fromFrame));await page.screenshot({path:OUT+'/desktop-real-win.png'});results.push({check:'Actual Workbook player L1 action→engine win, exact received completion',status:'pass'});
 await f.locator('#retry-win').click();await f.locator('#operate').click();await f.locator('#controls-toggle').click();await f.locator('[data-control="small"]').click();await f.locator('#engine-start').click();await page.waitForFunction(()=>window.__mmMessages.filter(m=>m.data.type==='level-complete'&&m.data.level===1).length===2);assert.equal((await page.evaluate(()=>window.__mmMessages)).filter(m=>m.data.type==='level-complete'&&m.data.level===1).length,2);await f.locator('#next').click();assert.equal((await state(f)).mission.level,2);assert.equal((await page.evaluate(()=>window.__mmMessages)).filter(m=>m.data.type==='level-start'&&m.data.level===2).length,0);results.push({check:'Real retry completion once; Next2 waits operation',status:'pass'});await context.close();
 const mobile=await setup({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.page.goto(BASE+'/manual-mayhem/play?level=30',{waitUntil:'domcontentloaded',timeout:180000});const mf=await frame(mobile.page);await essentialOnly(mobile.page);s=await state(mf);assert.equal(s.mission.level,30);assert.equal(s.campaign.completed.length,0);assert.equal(await mf.locator('#start').isVisible(),true);assert.equal(await mobile.page.getByText('סובבו את הטלפון לרוחב',{exact:true}).isVisible(),false);await mobile.page.screenshot({path:OUT+'/mobile-linked-level30.png'});await firstWin(mf,true);await mobile.page.screenshot({path:OUT+'/mobile-real-win.png'});results.push({check:'390px portrait lesson30 loads without rotate gate; genuine touch L1 win',status:'pass'});await mobile.context.close();
 assert.deepEqual(requests.filter(r=>r.status>=400),[]);assert.deepEqual(errors,[]);
 await fs.writeFile(OUT+'/results.json',JSON.stringify({base:BASE,results,errors,requests},null,2));console.log('Workbook app5/5 checks passed');
}catch(e){await fs.writeFile(OUT+'/failure.json',JSON.stringify({base:BASE,results,errors,requests,error:String(e)},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
