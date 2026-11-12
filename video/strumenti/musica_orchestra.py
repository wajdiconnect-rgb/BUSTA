import numpy as np, wave, sys
sr=44100; D=float(sys.argv[2]) if len(sys.argv)>2 else 23.0; n=int(sr*D); t=np.arange(n)/sr
L=np.zeros(n); R=np.zeros(n); rng=np.random.default_rng(7)
def f(m): return 440*2**((m-69)/12)
def put(sig,start,pan=0.5):
    i=int(start*sr); j=min(n,i+len(sig))
    if i<0 or i>=n: return
    L[i:j]+=sig[:j-i]*np.sqrt(1-pan); R[i:j]+=sig[:j-i]*np.sqrt(pan)
def strings(m,start,dur,vol,att=1.2,rel=1.0):
    k=int(dur*sr); tt=np.arange(k)/sr
    env=np.minimum(1,tt/att)*np.clip((dur-tt)/rel,0,1)
    s=np.zeros(k)
    for v in range(7):  # sezione: 7 strumenti leggermente scordati
        det=rng.normal(0,0.0025); ph=rng.uniform(0,6.28); vib=1+0.004*np.sin(2*np.pi*(5+rng.uniform(-.4,.4))*tt+ph)
        fr=f(m)*(1+det)*vib; phase=2*np.pi*np.cumsum(fr)/sr
        s+=sum((1/(h+1))**1.3*np.sin((h+1)*phase) for h in range(7))
    put(vol*env*s/7,start,0.3+0.4*rng.random())
def piano(m,start,vol,dur=3.0):
    k=int(dur*sr); tt=np.arange(k)/sr
    s=sum((0.55**h)*np.sin(2*np.pi*f(m)*(h+1)*tt)*np.exp(-tt*(1.6+0.9*h)) for h in range(6))
    put(vol*s*(1-np.exp(-tt*300)),start,0.35+0.3*rng.random())
def timpani(start,vol,roll=0.0):
    hits=[start] if roll==0 else list(np.arange(start,start+roll,0.06))
    for i,h in enumerate(hits):
        k=int(2.0*sr); tt=np.arange(k)/sr
        g=(i/len(hits))**1.5 if roll else 1
        s=np.sin(2*np.pi*65*tt*(1+0.05*np.exp(-tt*8)))*np.exp(-tt*2.5)+0.3*rng.normal(0,1,k)*np.exp(-tt*30)
        put(vol*(0.25+0.75*g)*s,h,0.5)
# progressione (Re minore -> Si bem -> Fa -> Do -> ... -> Re maggiore finale)
prog=[[50,57,62,65],[46,53,58,62],[41,53,57,60],[48,55,60,64]]
bar=2.7
tcur=0.0;i=0
while tcur<D-6.5:
    ch=prog[i%4]; crescendo=min(1,0.35+tcur/14)
    for m in ch[1:]: strings(m,tcur,bar+0.9,0.05*crescendo,att=0.9 if tcur>0 else 2.0)
    strings(ch[0]-12,tcur,bar+0.9,0.07*crescendo,att=1.0)  # violoncelli/contrabbassi
    if tcur>=2.6:
        arp=[ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+24,ch[3]+12,ch[2]+12]
        for k,m in enumerate(arp): piano(m,tcur+k*bar/6,0.10)
    tcur+=bar;i+=1
fin=D-6.8
timpani(fin-1.6,0.35,roll=1.6)
for m in [38,50,57,62,66,69,74]: strings(m,fin,6.6,0.075 if m>40 else 0.1,att=0.25,rel=2.5)
timpani(fin,0.6)
for m in [62,66,69,74,78]: piano(m,fin+0.02,0.12,dur=5)
x=np.stack([L,R],1)
# riverbero da sala da concerto
Lr=int(3.0*sr); ir=rng.normal(0,1,(Lr,2))*np.exp(-np.arange(Lr)/sr*2.0)[:,None]; ir[:int(.025*sr)]=0
from numpy.fft import rfft,irfft
N=1<<int(np.ceil(np.log2(n+Lr)))
wet=np.stack([irfft(rfft(x[:,c],N)*rfft(ir[:,c],N),N)[:n] for c in (0,1)],1); wet/=np.abs(wet).max()/np.abs(x).max()
y=0.7*x+0.55*wet
y*=np.clip((D-t)/1.8,0,1)[:,None]*np.minimum(1,t/0.4)[:,None]
y/=np.abs(y).max()*1.1
w=wave.open(sys.argv[1],'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((y*32767).astype('<i2').tobytes());w.close()
