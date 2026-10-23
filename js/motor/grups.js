/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/grups.js
 * ROL: Els 7 grups de les sanefes (frisos). Cada grup es defineix només amb la
 *      xarxa (una translació), uns quants generadors i l'ordre esperat; els
 *      representants (un per classe mòdul la xarxa) surten per clausura.
 *      També dona les còpies del motiu que cal dibuixar en una finestra i els
 *      elements de simetria (miralls, eixos de lliscament i centres de gir).
 * ARQUITECTURA: Pur, sense DOM. Coordenades matemàtiques (y cap amunt).
 *   - La franja és horitzontal i té l'eix horitzontal a y = 0.
 *   - El motiu es dibuixa en un quadrat 1 × 1 (el «domini»), que és un domini
 *     fonamental del grup: les còpies no se solapen. Per això el període és 1 o 2
 *     i la franja fa 1 o 2 d'alçada segons el grup (decisió a docs/STATE.md).
 *   - Clausura: recorregut en amplada sobre les composicions generador ∘
 *     representant; la translació es redueix mòdul la xarxa (coordenada x mòdul
 *     el període) i els repetits es descarten amb ε = 1e-9.
 *   - Elements de simetria de cada representant (M, t), per a cada translat t + n·a:
 *       gir (det M = 1, M ≠ I): el centre resol (I − M)·c = t;
 *       mirall o lliscament (det M = −1): la direcció de l'eix és el vector propi
 *       de M de valor 1; t es descompon en part paral·lela i perpendicular; si la
 *       paral·lela és 0 mòdul la xarxa, és un mirall; si no, un lliscament.
 * DEPENDÈNCIES: js/motor/isometries.js (Node: require; navegador: window.Isometries)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var I = typeof module === 'object' && module.exports ? require('./isometries.js') : arrel.Isometries;
    var api = fabrica(I);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Grups = api;
})(typeof self !== 'undefined' ? self : this, function (I) {
    'use strict';

    var EPS = 1e-9;
    var V = I.mirall(0, 0, Math.PI / 2), // mirall vertical x = 0
        H = I.mirall(0, 0, 0), // mirall horitzontal y = 0
        G1 = I.lliscament(0, 0, 0, 1), // lliscament sobre y = 0, de longitud 1 (mig període)
        R = I.gir(0, 0, Math.PI); // gir de 180° al voltant de l'origen

    // periode: la translació de la xarxa (a, 0) · franja: [y mínima, y màxima]
    // domini: el cantó de baix a l'esquerra del quadrat 1 × 1 on va el motiu
    var GRUPS = {
        p111: {
            curt: 'p1',
            nom: 'només translació',
            periode: 1,
            franja: [-0.5, 0.5],
            domini: [0, -0.5],
            generadors: [],
            ordre: 1,
        },
        p11g: {
            curt: 'p11g',
            nom: 'lliscament',
            periode: 2,
            franja: [-0.5, 0.5],
            domini: [0, -0.5],
            generadors: [G1],
            ordre: 2,
        },
        p1m1: {
            curt: 'p1m1',
            nom: 'simetria vertical',
            periode: 2,
            franja: [-0.5, 0.5],
            domini: [0, -0.5],
            generadors: [V],
            ordre: 2,
        },
        p11m: {
            curt: 'p11m',
            nom: 'simetria horitzontal',
            periode: 1,
            franja: [-1, 1],
            domini: [0, 0],
            generadors: [H],
            ordre: 2,
        },
        p112: {
            curt: 'p2',
            nom: 'gir de 180°',
            periode: 2,
            franja: [-0.5, 0.5],
            domini: [0, -0.5],
            generadors: [R],
            ordre: 2,
        },
        p2mg: {
            curt: 'p2mg',
            nom: 'gir i simetria vertical',
            periode: 2,
            franja: [-1, 1],
            domini: [0, 0],
            generadors: [V, G1],
            ordre: 4,
        },
        p2mm: {
            curt: 'p2mm',
            nom: 'totes les simetries',
            periode: 2,
            franja: [-1, 1],
            domini: [0, 0],
            generadors: [V, H],
            ordre: 4,
        },
    };
    var IDS = ['p111', 'p11g', 'p1m1', 'p11m', 'p112', 'p2mg', 'p2mm'];

    // Fracció mòdul 1 ben arrodonida: [0, 1)
    function mod1(v) {
        var r = v - Math.floor(v);
        if (Math.abs(r - 1) < EPS || Math.abs(r) < EPS) r = 0;
        return r;
    }
    /** La mateixa isometria amb la translació reduïda mòdul la xarxa (x a [0, període)). */
    function redueix(g, periode) {
        return I.crea(g.a, g.b, g.c, g.d, mod1(g.e / periode) * periode, g.f);
    }

    /** Representants mòdul la xarxa del grup generat (clausura per BFS). */
    function clausura(generadors, periode) {
        var reps = [I.identitat()],
            cua = [I.identitat()];
        while (cua.length) {
            var r = cua.shift();
            for (var i = 0; i < generadors.length; i++) {
                var n = redueix(I.composa(generadors[i], r), periode);
                if (
                    !reps.some(function (q) {
                        return I.igual(q, n, EPS);
                    })
                ) {
                    reps.push(n);
                    cua.push(n);
                    if (reps.length > 48) throw new Error('la clausura no acaba');
                }
            }
        }
        return reps;
    }

    var memoria = {};
    function representants(id) {
        if (!memoria[id]) memoria[id] = clausura(GRUPS[id].generadors, GRUPS[id].periode);
        return memoria[id];
    }

    /** Les isometries que porten el domini a cada còpia que toca la finestra x0 ≤ x ≤ x1. */
    function copies(id, x0, x1) {
        var g = GRUPS[id],
            a = g.periode,
            dx = g.domini[0],
            dy = g.domini[1];
        var cantons = [
            { x: dx, y: dy },
            { x: dx + 1, y: dy },
            { x: dx, y: dy + 1 },
            { x: dx + 1, y: dy + 1 },
        ];
        var out = [];
        representants(id).forEach(function (r) {
            var xs = cantons.map(function (p) {
                return I.aplica(r, p).x;
            });
            var lo = Math.min.apply(null, xs),
                hi = Math.max.apply(null, xs);
            for (var n = Math.floor((x0 - hi) / a); n <= Math.ceil((x1 - lo) / a); n++) {
                if (hi + n * a >= x0 && lo + n * a <= x1) out.push(I.composa(I.translacio(n * a, 0), r));
            }
        });
        return out;
    }

    /** La isometria que porta el quadrat [0, 1]² del motiu al domini del grup. */
    function alDomini(id) {
        return I.translacio(GRUPS[id].domini[0], GRUPS[id].domini[1]);
    }

    /** La sanefa com a punts: els punts {x, y, c} del motiu (dins de [0, 1]²) copiats a la finestra. */
    function puntsSanefa(id, punts, x0, x1) {
        var out = [];
        copies(id, x0, x1).forEach(function (g) {
            var h = I.composa(g, alDomini(id));
            punts.forEach(function (p) {
                var q = I.aplica(h, p);
                out.push({ x: q.x, y: q.y, c: p.c });
            });
        });
        return out;
    }

    // ── Elements de simetria ───────────────────────────────────────────────
    function angleDe(g) {
        return Math.atan2(g.c, g.a); // per a un gir
    }
    /** Elements de simetria a la finestra x0 ≤ x ≤ x1: { miralls, lliscaments, girs }. */
    function elements(id, x0, x1) {
        var gr = GRUPS[id],
            a = gr.periode;
        var miralls = [],
            lliscaments = [],
            girs = [];
        var vist = {};
        var nou = function (clau) {
            if (vist[clau]) return false;
            vist[clau] = true;
            return true;
        };
        var arr = function (v) {
            return Math.round(v * 1e6) / 1e6 + 0;
        };
        representants(id).forEach(function (r) {
            var d = I.det(r);
            var identitatLineal =
                Math.abs(r.a - 1) < EPS && Math.abs(r.d - 1) < EPS && Math.abs(r.b) < EPS && Math.abs(r.c) < EPS;
            if (d > 0 && identitatLineal) return; // translació
            for (var n = Math.floor((2 * x0) / a) - 2; n <= Math.ceil((2 * x1) / a) + 2; n++) {
                var te = r.e + n * a,
                    tf = r.f;
                if (d > 0) {
                    // (I − M)·c = t
                    var p = 1 - r.a,
                        q = -r.b,
                        s = -r.c,
                        u = 1 - r.d;
                    var dt = p * u - q * s;
                    var cx = (te * u - q * tf) / dt,
                        cy = (p * tf - s * te) / dt;
                    var ordre = Math.round((2 * Math.PI) / Math.abs(angleDe(r)));
                    if (cx >= x0 - EPS && cx <= x1 + EPS && nou('g|' + arr(cx) + '|' + arr(cy)))
                        girs.push({ x: arr(cx), y: arr(cy), ordre: ordre });
                } else {
                    // M = [[cos 2θ, sin 2θ], [sin 2θ, −cos 2θ]]; eix amb direcció (cos θ, sin θ)
                    var theta = Math.atan2(r.c, r.a) / 2;
                    if (theta < -EPS) theta += Math.PI;
                    if (theta >= Math.PI - EPS) theta -= Math.PI;
                    var ux = Math.cos(theta),
                        uy = Math.sin(theta),
                        nx = -uy,
                        ny = ux;
                    var par = te * ux + tf * uy,
                        perp = te * nx + tf * ny;
                    // Punt de l'eix: (perp / 2)·n
                    var px = (perp / 2) * nx,
                        py = (perp / 2) * ny;
                    // La xarxa té vectors paral·lels a l'eix només si l'eix és horitzontal
                    var horitzontal = Math.abs(uy) < EPS;
                    var despl = horitzontal ? mod1(par / a) * a : Math.abs(par) < EPS ? 0 : par;
                    var esMirall = Math.abs(despl) < EPS;
                    // L'eix ha de tocar la finestra: si és vertical, x = px
                    if (!horitzontal && (px < x0 - EPS || px > x1 + EPS)) continue;
                    var clau = arr(theta) + '|' + arr(perp / 2);
                    if (esMirall) {
                        if (nou('m|' + clau)) miralls.push({ x: arr(px), y: arr(py), angle: theta });
                    } else if (nou('l|' + clau))
                        lliscaments.push({ x: arr(px), y: arr(py), angle: theta, despl: arr(despl) });
                }
            }
        });
        var perX = function (p, q) {
            return p.x - q.x || p.y - q.y;
        };
        return { miralls: miralls.sort(perX), lliscaments: lliscaments.sort(perX), girs: girs.sort(perX) };
    }

    return {
        GRUPS: GRUPS,
        IDS: IDS,
        clausura: clausura,
        representants: representants,
        redueix: redueix,
        copies: copies,
        alDomini: alDomini,
        puntsSanefa: puntsSanefa,
        elements: elements,
    };
});
