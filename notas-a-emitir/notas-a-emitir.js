/* Tela M3 — abas A emitir e Como emitir. Tarefas 31 (tela) e 38 (dado de verdade).
   A prévia vem de dados.js (onda_2.previa), gravada pelo cálculo supondo que nada muda depois de 12/11 (D-091).
   Os lotes são as próximas emissões do calendário (tirado das fichas). A página não emite nada.
   Link oficial aberto e conferido no Chrome em 2026-11-17: Portal da Nota Fiscal de Serviço eletrônica (gov.br/nfse),
   com o botão "Emitir Nota Fiscal" que leva ao Emissor Nacional. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  var PORTAL_NFSE = "https://www.gov.br/nfse/pt-br";
  var EMISSOR_NACIONAL = "https://www.nfse.gov.br/EmissorNacional";

  function particularidades(c, p) {
    var esc = A().esc;
    return (p.observacoes || []).map(function (o) {
      if (o.codigo === "faixa_aplicada") return "Faixa até " + F.numero(o.ate) + " vidas: " + F.moeda(o.unitario) + " por vida.";
      if (o.codigo === "minimo_aplicado") return "Mínimo de " + F.numero(o.minimo) + " aplicado (contadas " + F.numero(o.contadas) + ").";
      if (o.codigo === "rateio") return "Máximo do mês em " + F.data(o.dia_do_maximo) + " (" + F.numero(o.maximo) + "), dividido por empresa.";
      if (o.codigo === "arredondamento_no_total") return "Proporcional aos dias: " + F.numero(o.dias_somados) + " dias ÷ " + o.dias_do_mes + ".";
      if (o.codigo === "plano_sem_preco") return "Plano sem preço na ficha: " + esc(o.planos.join(", ")) + ".";
      return null;
    }).filter(Boolean);
  }

  function itens(c, p) {
    var esc = A().esc;
    if (p.itens.length < 2) return "";
    return '<ul class="itens-previa pequeno">' + p.itens.map(function (i) {
      var nome = i.plano ? "Plano " + i.plano : (i.cnpj ? (A().empresa(i.cnpj).razao || i.cnpj) : i.descricao);
      return "<li>" + esc(nome) + ": " + F.numero(i.quantidade) + " × " + F.moeda(i.unitario) + " = " + F.moeda(i.valor) + "</li>";
    }).join("") + "</ul>";
  }

  function acertos(p) {
    if (!p.acertos.length) return '<span class="pequeno suave">nenhum</span>';
    return p.acertos.map(function (a) {
      return '<span class="pequeno">' + F.acerto(a.valor) + " · " + A().esc(a.nota) +
        (a.destino_ja_emitido ? " " + A().alerta("i", "destino já emitido",
          "<p>Este acerto de " + F.competencia(a.competencia_de_origem) + " entraria na nota de " + F.competencia(a.entrava_em) +
          ", mas ela já tinha saído. Entra na próxima nota ainda não emitida (D-094).</p>") : "") + "</span>";
    }).join("<br>");
  }

  function linha(c) {
    var esc = A().esc, bloco = (A().D.onda_2 || {})[c.id] || {}, p = bloco.previa;
    var al = A().alertasDoCliente(c.id);
    var pend = al.filter(function (x) { return x.alerta.tipo === "!"; }).length;
    var alertas = (pend ? A().alerta("!", pend + (pend === 1 ? " pendente" : " pendentes")) + " " : "") +
      (al.length - pend ? A().alerta("i", (al.length - pend) + " inf.") : "") + (!al.length ? '<span class="pequeno suave">nenhum</span>' : "");
    var nome = '<a href="' + A().link("clientes/" + c.id) + '">' + esc(c.nome) + "</a>";
    if (!p || !p.calculada) {
      return "<tr><td>" + nome + "</td><td>" + (p ? F.competencia(p.competencia) : F.SEM_DADO) + '</td><td colspan="5">' +
        A().alerta("i", "prévia não calculada", "<p>" + esc(((p || {}).motivo || {}).codigo || "sem dado") + "</p>") + "</td><td>" + alertas + "</td></tr>";
    }
    var part = particularidades(c, p);
    var simples = !part.length && !p.acertos.length && !pend;
    var qtd = (c.metodo === "proporcional_aos_dias" ? F.fracao(p.quantidade) : F.numero(p.quantidade)) + " " + (c.unidade === "titular" ? "titulares" : "vidas");
    return "<tr><td>" + nome + "</td><td>" + F.competencia(p.competencia) + "</td>" +
      '<td class="pequeno">' + esc(c.modelo) + (part.length ? '<ul class="particularidades">' + part.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
        itens(c, p) +
        (simples ? '<p class="sem-particularidade">Sem situação particular: a regra do contrato, sem acerto nem pendência.</p>' : "") + "</td>" +
      '<td class="num">' + qtd + "</td>" +
      '<td class="num">' + F.moeda(p.valor) + "</td>" +
      "<td>" + acertos(p) + "</td>" +
      '<td class="num destaque-linha">' + F.moeda(p.valor_com_acertos) + "</td>" +
      "<td>" + alertas + "</td></tr>";
  }

  function lote(l) {
    var I = A().I, clientes = l.clientes.map(function (id) { return I.cliente[id]; });
    var pre = clientes.every(function (c) { return c.pagamento === "pre"; });
    return '<section class="secao" id="lote-' + l.dia + '"><h2>Lote de ' + F.data(l.dia) + " · " + (pre ? "pré-pago" : "pós-pago") + "</h2>" +
      '<p class="pequeno suave">Emissão em ' + F.data(l.dia) + " (" + F.diaDaSemana(l.dia) + "), pela ficha de cada contrato. " +
        "Prévia com a base até " + F.data(A().D.hoje) + ": supõe que nada muda depois dessa data (D-091). Os acertos de outubro já são definitivos.</p>" +
      '<div class="rolagem"><table class="tabela-previa"><thead><tr><th>Cliente</th><th>Competência</th><th>Regra e particularidades</th>' +
        '<th class="num">Quantidade prevista</th><th class="num">Valor previsto</th><th>Acertos incluídos</th><th class="num">Com acertos</th><th>Alertas</th></tr></thead><tbody>' +
        clientes.map(linha).join("") +
      "</tbody></table></div></section>";
  }

  function cabecalho(ativa) {
    return '<div class="cabecalho-tela"><h1>Notas</h1></div>' + A().abasDasNotas(ativa);
  }

  A().registrar("notas-a-emitir", {
    titulo: "Notas a emitir",
    montar: function () {
      var lotes = window.Avisos.proximosLotes();
      return cabecalho("notas-a-emitir") +
        '<p class="subtitulo">As próximas notas, em lotes pela data de emissão. A página não emite: mostra a prévia e o caminho até o site oficial.</p>' +
        '<div class="cartao explicacao-previa"><p><strong>Como fica uma nota sem situação particular.</strong> É só a regra do contrato aplicada à contagem: ' +
          "quantidade × preço. Situação particular é o que muda essa conta: faixa de preço, mínimo, divisão entre empresas, proporcional aos dias, " +
          "acerto de um mês anterior ou um alerta pendente. Cada uma aparece escrita na linha do cliente; quando não há nenhuma, a linha diz isso.</p></div>" +
        (lotes.length ? lotes.map(lote).join("") : A().vazio("Nenhuma emissão prevista depois de " + F.data(A().D.hoje) + ".")) +
        '<div class="linha-botoes secao"><button type="button" class="botao" data-simulado="Na versão real, o financeiro receberia um aviso no dia de cada lote de emissão.">Programar lembrete</button>' + A().etiqueta("simulado") +
          '<button type="button" class="botao" data-simulado="Na versão real, os dados da nota ficariam salvos para preencher o emissor oficial mais rápido. A emissão continua sendo feita por uma pessoa.">Criar padrão de emissão</button>' + A().etiqueta("simulado") + "</div>";
    }
  });

  A().registrar("notas-como-emitir", {
    titulo: "Como emitir",
    montar: function () {
      return cabecalho("notas-como-emitir") +
        '<p class="subtitulo">Esta página não emite nota fiscal. Ela mostra o que conferir antes e onde a emissão é feita.</p>' +
        '<section class="cartao como-emitir"><h2>Antes de emitir</h2>' +
          "<ol><li>Conferir a prévia da nota na aba A emitir: quantidade, valor e acertos incluídos.</li>" +
          "<li>Olhar os alertas pendentes (!) do cliente.</li>" +
          '<li>Emitir no site oficial: <a href="' + PORTAL_NFSE + '" target="_blank" rel="noopener">Portal da Nota Fiscal de Serviço eletrônica (gov.br/nfse)</a>, ' +
            'botão "Emitir Nota Fiscal", que leva ao <a href="' + EMISSOR_NACIONAL + '" target="_blank" rel="noopener">Emissor Nacional</a>.</li>' +
          "<li>Avisar o cliente quando houver acerto, com o texto pronto da tela do cliente.</li></ol>" +
          '<p class="pequeno suave">Links abertos e conferidos em 17/11/2026. Pergunta enviada à Medipreço: como as notas são emitidas hoje ' +
          "(portal nacional, sistema da prefeitura, outro sistema ou contabilidade)? A resposta pode trocar este passo.</p>" +
        "</section>";
    }
  });
})();
