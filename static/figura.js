/* ErgoCalc — boneco ilustrativo guiado pela rolagem.
   Decorativo e educativo: NÃO analisa a postura nem mede ângulos reais. */
(function () {
    'use strict';
    var palco = document.querySelector('.palco');
    if (!palco) return;
    var svg = palco.querySelector('svg'), HIP = { x: 150, y: 258 };
    var POSES = {
        boa:  { sx: 154, sy: 152, hx: 158, hy: 106, curve: 0,  kx: 268, fx: 272, hand: 306 },
        ruim: { sx: 190, sy: 172, hx: 244, hy: 146, curve: 34, kx: 258, fx: 226, hand: 308 }
    };
    var cur = Object.assign({}, POSES.boa), alvo = Object.assign({}, POSES.boa), drag = 0, dragAlvo = 0;
    var foco = '', anel = { x: 158, y: 106, o: 0 }, anelAlvo = { x: 158, y: 106, o: 0 }, pos = {};
    var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches, rodando = false, visivel = true, ult = 0;
    function $(id) { return svg.querySelector('#' + id); }
    function f1(n) { return n.toFixed(1); }

    function desenhar(t) {
        var idle = reduz ? 0 : Math.sin(t / 900);
        var sx = cur.sx + drag * 0.45, sy = cur.sy + idle * 1.4, hx = cur.hx + drag, hy = cur.hy + idle * 2.2;
        var cx = (HIP.x + sx) / 2 - cur.curve * 1.7, cy = (HIP.y + sy) / 2, ex = sx + 22, ey = sy + 62;
        $('spine').setAttribute('d', 'M150 258 Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(sx) + ' ' + f1(sy));
        $('arm').setAttribute('points', f1(sx) + ',' + f1(sy) + ' ' + f1(ex) + ',' + f1(ey) + ' ' + f1(cur.hand) + ',226');
        $('thigh').setAttribute('points', '150,258 ' + f1(cur.kx) + ',258 ' + f1(cur.fx) + ',344 ' + f1(cur.fx + 24) + ',344');
        var n = $('neck'); n.setAttribute('x1', f1(sx)); n.setAttribute('y1', f1(sy)); n.setAttribute('x2', f1(hx)); n.setAttribute('y2', f1(hy));
        var h = $('head'); h.setAttribute('cx', f1(hx)); h.setAttribute('cy', f1(hy));
        pos = { cabeca: [hx, hy], coluna: [0.25 * 150 + 0.5 * cx + 0.25 * sx, 0.25 * 258 + 0.5 * cy + 0.25 * sy], ombros: [sx, sy], cotovelos: [ex, ey],
                quadril: [150, 258], joelhos: [cur.kx, 258], pes: [cur.fx + 12, 344], tela: [372, 150] };
        if (foco && pos[foco]) { anelAlvo.x = pos[foco][0]; anelAlvo.y = pos[foco][1]; anelAlvo.o = 1; } else anelAlvo.o = 0;
    }
    function aplicarAnel(k) {
        anel.x += (anelAlvo.x - anel.x) * k; anel.y += (anelAlvo.y - anel.y) * k; anel.o += (anelAlvo.o - anel.o) * k;
        ['foco', 'ponto'].forEach(function (id) { var e = $(id); e.setAttribute('cx', f1(anel.x)); e.setAttribute('cy', f1(anel.y)); e.setAttribute('opacity', anel.o.toFixed(2)); });
    }
    function quadro(agora) {
        if (!rodando) return;
        var dt = Math.min((agora - ult) / 1000, 0.05); ult = agora;
        var k = reduz ? 1 : 1 - Math.exp(-dt * 7);
        for (var p in alvo) cur[p] += (alvo[p] - cur[p]) * k;
        drag += (dragAlvo - drag) * k;
        desenhar(agora); aplicarAnel(k);
        requestAnimationFrame(quadro);
    }
    function ligar() { if (!rodando && visivel && !document.hidden) { rodando = true; ult = performance.now(); requestAnimationFrame(quadro); } }
    function parar() { rodando = false; }
    function instantaneo() { cur = Object.assign({}, alvo); drag = dragAlvo; desenhar(0); anel.x = anelAlvo.x; anel.y = anelAlvo.y; anel.o = anelAlvo.o; aplicarAnel(1); }
    function atualizar() { if (reduz) { instantaneo(); } else ligar(); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; visivel ? ligar() : parar(); }).observe(palco);
    document.addEventListener('visibilitychange', function () { document.hidden ? parar() : ligar(); });

    /* postura e texto de apoio */
    var botoes = palco.querySelectorAll('[data-postura]'), estado = document.getElementById('palco-estado');
    function pose(nome) {
        palco.setAttribute('data-postura', nome);
        botoes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-postura') === nome)); });
        alvo = Object.assign({}, POSES[nome]); atualizar();
    }
    botoes.forEach(function (b) { b.addEventListener('click', function () { pose(b.getAttribute('data-postura')); }); });

    /* rolagem conduz a narrativa: cada trecho define postura e região destacada */
    var passos = document.querySelectorAll('[data-pose]:not(.palco):not(button)'), ativoEl = null;
    function ativar(el) {
        if (el === ativoEl) return;
        if (ativoEl) ativoEl.classList.remove('ativo');
        ativoEl = el; el.classList.add('ativo');
        foco = el.getAttribute('data-foco') || ''; pose(el.getAttribute('data-pose'));
        estado.textContent = el.getAttribute('data-rotulo') || '';
        if (foco && !reduz && pos[foco]) { /* anel desliza até a região */ }
        atualizar();
    }
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) ativar(e.target); }); },
            { rootMargin: '-42% 0px -42% 0px' });
        passos.forEach(function (p) { io.observe(p); });
    }
    passos.forEach(function (p) { p.addEventListener('focus', function () { ativar(p); }); p.addEventListener('click', function () { ativar(p); }); });

    /* arrastar com mouse (botão esquerdo) ou toque */
    var x0 = 0, ativo = false;
    svg.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ativo = true; x0 = e.clientX; palco.classList.add('arrastando');
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    });
    svg.addEventListener('pointermove', function (e) {
        if (!ativo) return;
        dragAlvo = Math.max(-40, Math.min(40, (e.clientX - x0) * svg.viewBox.baseVal.width / svg.getBoundingClientRect().width));
        atualizar();
    });
    function soltar() { ativo = false; dragAlvo = 0; palco.classList.remove('arrastando'); atualizar(); }
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('dragstart', function (e) { e.preventDefault(); });

    desenhar(0); instantaneo(); ligar();
})();
