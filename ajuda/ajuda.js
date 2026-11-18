/* Tela M7 — Ajuda (tarefa 46). Perguntas frequentes com o texto aprovado pela Ceci e três botões simulados (C15).
   Vale para as duas visões e abre sem ter entrado, como o Sobre (D-066). Sem números próprios (D-022). */
(function () {
  "use strict";
  function A() { return window.App; }
  var PERGUNTAS = [
    ["O que é competência?",
      "É o mês a que a nota se refere. A nota de outubro cobra as vidas de outubro, mesmo que seja emitida em outro dia."],
    ["O que é o dia de corte?",
      "É o dia em que o contrato manda contar as vidas do mês. Cada contrato tem o seu; ele aparece em Meu perfil e na ficha do cliente."],
    ["Por que a quantidade mudou depois do dia de corte?",
      "Algumas movimentações com data até o dia de corte chegam ao sistema depois da contagem. A conta pelo contrato usa a data em que a mudança aconteceu, e a diferença vira um ajuste na nota seguinte."],
    ["O que é crédito e o que é débito?",
      "Crédito: a nota cobrou a mais, e o valor desce na próxima nota. Débito: cobrou a menos, e o valor sobe."],
    ["O que é a prévia?",
      "É a próxima nota calculada com os dados de hoje. Ela pode mudar até o dia de corte."],
    ["O que quer dizer “simulado”?",
      "O botão mostra o que aconteceria na versão real; nada é enviado nem gravado."]
  ];
  var BOTOES = [
    ["Reportar problema", "Na versão real, a descrição do problema iria para a equipe que cuida da página, com a tela em que ele aconteceu."],
    ["Enviar avaliação", "Na versão real, a sua nota e o seu comentário iriam para a equipe que cuida da página."],
    ["Falar com atendente", "Na versão real, abriria uma conversa com o atendimento da Medipreço."]
  ];
  A().registrar("ajuda", {
    titulo: "Ajuda",
    montar: function () {
      var esc = A().esc;
      return '<div class="cabecalho-tela"><h1>Ajuda</h1></div>' +
        '<p class="subtitulo">Perguntas frequentes. Clique numa pergunta para ver a resposta.</p>' +
        '<div class="lista-perguntas">' + PERGUNTAS.map(function (p) {
          return '<details class="pergunta cartao"><summary>' + esc(p[0]) + "</summary><p>" + esc(p[1]) + "</p></details>";
        }).join("") + "</div>" +
        '<section class="secao"><h2>Precisa de mais?</h2><div class="linha-botoes">' + BOTOES.map(function (b) {
          return '<button type="button" class="botao" data-simulado="' + esc(b[1]) + '">' + esc(b[0]) + "</button>" + A().etiqueta("simulado");
        }).join("") + "</div></section>" +
        '<p class="secao pequeno"><a href="#/sobre">Sobre esta demo</a> · <a href="javascript:history.back()">Voltar</a></p>';
    }
  });
})();
