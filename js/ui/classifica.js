/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/ui/classifica.js
 * ROL: Classifica (classifica.html): una sèrie de 7 sanefes generades, una de
 *      cada tipus en un ordre a l'atzar. L'alumne prova moviments amb tres eines
 *      (gir, mirall, lliscament: es dibuixa una còpia transparent de la sanefa
 *      moguda) i respon les preguntes de l'arbre (js/motor/arbre.js) una a una.
 *      L'eina proposa el grup i el compara amb la clau; si no és, diu quina
 *      resposta cal revisar i amb quina eina.
 * ARQUITECTURA: Script clàssic. La clau de cada sanefa és el grup amb què s'ha
 *      fet; el detector independent (js/motor/deteccio.js) comprova que el motiu
 *      a l'atzar no hi afegeix cap simetria i dona les respostes correctes.
 *      Els punts que toca l'alumne s'ajusten a una graella de 0,25.
 *      Adreça: classifica.html?fixed=A|B|C (tota la classe, mateixes sanefes).
 *      Sense codi de verificació. Les fotos reals (data/fotos.js) vindran
 *      després: l'eina ja treballa sobre «una imatge i una transformació».
 * DEPENDÈNCIES: Atzar, Isometries, Grups, Deteccio, Arbre, Motiu, MosaicsTextos, Pinta
 * ============================================================================
 */
(function () {
    'use strict';
    var Atzar = window.Atzar,
        I = window.Isometries,
        G = window.Grups,
        D = window.Deteccio,
        A = window.Arbre,
        M = window.Motiu,
        T = window.MosaicsTextos,
        P = window.Pinta;
    var $ = function (id) {
        return document.getElementById(id);
    };
    var PAS = 0.25;
    var rad = function (g) {
        return (g * Math.PI) / 180;
    };

    var q;
    try {
        q = new URLSearchParams(location.search);
    } catch (e) {
        q = new URLSearchParams('');
    }
    var FIXED =
        ['A', 'B', 'C'].indexOf(String(q.get('fixed') || '').toUpperCase()) >= 0 ? q.get('fixed').toUpperCase() : '';
    function llavorNova() {
        try {
            var a = new Uint32Array(2);
            crypto.getRandomValues(a);
            return a[0].toString(36) + a[1].toString(36);
        } catch (e) {
            return String(Date.now());
        }
    }
    var LLAVOR = FIXED ? 'mosaics|classifica|' + FIXED : llavorNova();

    // ── Sèrie ──────────────────────────────────────────────────────────────
    var tanda = 0,
        serie = [],
        idx = 0,
        primera = 0;
    function fesSerie() {
        var at = Atzar.crea(LLAVOR + '|' + tanda);
        return at.barreja(G.IDS).map(function (id) {
            for (var i = 0; i < 30; i++) {
                var m = M.aLAtzar(at);
                var sim = D.simetries(G.puntsSanefa(id, M.punts(m), -16, 16), [-6, 6]);
                if (D.grup(sim) === id) return { grup: id, motiu: m, sim: sim };
            }
            // Mai no hauria de passar (tests/motor.test.js): la F no té cap simetria
            var f = M.PREDEFINITS.F.motiu();
            return { grup: id, motiu: f, sim: D.simetries(G.puntsSanefa(id, M.punts(f), -16, 16), [-6, 6]) };
        });
    }

    // ── Estat de la sanefa actual ──────────────────────────────────────────
    var st = {};
    function reinicia() {
        st = {
            respostes: [],
            acabada: false,
            errada: false,
            eina: null,
            angle: 180,
            centre: null,
            punts: [],
            despl: 0,
            cursor: { x: 0, y: 0 },
            cursorVisible: false,
            mostraElements: false,
        };
        $('despl').value = '0';
        $('despl-valor').textContent = '0';
    }

    // ── Dibuix ─────────────────────────────────────────────────────────────
    var gm = null;
    function geometria() {
        var w = $('mesura').clientWidth || 600;
        var s = Math.max(34, Math.min(90, w / 8.5));
        return { w: w, h: Math.round(2.6 * s), s: s, x0: -w / (2 * s) - 1, x1: w / (2 * s) + 1 };
    }
    function isometria() {
        if (st.eina === 'gir' && st.centre) return I.gir(st.centre.x, st.centre.y, rad(st.angle));
        if ((st.eina === 'mirall' || st.eina === 'lliscament') && st.punts.length === 2) {
            var a = st.punts[0],
                b = st.punts[1];
            var th = Math.atan2(b.y - a.y, b.x - a.x);
            return st.eina === 'mirall' ? I.mirall(a.x, a.y, th) : I.lliscament(a.x, a.y, th, st.despl);
        }
        return null;
    }
    function pinta() {
        gm = geometria();
        var c = P.prepara($('llenc'), gm.w, gm.h),
            col = P.colors(),
            ctx = c.ctx;
        var B = P.base(gm.s, gm.w / 2, gm.h / 2);
        var s = serie[idx];
        P.fons(c, col.fons);
        P.graella(c, B, gm.x0, gm.x1, -gm.h / (2 * gm.s), gm.h / (2 * gm.s), col.graella);
        P.sanefa(c, s.grup, s.motiu, B, { x0: gm.x0, x1: gm.x1, colors: col, franja: true });
        var iso = isometria();
        if (iso) P.sanefa(c, s.grup, s.motiu, B, { x0: gm.x0 - 14, x1: gm.x1 + 14, colors: col, alfa: 0.55, pre: iso });
        if (st.mostraElements) P.elements(c, s.grup, B, gm.x0, gm.x1, col);
        // Marques de l'eina
        if (st.eina === 'gir' && st.centre) {
            var pc = I.aplica(B, st.centre);
            P.simbolGir(c, pc.x, pc.y, Math.round(360 / st.angle), col.nansa);
        }
        if (st.eina === 'mirall' || st.eina === 'lliscament') {
            if (st.punts.length === 2) {
                var a = st.punts[0],
                    b = st.punts[1],
                    L = Math.hypot(b.x - a.x, b.y - a.y),
                    u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
                P.linia(
                    c,
                    B,
                    { x: a.x - 60 * u.x, y: a.y - 60 * u.y },
                    { x: a.x + 60 * u.x, y: a.y + 60 * u.y },
                    col.nansa,
                    3,
                    st.eina === 'lliscament'
                );
                if (st.eina === 'lliscament' && Math.abs(st.despl) > 1e-9) {
                    var fi = { x: a.x + st.despl * u.x, y: a.y + st.despl * u.y };
                    P.linia(c, B, a, fi, col.nansa, 5, false);
                    var pf = I.aplica(B, fi),
                        pa = I.aplica(B, a);
                    P.nansa(c, pf, col.nansa, 'fletxa', Math.atan2(pf.y - pa.y, pf.x - pa.x));
                }
            }
            st.punts.forEach(function (p) {
                P.nansa(c, I.aplica(B, p), col.nansa, 'rodona');
            });
        }
        if (st.cursorVisible) {
            var cu = I.aplica(B, st.cursor);
            P.pixels(c);
            ctx.strokeStyle = col.nansa;
            ctx.lineWidth = 2;
            ctx.strokeRect(cu.x - 9, cu.y - 9, 18, 18);
        }
    }

    // ── Eines ──────────────────────────────────────────────────────────────
    function instruccio() {
        var t = '';
        if (st.eina === 'gir') t = T.einaInstr.gir;
        else if (st.eina === 'mirall') t = st.punts.length === 1 ? T.einaInstr.mirall2 : T.einaInstr.mirall;
        else if (st.eina === 'lliscament')
            t =
                st.punts.length === 1
                    ? T.einaInstr.lliscament2
                    : st.punts.length === 2
                      ? T.einaInstr.lliscament3
                      : T.einaInstr.lliscament;
        $('instr-eina').textContent = t;
        $('fila-angle').hidden = st.eina !== 'gir';
        $('fila-despl').hidden = !(st.eina === 'lliscament' && st.punts.length === 2);
        document.querySelectorAll('[data-eina]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-eina') === st.eina));
        });
        var iso = isometria();
        $('anunci').textContent = !iso
            ? ''
            : st.eina === 'gir'
              ? T.copiaGir(st.angle)
              : st.eina === 'mirall'
                ? T.copiaMirall
                : T.copiaLliscament;
    }
    function triaEina(e) {
        st.eina = e;
        st.centre = null;
        st.punts = [];
        st.despl = 0;
        $('despl').value = '0';
        $('despl-valor').textContent = '0';
        instruccio();
        pinta();
    }
    document.querySelectorAll('[data-eina]').forEach(function (b) {
        b.addEventListener('click', function () {
            triaEina(b.getAttribute('data-eina'));
        });
    });
    $('btn-treu').addEventListener('click', function () {
        triaEina(null);
    });
    $('angle').addEventListener('change', function () {
        st.angle = Number($('angle').value);
        instruccio();
        pinta();
    });
    $('despl').addEventListener('input', function () {
        st.despl = Number($('despl').value);
        $('despl-valor').textContent = String(st.despl).replace('.', ',');
        instruccio();
        pinta();
    });

    var ajusta = function (v) {
        return Math.round(v / PAS) * PAS + 0;
    };
    function puntDe(ev) {
        var r = $('llenc').getBoundingClientRect();
        return {
            x: ajusta((ev.clientX - r.left - gm.w / 2) / gm.s),
            y: ajusta((gm.h / 2 - (ev.clientY - r.top)) / gm.s),
        };
    }
    /** Un toc (o Retorn) al punt p. */
    function toca(p) {
        if (st.eina === 'gir') st.centre = p;
        else if (st.eina === 'mirall' || st.eina === 'lliscament') {
            if (st.punts.length === 2) {
                st.punts = [p];
                st.despl = 0;
                $('despl').value = '0';
                $('despl-valor').textContent = '0';
            } else if (!st.punts.length || st.punts[0].x !== p.x || st.punts[0].y !== p.y) st.punts.push(p);
        }
        instruccio();
        pinta();
    }

    var arr = null; // { inici (px), punt, despl0, mogut }
    $('llenc').addEventListener('pointerdown', function (ev) {
        if (!st.eina) return;
        ev.preventDefault();
        st.cursorVisible = false;
        try {
            $('llenc').setPointerCapture(ev.pointerId);
        } catch (e) {
            /* res */
        }
        arr = { x: ev.clientX, y: ev.clientY, despl0: st.despl, mogut: false };
        if (st.eina === 'gir') toca(puntDe(ev));
    });
    $('llenc').addEventListener('pointermove', function (ev) {
        if (!arr) return;
        if (Math.hypot(ev.clientX - arr.x, ev.clientY - arr.y) > 6) arr.mogut = true;
        if (!arr.mogut) return;
        if (st.eina === 'gir') {
            st.centre = puntDe(ev);
            instruccio();
            pinta();
        } else if (st.eina === 'lliscament' && st.punts.length === 2) {
            var a = st.punts[0],
                b = st.punts[1],
                L = Math.hypot(b.x - a.x, b.y - a.y);
            var dx = (ev.clientX - arr.x) / gm.s,
                dy = -(ev.clientY - arr.y) / gm.s;
            var d = ajusta(arr.despl0 + (dx * (b.x - a.x) + dy * (b.y - a.y)) / L);
            d = Math.max(-4, Math.min(4, d));
            if (d !== st.despl) {
                st.despl = d;
                $('despl').value = String(d);
                $('despl-valor').textContent = String(d).replace('.', ',');
                instruccio();
                pinta();
            }
        }
    });
    var deixa = function (ev) {
        if (!arr) return;
        var a = arr;
        arr = null;
        if (st.eina !== 'gir' && !a.mogut) toca(puntDe(ev));
    };
    $('llenc').addEventListener('pointerup', deixa);
    $('llenc').addEventListener('pointercancel', function () {
        arr = null;
    });
    $('llenc').addEventListener('keydown', function (ev) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
        if (d) {
            ev.preventDefault();
            st.cursorVisible = true;
            st.cursor = { x: st.cursor.x + d[0] * PAS, y: st.cursor.y + d[1] * PAS };
            pinta();
        } else if ((ev.key === 'Enter' || ev.key === ' ') && st.eina) {
            ev.preventDefault();
            st.cursorVisible = true;
            toca({ x: st.cursor.x, y: st.cursor.y });
        }
    });
    $('llenc').addEventListener('blur', function () {
        st.cursorVisible = false;
        pinta();
    });

    // ── Preguntes ──────────────────────────────────────────────────────────
    function node() {
        return A.segueix(st.respostes);
    }
    function boto(text, f, principal) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn' + (principal ? ' btn-principal' : '');
        b.textContent = text;
        b.addEventListener('click', f);
        $('accions').appendChild(b);
        return b;
    }
    function missatge(text, tipus) {
        var p = document.createElement('p');
        p.className = 'fb fb-' + tipus;
        p.textContent = text;
        $('feedback').appendChild(p);
    }
    function pintaPreguntes() {
        var s = serie[idx];
        $('comptador').textContent = T.sanefa(idx + 1, serie.length);
        var r = node();
        var acabat = r.grup !== null;
        $('pregunta-zona').hidden = acabat;
        if (!acabat) {
            var n = A.NODES[r.cami[r.cami.length - 1]];
            $('pregunta').textContent = n.pregunta;
            $('explica').textContent = n.explica;
            $('btn-prova').textContent = T.provaAmb(T.eina[n.eina]);
            $('btn-prova').setAttribute('data-eina', n.eina);
        }
        // Resum
        var ol = $('resum');
        ol.innerHTML = '';
        $('t-resum').hidden = !st.respostes.length;
        st.respostes.forEach(function (resp, i) {
            var li = document.createElement('li');
            var t = document.createElement('span');
            t.textContent = A.NODES[r.cami[i]].pregunta + ' ';
            var b = document.createElement('span');
            b.className = 'r';
            b.textContent = resp ? T.si : T.no;
            t.appendChild(b);
            li.appendChild(t);
            if (!st.acabada) {
                var c = document.createElement('button');
                c.type = 'button';
                c.className = 'btn btn-petit';
                c.textContent = T.canvia;
                c.setAttribute('aria-label', T.canvia + ': ' + A.NODES[r.cami[i]].pregunta);
                c.addEventListener('click', function () {
                    st.respostes = st.respostes.slice(0, i);
                    $('feedback').innerHTML = '';
                    pintaPreguntes();
                });
                li.appendChild(c);
            }
            ol.appendChild(li);
        });
        $('resultat').hidden = !acabat;
        $('accions').innerHTML = '';
        if (acabat) {
            var gr = G.GRUPS[r.grup];
            $('resultat').textContent = T.resultat(gr.curt, gr.nom);
            if (r.grup === s.grup) {
                if (!st.acabada) {
                    st.acabada = true;
                    if (!st.errada) primera++;
                    st.mostraElements = true;
                    triaEina(null);
                    missatge(T.be, 'be');
                    pintaPreguntes();
                    return;
                }
                boto(idx + 1 < serie.length ? T.seguentSanefa : T.acaba, seguent, true);
            }
        }
    }
    function respon(v) {
        $('feedback').innerHTML = '';
        st.respostes.push(v);
        var r = node();
        if (r.grup !== null && r.grup !== serie[idx].grup) {
            // La primera resposta que no és la correcta
            st.errada = true;
            var bona = A.respon(serie[idx].sim).respostes;
            var i = 0;
            while (i < st.respostes.length && st.respostes[i] === bona[i].resposta) i++;
            var n = A.NODES[r.cami[i]];
            var gr = G.GRUPS[r.grup];
            missatge(T.resultat(gr.curt, gr.nom) + ' ' + T.revisa(n.pregunta), 'error');
            missatge(T.revisaEina(T.eina[n.eina]), 'info');
            st.respostes = st.respostes.slice(0, i);
        }
        pintaPreguntes();
        if (!$('pregunta-zona').hidden) $('btn-si').focus();
    }
    $('btn-si').addEventListener('click', function () {
        respon(true);
    });
    $('btn-no').addEventListener('click', function () {
        respon(false);
    });
    $('btn-prova').addEventListener('click', function () {
        triaEina($('btn-prova').getAttribute('data-eina'));
        $('llenc').focus();
    });

    function seguent() {
        if (idx + 1 < serie.length) {
            idx++;
            mostraSanefa();
        } else final();
    }
    function mostraSanefa() {
        reinicia();
        $('feedback').innerHTML = '';
        triaEina(null);
        pintaPreguntes();
        pinta();
    }
    function final() {
        $('pregunta-zona').hidden = true;
        $('resultat').hidden = false;
        $('resultat').textContent = T.final(serie.length, primera);
        $('feedback').innerHTML = '';
        missatge(T.senseCodi, 'info');
        $('resum').innerHTML = '';
        $('t-resum').hidden = true;
        $('accions').innerHTML = '';
        boto(
            T.unesAltres,
            function () {
                tanda++;
                comenca();
            },
            true
        );
    }
    function comenca() {
        serie = fesSerie();
        idx = 0;
        primera = 0;
        mostraSanefa();
    }

    // ── Inici ──────────────────────────────────────────────────────────────
    $('regla').textContent = T.regla;
    $('prova-eines').textContent = T.provaEines;
    $('fotos-aviat').textContent = T.fotosAviat;
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
    comenca();
})();
