/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/ui/pinta.js
 * ROL: Dibuix amb canvas comú a les tres pàgines: el motiu, la sanefa
 *      (totes les còpies que toquen la finestra), els elements de simetria amb
 *      els símbols estàndard i la F d'Aprèn.
 * ARQUITECTURA: Script clàssic (window.Pinta). Tot es dibuixa en coordenades
 *      matemàtiques (y cap amunt) amb una transformació «base» B (matemàtiques →
 *      píxels CSS): B = (s, 0, 0, −s, ox, oy). Cada còpia del motiu es dibuixa
 *      amb ctx.setTransform(dpr · B ∘ g ∘ domini), així el motiu només es
 *      descriu una vegada. Els gruixos de línia es donen en píxels i es
 *      divideixen per l'escala de la transformació.
 *      Símbols: mirall, línia contínua; lliscament, discontínua; centre de gir
 *      de 180°, una lent (el·lipse); de 3, 4 i 6, triangle, quadrat i hexàgon.
 * DEPENDÈNCIES: js/motor/isometries.js, js/motor/grups.js
 * ============================================================================
 */
(function () {
    'use strict';
    var I = window.Isometries,
        G = window.Grups;

    var PER_DEFECTE = {
        fons: '#fffdf7',
        franja: '#f5efe2',
        vora: '#a8a29e',
        sim: '#0e7490',
        graella: '#e7e5e4',
        original: '#a8a29e',
        objectiu: '#57534e',
        copia: '#b91c1c',
        nansa: '#1d4ed8',
        c: ['#b91c1c', '#1d4ed8', '#ca8a04', '#15803d'],
    };

    /** Els colors actuals (variables CSS de css/tokens.css; mode clar o fosc). */
    function colors() {
        var out = JSON.parse(JSON.stringify(PER_DEFECTE));
        try {
            var cs = getComputedStyle(document.documentElement);
            var llegeix = function (n, def) {
                var v = cs.getPropertyValue(n).trim();
                return v || def;
            };
            out.fons = llegeix('--m-fons', out.fons);
            out.franja = llegeix('--m-franja', out.franja);
            out.vora = llegeix('--m-vora', out.vora);
            out.sim = llegeix('--m-sim', out.sim);
            out.graella = llegeix('--m-graella', out.graella);
            out.original = llegeix('--m-original', out.original);
            out.objectiu = llegeix('--m-objectiu', out.objectiu);
            out.copia = llegeix('--m-copia', out.copia);
            out.nansa = llegeix('--m-nansa', out.nansa);
            for (var i = 0; i < 4; i++) out.c[i] = llegeix('--m-c' + i, out.c[i]);
        } catch (e) {
            /* colors per defecte */
        }
        return out;
    }
    /** Els colors per defecte (clars), per a la imatge PNG. */
    var colorsClars = function () {
        return JSON.parse(JSON.stringify(PER_DEFECTE));
    };

    /** Mida del canvas en píxels CSS, amb la densitat de la pantalla. */
    function prepara(canvas, w, h) {
        var dpr = Math.min(3, window.devicePixelRatio || 1);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        return { ctx: ctx, w: w, h: h, dpr: dpr };
    }

    var base = function (s, ox, oy) {
        return I.crea(s, 0, 0, -s, ox, oy);
    };
    function posa(c, T) {
        var m = I.perCanvas(T);
        c.ctx.setTransform(c.dpr * m[0], c.dpr * m[1], c.dpr * m[2], c.dpr * m[3], c.dpr * m[4], c.dpr * m[5]);
    }
    var pixels = function (c) {
        c.ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    };
    var escala = function (T) {
        return Math.sqrt(Math.abs(T.a * T.d - T.b * T.c));
    };

    function fons(c, color) {
        pixels(c);
        c.ctx.fillStyle = color;
        c.ctx.fillRect(0, 0, c.w, c.h);
    }

    function cami(ctx, punts, tanca) {
        ctx.beginPath();
        punts.forEach(function (p, i) {
            if (i) ctx.lineTo(p[0], p[1]);
            else ctx.moveTo(p[0], p[1]);
        });
        if (tanca) ctx.closePath();
    }

    /**
     * El motiu (dins de [0, 1]²) amb la transformació T (motiu → píxels CSS).
     * o: { colors, alfa, contorn (només línies negres, per pintar), gruixContorn }
     */
    function motiu(c, m, T, o) {
        var ctx = c.ctx,
            k = escala(T);
        posa(c, T);
        ctx.save();
        ctx.globalAlpha = o.alfa == null ? 1 : o.alfa;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        m.formes.forEach(function (f) {
            var col = o.colors.c[f.color] || o.colors.c[0];
            if (f.tipus === 'poligon') {
                cami(ctx, f.punts, true);
                if (o.contorn) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = (o.gruixContorn || 2) / k;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = col;
                    ctx.fill();
                    // Una vora fina del mateix color tapa les escletxes entre còpies
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 0.8 / k;
                    ctx.stroke();
                }
            } else {
                cami(ctx, f.punts, false);
                ctx.strokeStyle = o.contorn ? '#000' : col;
                ctx.lineWidth = Math.max(o.contorn ? (o.gruixContorn || 2) / k : 0, 0.035);
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    /**
     * La sanefa del grup «id» amb el motiu m. B: base (matemàtiques → píxels).
     * o: { x0, x1 (finestra en unitats), colors, alfa, contorn, pre (isometria que s'aplica abans de B),
     *      franja (pinta la franja i les vores) }
     */
    function sanefa(c, id, m, B, o) {
        var gr = G.GRUPS[id];
        var P = o.pre ? I.composa(B, o.pre) : B;
        if (o.franja) {
            posa(c, P);
            c.ctx.fillStyle = o.contorn ? '#fff' : o.colors.franja;
            c.ctx.fillRect(o.x0, gr.franja[0], o.x1 - o.x0, gr.franja[1] - gr.franja[0]);
        }
        var dom = G.alDomini(id);
        G.copies(id, o.x0, o.x1).forEach(function (g) {
            motiu(c, m, I.composa(P, I.composa(g, dom)), o);
        });
        if (o.franja) {
            pixels(c);
            var ctx = c.ctx;
            ctx.strokeStyle = o.contorn ? '#000' : o.colors.vora;
            ctx.lineWidth = o.contorn ? 1.5 : 1;
            gr.franja.forEach(function (y) {
                var a = I.aplica(P, { x: o.x0, y: y }),
                    b = I.aplica(P, { x: o.x1, y: y });
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            });
        }
    }

    // ── Símbols ────────────────────────────────────────────────────────────
    function linia(c, B, p, q, color, gruix, discontinua) {
        var ctx = c.ctx;
        pixels(c);
        var a = I.aplica(B, p),
            b = I.aplica(B, q);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = gruix;
        ctx.lineCap = 'round';
        ctx.setLineDash(discontinua ? [10, 7] : []);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
    }

    /** Símbol d'un centre de gir d'ordre n al punt (en píxels). */
    function simbolGir(c, px, py, ordre, color) {
        var ctx = c.ctx;
        pixels(c);
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ordre === 2) ctx.ellipse(px, py, 5.5, 10, 0, 0, 2 * Math.PI);
        else {
            var r = ordre === 4 ? 9 : 10;
            for (var i = 0; i < ordre; i++) {
                var t = -Math.PI / 2 + (2 * Math.PI * i) / ordre + (ordre === 4 ? Math.PI / 4 : 0);
                if (i) ctx.lineTo(px + r * Math.cos(t), py + r * Math.sin(t));
                else ctx.moveTo(px + r * Math.cos(t), py + r * Math.sin(t));
            }
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /** Els elements de simetria del grup (de G.elements) sobre la sanefa. */
    function elements(c, id, B, x0, x1, colors) {
        var el = G.elements(id, x0, x1),
            fr = G.GRUPS[id].franja,
            col = colors.sim;
        var recta = function (e, discontinua) {
            var horitzontal = Math.abs(Math.sin(e.angle)) < 1e-9;
            if (horitzontal) linia(c, B, { x: x0, y: e.y }, { x: x1, y: e.y }, col, 3, discontinua);
            else linia(c, B, { x: e.x, y: fr[0] - 0.15 }, { x: e.x, y: fr[1] + 0.15 }, col, 3, discontinua);
        };
        el.miralls.forEach(function (e) {
            recta(e, false);
        });
        el.lliscaments.forEach(function (e) {
            recta(e, true);
        });
        el.girs.forEach(function (e) {
            var p = I.aplica(B, e);
            simbolGir(c, p.x, p.y, e.ordre, col);
        });
        return el;
    }

    /** Un punt de control (nansa) en píxels. forma: 'rodona' | 'rombe' | 'fletxa' */
    function nansa(c, p, color, forma, angle) {
        var ctx = c.ctx;
        pixels(c);
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (forma === 'rombe') {
            ctx.moveTo(p.x, p.y - 10);
            ctx.lineTo(p.x + 10, p.y);
            ctx.lineTo(p.x, p.y + 10);
            ctx.lineTo(p.x - 10, p.y);
            ctx.closePath();
        } else if (forma === 'fletxa') {
            var a = angle || 0;
            var pt = function (r, t) {
                return [p.x + r * Math.cos(a + t), p.y + r * Math.sin(a + t)];
            };
            var q = [pt(12, 0), pt(10, 2.4), pt(10, -2.4)];
            ctx.moveTo(q[0][0], q[0][1]);
            ctx.lineTo(q[1][0], q[1][1]);
            ctx.lineTo(q[2][0], q[2][1]);
            ctx.closePath();
        } else ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /** Graella de quadres de costat 1 (Aprèn i Classifica). */
    function graella(c, B, x0, x1, y0, y1, color) {
        var ctx = c.ctx;
        pixels(c);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (var x = Math.ceil(x0); x <= x1; x++) {
            var a = I.aplica(B, { x: x, y: y0 }),
                b = I.aplica(B, { x: x, y: y1 });
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        for (var y = Math.ceil(y0); y <= y1; y++) {
            var p = I.aplica(B, { x: x0, y: y }),
                q = I.aplica(B, { x: x1, y: y });
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** Una F (motiu M) amb T: farcida d'un color, o només el contorn de punts. */
    function efa(c, M, T, color, puntejada) {
        var ctx = c.ctx,
            k = escala(T);
        posa(c, T);
        ctx.save();
        M.formes.forEach(function (f) {
            cami(ctx, f.punts, f.tipus === 'poligon');
            if (puntejada) {
                ctx.setLineDash([5 / k, 4 / k]);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5 / k;
                ctx.stroke();
            } else {
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = color;
                ctx.fill();
            }
        });
        ctx.restore();
    }

    window.Pinta = {
        colors: colors,
        colorsClars: colorsClars,
        prepara: prepara,
        base: base,
        posa: posa,
        pixels: pixels,
        fons: fons,
        motiu: motiu,
        sanefa: sanefa,
        elements: elements,
        linia: linia,
        simbolGir: simbolGir,
        nansa: nansa,
        graella: graella,
        efa: efa,
    };
})();
