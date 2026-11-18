# sfondo bianco: tolgo solo il bianco collegato ai bordi (niente buchi nel prodotto)
import glob
import numpy as np, cv2
from PIL import Image
for n in ['parete1', 'parete2', 'parete3', 'parete4', 'manutenzione', 'stage_cab', 'stage2_cab', 'grand_front', 'grand_3d', 'composizioni']:
    f = [x for x in glob.glob(f'out/{n}.*')][0]
    im = Image.open(f).convert('RGB')
    s = 1600 / max(im.size)
    if s > 1:
        im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    a = np.array(im)
    bianco = (a.min(2) > 232).astype(np.uint8)
    n_, lab = cv2.connectedComponents(bianco)
    bordo = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    bordo.discard(0)
    sf = np.isin(lab, list(bordo))
    alpha = (~sf).astype(np.uint8) * 255
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
    rgba = np.dstack([a, alpha])
    ys, xs = np.where(alpha > 10)
    out = Image.fromarray(rgba).crop((xs.min() - 4, ys.min() - 4, xs.max() + 4, ys.max() + 4))
    out.save(f'out/png/{n}.png')
    print('ok', n)
