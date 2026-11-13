import re, os
exec(open('genera2.py', encoding='utf-8').read())

s = open('catalogo_generale.html', encoding='utf-8').read()

# 1) foto prodotto scontornate (PNG trasparenti)
sost = {'grand_hot': 'grand_retro', 'totem_doppio': 'totem_retro', 'protezione': 'stage_retro'}
def png(m):
    n = sost.get(m.group(1), m.group(1))
    return f'src="out/png/{n}.png"' if os.path.exists(f'out/png/{n}.png') else m.group(0)
s = re.sub(r'src="out/([a-z0-9_]+)\.(?:png|jpg)"', png, s)
# via le immagini che non si scontornano bene; la vicina prende tutta la larghezza
for via, allarga in [('grand_install', 'grand_3d'), ('fd_controller', 'fd_curvo')]:
    s = re.sub(r'<div class="card[^"]*" style="[^"]*"><img src="out/[a-z/]*' + via + r'\.(?:png|jpg)">(?:<div class="cap">.*?</div>)?</div>', '', s)
    s = re.sub(r'width:58%;height:(\d+)%"><img src="out/png/' + allarga, r'width:100%;height:\1%"><img src="out/png/' + allarga, s)

CSS3 = """
.card,.card.dk,.card.foto{background:transparent!important;box-shadow:none!important;overflow:visible!important}
.card img,.card.foto img{max-width:100%!important;max-height:86%!important;width:auto!important;height:auto!important;object-fit:contain!important;
  filter:drop-shadow(0 26px 22px rgba(40,26,10,.30)) drop-shadow(0 6px 6px rgba(40,26,10,.18))}
.card:after{content:"";position:absolute;left:18%;right:18%;bottom:9%;height:5%;border-radius:50%;background:radial-gradient(closest-side,rgba(40,26,10,.22),transparent);z-index:-1}
.card .cap,.card.foto .cap{left:0;right:0;bottom:0;text-align:center;color:var(--dim);text-shadow:none}
.card .cap b,.card.foto .cap b{color:var(--rust)}
.dark .card img{filter:drop-shadow(0 30px 30px rgba(0,0,0,.7))}
"""
s = s.replace('</style>', CSS3 + '</style>', 1)
open('catalogo_generale.html', 'w', encoding='utf-8').write(s)

# 2) versione per la tipografia: 3 mm di abbondanza
t = s.replace('@page{size:297mm 210mm;margin:0}', '@page{size:303mm 216mm;margin:0}')
t = t.replace('</style>', '.bl{width:303mm;height:216mm;padding:3mm;background:#efe8dc;page-break-after:always;overflow:hidden}'
              '.bl.dk{background:#14110c}.bl .pg{page-break-after:auto}</style>', 1)
t = re.sub(r'<section class="(pg[^"]*)"', lambda m: f'<div class="bl{" dk" if "dark" in m.group(1) else ""}"><section class="{m.group(1)}"', t)
t = t.replace('</section>', '</section></div>')
open('catalogo_stampa.html', 'w', encoding='utf-8').write(t)
print('ok', s.count('out/png/'), 'foto png')
