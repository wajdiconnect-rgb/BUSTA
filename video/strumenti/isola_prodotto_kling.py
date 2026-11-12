import sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]; files = sys.argv[3:]
s = new_session('isnet-general-use')
for f in files:
    im = Image.open(os.path.join(src, f)).convert('RGB'); W, H = im.size
    sm = im.resize((W // 2, H // 2))
    m = np.array(remove(sm, session=s, only_mask=True)).astype(float) / 255
    m = np.array(Image.fromarray((m * 255).astype('uint8')).resize((W, H), Image.BILINEAR)).astype(float) / 255
    a = np.array(im).astype(int)
    # lama: grigio/argento poco saturo e alto, la tolgo
    sat = a.max(2) - a.min(2)
    lama = (sat < 22) & (a.max(2) > 60)
    hard = (m > 0.5) & ~lama
    hard = nd.binary_opening(hard, iterations=3)
    lab, n = nd.label(hard); sz = nd.sum(hard, lab, range(1, n + 1))
    keep = lab == (np.argmax(sz) + 1)          # solo il prosciutto (il pezzo più grande)
    keep = nd.binary_fill_holes(nd.binary_closing(keep, structure=np.ones((3,3)), iterations=22))
    keep = keep & nd.binary_dilation(m > 0.3, iterations=30)
    A = np.array(Image.fromarray((keep * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))).astype(float) / 255
    A = np.minimum(A, np.clip(m * 1.5, 0, 1))
    A[H - 120:, W - 330:] = 0   # marchio KlingAI
    o = im.convert('RGBA'); arr = np.array(o); arr[..., 3] = (A * 255).astype('uint8')
    Image.fromarray(arr).save(os.path.join(dst, f))
    print(f, flush=True)
