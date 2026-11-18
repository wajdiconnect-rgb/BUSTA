#!/usr/bin/env python3
"""prepara_schermo_prodotto.py — trova lo schermo nella foto del prodotto e prepara: maschera, prodotto con la frutta sullo schermo, cabinet vuoto con la griglia dei moduli e il JSON per ProdottoSingolo.
Uso (dalla cartella con public/NOME_fronte.png e frutta_frame.png):
  python3 prepara_schermo_prodotto.py NOME "Nome prodotto" LARGHEZZA COLONNE RIGHE USA_LUMINOSI(0/1) [hull] [EROSIONE]"""
import sys, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
n, nome, larg, C, R, lumok = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]=='1'
im=Image.open(f'public/{n}_fronte.png').convert('RGBA');a=np.array(im).astype(int)
al=a[...,3];rgb=a[...,:3];sat=rgb.max(2)-rgb.min(2);lum=rgb.max(2)
m=(sat>40)&(al>200)
if lumok: m|=(lum>185)&(al>200)
m=nd.binary_closing(m,iterations=10);m=nd.binary_fill_holes(m);m=nd.binary_opening(m,iterations=8)
lab,k=nd.label(m);sz=nd.sum(m,lab,range(1,k+1));m=lab==(np.argmax(sz)+1)
m=nd.binary_fill_holes(m)
if len(sys.argv)>7 and sys.argv[7]=='hull':
    from skimage.morphology import convex_hull_image
    m=convex_hull_image(m)
E=int(sys.argv[8]) if len(sys.argv)>8 else 6
if E>0: m=nd.binary_erosion(m,iterations=E)
elif E<0: m=nd.binary_dilation(m,iterations=-E)
ys,xs=np.where(m);x0,y0,x1,y1=xs.min(),ys.min(),xs.max(),ys.max();bw,bh=x1-x0,y1-y0
M=Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(2))
out=Image.new('RGBA',im.size,(255,255,255,0));out.putalpha(M);out.save(f'public/{n}_maschera.png')
f=Image.open('frutta_frame.png').convert('RGB')
s=max(bw/f.width,bh/f.height);ff=f.resize((int(f.width*s)+1,int(f.height*s)+1));l=(ff.width-bw)//2;t=(ff.height-bh)//2;ff=ff.crop((l,t,l+bw,t+bh))
lay=Image.new('RGBA',im.size,(0,0,0,0));lay.paste(ff,(x0,y0));lay.putalpha(Image.fromarray(np.minimum(np.array(M),np.array(lay.getchannel('A')))))
fr=im.copy();fr.alpha_composite(lay);fr.save(f'public/{n}_frutta.png')
# cabinet vuoto con griglia moduli e connettori
mm=np.array(M).astype(float)/255;A=a.astype(float)
base=np.zeros_like(A[...,:3]);base[...]=[34,36,40]
yy,xx=np.mgrid[0:A.shape[0],0:A.shape[1]]
gx=((xx-x0)/bw*C)%1;gy=((yy-y0)/bh*R)%1
base[(gx<0.012*4/C)|(gy<0.01*5/R)]=[70,72,78]
base[(np.abs(gx-0.5)<0.06)&(np.abs(gy-0.5)<0.03)]=[110,112,118]
A[...,:3]=A[...,:3]*(1-mm[...,None])+base*mm[...,None]
Image.fromarray(A.astype('uint8')).save(f'public/{n}_vuoto.png')
W,H=im.size
d={"sfondo":"sito.mp4","fronte":f"{n}_fronte.png","retro":f"{n}_retro.png","aspetto":W/H,"larghezza":larg,"nome":nome,"logo":"logo.png","oro":"#D4A64A","durata":14,"griglia":4,
 "schermo":{"video":"frutta.mp4","maschera":f"{n}_maschera.png","box":{"x":x0/W,"y":y0/H,"w":bw/W,"h":bh/H},"pezzi":f"{n}_frutta.png"},
 "moduli":{"cols":C,"rows":R,"vuoto":f"{n}_vuoto.png"}}
json.dump(d,open(f'{n}.json','w'))
print(n,'schermo',x0,y0,x1,y1,'su',W,H)
