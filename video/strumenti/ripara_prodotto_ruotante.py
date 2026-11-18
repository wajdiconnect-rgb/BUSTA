import os, numpy as np, cv2
from PIL import Image, ImageFilter
from scipy import ndimage as nd
disk = lambda r: (np.hypot(*np.mgrid[-r:r+1, -r:r+1]) <= r)
for f in sorted(os.listdir('alpha')):
    a = np.array(Image.open(os.path.join('alpha', f))).astype(np.uint8)
    rgb, al = a[..., :3].copy(), a[..., 3]
    m = al > 200
    # lama del coltello: striscia verticale metallica; la trovo SOPRA e SOTTO il prosciutto, dove è sola
    o = np.array(Image.open(os.path.join('fr', f)).convert('RGB')).astype(int)
    so = o.max(2) - o.min(2); lo = o.max(2)
    met = (so < 30) & (lo > 60) & (lo < 245)
    H, W = met.shape
    fuori = np.zeros_like(met); fuori[:300] = met[:300]; fuori[1560:H-130] = met[1560:H-130]
    col = fuori.sum(0)
    cols = np.where(col > 60)[0]
    lama = np.zeros_like(m)
    if len(cols):
        # raggruppa colonne vicine in strisce
        gruppi = np.split(cols, np.where(np.diff(cols) > 4)[0] + 1)
        for g in gruppi:
            if len(g) >= 3:
                lama[:, max(0, g.min() - 8):min(W, g.max() + 9)] = True
    # dentro il prosciutto NON tolgo: ridipingo i pixel metallici della lama con il prosciutto intorno
    lama_in = lama & (so < 34) & (al > 60)
    lama_in = nd.binary_dilation(lama_in, iterations=2) & lama
    m = m | lama_in
    body = nd.binary_opening(m, structure=disk(9))
    lab, n = nd.label(body)
    if n:
        sz = nd.sum(body, lab, range(1, n + 1)); body = lab == (np.argmax(sz) + 1)
    # sagoma "ideale": chiusura + inviluppo convesso sotto il collo
    hull = nd.binary_fill_holes(nd.binary_closing(body, structure=disk(3), iterations=12))
    ys, xs = np.where(hull); y0, y1 = ys.min(), ys.max(); taglio = int(y0 + 0.40 * (y1 - y0))
    sub = hull.copy(); sub[:taglio] = False
    hp = cv2.convexHull(np.stack(np.where(sub)[::-1], 1).astype(np.int32))
    conv = np.zeros(hull.shape, np.uint8); cv2.fillPoly(conv, [hp], 1); conv[:taglio] = 0
    hull |= conv.astype(bool)
    # riempio SOLO i buchi veri (macchie grandi), non le strisce sottili lungo il bordo
    def_ = hull & ~body
    def_ = nd.binary_opening(def_, structure=disk(6))
    lab, n = nd.label(def_)
    grandi = np.zeros_like(def_)
    if n:
        sz = nd.sum(def_, lab, range(1, n + 1))
        grandi = np.isin(lab, np.where(sz > 5000)[0] + 1)
    finale = body | nd.binary_dilation(grandi, iterations=2) & hull
    # metà bassa: il prosciutto è sempre tondo -> forma piena (chiude i 'morsi' delle foglie)
    meta = int(y0 + 0.5 * (y1 - y0))
    basso = conv.astype(bool).copy(); basso[:meta] = False
    finale |= basso
    # colori: fuori dal prosciutto uso il colore del pixel di prosciutto più vicino (mai il beige)
    idx = nd.distance_transform_edt(~body, return_distances=False, return_indices=True)
    rgb_ext = rgb[idx[0], idx[1]]
    buco = ((finale & ~body) | (lama_in & finale)).astype(np.uint8) * 255
    if buco.any():
        rgb_ext = cv2.inpaint(rgb_ext[..., ::-1].copy(), buco, 7, cv2.INPAINT_TELEA)[..., ::-1]
    finale = nd.binary_erosion(finale, iterations=1)
    A = np.array(Image.fromarray((finale * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))
    Image.fromarray(np.dstack([rgb_ext, A])).save(os.path.join('alpha2', f))
print('ok')
