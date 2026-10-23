/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/ui/taller.js
 * ROL: El Taller (taller.html): l'alumne dibuixa un motiu en un quadrat (traç a
 *      mà o polígons, 4 colors, models), tria un dels 7 tipus de sanefa i en veu
 *      la sanefa, amb les simetries si vol. Desa la imatge en PNG i imprimeix
 *      un full per pintar (només el contorn, A4).
 * ARQUITECTURA: Script clàssic. Estat a la memòria; el motiu i el grup es desen
 *      a localStorage (mosaics:v1:motiu, mosaics:v1:grup), sempre dins de
 *      try/catch, i el motiu desat passa per Motiu.neteja.
 *      Editor: ratolí o dit (Pointer Events amb setPointerCapture) i teclat
 *      (fletxes: cursor; Retorn: posa un punt o comença/acaba el traç; Esc: deixa-ho).
 *      Adreça: taller.html?grup=p2mg&model=F (opcional; els valors estranys s'ignoren).
 * DEPENDÈNCIES: Isometries, Grups, Deteccio, Motiu, MosaicsTextos, Pinta
 * ============================================================================
 */
(function () {
    'use strict';
    var I = window.Isometries,
        G = window.Grups,
        D = window.Deteccio,
        M = window.Motiu,
        T = window.MosaicsTextos,
        P = window.Pinta;
    var $ = function (id) {
        return document.getElementById(id);
    };
    var CLAU_MOTIU = 'mosaics:v1:motiu',
        CLAU_GRUP = 'mosaics:v1:grup';
    var PAS_POLIGON = 0.025,
        PAS_CURSOR = 0.05;

    function llegeix(k) {
        try {
            return localStorage.getItem(k);
        } catch (e) {
            return null;
        }
    }
    function desa(k, v) {
        try {
            localStorage.setItem(k, v);
        } catch (e) {
            /* sense emmagatzematge: es treballa igual */
        }
    }

    // ── Estat ──────────────────────────────────────────────────────────────
    var q;
    try {
        q = new URLSearchParams(location.search);
    } catch (e) {
        q = new URLSearchParams('');
    }
    var st = {
        motiu: null,
        historial: [],
        eina: 'traç',
        color: 0,
        enCurs: null, // { tipus, punts } mentre es dibuixa
        cursor: { x: 0.5, y: 0.5 },
        cursorVisible: false,
        grup: 'p1m1',
        mostraSim: false,
    };
    var model = q.get('model');
    if (model && M.PREDEFINITS[model]) st.motiu = M.PREDEFINITS[model].motiu();
    if (!st.motiu) {
        try {
            st.motiu = M.neteja(JSON.parse(llegeix(CLAU_MOTIU) || 'null'));
        } catch (e) {
            st.motiu = null;
        }
    }
    if (!st.motiu) st.motiu = M.PREDEFINITS.F.motiu();
    var g0 = q.get('grup') || llegeix(CLAU_GRUP);
    if (G.IDS.indexOf(g0) >= 0) st.grup = g0;

    var copia = function (m) {
        return JSON.parse(JSON.stringify(m));
    };
    function canvia(f) {
        st.historial.push(copia(st.motiu));
        if (st.historial.length > 50) st.historial.shift();
        f();
        desa(CLAU_MOTIU, JSON.stringify(st.motiu));
        pintaTot();
    }
    var anuncia = function (t) {
        $('anunci-editor').textContent = t;
    };

    // ── Editor ─────────────────────────────────────────────────────────────
    var ed = { c: null, s: 0, pad: 14 };
    function pintaEditor() {
        var E = Math.min(320, $('mesura-editor').clientWidth || 320);
        ed.c = P.prepara($('editor'), E, E);
        ed.s = E - 2 * ed.pad;
        var B = P.base(ed.s, ed.pad, ed.pad + ed.s);
        var col = P.colors(),
            ctx = ed.c.ctx;
        P.fons(ed.c, col.fons);
        // Graella cada 0,1
        P.pixels(ed.c);
        ctx.strokeStyle = col.graella;
        ctx.lineWidth = 1;
        for (var i = 0; i <= 10; i++) {
            var u = ed.pad + (ed.s * i) / 10;
            ctx.beginPath();
            ctx.moveTo(u, ed.pad);
            ctx.lineTo(u, ed.pad + ed.s);
            ctx.moveTo(ed.pad, u);
            ctx.lineTo(ed.pad + ed.s, u);
            ctx.stroke();
        }
        P.motiu(ed.c, st.motiu, B, { colors: col });
        // El que s'està dibuixant
        if (st.enCurs && st.enCurs.punts.length) {
            var pts = st.enCurs.punts.map(function (p) {
                return I.aplica(B, { x: p[0], y: p[1] });
            });
            P.pixels(ed.c);
            ctx.save();
            ctx.strokeStyle = col.c[st.color];
            ctx.lineWidth = st.enCurs.tipus === 'traç' ? Math.max(2, 0.035 * ed.s) : 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            pts.forEach(function (p, j) {
                if (j) ctx.lineTo(p.x, p.y);
                else ctx.moveTo(p.x, p.y);
            });
            ctx.stroke();
            if (st.enCurs.tipus === 'poligon') {
                ctx.fillStyle = col.c[st.color];
                pts.forEach(function (p, j) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, j ? 4 : 7, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
            ctx.restore();
        }
        // Vora del quadrat
        P.pixels(ed.c);
        ctx.strokeStyle = col.vora;
        ctx.lineWidth = 2;
        ctx.strokeRect(ed.pad, ed.pad, ed.s, ed.s);
        if (st.cursorVisible) {
            var cu = I.aplica(B, st.cursor);
            ctx.strokeStyle = col.nansa;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cu.x - 10, cu.y);
            ctx.lineTo(cu.x + 10, cu.y);
            ctx.moveTo(cu.x, cu.y - 10);
            ctx.lineTo(cu.x, cu.y + 10);
            ctx.stroke();
        }
        $('btn-tanca').hidden = !(st.enCurs && st.enCurs.tipus === 'poligon' && st.enCurs.punts.length >= 3);
        $('btn-desfes').disabled = !st.historial.length && !st.enCurs;
    }

    var r3 = function (v) {
        return Math.round(v * 1000) / 1000;
    };
    var dinsQuadrat = function (v) {
        return Math.min(1, Math.max(0, v));
    };
    function puntDe(ev) {
        var r = $('editor').getBoundingClientRect();
        return {
            x: dinsQuadrat((ev.clientX - r.left - ed.pad) / ed.s),
            y: dinsQuadrat((ed.pad + ed.s - (ev.clientY - r.top)) / ed.s),
        };
    }
    var ajusta = function (p) {
        return [r3(Math.round(p.x / PAS_POLIGON) * PAS_POLIGON), r3(Math.round(p.y / PAS_POLIGON) * PAS_POLIGON)];
    };

    function acabaForma() {
        var f = st.enCurs;
        st.enCurs = null;
        if (!f) return;
        var minim = f.tipus === 'poligon' ? 3 : 2;
        if (f.punts.length < minim) return pintaTot();
        canvia(function () {
            st.motiu.formes.push({ tipus: f.tipus, color: st.color, punts: f.punts });
        });
        anuncia(f.tipus === 'poligon' ? 'Polígon tancat.' : 'Traç fet.');
    }
    function puntPoligon(p) {
        var a = ajusta(p);
        if (!st.enCurs) st.enCurs = { tipus: 'poligon', punts: [] };
        var pts = st.enCurs.punts;
        if (pts.length >= 3 && Math.hypot(a[0] - pts[0][0], a[1] - pts[0][1]) < 0.05) return acabaForma();
        var ultim = pts[pts.length - 1];
        if (!ultim || ultim[0] !== a[0] || ultim[1] !== a[1]) pts.push(a);
        anuncia('Punt ' + pts.length + '.');
        pintaEditor();
    }

    var arrossegant = false;
    $('editor').addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        st.cursorVisible = false;
        var p = puntDe(ev);
        if (st.eina === 'poligon') return puntPoligon(p);
        arrossegant = true;
        try {
            $('editor').setPointerCapture(ev.pointerId);
        } catch (e) {
            /* res */
        }
        st.enCurs = { tipus: 'traç', punts: [[r3(p.x), r3(p.y)]] };
        pintaEditor();
    });
    $('editor').addEventListener('pointermove', function (ev) {
        if (!arrossegant || !st.enCurs) return;
        var p = puntDe(ev),
            pts = st.enCurs.punts,
            u = pts[pts.length - 1];
        if (Math.hypot(p.x - u[0], p.y - u[1]) > 0.008 && pts.length < 600) {
            pts.push([r3(p.x), r3(p.y)]);
            pintaEditor();
        }
    });
    var deixa = function () {
        if (!arrossegant) return;
        arrossegant = false;
        acabaForma();
    };
    $('editor').addEventListener('pointerup', deixa);
    $('editor').addEventListener('pointercancel', deixa);

    $('editor').addEventListener('keydown', function (ev) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
        if (d) {
            ev.preventDefault();
            st.cursorVisible = true;
            var pas = ev.shiftKey ? PAS_POLIGON : PAS_CURSOR;
            st.cursor = { x: r3(dinsQuadrat(st.cursor.x + d[0] * pas)), y: r3(dinsQuadrat(st.cursor.y + d[1] * pas)) };
            if (st.enCurs && st.enCurs.tipus === 'traç') st.enCurs.punts.push([st.cursor.x, st.cursor.y]);
            pintaEditor();
        } else if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            st.cursorVisible = true;
            if (st.eina === 'poligon') puntPoligon(st.cursor);
            else if (st.enCurs) acabaForma();
            else {
                st.enCurs = { tipus: 'traç', punts: [[st.cursor.x, st.cursor.y]] };
                anuncia('Comença el traç: mou-te amb les fletxes i prem Retorn per acabar.');
                pintaEditor();
            }
        } else if (ev.key === 'Escape') {
            st.enCurs = null;
            anuncia('Deixat.');
            pintaEditor();
        }
    });
    $('editor').addEventListener('blur', function () {
        st.cursorVisible = false;
        pintaEditor();
    });

    function triaEina(e) {
        if (st.enCurs) acabaForma();
        st.eina = e;
        $('eina-traç').setAttribute('aria-pressed', String(e === 'traç'));
        $('eina-poligon').setAttribute('aria-pressed', String(e === 'poligon'));
        $('instr-eina').textContent = e === 'traç' ? T.instruccioTraç : T.instruccioPoligon;
    }
    $('eina-traç').addEventListener('click', function () {
        triaEina('traç');
    });
    $('eina-poligon').addEventListener('click', function () {
        triaEina('poligon');
    });
    document.querySelectorAll('.color').forEach(function (b) {
        b.addEventListener('click', function () {
            st.color = Number(b.getAttribute('data-color'));
            document.querySelectorAll('.color').forEach(function (x) {
                x.setAttribute('aria-pressed', String(x === b));
            });
            pintaEditor();
        });
    });
    $('btn-tanca').addEventListener('click', acabaForma);
    $('btn-desfes').addEventListener('click', function () {
        if (st.enCurs) {
            st.enCurs = null;
            return pintaEditor();
        }
        if (!st.historial.length) return;
        st.motiu = st.historial.pop();
        desa(CLAU_MOTIU, JSON.stringify(st.motiu));
        pintaTot();
    });
    $('btn-esborra').addEventListener('click', function () {
        st.enCurs = null;
        canvia(function () {
            st.motiu = { formes: [] };
        });
    });
    Object.keys(M.PREDEFINITS).forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-petit';
        b.textContent = M.PREDEFINITS[k].nom;
        b.addEventListener('click', function () {
            st.enCurs = null;
            canvia(function () {
                st.motiu = M.PREDEFINITS[k].motiu();
            });
        });
        $('models').appendChild(b);
    });

    // ── Tria del grup ──────────────────────────────────────────────────────
    G.IDS.forEach(function (id) {
        var l = document.createElement('label');
        l.className = 'opcio-grup';
        var inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'grup';
        inp.value = id;
        inp.checked = id === st.grup;
        var s = document.createElement('span');
        var b = document.createElement('b');
        b.textContent = G.GRUPS[id].curt;
        s.appendChild(b);
        s.appendChild(document.createTextNode(G.GRUPS[id].nom));
        l.appendChild(inp);
        l.appendChild(s);
        inp.addEventListener('change', function () {
            st.grup = id;
            desa(CLAU_GRUP, id);
            pintaSanefa();
        });
        $('grups').appendChild(l);
    });
    $('mostra-sim').addEventListener('change', function () {
        st.mostraSim = $('mostra-sim').checked;
        $('llegenda').hidden = !st.mostraSim;
        pintaSanefa();
    });

    // ── Sanefa ─────────────────────────────────────────────────────────────
    function geometria(w) {
        var s = Math.max(34, Math.min(90, w / 8));
        return { w: w, h: Math.round(2.6 * s), s: s, x0: -w / (2 * s) - 1, x1: w / (2 * s) + 1 };
    }
    function dibuixaSanefa(c, gm, colors, o) {
        var B = P.base(gm.s, gm.w / 2, gm.h / 2);
        P.fons(c, o.contorn ? '#fff' : colors.fons);
        P.sanefa(c, st.grup, st.motiu, B, {
            x0: gm.x0,
            x1: gm.x1,
            colors: colors,
            franja: true,
            contorn: o.contorn,
            gruixContorn: o.gruix,
        });
        if (o.simetries) P.elements(c, st.grup, B, gm.x0, gm.x1, colors);
    }
    var temporitzador = null;
    function pintaSanefa() {
        var w = $('mesura-sanefa').clientWidth || 600;
        var gm = geometria(w);
        var c = P.prepara($('sanefa'), gm.w, gm.h);
        dibuixaSanefa(c, gm, P.colors(), { simetries: st.mostraSim });
        $('sanefa').setAttribute('aria-label', 'La sanefa ' + G.GRUPS[st.grup].curt + ': ' + G.GRUPS[st.grup].nom);
        clearTimeout(temporitzador);
        temporitzador = setTimeout(revisa, 150);
    }
    // Avisa si el motiu té simetria pròpia (la sanefa en té més que les del grup) o és buit
    function revisa() {
        var fb = $('feedback');
        fb.innerHTML = '';
        var msg = null;
        if (!st.motiu.formes.length) msg = T.motiuBuit;
        else {
            try {
                var pts = G.puntsSanefa(st.grup, M.punts(st.motiu), -12, 12);
                if (D.grup(D.simetries(pts, [-4, 4])) !== st.grup) msg = T.simetriaDeMes;
            } catch (e) {
                msg = null;
            }
        }
        if (msg) {
            var p = document.createElement('p');
            p.className = 'fb fb-info';
            p.textContent = msg;
            fb.appendChild(p);
        }
    }
    function pintaTot() {
        pintaEditor();
        pintaSanefa();
    }

    // ── PNG i full per pintar ──────────────────────────────────────────────
    function llencFora(w, h) {
        var cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        return { cv: cv, c: { ctx: cv.getContext('2d'), w: w, h: h, dpr: 1 } };
    }
    $('btn-png').addEventListener('click', function () {
        var gm = geometria(2400);
        gm.s = 150;
        gm.h = Math.round(2.6 * 150);
        gm.x0 = -9;
        gm.x1 = 9;
        var f = llencFora(gm.w, gm.h);
        dibuixaSanefa(f.c, gm, P.colorsClars(), { simetries: st.mostraSim });
        f.cv.toBlob(function (blob) {
            if (!blob) return;
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'sanefa-' + G.GRUPS[st.grup].curt + '.png';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                URL.revokeObjectURL(a.href);
                a.remove();
            }, 1000);
        }, 'image/png');
    });
    $('btn-imprimeix').addEventListener('click', function () {
        var gr = G.GRUPS[st.grup];
        var alt = gr.franja[1] - gr.franja[0];
        var s = 170,
            w = 2000,
            h = Math.round((alt + 0.3) * s);
        var gm = { w: w, h: h, s: s, x0: -w / (2 * s) - 1, x1: w / (2 * s) + 1 };
        var f = llencFora(w, h);
        // Centrat a la franja
        var B = P.base(s, w / 2, (gr.franja[1] + 0.15) * s);
        P.fons(f.c, '#fff');
        P.sanefa(f.c, st.grup, st.motiu, B, {
            x0: gm.x0,
            x1: gm.x1,
            colors: P.colorsClars(),
            franja: true,
            contorn: true,
            gruix: 3,
            gruixContorn: 3,
        });
        var url = f.cv.toDataURL('image/png');
        var full = $('full-imprimir');
        full.innerHTML = '';
        var h2 = document.createElement('h2');
        h2.textContent = T.titolImpres(gr.curt, gr.nom);
        full.appendChild(h2);
        for (var i = 0; i < (alt > 1 ? 3 : 5); i++) {
            var img = document.createElement('img');
            img.src = url;
            img.alt = '';
            full.appendChild(img);
        }
        var p = document.createElement('p');
        p.textContent = T.peuImpres;
        full.appendChild(p);
        document.body.classList.add('imprimeix-full');
        setTimeout(function () {
            window.print();
        }, 50);
    });
    window.addEventListener('afterprint', function () {
        document.body.classList.remove('imprimeix-full');
    });

    // ── Inici ──────────────────────────────────────────────────────────────
    $('nota-teclat').textContent = T.teclat;
    triaEina('traç');
    var pendent = false;
    window.addEventListener('resize', function () {
        if (pendent) return;
        pendent = true;
        requestAnimationFrame(function () {
            pendent = false;
            pintaTot();
        });
    });
    try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintaTot);
    } catch (e) {
        /* navegadors antics */
    }
    pintaTot();
})();
