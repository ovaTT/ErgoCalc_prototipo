/* ErgoCalc 2.0 – alertas posturais, pausas ativas, checklist e integração.
   Estado salvo no localStorage do navegador (sem banco de dados). */
(function () {
    'use strict';
    if (window.__ergocalc) return;          // garante um único motor por página
    window.__ergocalc = true;

    var MIN = 60000;
    var K = { cfg: 'ergocalc.config', prox: 'ergocalc.proximo', fim: 'ergocalc.pausaFim',
              cadeira: 'ergocalc.cadeira', aval: 'ergocalc.avaliacao' };
    var PADRAO = { alertas: { ativo: false, intervalo: 30 },
                   pausas: { ativo: false, intervalo: 60, duracao: 5 } };

    /* ---------- armazenamento ---------- */
    function ler(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
    function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function cfg() {
        var c = ler(K.cfg, {});
        return { alertas: Object.assign({}, PADRAO.alertas, c.alertas),
                 pausas: Object.assign({}, PADRAO.pausas, c.pausas) };
    }
    function $(s) { return document.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
    function link(fim, padrao) { var a = $('a[href$="/' + fim + '"]'); return a ? a.getAttribute('href') : padrao; }

    /* ---------- mensagens posturais (sem alegar detecção) ---------- */
    var MSG = [
        ['Costas', 'Encoste as costas no encosto da cadeira e relaxe a região lombar.'],
        ['Costas', 'Você está sentado bem ao fundo da cadeira? Se não, ajuste a posição.'],
        ['Pés', 'Apoie os dois pés no chão ou em um apoio, com os joelhos confortáveis.'],
        ['Pés', 'Confira se seus pés estão apoiados e se as pernas não estão cruzadas há muito tempo.'],
        ['Ombros', 'Solte os ombros: leve-os para baixo e um pouco para trás, sem forçar.'],
        ['Ombros', 'Seus ombros estão subindo em direção às orelhas? Respire e relaxe.'],
        ['Cabeça', 'Alinhe a cabeça com o tronco e deixe a tela perto da altura dos olhos, se possível.'],
        ['Cabeça', 'Evite projetar a cabeça para a frente. Aproxime o material em vez de se inclinar.'],
        ['Posição', 'Que tal mudar de posição? Ajuste o corpo ou levante por um instante.'],
        ['Posição', 'Mudar de posição ajuda no conforto. Alongue-se um pouco, sem forçar.']
    ];
    var ultima = -1;
    function sortear() {
        var i; do { i = Math.floor(Math.random() * MSG.length); } while (i === ultima && MSG.length > 1);
        ultima = i; return MSG[i];
    }

    /* ---------- notificações discretas, uma por vez (fila) ---------- */
    var area, fila = [], atual = null, tToast = null;
    function garantirArea() {
        if (area) return area;
        area = document.createElement('div');
        area.className = 'toast-area';
        area.setAttribute('aria-live', 'polite');
        document.body.appendChild(area);
        return area;
    }
    function toast(o) { fila.push(o); if (!atual) mostrar(); }
    function mostrar() {
        atual = fila.shift();
        if (!atual) return;
        var el = document.createElement('div');
        el.className = 'toast';
        var t = document.createElement('strong'); t.textContent = atual.titulo;
        var p = document.createElement('p'); p.textContent = atual.texto;
        var ac = document.createElement('div'); ac.className = 'toast-acoes';
        (atual.acoes || []).forEach(function (a) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'botao' + (a.primaria ? '' : ' botao-secundario');
            b.textContent = a.rotulo;
            b.addEventListener('click', function () { fechar(); if (a.fn) a.fn(); });
            ac.appendChild(b);
        });
        el.appendChild(t); el.appendChild(p); el.appendChild(ac);
        if (atual.nota) { var n = document.createElement('small'); n.textContent = atual.nota; el.appendChild(n); }
        garantirArea().appendChild(el);
        atual.el = el;
        tToast = setTimeout(fechar, atual.tempo || 20000);
    }
    function fechar() {
        clearTimeout(tToast);
        if (atual && atual.el) atual.el.remove();
        atual = null;
        setTimeout(mostrar, 400);
    }

    /* ---------- agendamento (timestamps persistidos: sem timers duplicados) ---------- */
    function agendar(tipo, min) {
        var p = ler(K.prox, {}); p[tipo] = Date.now() + min * MIN; gravar(K.prox, p);
    }
    function limpar(tipo) { var p = ler(K.prox, {}); delete p[tipo]; gravar(K.prox, p); }
    function adiar(tipo) { agendar(tipo, 5); atualizar(); }

    function disparar(tipo, manual) {
        if (manual && fila.length >= 2) return;
        if (tipo === 'alerta') {
            var m = sortear();
            toast({ titulo: 'Lembrete postural · ' + m[0], texto: m[1],
                    nota: manual ? 'Lembrete manual.' : 'Lembrete automático: o ErgoCalc não detecta sua postura.',
                    acoes: [{ rotulo: 'Dispensar', primaria: true },
                            { rotulo: 'Adiar 5 min', fn: function () { if (!manual) adiar('alerta'); } }] });
        } else {
            toast({ titulo: 'Hora de uma pausa ativa', texto: 'Levante, movimente-se com leveza e descanse a vista por alguns minutos.',
                    tempo: 30000,
                    acoes: [{ rotulo: 'Iniciar pausa', primaria: true, fn: function () { location.href = link('pausas', '/pausas') + '?iniciar=1'; } },
                            { rotulo: 'Adiar 5 min', fn: function () { adiar('pausa'); } },
                            { rotulo: 'Dispensar' }] });
        }
    }

    /* ---------- pausa em andamento ---------- */
    function iniciarPausa() {
        var c = cfg(); gravar(K.fim, Date.now() + c.pausas.duracao * MIN); atualizar();
    }
    function finalizarPausa(concluida) {
        gravar(K.fim, 0);
        var c = cfg();
        if (c.alertas.ativo) agendar('alerta', c.alertas.intervalo);
        if (c.pausas.ativo) agendar('pausa', c.pausas.intervalo);
        if (concluida) toast({ titulo: 'Pausa concluída', texto: 'Bom trabalho! Volte aos estudos com a postura confortável.', tempo: 8000,
                               acoes: [{ rotulo: 'Ok', primaria: true }] });
        atualizar();
    }

    /* ---------- motor: um único intervalo de 1 s ---------- */
    function tick() {
        var agora = Date.now(), fim = ler(K.fim, 0);
        if (fim) { if (agora >= fim) finalizarPausa(true); atualizar(); return; }   // em pausa: sem alertas
        var c = cfg(), p = ler(K.prox, {});
        [['alerta', c.alertas], ['pausa', c.pausas]].forEach(function (par) {
            var t = par[0], conf = par[1];
            if (!conf.ativo) { if (p[t]) limpar(t); return; }
            if (!p[t]) { agendar(t, conf.intervalo); return; }
            if (agora >= p[t]) {
                var orig = p[t], atraso = agora - orig;
                if (ler(K.prox, {})[t] !== orig) return;        // outra aba já tratou
                agendar(t, conf.intervalo);                      // reagenda antes de disparar
                if (atraso < 2 * MIN) disparar(t, false);        // não dispara alerta "velho"
            }
        });
        atualizar();
    }

    function fmt(ms) {
        var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60), r = s % 60;
        return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }
    function atualizar() {
        var c = cfg(), p = ler(K.prox, {}), fim = ler(K.fim, 0), agora = Date.now();
        var a = $('#alertas-contagem'), b = $('#pausas-contagem');
        if (a) a.textContent = fim ? 'Alertas em silêncio durante a pausa' :
            (c.alertas.ativo && p.alerta ? 'Próximo lembrete em ' + fmt(p.alerta - agora) : 'Alertas desativados');
        if (b) b.textContent = fim ? 'Pausa em andamento' :
            (c.pausas.ativo && p.pausa ? 'Próximo aviso de pausa em ' + fmt(p.pausa - agora) : 'Avisos de pausa desativados');
        var ini = $('#pausa-inicio'), and = $('#pausa-andamento');
        if (ini && and) { ini.hidden = !!fim; and.hidden = !fim; if (fim) { $('#pausa-tempo').textContent = fmt(fim - agora); var an = $('#pausa-anel'); if (an) an.style.strokeDashoffset = String(327 * (1 - Math.max(0, Math.min(1, (fim - agora) / (c.pausas.duracao * MIN))))); } }
        resumo(c);
    }

    /* ---------- integração: resumo das ferramentas ---------- */
    function resumo(c) {
        var cad = ler(K.cadeira, null), av = ler(K.aval, null);
        $$('[data-integra="cadeira"]').forEach(function (e) {
            e.textContent = cad ? 'último cálculo: ' + cad.texto : 'você ainda não fez o cálculo da cadeira.';
        });
        $$('[data-integra="avaliacao"]').forEach(function (e) {
            e.textContent = av ? (av.pontos === 0 ? 'último checklist sem pontos de atenção.' :
                'último checklist com ' + av.pontos + ' ponto(s) de atenção.') : 'você ainda não respondeu o checklist.';
        });
        $$('[data-integra="pausas"]').forEach(function (e) {
            e.textContent = c.pausas.ativo ? 'ativas, a cada ' + c.pausas.intervalo + ' min.' : 'desativadas.';
        });
    }

    /* ---------- controles das páginas de configuração ---------- */
    function ligarControles() {
        var c = cfg();
        $$('[data-cfg-ativo]').forEach(function (el) {
            var g = el.getAttribute('data-cfg-ativo'); el.checked = c[g].ativo;
            el.addEventListener('change', function () {
                var n = cfg(); n[g].ativo = el.checked; gravar(K.cfg, n);
                var t = g === 'alertas' ? 'alerta' : 'pausa';
                if (el.checked) agendar(t, n[g].intervalo); else limpar(t);
                atualizar();
            });
        });
        $$('[data-cfg-intervalo]').forEach(function (el) {
            var g = el.getAttribute('data-cfg-intervalo'); el.checked = Number(el.value) === c[g].intervalo;
            el.addEventListener('change', function () {
                var n = cfg(); n[g].intervalo = Number(el.value); gravar(K.cfg, n);
                if (n[g].ativo) agendar(g === 'alertas' ? 'alerta' : 'pausa', n[g].intervalo);
                atualizar();
            });
        });
        $$('[data-cfg-duracao]').forEach(function (el) {
            el.checked = Number(el.value) === c.pausas.duracao;
            el.addEventListener('change', function () {
                var n = cfg(); n.pausas.duracao = Number(el.value); gravar(K.cfg, n);
            });
        });
        $$('[data-adiar]').forEach(function (el) {
            el.addEventListener('click', function () {
                var t = el.getAttribute('data-adiar'), n = cfg();
                if ((t === 'alerta' ? n.alertas : n.pausas).ativo) adiar(t);
            });
        });
        var ag = $('#alertas-agora'); if (ag) ag.addEventListener('click', function () { disparar('alerta', true); });
        var pi = $('#pausa-iniciar'); if (pi) pi.addEventListener('click', iniciarPausa);
        var pf = $('#pausa-finalizar'); if (pf) pf.addEventListener('click', function () { finalizarPausa(false); });
        if (pi && /[?&]iniciar=1/.test(location.search)) {
            history.replaceState(null, '', location.pathname);
            if (!ler(K.fim, 0)) iniciarPausa();
        }
    }

    /* ---------- calculadora: guarda o resultado para as outras ferramentas ---------- */
    function guardarCadeira() {
        var av = $('.resultado .avaliacao'); if (!av) return;
        gravar(K.cadeira, { texto: av.textContent.replace(/\s+/g, ' ').trim(), data: Date.now() });
    }

    /* ---------- checklist ---------- */
    var DICAS = {
        pes: 'Procure manter os dois pés apoiados no chão ou em um apoio firme, com os joelhos em um ângulo confortável. Se a cadeira estiver alta, um apoio para os pés pode ajudar.',
        costas: 'Encoste a região lombar no encosto e evite sentar na ponta da cadeira. Alternar de posição de vez em quando também ajuda.',
        cabeca: 'Deixe a tela perto da altura dos olhos e aproxime o material em vez de inclinar a cabeça. Ao ler no caderno, um apoio inclinado pode ajudar.',
        tempo: 'Evite longos períodos sem se mexer: mude de posição com frequência e use os lembretes para isso.',
        pausas: 'Faça pausas curtas para levantar, caminhar e alongar de forma leve. As pausas ativas do ErgoCalc podem ajudar.'
    };
    function avaliar(form) {
        var r = {}, ok = true;
        Object.keys(DICAS).forEach(function (k) {
            var s = form.querySelector('input[name="' + k + '"]:checked');
            if (!s) ok = false; else r[k] = Number(s.value);
        });
        var erro = $('#avaliacao-erro'); erro.hidden = ok;
        if (!ok) return;
        var pts = Object.keys(r).filter(function (k) { return r[k] > 0; });
        var sug = r.tempo === 2 ? 30 : (r.tempo === 1 ? 45 : 60);
        gravar(K.aval, { pontos: pts.length, data: Date.now() });

        var box = $('#avaliacao-resultado');
        var h = '<span class="card-etapa">RESULTADO</span><h2>Suas orientações</h2>';
        h += pts.length === 0
            ? '<p>Seus hábitos parecem favoráveis. Continue variando de posição e fazendo pausas.</p>'
            : '<p>Pontos de atenção encontrados: <strong>' + pts.length + '</strong> de 5.</p><ul class="lista-dicas">' +
              pts.map(function (k) { return '<li>' + DICAS[k] + '</li>'; }).join('') + '</ul>';
        h += '<p class="integra-nota" data-integra="cadeira"></p>';
        h += '<div class="acoes-resultado"><button type="button" class="botao" id="aplicar-sugestao">Aplicar lembretes sugeridos</button>' +
             '<a class="botao botao-secundario" href="' + link('guia', '/guia') + '">Ler o guia</a></div>' +
             '<p class="aviso-ergonomico">Sugestão: alertas a cada ' + sug + ' min e avisos de pausa a cada ' + Math.max(sug, 30) +
             ' min. Orientações educativas, sem caráter de diagnóstico médico.</p>';
        box.innerHTML = h;
        $('#aplicar-sugestao').addEventListener('click', function () {
            var n = cfg(); n.alertas.ativo = true; n.alertas.intervalo = sug;
            n.pausas.ativo = true; n.pausas.intervalo = Math.max(sug, 30); gravar(K.cfg, n);
            agendar('alerta', n.alertas.intervalo); agendar('pausa', n.pausas.intervalo);
            this.textContent = 'Lembretes ativados ✓'; this.disabled = true; atualizar();
        });
        atualizar();
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ---------- início ---------- */
    function iniciar() {
        guardarCadeira();
        ligarControles();
        var f = $('#form-avaliacao');
        if (f) {
            f.addEventListener('submit', function (e) { e.preventDefault(); avaliar(f); });
            f.addEventListener('change', function () {
                var n = f.querySelectorAll('.pergunta input:checked').length;
                $('#aval-barra').style.width = (n * 20) + '%'; $('#aval-contador').textContent = n + ' de 5 respondidas';
                $('#aval-progresso').setAttribute('aria-valuenow', n);
            });
        }
        window.addEventListener('storage', atualizar);
        tick();
        setInterval(tick, 1000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
