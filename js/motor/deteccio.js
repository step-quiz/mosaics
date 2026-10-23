/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/deteccio.js
 * ROL: Detector independent de les simetries d'una sanefa feta de punts de
 *      colors. No fa servir js/motor/grups.js: mira directament si cada
 *      isometria candidata deixa el conjunt de punts igual, colors inclosos
 *      («una isometria compta si el mosaic queda exactament igual»).
 *      El fan servir els tests (comprovar els generadors sense refiar-s'hi) i
 *      Classifica (descartar un motiu que tingui alguna simetria de més).
 * ARQUITECTURA: Pur, sense DOM. Punts { x, y, c } (c: el color). Comparació amb
 *      una taula de claus arrodonides (graella de 1e-6). Només es comproven els
 *      punts d'una finestra interior, perquè la sanefa és finita.
 *      Candidats (sempre a partir d'un punt p0 i dels punts q del mateix color):
 *        període: q.x − p0.x (q a la mateixa altura) · eix: y = (ymín + ymàx) / 2
 *        mirall vertical: x = (p0.x + q.x) / 2 · gir de 180°: centre (p0 + q) / 2
 *        lliscament: desplaçament q.x − p0.x, amb q a l'altura simètrica.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Deteccio = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var TOL = 1e-6;
    var arr = function (v) {
        return Math.round(v / TOL);
    };
    var clau = function (x, y, c) {
        return arr(x) + '|' + arr(y) + '|' + c;
    };

    /**
     * Les simetries d'una sanefa.
     * @param {Array<{x,y,c}>} punts  la sanefa (prou llarga: com a mínim 8 períodes)
     * @param {[number, number]} finestra  [x0, x1] interior on es comprova
     * @returns {{ periode, eix, horitzontal, vertical, gir, lliscament }}
     */
    function simetries(punts, finestra) {
        var taula = {};
        punts.forEach(function (p) {
            taula[clau(p.x, p.y, p.c)] = true;
        });
        var dins = punts.filter(function (p) {
            return p.x >= finestra[0] && p.x <= finestra[1];
        });
        if (dins.length < 2) throw new Error('massa pocs punts a la finestra');
        var queda = function (f) {
            return dins.every(function (p) {
                var q = f(p);
                return taula[clau(q.x, q.y, p.c)];
            });
        };
        var ys = punts.map(function (p) {
            return p.y;
        });
        var eix = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
        var p0 = dins[0];
        var mateixColor = punts.filter(function (q) {
            return q.c === p0.c;
        });
        var a = function (v) {
            return Math.abs(v) < TOL;
        };

        // Període: la translació positiva més petita
        var periode = Infinity;
        mateixColor.forEach(function (q) {
            var t = q.x - p0.x;
            if (t > TOL && t < periode && a(q.y - p0.y))
                if (
                    queda(function (p) {
                        return { x: p.x + t, y: p.y };
                    })
                )
                    periode = t;
        });

        var horitzontal = queda(function (p) {
            return { x: p.x, y: 2 * eix - p.y };
        });
        var vertical = mateixColor.some(function (q) {
            if (!a(q.y - p0.y)) return false;
            var m = (p0.x + q.x) / 2;
            return queda(function (p) {
                return { x: 2 * m - p.x, y: p.y };
            });
        });
        var gir = mateixColor.some(function (q) {
            var cx = (p0.x + q.x) / 2,
                cy = (p0.y + q.y) / 2;
            return queda(function (p) {
                return { x: 2 * cx - p.x, y: 2 * cy - p.y };
            });
        });
        // Lliscament que no és un mirall: el desplaçament no és múltiple del període
        var lliscament = mateixColor.some(function (q) {
            if (!a(q.y - (2 * eix - p0.y))) return false;
            var s = q.x - p0.x;
            var r = ((s % periode) + periode) % periode;
            if (a(r) || a(r - periode)) return false;
            return queda(function (p) {
                return { x: p.x + s, y: 2 * eix - p.y };
            });
        });
        return {
            periode: periode,
            eix: eix,
            horitzontal: horitzontal,
            vertical: vertical,
            gir: gir,
            lliscament: lliscament,
        };
    }

    /** El grup a partir de les simetries (taula directa, sense l'arbre de js/motor/arbre.js). */
    function grup(s) {
        if (s.horitzontal) return s.vertical ? 'p2mm' : 'p11m';
        if (s.vertical) return s.gir ? 'p2mg' : 'p1m1';
        if (s.gir) return 'p112';
        return s.lliscament ? 'p11g' : 'p111';
    }

    return { TOL: TOL, simetries: simetries, grup: grup };
});
