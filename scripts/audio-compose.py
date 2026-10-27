#!/usr/bin/env python3
"""Manual Mayhem — original 32-bar ABAC score, synthesis and evidence renderer.
Rebuild: bundled Python with numpy scripts/audio-compose.py; requires ffmpeg.
All notes, envelopes and synthesized sounds are original; no external samples.
"""
from pathlib import Path
import json, math, subprocess, wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/audio'; DOC=ROOT/'docs/audio'
OUT.mkdir(parents=True,exist_ok=True); DOC.mkdir(parents=True,exist_ok=True)
SR=22050; BPM=108; BEAT=60/BPM; BAR=4*BEAT; DURATION=32*BAR
N=round(DURATION*SR); RNG=np.random.default_rng(20261027)
TAU=2*np.pi

def hz(midi): return 440*2**((midi-69)/12)
def tone(midi,duration,kind='glass',volume=1):
    t=np.arange(round(duration*SR))/SR; f=hz(midi)
    if kind=='glass':
        x=(np.sin(TAU*f*t)*np.exp(-t*4.1)+.32*np.sin(TAU*f*2.01*t)*np.exp(-t*7)+.08*np.sin(TAU*f*3.98*t)*np.exp(-t*11))*.45
        x*=np.minimum(t/.006,1)
    elif kind=='bass':
        x=(np.sin(TAU*f*t)+.18*np.sin(TAU*f*2*t)+.07*np.sin(TAU*f*3*t))*.7
        x*=np.minimum(t/.012,1)*np.exp(-t*1.7)*np.minimum((duration-t)/.06,1)
    elif kind=='pad':
        x=(np.sin(TAU*f*t)+.28*np.sin(TAU*f*1.002*t)+.1*np.sin(TAU*f*2*t))*.38
        x*=np.minimum(t/.25,1)*np.minimum((duration-t)/.6,1)*(.92+.08*np.sin(TAU*.23*t))
    else:
        x=np.sin(TAU*f*t)*np.exp(-t*12)*np.minimum(t/.003,1)
    return x*volume

def noise(dur,decay=10,low=False):
    n=round(dur*SR); t=np.arange(n)/SR; x=RNG.normal(0,1,n)
    if low: x=np.convolve(x,np.ones(23)/23,mode='same')
    else: x=x-np.roll(x,1)
    return x*np.exp(-decay*t)*np.minimum(t/.003,1)

def add(buf,sound,sec,gain=1,pan=0):
    # Wrap complete tails at the loop boundary; no silent file-edge cut.
    at=round(sec*SR); ix=(np.arange(len(sound))+at)%len(buf)
    buf[ix,0]+=sound*gain*math.sqrt((1-pan)/2)
    buf[ix,1]+=sound*gain*math.sqrt((1+pan)/2)

def echo(buf,sec,gain): return buf+np.roll(buf,round(sec*SR),axis=0)*gain

def writewav(path,buf):
    b=np.asarray(np.clip(buf,-.98,.98)*32767,dtype='<i2')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1 if b.ndim==1 else b.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b.tobytes())

def mp3(name,buf):
    temp=DOC/f'{name}.render.wav'; target=OUT/f'{name}.mp3'; writewav(temp,buf)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','128k',str(target)],check=True)
    temp.unlink(); return target

# D6 – Bm7 – Gmaj7 – Aadd9, voiced to leave room for reading.
chords={
    'D':([50,57,62,66,69],38), 'B':([47,54,57,62,66],35),
    'G':([43,54,59,62,67],31), 'A':([45,52,57,59,64],33),
}
progression=list('DDBBGGAA')+list('GADBGADB')+list('DDBBGGAA')+list('BGDAGADD')
base=np.zeros((N,2)); groove=base.copy(); melody=base.copy(); lift=base.copy()
# Authored 8-bar motif; syncopated answer and changed final pitch in B/C.
phrases=[[(0,74),(.75,78),(1.5,81),(2.5,78),(3.25,76)],
         [(.5,74),(1.5,73),(2.5,69)],
         [(0,74),(1,78),(1.75,81),(3,78)],
         [(.5,76),(1.25,74),(2.5,71)],
         [(0,71),(1,74),(2.5,78),(3.25,76)],
         [(.5,74),(1.5,71),(3,69)],
         [(0,73),(.75,76),(1.5,81),(2.75,78)],
         [(0,76),(1.25,73),(2.5,74)]]
for bar,key in enumerate(progression):
    notes,root=chords[key]; sec=bar*BAR; section=bar//8
    for i,n in enumerate(notes): add(base,tone(n,BAR+.35,'pad',.055),sec,pan=(i-2)*.24)
    # Round bass, melodic fifth, soft pickup into next chord.
    for beat,n,g in [(0,root,.13),(1.5,root+12,.075),(2.5,root+7,.09),(3.5,root+12,.055)]:
        add(groove,tone(n,BEAT*.7,'bass',g),sec+beat*BEAT,pan=-.08)
    # Brushed hats, a soft kick and woodblock on the off-beat.
    for eighth in range(8):
        add(groove,noise(.09,43)*(.012 if eighth%2==0 else .008),sec+eighth*.5*BEAT,pan=.4 if eighth%2 else -.4)
    for beat in (0,2):
        t=np.arange(round(.2*SR))/SR
        kick=np.sin(TAU*(55*t+8*(1-np.exp(-t*24))/24))*np.exp(-t*22)*.08
        add(groove,kick,sec+beat*BEAT)
    for beat in (1,3): add(groove,tone(80,.13,'block',.07)+noise(.13,30)*.012,sec+beat*BEAT,pan=-.3)
    phrase=phrases[bar%8]
    for beat,n in phrase:
        if section==1: n += 2 if bar%4==0 else (-2 if bar%4==2 else 0)
        if section==3 and bar%8>=6: n={73:74,76:78,81:81,78:78,74:74}.get(n,n)
        add(melody,tone(n,1.2,'glass',.11),sec+beat*BEAT,pan=.28 if beat%1 else -.24)
    # Third stabilised module contributes a quieter, brighter arpeggio and lift.
    for ix,beat in enumerate((.5,1.5,2.5,3.5)):
        add(lift,tone(notes[1+(ix%4)]+12,.65,'glass',.027 if section!=3 else .041),sec+beat*BEAT,pan=(-1 if ix%2 else 1)*.5)
    if bar%4==3:
        for i in range(3): add(lift,noise(.06,55)*.008,sec+(3+i*.25)*BEAT,pan=.35)
base=echo(base,.222,.18); melody=echo(melody,BEAT*.75,.22); lift=echo(lift,BEAT*.5,.15)
stems={'workshop-harmony':base,'workshop-groove':groove,'workshop-glass':melody,'workshop-lift':lift}
# A quiet 8-bar seamless environmental loop: fan harmonics, air, timber creak.
AN=round(8*BAR*SR); t=np.arange(AN)/SR
wind=RNG.normal(0,1,AN); wind=np.convolve(wind,np.ones(151)/151,mode='same')
ambient=np.zeros((AN,2)); fan=(np.sin(TAU*49.5*t)+.3*np.sin(TAU*99*t))*.009
ambient[:,0]=fan+wind*.035; ambient[:,1]=fan*.95+np.roll(wind,1800)*.035
for sec in (2.7,9.6,14.4):
    q=np.arange(round(.8*SR))/SR
    creak=np.sin(TAU*(130*q+4*np.sin(q*5)))*np.sin(np.pi*q/.8)**2*.007
    add(ambient,creak,sec,pan=.5)
# Crossfade first/last 80ms to the same common signal so loop boundary is continuous.
k=round(.08*SR); blend=np.linspace(0,1,k)[:,None]; shared=(ambient[:k]+ambient[-k:])/2
ambient[:k]=shared*(1-blend)+ambient[:k]*blend
ambient[-k:]=ambient[-k:]*(1-blend)+shared*blend
ambient[-k:] += (ambient[0]-ambient[-1]) * (np.linspace(0,1,k)**2 * (3-2*np.linspace(0,1,k)))[:,None]
stems['workshop-ambient']=ambient

cues={}
def cue_mix(duration,parts):
    b=np.zeros((round(duration*SR),2))
    for sound,at,g,pan in parts: add(b,sound,at,g,pan)
    return b
cues['knob']=cue_mix(.13,[(noise(.035,80),0,.055,0),(tone(45,.12,'block'),0,.12,0)])
cues['switch']=cue_mix(.2,[(noise(.04,55,True),0,.22,-.1),(tone(38,.11,'block'),0,.19,0),(noise(.05,60),.06,.03,.1)])
cues['cable']=cue_mix(.38,[(noise(.06,35),0,.045,0),(tone(79,.3,'glass'),.035,.2,.2)])
cues['latch']=cue_mix(.3,[(noise(.04,70),0,.04,-.15),(tone(56,.13,'block'),0,.23,0),(tone(68,.15,'block'),.10,.16,.15)])
q=np.arange(round(.42*SR))/SR
page=noise(.42,4)*(.55+.45*np.sin(q*85)**2)*.048
cues['page']=cue_mix(.5,[(page,0,1,-.3)])
cues['settle']=cue_mix(.9,[(tone(81,.7,'glass'),0,.17,.3),(tone(78,.7,'glass'),.08,.13,-.3),(tone(74,.7,'glass'),.18,.13,0)])
q=np.arange(round(.9*SR))/SR
vent=noise(.9,3,True)*(.3+.7*np.sin(np.pi*np.minimum(q/.9,1)))*.23
cues['error']=cue_mix(1.05,[(vent,0,1,.25),(tone(42,.25,'bass'),0,.16,-.2)])
cues['strike']=cue_mix(.65,[(tone(50,.5,'glass'),0,.17,-.2),(tone(49,.45,'glass'),.07,.14,.2)])
cues['reset']=cue_mix(1.05,[(tone(n,.35,'glass'),i*.09,.12,(i-2)*.15) for i,n in enumerate([50,54,57,62,66,69])])
cues['activate']=cue_mix(1.35,[(tone(n,1,'glass'),i*.1,.20,(i-1)*.25) for i,n in enumerate([62,66,69,74])])
cues['victory']=cue_mix(2.8,[(tone(n,1.2,'glass'),i*.15,.22,(i%3-1)*.3) for i,n in enumerate([62,66,69,74,78,81,86])]+[(tone(38,2.6,'bass'),0,.15,0)])

metrics={'composition':{'title':'Festival Engine / Manual Mayhem','bpm':BPM,'meter':'4/4','bars':32,'form':'ABAC (8 bars each)','key':'D major','loopDuration':N/SR},'files':{}}
for name,b in stems.items():
    p=mp3(name,b)
    metrics['files'][str(p.relative_to(ROOT))]={'duration':len(b)/SR,'peakDBFS':round(20*math.log10(float(np.max(np.abs(b)))+1e-12),2),'rmsDBFS':round(20*math.log10(float(np.sqrt(np.mean(b*b)))+1e-12),2),'loopBoundarySampleDelta':round(float(np.max(np.abs(b[-1]-b[0]))),7),'bytes':p.stat().st_size}
for name,b in cues.items():
    p=OUT/f'{name}.wav'; writewav(p,b)
    metrics['files'][str(p.relative_to(ROOT))]={'duration':len(b)/SR,'peakDBFS':round(20*math.log10(float(np.max(np.abs(b)))+1e-12),2),'bytes':p.stat().st_size}
# 25 s demonstrator: harmony+ambience, then groove, melody, climax. Tactile cues.
PN=25*SR; preview=base[:PN]*.7+ambient[np.arange(PN)%AN]*.65
for start,stem,g in [(3,groove,.9),(8,melody,.9),(16,lift,.9)]:
    envelope=np.clip((np.arange(PN)/SR-start)/.7,0,1)[:,None]
    preview+=stem[:PN]*envelope*g
for at,name in [(1,'page'),(3,'knob'),(5,'switch'),(7,'cable'),(9,'latch'),(11,'error'),(12.4,'strike'),(14,'reset'),(16,'activate'),(19,'settle'),(22,'victory')]:
    b=cues[name]; start=round(at*SR); end=min(PN,start+len(b)); preview[start:end]+=b[:end-start]*.65
preview=preview*1.45
preview[:round(.1*SR)]*=np.linspace(0,1,round(.1*SR))[:,None]
preview[-round(.45*SR):]*=np.linspace(1,0,round(.45*SR))[:,None]
writewav(DOC/'manual-mayhem-mix-preview.wav',preview)
metrics['preview']={'duration':25,'sampleRate':SR,'channels':2,'peakDBFS':round(20*math.log10(float(np.max(np.abs(preview)))),2),'rmsDBFS':round(20*math.log10(float(np.sqrt(np.mean(preview*preview)))),2),'clippedSamples':int(np.sum(np.abs(preview)>=1)),'method':'Numerical waveform measurement before 16-bit PCM conversion; decodability separately inspected by ffprobe.'}
(DOC/'audio-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics['preview'],indent=2)); print('Rendered',len(metrics['files']),'assets')
