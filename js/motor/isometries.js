/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/isometries.js
 * ROL: Isometries del pla com a aplicacions afins g(p) = M·p + t, amb M una
 *      matriu ortogonal 2 × 2: translació, gir, simetria (mirall) i lliscament;
 *      composició, inversa, igualtat i la forma que demana el canvas.
 * ARQUITECTURA: Pur, sense DOM. Coordenades matemàtiques (x cap a la dreta,
 *      y cap amunt). Una isometria és { a, b, c, d, e, f }:
 *          x' = a·x + b·y + e
 *          y' = c·x + d·y + f
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Isometries = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var EPS = 1e-9;

    function crea(a, b, c, d, e, f) {
        return { a: a, b: b, c: c, d: d, e: e, f: f };
    }
    var identitat = function () {
        return crea(1, 0, 0, 1, 0, 0);
    };
    var translacio = function (dx, dy) {
        return crea(1, 0, 0, 1, dx, dy);
    };
    // Neteja els -0 i els errors d'arrodoniment petits (cos 90° = 6e-17)
    function net(v) {
        var r = Math.round(v);
        return Math.abs(v - r) < 1e-12 ? r + 0 : v;
    }

    /** Gir d'angle «angle» (radians, sentit antihorari) al voltant de (cx, cy). */
    function gir(cx, cy, angle) {
        var co = net(Math.cos(angle)),
            si = net(Math.sin(angle));
        return crea(co, -si, si, co, net(cx - co * cx + si * cy), net(cy - si * cx - co * cy));
    }

    /** Simetria respecte de la recta que passa per (px, py) amb direcció angle θ (radians). */
    function mirall(px, py, theta) {
        var c2 = net(Math.cos(2 * theta)),
            s2 = net(Math.sin(2 * theta));
        // M = [[c2, s2], [s2, −c2]]; t = p − M·p
        return crea(c2, s2, s2, -c2, net(px - (c2 * px + s2 * py)), net(py - (s2 * px - c2 * py)));
    }

    /** Lliscament: simetria respecte de la recta i després translació «despl» al llarg de la recta. */
    function lliscament(px, py, theta, despl) {
        return composa(translacio(net(despl * Math.cos(theta)), net(despl * Math.sin(theta))), mirall(px, py, theta));
    }

    /** g ∘ h (primer h, després g). */
    function composa(g, h) {
        return crea(
            g.a * h.a + g.b * h.c,
            g.a * h.b + g.b * h.d,
            g.c * h.a + g.d * h.c,
            g.c * h.b + g.d * h.d,
            g.a * h.e + g.b * h.f + g.e,
            g.c * h.e + g.d * h.f + g.f
        );
    }

    function inversa(g) {
        // M ortogonal: M⁻¹ = Mᵀ; t' = −Mᵀ·t
        return crea(g.a, g.c, g.b, g.d, -(g.a * g.e + g.c * g.f), -(g.b * g.e + g.d * g.f));
    }

    function aplica(g, p) {
        return { x: g.a * p.x + g.b * p.y + g.e, y: g.c * p.x + g.d * p.y + g.f };
    }

    var det = function (g) {
        return g.a * g.d - g.b * g.c;
    };

    function igual(g, h, eps) {
        eps = eps || EPS;
        return ['a', 'b', 'c', 'd', 'e', 'f'].every(function (k) {
            return Math.abs(g[k] - h[k]) < eps;
        });
    }
    function mateixaLineal(g, h, eps) {
        eps = eps || EPS;
        return ['a', 'b', 'c', 'd'].every(function (k) {
            return Math.abs(g[k] - h[k]) < eps;
        });
    }

    /** Els sis arguments de ctx.setTransform / ctx.transform (x' = a·x + c·y + e al canvas). */
    function perCanvas(g) {
        return [g.a, g.c, g.b, g.d, g.e, g.f];
    }

    return {
        EPS: EPS,
        crea: crea,
        identitat: identitat,
        translacio: translacio,
        gir: gir,
        mirall: mirall,
        lliscament: lliscament,
        composa: composa,
        inversa: inversa,
        aplica: aplica,
        det: det,
        igual: igual,
        mateixaLineal: mateixaLineal,
        perCanvas: perCanvas,
    };
});
