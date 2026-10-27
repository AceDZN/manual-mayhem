#!/usr/bin/env python3
"""Decode saved assets independently of composition source; records codec evidence."""
from pathlib import Path
import json,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
results=[]
for p in sorted((ROOT/'public/audio').glob('*')):
    if p.suffix not in ('.mp3','.wav'): continue
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-acodec','pcm_f32le','-ar','22050','-ac','2','pipe:1'])
    x=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
    results.append({'file':str(p.relative_to(ROOT)),'decodedDuration':len(x)/22050,'peakDBFS':round(float(20*np.log10(np.max(np.abs(x))+1e-12)),2),'clippedSamples':int(np.sum(np.abs(x)>=1)),'loopBoundarySampleDelta':round(float(np.max(np.abs(x[-1]-x[0]))),7)})
(ROOT/'docs/audio/encoding-validation.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({'decodedFiles':len(results),'clippedSamples':sum(r['clippedSamples'] for r in results),'loopDurations':[r['decodedDuration'] for r in results if 'workshop' in r['file']]},indent=2))
