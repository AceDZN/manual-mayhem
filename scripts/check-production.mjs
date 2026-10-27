const base='http://localhost:4262/';
const paths=['','?manual=1','models/pump.glb','models/service-arm.glb','audio/manual-mayhem-preview.mp3','audio/workshop-harmony.mp3'];
for(const path of paths){const response=await fetch(base+path);if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);const bytes=(await response.arrayBuffer()).byteLength;console.log(`${path||'index'} HTTP${response.status} ${bytes}bytes`);}
