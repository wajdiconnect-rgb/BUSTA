#!/usr/bin/env python3
# Catalogo generale Ledinfinity: Grand, Pad, Totem, Front Desk, Stage, Stage II, Flex.
# Riusa stile, dati e funzioni del primo catalogo (genera.py).
src = open("genera.py", encoding="utf-8").read().split("pagine = []")[0]
exec(src)


def tab_generica(colonne, righe, sotto="Esterno"):
    """colonne: lista di (titolo, sottotitolo); righe: lista di (gruppo, etichetta, [valori...])"""
    h = ['<table class="spec"><thead><tr><th class="grp"></th><th class="lab">Modello</th>']
    for t, s in colonne:
        h.append(f'<th><b>{t}</b><span>{s}</span></th>')
    h.append('</tr></thead><tbody>')
    counts = {}
    for g, _, _ in righe:
        counts[g] = counts.get(g, 0) + 1
    prec = None
    for g, lab, vals in righe:
        if isinstance(vals, str):
            vals = [vals] * len(colonne)
        h.append('<tr class="start">' if g != prec else '<tr>')
        if g != prec:
            h.append(f'<td class="grp" rowspan="{counts[g]}"><span>{g}</span></td>')
            prec = g
        h.append(f'<td class="lab">{lab}</td>')
        if all(v == vals[0] for v in vals):
            h.append(f'<td class="all" colspan="{len(vals)}">{vals[0]}</td>')
        else:
            j = 0
            while j < len(vals):
                k = j
                while k + 1 < len(vals) and vals[k + 1] == vals[j]:
                    k += 1
                sp = k - j + 1
                h.append(f'<td{" colspan=%d" % sp if sp > 1 else ""}>{vals[j]}</td>')
                j = k + 1
        h.append('</tr>')
    h.append('</tbody></table>')
    return "".join(h)


def pag_tab(n, eyebrow, nome, tabella_html, nota, grande=False):
    stile = ' style="font-size:7.6pt"' if grande else ''
    return (f'<section class="pg tabpage{" big" if grande else ""}"><div class="head"><div><div class="eyebrow">{eyebrow}</div>'
            f'<h3>{nome} <em>· dati tecnici</em></h3></div><div class="note">{nota}</div></div>'
            f'{tabella_html}'
            f'<div class="foot"><span><b>LEDINFINITY</b> · Catalogo 2026</span><span>ledinfinity.eu</span><span>{n:02d}</span></div></section>')


# ---------------- GRAND (serie fissa da esterno) ----------------
G_COL = [(p, "Esterno") for p in ["P2.9", "P3.9", "P4.8", "P6.2", "P7.8", "P10.4"]]
G_ROWS = [
    ("Modulo", "LED", ["SMD1415", "SMD1921", "SMD1921", "SMD2727", "SMD2727", "SMD2727"]),
    ("Modulo", "Densità (pixel/m²)", ["112.896", "65.536", "43.264", "25.600", "16.384", "9.216"]),
    ("Modulo", "Risoluzione modulo", ["168 × 84", "128 × 64", "104 × 52", "80 × 40", "64 × 32", "48 × 24"]),
    ("Modulo", "Dimensioni modulo (mm)", "500 × 250"),
    ("Cabinet", "Dimensioni cabinet (mm)", "1000 × 1000 &nbsp;·&nbsp; a richiesta 1000 × 500, 1500 × 1000, 1500 × 500 &nbsp;·&nbsp; curvo 562,5 × 1000"),
    ("Cabinet", "Risoluzione cabinet", ["336 × 336", "256 × 256", "208 × 208", "160 × 160", "128 × 128", "96 × 96"]),
    ("Cabinet", "Moduli per cabinet", "2 × 4"),
    ("Cabinet", "Peso cabinet", "22,5 kg"),
    ("Cabinet", "Materiale", "Alluminio"),
    ("Cabinet", "Manutenzione", "Frontale e posteriore"),
    ("Schermo", "Luminosità (nit)", ["5500–6400", "5500 (1/16) – 7000 (1/8)", "5000 (1/13) – 6500 (1/7)", "6000–10.000", "6500–10.000", "6500–10.000"]),
    ("Schermo", "Temperatura colore (K)", "3200–9300"),
    ("Schermo", "Angolo di visione (O/V)", "160° / 120°"),
    ("Schermo", "Distanza di visione", ["3–100 m", "4–100 m", "5–100 m", "6–150 m", "8–150 m", "10–200 m"]),
    ("Schermo", "Contrasto", "5000:1"),
    ("Schermo", "Frequenza (Hz)", "50 / 60"),
    ("Schermo", "Pilotaggio", ["1/21", "1/16 o 1/8", "1/13 o 1/7", "1/8", "1/4", "1/2"]),
    ("Schermo", "Scala di grigi", "14 bit"),
    ("Schermo", "Refresh (Hz)", "3840"),
    ("Schermo", "Consumo max / medio (W/m²)", "730 / 219"),
    ("Schermo", "Protezione IP", "IP67"),
    ("Schermo", "Alimentazione", "AC 200–240 V, 47–63 Hz &nbsp;·&nbsp; AC 100–240 V a richiesta"),
    ("Schermo", "Esercizio (°C / umidità)", "−30…55 °C / 10–90%"),
    ("Schermo", "Stoccaggio (°C / umidità)", "−40…65 °C / 10–95%"),
    ("Schermo", "Certificazioni", "CE, RoHS"),
]

# ---------------- PAD (INPad, interno fine pitch) ----------------
P_COL = [(p, "Interno") for p in ["P1.59", "P1.89", "P2", "P2.5", "P2.9"]]
P_ROWS = [
    ("Modulo", "LED", "SMD / MIP"),
    ("Modulo", "Passo pixel (mm)", ["1,59", "1,89", "2", "2,5", "2,9"]),
    ("Modulo", "Densità (pixel/m²)", ["395.641", "278.784", "250.000", "160.000", "112.896"]),
    ("Modulo", "Dimensioni modulo (mm)", "320 × 180"),
    ("Modulo", "Risoluzione modulo", ["201 × 112", "169 × 95", "160 × 90", "128 × 72", "107 × 61"]),
    ("Pannello", "Dimensioni pannello (mm)", "640 × 720 × 35 &nbsp;·&nbsp; 320 × 360 × 35"),
    ("Pannello", "Risoluzione (640 × 720)", ["402 × 448", "338 × 380", "320 × 360", "256 × 288", "214 × 244"]),
    ("Pannello", "Peso", "15 kg/m²"),
    ("Pannello", "Materiale", "Magnesio pressofuso"),
    ("Pannello", "Manutenzione", "Frontale e posteriore"),
    ("Schermo", "Luminosità (nit)", "600–800 &nbsp;/&nbsp; 1300–1600 &nbsp;/&nbsp; 3500–4000"),
    ("Schermo", "Contrasto", "30.000:1"),
    ("Schermo", "Refresh (Hz)", "3840–7680"),
    ("Schermo", "Angolo di visione (O/V)", "170° / 170°"),
    ("Schermo", "Consumo max / medio (W/m²)", "450 / 150"),
    ("Schermo", "Utilizzo", "Solo interno"),
]

# ---------------- TOTEM (TOTEM Pro, esterno fine pitch) ----------------
T_COL = [(p, "Esterno") for p in ["P0.9", "P1.2", "P1.48", "P1.5", "P1.8"]]
T_ROWS = [
    ("Modulo", "Passo pixel (mm)", ["0,9306 × 0,9297", "1,2407 × 1,2396", "1,4888 × 1,4875", "1,5581 × 1,5658", "1,8611 × 1,8594"]),
    ("Modulo", "LED", "COB / MIP"),
    ("Modulo", "Densità (pixel/m²)", ["1.154.822", "649.587", "451.550", "409.891", "288.973"]),
    ("Modulo", "Moduli", "6 × 6 &nbsp;/&nbsp; 7 × 7 &nbsp;/&nbsp; 8 × 8"),
    ("Modulo", "Risoluzione modulo", ["144 × 256", "108 × 192", "90 × 160", "86 × 152", "72 × 128"]),
    ("Risoluzione", "Schermo 65″", ["864 × 1536", "648 × 1152", "540 × 960", "516 × 912", "432 × 768"]),
    ("Risoluzione", "Schermo 75″", ["1008 × 1792", "756 × 1344", "630 × 1120", "602 × 1064", "504 × 896"]),
    ("Risoluzione", "Schermo 86″", ["1152 × 2048", "864 × 1536", "1152 × 1280", "688 × 1216", "576 × 1024"]),
    ("Misure", "65″ (mm)", "Monofacciale 1004 × 2238 × 190 &nbsp;·&nbsp; Bifacciale 1004 × 2238 × 278"),
    ("Misure", "75″ (mm)", "Monofacciale 1138 × 2476 × 190 &nbsp;·&nbsp; Bifacciale 1138 × 2416 × 278"),
    ("Misure", "86″ (mm)", "Monofacciale 1276 × 2714 × 190 &nbsp;·&nbsp; Bifacciale 1276 × 2654 × 278"),
    ("Misure", "Peso 65″ / 75″ / 86″", "Monofacciale 200 / 240 / 300 kg &nbsp;·&nbsp; Bifacciale 260 / 310 / 380 kg"),
    ("Schermo", "Materiale", "Alluminio"),
    ("Schermo", "Luminosità (nit)", ["3500–4000", "3500–4000", "4000–4500", "4000–4500", "4000–4500"]),
    ("Schermo", "Refresh (Hz)", "≥ 3840"),
    ("Schermo", "Contrasto", "15.000:1"),
    ("Schermo", "Protezione (fronte / retro)", "IP65 / IP65"),
    ("Schermo", "Angolo di visione", "170° / 170°"),
    ("Schermo", "Consumo max / medio (W/m²)", "750 / 250"),
]

# ---------------- FRONT DESK ----------------
F_COL = [(p, "Interno") for p in ["P1.25", "P1.53", "P1.86", "P2", "P2.5"]]
F_ROWS = [
    ("Modulo", "Passo pixel", ["1,25 mm", "1,53 mm", "1,86 mm", "2 mm", "2,5 mm"]),
    ("Modulo", "Modulo", "Flessibile 320 × 160 mm, protezione GOB"),
    ("Modulo", "Risoluzione modulo", ["256 × 128", "208 × 104", "172 × 86", "160 × 80", "128 × 64"]),
    ("Modulo", "Risoluzione cabinet", ["384 × 768", "312 × 624", "256 × 512", "240 × 480", "192 × 384"]),
    ("Modulo", "Scansione", ["1/32", "1/52", "1/43", "1/54", "1/32"]),
    ("Schermo", "Luminosità", "600 nit, regolabile su 10 livelli"),
    ("Schermo", "Angolo di visione", "160° / 160°"),
    ("Schermo", "Refresh (Hz)", "3840"),
    ("Schermo", "Protezione IP", "IP43"),
    ("Schermo", "Alimentazione", "110–240 V AC, 50–60 Hz"),
    ("Schermo", "Temperatura di esercizio", "−20…+50 °C"),
    ("Collegamenti", "Video", "2 × HDMI (ingresso e uscita), 1 × USB 2.0"),
    ("Collegamenti", "Rete", "RJ45, Wi-Fi, rete locale AP, 4G (opzionale)"),
    ("Collegamenti", "Sorgenti", "Composito, S-Video, Component, HDMI, SDI, VGA, DVI"),
    ("Struttura", "Materiale", "Acciaio verniciato nero"),
    ("Struttura", "Installazione", "A terra (standard) · sovrapposto, appeso o a parete (opzionale)"),
    ("Struttura", "Certificazioni", "CE, RoHS, FCC, MET"),
]
F_MISURE = [("1920 × 960", "1065 × 585 × 1100", "97 kg"), ("2240 × 960", "1360 × 585 × 1100", "115 kg"),
            ("2560 × 960", "1675 × 585 × 1100", "130 kg"), ("2880 × 960", "1995 × 585 × 1100", "145 kg"),
            ("3200 × 960", "2315 × 585 × 1100", "165 kg")]

CSS2 = """
.card.dk{background:#16130e}
.card.foto img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:cover}
.card.foto .cap{color:#efe6d3;text-shadow:0 1px 6px #000}
.card.foto .cap b{color:var(--gold)}
.dark .card.dk{background:#0d0b08}
.mini{margin-top:5mm;border-collapse:collapse;width:100%;font:400 8pt 'Jost';color:#2c261e}
.mini th{font:600 7pt 'Chakra Petch';letter-spacing:.08em;text-transform:uppercase;color:var(--rust);text-align:left;padding:1.2mm 1.5mm;border-bottom:1.5px solid var(--rust)}
.mini td{padding:1.1mm 1.5mm;border-bottom:1px solid #00000014}
.tabpage.big .spec{font-size:7.6pt;line-height:1.25}
.tabpage.big .spec td{padding:1.15mm 1.2mm}
.cover2 .lines{position:absolute;left:16mm;bottom:22mm;display:flex;gap:3mm;flex-wrap:wrap;width:150mm}
.cover2 .lines span{font:600 8.5pt 'Chakra Petch';letter-spacing:.14em;text-transform:uppercase;border:1px solid #c9a24a66;color:#e9dcc0;padding:2mm 3.6mm;border-radius:40px}
.cover2 .stack img{position:absolute;filter:drop-shadow(0 26px 30px #000c)}
.toc{position:absolute;right:16mm;top:20mm;width:110mm}
.toc .row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #00000018;padding:3.2mm 0}
.toc .row b{font:700 15pt 'Chakra Petch';text-transform:uppercase}
.toc .row i{font:500 12pt 'Cormorant Garamond';color:var(--rust);margin-left:3mm}
.toc .row span{font:500 9pt 'IBM Plex Mono',monospace;color:var(--dim)}
"""


def prodotto(n, eyebrow, titolo, sotto, lead, ic, adv, carte, ghost, extra=""):
    s = [f'<section class="pg"><div class="ghost" style="right:-8mm;bottom:-14mm">{ghost}</div>']
    s.append(f'<div class="intro"><div class="eyebrow">{eyebrow}</div><h2>{titolo}<em>{sotto}</em></h2>'
             f'<p class="lead">{lead}</p>{icone(ic)}{vantaggi(adv)}{extra}</div><div class="visual">')
    for (x, y, w, h, img, cap, tipo) in carte:
        s.append(f'<div class="card {tipo}" style="left:{x}%;top:{y}%;width:{w}%;height:{h}%"><img src="out/{img}">'
                 + (f'<div class="cap">{cap}</div>' if cap else '') + '</div>')
    s.append(f'</div><div class="foot"><span><b>LEDINFINITY</b> · Catalogo 2026</span><span>ledinfinity.eu</span><span>{n:02d}</span></div></section>')
    return "".join(s)


P = []
# copertina generale
P.append('''<section class="pg dark cover cover2">
<div class="ghost" style="left:-6mm;bottom:-16mm">INFINITY</div>
<img class="logo" src="out/logo.png">
<div class="glow" style="right:10mm;top:30mm;width:180mm;height:150mm"></div>
<div class="stack">
<img src="out/grand_fronte.png" style="right:96mm;top:62mm;width:70mm">
<img src="out/totem_fronte.png" style="right:66mm;top:30mm;height:150mm">
<img src="out/pad_fronte.png" style="right:8mm;top:48mm;height:118mm">
</div>
<div class="tit"><div class="eyebrow">Catalogo prodotti 2026</div>
<h1>Schermi LED<br>professionali<i>per ogni spazio.</i></h1>
<p class="sub">Facciate, negozi, uffici, eventi e palchi: sette linee Infinity, dal passo 0,9 al 10,4 mm. Preventivo gratuito e spedizione in tutto il mondo.</p></div>
<div class="lines"><span>Grand</span><span>Pad</span><span>Totem</span><span>Front Desk</span><span>Stage</span><span>Stage II</span><span>Flex</span></div>
<div class="foot"><span><b>LEDINFINITY</b> · The future is now.</span><span>ledinfinity.eu</span><span>01</span></div></section>''')

# indice
P.append('''<section class="pg"><div class="ghost" style="left:-6mm;bottom:-16mm">LINEE</div>
<div class="intro"><div class="eyebrow">Le linee Infinity</div><h2>Sette linee<em>un solo interlocutore.</em></h2>
<p class="lead">Dalla facciata da 10.000 nit al bancone reception, dal totem in pieno sole al palco per i concerti. Ti aiutiamo a scegliere passo, formato e configurazione, e seguiamo il progetto fino all'installazione.</p>
<ul class="adv"><li>Preventivo gratuito in un giorno lavorativo</li><li>Spedizione in tutto il mondo</li><li>Assistenza e ricambi</li></ul></div>
<div class="toc">
<div class="row"><div><b>Grand</b><i>facciate e grandi spazi</i></div><span>03</span></div>
<div class="row"><div><b>Pad</b><i>pareti LED da interno</i></div><span>05</span></div>
<div class="row"><div><b>Totem</b><i>totem da esterno</i></div><span>07</span></div>
<div class="row"><div><b>Front Desk</b><i>banconi LED</i></div><span>09</span></div>
<div class="row"><div><b>Stage</b><i>eventi e palchi</i></div><span>11</span></div>
<div class="row"><div><b>Stage II</b><i>la seconda generazione</i></div><span>13</span></div>
<div class="row"><div><b>Flex</b><i>schermi curvi e creativi</i></div><span>15</span></div>
</div>
<div class="foot"><span><b>LEDINFINITY</b> · Catalogo 2026</span><span>ledinfinity.eu</span><span>02</span></div></section>''')

P.append(prodotto(3, "Serie Infinity Grand", "Infinity Grand", "il grande schermo da esterno.",
    "Per facciate, piazze, stadi e insegne: cabinet da 1 m² in alluminio, protezione IP67 e luminosità fino a 10.000 nit, per immagini nitide anche in pieno sole.",
    [("chiave", "Servizio frontale"), ("occhio", "Fino a 10.000 nit"), ("scudo", "IP67"), ("rapido", "Risparmio energetico"), ("curva", "Soluzioni 3D")],
    ["Moduli e alimentatori si sostituiscono dal fronte, anche a schermo acceso",
     "Sostituzione a caldo: si interviene senza spegnere lo schermo",
     "Ganci rapidi in acciaio inox e pannelli in alluminio di precisione, per una superficie perfettamente piana",
     "Angoli a 90° e cabinet curvi per schermi 3D d'effetto",
     "Formati 1000 × 1000, 1000 × 500, 1500 × 1000 e 1500 × 500 mm",
     "Dal passo 2,9 al 10,4 mm, per ogni distanza di visione"],
    [(0, 0, 58, 62, "grand_fronte.png", "<b>01</b> · Infinity Grand", ""),
     (61, 0, 39, 30, "grand_front.png", "<b>02</b> · Servizio frontale", ""),
     (61, 32, 39, 30, "grand_hot.png", "<b>03</b> · Sostituzione a caldo", "foto"),
     (0, 65, 58, 35, "grand_3d.png", "<b>04</b> · Soluzioni 3D, angoli a 90°", ""),
     (61, 65, 39, 35, "grand_install.png", "<b>05</b> · Ganci rapidi", "foto")], "GRAND"))
P.append(pag_tab(4, "Serie Infinity Grand", "Infinity Grand", tab_generica(G_COL, G_ROWS), NOTA, grande=True))

P.append(prodotto(5, "Serie Infinity Pad", "Infinity Pad", "il pannello che diventa parete, totem o vetrina.",
    "Pannelli fine pitch da interno, spessi solo 35 mm, in magnesio pressofuso. Si appendono in vetrina, si montano a parete o diventano un totem pieghevole.",
    [("scudo", "MIP / GOB"), ("chiave", "Fronte e retro"), ("curva", "Forme creative"), ("hz", "Fino a 7680 Hz"), ("rapido", "Totem pieghevole")],
    ["Tecnologia MIP/GOB: resistente a umidità, polvere, urti e cariche elettrostatiche",
     "Da 58 a 463 pollici, in 16:9 e 4:3: oltre il limite dei monitor LCD",
     "Ogni componente si sostituisce dal fronte o dal retro",
     "Installazione a parete o su struttura in acciaio",
     "Vetrine: 35 mm di spessore e travi di sospensione dedicate",
     "Diventa un totem mobile e pieghevole, che sta in un flight case"],
    [(0, 0, 50, 58, "pad_fronte.png", "<b>01</b> · Infinity Pad", ""),
     (53, 0, 47, 28, "pad_esploso.png", "<b>02</b> · Moduli e struttura", "dk"),
     (53, 30, 47, 28, "pad_creativo.png", "<b>03</b> · Angoli, colonne, cubi", "dk foto"),
     (0, 61, 50, 39, "pad_kiosk_misure.png", "<b>04</b> · Totem 720 – 2160 mm", "dk"),
     (53, 61, 47, 39, "pad_kiosk.png", "<b>05</b> · Si piega e si trasporta", "dk")], "PAD"))
P.append(pag_tab(6, "Serie Infinity Pad", "Infinity Pad", tab_generica(P_COL, P_ROWS), NOTA, grande=True))

P.append(prodotto(7, "Serie Infinity Totem", "Infinity Totem", "la tua vetrina, sempre accesa.",
    "Totem LED da esterno fine pitch, in 65″, 75″ e 86″, mono o bifacciale. Fino a 4500 nit: si legge in pieno sole, dove un LCD si spegne.",
    [("occhio", "Fino a 4500 nit"), ("scudo", "IP65"), ("segnale", "4G · 5G · Wi-Fi"), ("chiave", "Modulare"), ("rapido", "100.000 ore")],
    ["Fino a 4500 nit, contro i 2000–3000 di un totem LCD da esterno",
     "LED con durata fino a 100.000 ore, senza il calo di luce dei retroilluminati LCD",
     "Gestione da remoto via 4G/5G, Wi-Fi o rete, anche di più totem insieme",
     "Lettore multimediale con hotspot: si gestisce dallo smartphone con un'app",
     "Moduli, alimentatori e schede si sostituiscono uno per uno",
     "Misure standard 75″ e 86″: prende il posto di un totem LCD esistente"],
    [(0, 0, 40, 100, "totem_fronte.png", "<b>01</b> · Infinity Totem", ""),
     (43, 0, 57, 48, "totem_doppio.png", "<b>02</b> · Bifacciale", "dk"),
     (43, 51, 57, 49, "totem_misure.png", "<b>03</b> · 65″ · 75″ · 86″", "dk")], "TOTEM"))
P.append(pag_tab(8, "Serie Infinity Totem", "Infinity Totem", tab_generica(T_COL, T_ROWS), NOTA, grande=True))

mis = '<table class="mini"><tr><th>Schermo (mm)</th><th>Bancone L × P × A (mm)</th><th>Peso</th></tr>' + "".join(
    f'<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in F_MISURE) + '</table>'
P.append(prodotto(9, "Serie Infinity Front Desk", "Front Desk LED", "il bancone che accoglie i clienti.",
    "Reception, cassa, stand e consolle DJ: un bancone con schermo LED curvo, pronto da collegare. Mostri prodotti e offerte e li cambi quando vuoi.",
    [("curva", "Modulo flessibile"), ("scudo", "GOB"), ("rapido", "Plug & play"), ("segnale", "Wi-Fi · USB · HDMI"), ("chiave", "Manutenzione facile")],
    ["Moduli flessibili 320 × 160 mm con protezione GOB, fissati a magnete",
     "Controller integrato con Wi-Fi, USB e HDMI, predisposto per l'audio",
     "Ruote con altezza regolabile e presa elettrica a standard UE, UK o USA",
     "Si apre e si cura con una semplice ventosa",
     "Spedito in flight case: resistente agli urti e all'acqua"],
    [(0, 0, 58, 60, "fd_fronte.jpg", "<b>01</b> · Front Desk LED", "foto"),
     (61, 0, 39, 60, "fd_retro.jpg", "<b>02</b> · Il retro", "foto"),
     (0, 63, 58, 37, "fd_curvo.jpg", "<b>03</b> · Schermo curvo", "foto"),
     (61, 63, 39, 37, "fd_controller.jpg", "<b>04</b> · Controller Wi-Fi", "foto")], "DESK", extra=mis))
P.append(pag_tab(10, "Serie Infinity Front Desk", "Front Desk LED", tab_generica(F_COL, F_ROWS), NOTA, grande=True))

# Stage, Stage II, Flex dal primo catalogo, rinumerati
st = [x for x in pagine_vecchie] if False else None

doc_vecchio = open("genera.py", encoding="utf-8").read().split("pagine = []")[1].split("doc = ")[0]
pagine = []
exec(doc_vecchio)
# pagine: [copertina, stage, stage tab, stage2, stage2 tab, flex, flex tab, retro]
import re
num = 11
for pg in pagine[1:7]:
    pg = re.sub(r'<span>(\d\d)</span></div></section>$', f'<span>{num:02d}</span></div></section>', pg)
    P.append(pg)
    num += 1
retro = re.sub(r'<span>(\d\d)</span></div></section>$', f'<span>{num:02d}</span></div></section>', pagine[7])
P.append(retro)

doc = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>LEDINFINITY · Catalogo prodotti 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,500&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>{CSS}{CSS2}</style></head><body>{"".join(P)}</body></html>'''
open("catalogo_generale.html", "w", encoding="utf-8").write(doc)
print("ok", len(P), "pagine")
