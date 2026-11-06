"""Original CC0 offline Foley and instrumental loops. No external samples."""
from pathlib import Path
import wave
import numpy as np
from scipy.signal import butter,sosfilt
OUT=Path(__file__).resolve().parents[1]/'assets/audio';OUT.mkdir(parents=True,exist_ok=True)
SR=22050
rng=np.random.default_rng(19880914)
def noise(n,cut=1400):return sosfilt(butter(2,cut,fs=SR,output='sos'),rng.normal(0,1,n))
def save(name,data):
 data=data/max(1,np.max(np.abs(data)))*.8
 edge=min(512,len(data)//10);data[:edge]*=np.linspace(0,1,edge);data[-edge:]*=np.linspace(1,0,edge)
 with wave.open(str(OUT/(name+'.wav')),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((data*32767).astype('<i2').tobytes())
t=np.arange(SR*12)/SR
save('water',noise(len(t),850)*(.6+.3*np.sin(t*.8))+.15*noise(len(t),3000)*np.maximum(0,np.sin(t*1.9))**3)
for name,freq,rate in [('cicadas',4800,31),('crickets',3600,4.6)]:
 env=(.5+.5*np.sin(t*2*np.pi*rate))**5*(.6+.3*np.sin(t*1.5))
 save(name,.25*np.sin(2*np.pi*freq*t+.5*np.sin(2*np.pi*19*t))*env)
save('engine',.22*np.sin(2*np.pi*42*t)+.12*np.sin(2*np.pi*84*t)+noise(len(t),380)*.3)
t=np.arange(SR*5)/SR
save('train',(.12*np.sin(2*np.pi*293.66*t)+.1*np.sin(2*np.pi*369.99*t)+noise(len(t),650)*.2)*np.sin(np.pi*t/5)**2)
for name,cut,freq in [('steps-asphalt',2200,95),('steps-wood',900,175),('steps-stone',3500,270),('clunk',2000,123),('click',1800,380)]:
 t=np.arange(SR*.35)/SR;d=(noise(len(t),cut)*.7+.27*np.sin(2*np.pi*freq*t))*np.exp(-t*(18 if name=='clunk' else 32));save(name,d)
# The shop-door chime.
#
# Two struck notes a fifth apart and falling, which is what a 1988 konbini door says
# when it opens: pin-pon. Struck bell partials rather than a sine pair — a pure two-
# tone reads as a lift announcement, and it is the inharmonic partials above the
# fourth that make a thing sound hit rather than switched on.
#
# A little silence in front of it so save()'s fade-in lands on the silence instead of
# sanding the attack off, which is the whole character of a strike.
def strike(freq,seconds,decay):
 tt=np.arange(int(SR*seconds))/SR
 partials=[(1,1,1),(2.01,.52,1.9),(2.76,.3,2.6),(5.43,.13,4.1),(8.16,.06,6.2)]
 out=sum(a*np.sin(2*np.pi*freq*r*tt)*np.exp(-tt*decay*d) for r,a,d in partials)
 return out*np.minimum(1,tt/.0022)
LEAD=int(SR*.03)
chime=np.zeros(LEAD+int(SR*2.1))
for start,freq,seconds,decay in [(0,987.77,2.0,3.0),(.33,659.26,1.8,2.5)]:
 s_=strike(freq,seconds,decay);i=LEAD+int(start*SR);n=min(len(s_),len(chime)-i);chime[i:i+n]+=s_[:n]
save('door-chime',chime)

# Three original pentatonic phrases, using decaying harmonics rather than UI tones.
for station,notes in enumerate([[0,7,12,7,4,2,0,2],[0,2,7,9,12,9,7,2],[7,7,9,12,9,4,2,0]]):
 beat=.55;out=np.zeros(int(SR*beat*len(notes)))
 for i,note in enumerate(notes):
  tt=np.arange(int(SR*beat))/SR;freq=196*2**((note+station*2)/12)
  part=sum(np.sin(2*np.pi*freq*h*tt)/h**2*np.exp(-tt*(3+h)) for h in range(1,7));part*=np.minimum(1,tt/.006)
  start=int(i*beat*SR);out[start:start+len(part)]+=.24*part[:len(out)-start]
 save('radio-'+str(station),out)
print('Rendered',len(list(OUT.glob('*.wav'))),'original local audio files.')
