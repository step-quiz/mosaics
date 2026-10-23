/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/ui/apren.js
 * ROL: Aprèn (apren.html): quatre microlliçons (translació, gir, simetria,
 *      lliscament). A cada lliçó, la F de color s'ha de posar sobre una F de
 *      punts: primer amb controls lliscants i després arrossegant les nanses.
 * ARQUITECTURA: Script clàssic. La matemàtica és a js/motor/llicons.js (pur,
 *      provat amb Node). Estat: la lliçó, el repte (0 o 1), els paràmetres i,
 *      al repte de les nanses, els dos punts de l'eix (A, B). Les lliçons fetes
 *      es desen a localStorage (mosaics:v1:apren), dins de try/catch.
 *      Teclat: els controls lliscants; al repte de les nanses, «Prefereixo els
 *      controls» els torna a mostrar. Adreça: apren.html#gir (lliçó inicial).
 * DEPENDÈNCIES: Isometries, Motiu, Llicons, MosaicsTextos, Pinta
 * ============================================================================
 */
(function () {
    'use strict';
    var I = window.Isometries,
        M = window.Motiu,
        L = window.Llicons,
        T = window.MosaicsTextos,
        P = window.Pinta;
    var $ = function (id) {
        return document.getElementById(id);
    };
    var F = M.PREDEFINITS.F.motiu();
    var CLAU = 'mosaics:v1:apren';
    var RADI_NANSA = 2; // distància (unitats) de la nansa del gir al centre
    var HIT = 22; // píxels

    var fetes = {};
    try {
        fetes = JSON.parse(localStorage.getItem(CLAU) || '{}') || {};
    } catch (e) {
        fetes = {};
    }
    var desaFetes = function () {
        try {
            localStorage.setItem(CLAU, JSON.stringify(fetes));
        } catch (e) {
            /* res */
        }
    };

    var st = { id: 'translacio', repte: 0, p: null, a: null, b: null, ambControls: false, encertat: false };
    var copia = function (o) {
        return JSON.parse(JSON.stringify(o));
    };
    var nanses = function () {
        return st.repte === 1 && !st.ambControls;
    };
    var unitari = function (graus) {
        return { x: Math.cos((graus * Math.PI) / 180), y: Math.sin((graus * Math.PI) / 180) };
    };

    // ── Pestanyes ──────────────────────────────────────────────────────────
    function pintaPestanyes() {
        var cont = $('pestanyes');
        cont.innerHTML = '';
        L.IDS.forEach(function (id) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'pestanya';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', String(id === st.id));
            b.setAttribute('aria-controls', 'panell-llico');
            b.textContent = T.llicons[id].nom;
            if (fetes[id]) {
                var f = document.createElement('span');
                f.className = 'fet';
                f.textContent = '✓';
                f.setAttribute('aria-label', 'feta');
                b.appendChild(f);
            }
            b.addEventListener('click', function () {
                obre(id);
            });
            cont.appendChild(b);
        });
    }

    // ── Lliçó i repte ──────────────────────────────────────────────────────
    function obre(id, repte) {
        st.id = id;
        st.repte = repte || 0;
        st.ambControls = false;
        $('prefereix-controls').checked = false;
        try {
            history.replaceState(null, '', '#' + id);
        } catch (e) {
            /* file:// en alguns navegadors */
        }
        comencaRepte();
        pintaPestanyes();
    }
    function comencaRepte() {
        var ll = L.LLICONS[st.id];
        st.p = copia(ll.inicial);
        st.encertat = false;
        if (st.p.angle != null && st.p.px != null) {
            st.a = { x: st.p.px, y: st.p.py };
            var u = unitari(st.p.angle);
            st.b = { x: st.a.x + 2 * u.x, y: st.a.y + 2 * u.y };
        }
        var tx = T.llicons[st.id];
        $('titol').textContent = tx.nom;
        $('explica').textContent = tx.explica;
        $('comptador').textContent = T.repte(st.repte + 1, ll.reptes.length);
        $('feedback').innerHTML = '';
        $('accions').innerHTML = '';
        $('fila-preferencia').hidden = st.repte !== 1;
        pintaControls();
        pinta();
    }
    function pintaControls() {
        var tx = T.llicons[st.id];
        $('instruccio').textContent = nanses() ? T.repteNanses : T.repteControls;
        $('nota-nanses').textContent = nanses() ? tx.nanses : '';
        var cont = $('controls');
        cont.innerHTML = '';
        if (nanses()) return;
        var defs = L.LLICONS[st.id].params;
        Object.keys(defs).forEach(function (k) {
            var d = defs[k];
            var fila = document.createElement('div');
            fila.className = 'control';
            var id = 'c-' + k;
            var lab = document.createElement('label');
            lab.htmlFor = id;
            lab.textContent = tx.params[k];
            var inp = document.createElement('input');
            inp.type = 'range';
            inp.id = id;
            inp.min = d.min;
            inp.max = d.max;
            inp.step = d.pas;
            inp.value = L.ajusta(d, st.p[k]);
            var out = document.createElement('output');
            out.htmlFor = id;
            var mostra = function () {
                out.textContent = String(L.ajusta(d, st.p[k])).replace('.', ',');
            };
            mostra();
            inp.addEventListener('input', function () {
                st.p[k] = L.ajusta(d, Number(inp.value));
                mostra();
                canviat();
            });
            fila.appendChild(lab);
            fila.appendChild(inp);
            fila.appendChild(out);
            cont.appendChild(fila);
        });
    }
    $('prefereix-controls').addEventListener('change', function () {
        st.ambControls = $('prefereix-controls').checked;
        // Els controls lliscants tenen un pas: s'hi ajusten els valors
        var defs = L.LLICONS[st.id].params;
        Object.keys(defs).forEach(function (k) {
            st.p[k] = L.ajusta(defs[k], st.p[k]);
        });
        pintaControls();
        canviat();
    });

    function canviat() {
        pinta();
        if (st.encertat) return;
        if (L.encertat(st.id, st.p, L.LLICONS[st.id].reptes[st.repte])) {
            st.encertat = true;
            var fb = $('feedback');
            fb.innerHTML = '';
            [
                [T.encertat, 'be'],
                [T.llicons[st.id].bonic, 'info'],
            ].forEach(function (m) {
                var p = document.createElement('p');
                p.className = 'fb fb-' + m[1];
                p.textContent = m[0];
                fb.appendChild(p);
            });
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn btn-principal';
            var ultimRepte = st.repte + 1 >= L.LLICONS[st.id].reptes.length;
            var i = L.IDS.indexOf(st.id);
            if (!ultimRepte) {
                b.textContent = T.seguentRepte;
                b.addEventListener('click', function () {
                    st.repte++;
                    comencaRepte();
                });
            } else {
                fetes[st.id] = true;
                desaFetes();
                pintaPestanyes();
                if (i + 1 < L.IDS.length) {
                    b.textContent = T.seguentLlico;
                    b.addEventListener('click', function () {
                        obre(L.IDS[i + 1]);
                    });
                } else {
                    var p = document.createElement('p');
                    p.className = 'fb fb-be';
                    p.textContent = T.totesFetes;
                    fb.appendChild(p);
                    b.textContent = 'Taller';
                    b.addEventListener('click', function () {
                        location.href = 'taller.html';
                    });
                }
            }
            $('accions').appendChild(b);
        }
    }

    // ── Dibuix ─────────────────────────────────────────────────────────────
    var gm = null;
    function geometria() {
        var w = $('mesura').clientWidth || 600;
        var s = Math.min(56, w / 12);
        return { w: w, h: Math.round(8 * s), s: s, B: P.base(s, w / 2, Math.round(8 * s) / 2) };
    }
    function punts() {
        // Nanses (en unitats) segons la lliçó
        var p = st.p;
        if (st.id === 'gir') {
            var u = unitari(p.angle);
            return { centre: { x: p.cx, y: p.cy }, nansa: { x: p.cx + RADI_NANSA * u.x, y: p.cy + RADI_NANSA * u.y } };
        }
        if (st.id === 'mirall' || st.id === 'lliscament') {
            var a = nanses() ? st.a : { x: p.px, y: p.py };
            var v = unitari(p.angle);
            var b = nanses() ? st.b : { x: a.x + 2 * v.x, y: a.y + 2 * v.y };
            var o = { a: a, b: b, u: v };
            if (st.id === 'lliscament') o.fletxa = { x: a.x + p.despl * v.x, y: a.y + p.despl * v.y };
            return o;
        }
        return {};
    }
    function pinta() {
        gm = geometria();
        var c = P.prepara($('llenc'), gm.w, gm.h),
            col = P.colors(),
            B = gm.B,
            W = L.FINESTRA;
        P.fons(c, col.fons);
        P.graella(c, B, W.x0, W.x1, W.y0, W.y1, col.graella);
        var repte = L.LLICONS[st.id].reptes[st.repte];
        P.efa(c, F, I.composa(B, L.POSA), col.original, false);
        P.efa(c, F, I.composa(B, L.transformacio(st.id, repte)), col.objectiu, true);
        P.efa(c, F, I.composa(B, L.transformacio(st.id, st.p)), col.copia, false);
        var n = punts();
        if (st.id === 'translacio') {
            var o = { x: -1, y: -1 },
                d = { x: -1 + st.p.dx, y: -1 + st.p.dy };
            if (st.p.dx || st.p.dy) {
                P.linia(c, B, o, d, col.nansa, 3, false);
                var po = I.aplica(B, o),
                    pd = I.aplica(B, d);
                P.nansa(c, pd, col.nansa, 'fletxa', Math.atan2(pd.y - po.y, pd.x - po.x));
            }
        } else if (st.id === 'gir') {
            P.linia(c, B, n.centre, { x: n.centre.x + RADI_NANSA, y: n.centre.y }, col.vora, 2, true);
            P.linia(c, B, n.centre, n.nansa, col.nansa, 3, false);
            P.nansa(c, I.aplica(B, n.centre), col.nansa, 'rombe');
            if (nanses()) P.nansa(c, I.aplica(B, n.nansa), col.nansa, 'rodona');
        } else {
            var a = n.a,
                u = n.u;
            P.linia(
                c,
                B,
                { x: a.x - 20 * u.x, y: a.y - 20 * u.y },
                { x: a.x + 20 * u.x, y: a.y + 20 * u.y },
                col.sim,
                3,
                st.id === 'lliscament'
            );
            if (nanses()) {
                P.nansa(c, I.aplica(B, n.a), col.nansa, 'rodona');
                P.nansa(c, I.aplica(B, n.b), col.nansa, 'rodona');
            }
            if (st.id === 'lliscament') {
                P.linia(c, B, a, n.fletxa, col.nansa, 4, false);
                var pa = I.aplica(B, a),
                    pf = I.aplica(B, n.fletxa);
                var ang = Math.abs(st.p.despl) > 1e-9 ? Math.atan2(pf.y - pa.y, pf.x - pa.x) : Math.atan2(-u.y, u.x);
                P.nansa(c, pf, col.nansa, 'fletxa', ang);
            }
        }
    }

    // ── Nanses: arrossegar ─────────────────────────────────────────────────
    var arr = null;
    function unitats(ev) {
        var r = $('llenc').getBoundingClientRect();
        return {
            x: (ev.clientX - r.left - gm.w / 2) / gm.s,
            y: (gm.h / 2 - (ev.clientY - r.top)) / gm.s,
            px: ev.clientX - r.left,
            py: ev.clientY - r.top,
        };
    }
    var prop = function (u, q) {
        var pq = I.aplica(gm.B, q);
        return Math.hypot(pq.x - u.px, pq.y - u.py) <= HIT;
    };
    var mig = function (v) {
        return L.ajustaPas(v, 0.5);
    };
    var dins = function (q) {
        return {
            x: Math.max(L.FINESTRA.x0, Math.min(L.FINESTRA.x1, mig(q.x))),
            y: Math.max(L.FINESTRA.y0, Math.min(L.FINESTRA.y1, mig(q.y))),
        };
    };

    $('llenc').addEventListener('pointerdown', function (ev) {
        if (!nanses()) return;
        var u = unitats(ev),
            n = punts();
        var quin = null;
        if (st.id === 'translacio') quin = 'f';
        else if (st.id === 'gir') quin = prop(u, n.nansa) ? 'nansa' : prop(u, n.centre) ? 'centre' : null;
        else {
            if (st.id === 'lliscament' && prop(u, n.fletxa)) quin = 'fletxa';
            else if (prop(u, n.a)) quin = 'a';
            else if (prop(u, n.b)) quin = 'b';
        }
        if (!quin) return;
        ev.preventDefault();
        try {
            $('llenc').setPointerCapture(ev.pointerId);
        } catch (e) {
            /* res */
        }
        arr = { quin: quin, inici: u, p0: copia(st.p) };
    });
    $('llenc').addEventListener('pointermove', function (ev) {
        if (!arr) return;
        var u = unitats(ev),
            p = st.p,
            defs = L.LLICONS[st.id].params;
        if (arr.quin === 'f') {
            p.dx = L.ajusta(defs.dx, arr.p0.dx + u.x - arr.inici.x);
            p.dy = L.ajusta(defs.dy, arr.p0.dy + u.y - arr.inici.y);
        } else if (arr.quin === 'centre') {
            var c = dins(u);
            p.cx = L.ajusta(defs.cx, c.x);
            p.cy = L.ajusta(defs.cy, c.y);
        } else if (arr.quin === 'nansa') {
            p.angle = L.angleDeNansa({ x: p.cx, y: p.cy }, { x: p.cx + 1, y: p.cy }, u);
        } else if (arr.quin === 'a' || arr.quin === 'b') {
            var q = dins(u);
            var a = arr.quin === 'a' ? q : st.a,
                b = arr.quin === 'b' ? q : st.b;
            var e = L.eixDeDosPunts(a, b);
            if (e) {
                st.a = a;
                st.b = b;
                p.angle = e.angle;
                p.px = e.px;
                p.py = e.py;
            }
        } else if (arr.quin === 'fletxa') {
            var v = unitari(p.angle);
            p.despl = L.ajusta(defs.despl, (u.x - st.a.x) * v.x + (u.y - st.a.y) * v.y);
        }
        canviat();
    });
    var deixa = function () {
        arr = null;
    };
    $('llenc').addEventListener('pointerup', deixa);
    $('llenc').addEventListener('pointercancel', deixa);

    // ── Inici ──────────────────────────────────────────────────────────────
    $('llegenda').textContent = T.llegendaApren;
    var pendent = false;
    window.addEventListener('resize', function () {
        if (pendent) return;
        pendent = true;
        requestAnimationFrame(function () {
            pendent = false;
            pinta();
        });
    });
    try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pinta);
    } catch (e) {
        /* navegadors antics */
    }
    var h = location.hash.replace('#', '');
    obre(L.IDS.indexOf(h) >= 0 ? h : 'translacio');
})();
