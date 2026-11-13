/* ErgoCalc — boneco ilustrativo da página inicial.
   Decorativo e educativo: NÃO analisa a postura nem mede ângulos reais. */
(function () {
    'use strict';
    var palco = document.querySelector('.palco');
    if (!palco) return;
    var svg = palco.querySelector('svg'), HIP = { x: 150, y: 258 };
    var POSES = {
        boa:  { sx: 154, sy: 152, hx: 158, hy: 106, curve: 0,  kx: 268, fx: 272, hand: 292 },
        ruim: { sx: 190, sy: 172, hx: 244, hy: 146, curve: 34, kx: 258, fx: 226, hand: 296 }
    };
    var TEXTO = {
        boa: 'Postura adequada: costas apoiadas, pés no chão e cabeça alinhada.',
        ruim: 'Postura inadequada: costas arredondadas, cabeça à frente e pés sem apoio.'
    };
    var cur = Object.assign({}, POSES.boa), alvo = Object.assign({}, POSES.boa), drag = 0, dragAlvo = 0;
    var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches, rodando = false, visivel = true, ult = 0;
    function $(id) { return svg.querySelector('#' + id); }
    function set(id, o) { var e = $(id); for (var k in o) e.setAttribute(k, o[k].toFixed ? o[k].toFixed(1) : o[k]); }

    function desenhar(t) {
        var idle = reduz ? 0 : Math.sin(t / 900);
        var sx = cur.sx + drag * 0.45, sy = cur.sy + idle * 1.4, hx = cur.hx + drag, hy = cur.hy + idle * 2.2;
        var cx = (HIP.x + sx) / 2 - cur.curve * 1.7, cy = (HIP.y + sy) / 2;
        $('spine').setAttribute('d', 'M' + HIP.x + ' ' + HIP.y + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + sx.toFixed(1) + ' ' + sy.toFixed(1));
        var ex = sx + 22, ey = sy + 62;
        $('arm').setAttribute('points', sx.toFixed(1) + ',' + sy.toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) + ' ' + cur.hand.toFixed(1) + ',230');
        $('thigh').setAttribute('points', HIP.x + ',' + HIP.y + ' ' + cur.kx.toFixed(1) + ',' + HIP.y + ' ' + cur.fx.toFixed(1) + ',344 ' + (cur.fx + 24).toFixed(1) + ',344');
        set('neck', { x1: sx, y1: sy, x2: hx, y2: hy });
        set('head', { cx: hx, cy: hy });
        var mx = 0.25 * HIP.x + 0.5 * cx + 0.25 * sx, my = 0.25 * HIP.y + 0.5 * cy + 0.25 * sy;
        ['mk-costas', 'pl-costas'].forEach(function (id) { set(id, { cx: mx, cy: my }); });
        ['mk-cabeca', 'pl-cabeca'].forEach(function (id) { set(id, { cx: hx, cy: hy - 34 }); });
        ['mk-pes', 'pl-pes'].forEach(function (id) { set(id, { cx: cur.fx + 12, cy: 344 }); });
    }
    function quadro(agora) {
        if (!rodando) return;
        var dt = Math.min((agora - ult) / 1000, 0.05); ult = agora;
        var k = reduz ? 1 : 1 - Math.exp(-dt * 7);
        for (var p in alvo) cur[p] += (alvo[p] - cur[p]) * k;
        drag += (dragAlvo - drag) * k;
        desenhar(agora);
        requestAnimationFrame(quadro);
    }
    function ligar() { if (!rodando && visivel && !document.hidden && !reduz) { rodando = true; ult = performance.now(); requestAnimationFrame(quadro); } }
    function desligar() { rodando = false; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; visivel ? ligar() : desligar(); }).observe(palco);
    document.addEventListener('visibilitychange', function () { document.hidden ? desligar() : ligar(); });

    /* alternar postura */
    var botoes = palco.querySelectorAll('[data-postura]'), estado = palco.querySelector('#palco-estado');
    function escolher(nome) {
        palco.setAttribute('data-postura', nome);
        botoes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-postura') === nome)); });
        estado.textContent = TEXTO[nome];
        alvo = Object.assign({}, POSES[nome]);
        if (reduz) { cur = Object.assign({}, alvo); desenhar(0); } else ligar();
    }
    botoes.forEach(function (b) { b.addEventListener('click', function () { escolher(b.getAttribute('data-postura')); }); });

    /* arrastar com mouse (botão esquerdo) ou toque */
    var x0 = 0, ativo = false;
    svg.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ativo = true; x0 = e.clientX; palco.classList.add('arrastando');
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    });
    svg.addEventListener('pointermove', function (e) {
        if (!ativo) return;
        var esc = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width;
        dragAlvo = Math.max(-40, Math.min(40, (e.clientX - x0) * esc));
        if (reduz) { drag = dragAlvo; desenhar(0); } else ligar();
    });
    function soltar() { ativo = false; dragAlvo = 0; palco.classList.remove('arrastando'); if (reduz) { drag = 0; desenhar(0); } else ligar(); }
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('dragstart', function (e) { e.preventDefault(); });

    desenhar(0); ligar();
})();
