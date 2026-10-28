import test from 'node:test';
import assert from 'node:assert/strict';
import { isWorkbookParentOrigin, parseLevelParam, initHost, postToHost, WorkbookSession, type HostMessage } from '../src/host';

// Independent consumer contract: packages/workbook-games game-player.tsx and
// docs/games/PLAN.md §4.1–4.2, read from the receiving Workbook application.
const fixture=(count=30)=>{const messages:HostMessage[]=[];return{messages,session:new WorkbookSession(m=>messages.push(m),count)}};

test('lesson links accept every public one-based level without a grade gate',()=>{
 for(let n=1;n<=30;n++)for(const grade of [7,8,9])assert.equal(parseLevelParam(`?level=${n}&grade=${grade}`,30),n);
 assert.equal(parseLevelParam('?level=30&manual=0',30),30);
});
test('absent, fractional, scientific, signed and out-of-range levels are ignored',()=>{
 for(const q of ['', '?other=2','?level=','?level=0','?level=31','?level=-1','?level=+2','?level=2.0','?level=2.2','?level=2e0','?level=NaN','?level=Infinity','?level=text','?level=%202','?level=2%20','?level=0x10','?level=99999999999999999999999999999'])assert.equal(parseLevelParam(q,30),null,q);
});
test('level parsing respects a smaller catalog and rejects an invalid count',()=>{
 assert.equal(parseLevelParam('?level=3',3),3);assert.equal(parseLevelParam('?level=4',3),null);
 for(const count of [0,-1,1.5,NaN,Infinity])assert.equal(parseLevelParam('?level=1',count),null);
 // Standard URLSearchParams first-value behavior prevents a later duplicate
 // from silently elevating a level chosen by the first parameter.
 assert.equal(parseLevelParam('?level=1&level=30',30),1);
});
test('only exact Workbook HTTPS origins and loopback HTTP parents are allowed',()=>{
 for(const origin of ['https://workbook.co.il','https://english.workbook.co.il','https://english-games.workbook.co.il','https://preview.english-games.workbook.co.il','http://localhost','http://localhost:4017','http://127.0.0.1','http://127.0.0.1:4262'])assert.equal(isWorkbookParentOrigin(origin),true,origin);
 for(const origin of ['https://workbook.co.il.evil.test','https://notworkbook.co.il','https://evil-workbook.co.il','https://evil.test/workbook.co.il','https://workbook.co.il@evil.test','http://workbook.co.il','https://localhost:4017','http://localhost.evil.test:4017','http://127.0.0.1.evil.test','https://english.workbook.co.il:444','https://workbook.co.il/path','https://workbook.co.il?next=x','null','*','about:blank','//workbook.co.il',''])assert.equal(isWorkbookParentOrigin(origin),false,origin);
});
test('ready is a single event and does not invent a started level',()=>{
 const{session,messages}=fixture();assert.deepEqual(messages,[]);session.markReady();session.markReady();assert.deepEqual(messages,[{type:'ready'}]);
});
test('early actual play is queued and ready arrives before start and completion',()=>{
 const{session,messages}=fixture();session.startLevel(30);session.completeLevel(30,1234.6);assert.deepEqual(messages,[]);session.markReady();assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:30},{type:'level-complete',level:30,durationMs:1235}]);
});
test('queue preserves multiple genuinely played levels in order',()=>{
 const{session,messages}=fixture();session.startLevel(1);session.completeLevel(1,10);session.startLevel(2);session.completeLevel(2,20);session.markReady();session.markReady();assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:1},{type:'level-complete',level:1,durationMs:10},{type:'level-start',level:2},{type:'level-complete',level:2,durationMs:20}]);
});
test('repeated start and success frames cannot duplicate an attempt',()=>{
 const{session,messages}=fixture();session.markReady();session.startLevel(1);session.startLevel(1);session.completeLevel(1,10.2);session.completeLevel(1,90);session.startLevel(1);assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:1},{type:'level-complete',level:1,durationMs:10}]);
});
test('reset permits a genuine replay without fabricating success',()=>{
 const{session,messages}=fixture();session.markReady();session.startLevel(2);session.resetLevel();assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:2}]);session.startLevel(2);session.completeLevel(2,80);assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:2},{type:'level-start',level:2},{type:'level-complete',level:2,durationMs:80}]);
});
test('reset ordering remains genuine even before assets become ready',()=>{
 const{session,messages}=fixture();session.startLevel(3);session.resetLevel();session.startLevel(3);session.completeLevel(3,300);session.markReady();assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:3},{type:'level-start',level:3},{type:'level-complete',level:3,durationMs:300}]);
});
test('premature or mismatched completions do not consume the actual attempt',()=>{
 const{session,messages}=fixture();session.completeLevel(1,1);session.markReady();session.completeLevel(1,1);session.startLevel(2);session.completeLevel(1,1);session.completeLevel(3,1);session.completeLevel(2,42);assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:2},{type:'level-complete',level:2,durationMs:42}]);
});
test('invalid durations do not consume success; zero and rounded times are valid',()=>{
 const{session,messages}=fixture();session.markReady();session.startLevel(1);for(const d of [-1,NaN,Infinity,-Infinity])session.completeLevel(1,d);assert.equal(messages.length,2);session.completeLevel(1,0);session.resetLevel();session.startLevel(1);session.completeLevel(1,9.5);assert.deepEqual(messages.slice(-3),[{type:'level-complete',level:1,durationMs:0},{type:'level-start',level:1},{type:'level-complete',level:1,durationMs:10}]);
});
test('invalid levels cannot replace a valid active attempt',()=>{
 const{session,messages}=fixture();session.markReady();session.startLevel(1);for(const n of [0,31,-1,1.5,NaN,Infinity]){session.startLevel(n);session.completeLevel(n,2);}session.completeLevel(1,2);assert.deepEqual(messages,[{type:'ready'},{type:'level-start',level:1},{type:'level-complete',level:1,durationMs:2}]);
});
test('session default supports level30 and a smaller catalog rejects extra levels',()=>{
 const a=fixture();a.session.markReady();a.session.startLevel(30);a.session.completeLevel(30,30);a.session.startLevel(31);assert.deepEqual(a.messages,[{type:'ready'},{type:'level-start',level:30},{type:'level-complete',level:30,durationMs:30}]);const b=fixture(3);b.session.markReady();b.session.startLevel(4);b.session.startLevel(3);b.session.completeLevel(3,3);assert.deepEqual(b.messages,[{type:'ready'},{type:'level-start',level:3},{type:'level-complete',level:3,durationMs:3}]);
});

type FakeEvent={message?:unknown;reason?:unknown};
function adapterFixture(origin:string|null,standalone=false,referrer=''){
 const calls:Array<{message:unknown;origin:string}>=[],listeners=new Map<string,Array<(e:FakeEvent)=>void>>();
 const postMessage=(message:unknown,origin:string)=>calls.push({message,origin});
 const fake:Record<string,unknown>={location:{ancestorOrigins:origin?[origin]:[]},postMessage,addEventListener:(name:string,fn:(e:FakeEvent)=>void)=>listeners.set(name,[...(listeners.get(name)||[]),fn])};fake.parent=standalone?fake:{postMessage};
 Object.defineProperty(globalThis,'window',{value:fake,configurable:true,writable:true});Object.defineProperty(globalThis,'document',{value:{referrer},configurable:true,writable:true});return{calls,listeners};
}
function browserTest(name:string,fn:()=>void){test(name,()=>{const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');try{adapterFixture('https://untrusted.example');initHost('manual-mayhem');fn();}finally{adapterFixture('https://untrusted.example');initHost('manual-mayhem');if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');}});}
browserTest('adapter sends an exact versioned envelope to the trusted iframe parent only',()=>{
 const{calls}=adapterFixture('https://english-games.workbook.co.il');initHost('manual-mayhem');postToHost({type:'level-complete',level:1,durationMs:12});assert.deepEqual(calls,[{message:{source:'workbook-game',version:1,slug:'manual-mayhem',type:'level-complete',level:1,durationMs:12},origin:'https://english-games.workbook.co.il'}]);
});
browserTest('adapter falls back to the referrer origin when ancestorOrigins is absent',()=>{
 const{calls}=adapterFixture(null,false,'http://localhost:4017/manual-mayhem/play?level=2');initHost('manual-mayhem');postToHost({type:'ready'});assert.deepEqual(calls,[{message:{source:'workbook-game',version:1,slug:'manual-mayhem',type:'ready'},origin:'http://localhost:4017'}]);
});
browserTest('untrusted ancestor cannot be replaced by a convenient trusted referrer',()=>{
 const{calls,listeners}=adapterFixture('https://workbook.co.il.evil.test',false,'https://english-games.workbook.co.il/');initHost('manual-mayhem');postToHost({type:'ready'});assert.deepEqual(calls,[]);assert.equal(listeners.size,0);
});
browserTest('standalone remains silent even with a Workbook referrer',()=>{
 const{calls}=adapterFixture('https://english-games.workbook.co.il',true,'https://english-games.workbook.co.il/');initHost('manual-mayhem');postToHost({type:'ready'});postToHost({type:'level-start',level:1});assert.deepEqual(calls,[]);
});
browserTest('reinitializing from an embedded session cannot leave a stale standalone target',()=>{
 adapterFixture('https://english-games.workbook.co.il');initHost('manual-mayhem');const{calls}=adapterFixture('https://english-games.workbook.co.il',true);initHost('manual-mayhem');postToHost({type:'ready'});assert.deepEqual(calls,[]);
});
browserTest('error and rejection reports are bounded and use the exact trusted envelope',()=>{
 const{calls,listeners}=adapterFixture('http://localhost:4017');initHost('manual-mayhem');for(const f of listeners.get('error')||[])f({message:'x'.repeat(250)});for(const f of listeners.get('unhandledrejection')||[])f({reason:'y'.repeat(220)});assert.deepEqual(calls,[{message:{source:'workbook-game',version:1,slug:'manual-mayhem',type:'error',message:'x'.repeat(200)},origin:'http://localhost:4017'},{message:{source:'workbook-game',version:1,slug:'manual-mayhem',type:'error',message:'y'.repeat(200)},origin:'http://localhost:4017'}]);
});
