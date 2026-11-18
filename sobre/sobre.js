/* Tela M8 — Sobre esta demo (tarefa 45). Vale para as duas visões e também abre da Entrada.
   Seções 1, 2 e 4 aprovadas pela Ceci; a seção 3 (como a IA foi usada) aprovada em 2026-11-18 (D-117).
   Os números da seção 4 foram conferidos por consulta direta na base em 2026-11-17. Protótipo em _arquivo/. */
(function () {
  "use strict";
  function A() { return window.App; }
  var SECOES = [
    { titulo: "O que é real", itens: [
      "O cálculo de cada nota, pela regra do contrato, lida da ficha de cada um dos seis contratos.",
      "A contagem pela data informada de cada movimentação, refeita a partir do histórico de eventos.",
      "A conferência: os alertas, as diferenças e os acertos.",
      "Todos os números da página saem do cálculo e foram refeitos por consulta direta na base."
    ] },
    { titulo: "O que é simulado", itens: [
      "A entrada e as duas visões (Medipreço e Empresa/RH): não há login de verdade.",
      "Enviar e-mail, emitir nota fiscal, enviar movimentação, pedir o demonstrativo e tirar dúvida.",
      "Tudo o que tem a etiqueta “simulado”. Nada é enviado, gravado nem emitido."
    ] },
    { titulo: "Como a IA foi usada", itens: [
      "No processo: um agente só (Claude Code), seguindo um guia de 0 a 6 que eu modelei com os meus materiais de estudo, um passo por vez e sempre com o meu OK.",
      "Uma spec em quatro camadas virou 53 tarefas em lotes: o agente planeja, eu aprovo, ele executa. Para cada tarefa, o caminho feliz, o caso raro e o erro.",
      "Aprendizado constante: o agente mantém uma lista do que aprendeu com as minhas decisões. Nenhum número é escrito de memória; todo número sai do cálculo e é refeito por outro caminho.",
      "Na solução: a IA lê o contrato e propõe a ficha, e escreve as explicações a partir do cálculo. Quem aprova é uma pessoa; a conta é código com testes."
    ] },
    { titulo: "De onde vêm os dados", itens: [
      "Do kit do case, com dados fictícios, de junho até 12/11/2026.",
      "6 contratos, 9 empresas, 13.085 eventos e 25 notas emitidas."
    ] }
  ];
  A().registrar("sobre", {
    titulo: "Sobre esta demo",
    montar: function () {
      var esc = A().esc;
      return '<div class="cabecalho-tela"><h1>Sobre esta demo</h1></div>' +
        '<p class="subtitulo">O que esta página mostra de verdade, o que é só demonstração e de onde vêm os números.</p>' +
        '<div class="grade sobre">' + SECOES.map(function (s) {
          return '<section class="cartao' + (s.emEscrita ? " em-escrita" : "") + '"><h2>' + esc(s.titulo) +
            (s.emEscrita ? " " + A().etiqueta("rascunho") : "") + "</h2><ul>" +
            s.itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></section>";
        }).join("") + "</div>" +
        '<p class="secao pequeno">A proposta é apresentada em slides, junto com esta demo. · ' +
          '<a href="javascript:history.back()">Voltar</a></p>';
    }
  });
})();
