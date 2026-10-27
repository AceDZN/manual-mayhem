import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
try {
const p=await b.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1});p.on('pageerror',e=>console.log('ERROR',String(e)));p.on('console',m=>console.log('LOG',m.type(),m.text().slice(0,150)));
await p.goto('http://localhost:5262',{waitUntil:'domcontentloaded',timeout:15000});console.log('GOTO');
console.log('DOM',await p.locator('body').innerText({timeout:15000}));
console.log('START',await p.locator('#start').boundingBox({timeout:15000}));
await p.screenshot({path:'docs/qa/diagnosis.png',timeout:15000});console.log('SHOT');
} finally {await b.close();}
