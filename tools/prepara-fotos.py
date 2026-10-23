#!/usr/bin/env python3
"""
PROJECTE: mosaics (Step Quiz, vanilla JS)
FITXER: tools/prepara-fotos.py
ROL: Prepara les fotos de sanefes i mosaics abans de posar-les a fotos/:
  - el costat llarg, com a molt 1600 px; JPEG de qualitat 80 (si cal, qualitat
    més baixa i, després, 1400 o 1200 px, fins que fa menys de 400 KB);
  - SENSE cap metadada: ni EXIF (tampoc el GPS), ni XMP, ni comentaris;
  - gira la imatge segons l'orientació de l'EXIF abans d'esborrar-lo;
  - el nom: fotos/<tipus>-<nom>-NN.jpg (NN: el primer número lliure).
ÚS:
  python3 tools/prepara-fotos.py sanefa passeig-de-gracia FOTO1.jpg FOTO2.heic …
  (tipus: sanefa o mosaic; nom: minúscules, xifres i guionets)
  Després, afegeix cada foto a data/fotos.js (el grup, només quan l'hagis confirmat).
DEPENDÈNCIES: Pillow (pip install Pillow)
"""
import pathlib
import re
import sys

from PIL import Image, ImageOps

ARREL = pathlib.Path(__file__).resolve().parent.parent
COSTAT = 1600
MAX_BYTES = 400 * 1024


def prepara(origen, desti):
    with Image.open(origen) as im:
        im = ImageOps.exif_transpose(im)  # orientació correcta, abans de treure l'EXIF
        im = im.convert('RGB')
    for costat in (COSTAT, 1400, 1200):
        copia = im.copy()
        copia.thumbnail((costat, costat), Image.LANCZOS)
        # Una imatge nova, sense cap metadada heretada
        net = Image.new('RGB', copia.size)
        net.paste(copia)
        for q in (80, 75, 70, 65, 60):
            net.save(desti, 'JPEG', quality=q, optimize=True, progressive=True)
            if desti.stat().st_size < MAX_BYTES:
                return f'{net.size[0]} × {net.size[1]} px, qualitat {q}'
    desti.unlink()
    raise SystemExit(f'✗ {origen}: no baixa de 400 KB')


def main(args):
    if len(args) < 3 or args[0] not in ('sanefa', 'mosaic') or not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', args[1]):
        raise SystemExit(__doc__)
    tipus, nom, fitxers = args[0], args[1], args[2:]
    carpeta = ARREL / 'fotos'
    carpeta.mkdir(exist_ok=True)
    n = 1
    for f in fitxers:
        while (carpeta / f'{tipus}-{nom}-{n:02d}.jpg').exists():
            n += 1
        desti = carpeta / f'{tipus}-{nom}-{n:02d}.jpg'
        q = prepara(pathlib.Path(f), desti)
        print(f'✓ {f} → {desti.relative_to(ARREL)} ({desti.stat().st_size // 1024} KB, {q})')


if __name__ == '__main__':
    main(sys.argv[1:])
