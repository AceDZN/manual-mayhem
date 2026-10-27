import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const mode=process.argv[2]==='dev'?'dev':'preview';
const port=mode==='dev'?5262:4262;
try{const r=await fetch(`http://localhost:${port}/`,{signal:AbortSignal.timeout(1500)});const body=await r.text();if(!body.includes('Manual Mayhem'))throw new Error('Port belongs to another service');console.log(`${mode} already available at http://localhost:${port}/`);process.exit(0);}catch(e){if(String(e).includes('another service'))throw e;}
fs.mkdirSync('work',{recursive:true});const log=fs.openSync(`work/${mode}-server.log`,'a');const args=[path.resolve('node_modules/vite/bin/vite.js'),...(mode==='preview'?['preview']:[]),'--host','0.0.0.0','--port',String(port),'--strictPort'];const child=spawn(process.execPath,args,{cwd:process.cwd(),detached:true,stdio:['ignore',log,log]});child.unref();fs.writeFileSync(`work/${mode}-server.pid`,String(child.pid));console.log(`Started ${mode} PID ${child.pid}: http://localhost:${port}/`);
