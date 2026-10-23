# Mosaics de Barcelona

Les **sanefes** (frisos) i els moviments del pla per a l'ESO. Primer l'alumnat **fa** sanefes triant els moviments que les deixen igual; després **classifica** sanefes provant-hi girs, miralls i lliscaments. Lliga amb la sessió «Sanefes» de 1r–2n d'ESO i amb «Moviments al pla» de 3r.

Web: https://mosaics.step-quiz.net

La regla que es diu a l'alumnat: **«Un moviment compta si la sanefa queda exactament igual, colors inclosos.»**

## Les tres parts

| Part | Pàgina | Què fa l'alumne |
|---|---|---|
| Aprèn | `apren.html` | Quatre lliçons amb una F: translació, gir, simetria i lliscament. A cada lliçó, 2 reptes: posar la F de color sobre una F de punts, primer amb controls lliscants i després arrossegant les nanses |
| Taller | `taller.html` | Dibuixa un motiu (traç a mà o polígons, 4 colors, models: lletra F, taca, quart de flor), tria un dels 7 tipus i en veu la sanefa. «Mostra les simetries» hi dibuixa els miralls, els eixos de lliscament i els centres de gir. Desa la imatge (PNG) o imprimeix un full A4 per pintar |
| Classifica | `classifica.html` | 7 sanefes, una de cada tipus, en un ordre a l'atzar. Prova moviments amb tres eines (gir, mirall, lliscament: una còpia transparent de la sanefa moguda) i respon les preguntes una a una. L'eina en proposa el tipus i el compara amb la clau |

`index.html` és la portada, amb la taula dels 7 tipus.

## Els 7 tipus de sanefa

| Clau | Símbol | Nom |
|---|---|---|
| `p111` | p1 | només translació |
| `p11g` | p11g | lliscament |
| `p1m1` | p1m1 | simetria vertical |
| `p11m` | p11m | simetria horitzontal |
| `p112` | p2 | gir de 180° |
| `p2mg` | p2mg | gir i simetria vertical |
| `p2mm` | p2mm | totes les simetries |

Cada tipus es defineix només amb uns quants moviments (els **generadors**); la resta surt per **clausura** (`js/motor/grups.js`). Símbols de les simetries: mirall, línia contínua; eix de lliscament, línia discontínua; centre de gir de 180°, una lent.

**Les preguntes de Classifica** (com a molt 4, sempre en aquest ordre):

1. Té simetria horitzontal? (sí: 2. Té simetria vertical? → `p2mm` o `p11m`)
2. Té simetria vertical? (sí: Té gir de 180°? → `p2mg` o `p1m1`)
3. Té gir de 180°? (sí → `p112`)
4. Té lliscament? (sí → `p11g`; no → `p111`)

Si el tipus que surt no és el bo, l'eina diu quina resposta cal revisar i amb quina eina. Els punts que es toquen a Classifica s'ajusten a una graella de 0,25 (els centres i els eixos de les sanefes hi són sempre).

## Adreces

- `classifica.html?fixed=A` (o `B`, `C`): tota la classe té les mateixes sanefes. Sense, a l'atzar.
- `taller.html?grup=p2mg&model=F`: el tipus i el model inicials.
- `apren.html#gir`: la lliçó inicial (`translacio`, `gir`, `mirall`, `lliscament`).

Els valors estranys s'ignoren. Cap pàgina dona codi de verificació.

## Fotos reals (més endavant)

La v1 de Classifica fa servir sanefes generades, amb una clau segura. Per afegir-hi fotos de sanefes de Barcelona:

1. Només fotos fetes per tu, per companys o per alumnes que hi donin permís; mai d'internet. Sense persones, cares ni matrícules. Fetes de cara a la paret o al terra.
2. `python3 tools/prepara-fotos.py sanefa passeig-de-gracia FOTO.jpg`: la deixa a `fotos/`, amb el costat llarg de 1600 px com a molt, menys de 400 KB i **sense EXIF** (ni GPS).
3. Afegeix-la a `data/fotos.js`, amb el lloc aproximat (un barri, mai una adreça) i el tipus **un cop l'hagis confirmat** amb les eines de Classifica.

## Com provar-ho a l'ordinador

No cal instal·lar res: obre `index.html` amb doble clic. No fa cap petició a internet. Només es desen en aquest navegador el motiu i el tipus del Taller i les lliçons fetes d'Aprèn (`mosaics:v1:motiu`, `mosaics:v1:grup`, `mosaics:v1:apren`); si no es pot, funciona igual.

## Com està fet

HTML, CSS i JavaScript sense compilació, amb scripts clàssics perquè funcioni amb doble clic. Dibuix amb canvas.

```
index.html               portada
apren.html               Aprèn: les quatre lliçons
taller.html              Taller: el motiu i la sanefa
classifica.html          Classifica: les eines i les preguntes
css/tokens.css           colors (clar i fosc), també els de les sanefes
css/mosaics.css          estils i el full per pintar (A4)
data/fotos.js            les fotos reals (encara cap)
js/motor/atzar.js        atzar amb llavor (el de prova1eso)
js/motor/isometries.js   girs, miralls, lliscaments i translacions: g(p) = M·p + t
js/motor/grups.js        els 7 grups: generadors, clausura, còpies, elements de simetria
js/motor/deteccio.js     detector independent de simetries (punts de colors)
js/motor/arbre.js        les preguntes de Classifica
js/motor/motiu.js        els models, els motius a l'atzar i la neteja d'un motiu desat
js/motor/llicons.js      les lliçons d'Aprèn: paràmetres i reptes
js/ui/textos.js          tots els textos
js/ui/pinta.js           el dibuix (motiu, sanefa, símbols, nanses)
js/ui/apren.js           controlador d'Aprèn
js/ui/taller.js          controlador del Taller
js/ui/classifica.js      controlador de Classifica
tools/prepara-fotos.py   prepara les fotos (mida, pes, sense EXIF)
tools/versio.py          posa al dia els ?v= dels CSS i JS
```

## Tests

```
node tests/run-all.js
```

| Fitxer | Què comprova |
|---|---|
| `tests/motor.test.js` | Les isometries; l'ordre de cada grup (clausura) i que és un grup; que el **detector independent**, que no fa servir els generadors, troba a cada sanefa el tipus amb què s'ha fet (també amb els models i amb 60 motius a l'atzar); que cada mirall, eix i centre dibuixat deixa la sanefa igual; l'arbre (cada tipus surt una vegada, com a molt 4 preguntes); les lliçons (cada repte es pot fer amb els controls i amb les nanses) |
| `tests/fotos.test.js` | Cada foto de `data/fotos.js`: el fitxer existeix, fa menys de 400 KB i el JPEG no porta EXIF ni GPS (es llegeixen els segments del fitxer); el tipus és confirmat |
| `tests/repo.test.js` | Que tot fitxer citat existeix, l'ordre dels scripts, cap adreça externa, cap mòdul ES ni `fetch` (doble clic), cap `Math.random`, textos curts |
| `tools/versio.py --comprova` | Que cap `?v=` és vell |
| `tests/docs_vs_codi.py` | Que aquest README diu el mateix que el codi (tipus, preguntes, lliçons, mides de les fotos) |

GitHub els passa a cada pujada a `main` (`.github/workflows/tests.yml`).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
