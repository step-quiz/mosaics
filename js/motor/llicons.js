/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/llicons.js
 * ROL: Les quatre microlliçons d'Aprèn (translació, gir, simetria i
 *      lliscament): els paràmetres de cada moviment (amb el seu pas), la
 *      isometria que en surt i els dos reptes de cada lliçó (el primer amb
 *      controls lliscants, el segon arrossegant les nanses).
 * ARQUITECTURA: Pur, sense DOM. Coordenades matemàtiques (y cap amunt).
 *   - La finestra és [−6, 6] × [−4, 4]. La F original ocupa [−1, 1]² (el motiu
 *     de 1 × 1 escalat per 2: POSA).
 *   - Un repte és un conjunt de valors dels paràmetres; s'ha encertat quan la
 *     isometria de l'alumne és la del repte (la F no té cap simetria, així que
 *     mateixa imatge ⇔ mateixa isometria). Els angles van en graus.
 *   - Les nanses fixen els mateixos paràmetres: el gir té un centre (pas 0,5)
 *     i una nansa d'angle (pas 15°); el mirall, dos punts de l'eix (pas 0,5);
 *     el lliscament, els dos punts i el desplaçament (pas 0,5).
 * DEPENDÈNCIES: js/motor/isometries.js (Node: require; navegador: window.Isometries)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var I = typeof module === 'object' && module.exports ? require('./isometries.js') : arrel.Isometries;
    var api = fabrica(I);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Llicons = api;
})(typeof self !== 'undefined' ? self : this, function (I) {
    'use strict';

    var FINESTRA = { x0: -6, x1: 6, y0: -4, y1: 4 };
    var POSA = I.crea(2, 0, 0, 2, -1, -1); // motiu [0, 1]² → F a [−1, 1]²
    var rad = function (g) {
        return (g * Math.PI) / 180;
    };
    var P = function (min, max, pas) {
        return { min: min, max: max, pas: pas };
    };

    var LLICONS = {
        translacio: {
            params: { dx: P(-6, 6, 0.5), dy: P(-4, 4, 0.5) },
            inicial: { dx: 0, dy: 0 },
            iso: function (p) {
                return I.translacio(p.dx, p.dy);
            },
            reptes: [
                { dx: 4, dy: 1 },
                { dx: -3.5, dy: -2 },
            ],
        },
        gir: {
            params: { angle: P(-180, 180, 15), cx: P(-5, 5, 0.5), cy: P(-3.5, 3.5, 0.5) },
            inicial: { angle: 0, cx: 0, cy: 0 },
            iso: function (p) {
                return I.gir(p.cx, p.cy, rad(p.angle));
            },
            reptes: [
                { angle: 90, cx: 0, cy: 0 },
                { angle: 180, cx: 2, cy: -1 },
            ],
        },
        mirall: {
            params: { angle: P(0, 165, 15), px: P(-5, 5, 0.5), py: P(-3.5, 3.5, 0.5) },
            inicial: { angle: 90, px: 2, py: 0 },
            iso: function (p) {
                return I.mirall(p.px, p.py, rad(p.angle));
            },
            reptes: [
                { angle: 90, px: 1.5, py: 0 },
                { angle: 45, px: 0, py: -1 },
            ],
        },
        lliscament: {
            params: { angle: P(0, 165, 15), px: P(-5, 5, 0.5), py: P(-3.5, 3.5, 0.5), despl: P(-6, 6, 0.5) },
            inicial: { angle: 0, px: 0, py: -1.5, despl: 0 },
            iso: function (p) {
                return I.lliscament(p.px, p.py, rad(p.angle), p.despl);
            },
            reptes: [
                { angle: 0, px: 0, py: -1.5, despl: 3.5 },
                { angle: 90, px: 1.5, py: 0, despl: -2 },
            ],
        },
    };
    var IDS = ['translacio', 'gir', 'mirall', 'lliscament'];

    /** Arrodoneix un valor al pas del paràmetre i el posa dins del seu interval. */
    function ajusta(def, v) {
        var r = Math.round(v / def.pas) * def.pas;
        r = Math.min(def.max, Math.max(def.min, r));
        return Math.round(r * 1000) / 1000 + 0;
    }

    /** La isometria d'uns paràmetres d'una lliçó. */
    function isometria(id, p) {
        return LLICONS[id].iso(p);
    }

    /** La transformació (no és una isometria: escala 2) que porta el motiu de 1 × 1 a la F de la lliçó. */
    function transformacio(id, p) {
        return I.composa(isometria(id, p), POSA);
    }

    /** Encertat? (la isometria de l'alumne és la del repte) */
    function encertat(id, p, repte) {
        return I.igual(isometria(id, p), isometria(id, repte), 1e-6);
    }

    // ── Nanses (manipulació directa) → paràmetres ──────────────────────────
    var ajustaPas = function (v, pas) {
        return Math.round(Math.round(v / pas) * pas * 1000) / 1000 + 0;
    };

    /** L'angle (graus, de 0 a 165, pas 15) de la recta AB; null si A = B. */
    function angleRecta(a, b) {
        var dx = b.x - a.x,
            dy = b.y - a.y;
        if (Math.hypot(dx, dy) < 1e-9) return null;
        var g = (Math.atan2(dy, dx) * 180) / Math.PI;
        g = ((g % 180) + 180) % 180;
        return { exacte: g };
    }

    /**
     * Mirall o lliscament a partir de dos punts de l'eix (ja ajustats a la graella de 0,5).
     * Retorna els paràmetres { angle, px, py } amb l'angle exacte (pot no ser múltiple de 15°:
     * l'eix passa per dos punts de la graella, no cal que coincideixi amb el pas del control lliscant).
     */
    function eixDeDosPunts(a, b) {
        var r = angleRecta(a, b);
        if (!r) return null;
        return { angle: r.exacte, px: a.x, py: a.y };
    }

    /** Angle del gir a partir del centre i de la posició de la nansa (pas 15°, de −180 a 180). */
    function angleDeNansa(c, inici, ara) {
        var a0 = Math.atan2(inici.y - c.y, inici.x - c.x),
            a1 = Math.atan2(ara.y - c.y, ara.x - c.x);
        var g = ((a1 - a0) * 180) / Math.PI;
        g = ((((g + 180) % 360) + 360) % 360) - 180;
        return ajustaPas(g, 15);
    }

    return {
        FINESTRA: FINESTRA,
        POSA: POSA,
        LLICONS: LLICONS,
        IDS: IDS,
        ajusta: ajusta,
        ajustaPas: ajustaPas,
        isometria: isometria,
        transformacio: transformacio,
        encertat: encertat,
        eixDeDosPunts: eixDeDosPunts,
        angleDeNansa: angleDeNansa,
    };
});
