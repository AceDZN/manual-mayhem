import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAMPAIGN } from '../src/campaign';
import { act, choose, createState, resetModule } from '../src/rules';
import { readProgress, selectLevel, completeLevel, LEVEL_COUNT } from '../src/campaign-progress';
interface Solution {level:number;modules:Record<string,string[]>;relay?:number;prediction?:number;}
const SOLUTIONS=(JSON.parse(readFileSync(new URL('../docs/qa/campaign/solutions.json',import.meta.url),'utf8')) as {levels:Solution[]}).levels;
const level=(n:number)=>{const m=CAMPAIGN.find(x=>x.level===n);assert.ok(m);return m};
const solution=(n:number)=>{const v=SOLUTIONS.find(x=>x.level===n);assert.ok(v);return v};
const moduleState=(s:ReturnType<typeof createState>,id:string)=>{const v=s.modules.find(x=>x.id===id);assert.ok(v);return v};
function solve(n:number){const m=level(n),s=createState(m),v=solution(n);for(const [id,actions]of Object.entries(v.modules))for(const a of actions)assert.equal(act(s,m,id,a),true,`L${n}/${id}/${a}`);if(v.prediction!==undefined)assert.equal(choose(s,m,'prediction',v.prediction),true,`L${n} prediction`);if(v.relay!==undefined)assert.equal(choose(s,m,'relay',v.relay),true,`L${n} relay`);return s}

test('campaign is exactly30 consecutive authored levels with finite internal provenance',()=>{
 assert.equal(LEVEL_COUNT,30);assert.equal(CAMPAIGN.length,30);assert.equal(SOLUTIONS.length,30);
 assert.deepEqual(CAMPAIGN.map(m=>m.level),Array.from({length:30},(_,i)=>i+1));
 assert.equal(new Set(CAMPAIGN.map(m=>m.id)).size,30);
 const procedures=CAMPAIGN.map(m=>m.modules.filter(x=>m.activeModules?.includes(x.id)).map(x=>x.manual).join('|'));
 assert.equal(new Set(procedures).size,30,'different procedures, not serial/timer-only variants');
 for(const m of CAMPAIGN){assert.ok(m.chapter&&m.skill&&m.sourceModules.length);assert.deepEqual(Object.keys(solution(m.level).modules).sort(),[...(m.activeModules||[])].sort());}
});
for(let n=1;n<=30;n++)test(`level${n}: independent manual-derived solution reaches readiness`,()=>{
 const s=solve(n),m=level(n);assert.equal(s.status,'ready');assert.equal(s.strikes,0);assert.equal(s.retries,0);assert.ok(s.events.every(e=>e.correct));assert.equal(s.assisted,m.stage==='guided');assert.ok(s.modules.filter(x=>x.active).every(x=>x.complete));
});
test('first six levels introduce one then two physical families before all three',()=>{
 assert.deepEqual(CAMPAIGN.slice(0,7).map(m=>m.activeModules?.length),[1,1,1,2,2,2,3]);assert.deepEqual(CAMPAIGN.slice(0,3).map(m=>m.activeModules),[['valves'],['cable'],['switches']]);
 assert.ok(level(12).relay);assert.ok(solution(21).modules.switches.includes('tag-left'));assert.ok(level(24).modules[0].pressureRule);assert.ok(level(26).modules[0].pressureRule);assert.ok(level(27).prediction);assert.ok(level(30).relay&&level(30).prediction&&level(30).modules[0].pressureRule&&level(30).modules[2].startup);
});
test('inactive bays cannot strike, emit learning events, change world or consume retries',()=>{
 for(let n=1;n<=6;n++){const m=level(n),s=createState(m);assert.equal(s.modules.filter(x=>x.active&&x.complete).length,0);for(const mod of s.modules.filter(x=>!x.active)){const before=structuredClone(mod.world);assert.equal(act(s,m,mod.id,'reset'),false);resetModule(s,m,mod.id);assert.deepEqual(mod.world,before);assert.equal(s.events.length,0);assert.equal(s.strikes,0);assert.equal(s.retries,0);}assert.equal(s.status,'playing');}
 const s=solve(1);assert.equal(s.status,'ready');assert.equal(s.events.length,1);assert.deepEqual(s.events.map(e=>e.module),['valves']);
});
test('before contrast reverses first action on the same initial valve state',()=>{
 const a=level(4),b=level(5);assert.deepEqual(a.modules[0].initial,b.modules[0].initial);
 for(const [action,goodA,goodB]of [['small-close',true,false],['large-open',false,true]] as const){assert.equal(act(createState(a),a,'valves',action),goodA);assert.equal(act(createState(b),b,'valves',action),goodB);}
});
test('shape reference changes the valid socket and no color-only route is used',()=>{
 const a=level(2),b=level(4);assert.deepEqual(a.modules[1].initial,b.modules[1].initial);for(const [action,goodA,goodB]of [['connect-square',true,false],['connect-round',false,true]]as const){assert.equal(act(createState(a),a,'cable',action),goodA);assert.equal(act(createState(b),b,'cable',action),goodB);}
});
test('before/after changes connection-first versus clips-first for identical square hardware',()=>{
 const a=level(11),b=level(12);assert.deepEqual(a.modules[1].initial,b.modules[1].initial);assert.equal(act(createState(a),a,'cable','connect-square'),true);assert.equal(act(createState(b),b,'cable','connect-square'),false);assert.equal(act(createState(a),a,'cable','clip-a'),false);assert.equal(act(createState(b),b,'cable','clip-a'),true);
});
test('both-clips wording allows either order; explicitly named order does not',()=>{
 for(const order of [['clip-a','clip-b'],['clip-b','clip-a']]){const m=level(6),s=createState(m);for(const a of [...order,'connect-square','test'])assert.equal(act(s,m,'cable',a),true);}
 const m=level(18),s=createState(m);assert.match(m.modules[1].manual,/clip A before clip B/);assert.equal(act(s,m,'cable','connect-round'),true);assert.equal(act(s,m,'cable','clip-b'),false);
});
test('an already-closed clip and an already-connected cable change required work',()=>{
 const a=level(10),sa=createState(a);assert.equal(moduleState(sa,'cable').world.clipB,true);assert.equal(act(sa,a,'cable','connect-round'),true);assert.equal(act(sa,a,'cable','clip-b'),false);
 const b=level(17),sb=createState(b);assert.equal(moduleState(sb,'cable').world.connected,'square');assert.equal(act(sb,b,'cable','connect-square'),false);const t=createState(b);for(const x of ['clip-b','clip-a','test'])assert.equal(act(t,b,'cable',x),true);
});
test('present-passive mapping chooses different agents for the same music receiver',()=>{
 const a=level(11),b=level(15);assert.deepEqual(a.modules[2].initial,b.modules[2].initial);
 const sa=createState(a),sb=createState(b);assert.equal(act(sa,a,'switches','left-on'),true);assert.equal(moduleState(sa,'switches').world.receiver,'music line');assert.equal(act(sb,b,'switches','left-on'),false);
 const ta=createState(a),tb=createState(b);assert.equal(act(ta,a,'switches','right-on'),false);assert.equal(act(tb,b,'switches','right-on'),true);assert.equal(moduleState(tb,'switches').world.receiver,'music line');
});
test('past-passive receiver tag changes while explicit current check determines operation',()=>{
 const a=level(21),b=level(22);const sa=createState(a),sb=createState(b);assert.equal(act(sa,a,'switches','tag-left'),true);assert.equal(act(sb,b,'switches','tag-left'),false);const t=createState(b);assert.equal(act(t,b,'switches','tag-right'),true);assert.equal(act(t,b,'switches','left-on'),true);assert.equal(moduleState(t,'switches').world.maintenanceTag,'right');assert.equal(moduleState(t,'switches').world.right,false);
});
test('same past replacement record cannot predict current working relay',()=>{
 const a=level(21),b=level(23);assert.match(a.modules[2].manual,/left relay was replaced/);assert.match(b.modules[2].manual,/left relay was replaced/);for(const m of[a,b]){const s=createState(m);assert.equal(act(s,m,'switches','tag-left'),true);assert.equal(act(s,m,'switches','right-on'),m.level===21);}const s=createState(b);act(s,b,'switches','tag-left');assert.equal(act(s,b,'switches','left-on'),true);
});
test('fixed rules repeat three target readings and a reversed rule changes the valid valve',()=>{
 for(const [n,expected]of [[24,[3,1,3]],[25,[2,4,2]],[30,[3,1,3]]]as const){const m=level(n),s=createState(m),seen:number[]=[];for(const a of solution(n).modules.valves){assert.equal(act(s,m,'valves',a),true);if(a==='test')seen.push(Number(moduleState(s,'valves').world.pressure));}assert.deepEqual(seen,[...expected]);}
 assert.equal(act(createState(level(24)),level(24),'valves','large-open'),false);assert.equal(act(createState(level(25)),level(25),'valves','small-open'),false);
});
test('joint valve rule produces all four condition-dependent readings',()=>{
 const m=level(26),s=createState(m),seen:number[]=[];assert.equal(moduleState(s,'valves').world.pressure,1);for(const a of solution(26).modules.valves){assert.equal(act(s,m,'valves',a),true);if(a==='test')seen.push(Number(moduleState(s,'valves').world.pressure));}assert.deepEqual(seen,[2,4,3,1]);assert.equal(moduleState(s,'valves').world.small,false);assert.equal(moduleState(s,'valves').world.large,false);
});
test('specific future startup rules stop at5/6 and opposite fan plans prevent them',()=>{
 for(const [n,stop,safe]of[[27,5,3],[28,5,4],[29,6,4],[30,6,4]]){const m=level(n),wrong=createState(m);assert.equal(act(wrong,m,'switches','test'),false);assert.equal(moduleState(wrong,'switches').world.pressure,stop);assert.equal(moduleState(wrong,'switches').world.signal,'stopped');const s=createState(m);for(const a of solution(n).modules.switches)assert.equal(act(s,m,'switches',a),true);assert.equal(moduleState(s,'switches').world.pressure,safe);assert.equal(moduleState(s,'switches').world.fan,n===27||n===29);}
});
test('reviewed relays preserve the full actionable constraint rather than source decoration',()=>{
 const a=level(14),s=createState(a);assert.equal(choose(s,a,'relay',solution(14).relay!),true);assert.match(a.relay!.options[solution(14).relay!],/both clips.*round.*TEST.*not use square/i);assert.equal(a.relay!.options[solution(14).relay!].includes('orange'),false);
 for(const n of[28,29,30]){const m=level(n),text=m.relay!.options[solution(n).relay!];assert.match(text,/before TEST/i);assert.match(text,n===28?/five.*stop/i:/six.*stop/i);assert.match(text,n===30?/right.*off.*working left/i:/relays off/i);}
 const wrong=createState(level(30));assert.equal(choose(wrong,level(30),'relay',0),false);assert.equal(wrong.assisted,true);
});
test('fault recovery retains strikes and retry evidence; repeated brute force cannot appear unaided',()=>{
 const m=level(5),s=createState(m);assert.equal(act(s,m,'valves','small-close'),false);assert.equal(s.strikes,1);resetModule(s,m,'valves');assert.equal(s.strikes,1);assert.equal(s.retries,1);assert.equal(act(s,m,'valves','large-open'),true);assert.equal(s.events.at(-1)?.retry,1);
});
test('campaign unlocks consecutively, preserves replay unlocks and sanitizes forged jumps',()=>{
 let p=readProgress(null);assert.equal(p.currentLevel,1);assert.equal(p.highestUnlocked,1);assert.equal(selectLevel(p,30),p);assert.equal(completeLevel(p,2,{strikes:0,retries:0,assisted:false}),p);
 for(let n=1;n<=30;n++){p=completeLevel(p,n,{strikes:0,retries:0,assisted:false});assert.equal(p.highestUnlocked,Math.min(30,n+1));assert.equal(p.currentLevel,Math.min(30,n+1));}
 assert.equal(Object.keys(p.completed).length,30);const replay=selectLevel(p,1);assert.equal(replay.currentLevel,1);assert.equal(replay.highestUnlocked,30);assert.equal(readProgress(replay).currentLevel,1);
 const forged=readProgress({version:1,currentLevel:30,highestUnlocked:30,completed:{30:{strikes:0,retries:0,assisted:false}}});assert.equal(forged.highestUnlocked,1);assert.equal(forged.currentLevel,1);
});
