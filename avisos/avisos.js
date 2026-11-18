/* Avisos (C11, tarefa 37): o mesmo conteúdo no sino do topo e no quadro do Início.
   Cada aviso leva ao trecho certo da tela pelo parâmetro "ir" (D-102).
   "Hoje" é o de dados.js (12/11/2026), nunca o relógio do computador. Nada é calculado aqui além de
   contar itens e dias entre duas datas lidas como texto. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  var CLIENTE_RH = "aurora"; /* o mesmo acesso fictício da visão Empresa/RH (D-062) */

  function diaNum(iso) { var p = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return p ? Date.UTC(+p[1], +p[2] - 1, +p[3]) / 864e5 : null; }
  function emDias(iso) {
    var n = diaNum(iso) - diaNum(A().D.hoje);
    return n === 0 ? "hoje" : n === 1 ? "amanhã" : "em " + n + " dias";
  }
  function quando(iso) { return F.data(iso) + " (" + F.diaDaSemana(iso) + "), " + emDias(iso); }

  /* próximas emissões depois de hoje, agrupadas por dia: [{dia, clientes:[id]}] */
  function proximosLotes() {
    var hoje = A().D.hoje, porDia = {}, visto = {};
    (A().D.calendario.datas || []).forEach(function (x) {
      if (x.tipo !== "emissao" || x.emitida || x.dia <= hoje || visto[x.cliente_id]) return;
      visto[x.cliente_id] = true; /* só a próxima de cada cliente */
      (porDia[x.dia] = porDia[x.dia] || []).push(x.cliente_id);
    });
    return Object.keys(porDia).sort().map(function (d) { return { dia: d, clientes: porDia[d] }; });
  }

  function medipreco() {
    var D = A().D, I = A().I, lista = [];
    proximosLotes().forEach(function (l) {
      var pre = l.clientes.every(function (id) { return I.cliente[id].pagamento === "pre"; });
      lista.push({ texto: "Lote " + (pre ? "pré-pago" : "pós-pago") + ": " + l.clientes.length + (l.clientes.length === 1 ? " cliente" : " clientes"),
        detalhe: "Emissão em " + quando(l.dia) + ".", leva: "notas-a-emitir?ir=lote-" + l.dia });
    });
    var pend = 0;
    D.alertas.forEach(function (a) { if (a.tipo === "!") pend += a.casos.length; });
    if (pend) lista.push({ texto: pend + (pend === 1 ? " caso pendente (!)" : " casos pendentes (!)"), detalhe: "Pedem um olhar humano na Conferência.", leva: "conferencia?ir=os-alertas" });
    var ac = 0, destinoEmitido = 0;
    Object.keys(D.onda_2 || {}).forEach(function (id) {
      var p = D.onda_2[id].previa;
      if (p && p.calculada) p.acertos.forEach(function (a) { ac++; if (a.destino_ja_emitido) destinoEmitido++; });
    });
    if (ac) lista.push({ texto: ac + (ac === 1 ? " acerto entra" : " acertos entram") + " nas próximas notas",
      detalhe: "Créditos e débitos de outubro" + (destinoEmitido ? "; " + destinoEmitido + " com a nota de destino já emitida" : "") + ".", leva: "conferencia?ir=creditos-e-debitos" });
    return lista;
  }

  function empresa() {
    var D = A().D, I = A().I, c = I.cliente[CLIENTE_RH], lista = [];
    if (!c) return lista;
    var texto = window.Explica && window.Explica.avisoAoCliente(c, I.notasDoCliente[c.id]);
    if (texto) lista.push({ texto: "Aviso sobre a sua última nota", detalhe: "Movimentações que chegaram depois da contagem.", leva: "rh/inicio?ir=mensagem" });
    var p = (D.onda_2[c.id] || {}).previa;
    if (p && p.calculada) p.acertos.forEach(function (a) {
      lista.push({ texto: (a.valor < 0 ? "Crédito" : "Débito") + " de " + F.moeda(Math.abs(a.valor)) + " na próxima nota",
        detalhe: "Acerto de " + F.competencia(a.competencia_de_origem) + ", na nota de " + F.competencia(p.competencia) + ".", leva: "rh/notas" });
    });
    var corte = (D.calendario.datas || []).filter(function (x) { return x.cliente_id === c.id && x.tipo === "corte" && x.dia > D.hoje; })[0];
    if (corte) lista.push({ texto: "Dia de corte: " + quando(corte.dia),
      detalhe: "O que chegar depois entra como acerto na nota seguinte.", leva: "rh/vidas" });
    return lista;
  }

  function lista(visao) { return visao === "rh" ? empresa() : medipreco(); }

  function html(itens) {
    if (!itens.length) return A().vazio("Nada pendente.");
    return '<ul class="lista-avisos">' + itens.map(function (a) {
      return '<li><a href="#/' + a.leva + '"><strong>' + A().esc(a.texto) + '</strong><span class="pequeno suave">' + A().esc(a.detalhe) + "</span></a></li>";
    }).join("") + "</ul>";
  }

  window.Avisos = {
    lista: lista,
    html: function (visao) { return html(lista(visao)); },
    proximosLotes: proximosLotes,
    atualizarSino: function (visao) {
      var itens = lista(visao);
      var painel = document.getElementById("painel-sino"), cont = document.querySelector("[data-sino] .contador");
      if (painel) painel.innerHTML = '<p class="rotulo">Avisos · hoje, ' + F.data(A().D.hoje) + "</p>" + html(itens);
      if (cont) { cont.textContent = itens.length; cont.hidden = !itens.length; }
      var b = document.querySelector("[data-sino]");
      if (b) b.setAttribute("aria-label", "Avisos: " + itens.length);
    }
  };
})();
