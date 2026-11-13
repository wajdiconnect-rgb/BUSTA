import os, glob
import numpy as np
from PIL import Image
from rembg import remove, new_session

os.makedirs('out/png', exist_ok=True)
sess = new_session('isnet-general-use')
nomi = ['grand_front', 'grand_3d', 'pad_esploso', 'pad_creativo', 'pad_kiosk', 'pad_kiosk_misure', 'totem_doppio',
        'fd_fronte', 'fd_retro', 'fd_curvo', 'fd_controller', 'stage_cab', 'stage2_cab', 'stage2_front',
        'composizioni', 'parete1', 'parete2', 'parete3', 'parete4', 'manutenzione']
gia = ['grand_fronte', 'grand_retro', 'pad_fronte', 'pad_retro', 'totem_fronte', 'totem_retro', 'stage_fronte',
       'stage_retro', 'flex_fronte']


def ritaglia(im):
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 10)
    if len(xs) == 0:
        return im
    p = 6
    return im.crop((max(0, xs.min() - p), max(0, ys.min() - p), min(im.width, xs.max() + p), min(im.height, ys.max() + p)))


for n in gia:
    im = Image.open(f'out/{n}.png').convert('RGBA')
    ritaglia(im).save(f'out/png/{n}.png')
for n in nomi:
    f = [x for x in glob.glob(f'out/{n}.*') if not x.endswith('.html')][0]
    im = Image.open(f).convert('RGB')
    if max(im.size) < 1400:  # piccole: ingrandisco prima per bordi più puliti
        s = 1400 / max(im.size)
        im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    m = remove(im, session=sess, only_mask=True, post_process_mask=True)
    rgba = im.copy()
    rgba.putalpha(m)
    ritaglia(rgba).save(f'out/png/{n}.png')
    print('ok', n, im.size)
