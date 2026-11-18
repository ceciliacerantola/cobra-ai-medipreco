/* Tela M6 — Conferência, com dado de verdade (lote E, tarefa 27).
   Créditos e débitos (nota por nota, por cliente e no geral), os oito alertas com os casos da base,
   a prova das 28 linhas contra a base e os pontos de atenção. Tudo vem de conferencia/ e calculo/. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  function X() { return window.Explica; }

  function financeiro() {
    var D = A().D, I = A().I, esc = A().esc, g = D.financeiro.geral;
    var cartoes = '<div class="grade-3">' +
      '<div class="cartao"><p class="rotulo">A devolver aos clientes (créditos)</p><p class="valor-grande">' + F.moeda(g.creditos) + '</p><p class="pequeno suave">' + g.notas_com_credito + " notas</p></div>" +
      '<div class="cartao"><p class="rotulo">A cobrar dos clientes (débitos)</p><p class="valor-grande">' + F.moeda(g.debitos) + '</p><p class="pequeno suave">' + g.notas_com_debito + " notas</p></div>" +
      '<div class="cartao"><p class="rotulo">Saldo geral</p><p class="valor-grande">' + F.moeda(Math.abs(g.saldo)) + '</p><p class="pequeno suave">' +
        (g.saldo < 0 ? "a favor dos clientes: as notas cobraram mais do que os contratos pedem" : g.saldo > 0 ? "a favor da Medipreço" : "sem diferença") + "</p></div></div>" +
      '<div class="explica-financeiro">' + A().alerta("i", "o que é crédito e débito", X().creditoDebito()) + "</div>";

    var porCliente = D.clientes.map(function (c) {
      var x = D.financeiro.por_cliente[c.id];
      if (!x) return "";
      return '<tr><td><a href="' + A().link("clientes/" + c.id) + '">' + esc(c.nome) + '</a></td><td class="num">' + F.moeda(x.creditos) + '</td><td class="num">' + F.moeda(x.debitos) +
        '</td><td class="num destaque-linha">' + (x.saldo === 0 ? "sem diferença" : (x.saldo < 0 ? "devolver " : "cobrar ") + F.moeda(Math.abs(x.saldo))) + "</td></tr>";
    }).join("");

    var porNota = D.financeiro.por_nota.map(function (l) {
      var c = I.cliente[l.cliente_id];
      return "<tr><td>" + F.competencia(l.competencia) + '</td><td><a href="' + A().link("notas/" + l.nota) + '">' + esc(l.nota) + "</a></td><td>" + esc(c ? c.nome : l.cliente_id) +
        (c && c.empresas.length > 1 ? '<br><span class="pequeno suave">' + esc(l.tomador) + "</span>" : "") +
        "</td><td>" + (l.tipo === "credito" ? "Crédito" : l.tipo === "debito" ? "Débito" : "Sem diferença") + '</td><td class="num">' + F.diferenca(l.diferenca) + "</td></tr>";
    }).join("");

    return cartoes +
      '<h3 class="sub">Por cliente</h3><div class="rolagem"><table><thead><tr><th>Cliente</th><th class="num">Créditos</th><th class="num">Débitos</th><th class="num">Saldo</th></tr></thead><tbody>' +
      porCliente + '</tbody><tfoot><tr><td>Total</td><td class="num">' + F.moeda(g.creditos) + '</td><td class="num">' + F.moeda(g.debitos) + '</td><td class="num destaque-linha">' +
      (g.saldo < 0 ? "devolver " : "cobrar ") + F.moeda(Math.abs(g.saldo)) + "</td></tr></tfoot></table></div>" +
      '<details class="mais"><summary class="botao">Ver nota por nota (' + D.financeiro.por_nota.length + ' notas calculadas)</summary>' +
      '<div class="rolagem"><table><thead><tr><th>Competência</th><th>Nota</th><th>Cliente</th><th>Tipo</th><th class="num">Diferença</th></tr></thead><tbody>' + porNota + "</tbody></table></div></details>" +
      (D.notas.some(function (n) { return !n.calculada; }) ? '<p class="pequeno suave nota-de-rodape">Fora da conta: ' + D.notas.filter(function (n) { return !n.calculada; }).map(function (n) {
        return esc(n.nota) + " (aguardando " + F.data((n.motivo || {}).dia_necessario) + ")";
      }).join(", ") + ".</p>" : "");
  }

  function alertas(params) {
    var D = A().D, esc = A().esc;
    return '<div class="grade grade-alertas">' + D.alertas.map(function (a) {
      var aberto = params.alerta === a.id;
      var casos = a.casos.map(function (c) {
        var rotulo = esc(c.cliente) + " · " + F.competencia(c.competencia) + (c.nota ? " · " + esc(c.nota) : "");
        return "<div>" + A().alerta(a.tipo, rotulo, X().caso(a, c)) + "</div>";
      }).join("");
      return '<div class="cartao cartao-alerta' + (aberto ? " em-foco" : "") + '" id="alerta-' + a.id + '">' +
        "<p>" + A().alerta(a.tipo, a.tipo === "!" ? "pendente" : "informação") + ' <span class="pequeno suave">' + a.id + "</span></p>" +
        "<h3>" + esc(a.nome) + "</h3>" +
        '<p class="suave pequeno">' + esc(a.procura) + "</p>" +
        '<p class="onde"><strong>' + (a.casos.length ? a.casos.length + (a.casos.length === 1 ? " caso" : " casos") : "Nenhum caso") + "</strong></p>" +
        (!casos ? "" : a.casos.length > 5 && !aberto
          ? '<details class="mais"><summary class="botao">Ver os ' + a.casos.length + ' casos</summary><div class="casos">' + casos + "</div></details>"
          : '<div class="casos">' + casos + "</div>") +
        "</div>";
    }).join("") + "</div>";
  }

  function prova() {
    var D = A().D, esc = A().esc, r = D.resumo_da_prova;
    var linhas = D.prova.map(function (l) {
      var difere = !l.bate_com_a_base;
      return "<tr" + (difere ? ' class="selecionada"' : "") + '><td><a href="' + A().link("notas/" + l.nota) + '">' + esc(l.nota) + "</a></td><td>" + esc(l.tomador) +
        '<br><span class="pequeno suave">' + esc(l.item) + "</span></td><td>" + F.competencia(l.competencia) + '</td><td class="num">' + F.numero(l.cobrada) +
        '</td><td class="num">' + F.numero(l.refeita) + (difere ? " " + A().alerta("!", "não bate") : "") + '</td><td class="num">' +
        (l.pela_regra === null ? '<span class="pequeno suave">aguardando</span>' : (l.pela_regra % 1 ? F.fracao(l.pela_regra) : F.numero(l.pela_regra))) + "</td></tr>";
    }).join("");
    return '<p class="pequeno">' + r.linhas + " linhas de nota · " + r.batem_com_a_base + " batem com a base · " + r.nao_batem + " não " + (r.nao_batem === 1 ? "bate" : "batem") +
      " · " + r.com_valor_pela_regra + " com valor pela regra " + A().alerta("i", "o que esta prova mostra",
        "<p>Para cada linha de nota, o histórico de eventos é refeito pela data de processamento até o instante da contagem. Se der a mesma quantidade cobrada, o histórico explica a nota de hoje: é a mesma base.</p>" +
        "<p>A coluna “pela regra do contrato” é o que a regra de cada contrato pede, pela data informada.</p>") + "</p>" +
      '<div class="rolagem"><table><thead><tr><th>Nota</th><th>Tomador e item</th><th>Competência</th><th class="num">Cobrada</th>' +
      '<th class="num">Refeita pela data de processamento</th><th class="num">Pela regra do contrato</th></tr></thead><tbody>' + linhas + "</tbody></table></div>";
  }

  function pontos() {
    var esc = A().esc;
    return X().pontos().map(function (p, i) {
      return '<div class="cartao ponto"><h3>' + (i + 1) + ". " + esc(p.titulo) + "</h3>" +
        "<p><strong>O que usamos:</strong> " + esc(p.usamos) + "</p><p><strong>Por quê:</strong> " + p.porque + "</p></div>";
    }).join("");
  }

  function montar(partes, params) {
    var D = A().D;
    return '<div class="cabecalho-tela"><h1>Conferência</h1></div>' +
      '<p class="subtitulo">O que a conferência achou e a prova de que os números batem com a base. Cada alerta vale para qualquer cliente.</p>' +
      '<section class="secao" id="creditos-e-debitos"><h2>Créditos e débitos</h2>' + financeiro() + "</section>" +
      '<section class="secao" id="os-alertas"><h2>Os ' + D.alertas.length + " alertas</h2>" + alertas(params) + "</section>" +
      '<section class="secao"><h2>Prova contra a base</h2>' + prova() + "</section>" +
      '<section class="secao"><h2>Pontos de atenção para a Medipreço</h2><div class="grade">' + pontos() + "</div></section>";
  }

  window.App.registrar("conferencia", { titulo: "Conferência", montar: montar });
})();
