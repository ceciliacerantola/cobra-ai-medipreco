/* Tela M2 — Clientes e Cliente, com dado de verdade (lote E, tarefas 17, 22 e 23).
   Ficha com a cláusula de cada campo, notas em linha do tempo (emitido, pela regra, diferença),
   acertos com crédito e débito justificados, aviso ao cliente e alertas. Nada é calculado aqui. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  function X() { return window.Explica; }

  function contarAlertas(id) {
    var pend = 0, info = 0;
    A().alertasDoCliente(id).forEach(function (x) { if (x.alerta.tipo === "!") pend++; else info++; });
    return { pendentes: pend, informacoes: info };
  }

  function lista() {
    var D = A().D, I = A().I, esc = A().esc;
    var cartoes = D.clientes.map(function (c) {
      var notas = I.notasDoCliente[c.id];
      var ultima = notas[0];
      var fin = D.financeiro.por_cliente[c.id];
      var al = contarAlertas(c.id);
      return '<a class="cartao cartao-cliente" href="' + A().link("clientes/" + c.id) + '">' +
        "<h3>" + esc(c.nome) + "</h3>" +
        '<p class="suave modelo">' + esc(c.modelo) + "</p>" +
        '<p class="linha-etiquetas"><span class="pilula">' + esc(X().PAGAMENTO[c.pagamento] || c.pagamento) + "</span>" +
          (c.empresas.length > 1 ? '<span class="pilula">' + c.empresas.length + " CNPJs</span>" : "") + "</p>" +
        '<p class="rotulo">Última nota emitida</p>' +
        "<p><strong>" + (ultima ? F.moeda(ultima.valor_emitido) : F.SEM_DADO) + "</strong> " +
          '<span class="suave pequeno">· ' + (ultima ? esc(ultima.nota) + " · " + F.competencia(ultima.competencia) : F.SEM_DADO) + "</span></p>" +
        '<p class="rotulo saldo-rotulo">Saldo dos acertos (agosto a outubro)</p>' +
        "<p><strong>" + (fin ? (fin.saldo === 0 ? "sem diferença" : (fin.saldo < 0 ? "a devolver " : "a cobrar ") + F.moeda(Math.abs(fin.saldo))) : F.SEM_DADO) + "</strong></p>" +
        '<p class="pequeno suave alertas-linha">' +
          (al.pendentes ? A().alerta("!", al.pendentes + (al.pendentes === 1 ? " pendente" : " pendentes")) + " " : "") +
          (al.informacoes ? A().alerta("i", al.informacoes + (al.informacoes === 1 ? " informação" : " informações")) : "") +
          (!al.pendentes && !al.informacoes ? "Nenhum alerta." : "") + "</p>" +
        "</a>";
    }).join("");

    return '<div class="cabecalho-tela"><h1>Clientes</h1></div>' +
      '<p class="subtitulo">Seis contratos, cada um com o seu jeito de cobrar. Clique em um cliente para ver a regra do contrato, as notas e os acertos.</p>' +
      '<div class="grade">' + cartoes + "</div>" + modelos();
  }

  /* tarefa 41: o que a ficha aceita e quem já usa (bloco `modelos`, gerado das fichas) */
  function modelos() {
    var D = A().D, esc = A().esc;
    if (!D.modelos || !D.modelos.length) return "";
    var nome = {};
    D.clientes.forEach(function (c) { nome[c.id] = c.nome; });
    var quem = function (v) {
      return v.clientes.length
        ? v.clientes.map(function (id) { return '<a href="' + A().link("clientes/" + id) + '">' + esc(nome[id] || id) + "</a>"; }).join(", ")
        : '<span class="suave">aceito, nenhum cliente usa ainda</span>';
    };
    var lista = function (m) {
      return '<ul class="lista-modelos">' + m.valores.map(function (v) {
        return '<li><span class="valor-modelo">' + esc(v.texto) + '</span><span class="pequeno quem-usa">' + quem(v) + "</span></li>";
      }).join("") + "</ul>";
    };
    /* os 4 que mais mudam de um cliente para outro viram cartões; o resto fica no toggle (ajuste de 2026-11-17) */
    var PRINCIPAIS = ["unidade_de_cobranca", "preco", "contagem", "notas"];
    var cartoes = PRINCIPAIS.map(function (k, i) {
      var m = D.modelos.filter(function (x) { return x.campo === k; })[0];
      return m ? '<div class="cartao cartao-tipo cor-' + (i + 1) + '"><p class="rotulo-tipo">' + esc(m.rotulo) + "</p>" + lista(m) + "</div>" : "";
    }).join("");
    var outros = D.modelos.filter(function (m) { return PRINCIPAIS.indexOf(m.campo) < 0; });
    var linhas = outros.map(function (m) { return "<tr><td>" + esc(m.rotulo) + "</td><td>" + lista(m) + "</td></tr>"; }).join("");
    return '<section class="secao modelos-de-cobranca"><h2>Tipos de cobrança</h2>' +
      '<p class="subtitulo">Para consulta do financeiro. Quem define é o contrato; aqui fica o que cada cliente usa.</p>' +
      '<div class="grade-tipos">' + cartoes + "</div>" +
      '<details class="detalhes-tipos"><summary>Ver todos os detalhes da ficha (' + outros.length + ")</summary>" +
      '<div class="rolagem"><table class="tabela-modelos"><thead><tr><th>Item da ficha</th><th>Opções aceitas e quem usa</th></tr></thead><tbody>' +
      linhas + "</tbody></table></div></details></section>";
  }

  function ficha(c) {
    var esc = A().esc;
    var linhas = c.ficha.map(function (f) {
      var origem;
      if (f.origem === "clausula") {
        origem = '<span class="pilula">cláusula ' + esc(f.referencia) + '</span><br><span class="pequeno suave trecho">“' + esc(f.texto) + "”</span>" +
          (f.observacao ? '<br><span class="pequeno">' + esc(f.observacao) + "</span>" : "");
      } else if (f.origem === "decisao") {
        origem = A().alerta("i", "decisão " + f.referencia, "<p>" + esc(f.texto) + "</p><p class=\"pequeno suave\">O contrato não diz. Decisão registrada em decisoes.md.</p>");
      } else {
        origem = '<span class="pequeno suave">' + esc(f.texto || "O contrato não diz.") + "</span>";
      }
      return "<tr><td>" + esc(f.rotulo) + "</td><td>" + (f.valor === null ? F.SEM_DADO : esc(f.valor)) + "</td><td>" + origem + "</td></tr>";
    }).join("");
    return '<div class="rolagem"><table class="tabela-ficha"><thead><tr><th>Campo</th><th>Valor</th><th>De onde vem</th></tr></thead><tbody>' +
      linhas + "</tbody></table></div>" +
      '<p class="pequeno suave nota-de-rodape">Contrato ' + esc(c.contrato.numero) + " · " + esc(c.contrato.tipo) + " · arquivo " + esc(c.contrato.arquivo) +
      ". Ficha aprovada por " + esc(c.aprovacao.por) + " em " + F.data(c.aprovacao.em) + ".</p>";
  }

  /* uma linha da linha do tempo: a nota, emitido, pela regra e diferença */
  function itemNota(n, c) {
    var esc = A().esc;
    var direita = n.calculada
      ? '<span class="num"><span class="pequeno suave">emitido</span> <strong>' + F.moeda(n.valor_emitido) + "</strong><br>" +
        '<span class="pequeno suave">pela regra</span> ' + F.moeda(n.valor_pela_regra) + "<br>" +
        '<span class="pequeno ' + (n.diferenca === 0 ? "suave" : "") + '">' + F.acerto(n.diferenca) + "</span></span>"
      : '<span class="num"><span class="pequeno suave">emitido</span> <strong>' + F.moeda(n.valor_emitido) + "</strong><br>" +
        A().alerta("i", "aguardando " + F.data((n.motivo || {}).dia_necessario)) + "</span>";
    return '<li><a class="item-link" href="' + A().link("notas/" + n.nota) + '"><span class="item">' +
      "<span><strong>" + esc(n.nota) + "</strong> · " + esc(n.tomador) +
        '<br><span class="pequeno suave">emitida em ' + F.data(n.emissao) + " · " + F.numero(n.quantidade_emitida) + " " + X().quem(c, n.quantidade_emitida) +
        (n.calculada ? " cobradas · " + (c.metodo === "proporcional_aos_dias" ? F.fracao(n.quantidade_pela_regra) : F.numero(n.quantidade_pela_regra)) + " pela regra" : " cobradas") +
        "</span></span>" + direita + "</span></a></li>";
  }

  function notas(c) {
    var I = A().I;
    var todas = I.notasDoCliente[c.id];
    if (!todas.length) return A().vazio("Nenhuma nota emitida para este cliente.");
    var grupos = {}, ordem = [];
    todas.forEach(function (n) {
      if (!grupos[n.competencia]) { grupos[n.competencia] = []; ordem.push(n.competencia); }
      grupos[n.competencia].push(n);
    });
    return ordem.map(function (comp) {
      var g = I.grupo[c.id + "|" + comp];
      var cab = '<h3 class="competencia">' + F.competencia(comp) + "</h3>";
      if (g) {
        cab += '<div class="pequeno grupo-linha">Grupo: máximo de ' + F.numero(g.maximo) + " vidas em " + F.data(g.dia_do_maximo) + " · emitidas " + F.numero(g.quantidade_emitida) +
          " · " + F.acerto(g.diferenca) + " no total do grupo " + A().alerta("i", "por que dividir assim", X().rateio(g, c)) + "</div>";
      }
      return cab + '<ul class="linha-do-tempo">' + grupos[comp].map(function (n) { return itemNota(n, c); }).join("") + "</ul>";
    }).join("");
  }

  /* para onde vai o acerto (D-094): o da última competência entra na prévia da próxima nota; os anteriores apontavam
     para notas que já saíram sem eles e ficam como "diferença de meses passados, não acertada" */
  function ondeEntra(c, n) {
    var p = ((A().D.onda_2 || {})[c.id] || {}).previa;
    var naPrevia = p && p.calculada && p.acertos.some(function (a) { return a.nota === n.nota; });
    if (naPrevia) {
      return "entra em " + F.competencia(p.competencia) + (p.competencia !== n.acerto.entra_na_competencia
        ? " (a nota de " + F.competencia(n.acerto.entra_na_competencia) + " já tinha saído)" : "");
    }
    var destino = A().I.notasDoCliente[c.id].filter(function (x) { return x.competencia === n.acerto.entra_na_competencia; })[0];
    if (destino) return "diferença de meses passados, não acertada: a nota de " + F.competencia(destino.competencia) + " (" + A().esc(destino.nota) + ") saiu sem ela";
    return "entra em " + F.competencia(n.acerto.entra_na_competencia);
  }

  function acertos(c) {
    var D = A().D, I = A().I, esc = A().esc;
    var com = I.notasDoCliente[c.id].filter(function (n) { return n.calculada; });
    var fin = D.financeiro.por_cliente[c.id];
    var linhas = com.map(function (n) {
      if (n.diferenca === 0) {
        return "<tr><td>" + F.competencia(n.competencia) + '</td><td><a href="' + A().link("notas/" + n.nota) + '">' + esc(n.nota) + "</a></td><td>—</td>" +
          '<td>Nenhum acerto nesta competência: o valor bate com a regra.</td><td class="num">' + F.moeda(0) + "</td></tr>";
      }
      var mot = Object.keys(n.resumo_dos_motivos || {}).map(function (k) { return "<li>" + X().resumoDoMotivo(k, n.resumo_dos_motivos[k], n, c) + "</li>"; }).join("");
      return "<tr><td>" + F.competencia(n.competencia) + '<br><span class="pequeno suave">' + ondeEntra(c, n) + "</span></td>" +
        '<td><a href="' + A().link("notas/" + n.nota) + '">' + esc(n.nota) + "</a>" + (c.empresas.length > 1 ? '<br><span class="pequeno suave">' + esc(n.tomador) + "</span>" : "") + "</td>" +
        "<td>" + (n.diferenca < 0 ? "Crédito" : "Débito") + "</td>" +
        '<td><ul class="motivos">' + mot + '</ul><a class="pequeno" href="' + A().link("notas/" + n.nota, { filtro: "diferenca" }) + '">Ver as pessoas</a></td>' +
        '<td class="num destaque-linha">' + F.diferenca(n.diferenca) + "</td></tr>";
    }).join("");
    var semCalculo = I.notasDoCliente[c.id].filter(function (n) { return !n.calculada; }).map(function (n) {
      return '<div class="sem-calculo">' + A().alerta("i", n.nota + ": aguardando " + F.data((n.motivo || {}).dia_necessario), X().semCalculo(n, c)) + "</div>";
    }).join("");
    var saldo = fin ? '<div class="saldo">Saldo do cliente: <strong>' + (fin.saldo === 0 ? "sem diferença" : (fin.saldo < 0 ? "a devolver " : "a cobrar ") + F.moeda(Math.abs(fin.saldo))) +
      "</strong> · créditos " + F.moeda(fin.creditos) + " · débitos " + F.moeda(fin.debitos) + " " + A().alerta("i", "o que é crédito e débito", X().creditoDebito()) + "</div>" : "";
    return saldo + (linhas ? '<div class="rolagem"><table><thead><tr><th>Competência</th><th>Nota</th><th>Tipo</th><th>Por quê</th><th class="num">Valor</th></tr></thead><tbody>' +
      linhas + "</tbody></table></div>" : A().vazio("Nenhum acerto nesta competência.")) + semCalculo;
  }

  function aviso(c) {
    var texto = X().avisoAoCliente(c, A().I.notasDoCliente[c.id]);
    if (!texto) return A().vazio("Nenhum aviso necessário: não há acerto.");
    var id = "aviso-" + c.id;
    return '<div class="cartao texto-aviso"><p class="pequeno suave">Os números vêm do cálculo.</p>' +
      '<pre id="' + id + '" class="texto-copiavel">' + A().esc(texto) + "</pre></div>" +
      '<div class="linha-botoes"><button type="button" class="botao" data-copiar="' + id + '">Copiar texto</button>' +
      '<button type="button" class="botao" data-simulado="Na versão real, a mensagem iria por e-mail para o contato do cliente, depois de alguém do financeiro conferir.">Enviar por e-mail</button> ' + A().etiqueta("simulado") + "</div>";
  }

  function alertas(c) {
    var meus = A().alertasDoCliente(c.id);
    if (!meus.length) return A().vazio("Nenhum alerta.");
    return '<div class="lista-alertas">' + meus.map(function (x) {
      return "<div>" + A().alerta(x.alerta.tipo, x.alerta.id + " · " + x.alerta.nome + " · " + F.competencia(x.caso.competencia) + (x.caso.nota ? " · " + x.caso.nota : ""),
        X().caso(x.alerta, x.caso) + '<p class="pequeno"><a href="' + A().link("conferencia", { alerta: x.alerta.id }) + '">Ver na Conferência</a></p>') + "</div>";
    }).join("") + "</div>";
  }

  function umCliente(id) {
    var I = A().I, esc = A().esc;
    var c = I.cliente[id];
    if (!c) return A().naoEncontrado("Cliente não encontrado.", "clientes", "Voltar para Clientes");

    var cnpjs = c.empresas.map(function (x) {
      return "<li>" + esc(x.cnpj) + ' <span class="suave">· ' + esc(x.razao_social) + (x.papel ? " · " + esc(x.papel) : "") + "</span></li>";
    }).join("");

    return '<p class="migalha"><a href="' + A().link("clientes") + '">Clientes</a> › ' + esc(c.nome) + "</p>" +
      '<div class="cabecalho-tela"><h1>' + esc(c.nome) + '</h1><span class="pilula">' + esc(X().PAGAMENTO[c.pagamento] || c.pagamento) + "</span></div>" +
      '<p class="subtitulo">' + esc(c.modelo) + ".</p>" +
      '<ul class="cnpjs pequeno">' + cnpjs + "</ul>" +
      '<p class="linha-botoes atalhos"><a class="botao" href="' + A().link("extratos", { cliente: c.id }) + '">Extrato deste cliente</a></p>' +
      '<section class="secao"><h2>Ficha do contrato</h2>' + ficha(c) + "</section>" +
      '<section class="secao"><h2>Notas por competência</h2>' + notas(c) + "</section>" +
      '<section class="secao"><h2>Acertos para a próxima competência</h2>' + acertos(c) + "</section>" +
      '<section class="secao"><h2>Aviso ao cliente</h2>' + aviso(c) + "</section>" +
      '<section class="secao"><h2>Alertas deste cliente</h2>' + alertas(c) + "</section>";
  }

  window.App.registrar("clientes", {
    titulo: "Clientes",
    montar: function (partes) { return partes[0] ? umCliente(partes[0]) : lista(); }
  });
})();
