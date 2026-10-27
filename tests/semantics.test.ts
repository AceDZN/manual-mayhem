import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, PAIRED_STARTUP, type Mission } from '../src/content';
import { act, choose, createState, resetModule } from '../src/rules';

// Authored independently from the evaluator's nextActions helper: these are
// readings of each displayed manual, not a traversal of its implementation.
const SOLUTIONS: Record<string, Record<string, string[]>> = {
  'g7-guided': {valves:['small-close','large-open'],cable:['connect-square','clip-a','clip-b','test'],switches:['left-on','test']},
  'g7-independent': {valves:['large-open','small-close'],cable:['connect-round','clip-b','clip-a','test'],switches:['right-on','test']},
  'g7-transfer': {valves:['small-open','large-close'],cable:['clip-b','clip-a','connect-round','test'],switches:['right-on','left-on','test']},
  'g8-guided': {valves:['small-close','large-open'],cable:['connect-square','clip-b','clip-a','test'],switches:['left-on','test']},
  'g8-independent': {valves:['large-open','small-close'],cable:['clip-b','clip-a','connect-square','test'],switches:['right-on','test']},
  'g8-transfer': {valves:['small-open','large-close'],cable:['clip-a','clip-b','connect-round','test'],switches:['left-on','test']},
  'g9-guided': {valves:['small-open','test','small-close','test','small-open','test'],cable:['connect-square','clip-a','clip-b','test'],switches:['fan-on','test']},
  'g9-independent': {valves:['large-open','small-close'],cable:['connect-round','clip-b','clip-a','test'],switches:['tag-left','right-on','test']},
  'g9-transfer': {valves:['small-close','large-open'],cable:['clip-a','clip-b','connect-round','test'],switches:['fan-on','test']}
};
function mission(id:string):Mission {const m=MISSIONS.find(m=>m.id===id);assert.ok(m,`missing ${id}`);return m;}
function world(s:ReturnType<typeof createState>,id:string){const mod=s.modules.find(m=>m.id===id);assert.ok(mod);return mod.world;}
function solve(m:Mission){const s=createState(m);for(const [id,actions] of Object.entries(SOLUTIONS[m.id]))for(const a of actions)assert.equal(act(s,m,id,a),true,`${m.id}/${id}/${a}`);if(m.relay)assert.equal(choose(s,m,'relay',m.relay.correct),true);if(m.prediction)assert.equal(choose(s,m,'prediction',m.prediction.correct),true);return s;}

test('three authored stages per grade and three tangible families per mission',()=>{
  assert.equal(MISSIONS.length,9);assert.equal(new Set(MISSIONS.map(m=>m.id)).size,9);
  for(const grade of [7,8,9])assert.deepEqual(MISSIONS.filter(m=>m.grade===grade).map(m=>m.stage),['guided','independent','transfer']);
  for(const m of MISSIONS){assert.deepEqual(m.modules.map(x=>x.family),['valves','cable','switches']);for(const v of m.modules){assert.ok(v.manual.length>20);assert.ok(v.translation);assert.ok(v.feedback);}}
});
for(const m of MISSIONS)test(`${m.id}: independently read solution reaches startup readiness`,()=>{
  const s=solve(m);assert.equal(s.status,'ready');assert.equal(s.strikes,0);assert.ok(s.modules.every(x=>x.complete));assert.ok(s.events.every(e=>e.correct));
  assert.equal(s.events.some(e=>e.retry>0),false);assert.equal(s.assisted,m.stage==='guided');
});
test('G7 same initial valves: before contrast reverses the first valid action',()=>{
  const a=mission('g7-guided'),b=mission('g7-independent');assert.deepEqual(a.modules[0].initial,b.modules[0].initial);
  const sa=createState(a),sb=createState(b);assert.equal(act(sa,a,'valves','small-close'),true);assert.equal(act(sb,b,'valves','small-close'),false);
  const sa2=createState(a),sb2=createState(b);assert.equal(act(sa2,a,'valves','large-open'),false);assert.equal(act(sb2,b,'valves','large-open'),true);
});
test('G7 prohibition changes the working lever; shape reference changes socket',()=>{
  const a=mission('g7-guided'),b=mission('g7-independent');
  for(const [action,id] of [['left-on','switches'],['connect-square','cable']]){const x=createState(a),y=createState(b);assert.equal(act(x,a,id,action),true);assert.equal(act(y,b,id,action),false);}
  for(const [action,id] of [['right-on','switches'],['connect-round','cable']]){const x=createState(a),y=createState(b);assert.equal(act(x,a,id,action),false);assert.equal(act(y,b,id,action),true);}
});
test('G7 negative RESET stays prohibited and causes a recoverable strike',()=>{
  const m=mission('g7-independent'),s=createState(m);assert.equal(act(s,m,'switches','reset'),false);assert.equal(s.strikes,1);assert.equal(s.modules[2].fault,true);assert.ok(s.feedback.includes('do not'));
  assert.equal(act(s,m,'switches','right-on'),false);resetModule(s,m,'switches');assert.equal(s.strikes,1);assert.equal(s.retries,1);assert.equal(s.modules[2].fault,false);assert.equal(act(s,m,'switches','right-on'),true);assert.equal(s.events.at(-1)?.retry,1);
});
test('G8 passive by-agent swaps actual receiver mapping without changing initial appearance',()=>{
  const a=mission('g8-guided'),b=mission('g8-independent');assert.deepEqual(a.modules[2].initial,b.modules[2].initial);
  const x=createState(a),y=createState(b);assert.equal(act(x,a,'switches','left-on'),true);assert.equal(world(x,'switches').receiver,'cooling line');assert.equal(act(y,b,'switches','left-on'),false);
  const xx=createState(a),yy=createState(b);assert.equal(act(xx,a,'switches','right-on'),false);assert.equal(act(yy,b,'switches','right-on'),true);assert.equal(world(yy,'switches').receiver,'cooling line');
});
test('G8 before/after changes cable-first versus clips-first outcome',()=>{
  const a=mission('g8-guided'),b=mission('g8-independent');assert.deepEqual(a.modules[1].initial,b.modules[1].initial);
  const x=createState(a),y=createState(b);assert.equal(act(x,a,'cable','connect-square'),true);assert.equal(act(y,b,'cable','connect-square'),false);
  const xx=createState(a),yy=createState(b);assert.equal(act(xx,a,'cable','clip-a'),false);assert.equal(act(yy,b,'cable','clip-a'),true);
});
test('both clip orders are semantically permitted within a stated both-clips step',()=>{
  const m=mission('g8-independent');for(const order of [['clip-a','clip-b'],['clip-b','clip-a']]){const s=createState(m);for(const a of [...order,'connect-square','test'])assert.equal(act(s,m,'cable',a),true);assert.equal(s.modules[1].complete,true);}
});
test('G8 transfer requested receiver differs from remembered cooling-line action',()=>{
  const a=mission('g8-independent'),b=mission('g8-transfer');const x=createState(a),y=createState(b);assert.equal(act(x,a,'switches','right-on'),true);assert.equal(act(y,b,'switches','right-on'),false);const yy=createState(b);assert.equal(act(yy,b,'switches','left-on'),true);assert.equal(world(yy,'switches').receiver,'music line');
});
test('G9 zero-conditional pressure rule repeats open, closed, open',()=>{
  const m=mission('g9-guided'),s=createState(m);assert.equal(world(s,'valves').pressure,1);
  for(const [a,pressure] of [['small-open',3],['test',3],['small-close',1],['test',1],['small-open',3],['test',3]] as const){assert.equal(act(s,m,'valves',a),true);assert.equal(world(s,'valves').pressure,pressure);}
  assert.equal(s.modules[0].complete,true);assert.match(m.modules[0].manual,/Fixed rule/);assert.match(m.modules[0].manual,/Calibration targets: three, one, three/);assert.doesNotMatch(m.modules[0].manual,/Open it and TEST|Close it and TEST/);
});
test('G9 past-passive record identifies replaced relay; explicit current check governs work',()=>{
  const m=mission('g9-independent');assert.match(m.modules[2].manual,/left relay was replaced/);assert.match(m.modules[2].manual,/left relay still fails; the right relay works/);
  const s=createState(m);assert.equal(act(s,m,'switches','left-on'),false);assert.equal(world(s,'switches').left,false);const t=createState(m);assert.equal(act(t,m,'switches','right-on'),false);const tagged=createState(m);assert.equal(act(tagged,m,'switches','tag-left'),true);assert.equal(world(tagged,'switches').maintenanceTag,'left');assert.equal(act(tagged,m,'switches','right-on'),true);assert.equal(world(tagged,'switches').left,false);assert.equal(world(tagged,'switches').right,true);const wrongReceiver=createState(m);assert.equal(act(wrongReceiver,m,'switches','tag-right'),false);
});
test('G9 this-startup prediction has a tangible stopped and prevented branch',()=>{
  const m=mission('g9-transfer'),s=createState(m);assert.equal(world(s,'switches').pressure,3);assert.equal(act(s,m,'switches','test'),false);assert.equal(world(s,'switches').pressure,5);assert.equal(world(s,'switches').signal,'stopped');
  const t=createState(m);assert.equal(act(t,m,'switches','fan-on'),true);assert.equal(act(t,m,'switches','test'),true);assert.equal(world(t,'switches').pressure,3);assert.equal(world(t,'switches').fan,true);assert.equal(world(t,'switches').left,false);assert.equal(world(t,'switches').right,false);
});
test('G9 paired startup reverses fan plan and generic world rule without mission-ID coupling',()=>{
  const base=mission('g9-transfer');const m:Mission={...base,id:'independent-condition-check',modules:[PAIRED_STARTUP],relay:undefined,prediction:undefined};
  assert.equal(PAIRED_STARTUP.family,'switches');assert.match(PAIRED_STARTUP.manual,/Stop the fan before TEST/);
  const wrong=createState(m);assert.equal(world(wrong,'switches').fan,true);assert.equal(act(wrong,m,'switches','test'),false);assert.equal(world(wrong,'switches').pressure,5);assert.equal(world(wrong,'switches').signal,'stopped');
  const safe=createState(m);assert.equal(act(safe,m,'switches','fan-off'),true);assert.equal(act(safe,m,'switches','test'),true);assert.equal(world(safe,'switches').pressure,4);assert.equal(world(safe,'switches').fan,false);assert.equal(safe.status,'ready');
  const oldPlan=createState(m);assert.equal(act(oldPlan,m,'switches','fan-on'),false);
});
test('relay choice preserves procedure/order/prohibition and wrong relay is assisted evidence',()=>{
  const m=mission('g9-transfer'),s=createState(m);assert.match(m.relay!.options[m.relay!.correct],/before TEST; leave both relays off/);assert.equal(choose(s,m,'relay',0),false);assert.equal(s.relay,false);assert.equal(s.assisted,true);assert.equal(choose(s,m,'relay',1),true);assert.equal(s.events.at(-1)?.assisted,true);
});
test('three mistakes shut down; no action silently repairs after shutdown',()=>{
  const m=mission('g7-independent'),s=createState(m);for(const id of ['valves','cable','switches'])assert.equal(act(s,m,id,'reset'),false);assert.equal(s.status,'shutdown');assert.equal(s.strikes,3);assert.equal(act(s,m,'valves','large-open'),false);resetModule(s,m,'valves');assert.equal(s.status,'shutdown');assert.equal(s.strikes,3);
});
test('relay cannot revive a shut-down machine or change post-startup evidence',()=>{
  const m=mission('g9-transfer'),s=createState(m);for(const id of ['valves','cable','switches'])act(s,m,id,'reset');const count=s.events.length;assert.equal(choose(s,m,'relay',m.relay!.correct),false);assert.equal(s.status,'shutdown');assert.equal(s.events.length,count);assert.equal(s.relay,false);
  const t=solve(m);assert.equal(t.status,'ready');assert.equal(choose(t,m,'relay',0),false);assert.equal(t.assisted,false);
});
test('fresh restart state is independent of prior mutated attempt',()=>{
  const m=mission('g8-transfer'),s=createState(m);act(s,m,'valves','small-open');const fresh=createState(m);assert.equal(world(fresh,'valves').small,false);assert.equal(fresh.strikes,0);assert.equal(fresh.events.length,0);assert.equal(fresh.retries,0);
});
