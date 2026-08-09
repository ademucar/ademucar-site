/* Hafif "takımyıldızı" arka plan animasyonu.
   Süzülen noktalar + yakınlaştıkça beliren bağlantı çizgileri.
   Sıfır dış bağımlılık, mobil dostu, hareket azaltma desteği. */
(function () {
    // Hareket azaltmayı tercih edenlerde animasyonu durdur,
    // ama sabit (hareketsiz) takımyıldızını yine de göster.
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'z-index:0;pointer-events:none;';
    var ctx = canvas.getContext('2d');

    var particles = [];
    var width, height, dpr;

    // Zümrüt-yeşil ton (aurora ile uyumlu)
    var COLOR = '52, 211, 153';
    var LINK_DIST = 160;   // Bağlantı çizgisi mesafesi (px)
    var SPEED = 0.25;      // Hareket hızı

    function particleCount() {
        // Ekran alanına göre yoğunluk (mobilde daha az → performans)
        var cap = width < 768 ? 40 : 90;
        return Math.min(cap, Math.floor((width * height) / 16000));
    }

    function resize() {
        // Yüksek piksel oranlı telefonlarda canvas'ı küçük tutup takılmayı önle
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles();
        // canvas.width atamak bitmap'i temizler; hareketsiz modda
        // döngü olmadığı için yeniden çizmemiz gerekir.
        if (reduceMotion) draw();
    }

    function initParticles() {
        particles = [];
        var count = particleCount();
        for (var i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * SPEED,
                vy: (Math.random() - 0.5) * SPEED,
                r: Math.random() * 4.5 + 3.0
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Hareket azaltma kapalıysa noktaları hareket ettir
            if (!reduceMotion) {
                p.x += p.vx;
                p.y += p.vy;
                // Kenarlardan yumuşak sekme
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
            }

            // Nokta
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + COLOR + ',0.7)';
            ctx.fill();

            // Yakın noktalar arası bağlantı çizgileri
            for (var j = i + 1; j < particles.length; j++) {
                var q = particles[j];
                var dx = p.x - q.x;
                var dy = p.y - q.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle =
                        'rgba(' + COLOR + ',' + (0.22 * (1 - dist / LINK_DIST)) + ')';
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                }
            }
        }
        // Hareket azaltma açıksa tek kare çiz, döngüye girme
        if (!reduceMotion) requestAnimationFrame(draw);
    }

    function start() {
        document.body.appendChild(canvas);
        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(draw);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
