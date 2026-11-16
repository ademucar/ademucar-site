/* Gece / gündüz modu.
   <head> içinde, CSS'ten hemen sonra yüklenir: tema sayfa çizilmeden
   uygulanır, böylece gece modunda açılışta aydınlık bir anlık parlama olmaz.
   Varsayılan: gündüz (aydınlık). Seçim tarayıcıda hatırlanır. */
(function () {
    var ANAHTAR = 'ademucar-tema';
    var kok = document.documentElement;
    var RENK = { gunduz: '#f2ede3', gece: '#14161e' };

    function kayitliTema() {
        try { return localStorage.getItem(ANAHTAR); } catch (e) { return null; }
    }

    function uygula(tema) {
        if (tema === 'gece') kok.setAttribute('data-tema', 'gece');
        else kok.removeAttribute('data-tema');
        // Mobil tarayıcı çubuğunun rengi de temaya uysun
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', RENK[tema === 'gece' ? 'gece' : 'gunduz']);
    }

    function simdikiTema() {
        return kok.getAttribute('data-tema') === 'gece' ? 'gece' : 'gunduz';
    }

    uygula(kayitliTema() === 'gece' ? 'gece' : 'gunduz');

    document.addEventListener('DOMContentLoaded', function () {
        var dugme = document.getElementById('temaDugme');
        if (!dugme) return;

        function etiketle() {
            var gece = simdikiTema() === 'gece';
            dugme.innerHTML = gece
                ? '<i class="fas fa-sun" aria-hidden="true"></i>'
                : '<i class="fas fa-moon" aria-hidden="true"></i>';
            var yazi = gece ? 'Aydınlık moda geç' : 'Gece moduna geç';
            dugme.setAttribute('aria-label', yazi);
            dugme.setAttribute('title', yazi);
        }

        etiketle();

        dugme.addEventListener('click', function () {
            var yeni = simdikiTema() === 'gece' ? 'gunduz' : 'gece';
            uygula(yeni);
            try { localStorage.setItem(ANAHTAR, yeni); } catch (e) { /* gizli mod vb. */ }
            etiketle();
            // Canvas kullanan sayfalar (ör. çark) kendini yeniden çizebilsin
            document.dispatchEvent(new Event('temadegisti'));
        });
    });
})();
