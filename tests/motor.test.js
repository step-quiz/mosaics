/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: tests/motor.test.js
 * ROL: Tests dels motors (només Node):
 *   1. Isometries: composició, inversa, girs, miralls i lliscaments.
 *   2. Grups: l'ordre de cada grup (taula de l'especificació §8.3) i que els
 *      representants són un grup mòdul la xarxa.
 *   3. Detecció independent: cada sanefa, feta amb un motiu de punts sense cap
 *      simetria, es classifica (js/motor/deteccio.js, que no fa servir grups.js)
 *      com el grup que l'ha feta. També amb els motius predefinits i a l'atzar.
 *   4. Elements de simetria: cada mirall, eix de lliscament i centre de gir que
 *      dona grups.js deixa la sanefa igual, i hi són tots els tipus que troba el detector.
 *   5. Arbre: cada grup surt exactament una vegada, com a molt 4 preguntes, i les
 *      respostes del detector porten al grup.
 *   6. Motius: neteja d'un motiu desat; els motius a l'atzar no tenen simetria pròpia.
 *   7. Lliçons d'Aprèn: cada repte es pot fer amb els controls (valors del pas) i
 *      amb les nanses (punts de la graella de 0,5), la F hi cap, i encertat() és
 *      cert només per a la isometria del repte.
 * ÚS: node tests/motor.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const I = require('../js/motor/isometries.js');
const G = require('../js/motor/grups.js');
const D = require('../js/motor/deteccio.js');
const A = require('../js/motor/arbre.js');
const M = require('../js/motor/motiu.js');
const Atzar = require('../js/motor/atzar.js');
const L = require('../js/motor/llicons.js');

const prop = (x, y, eps = 1e-9) => Math.abs(x - y) < eps;
const igualIso = (g, h) => I.igual(g, h, 1e-9);

suite('1. Isometries');
{
    const p = { x: 0.3, y: -1.7 };
    const g = I.gir(1, 2, Math.PI / 2);
    let q = p;
    for (let i = 0; i < 4; i++) q = I.aplica(g, q);
    ok('4 girs de 90° tornen al punt', prop(q.x, p.x) && prop(q.y, p.y));
    const c = I.aplica(g, { x: 1, y: 2 });
    ok('el centre del gir no es mou', prop(c.x, 1) && prop(c.y, 2));
    const m = I.mirall(0.5, 0.5, Math.PI / 6);
    ok('mirall ∘ mirall = identitat', igualIso(I.composa(m, m), I.identitat()));
    ok('el mirall té determinant −1', prop(I.det(m), -1));
    const l = I.lliscament(0, 1, 0, 0.75);
    ok(
        'lliscament ∘ lliscament = translació de 2 vegades el desplaçament',
        igualIso(I.composa(l, l), I.translacio(1.5, 0))
    );
    const h = I.composa(g, l);
    ok('g ∘ g⁻¹ = identitat', igualIso(I.composa(h, I.inversa(h)), I.identitat()));
    const r = I.aplica(I.mirall(0, 0, Math.PI / 2), { x: 2, y: 3 });
    ok('mirall vertical: (2, 3) → (−2, 3)', prop(r.x, -2) && prop(r.y, 3));
    eq('per al canvas: [a, c, b, d, e, f]', I.perCanvas(I.crea(1, 2, 3, 4, 5, 6)).join(','), '1,3,2,4,5,6');
}

suite('2. Ordres dels grups i clausura');
{
    const ORDRES = { p111: 1, p11g: 2, p1m1: 2, p11m: 2, p112: 2, p2mg: 4, p2mm: 4 };
    eq('7 grups, en l’ordre de l’especificació', G.IDS.join(' '), 'p111 p11g p1m1 p11m p112 p2mg p2mm');
    for (const id of G.IDS) {
        const reps = G.representants(id);
        eq(`${id}: ordre ${ORDRES[id]} (clausura)`, reps.length, ORDRES[id]);
        eq(`${id}: l’ordre declarat és el de l’especificació`, G.GRUPS[id].ordre, ORDRES[id]);
        // Tancat: cada composició, reduïda, és un representant; cada inversa també
        const a = G.GRUPS[id].periode;
        const tancat = reps.every(x => reps.every(y => reps.some(z => igualIso(z, G.redueix(I.composa(x, y), a)))));
        const inverses = reps.every(x => reps.some(z => igualIso(z, G.redueix(I.inversa(x), a))));
        const ortogonals = reps.every(x => prop(x.a * x.a + x.c * x.c, 1) && prop(x.a * x.b + x.c * x.d, 0));
        ok(`${id}: tancat per composició i per inversa; matrius ortogonals`, tancat && inverses && ortogonals);
        const f = G.GRUPS[id].franja;
        ok(`${id}: el domini és dins de la franja`, G.GRUPS[id].domini[1] >= f[0] && G.GRUPS[id].domini[1] + 1 <= f[1]);
    }
}

// Un motiu de punts sense cap simetria (coordenades «genèriques», 3 colors)
const PUNTS = [
    { x: 0.137, y: 0.214, c: 'a' },
    { x: 0.581, y: 0.329, c: 'a' },
    { x: 0.263, y: 0.771, c: 'b' },
    { x: 0.812, y: 0.653, c: 'c' },
    { x: 0.449, y: 0.512, c: 'b' },
];
const sanefa = (id, punts) => G.puntsSanefa(id, punts, -24, 24);
const FINESTRA = [-8, 8];

suite('3. Detecció independent');
{
    for (const id of G.IDS) {
        const s = D.simetries(sanefa(id, PUNTS), FINESTRA);
        eq(`${id}: el detector hi troba ${id}`, D.grup(s), id);
        ok(`${id}: període ${G.GRUPS[id].periode}`, prop(s.periode, G.GRUPS[id].periode, 1e-6));
    }
    // Les còpies no se solapen: cap punt repetit
    for (const id of G.IDS) {
        const pts = sanefa(id, PUNTS);
        const claus = new Set(pts.map(p => `${p.x.toFixed(6)}|${p.y.toFixed(6)}`));
        ok(`${id}: cap punt repetit (les còpies no se solapen)`, claus.size === pts.length);
        const f = G.GRUPS[id].franja;
        ok(
            `${id}: tot dins de la franja`,
            pts.every(p => p.y >= f[0] - 1e-9 && p.y <= f[1] + 1e-9)
        );
    }
    for (const nom of Object.keys(M.PREDEFINITS)) {
        const pts = M.punts(M.PREDEFINITS[nom].motiu());
        const mal = G.IDS.filter(id => D.grup(D.simetries(sanefa(id, pts), FINESTRA)) !== id);
        ok(`motiu predefinit «${nom}»: els 7 grups es detecten bé`, !mal.length, mal.join(', '));
    }
    const at = Atzar.crea('motius-test');
    let mal = [];
    for (let i = 0; i < 60; i++) {
        const mo = M.aLAtzar(at);
        const id = G.IDS[i % 7];
        const g = D.grup(D.simetries(sanefa(id, M.punts(mo)), FINESTRA));
        if (g !== id) mal.push(`${mo.familia}/${id}→${g}`);
    }
    ok('60 motius a l’atzar: el grup detectat és el de la sanefa', !mal.length, mal.join(', '));
}

suite('4. Elements de simetria');
{
    const clau = p => `${Math.round(p.x * 1e6)}|${Math.round(p.y * 1e6)}|${p.c}`;
    for (const id of G.IDS) {
        const pts = sanefa(id, PUNTS);
        const taula = new Set(pts.map(clau));
        const dins = pts.filter(p => p.x > -6 && p.x < 6);
        const deixa = g => dins.every(p => taula.has(clau({ ...I.aplica(g, p), c: p.c })));
        const el = G.elements(id, -4, 4);
        const malM = el.miralls.filter(m => !deixa(I.mirall(m.x, m.y, m.angle)));
        const malL = el.lliscaments.filter(l => !deixa(I.lliscament(l.x, l.y, l.angle, l.despl)));
        const malG = el.girs.filter(c => !deixa(I.gir(c.x, c.y, (2 * Math.PI) / c.ordre)));
        ok(
            `${id}: cada element deixa la sanefa igual`,
            !malM.length && !malL.length && !malG.length,
            JSON.stringify({ malM, malL, malG })
        );
        const s = D.simetries(pts, FINESTRA);
        const horit = el.miralls.some(m => prop(m.angle, 0));
        const vert = el.miralls.some(m => prop(m.angle, Math.PI / 2, 1e-6));
        ok(
            `${id}: miralls, lliscaments i girs coincideixen amb el detector`,
            horit === s.horitzontal &&
                vert === s.vertical &&
                el.girs.length > 0 === s.gir &&
                el.lliscaments.length > 0 === s.lliscament,
            JSON.stringify({ horit, vert, girs: el.girs.length, ll: el.lliscaments.length, s })
        );
        // Densitat: els miralls verticals i els centres de gir es repeteixen cada mig període
        const a = G.GRUPS[id].periode;
        const xsV = el.miralls.filter(m => prop(m.angle, Math.PI / 2, 1e-6)).map(m => m.x);
        if (xsV.length) {
            const salts = xsV.slice(1).map((x, i) => x - xsV[i]);
            ok(
                `${id}: un mirall vertical cada ${a / 2}`,
                salts.every(d => prop(d, a / 2, 1e-6))
            );
        }
        if (el.girs.length) {
            const salts = el.girs.slice(1).map((c, i) => c.x - el.girs[i].x);
            ok(
                `${id}: un centre de gir cada ${a / 2}, sobre l’eix`,
                salts.every(d => prop(d, a / 2, 1e-6)) && el.girs.every(c => prop(c.y, 0))
            );
        }
    }
    // p2mg: els centres de gir no són sobre els miralls
    const el = G.elements('p2mg', -4, 4);
    const xsV = el.miralls.map(m => m.x);
    ok(
        'p2mg: cap centre de gir sobre un mirall',
        el.girs.every(c => !xsV.some(x => prop(x, c.x, 1e-6)))
    );
    ok(
        'p2mg: el lliscament és de mig període',
        el.lliscaments.every(l => prop(l.despl, 1, 1e-6))
    );
    ok(
        'p11g: un sol eix de lliscament (y = 0), cap mirall',
        G.elements('p11g', -4, 4).lliscaments.length === 1 && !G.elements('p11g', -4, 4).miralls.length
    );
}

suite('5. Arbre de decisió');
{
    const fulles = A.fulles().sort();
    eq('cada grup surt exactament una vegada', fulles.join(' '), [...G.IDS].sort().join(' '));
    const prof = id => {
        const n = A.NODES[id];
        return 1 + Math.max(A.esNode(n.si) ? prof(n.si) : 0, A.esNode(n.no) ? prof(n.no) : 0);
    };
    ok('com a molt 4 preguntes', prof(A.INICI) <= 4, String(prof(A.INICI)));
    ok(
        'cada pregunta té explicació i eina',
        Object.values(A.NODES).every(n => n.pregunta && n.explica && ['gir', 'mirall', 'lliscament'].includes(n.eina))
    );
    for (const id of G.IDS) {
        const s = D.simetries(sanefa(id, PUNTS), FINESTRA);
        const r = A.respon(s);
        eq(`${id}: les respostes del detector hi porten`, r.grup, id);
        eq(`${id}: segueix() amb aquestes respostes també`, A.segueix(r.respostes.map(x => x.resposta)).grup, id);
    }
    eq('respostes a mitges: encara sense grup', A.segueix([false]).grup, null);
}

suite('6. Motius');
{
    eq('neteja: res de bo → null', M.neteja({ a: 1 }), null);
    const n = M.neteja({
        formes: [
            {
                tipus: 'poligon',
                color: 1,
                punts: [
                    [0, 0],
                    [2, 0.5],
                    [0.5, -1],
                ],
            },
            {
                tipus: 'poligon',
                color: 9,
                punts: [
                    [0, 0],
                    [1, 1],
                    [0, 1],
                ],
            },
            { tipus: 'traç', color: 0, punts: [[0.1, 0.1]] },
            {
                tipus: 'script',
                color: 0,
                punts: [
                    [0, 0],
                    [1, 1],
                ],
            },
        ],
    });
    eq(
        'neteja: es queda la forma bona, amb els punts dins del quadrat',
        JSON.stringify(n),
        '{"formes":[{"tipus":"poligon","color":1,"punts":[[0,0],[1,0.5],[0.5,0]]}]}'
    );
    const at = Atzar.crea('dins');
    let fora = 0;
    for (let i = 0; i < 200; i++) {
        const mo = M.aLAtzar(at);
        mo.formes.forEach(f => f.punts.forEach(p => (p[0] < 0 || p[0] > 1 || p[1] < 0 || p[1] > 1) && fora++));
    }
    eq('200 motius a l’atzar: tots els punts dins del quadrat', fora, 0);
    const a1 = JSON.stringify(M.aLAtzar(Atzar.crea('x'))),
        a2 = JSON.stringify(M.aLAtzar(Atzar.crea('x')));
    ok('mateixa llavor, mateix motiu', a1 === a2);
}

suite('7. Lliçons d’Aprèn');
{
    eq('quatre lliçons', L.IDS.join(' '), 'translacio gir mirall lliscament');
    const W = L.FINESTRA;
    const cantons = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
    ];
    const dinsFinestra = T =>
        cantons.every(c => {
            const q = I.aplica(T, c);
            return q.x >= W.x0 - 1e-9 && q.x <= W.x1 + 1e-9 && q.y >= W.y0 - 1e-9 && q.y <= W.y1 + 1e-9;
        });
    ok('la F original hi cap', dinsFinestra(L.POSA));
    for (const id of L.IDS) {
        const ll = L.LLICONS[id];
        const enPas = p =>
            Object.keys(ll.params).every(k => {
                const d = ll.params[k];
                return p[k] >= d.min && p[k] <= d.max && prop(p[k] / d.pas, Math.round(p[k] / d.pas), 1e-9);
            });
        ok(`${id}: l’estat inicial és dins dels controls`, enPas(ll.inicial));
        eq(`${id}: dos reptes`, ll.reptes.length, 2);
        ll.reptes.forEach((r, i) => {
            ok(`${id}, repte ${i + 1}: es pot fer amb els controls (valors del pas)`, enPas(r));
            ok(`${id}, repte ${i + 1}: la F de punts hi cap`, dinsFinestra(L.transformacio(id, r)));
            ok(`${id}, repte ${i + 1}: encertat() amb els valors del repte`, L.encertat(id, r, r));
            ok(`${id}, repte ${i + 1}: no està fet d’entrada`, !L.encertat(id, ll.inicial, r));
            ok(
                `${id}, repte ${i + 1}: la F de punts no tapa la F original`,
                !I.igual(L.isometria(id, r), I.identitat(), 1e-6)
            );
        });
        // Repte 2 amb nanses: dos punts de la graella de 0,5 dins de la finestra sobre l'eix
        const r = ll.reptes[1];
        if (id === 'mirall' || id === 'lliscament') {
            const a = { x: r.px, y: r.py };
            const u = { x: Math.cos((r.angle * Math.PI) / 180), y: Math.sin((r.angle * Math.PI) / 180) };
            // Un altre punt de la graella de 0,5, dins de la finestra, sobre l'eix
            let b = null;
            for (let x = W.x0; x <= W.x1 && !b; x += 0.5)
                for (let y = W.y0; y <= W.y1 && !b; y += 0.5) {
                    const dx = x - a.x,
                        dy = y - a.y;
                    if (Math.hypot(dx, dy) > 0.25 && Math.abs(dx * u.y - dy * u.x) < 1e-9) b = { x, y };
                }
            ok(`${id}, repte 2: l’eix passa per dos punts de la graella`, !!b);
            if (b) {
                for (const [p1, p2] of [
                    [a, b],
                    [b, a],
                ]) {
                    const e = L.eixDeDosPunts(p1, p2);
                    const p = { ...r, angle: e.angle, px: e.px, py: e.py };
                    ok(
                        `${id}, repte 2: amb les nanses a (${p1.x}, ${p1.y}) i (${p2.x}, ${p2.y}), encertat`,
                        L.encertat(id, p, r)
                    );
                }
            }
        }
    }
    eq('nansa del gir: 90° (pas de 15°)', L.angleDeNansa({ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1.1, y: 3 }), 90);
    eq('nansa del gir: −180 a 180', L.angleDeNansa({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: -0.01 }), -180);
    eq('nansa del gir: s’ajusta a 15°', L.angleDeNansa({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.3 }), 15);
    eq('eix de dos punts iguals: null', L.eixDeDosPunts({ x: 1, y: 1 }, { x: 1, y: 1 }), null);
    ok('eix de (0, 0) a (1, 1): 45°', prop(L.eixDeDosPunts({ x: 0, y: 0 }, { x: 1, y: 1 }).angle, 45, 1e-9));
    ok(
        'eix de (1, 1) a (0, 0): també 45° (la recta, no el sentit)',
        prop(L.eixDeDosPunts({ x: 1, y: 1 }, { x: 0, y: 0 }).angle, 45, 1e-9)
    );
    eq(
        'ajusta: pas i límits',
        [L.ajusta({ min: -6, max: 6, pas: 0.5 }, 2.3), L.ajusta({ min: -6, max: 6, pas: 0.5 }, 9)].join(' '),
        '2.5 6'
    );
}

finish('MOTORS');
