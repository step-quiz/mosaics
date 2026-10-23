/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/motor/arbre.js
 * ROL: L'arbre de decisió per classificar una sanefa: preguntes de sí o no, com
 *      a molt 4, fins a un dels 7 grups. Cada pregunta porta una explicació
 *      d'una línia i l'eina de Classifica que la comprova.
 * ARQUITECTURA: Dades + un recorregut pur. Cada node:
 *      { pregunta, explica, eina: 'gir'|'mirall'|'lliscament', propietat, si, no }
 *      «si» i «no» són un altre node o un grup (clau de js/motor/grups.js).
 *      «propietat» és la de js/motor/deteccio.js que respon la pregunta.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.Arbre = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var P = {
        horitzontal: {
            pregunta: 'Té simetria horitzontal?',
            explica: 'Un mirall al llarg de la sanefa, pel mig, la deixa igual.',
            eina: 'mirall',
        },
        vertical: {
            pregunta: 'Té simetria vertical?',
            explica: 'Un mirall dret, de dalt a baix, la deixa igual.',
            eina: 'mirall',
        },
        gir: {
            pregunta: 'Té gir de 180°?',
            explica: 'Si la gires mitja volta al voltant d’un punt, queda igual.',
            eina: 'gir',
        },
        lliscament: {
            pregunta: 'Té lliscament?',
            explica: 'Un mirall horitzontal i després un desplaçament la deixen igual.',
            eina: 'lliscament',
        },
    };
    var node = function (propietat, si, no) {
        return {
            propietat: propietat,
            pregunta: P[propietat].pregunta,
            explica: P[propietat].explica,
            eina: P[propietat].eina,
            si: si,
            no: no,
        };
    };

    var INICI = 'n1';
    var NODES = {
        n1: node('horitzontal', 'n2', 'n3'),
        n2: node('vertical', 'p2mm', 'p11m'),
        n3: node('vertical', 'n4', 'n5'),
        n4: node('gir', 'p2mg', 'p1m1'),
        n5: node('gir', 'p112', 'n6'),
        n6: node('lliscament', 'p11g', 'p111'),
    };

    var esNode = function (id) {
        return Object.prototype.hasOwnProperty.call(NODES, id);
    };

    /**
     * Segueix l'arbre amb unes respostes.
     * @param {boolean[]} respostes  una per pregunta, en ordre
     * @returns {{ cami: string[], grup: string|null }}  grup null si falten respostes
     */
    function segueix(respostes) {
        var id = INICI,
            cami = [];
        for (var i = 0; esNode(id); i++) {
            cami.push(id);
            if (i >= respostes.length) return { cami: cami, grup: null };
            id = respostes[i] ? NODES[id].si : NODES[id].no;
        }
        return { cami: cami, grup: id };
    }

    /** Les respostes correctes per a unes simetries ({ horitzontal, vertical, gir, lliscament }). */
    function respon(sim) {
        var id = INICI,
            out = [];
        while (esNode(id)) {
            var r = !!sim[NODES[id].propietat];
            out.push({ node: id, resposta: r });
            id = r ? NODES[id].si : NODES[id].no;
        }
        return { respostes: out, grup: id };
    }

    /** Totes les fulles (per als tests). */
    function fulles() {
        var out = [];
        Object.keys(NODES).forEach(function (k) {
            ['si', 'no'].forEach(function (b) {
                if (!esNode(NODES[k][b])) out.push(NODES[k][b]);
            });
        });
        return out;
    }

    return { INICI: INICI, NODES: NODES, esNode: esNode, segueix: segueix, respon: respon, fulles: fulles };
});
