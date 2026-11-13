/* ErgoCalc — revelar ao rolar e feedback de envio (JavaScript nativo) */
(function () {
    'use strict';
    document.documentElement.classList.add('js');
    function init() {
        var alvos = document.querySelectorAll('.card, .passo-card, .beneficio, .secao-titulo, .atalho, .chamada-final, .hero-texto, .palco');
        if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
            alvos.forEach(function (e) { e.classList.add('reveal', 'visivel'); });
        } else {
            var io = new IntersectionObserver(function (es) {
                es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } });
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            alvos.forEach(function (e, i) {
                e.classList.add('reveal'); e.style.setProperty('--atraso', (i % 4) * 70 + 'ms'); io.observe(e);
            });
        }
        var f = document.querySelector('.form-calculadora');
        if (f) f.addEventListener('submit', function () {
            var b = f.querySelector('button[type=submit]');
            if (b && f.checkValidity()) { b.setAttribute('aria-busy', 'true'); b.firstChild.textContent = 'Calculando… '; }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
