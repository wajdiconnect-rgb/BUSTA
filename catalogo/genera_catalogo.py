#!/usr/bin/env python3
# Genera il catalogo Ledinfinity (Stage · Stage II · Flex) in HTML, da stampare in PDF A4 orizzontale.
import html

E = html.escape

ROWS = [  # (gruppo, etichetta)
    ("Modulo", "Passo pixel"), ("Modulo", "Utilizzo"), ("Modulo", "Configurazione LED"), ("Modulo", "Densità (pixel/m²)"),
    ("Modulo", "Risoluzione modulo"), ("Modulo", "Dimensioni modulo (mm)"),
    ("Cabinet", "Moduli per cabinet"), ("Cabinet", "Risoluzione cabinet"), ("Cabinet", "Dimensioni cabinet (mm)"),
    ("Cabinet", "Superficie (m²)"), ("Cabinet", "Peso (kg)"), ("Cabinet", "Materiale"), ("Cabinet", "Planarità (mm)"),
    ("Cabinet", "Alimentatore"), ("Cabinet", "Curvatura"),
    ("Schermo", "Luminosità (nit)"), ("Schermo", "Temperatura colore (K)"), ("Schermo", "Angolo di visione (O/V)"),
    ("Schermo", "Contrasto"), ("Schermo", "Consumo max (W/m²)"), ("Schermo", "Consumo medio (W/m²)"),
    ("Schermo", "Alimentazione"), ("Schermo", "Frequenza (Hz)"), ("Schermo", "Pilotaggio"), ("Schermo", "Scala di grigi"),
    ("Schermo", "Refresh (Hz)"), ("Schermo", "Protezione IP"), ("Schermo", "Distanza di visione ottimale"),
    ("Schermo", "Esercizio (°C / umidità)"), ("Schermo", "Stoccaggio (°C / umidità)"), ("Schermo", "Certificazioni"),
    ("Schermo", "Durata"), ("Schermo", "Segnale"), ("Schermo", "Sorgenti compatibili"), ("Schermo", "Manutenzione"),
]

IN, OUT = "Interno", "Esterno"
SRC = "YPbPr, PAL/NTSC, S-Video, HDMI, VGA, HD-SDI"
AL = "Alluminio pressofuso"
VOLT = "AC 200–240 V, 47–63 Hz"
CT = "3200–9300 regolabile"


def col(pitch, uso, led, dens, rmod, cabqty, rcab, dim, size, peso, psu, curva, lum, ang, pmax, pavg, drive, ip, dist, eserc, stocc, cert, manut):
    return [pitch, uso, led, dens, rmod, "250 × 250", cabqty, rcab, dim, size, peso, AL, "< 0,1", psu, curva, lum, CT, ang, "5000:1",
            pmax, pavg, VOLT, "50 / 60", drive, "14–16 bit", "7680", ip, dist, eserc, stocc, cert, "100.000 h", "DVI", SRC, manut]


D1 = "500 × 500 × 85"
D2 = "500 × 500 × 85<br>500 × 1000 × 85"
CUR_S = "Concava 15°<br>convessa 5°"
PSU1 = "5V 40A (500 × 500)"
PSU60 = "5V 40A (500 × 500)<br>5V 60A (500 × 1000)"
PSU80 = "5V 40A (500 × 500)<br>5V 80A (500 × 1000)"
EI = "−10…45 °C / 20–85%"
SI = "−20…65 °C / 10–95%"
EO = "−30…50 °C / 10–85%"
SO = "−30…65 °C / 10–95%"

STAGE = {
    "P1.5 · IN": col("1,51 mm", IN, "SMD1212", "409.600", "160 × 160", "2 × 2", "320 × 320", D1, "0,25", "6,8", PSU1, CUR_S, "600–800", "170° / 170°", "800", "150–250", "Corrente costante 1/32", "IP65 / IP50", "1,5–15 m", EI, SI, "CE", "Frontale e posteriore"),
    "P1.9 · IN": col("1,95 mm", IN, "SMD1515", "262.144", "128 × 128", "2 × 2", "256 × 256", D1, "0,25", "6,8", PSU1, CUR_S, "600–800", "170° / 170°", "800", "150–250", "Corrente costante 1/32", "IP60 / IP50", "1,9–19 m", EI, SI, "CE", "Frontale e posteriore"),
    "P2.6 · IN": col("2,604 mm", IN, "SMD1515 / SMD2020", "147.456", "96 × 96", "2 × 2 | 2 × 4", "192 × 192 | 192 × 384", D2, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "800–1000", "140° / 140°", "800 (500×500)<br>600 (500×1000)", "150–250", "Corrente costante 1/32", "IP65 / IP50", "2,6–26 m", EI, SI, "CE", "Frontale e posteriore"),
    "P2.9 · IN": col("2,976 mm", IN, "SMD1515 / SMD2020", "112.896", "84 × 84", "2 × 2 | 2 × 4", "168 × 168 | 168 × 336", D2, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "800–1200", "140° / 140°", "800 (500×500)<br>600 (500×1000)", "150–250", "Corrente costante 1/28", "IP65 / IP50", "2,9–29 m", EI, SI, "CE", "Frontale e posteriore"),
    "P3.9 · IN": col("3,91 mm", IN, "SMD2020", "65.536", "64 × 64", "2 × 2 | 2 × 4", "128 × 128 | 128 × 256", D2, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "1000–1200", "140° / 140°", "800 (500×500)<br>600 (500×1000)", "150–250", "Corrente costante 1/16", "IP65 / IP50", "3,9–39 m", EI, SI, "CE", "Frontale e posteriore"),
    "P2.6 · OUT": col("2,604 mm", OUT, "SMD1415", "147.456", "96 × 96", "2 × 2 | 2 × 4", "168 × 168 | 168 × 336", D2, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4000–4800", "140° / 120°", "800", "200–300", "Corrente costante 1/24", "IP65 / IP50", "2,6–26 m", EO, SO, "CE", "Frontale e posteriore"),
    "P2.9 · OUT": col("2,976 mm", OUT, "SMD1415", "112.896", "84 × 84", "2 × 2 | 2 × 4", "168 × 168 | 168 × 336", D2, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4500–4800", "140° / 120°", "800", "200–300", "Corrente costante 1/21", "IP65 / IP50", "2,9–29 m", EO, SO, "CE", "Frontale e posteriore"),
    "P3.9 · OUT": col("3,91 mm", OUT, "SMD1921", "65.536", "64 × 64", "2 × 2 | 2 × 4", "128 × 128 | 128 × 256", D2, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4500–5500", "140° / 120°", "800", "200–300", "Corrente costante 1/16", "IP65 / IP50", "3,9–39 m", EO, SO, "CE", "Frontale e posteriore"),
}

D2b = "500 × 500<br>500 × 1000"
EI2 = "−10…45 °C / 20–85%"
SI2 = "−20…65 °C / 10–95%"
STAGE2 = {
    "P1.5 · IN": col("1,56 mm", IN, "SMD1212", "409.600", "160 × 160", "2 × 2", "320 × 320", "500 × 500", "0,25", "6,8", PSU1, CUR_S, "600–800", "170° / 170°", "498", "149", "Corrente costante 1/40", "IP65 / IP50", "1,5–15 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P1.9 · IN": col("1,95 mm", IN, "SMD1515", "262.144", "128 × 128", "2 × 2 | 2 × 4", "256 × 256 | 256 × 512", D2b, "0,25 | 0,5", "6,8 | 11,5", PSU1, CUR_S, "600–800", "170° / 170°", "498", "149", "Corrente costante 1/32", "IP65 / IP50", "1,9–19 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P2.6 · IN": col("2,604 mm", IN, "SMD1515 / SMD2020", "147.456", "96 × 96", "2 × 2 | 2 × 4", "192 × 192 | 192 × 384", D2b, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "800–1000", "140° / 140°", "498", "149", "Corrente costante 1/32", "Mask IP31<br>GOB IP65 / IP50", "2,6–26 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P2.9 · IN": col("2,976 mm", IN, "SMD1515 / SMD2020", "112.896", "84 × 84", "2 × 2 | 2 × 4", "168 × 168 | 168 × 336", D2b, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "800–1200", "140° / 140°", "498", "149", "Corrente costante 1/28", "Mask IP31<br>GOB IP65 / IP50", "2,9–29 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P3.9 · IN": col("3,91 mm", IN, "SMD2020", "65.536", "64 × 64", "2 × 2 | 2 × 4", "128 × 128 | 128 × 256", D2b, "0,25 | 0,5", "6,8 | 11,5", PSU60, CUR_S, "1000–1200", "140° / 140°", "498", "149", "Corrente costante 1/16", "Mask IP31<br>GOB IP65 / IP50", "3,9–39 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P2.6 · OUT": col("2,604 mm", OUT, "SMD1415", "147.456", "96 × 96", "2 × 2 | 2 × 4", "192 × 192 | 192 × 384", D2b, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4000–4800", "140° / 120°", "608", "182", "Corrente costante 1/24", "IP65", "2,6–26 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P2.9 · OUT": col("2,976 mm", OUT, "SMD1415", "112.896", "84 × 84", "2 × 2 | 2 × 4", "168 × 168 | 168 × 336", D2b, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4500–4800", "140° / 120°", "608", "182", "Corrente costante 1/21", "IP65", "2,9–29 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
    "P3.9 · OUT": col("3,91 mm", OUT, "SMD1921", "65.536", "64 × 64", "2 × 2 | 2 × 4", "128 × 128 | 128 × 256", D2b, "0,25 | 0,5", "7,5 | 13,5", PSU80, CUR_S, "4500–5500", "140° / 120°", "608", "182", "Corrente costante 1/16", "IP65", "3,9–39 m", EI2, SI2, "CE, RoHS", "Frontale e posteriore"),
}

CUR_F = "Concava 45°<br>convessa 45°"
FLEX = {
    "P2.6 · IN": col("2,604 mm", IN, "SMD1515", "147.456", "96 × 96", "2 × 2", "192 × 192", "500 × 500", "0,25", "6,8", PSU1, CUR_F, "800–1000", "170° / 170°", "498", "149", "Corrente costante 1/32", "Mask IP31<br>GOB IP65 / IP50", "2,6–26 m", EI2, SI2, "CE, RoHS", "Posteriore"),
    "P2.9 · IN": col("2,976 mm", IN, "SMD1515", "112.896", "84 × 84", "2 × 2", "168 × 168", "500 × 500", "0,25", "6,8", PSU1, CUR_F, "800–1000", "170° / 170°", "498", "149", "Corrente costante 1/28", "Mask IP31<br>GOB IP65 / IP50", "2,9–29 m", EI2, SI2, "CE, RoHS", "Posteriore"),
    "P3.9 · IN": col("3,9 mm", IN, "SMD2020", "65.536", "64 × 64", "2 × 2", "128 × 128", "500 × 500", "0,25", "6,8", PSU1, CUR_F, "1000–1200", "140° / 140°", "498", "149", "Corrente costante 1/16", "Mask IP31<br>GOB IP65 / IP50", "3,9–39 m", EI2, SI2, "CE, RoHS", "Posteriore"),
    "P3.9 · OUT": col("3,9 mm", OUT, "SMD1921", "65.536", "64 × 64", "2 × 2", "128 × 128", "500 × 500", "0,25", "6,8", PSU1, CUR_F, "4000–5000", "140° / 120°", "608", "149", "Corrente costante 1/16", "Mask IP31<br>GOB IP65 / IP50", "3,9–39 m", "−20…50 °C / 10–90%", SI2, "CE, RoHS", "Posteriore"),
}


def tabella(dati, titolo):
    cols = list(dati.keys())
    h = ['<table class="spec"><thead><tr><th class="grp"></th><th class="lab">Modello</th>']
    for c in cols:
        p, u = c.split(" · ")
        h.append(f'<th><b>{p}</b><span>{"Interno" if u == "IN" else "Esterno"}</span></th>')
    h.append('</tr></thead><tbody>')
    gruppo_prec = None
    counts = {}
    for g, _ in ROWS:
        counts[g] = counts.get(g, 0) + 1
    for i, (g, lab) in enumerate(ROWS):
        vals = [dati[c][i] for c in cols]
        cls = ' class="start"' if g != gruppo_prec else ''
        h.append(f'<tr{cls}>')
        if g != gruppo_prec:
            h.append(f'<td class="grp" rowspan="{counts[g]}"><span>{g}</span></td>')
            gruppo_prec = g
        h.append(f'<td class="lab">{E(lab)}</td>')
        if all(v == vals[0] for v in vals):
            h.append(f'<td class="all" colspan="{len(cols)}">{vals[0]}</td>')
        else:
            # unisce celle uguali vicine
            j = 0
            while j < len(vals):
                k = j
                while k + 1 < len(vals) and vals[k + 1] == vals[j]:
                    k += 1
                span = k - j + 1
                h.append(f'<td{" colspan=%d" % span if span > 1 else ""}>{vals[j]}</td>')
                j = k + 1
        h.append('</tr>')
    h.append('</tbody></table>')
    return "".join(h)


ICON = {
    "rapido": '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    "occhio": '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    "angolo": '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    "curva": '<svg viewBox="0 0 24 24"><path d="M3 15c4-8 14-8 18 0"/><path d="M3 19c4-6 14-6 18 0"/></svg>',
    "segnale": '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
    "chiave": '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
    "hz": '<svg viewBox="0 0 24 24"><path d="M2 12h3l2-6 4 12 3-9 2 3h6"/></svg>',
    "cerchio": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>',
    "scudo": '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/></svg>',
}


def icone(lista):
    return '<div class="icons">' + "".join(f'<div class="ic">{ICON[k]}<span>{E(t)}</span></div>' for k, t in lista) + '</div>'


def vantaggi(lista):
    return '<ul class="adv">' + "".join(f'<li>{t}</li>' for t in lista) + '</ul>'


CSS = """
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box}
:root{--ink:#16130e;--paper:#efe8dc;--paper2:#e6ddce;--gold:#c9a24a;--rust:#9a3a15;--dim:#6d6458}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'Jost',sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:297mm;height:210mm;position:relative;overflow:hidden;page-break-after:always;background:var(--paper)}
.pg.dark{background:radial-gradient(120% 90% at 75% 40%,#2a241a 0%,#14110c 55%,#0c0a07 100%);color:#efe6d3}
.h-font{font-family:'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em}
.it{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;color:var(--rust)}
.eyebrow{font:500 8.5pt 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--rust);display:flex;align-items:center;gap:8px}
.eyebrow:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--rust)}
.dark .eyebrow{color:var(--gold)}.dark .eyebrow:before{background:var(--gold)}
.foot{position:absolute;left:14mm;right:14mm;bottom:8mm;display:flex;justify-content:space-between;font:500 7.5pt 'IBM Plex Mono',monospace;letter-spacing:.14em;color:var(--dim);text-transform:uppercase}
.foot b{color:var(--ink);font-weight:600}
.dark .foot{color:#9b907c}.dark .foot b{color:var(--gold)}
.ghost{position:absolute;font-family:'Chakra Petch';font-weight:700;font-size:150pt;line-height:.8;color:transparent;-webkit-text-stroke:1px #00000012;letter-spacing:-.02em;white-space:nowrap}
.dark .ghost{-webkit-text-stroke:1px #ffffff10}
/* copertina */
.cover .logo{position:absolute;left:16mm;top:15mm;width:62mm}
.cover .tit{position:absolute;left:16mm;top:58mm;width:120mm}
.cover h1{margin:6mm 0 0;font:700 40pt/0.95 'Chakra Petch';text-transform:uppercase;letter-spacing:-.005em}
.cover h1 i{display:block;font:500 38pt/1.05 'Cormorant Garamond';font-style:italic;text-transform:none;color:var(--gold)}
.cover p.sub{margin:7mm 0 0;font:300 12pt/1.5 'Jost';color:#d8cdb8;max-width:105mm}
.cover .line{display:flex;gap:6mm;margin-top:9mm}
.cover .line span{font:600 9pt 'Chakra Petch';letter-spacing:.14em;text-transform:uppercase;border:1px solid #c9a24a66;color:#e9dcc0;padding:2.4mm 4mm;border-radius:40px}
.cover .hero{position:absolute;right:-6mm;top:24mm;width:178mm;filter:drop-shadow(0 30px 40px #000c)}
.cover .glow{position:absolute;right:20mm;top:40mm;width:150mm;height:120mm;background:radial-gradient(closest-side,#c9a24a33,transparent);filter:blur(10px)}
/* pagine prodotto */
.intro{position:absolute;left:14mm;top:14mm;width:118mm}
.intro h2{margin:4mm 0 0;font:700 30pt/0.98 'Chakra Petch';text-transform:uppercase}
.intro h2 em{display:block;font:500 25pt/1.1 'Cormorant Garamond';font-style:italic;text-transform:none;color:var(--rust)}
.intro p.lead{margin:5mm 0 0;font:400 10.5pt/1.55 'Jost';color:#3d362c}
.adv{list-style:none;margin:6mm 0 0;padding:0;columns:1}
.adv li{position:relative;padding:0 0 0 6mm;margin:0 0 2.6mm;font:400 9.6pt/1.45 'Jost';color:#2c261e}
.adv li:before{content:"";position:absolute;left:0;top:1.9mm;width:3mm;height:1.4px;background:var(--rust)}
.icons{display:flex;gap:3mm;margin-top:6mm}
.ic{flex:1;background:#fff8;border:1px solid #00000010;border-radius:12px;padding:3.2mm 2mm;text-align:center}
.ic svg{width:7mm;height:7mm;fill:none;stroke:var(--rust);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.ic span{display:block;margin-top:1.6mm;font:600 6.8pt 'Chakra Petch';letter-spacing:.06em;text-transform:uppercase;color:#3a332a}
.dark .ic{background:#ffffff08;border-color:#ffffff14}.dark .ic svg{stroke:var(--gold)}.dark .ic span{color:#e6dac2}
.visual{position:absolute;right:12mm;top:14mm;width:142mm;bottom:20mm}
.card{position:absolute;background:#fbf8f2;border-radius:16px;box-shadow:0 18px 40px -22px #3a2a1466;overflow:hidden;display:flex;align-items:center;justify-content:center}
.card img{max-width:92%;max-height:88%;object-fit:contain}
.card .cap{position:absolute;left:4mm;bottom:3mm;font:500 7pt 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.card .cap b{color:var(--rust)}
/* tabella */
.tabpage .head{position:absolute;left:14mm;top:11mm;right:14mm;display:flex;justify-content:space-between;align-items:flex-end}
.tabpage h3{margin:2mm 0 0;font:700 19pt 'Chakra Petch';text-transform:uppercase}
.tabpage h3 em{font:500 17pt 'Cormorant Garamond';font-style:italic;text-transform:none;color:var(--rust)}
.tabpage .note{font:400 7.5pt/1.4 'Jost';color:var(--dim);max-width:95mm;text-align:right}
.spec{position:absolute;left:14mm;right:14mm;top:29mm;border-collapse:collapse;font:400 6.5pt/1.12 'Jost';color:#2a241c;width:calc(100% - 28mm);table-layout:fixed}
.spec th{background:var(--ink);color:#efe6d3;padding:1.6mm 1mm;font:600 8pt 'Chakra Petch';letter-spacing:.04em}
.spec th span{display:block;font:500 6pt 'IBM Plex Mono',monospace;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin-top:.4mm}
.spec th.grp{width:7mm;background:var(--ink)}
.spec th.lab{width:38mm;text-align:left;padding-left:2.5mm;font-size:8pt;color:var(--gold)}
.spec td{padding:.42mm 1mm;text-align:center;border-bottom:1px solid #00000012;vertical-align:middle}
.spec tr:nth-child(even) td:not(.grp){background:#ffffff4d}
.spec td.lab{text-align:left;padding-left:2.5mm;font-weight:500;color:#4a4237}
.spec td.grp{background:var(--rust);color:#f3e7d6;width:7mm;padding:0;border-bottom:2px solid var(--paper)}
.spec td.grp span{display:block;writing-mode:vertical-rl;transform:rotate(180deg);font:600 7pt 'Chakra Petch';letter-spacing:.2em;text-transform:uppercase;margin:auto}
.spec tr.start td{border-top:2px solid var(--paper)}
.spec td.all{color:#2a241c;font-weight:500}
/* retro */
.back .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.back .center img{width:92mm}
.back h2{margin:12mm 0 0;font:700 28pt 'Chakra Petch';text-transform:uppercase}
.back h2 i{display:block;font:500 25pt 'Cormorant Garamond';font-style:italic;text-transform:none;color:var(--gold)}
.back .contacts{margin-top:11mm;display:grid;grid-template-columns:repeat(4,auto);gap:4mm}
.back .contacts div{border:1px solid #c9a24a55;border-radius:40px;padding:3mm 6mm;font:400 10pt 'Jost';color:#efe4cf}
.back .contacts div b{display:block;font:500 6.5pt 'IBM Plex Mono',monospace;letter-spacing:.16em;color:var(--gold);text-transform:uppercase;margin-bottom:.8mm}
.back .small{margin-top:10mm;font:300 8pt/1.5 'Jost';color:#9b907c;max-width:170mm}
"""


def pagina_prodotto(n, eyebrow, titolo, sottotitolo, lead, ic, adv, carte, ghost, scuro=False):
    cls = "pg dark" if scuro else "pg"
    s = [f'<section class="{cls}"><div class="ghost" style="right:-8mm;bottom:-14mm">{ghost}</div>']
    s.append(f'<div class="intro"><div class="eyebrow">{eyebrow}</div><h2>{titolo}<em>{sottotitolo}</em></h2>'
             f'<p class="lead">{lead}</p>{icone(ic)}{vantaggi(adv)}</div>')
    s.append('<div class="visual">')
    for (x, y, w, h, img, cap) in carte:
        s.append(f'<div class="card" style="left:{x}%;top:{y}%;width:{w}%;height:{h}%"><img src="out/{img}">'
                 + (f'<div class="cap">{cap}</div>' if cap else '') + '</div>')
    s.append('</div>')
    s.append(f'<div class="foot"><span><b>LEDINFINITY</b> · Catalogo 2026</span><span>ledinfinity.eu</span><span>{n:02d}</span></div></section>')
    return "".join(s)


def pagina_tabella(n, eyebrow, nome, dati, nota):
    return (f'<section class="pg tabpage"><div class="head"><div><div class="eyebrow">{eyebrow}</div>'
            f'<h3>{nome} <em>· dati tecnici</em></h3></div><div class="note">{nota}</div></div>'
            f'{tabella(dati, nome)}'
            f'<div class="foot"><span><b>LEDINFINITY</b> · Catalogo 2026</span><span>ledinfinity.eu</span><span>{n:02d}</span></div></section>')


NOTA = "Dati indicativi, soggetti a variazione senza preavviso. La configurazione definitiva del tuo schermo la studiamo insieme, sul tuo progetto."

pagine = []
pagine.append(f'''<section class="pg dark cover">
<div class="ghost" style="left:-6mm;bottom:-16mm">INFINITY</div>
<img class="logo" src="out/logo.png">
<div class="glow"></div>
<img class="hero" src="out/stage_fronte.png">
<div class="tit"><div class="eyebrow">Catalogo 2026 · LED wall professionali</div>
<h1>Stage · Stage II<br>Flex<i>per eventi, palchi e installazioni.</i></h1>
<p class="sub">Cabinet LED per interno ed esterno, dal passo 1,5 al 3,9 mm. Montaggio rapido, schermi piatti, curvi, ad angolo e a 360°.</p>
<div class="line"><span>7680 Hz</span><span>Fino a 5500 nit</span><span>Spedizione in tutto il mondo</span></div></div>
<div class="foot"><span><b>LEDINFINITY</b> · The future is now.</span><span>ledinfinity.eu</span><span>01</span></div></section>''')

pagine.append(pagina_prodotto(2, "Serie Infinity Stage", "Infinity Stage", "il LED wall che si monta in pochi minuti.",
    "Cabinet leggeri in alluminio pressofuso, per interno ed esterno, pensati per chi monta e smonta spesso: concerti, fiere, eventi aziendali e allestimenti.",
    [("rapido", "Montaggio rapido"), ("occhio", "Immagine superiore"), ("angolo", "Angoli protetti"), ("curva", "Composizioni creative"), ("segnale", "Segnale di riserva")],
    ["Cabinet 500 × 500 e 500 × 1000 mm, combinabili in orizzontale e in verticale",
     "Ingresso e uscita del segnale di riserva su entrambi i formati",
     "Alimentatore estraibile per un'assistenza veloce",
     "Protezione degli angoli brevettata, per trasporto e uso frequente",
     "Manutenzione frontale e posteriore, moduli fissati da sole 4 viti di sicurezza",
     "Collegamenti senza cavi tra modulo e scheda: più ordine, più stabilità",
     "Curve fino a 15° concave e 5° convesse, angoli a 45° e 90°",
     "Versione GOB per proteggere i LED da urti e umidità"],
    [(0, 0, 58, 58, "stage_cab.png", "<b>01</b> · Cabinet Infinity Stage"),
     (61, 0, 39, 28, "protezione.png", "<b>02</b> · Angoli protetti"),
     (61, 31, 39, 27, "manutenzione.png", "<b>03</b> · Manutenzione"),
     (0, 61, 100, 39, "composizioni.png", "<b>04</b> · 90° · curva · 360°")], "STAGE"))

pagine.append(pagina_tabella(3, "Serie Infinity Stage", "Infinity Stage", STAGE, NOTA))

pagine.append(pagina_prodotto(4, "Serie Infinity Stage II", "Infinity Stage II", "la seconda generazione.",
    "Stesso spirito di Stage, consumi più bassi e manutenzione ancora più semplice: moduli magnetici serviti dal fronte, doppio ingresso del segnale e angoli protetti.",
    [("chiave", "Servizio frontale"), ("hz", "Refresh 7680 Hz"), ("angolo", "Angoli protetti"), ("curva", "Composizioni creative"), ("segnale", "Segnale di riserva")],
    ["Moduli serviti dal fronte, con magneti forti e viti di sicurezza",
     "Doppio connettore di ingresso su ogni modulo: lo stesso modulo va bene in ogni posizione",
     "Una sola serie per schermi piatti, curvi, ad angolo e flessibili",
     "Compatibile con i cabinet Infinity Flex",
     "Consumo medio da 149 W/m²",
     "Protezione degli angoli durante trasporto e montaggio"],
    [(0, 0, 100, 62, "stage2_cab.png", "<b>01</b> · Cabinet 500 × 500 e 500 × 1000"),
     (0, 65, 48, 35, "stage2_front.png", "<b>02</b> · Modulo frontale"),
     (52, 65, 48, 35, "parete3.png", "<b>03</b> · Anche ad angolo")], "STAGE II"))

pagine.append(pagina_tabella(5, "Serie Infinity Stage II", "Infinity Stage II", STAGE2, NOTA))

pagine.append(pagina_prodotto(6, "Serie Infinity Flex", "Infinity Flex", "flessibile come vuoi tu.",
    "Il cabinet che si curva fino a 45°: otto cabinet formano un cerchio di soli 1,21 m di diametro. Per colonne, onde, cubi e scenografie che nessuno dimentica.",
    [("cerchio", "Cerchio a 360°"), ("curva", "Curve a 45°"), ("chiave", "Servizio frontale"), ("angolo", "Angoli protetti"), ("scudo", "Versione GOB")],
    ["Compatibile con i cabinet Infinity Stage II",
     "Una sola serie per schermi piatti, curvi, ad angolo e flessibili",
     "Moduli serviti dal fronte con viti di sicurezza",
     "Curva fino a 45° per cabinet: 8 cabinet formano un cerchio da 1,21 m",
     "Versione GOB contro urti e umidità",
     "Protezione dei LED del bordo inferiore"],
    [(0, 0, 58, 62, "flex_fronte.png", "<b>01</b> · Cerchio a 360°"),
     (61, 0, 39, 30, "parete2.png", "<b>02</b> · A croce"),
     (61, 32, 39, 30, "parete4.png", "<b>03</b> · Curvo"),
     (0, 65, 100, 35, "parete1.png", "<b>04</b> · Pareti di ogni misura")], "FLEX"))

pagine.append(pagina_tabella(7, "Serie Infinity Flex", "Infinity Flex", FLEX, NOTA))

pagine.append('''<section class="pg dark back"><div class="ghost" style="left:50%;transform:translateX(-50%);bottom:-18mm">LEDINFINITY</div>
<div class="center"><img src="out/logo.png">
<h2>Il tuo progetto<i>inizia da qui.</i></h2>
<div class="contacts"><div><b>Email</b>info@ledinfinity.eu</div><div><b>WhatsApp</b>+39 366 310 0622</div><div><b>Instagram</b>@ledinfinity.ledwall</div><div><b>Sito</b>www.ledinfinity.eu</div></div>
<p class="small">Preventivo gratuito e spedizione in tutto il mondo. I dati tecnici sono indicativi e possono cambiare senza preavviso: il nostro team ti aiuta a scegliere il passo, il formato e la configurazione giusti per il tuo spazio.</p></div>
<div class="foot"><span><b>LEDINFINITY</b> · The future is now.</span><span>ledinfinity.eu</span><span>08</span></div></section>''')

doc = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>LEDINFINITY · Catalogo Stage · Stage II · Flex</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,500&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{"".join(pagine)}</body></html>'''
open("catalogo.html", "w", encoding="utf-8").write(doc)
print("ok", len(pagine), "pagine")
