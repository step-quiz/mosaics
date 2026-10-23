/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: js/ui/textos.js
 * ROL: Tots els textos que veu l'alumne a Aprèn, Taller i Classifica. Curts:
 *      com a molt unes 40 paraules a la vegada. Els errors diuen QUIN és
 *      l'error i amb quina eina es comprova; no donen mai la resposta.
 * ARQUITECTURA: Dades (window.MosaicsTextos); també es carrega amb Node (tests).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.MosaicsTextos = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return {
        regla: 'Un moviment compta si la sanefa queda exactament igual, colors inclosos.',

        // ── Aprèn ──────────────────────────────────────────────────────────
        llicons: {
            translacio: {
                nom: 'Translació',
                explica: 'La translació mou la F sense girar-la ni capgirar-la. Totes les parts es mouen igual.',
                params: { dx: 'Cap a la dreta', dy: 'Cap amunt' },
                nanses: 'Arrossega la F de color.',
                bonic: 'La F s’ha mogut, però mira cap al mateix costat.',
            },
            gir: {
                nom: 'Gir',
                explica: 'El gir fa voltar la F al voltant d’un punt, el centre. El centre no es mou.',
                params: { angle: 'Angle (°)', cx: 'Centre: x', cy: 'Centre: y' },
                nanses: 'Arrossega el centre (◆) i després la nansa (●) per girar.',
                bonic: 'La F està girada, però no està capgirada: es pot llegir.',
            },
            mirall: {
                nom: 'Simetria',
                explica: 'La simetria és com un mirall: la F queda capgirada, a la mateixa distància de l’eix.',
                params: { angle: 'Angle de l’eix (°)', px: 'Eix: x', py: 'Eix: y' },
                nanses: 'Arrossega els dos punts (●) de l’eix.',
                bonic: 'Cada punt de la F i el seu reflex són a la mateixa distància de l’eix.',
            },
            lliscament: {
                nom: 'Lliscament',
                explica: 'El lliscament és una simetria i, després, una translació al llarg del mateix eix.',
                params: { angle: 'Angle de l’eix (°)', px: 'Eix: x', py: 'Eix: y', despl: 'Desplaçament' },
                nanses: 'Arrossega els dos punts (●) de l’eix i la fletxa (▶) del desplaçament.',
                bonic: 'Com les petjades quan camines: un peu, l’altre peu, sempre endavant.',
            },
        },
        repte: (n, total) => `Repte ${n} de ${total}`,
        repteControls: 'Fes que la F de color tapi la F de punts. Fes servir els controls.',
        repteNanses: 'Ara, sense controls: fes que la F de color tapi la F de punts.',
        encara: 'Encara no la tapa del tot.',
        encertat: 'Molt bé! Les dues F coincideixen.',
        seguentRepte: 'Repte següent',
        seguentLlico: 'Lliçó següent',
        llicoFeta: 'Lliçó acabada.',
        totesFetes: 'Has fet les quatre lliçons. Ara pots fer la teva sanefa al Taller.',
        ambControls: 'Prefereixo els controls',
        llegendaApren: 'Gris: la F original. Punts: on ha d’anar. Color: la teva còpia.',

        // ── Taller ─────────────────────────────────────────────────────────
        eines: { traç: 'Traç a mà', poligon: 'Polígon' },
        instruccioTraç: 'Dibuixa amb el dit o el ratolí dins del quadrat.',
        instruccioPoligon: 'Toca els vèrtexs un a un. Toca el primer per tancar el polígon.',
        teclat: 'Teclat: fletxes per moure el cursor, Retorn per posar un punt, Esc per deixar-ho.',
        desfes: 'Desfés',
        esborraTot: 'Esborra-ho tot',
        tancaPoligon: 'Tanca el polígon',
        models: 'Models',
        colors: ['Vermell', 'Blau', 'Ocre', 'Verd'],
        motiuBuit: 'El quadrat és buit: dibuixa-hi alguna cosa o tria un model.',
        triaGrup: 'Tria com es repeteix',
        mostraSimetries: 'Mostra les simetries',
        llegenda: {
            mirall: 'mirall',
            lliscament: 'eix de lliscament',
            gir2: 'centre de gir de 180°',
        },
        exporta: 'Desa la imatge (PNG)',
        imprimeix: 'Imprimeix per pintar',
        titolImpres: (curt, nom) => `Sanefa ${curt}: ${nom}`,
        peuImpres: 'Pinta la sanefa. Perquè les simetries es mantinguin, les còpies han de tenir els mateixos colors.',
        simetriaDeMes: 'El teu motiu ja és simètric: la sanefa té més simetries que les del tipus triat.',

        // ── Classifica ─────────────────────────────────────────────────────
        sanefa: (i, n) => `Sanefa ${i} de ${n}`,
        provaEines:
            'Prova els moviments amb les eines. Si la còpia transparent coincideix amb la sanefa, el moviment compta.',
        eina: { gir: 'Gir', mirall: 'Mirall', lliscament: 'Lliscament', cap: 'Treu la còpia' },
        einaInstr: {
            gir: 'Toca el centre del gir.',
            mirall: 'Toca dos punts de l’eix del mirall.',
            mirall2: 'Ara toca el segon punt de l’eix.',
            lliscament: 'Toca dos punts de l’eix. Després arrossega per lliscar.',
            lliscament2: 'Ara toca el segon punt de l’eix.',
            lliscament3: 'Arrossega (o fes servir el control) per lliscar la còpia al llarg de l’eix.',
        },
        angleGir: 'Angle',
        desplacament: 'Desplaçament',
        copiaGir: g => `Còpia girada ${g}°. Coincideix?`,
        copiaMirall: 'Còpia reflectida. Coincideix?',
        copiaLliscament: 'Còpia reflectida i desplaçada. Coincideix?',
        provaAmb: eina => `Prova-ho amb: ${eina}`,
        si: 'Sí',
        no: 'No',
        respostes: 'Les teves respostes',
        canvia: 'Canvia',
        resultat: (curt, nom) => `Segons les teves respostes, és la sanefa ${curt}: ${nom}.`,
        be: 'Correcte! Mira-hi totes les simetries.',
        revisa: pregunta => `Revisa «${pregunta}».`,
        revisaEina: eina => `Comprova-ho amb l’eina «${eina}».`,
        seguentSanefa: 'Sanefa següent',
        acaba: 'Acaba',
        final: (n, primera) => `Has classificat ${n} sanefes. ${primera} a la primera.`,
        unesAltres: 'Unes altres 7 sanefes',
        senseCodi: 'Aquesta activitat no dona codi.',
        fotosAviat: 'Aviat: fotos de sanefes reals de Barcelona.',
    };
});
