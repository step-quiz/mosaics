#!/usr/bin/env python3
"""
PROJECTE: mosaics (Step Quiz, vanilla JS)
FITXER: tests/docs_vs_codi.py
ROL: Que el README diu el mateix que el codi:
  - les rutes entre `cometes` del README existeixen;
  - els 7 tipus (clau, símbol i nom) són els de js/motor/grups.js;
  - les preguntes de Classifica són les de js/motor/arbre.js; la graella, la de js/ui/classifica.js;
  - les lliçons i els reptes, els de js/motor/llicons.js; les claus de localStorage, les del codi;
  - les mides de les fotos, les de tools/prepara-fotos.py.
ÚS: python3 tests/docs_vs_codi.py   (només biblioteca estàndard)
"""
import pathlib
import re
import sys

ARREL = pathlib.Path(__file__).resolve().parent.parent
llegeix = lambda rel: (ARREL / rel).read_text(encoding='utf-8')
errors = []


def comprova(cond, msg):
    if not cond:
        errors.append(msg)


readme = llegeix('README.md')

# 1. Rutes citades
for ruta in re.findall(r'`([^`\s#?]+\.(?:js|css|html|py|yml|md))(?:[?#][^`]*)?`', readme):
    if ruta.startswith('.github/'):
        continue  # els workflows es creen des del web de GitHub
    comprova((ARREL / ruta).exists(), f'README.md cita `{ruta}`, que no existeix')

# 2. Els 7 tipus
grups = llegeix('js/motor/grups.js')
tipus = re.findall(r"^        (\w+): \{\n            curt: '([^']+)',\n            nom: '([^']+)'", grups, re.M)
comprova(len(tipus) == 7, f'js/motor/grups.js: esperava 7 grups i n’he trobat {len(tipus)}')
for clau, curt, nom in tipus:
    comprova(f'| `{clau}` | {curt} | {nom} |' in readme, f'README.md: la taula de tipus no té `{clau}` | {curt} | {nom}')
comprova('7 sanefes, una de cada tipus' in readme, 'README.md: Classifica té 7 sanefes')

# 3. Preguntes, eines i graella
arbre = llegeix('js/motor/arbre.js')
for p in re.findall(r"pregunta: '([^']+)'", arbre):
    comprova(p in readme, f'README.md: falta la pregunta «{p}»')
comprova('com a molt 4' in readme, 'README.md: com a molt 4 preguntes')
cl = llegeix('js/ui/classifica.js')
pas = re.search(r'var PAS = ([\d.]+);', cl).group(1).replace('.', ',')
comprova(f'graella de {pas}' in readme, f'README.md: la graella de Classifica és de {pas}')

# 4. Lliçons
ll = llegeix('js/motor/llicons.js')
ids = re.findall(r"'(\w+)'", re.search(r'var IDS = \[([^\]]*)\]', ll).group(1))
comprova(f'Quatre lliçons' in readme and len(ids) == 4, 'README.md: hi ha quatre lliçons')
for i in ids:
    comprova(f'`{i}`' in readme, f'README.md: falta la lliçó `{i}` a les adreces')
reptes = len(re.findall(r'^            reptes: \[', ll, re.M))
per = [len(re.findall(r'\{ [a-z]+:', b)) for b in re.findall(r'reptes: \[(.*?)\],', ll, re.S)]
comprova(reptes == 4 and set(per) == {2}, f'js/motor/llicons.js: 2 reptes per lliçó ({per})')
comprova('2 reptes' in readme, 'README.md: a cada lliçó, 2 reptes')

# 5. localStorage
for f in ('js/ui/taller.js', 'js/ui/apren.js'):
    for clau in re.findall(r"'(mosaics:v1:\w+)'", llegeix(f)):
        comprova(f'`{clau}`' in readme, f'README.md: falta la clau `{clau}`')

# 6. Fotos
fp = llegeix('tools/prepara-fotos.py')
costat = re.search(r'COSTAT = (\d+)', fp).group(1)
kb = re.search(r'MAX_BYTES = (\d+) \* 1024', fp).group(1)
comprova(f'{costat} px' in readme, f'README.md: el costat llarg és de {costat} px')
comprova(f'{kb} KB' in readme, f'README.md: el màxim és {kb} KB')

if errors:
    print(f'✗ mosaics: {len(errors)} discrepàncies entre la documentació i el codi:')
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ mosaics: la documentació quadra amb el codi.')
