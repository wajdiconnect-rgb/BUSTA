import sys, glob, os, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]
s = new_session('isnet-general-use')
files = sorted(glob.glob(src + '/*.png'))
for i, f in enumerate(files):
    out = os.path.join(dst, os.path.basename(f))
    if os.path.exists(out): continue
    im = Image.open(f).convert('RGB')
    m = np.array(remove(im, session=s, only_mask=True)).astype(float)
    pass
    m[990:1080, 1660:1920] = 0               # marchio KlingAI
    m = np.clip((m - 20) * 1.3, 0, 255)
    a = Image.fromarray(m.astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
    o = im.convert('RGBA'); o.putalpha(a); o.save(out)
    print(i, flush=True)
