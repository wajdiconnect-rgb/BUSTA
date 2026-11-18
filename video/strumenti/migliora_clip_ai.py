import sys, os, subprocess, numpy as np
from PIL import Image
sys.path.insert(0, '/home/user/BUSTA/video/strumenti')
from ingrandisci import modello, ingrandisci_rgb
src, out, t0, t1, rallenta = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
tmp = out + '_f'; os.makedirs(tmp, exist_ok=True)
subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t0),'-to',str(t1),'-i',src,os.path.join(tmp,'%04d.png')],check=True)
m = modello()
for f in sorted(os.listdir(tmp)):
    p=os.path.join(tmp,f); big=ingrandisci_rgb(m,np.array(Image.open(p).convert('RGB')))
    Image.fromarray(big).resize((big.shape[1]//2*2//2*1, big.shape[0]//2), Image.LANCZOS).save(p) if False else Image.fromarray(big).resize((1080, int(1080*big.shape[0]/big.shape[1])//2*2), Image.LANCZOS).save(p)
# 16 fps originali -> rallentati e resi fluidi a 30 fps
subprocess.run(['ffmpeg','-y','-v','error','-framerate',str(16/rallenta),'-i',os.path.join(tmp,'%04d.png'),
  '-vf','minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1,eq=saturation=1.05:contrast=1.03',
  '-c:v','libx264','-crf','15','-pix_fmt','yuv420p',out],check=True)
print('ok',out)
