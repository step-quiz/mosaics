/**
 * ============================================================================
 * PROJECTE: mosaics (Step Quiz, vanilla JS)
 * FITXER: data/fotos.js
 * ROL: Les fotos de sanefes reals (carpeta fotos/). Encara és buit: la v1 de
 *      Classifica fa servir sanefes generades.
 * ARQUITECTURA: Dades (window.MOSAICS_FOTOS; també es carrega amb Node).
 *   Cada foto:
 *     { id, fitxer: 'fotos/<tipus>-<nom>-NN.jpg', tipus: 'sanefa'|'mosaic',
 *       grup: 'p2mg', confirmat: true, lloc: 'Eixample (aprox.)', autor, data: 'AAAA-MM-DD',
 *       llicencia: 'CC BY-NC-SA 4.0', notes }
 *   - Només fotos fetes per l'usuari, per companys o per alumnes que hi donen permís; mai
 *     d'internet. Sense persones, cares ni matrícules.
 *   - lloc: aproximat (un barri), mai una adreça.
 *   - grup: la clau, que fixa i confirma l'usuari amb les eines de Classifica
 *     (confirmat: true). No es dedueix de memòria.
 *   - Cada foto passa per tools/prepara-fotos.py (1600 px, JPEG 80, < 400 KB, sense EXIF).
 *   tests/fotos.test.js ho comprova tot (també que el JPEG no porta EXIF ni GPS).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var dades = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = dades;
    else arrel.MOSAICS_FOTOS = dades;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return [];
});
