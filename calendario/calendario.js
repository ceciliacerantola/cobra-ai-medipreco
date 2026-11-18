/* Tela M5 — Calendário (tarefas 32 e 39, C14).
   As datas vêm de dados.js (bloco "calendario"), calculadas em Python a partir das fichas; para notas já emitidas,
   vale o dia em que a nota de fato saiu (e a ficha aparece ao lado quando difere, sem afirmar o motivo).
   A grade é montada pela data lida como texto, sem ler o relógio do computador; "hoje" vem de dados.js.
   Calendario.grade() e Calendario.marcasDoMes() são usadas também pelo calendário pequeno do Início. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  var SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var NOME_DO_TIPO = { corte: "Corte", emissao: "Emissão", vencimento: "Vencimento" };

  function partes(iso) { var p = /^(\d{4})-(\d{2})/.exec(iso || ""); return p ? { ano: +p[1], mes: +p[2] } : null; }
  function doisDigitos(n) { return (n < 10 ? "0" : "") + n; }
  /* "Aurora Logística" -> "Aurora"; "Grupo Cedro" -> "Cedro" (a palavra "Grupo" não identifica) */
  function nomeCurto(id) {
    var c = A().I.cliente[id];
    if (!c) return id;
    var p = c.nome.split(" ");
    return p[0] === "Grupo" && p[1] ? p[1] : p[0];
  }

  /* uma marca por dia e tipo: {dia, tipo, rotulo, titulo, avisos:[texto]} */
  function marcasDoMes(mes) {
    var grupos = {};
    (A().D.calendario.datas || []).forEach(function (x) {
      if (x.dia.slice(0, 7) !== mes) return;
      var k = x.dia + "|" + x.tipo;
      (grupos[k] = grupos[k] || { dia: x.dia, tipo: x.tipo, itens: [] }).itens.push(x);
    });
    return Object.keys(grupos).sort().map(function (k) {
      var g = grupos[k];
      var nomes = g.itens.map(function (x) {
        return nomeCurto(x.cliente_id) + (x.tipo === "corte" ? "" : " (" + F.competencia(x.competencia).replace(" de 2026", "") + ")");
      });
      var difere = g.itens.filter(function (x) { return x.pela_ficha; });
      return {
        dia: g.dia, tipo: g.tipo, rotulo: NOME_DO_TIPO[g.tipo] + " · " + nomes.join(", "),
        titulo: NOME_DO_TIPO[g.tipo] + ": " + nomes.join(", ") + (g.itens[0].emitida ? " (nota emitida)" : ""),
        difere: difere.length ? "Pela ficha seria " + F.data(difere[0].pela_ficha) + " (" + F.diaDaSemana(difere[0].pela_ficha) + "). A nota saiu em " +
          F.data(g.dia) + " (" + F.diaDaSemana(g.dia) + ")." : null
      };
    });
  }

  /* mes "2026-11"; marcas de marcasDoMes; hoje "2026-11-12" */
  function grade(mes, marcas, hoje, pequeno) {
    var m = partes(mes);
    if (!m) return A().vazio("Mês não reconhecido.");
    var primeiro = new Date(Date.UTC(m.ano, m.mes - 1, 1)).getUTCDay();
    var dias = new Date(Date.UTC(m.ano, m.mes, 0)).getUTCDate();
    var porDia = {};
    (marcas || []).forEach(function (x) { (porDia[x.dia] = porDia[x.dia] || []).push(x); });
    var esc = A().esc, celulas = [];
    for (var i = 0; i < primeiro; i++) celulas.push('<div class="dia fora" aria-hidden="true"></div>');
    for (var d = 1; d <= dias; d++) {
      var iso = m.ano + "-" + doisDigitos(m.mes) + "-" + doisDigitos(d);
      var lista = porDia[iso] || [];
      var eHoje = iso === hoje;
      var conteudo;
      if (pequeno) {
        conteudo = lista.length ? '<span class="pontos">' + lista.map(function (x) {
          return '<span class="ponto-marca ' + esc(x.tipo) + '" title="' + esc(x.titulo) + '"></span>';
        }).join("") + "</span>" : "";
      } else {
        conteudo = lista.map(function (x) {
          return '<span class="marcacao ' + esc(x.tipo) + '" title="' + esc(x.titulo) + '">' + esc(x.rotulo) + "</span>" +
            (x.difere ? A().alerta("i", "data diferente da ficha", "<p>" + esc(x.difere) + "</p>") : "");
        }).join("");
      }
      celulas.push('<div class="dia' + (eHoje ? " hoje-dia" : "") + (lista.length ? " com-marca" : "") + '"' +
        (eHoje ? ' aria-label="' + d + ', hoje"' : "") + '><span class="numero-dia">' + d + "</span>" +
        (eHoje ? '<span class="marca-hoje">hoje</span>' : "") + conteudo + "</div>");
    }
    return '<div class="calendario' + (pequeno ? " pequeno-cal" : "") + '">' +
      SEMANA.map(function (s) { return '<div class="dia-semana">' + s + "</div>"; }).join("") +
      celulas.join("") + "</div>";
  }

  window.Calendario = { grade: grade, marcasDoMes: marcasDoMes };

  A().registrar("calendario", {
    titulo: "Calendário",
    montar: function (p, params) {
      var D = A().D, C = D.calendario, esc = A().esc;
      var meses = C.meses || [];
      var mes = meses.indexOf(params.mes) > -1 ? params.mes : D.hoje.slice(0, 7);
      var i = meses.indexOf(mes);
      var marcas = marcasDoMes(mes);
      var nav = '<nav class="nav-mes" aria-label="Mês">' +
        (i > 0 ? '<a class="botao" href="' + A().link("calendario", { mes: meses[i - 1] }) + '">‹ ' + F.competencia(meses[i - 1]) + "</a>" : '<span class="botao" aria-disabled="true">‹</span>') +
        '<h2 class="mes-titulo">' + F.competencia(mes) + "</h2>" +
        (i < meses.length - 1 ? '<a class="botao" href="' + A().link("calendario", { mes: meses[i + 1] }) + '">' + F.competencia(meses[i + 1]) + " ›</a>" : '<span class="botao" aria-disabled="true">›</span>') +
        "</nav>";
      var prazos = (C.prazos_do_rh || []).map(function (x) {
        return "<li>" + esc(A().I.cliente[x.cliente_id].nome) + ": o RH informa admissões e desligamentos em até " + x.dias_uteis +
          " dias úteis da data em que ocorrem (cláusula " + esc(x.clausula) + "). É um prazo por movimentação, não uma data do mês.</li>";
      }).join("");
      return '<div class="cabecalho-tela"><h1>Calendário</h1></div>' +
        '<p class="subtitulo">Dias de corte, emissões e vencimentos de cada contrato, tirados das fichas. "Hoje" é ' + F.data(D.hoje) +
          ", a data até onde a base vai. Nas notas já emitidas, vale o dia em que a nota saiu.</p>" +
        nav +
        (marcas.length ? "" : A().vazio("Nenhuma data de contrato neste mês.")) +
        grade(mes, marcas, D.hoje, false) +
        '<p class="legenda pequeno"><span class="marcacao corte">Corte</span> dia em que a contagem é feita · ' +
          '<span class="marcacao emissao">Emissão</span> dia em que a nota sai · ' +
          '<span class="marcacao vencimento">Vencimento</span> quando a ficha diz o prazo · <span class="marca-hoje">hoje</span></p>' +
        '<ul class="pequeno suave notas-calendario"><li>' + esc(C.observacao) + "</li>" + prazos + "</ul>";
    }
  });
})();
