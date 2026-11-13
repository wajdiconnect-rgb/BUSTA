import re
g = open('genera.py', encoding='utf-8').read().replace('"CE, CCC"', '"CE"')
open('genera.py', 'w', encoding='utf-8').write(g)
g2 = open('genera2.py', encoding='utf-8').read().replace('MET, FCC, CCC, RoHS, CE', 'CE, RoHS, FCC, MET')
open('genera2.py', 'w', encoding='utf-8').write(g2)
exec(open('genera2.py', encoding='utf-8').read())

s = open('catalogo_generale.html', encoding='utf-8').read()
s = s.replace('@page{size:297mm 210mm;margin:0}', '@page{size:303mm 216mm;margin:0}')
css = ('.bl{width:303mm;height:216mm;padding:3mm;background:#efe8dc;page-break-after:always;overflow:hidden}'
       '.bl.dk{background:#14110c}.bl .pg{page-break-after:auto}')
s = s.replace('</style>', css + '</style>', 1)


def wrap(m):
    cls = m.group(1)
    dk = ' dk' if 'dark' in cls else ''
    return f'<div class="bl{dk}"><section class="{cls}"'


s = re.sub(r'<section class="(pg[^"]*)"', wrap, s)
s = s.replace('</section>', '</section></div>')
open('catalogo_stampa.html', 'w', encoding='utf-8').write(s)
print('stampa', s.count('class="bl'))
