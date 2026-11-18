/* Visão Empresa/RH (R1 a R5), só da Aurora — com dado de verdade (lote J, tarefas 43 e 44).
   Endereços: #/rh/inicio, #/rh/notas, #/rh/notas/NF-x, #/rh/extratos, #/rh/vidas, #/rh/perfil.
   A página não calcula: tudo vem de dados.js. O RH não vê a Conferência, os alertas internos nem outros clientes.
   Sem botão "Pagar": a base não tem dado de pagamento (D-099, D-103). A nota aberta é um resumo consolidado (D-105).
   Protótipo do lote F em _arquivo/. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  var CLIENTE = "aurora"; /* acesso fictício do RH da Aurora (D-062); trocar aqui serve para outra empresa */
  var POR_VEZ = 50;

  function cliente() { return A().I.cliente[CLIENTE]; }
  function campo(c, nome) { var l = c.ficha.filter(function (f) { return f.campo === nome; })[0]; return l ? l.valor : null; }
  /* botões simulados (C15, tarefa 47): a mensagem diz o que aconteceria na versão real */
  var NA_VERSAO_REAL = {
    "Tirar dúvida sobre esta nota": "Na versão real, a pergunta iria para o financeiro da Medipreço, com o número da nota junto.",
    "Pedir o demonstrativo completo": "Na versão real, o pedido iria para o financeiro da Medipreço, que manda o demonstrativo pessoa a pessoa.",
    "Enviar movimentação": "Na versão real, a empresa mandaria o arquivo com as mudanças e a data em que cada uma aconteceu."
  };
  function simulado(rotulo) {
    return '<button type="button" class="botao" data-simulado="' + A().esc(NA_VERSAO_REAL[rotulo] || "") + '">' + rotulo + "</button>" + A().etiqueta("simulado");
  }
  function onda2(c) { return (A().D.onda_2 || {})[c.id] || {}; }

  /* pessoas ativas hoje (dados.js, onda_2.<cliente>.ativos_hoje), como objetos */
  function ativosHoje(c) {
    var a = onda2(c).ativos_hoje;
    if (!a) return { dia: null, pessoas: [] };
    var C = {};
    a.colunas.forEach(function (n, i) { C[n] = i; });
    return { dia: a.dia, pessoas: a.linhas.map(function (l) { return { pessoa: l[C.pessoa], tipo: l[C.tipo], plano: l[C.plano], cnpj: l[C.cnpj] }; }) };
  }
  function contarPor(lista, chave) {
    var r = {};
    lista.forEach(function (p) { var k = p[chave] || F.SEM_DADO; r[k] = (r[k] || 0) + 1; });
    return r;
  }
  function porPlanoEmTexto(cont) {
    return Object.keys(cont).sort().map(function (k) { return A().esc(k) + " " + F.numero(cont[k]); }).join(" · ");
  }

  /* ---------- prévia da próxima nota ---------- */
  function cartaoPrevia(c) {
    var p = onda2(c).previa;
    if (!p) return "";
    var titulo = '<p class="rotulo">Próxima nota · ' + F.competencia(p.competencia) + ' <span class="pilula">prévia, ainda não emitida</span></p>';
    if (!p.calculada) {
      return '<div class="cartao rh-previa">' + titulo + '<p class="valor-grande">' + F.SEM_DADO + "</p>" +
        '<p class="pequeno suave">Aguardando ' + F.data(p.dia_de_referencia) + ": a base vai até " + F.data(p.base_ate) + ".</p></div>";
    }
    var acertos = (p.acertos || []).map(function (a) {
      return (a.valor < 0 ? "crédito" : "débito") + " de " + F.moeda(Math.abs(a.valor)) + " (" + F.competencia(a.competencia_de_origem) + ")";
    });
    return '<div class="cartao rh-previa">' + titulo +
      '<p class="valor-grande">' + F.moeda(p.valor_com_acertos) + "</p>" +
      '<p class="pequeno">' + F.numero(p.quantidade) + " " + A().esc(c.unidade === "titular" ? "titulares" : "vidas") + " · " + F.moeda(p.valor) + " pela regra" +
        (acertos.length ? ", com " + acertos.join(" e ") : "") + ".</p>" +
      '<p class="pequeno suave">Prévia com a base até ' + F.data(p.base_ate) + ": a contagem do contrato é no dia " + F.data(p.dia_de_referencia) + ". Pode mudar até lá.</p></div>";
  }

  /* ---------- R1 Início ---------- */
  function inicio(c) {
    var esc = A().esc, notas = A().I.notasDoCliente[c.id];
    var ultima = notas[0];
    var at = ativosHoje(c);
    var avisoTexto = window.Explica && window.Explica.avisoAoCliente(c, notas);
    var ultimas = window.Extrato.filtrar({ cliente: c.id, de: "2023-01-01", ate: A().D.fim_da_base });
    var C = ultimas.colunas, ev = (ultimas.eventos || []).slice(-10).reverse();
    var linhasEv = ev.map(function (l) {
      return '<tr><td><a href="' + A().link("rh/extratos", { pessoa: l[C.pessoa], de: "2023-01-01", ate: A().D.fim_da_base }) + '">' + esc(l[C.pessoa]) + "</a></td>" +
        "<td>" + F.tipoEvento(l[C.tipo]) + "</td><td>" + esc(l[C.plano] || F.SEM_DADO) + "</td><td>" + F.data(l[C.informada]) + "</td><td>" + F.dataHora(l[C.processamento]) +
        (F.atrasado(l[C.informada], l[C.processamento]) ? ' <span class="pilula">atrasado</span>' : "") + "</td></tr>";
    }).join("");

    return '<div class="cabecalho-tela"><h1>Olá, RH da ' + esc(c.nome) + "</h1></div>" +
      '<p class="subtitulo">A sua empresa numa tela: a última nota, a próxima, a regra do contrato, as vidas ativas e os avisos.</p>' +
      '<div class="grade-3">' +
        '<div class="cartao"><p class="rotulo">Última nota</p><p class="valor-grande">' + (ultima ? F.moeda(ultima.valor_emitido) : F.SEM_DADO) + "</p>" +
          (ultima ? '<p class="pequeno suave"><a href="' + A().link("rh/notas/" + ultima.nota) + '">' + esc(ultima.nota) + "</a> · " + F.competencia(ultima.competencia) + " · emitida em " + F.data(ultima.emissao) + "</p>" : "") + "</div>" +
        cartaoPrevia(c) +
        '<div class="cartao"><p class="rotulo">Vidas ativas hoje</p><p class="valor-grande">' + F.numero(at.pessoas.length) + "</p>" +
          '<p class="pequeno">' + porPlanoEmTexto(contarPor(at.pessoas, "plano")) + "</p>" +
          '<p class="pequeno suave">Em ' + F.data(at.dia) + ", pela data informada. " + esc(campo(c, "dependentes") || "") + '. <a href="' + A().link("rh/vidas") + '">Ver a lista</a></p></div>' +
      "</div>" +
      '<div class="cartao rh-regra"><p class="rotulo">Regra do contrato</p><p>' + esc(c.modelo) + '</p><p class="pequeno suave"><a href="' + A().link("rh/perfil") + '">Ver o contrato</a></p></div>' +
      '<section class="secao"><h2>Vidas por mês</h2><div class="rh-grafico grafico">' + (window.Graficos ? window.Graficos.linhaDoCliente(c) : "") + "</div>" +
        '<p class="pequeno suave">Vidas no último dia de cada mês, pela data informada; * mês até hoje.</p></section>' +
      '<section class="secao"><h2>Avisos recebidos</h2>' + (window.Avisos ? window.Avisos.html("rh") : "") +
        (avisoTexto ? '<div class="secao cartao texto-aviso rh-mensagem" id="mensagem"><p class="rotulo">Mensagem do Financeiro · Medipreço</p><pre class="texto-copiavel">' + esc(avisoTexto) + "</pre>" +
          (ultima ? '<p class="pequeno"><a href="' + A().link("rh/notas/" + ultima.nota) + '">Ver o resumo da ' + esc(ultima.nota) + "</a></p>" : "") + "</div>" : "") +
      "</section>" +
      '<section class="secao"><h2>Últimas movimentações</h2>' +
        (ev.length ? '<div class="rolagem"><table><thead><tr><th>Pessoa</th><th>Evento</th><th>Plano</th><th>Data informada</th><th>Data de processamento</th></tr></thead><tbody>' + linhasEv + "</tbody></table></div>"
          : A().vazio("Nenhuma movimentação na base.")) +
        '<p class="pequeno"><a href="' + A().link("rh/extratos") + '">Ver todas em Meus extratos</a></p></section>';
  }

  /* ---------- R2 Minhas notas ---------- */
  function notas(c, params) {
    var esc = A().esc, todas = A().I.notasDoCliente[c.id];
    var comps = [];
    todas.forEach(function (n) { if (comps.indexOf(n.competencia) < 0) comps.push(n.competencia); });
    var varias = c.empresas.length > 1;
    var lista = todas.filter(function (n) {
      return (!params.competencia || n.competencia === params.competencia) && (!varias || !params.empresa || n.cnpj === params.empresa);
    });
    function opc(valor, rotulo, atual) { return '<option value="' + esc(valor) + '"' + (valor === (atual || "") ? " selected" : "") + ">" + esc(rotulo) + "</option>"; }
    var filtros = '<form class="filtros rh-filtros" data-rota="rh/notas" aria-label="Filtrar as notas">' +
      '<label>Competência<select name="competencia">' + opc("", "Todas") + comps.map(function (m) { return opc(m, F.competencia(m), params.competencia); }).join("") + "</select></label>" +
      (varias ? '<label>Empresa<select name="empresa">' + opc("", "Todas") + c.empresas.map(function (e) { return opc(e.cnpj, e.razao_social, params.empresa); }).join("") + "</select></label>" : "") +
      '<div class="acoes-filtro"><button type="submit" class="botao principal">Filtrar</button> <a class="botao" href="' + A().link("rh/notas") + '">Limpar</a></div></form>';
    var itens = lista.map(function (n) {
      return '<li><div class="item cartao rh-nota">' +
        "<div><strong>" + esc(n.nota) + "</strong> · " + F.competencia(n.competencia) + (varias ? " · " + esc(n.tomador) : "") +
          '<br><span class="pequeno suave">Emitida em ' + F.data(n.emissao) + "</span></div>" +
        '<div class="num"><strong>' + F.moeda(n.valor_emitido) + "</strong></div>" +
        '<div class="linha-botoes"><a class="botao principal" href="' + A().link("rh/notas/" + n.nota) + '">Visualizar</a>' +
          '<button type="button" class="botao" data-baixar="resumo:' + esc(n.nota) + '">Baixar resumo</button>' +
          simulado("Tirar dúvida sobre esta nota") + "</div>" +
        "</div></li>";
    }).join("");
    var mostraPrevia = !params.competencia && !params.empresa;
    return '<div class="cabecalho-tela"><h1>Minhas notas</h1></div>' +
      '<p class="subtitulo">Como um extrato de banco: da mais nova para a mais antiga. Visualizar abre o resumo da nota: o que foi cobrado, o valor pelo contrato e o ajuste.</p>' +
      filtros +
      (mostraPrevia ? '<div class="rh-previa-lista">' + cartaoPrevia(c) + "</div>" : "") +
      (itens ? '<ul class="linha-do-tempo">' + itens + "</ul>" : A().vazio("Nenhuma nota com esses filtros."));
  }

  /* ---------- R2 nota aberta: resumo consolidado (D-105) ----------
     O RH vê o resultado: cobrado, valor pelo contrato, ajuste e o mês em números, sem pessoas nem eventos.
     O demonstrativo pessoa a pessoa fica na Medipreço e só vai ao cliente se ele pedir. */
  function ajusteDaNota(n) {
    var a = (n.caminho || []).filter(function (x) { return x.etapa === "acerto"; })[0] || {};
    if (!n.calculada) return { valor: F.SEM_DADO, frase: "Conferência pelo contrato em andamento." };
    if (n.diferenca === 0) return { valor: "Sem ajuste", frase: "A nota bate com o contrato." };
    var tipo = n.diferenca < 0 ? "crédito" : "débito";
    var valor = tipo + " de " + F.moeda(Math.abs(n.diferenca));
    if (a.situacao === "na_previa" || a.situacao === "a_vir") return { valor: valor, frase: "Entra na nota de " + F.competencia(a.competencia) + "." };
    return { valor: valor, frase: "Ainda não aplicado em nenhuma nota." };
  }

  function resumoDaNota(c, numero) {
    var esc = A().esc, n = A().I.nota[numero];
    if (!n || n.cliente_id !== c.id) return A().naoEncontrado("Nota não encontrada: " + numero + ".", "rh/notas", "Voltar para Minhas notas");
    var fracao = c.metodo === "proporcional_aos_dias";
    function qtd(q) { return fracao ? F.fracao(q) + " mensalidades" : F.numero(q) + " " + window.Explica.quem(c, q); }
    var aj = ajusteDaNota(n), v = n.variacao, mot = n.resumo_dos_motivos || {};
    var atrasadas = (mot.saida_processada_depois || 0) + (mot.entrada_processada_depois || 0);
    var itens = n.calculada ? n.itens_pela_regra.map(function (i) {
      return "<tr><td>" + esc(i.descricao) + '</td><td class="num">' + (fracao ? F.fracao(i.quantidade) : F.numero(i.quantidade)) + '</td><td class="num">' + F.moeda(i.unitario) +
        '</td><td class="num">' + F.moeda(i.valor) + "</td></tr>";
    }).join("") : "";
    var mes = v ? "<p><strong>O mês em números:</strong> " + F.numero(v.entradas.length) + (v.entradas.length === 1 ? " entrou" : " entraram") + " · " +
      F.numero(v.saidas.length) + (v.saidas.length === 1 ? " saiu" : " saíram") +
      (v.trocas.length || /por plano/.test(c.modelo) ? " · " + F.numero(v.trocas.length) + (v.trocas.length === 1 ? " trocou de plano" : " trocaram de plano") : "") +
      ' <span class="pequeno suave">(desde ' + F.competencia(v.competencia_anterior) + ")</span></p>" : "";
    var porque = n.calculada && n.diferenca !== 0
      ? "<p><strong>Por que o ajuste:</strong> " + (atrasadas
        ? F.numero(atrasadas) + (atrasadas === 1 ? " movimentação" : " movimentações") + " com data até o dia de corte " + (atrasadas === 1 ? "chegou" : "chegaram") + " ao sistema depois da contagem."
        : "a conta pelo contrato deu outro valor.") + "</p>" : "";
    return '<p class="migalha"><a href="' + A().link("rh/notas") + '">Minhas notas</a> › ' + esc(n.nota) + "</p>" +
      '<div class="cabecalho-tela"><h1>' + esc(n.nota) + " " + window.NotaAberta.selo(n) + "</h1></div>" +
      '<dl class="dados-nota">' +
        "<div><dt>Competência</dt><dd>" + F.competencia(n.competencia) + "</dd></div>" +
        "<div><dt>Data de emissão</dt><dd>" + F.data(n.emissao) + "</dd></div>" +
        window.NotaAberta.vencimento(n) +
        "<div><dt>Tomador</dt><dd>" + esc(n.tomador) + " · " + esc(n.cnpj) + "</dd></div></dl>" +
      '<div class="grade-3 rh-resumo">' +
        '<div class="cartao"><p class="rotulo">Cobrado</p><p class="valor-grande">' + F.moeda(n.valor_emitido) + '</p><p class="pequeno suave">' + qtd(n.quantidade_emitida) + "</p></div>" +
        '<div class="cartao"><p class="rotulo">Pelo contrato</p><p class="valor-grande">' + (n.calculada ? F.moeda(n.valor_pela_regra) : F.SEM_DADO) + '</p><p class="pequeno suave">' +
          (n.calculada ? qtd(n.quantidade_pela_regra) : "aguardando") + "</p></div>" +
        '<div class="cartao rh-ajuste"><p class="rotulo">Ajuste</p><p class="valor-medio">' + aj.valor + '</p><p class="pequeno suave">' + aj.frase + "</p></div>" +
      "</div>" +
      (n.calculada ? '<section class="secao"><h2>Como fica pelo contrato</h2><div class="rolagem"><table><thead><tr><th>Item</th><th class="num">Quantidade</th><th class="num">Preço</th><th class="num">Valor</th></tr></thead><tbody>' +
        itens + '</tbody><tfoot><tr><td>Total</td><td></td><td></td><td class="num destaque-linha">' + F.moeda(n.valor_pela_regra) + "</td></tr></tfoot></table></div></section>" : "") +
      (mes || porque ? '<div class="cartao rh-mes">' + mes + porque + "</div>" : "") +
      '<div class="linha-botoes secao nao-imprimir">' +
        '<button type="button" class="botao" data-baixar="resumo:' + esc(n.nota) + '">Baixar resumo (CSV)</button>' +
        '<button type="button" class="botao" data-imprimir>Imprimir (PDF)</button>' +
        simulado("Pedir o demonstrativo completo") + simulado("Tirar dúvida sobre esta nota") + "</div>" +
      '<p class="pequeno suave">O demonstrativo completo, pessoa a pessoa, é enviado pela Medipreço quando pedido.</p>';
  }

  /* ---------- R4 Minhas vidas ---------- */
  function vidas(c, params) {
    var esc = A().esc, at = ativosHoje(c), varias = c.empresas.length > 1;
    var pessoa = (params.pessoa || "").toUpperCase();
    var lista = at.pessoas.filter(function (p) {
      return (!params.plano || p.plano === params.plano) && (!params.tipo || p.tipo === params.tipo) && (!pessoa || p.pessoa.indexOf(pessoa) >= 0);
    });
    var filtrosAtivos = { plano: params.plano, tipo: params.tipo, pessoa: pessoa };
    var pg = A().paginar(lista, params.pagina, POR_VEZ, "rh/vidas", filtrosAtivos);
    var planos = Object.keys(contarPor(at.pessoas, "plano")).sort();
    function opc(valor, rotulo, atual) { return '<option value="' + esc(valor) + '"' + (valor === (atual || "") ? " selected" : "") + ">" + esc(rotulo) + "</option>"; }
    var porPlano = contarPor(at.pessoas, "plano"), porTipo = contarPor(at.pessoas, "tipo");
    var linhas = pg.fatia.map(function (p) {
      var emp = A().empresa(p.cnpj);
      return '<tr><td><a href="' + A().link("rh/extratos", { pessoa: p.pessoa, de: "2023-01-01", ate: A().D.fim_da_base }) + '">' + esc(p.pessoa) + "</a></td>" +
        "<td>" + esc(p.tipo) + "</td><td>" + esc(p.plano || F.SEM_DADO) + "</td>" + (varias ? '<td class="pequeno">' + esc(emp.razao || emp.cnpj) + "</td>" : "") + "</tr>";
    }).join("");
    return '<div class="cabecalho-tela"><h1>Minhas vidas</h1></div>' +
      '<p class="subtitulo">Quem está ativo em ' + F.data(at.dia) + ", pela data informada. " + esc(campo(c, "dependentes") || "") + ".</p>" +
      '<div class="grade-3">' +
        '<div class="cartao"><p class="rotulo">Ativas hoje</p><p class="valor-grande">' + F.numero(at.pessoas.length) + "</p></div>" +
        '<div class="cartao"><p class="rotulo">Por plano</p><p class="valor-medio">' + porPlanoEmTexto(porPlano) + "</p></div>" +
        '<div class="cartao"><p class="rotulo">Titulares e dependentes</p><p class="valor-medio">' + F.numero(porTipo.titular || 0) + " titulares · " + F.numero(porTipo.dependente || 0) + " dependentes</p></div>" +
      "</div>" +
      /* Enviar movimentação logo depois do resumo, antes da tabela (pedido da Ceci, 2026-11-17) */
      '<section class="secao cartao rh-envio" id="enviar"><h2>Enviar movimentação</h2>' +
        "<p>Três opções: adições ao plano, desligamentos ou a situação atual completa. Formatos: Excel, CSV, PDF, DOCX e MD.</p>" +
        '<p class="pequeno">O formulário pede a <strong>data em que a mudança aconteceu</strong>. ' +
          "Lembrete: o que chegar depois do dia de corte (" + esc((campo(c, "dia_de_corte") || "").toLowerCase()) + ") entra como acerto na nota seguinte.</p>" +
        '<div class="linha-botoes">' + simulado("Enviar movimentação") + "</div>" +
        '<p class="pequeno suave">Nada é gravado. É o único lugar em que a empresa envia arquivo.</p></section>' +
      '<form class="filtros rh-filtros" data-rota="rh/vidas" aria-label="Filtrar as vidas">' +
        '<label>Plano<select name="plano">' + opc("", "Todos") + planos.map(function (p) { return opc(p, p, params.plano); }).join("") + "</select></label>" +
        '<label>Tipo<select name="tipo">' + opc("", "Todos") + opc("titular", "Titular", params.tipo) + opc("dependente", "Dependente", params.tipo) + "</select></label>" +
        '<label>Pessoa<input type="text" name="pessoa" placeholder="código, ex.: P106336" value="' + esc(pessoa) + '"></label>' +
        '<div class="acoes-filtro"><button type="submit" class="botao principal">Filtrar</button> <a class="botao" href="' + A().link("rh/vidas") + '">Limpar</a></div></form>' +
      '<p class="pequeno suave">' + F.numero(lista.length) + " de " + F.numero(at.pessoas.length) + " pessoas.</p>" +
      pg.nav + (lista.length ? '<div class="rolagem"><table><thead><tr><th>Pessoa</th><th>Titular ou dependente</th><th>Plano</th>' + (varias ? "<th>Empresa</th>" : "") + "</tr></thead><tbody>" +
        linhas + "</tbody></table></div>" : A().vazio("Nenhuma pessoa com esses filtros.")) + pg.nav +
      '<div class="linha-botoes nao-imprimir"><button type="button" class="botao" data-baixar="vidas:' + esc(c.id) + '">Baixar a lista em CSV</button></div>';
  }

  /* ---------- R5 Meu perfil ---------- */
  function perfil(c) {
    var esc = A().esc;
    var linhas = [
      ["Empresa", c.empresas.map(function (e) { return e.razao_social; }).join(" · ")],
      ["CNPJ", c.empresas.map(function (e) { return e.cnpj; }).join(" · ")],
      ["Contrato", c.contrato.numero],
      ["Assinatura", campo(c, "assinatura")],
      ["Vigência", campo(c, "vigencia")],
      ["Quem conta", campo(c, "unidade_de_cobranca")],
      ["Dependentes", campo(c, "dependentes")],
      ["Preço", campo(c, "preco")],
      ["Como conta", campo(c, "contagem")],
      ["Dia de corte", campo(c, "dia_de_corte")],
      ["Qual data vale", campo(c, "data_que_vale")],
      ["Pagamento", campo(c, "pagamento")],
      ["Emissão", campo(c, "emissao")],
      ["Vencimento", campo(c, "vencimento_dias")]
    ];
    return '<div class="cabecalho-tela"><h1>Meu perfil</h1></div>' +
      '<p class="subtitulo">Dados da empresa e do contrato, como estão na ficha aprovada.</p>' +
      '<div class="rolagem"><table class="rh-perfil"><tbody>' + linhas.map(function (l) {
        return '<tr><th scope="row">' + esc(l[0]) + "</th><td>" + (l[1] === null || l[1] === undefined ? F.SEM_DADO + ' <span class="pequeno suave">o contrato não diz</span>' : esc(l[1])) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* ---------- Pesquisa do topo, só com dados da empresa do acesso (D-107) ----------
     Usa a mesma busca da Medipreço e fica só com as notas, as empresas e as pessoas deste cliente. */
  var pessoasDoCliente = null;
  function pessoasDe(c) {
    if (pessoasDoCliente) return pessoasDoCliente;
    var x = window.Extrato.filtrar({ cliente: c.id, de: "2023-01-01", ate: A().D.fim_da_base }), C = x.colunas;
    pessoasDoCliente = {};
    (x.eventos || []).forEach(function (l) { pessoasDoCliente[l[C.pessoa]] = true; });
    return pessoasDoCliente;
  }
  function pesquisa(c, params) {
    var esc = A().esc, q = params.q || "", LIMITE = 30;
    var cab = '<div class="cabecalho-tela"><h1>Pesquisa</h1></div>' +
      '<form class="filtros pesquisa-tela" data-rota="rh/pesquisa" role="search"><label>Pesquisar<input type="search" name="q" value="' + esc(q) +
      '" placeholder="NF-01306, 6.378,00 ou P106336"></label>' +
      '<div class="acoes-filtro"><button type="submit" class="botao principal">Pesquisar</button></div></form>' +
      '<p class="pequeno suave">Acha as suas notas (número ou valor), as suas empresas (nome ou CNPJ) e as pessoas do seu plano (código).</p>';
    if (!q.trim()) return cab + A().vazio("Digite o que procura.");
    var r = window.Pesquisa.procurar(q), meus = pessoasDe(c);
    var notas = r.notas.filter(function (x) { return x.nota.cliente_id === c.id; });
    var empresas = r.empresas.filter(function (x) { return x.cliente.id === c.id; });
    var pessoas = r.pessoas.filter(function (p) { return meus[p]; });
    var total = notas.length + empresas.length + pessoas.length;
    if (!total) return cab + A().vazio("Nada encontrado para “" + q + "”.");
    var blocos = [];
    if (notas.length) blocos.push('<section class="secao"><h2>Notas (' + notas.length + ')</h2><ul class="resultados">' + notas.map(function (x) {
      var n = x.nota;
      return '<li><a href="' + A().link("rh/notas/" + n.nota) + '">' + esc(n.nota) + "</a> · " + F.competencia(n.competencia) +
        ' <span class="pequeno suave">· ' + F.moeda(n.valor_emitido) + "</span></li>";
    }).join("") + "</ul></section>");
    if (empresas.length) blocos.push('<section class="secao"><h2>Empresas (' + empresas.length + ')</h2><ul class="resultados">' + empresas.map(function (x) {
      return '<li><a href="' + A().link("rh/perfil") + '">' + esc(x.empresa.razao_social) + '</a> <span class="pequeno suave">· ' + esc(x.empresa.cnpj) + "</span></li>";
    }).join("") + "</ul></section>");
    if (pessoas.length) blocos.push('<section class="secao"><h2>Pessoas (' + F.numero(pessoas.length) + ')</h2><ul class="resultados">' + pessoas.slice(0, LIMITE).map(function (p) {
      var info = A().D.pessoas[p] || [];
      return '<li><a href="' + A().link("rh/extratos", { pessoa: p, de: "2023-01-01", ate: A().D.fim_da_base }) + '">' + esc(p) + '</a> <span class="pequeno suave">· ' + esc(info[0] || "") +
        (info[1] ? " · titular " + esc(info[1]) : "") + "</span></li>";
    }).join("") + "</ul>" + (pessoas.length > LIMITE ? '<p class="pequeno suave">Mostrando ' + LIMITE + " de " + F.numero(pessoas.length) + ". Digite mais números do código.</p>" : "") + "</section>");
    return cab + '<p class="pequeno contagem-filtro">' + F.numero(total) + (total === 1 ? " resultado" : " resultados") + " para “" + esc(q) + "”.</p>" + blocos.join("");
  }

  A().registrar("rh", {
    titulo: "Empresa/RH",
    montar: function (partes, params) {
      var c = cliente();
      if (!c) return A().vazio("Cliente do acesso fictício não encontrado nos dados.");
      var qual = partes[0] || "inicio";
      if (qual === "notas" && partes[1]) return resumoDaNota(c, partes[1]);
      if (qual === "extratos") return window.Extrato.montarRh(params, c.id);
      var TELAS = { inicio: inicio, notas: notas, vidas: vidas, perfil: perfil, pesquisa: pesquisa };
      if (!TELAS[qual]) return A().naoEncontrado("Tela não encontrada.", "rh/inicio", "Ir para o Início");
      return TELAS[qual](c, params || {});
    }
  });
})();
