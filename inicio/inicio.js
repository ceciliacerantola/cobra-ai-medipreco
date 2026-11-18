/* Tela M1 — Início (painel). Tarefas 30 (tela), 36 (gráficos e cartões) e 37 (quadro de avisos).
   Tudo vem de dados.js. Os gráficos são SVG desenhados aqui, sem biblioteca de fora (D-034):
   - vidas por mês: um gráfico pequeno por cliente (cada um com a sua escala), porque a Delta tem ~5 mil vidas
     e a Faro ~260; numa escala só, as linhas pequenas virariam retas;
   - emitido × pela regra: colunas por competência, somando as notas calculadas.
   A página só soma notas para o gráfico e conta casos de alerta; não calcula valor de nota. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  var MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesCurto(m) { return MES_CURTO[parseInt(m.slice(5, 7), 10) - 1]; }

  function casos(tipoOuId) {
    var n = 0, soma = 0;
    A().D.alertas.forEach(function (a) {
      if (a.tipo === tipoOuId || a.id === tipoOuId) a.casos.forEach(function (c) { n++; soma += (c.quantidade || 0); });
    });
    return { casos: n, soma: soma };
  }

  function cartoes() {
    var g = A().D.financeiro.geral;
    var pend = casos("!"), a3 = casos("A3");
    function cartao(rotulo, valor, link, nota) {
      return '<a class="cartao cartao-numero" href="#/' + link + '"><p class="rotulo">' + rotulo + "</p>" +
        '<p class="valor-grande">' + valor + "</p>" + (nota ? '<p class="pequeno suave">' + nota + "</p>" : "") + "</a>";
    }
    return '<div class="grade-3">' +
      cartao("Casos pendentes (!)", F.numero(pend.casos) + (pend.casos === 1 ? " caso" : " casos"), "conferencia", "alertas que pedem um olhar humano") +
      cartao("Créditos em acertos", F.moeda(g.creditos), "clientes", "a devolver aos clientes, agosto a outubro") +
      cartao("Débitos em acertos", F.moeda(g.debitos), "clientes", "a cobrar dos clientes, agosto a outubro") +
      cartao("Eventos que chegaram depois da nota", F.numero(a3.soma), "conferencia", "alerta A3, todas as notas") +
      "</div>";
  }

  /* ---------- gráfico 1: vidas por mês, um pequeno por cliente ---------- */
  function linhaDoCliente(c) {
    var esc = A().esc, serie = ((A().D.onda_2 || {})[c.id] || {}).vidas_por_mes;
    if (!serie || !serie.length) return '<div class="mini">' + A().vazio("Sem dado de vidas.") + "</div>";
    var W = 280, H = 110, esq = 40, dir = 40, cima = 12, baixo = 22;
    var vals = serie.map(function (v) { return v.vidas; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var folga = Math.max(1, (max - min) * 0.15);
    min -= folga; max += folga;
    function x(i) { return esq + i * (W - esq - dir) / (serie.length - 1); }
    function y(v) { return cima + (max - v) * (H - cima - baixo) / (max - min); }
    var caminho = serie.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v.vidas).toFixed(1); }).join(" ");
    var pontos = serie.map(function (v, i) {
      var titulo = c.nome + " · " + F.competencia(v.mes) + ": " + F.numero(v.vidas) + " vidas em " + F.data(v.dia) + (v.parcial ? " (mês até hoje)" : "");
      return '<g class="ponto"><title>' + esc(titulo) + "</title>" +
        '<circle class="alvo" cx="' + x(i).toFixed(1) + '" cy="' + y(v.vidas).toFixed(1) + '" r="12"></circle>' +
        '<circle class="marca' + (v.parcial ? " parcial" : "") + '" cx="' + x(i).toFixed(1) + '" cy="' + y(v.vidas).toFixed(1) + '" r="4"></circle></g>';
    }).join("");
    var rotulos = [0, serie.length - 1].map(function (i) {
      /* rótulo ao lado do ponto (à esquerda do primeiro, à direita do último): não cruza a linha nem os meses */
      return '<text class="valor" x="' + (x(i) + (i ? 7 : -7)).toFixed(1) + '" y="' + (y(serie[i].vidas) + 4).toFixed(1) + '" text-anchor="' + (i ? "start" : "end") + '">' +
        F.numero(serie[i].vidas) + "</text>";
    }).join("");
    var meses = serie.map(function (v, i) {
      return '<text class="eixo" x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + mesCurto(v.mes) + (v.parcial ? "*" : "") + "</text>";
    }).join("");
    var ini = serie[0], fim = serie[serie.length - 1];
    return '<figure class="mini"><figcaption><strong>' + esc(c.nome) + '</strong> <span class="pequeno suave">' +
        F.numero(ini.vidas) + " → " + F.numero(fim.vidas) + "</span></figcaption>" +
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(c.nome + ": vidas de " + F.competencia(ini.mes) + " a " + F.competencia(fim.mes) +
        ", de " + F.numero(ini.vidas) + " para " + F.numero(fim.vidas)) + '">' +
        '<line class="base" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + (H - baixo) + '" y2="' + (H - baixo) + '"></line>' +
        '<path class="linha" d="' + caminho + '"></path>' + pontos + rotulos + meses + "</svg></figure>";
  }

  function tabelaDasVidas() {
    var D = A().D, esc = A().esc;
    var meses = (D.onda_2[D.clientes[0].id].vidas_por_mes || []).map(function (v) { return v; });
    return '<details class="ver-tabela"><summary>Ver em tabela</summary><div class="rolagem"><table><thead><tr><th>Cliente</th>' +
      meses.map(function (v) { return '<th class="num">' + F.competencia(v.mes) + '<br><span class="pequeno">em ' + F.data(v.dia) + "</span></th>"; }).join("") +
      "</tr></thead><tbody>" + D.clientes.map(function (c) {
        return "<tr><td>" + esc(c.nome) + "</td>" + (D.onda_2[c.id].vidas_por_mes || []).map(function (v) { return '<td class="num">' + F.numero(v.vidas) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div></details>";
  }

  function graficoDasVidas() {
    var D = A().D;
    return '<section class="cartao grafico"><h3>Vidas ativas por mês</h3>' +
      '<p class="pequeno suave">Titulares e dependentes ativos no último dia de cada mês, pela data informada (D-095). ' +
        "Cada cliente tem a sua escala. * novembro vai até " + F.data(D.hoje) + ".</p>" +
      '<div class="minis">' + D.clientes.map(linhaDoCliente).join("") + "</div>" + tabelaDasVidas() + "</section>";
  }

  /* ---------- gráfico 2: emitido × pela regra, por competência ---------- */
  function totaisPorCompetencia() {
    var por = {};
    A().D.notas.forEach(function (n) {
      if (!n.calculada) return;
      var t = por[n.competencia] = por[n.competencia] || { competencia: n.competencia, emitido: 0, regra: 0, notas: 0 };
      t.emitido += n.valor_emitido; t.regra += n.valor_pela_regra; t.notas++;
    });
    return Object.keys(por).sort().map(function (k) {
      var t = por[k];
      t.emitido = Math.round(t.emitido * 100) / 100; t.regra = Math.round(t.regra * 100) / 100;
      return t;
    });
  }

  function graficoDoValor() {
    var esc = A().esc, tot = totaisPorCompetencia();
    var semCalculo = A().D.notas.filter(function (n) { return !n.calculada; });
    var W = 560, H = 230, esq = 12, dir = 12, cima = 30, baixo = 44;
    var max = Math.max.apply(null, tot.map(function (t) { return Math.max(t.emitido, t.regra); })) * 1.08;
    var grupo = (W - esq - dir) / tot.length, barra = Math.min(76, grupo * 0.4), vao = 2;
    function y(v) { return cima + (max - v) * (H - cima - baixo) / max; }
    var fundo = H - baixo;
    function coluna(xx, v, classe, titulo) {
      var topo = y(v), r = 4;
      var d = "M" + xx + " " + fundo + " V" + (topo + r) + " Q" + xx + " " + topo + " " + (xx + r) + " " + topo +
        " H" + (xx + barra - r) + " Q" + (xx + barra) + " " + topo + " " + (xx + barra) + " " + (topo + r) + " V" + fundo + " Z";
      return '<g class="coluna"><title>' + esc(titulo) + '</title><rect class="alvo" x="' + (xx - 4) + '" y="' + cima + '" width="' + (barra + 8) + '" height="' + (fundo - cima) + '"></rect>' +
        '<path class="' + classe + '" d="' + d + '"></path>' +
        '<text class="valor" x="' + (xx + barra / 2) + '" y="' + (topo - 6) + '" text-anchor="middle">' + esc(F.moeda(v).replace("R$", "").trim()) + "</text></g>";
    }
    var corpo = tot.map(function (t, i) {
      var meio = esq + grupo * i + grupo / 2;
      var x1 = meio - barra - vao / 2, x2 = meio + vao / 2;
      var dif = Math.round((t.regra - t.emitido) * 100) / 100;
      return coluna(x1, t.emitido, "emitido", F.competencia(t.competencia) + " · emitido: " + F.moeda(t.emitido) + " (" + t.notas + " notas)") +
        coluna(x2, t.regra, "regra", F.competencia(t.competencia) + " · pela regra: " + F.moeda(t.regra)) +
        '<text class="eixo forte" x="' + meio + '" y="' + (H - 26) + '" text-anchor="middle">' + esc(F.competencia(t.competencia)) + "</text>" +
        '<text class="eixo" x="' + meio + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(F.acerto(dif)) + "</text>";
    }).join("");
    var tabela = '<details class="ver-tabela"><summary>Ver em tabela</summary><div class="rolagem"><table><thead><tr><th>Competência</th><th class="num">Notas</th>' +
      '<th class="num">Emitido</th><th class="num">Pela regra</th><th class="num">Diferença</th></tr></thead><tbody>' +
      tot.map(function (t) {
        return "<tr><td>" + F.competencia(t.competencia) + '</td><td class="num">' + t.notas + '</td><td class="num">' + F.moeda(t.emitido) +
          '</td><td class="num">' + F.moeda(t.regra) + '</td><td class="num">' + F.diferenca(Math.round((t.regra - t.emitido) * 100) / 100) + "</td></tr>";
      }).join("") + "</tbody></table></div></details>";
    return '<section class="cartao grafico"><h3>Emitido e pela regra</h3>' +
      '<p class="pequeno suave">Soma das notas de cada competência, em reais. A diferença vira acerto na nota seguinte.' +
        (semCalculo.length ? " Fora do gráfico: " + semCalculo.map(function (n) { return esc(n.nota); }).join(", ") + ", ainda não calculada." : "") + "</p>" +
      '<p class="legenda-grafico pequeno"><span class="amostra emitido"></span>Emitido <span class="amostra regra"></span>Pela regra do contrato</p>' +
      '<svg class="colunas" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Valor emitido e valor pela regra, por competência">' +
        '<line class="base" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + fundo + '" y2="' + fundo + '"></line>' + corpo + "</svg>" + tabela + "</section>";
  }

  function clientes() {
    var D = A().D, I = A().I, esc = A().esc;
    return '<div class="grade">' + D.clientes.map(function (c) {
      var ultima = I.notasDoCliente[c.id][0];
      var al = A().alertasDoCliente(c.id);
      var pend = al.filter(function (x) { return x.alerta.tipo === "!"; }).length;
      return '<a class="cartao cartao-cliente-inicio" href="' + A().link("clientes/" + c.id) + '">' +
        "<h3>" + esc(c.nome) + "</h3>" +
        '<p class="pequeno suave">' + esc(c.modelo) + "</p>" +
        '<p class="pequeno">Última competência: <strong>' + (ultima ? F.competencia(ultima.competencia) : F.SEM_DADO) + "</strong></p>" +
        '<p class="pequeno">' + (pend ? A().alerta("!", pend + (pend === 1 ? " pendente" : " pendentes")) + " " : "") +
          (al.length - pend ? A().alerta("i", (al.length - pend) + (al.length - pend === 1 ? " informação" : " informações")) : "") +
          (!al.length ? "Nenhum alerta." : "") + "</p></a>";
    }).join("") + "</div>";
  }

  /* o mesmo gráfico serve ao Início do RH (lote J, tarefa 43) */
  window.Graficos = { linhaDoCliente: linhaDoCliente };

  A().registrar("inicio", {
    titulo: "Início",
    montar: function () {
      var D = A().D, mes = D.hoje.slice(0, 7);
      var cal = window.Calendario.grade(mes, window.Calendario.marcasDoMes(mes), D.hoje, true);
      return '<div class="cabecalho-tela"><h1>Início</h1></div>' +
        '<p class="subtitulo">O que pede atenção no fechamento, com a base até ' + F.data(D.hoje) + ".</p>" +
        '<div class="inicio-topo">' +
          '<section class="cartao"><h2>Quadro de avisos</h2>' + window.Avisos.html("medipreco") + "</section>" +
          '<section class="cartao"><h2><a href="#/calendario">Calendário</a></h2>' +
            '<p class="pequeno suave">' + F.competencia(mes) + "</p>" + cal +
            '<p class="pequeno legenda-mini"><span class="ponto-marca corte"></span>corte <span class="ponto-marca"></span>emissão ' +
              '<span class="ponto-marca vencimento"></span>vencimento</p></section>' +
        "</div>" +
        '<section class="secao"><h2>Números do fechamento</h2>' + cartoes() + "</section>" +
        '<section class="secao"><h2>Gráficos</h2><div class="graficos">' + graficoDasVidas() + graficoDoValor() + "</div></section>" +
        '<section class="secao"><h2>Clientes</h2>' + clientes() + "</section>" +
        '<p class="pequeno secao"><a href="#/sobre">Sobre esta demo</a></p>';
    }
  });
})();
