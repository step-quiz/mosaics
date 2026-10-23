/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: tests/fotos.test.js
 * ROL: Les fotos de data/fotos.js (especificació §8.5):
 *   - cada entrada té tots els camps, un fitxer que existeix, < 400 KB, JPEG;
 *   - el JPEG no porta EXIF (i, per tant, ni GPS): es llegeixen els segments
 *     directament, sense cap biblioteca;
 *   - el grup és un dels 7 de les sanefes i està confirmat; el lloc no és una adreça;
 *   - cap foto de fotos/ sense entrada a data/fotos.js.
 *   També prova el lector de segments amb un JPEG fet a mà que porta GPS.
 * ÚS: node tests/fotos.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { suite, ok, eq, finish } = require('./harness');
const FOTOS = require('../data/fotos.js');
const G = require('../js/motor/grups.js');

const ARREL = path.resolve(__dirname, '..');

/** Segments d'un JPEG fins a les dades de la imatge: { jpeg, exif, gps, xmp } */
function llegeixJpeg(buf) {
    const out = { jpeg: buf[0] === 0xff && buf[1] === 0xd8, exif: false, gps: false, xmp: false };
    if (!out.jpeg) return out;
    let i = 2;
    while (i + 4 <= buf.length) {
        if (buf[i] !== 0xff) break;
        const marca = buf[i + 1];
        if (marca === 0xd8 || (marca >= 0xd0 && marca <= 0xd7) || marca === 0x01) {
            i += 2;
            continue;
        }
        if (marca === 0xda || marca === 0xd9) break; // dades de la imatge
        const llarg = buf.readUInt16BE(i + 2);
        const dades = buf.subarray(i + 4, i + 2 + llarg);
        if (marca === 0xe1 && dades.subarray(0, 6).toString('latin1') === 'Exif\0\0') {
            out.exif = true;
            const t = dades.subarray(6);
            const le = t.subarray(0, 2).toString('latin1') === 'II';
            const u16 = o => (le ? t.readUInt16LE(o) : t.readUInt16BE(o));
            const u32 = o => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
            const ifd = u32(4);
            const n = u16(ifd);
            for (let k = 0; k < n; k++) if (u16(ifd + 2 + 12 * k) === 0x8825) out.gps = true;
        }
        if (marca === 0xe1 && dades.toString('latin1').startsWith('http://ns.adobe.com/xap')) out.xmp = true;
        i += 2 + llarg;
    }
    return out;
}

suite('1. El lector de JPEG');
{
    // JPEG mínim fet a mà: SOI, APP1 Exif (TIFF big-endian, IFD0 amb l'etiqueta GPS 0x8825), SOS, EOI
    const tiff = Buffer.from([
        0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 1, 0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0,
    ]);
    const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
    const amb = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
        Buffer.from([(app1.length + 2) >> 8, (app1.length + 2) & 255]),
        app1,
        Buffer.from([0xff, 0xda, 0, 2, 0xff, 0xd9]),
    ]);
    const r = llegeixJpeg(amb);
    ok('troba l’EXIF i el GPS d’un JPEG que en porta', r.jpeg && r.exif && r.gps, JSON.stringify(r));
    const sense = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 0xff, 0xd9]);
    const s = llegeixJpeg(sense);
    ok('un JPEG sense EXIF: res', s.jpeg && !s.exif && !s.gps, JSON.stringify(s));
    ok('un PNG no és un JPEG', !llegeixJpeg(Buffer.from([0x89, 0x50, 0x4e, 0x47])).jpeg);
}

suite('2. data/fotos.js');
{
    ok('és una llista', Array.isArray(FOTOS));
    const CAMPS = ['id', 'fitxer', 'tipus', 'grup', 'confirmat', 'lloc', 'autor', 'data', 'llicencia'];
    const ids = new Set();
    for (const f of FOTOS) {
        const nom = f.id || '(sense id)';
        ok(
            `${nom}: tots els camps`,
            CAMPS.every(c => f[c] !== undefined && f[c] !== ''),
            CAMPS.filter(c => !f[c]).join(', ')
        );
        ok(`${nom}: id únic`, !ids.has(f.id));
        ids.add(f.id);
        ok(
            `${nom}: fitxer fotos/<tipus>-<nom>-NN.jpg`,
            /^fotos\/(sanefa|mosaic)-[a-z0-9]+(-[a-z0-9]+)*-\d\d\.jpg$/.test(f.fitxer) &&
                f.fitxer.startsWith(`fotos/${f.tipus}-`)
        );
        const camí = path.join(ARREL, f.fitxer);
        if (!fs.existsSync(camí)) {
            ok(`${nom}: el fitxer existeix`, false);
            continue;
        }
        const buf = fs.readFileSync(camí);
        ok(`${nom}: menys de 400 KB`, buf.length < 400 * 1024, `${Math.round(buf.length / 1024)} KB`);
        const j = llegeixJpeg(buf);
        ok(`${nom}: JPEG sense EXIF, sense GPS i sense XMP`, j.jpeg && !j.exif && !j.gps && !j.xmp, JSON.stringify(j));
        ok(
            `${nom}: el grup és una sanefa i està confirmat`,
            f.tipus !== 'sanefa' || (G.IDS.includes(f.grup) && f.confirmat === true)
        );
        ok(`${nom}: el lloc és aproximat (sense números de carrer)`, !/\d/.test(f.lloc));
        eq(`${nom}: llicència`, f.llicencia, 'CC BY-NC-SA 4.0');
    }
    const fitxers = fs.readdirSync(path.join(ARREL, 'fotos')).filter(f => !f.startsWith('.'));
    const sobren = fitxers.filter(f => !FOTOS.some(x => x.fitxer === `fotos/${f}`));
    ok(
        `fotos/: cap fitxer sense entrada a data/fotos.js (${fitxers.length} fitxers)`,
        !sobren.length,
        sobren.join(', ')
    );
}

finish('FOTOS');
