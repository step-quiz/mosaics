/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/motiu.js
 * ROL: El motiu (el dibuix que es repeteix): models predefinits (la lletra F,
 *      una taca, un quart de flor com el del panot), motius a l'atzar per a
 *      Classifica, la neteja d'un motiu desat i els punts que fa servir el
 *      detector de simetries.
 * ARQUITECTURA: Pur, sense DOM. Un motiu és { formes: [forma] } dins del
 *      quadrat [0, 1] × [0, 1] (y cap amunt). Cada forma:
 *        { tipus: 'poligon', color: 0–3, punts: [[x, y], …] }   (s'omple)
 *        { tipus: 'traç',    color: 0–3, punts: [[x, y], …] }   (línia a mà)
 *      Els colors són els 4 de la paleta (js/ui/pinta.js).
 * DEPENDÈNCIES: cap (rep l'atzar de js/motor/atzar.js com a paràmetre)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Motiu = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var COLORS = 4,
        MAX_FORMES = 80,
        MAX_PUNTS = 600;
    var r3 = function (v) {
        return Math.round(v * 1000) / 1000;
    };
    var cercle = function (cx, cy, r, n) {
        var out = [];
        for (var i = 0; i < n; i++) {
            var t = (2 * Math.PI * i) / n;
            out.push([r3(cx + r * Math.cos(t)), r3(cy + r * Math.sin(t))]);
        }
        return out;
    };
    // Pètal (fus) de p a q, d'amplada màxima w
    function petal(px, py, qx, qy, w, n) {
        var dx = qx - px,
            dy = qy - py,
            L = Math.hypot(dx, dy),
            nx = -dy / L,
            ny = dx / L;
        var out = [];
        for (var i = 0; i <= n; i++) {
            var s = i / n,
                h = (w / 2) * Math.sin(Math.PI * s);
            out.push([r3(px + dx * s + nx * h), r3(py + dy * s + ny * h)]);
        }
        for (var j = n - 1; j > 0; j--) {
            var s2 = j / n,
                h2 = (w / 2) * Math.sin(Math.PI * s2);
            out.push([r3(px + dx * s2 - nx * h2), r3(py + dy * s2 - ny * h2)]);
        }
        return out;
    }
    // Mig pètal enganxat a una vora (de (0,0) cap a q, només a un costat)
    function migPetal(qx, qy, w, n, costat) {
        var L = Math.hypot(qx, qy),
            nx = (-qy / L) * costat,
            ny = (qx / L) * costat;
        var out = [[0, 0]];
        for (var i = 1; i < n; i++) {
            var s = i / n,
                h = w * Math.sin(Math.PI * s);
            out.push([r3(qx * s + nx * h), r3(qy * s + ny * h)]);
        }
        out.push([qx, qy]);
        return out;
    }
    function taca(fase, a2, a3, cx, cy) {
        var out = [];
        for (var i = 0; i < 48; i++) {
            var t = (2 * Math.PI * i) / 48;
            var r = 0.27 + a2 * Math.sin(2 * t + fase) + a3 * Math.cos(3 * t + 0.7 * fase);
            out.push([r3(cx + r * Math.cos(t)), r3(cy + r * Math.sin(t))]);
        }
        return out;
    }

    var PREDEFINITS = {
        F: {
            nom: 'Lletra F',
            motiu: function () {
                return {
                    formes: [
                        {
                            tipus: 'poligon',
                            color: 0,
                            punts: [
                                [0.25, 0.12],
                                [0.42, 0.12],
                                [0.42, 0.45],
                                [0.66, 0.45],
                                [0.66, 0.59],
                                [0.42, 0.59],
                                [0.42, 0.72],
                                [0.78, 0.72],
                                [0.78, 0.88],
                                [0.25, 0.88],
                            ],
                        },
                    ],
                };
            },
        },
        taca: {
            nom: 'Taca',
            motiu: function () {
                return {
                    formes: [
                        { tipus: 'poligon', color: 2, punts: taca(0.6, 0.07, 0.05, 0.47, 0.5) },
                        { tipus: 'poligon', color: 1, punts: cercle(0.6, 0.6, 0.07, 20) },
                    ],
                };
            },
        },
        flor: {
            nom: 'Quart de flor',
            motiu: function () {
                return {
                    formes: [
                        { tipus: 'poligon', color: 0, punts: petal(0, 0, 0.78, 0.78, 0.32, 16) },
                        { tipus: 'poligon', color: 2, punts: migPetal(0.72, 0, 0.13, 12, 1) },
                        { tipus: 'poligon', color: 2, punts: migPetal(0, 0.72, 0.13, 12, -1) },
                        { tipus: 'poligon', color: 1, punts: [[0, 0]].concat(cercle(0, 0, 0.2, 40).slice(0, 11)) },
                    ],
                };
            },
        },
    };

    // ── Motius a l'atzar (Classifica) ──────────────────────────────────────
    var FAMILIES = {
        F: function () {
            return PREDEFINITS.F.motiu().formes;
        },
        taca: function (at) {
            return [
                {
                    tipus: 'poligon',
                    color: 0,
                    punts: taca(at.real() * 6, 0.05 + at.real() * 0.04, 0.03 + at.real() * 0.04, 0.48, 0.5),
                },
            ];
        },
        peix: function () {
            return [
                {
                    tipus: 'poligon',
                    color: 0,
                    punts: [
                        [0.12, 0.5],
                        [0.3, 0.68],
                        [0.55, 0.74],
                        [0.72, 0.6],
                        [0.88, 0.76],
                        [0.84, 0.5],
                        [0.88, 0.3],
                        [0.72, 0.42],
                        [0.52, 0.3],
                        [0.3, 0.34],
                    ],
                },
            ];
        },
        fulla: function () {
            return [{ tipus: 'poligon', color: 0, punts: petal(0.15, 0.2, 0.82, 0.78, 0.36, 14) }];
        },
        flor: function () {
            return PREDEFINITS.flor.motiu().formes;
        },
    };
    var FAMILIES_IDS = Object.keys(FAMILIES);

    // Les 8 maneres de posar el quadrat sobre ell mateix (girs de 90° i miralls)
    function d4(k, p) {
        var x = p[0] - 0.5,
            y = p[1] - 0.5;
        for (var i = 0; i < k % 4; i++) {
            var t = x;
            x = -y;
            y = t;
        }
        if (k >= 4) x = -x;
        return [r3(x + 0.5), r3(y + 0.5)];
    }

    /** Un motiu a l'atzar: una família, girada o reflectida, amb 2 colors i una marca de l'altre color. */
    function aLAtzar(at) {
        var fam = at.tria(FAMILIES_IDS);
        var k = at.enter(0, 7);
        var colors = at.barreja([0, 1, 2, 3]);
        var formes = FAMILIES[fam](at).map(function (f) {
            return { tipus: f.tipus, color: colors[f.color % 4], punts: f.punts.map(d4.bind(null, k)) };
        });
        // Una marca petita d'un altre color, fora del centre: trenca qualsevol simetria del motiu
        if (fam !== 'flor')
            formes.push({
                tipus: 'poligon',
                color: colors[3],
                punts: cercle(0.33 + at.real() * 0.1, 0.62 + at.real() * 0.08, 0.06, 16),
            });
        return { familia: fam, formes: formes };
    }

    // ── Neteja d'un motiu de fora (localStorage) ───────────────────────────
    function neteja(m) {
        if (!m || !Array.isArray(m.formes)) return null;
        var formes = [];
        m.formes.slice(0, MAX_FORMES).forEach(function (f) {
            if (!f || (f.tipus !== 'poligon' && f.tipus !== 'traç') || !Array.isArray(f.punts)) return;
            var c = Number(f.color);
            if (!(Number.isInteger(c) && c >= 0 && c < COLORS)) return;
            var punts = [];
            f.punts.slice(0, MAX_PUNTS).forEach(function (p) {
                if (Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]))
                    punts.push([r3(Math.min(1, Math.max(0, +p[0]))), r3(Math.min(1, Math.max(0, +p[1])))]);
            });
            if (punts.length >= (f.tipus === 'poligon' ? 3 : 2))
                formes.push({ tipus: f.tipus, color: c, punts: punts });
        });
        return { formes: formes };
    }

    /** Punts de colors del motiu (vèrtexs i punts mitjans), per al detector. */
    function punts(m) {
        var out = [];
        m.formes.forEach(function (f, i) {
            var c = f.color + (f.tipus === 'traç' ? 't' : 'p');
            f.punts.forEach(function (p, j) {
                out.push({ x: p[0], y: p[1], c: c });
                var q = f.punts[(j + 1) % f.punts.length];
                if (j + 1 < f.punts.length || f.tipus === 'poligon')
                    out.push({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, c: c });
            });
        });
        return out;
    }

    return {
        COLORS: COLORS,
        PREDEFINITS: PREDEFINITS,
        FAMILIES: FAMILIES_IDS,
        aLAtzar: aLAtzar,
        neteja: neteja,
        punts: punts,
        d4: d4,
    };
});
