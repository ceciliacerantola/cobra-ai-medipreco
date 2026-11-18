/* Tela M4 — Extratos, com dado de verdade (lote E, tarefa 24).
   Visão geral e eventos de um período livre, com as duas datas e a marca de "atrasado".
   Avisos para período inválido ou fora da base. Os filtros ficam no endereço (voltar funciona). */
(function () {
  "use strict";
  var F = window.Formato;
  var POR_VEZ = 50;
  function A() { return window.App; }

  /* período padrão: o mês anterior ao "hoje" da base (hoje 12/11/2026 -> outubro de 2026) */
  function periodoPadrao(hoje) {
    var ano = +hoje.slice(0, 4), mes = +hoje.slice(5, 7) - 1;
    if (mes === 0) { mes = 12; ano--; }
    var ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    var mm = (mes < 10 ? "0" : "") + mes;
    return { de: ano + "-" + mm + "-01", ate: ano + "-" + mm + "-" + ultimo };
  }

  function dataValida(t) { return /^\d{4}-\d{2}-\d{2}$/.test(t || ""); }

  /* devolve { erro } ou { eventos, filtros } — usado pela tela e pelo CSV (o mesmo filtro, o mesmo total) */
  function filtrar(params) {
    var D = A().D, I = A().I;
    var pad = periodoPadrao(D.hoje);
    var f = {
      cliente: params.cliente || "", empresa: params.empresa || "", pessoa: (params.pessoa || "").toUpperCase(),
      tipo: params.tipo || "", por: params.por === "processamento" ? "processamento" : "informada",
      de: params.de || pad.de, ate: params.ate || pad.ate
    };
    if (!dataValida(f.de) || !dataValida(f.ate)) return { filtros: f, erro: "Data em formato inválido. Use o seletor de data." };
    if (f.de > f.ate) return { filtros: f, erro: "Período inválido: o início (" + F.data(f.de) + ") é depois do fim (" + F.data(f.ate) + ")." };

    var C = {};
    D.eventos.colunas.forEach(function (nome, i) { C[nome] = i; });
    var primeiro = null;
    D.eventos.linhas.forEach(function (l) { var d = String(l[C.informada]); if (!primeiro || d < primeiro) primeiro = d; });
    if (f.de > D.fim_da_base) return { filtros: f, erro: "Período fora da base: a base vai até " + F.data(D.fim_da_base) + "." };
    if (f.ate < primeiro.slice(0, 10)) return { filtros: f, erro: "Período fora da base: o primeiro evento é de " + F.data(primeiro) + "." };

    var cnpjsDoCliente = null;
    if (f.cliente && I.cliente[f.cliente]) cnpjsDoCliente = I.cliente[f.cliente].empresas.map(function (e) { return e.cnpj; });
    var eventos = D.eventos.linhas.filter(function (l) {
      var cnpj = I.cnpj[l[C.cnpj]];
      if (cnpjsDoCliente && cnpjsDoCliente.indexOf(cnpj) < 0) return false;
      if (f.empresa && cnpj !== f.empresa) return false;
      if (f.pessoa && l[C.pessoa] !== f.pessoa) return false;
      if (f.tipo && l[C.tipo] !== f.tipo) return false;
      var d = String(l[f.por === "processamento" ? C.processamento : C.informada]).slice(0, 10);
      return d >= f.de && d <= f.ate;
    });
    eventos.sort(function (a, b) {
      var x = String(a[f.por === "processamento" ? C.processamento : C.informada]), y = String(b[f.por === "processamento" ? C.processamento : C.informada]);
      return x === y ? a[C.id] - b[C.id] : (x < y ? -1 : 1);
    });
    var parcial = f.ate > D.fim_da_base ? "O período passa do fim da base (" + F.data(D.fim_da_base) + "): depois dessa data não há eventos." : null;
    return { filtros: f, eventos: eventos, colunas: C, parcial: parcial };
  }

  function opcoes(lista, atual) {
    return lista.map(function (o) {
      return '<option value="' + A().esc(o.valor) + '"' + (o.valor === (atual || "") ? " selected" : "") + ">" + A().esc(o.rotulo) + "</option>";
    }).join("");
  }

  /* Na visão Empresa/RH (lote J, tarefa 43) o extrato fica preso ao cliente do acesso: sem filtro de cliente,
     empresas só as dele (o filtro aparece se houver mais de uma) e os links em #/rh/extratos. */
  var RH = null;
  function rota() { return RH ? "rh/extratos" : "extratos"; }

  function formulario(f) {
    var D = A().D, I = A().I;
    var empresas = [];
    D.clientes.forEach(function (c) {
      if (RH && c.id !== RH) return;
      c.empresas.forEach(function (e) { empresas.push({ valor: e.cnpj, rotulo: e.razao_social + " · " + e.cnpj }); });
    });
    return '<form class="filtros" data-rota="' + rota() + '" aria-label="Filtrar o extrato">' +
      (RH ? "" : '<label>Cliente<select name="cliente">' + opcoes([{ valor: "", rotulo: "Todos" }].concat(D.clientes.map(function (c) { return { valor: c.id, rotulo: c.nome }; })), f.cliente) + "</select></label>") +
      (RH && empresas.length < 2 ? "" : '<label>Empresa (CNPJ)<select name="empresa">' + opcoes([{ valor: "", rotulo: "Todas" }].concat(empresas), f.empresa) + "</select></label>") +
      '<label>Pessoa<input type="text" name="pessoa" placeholder="código, ex.: P685600" value="' + A().esc(f.pessoa) + '"></label>' +
      '<label>Evento<select name="tipo">' + opcoes([{ valor: "", rotulo: "Todos" }, { valor: "entrada", rotulo: "Entrada" }, { valor: "saida", rotulo: "Saída" }, { valor: "troca_plano", rotulo: "Troca de plano" }], f.tipo) + "</select></label>" +
      '<label>De<input type="date" name="de" value="' + A().esc(f.de) + '"></label>' +
      '<label>Até<input type="date" name="ate" value="' + A().esc(f.ate) + '"></label>' +
      '<label>Período pela<select name="por">' + opcoes([{ valor: "informada", rotulo: "data informada (quando aconteceu)" }, { valor: "processamento", rotulo: "data de processamento (quando entrou no sistema)" }], f.por) + "</select></label>" +
      '<div class="acoes-filtro"><button type="submit" class="botao principal">Mostrar</button> <a class="botao" href="' + A().link(rota()) + '">Limpar</a></div>' +
      "</form>" + (I ? "" : "");
  }

  function descricao(f) {
    var I = A().I, partes = [];
    partes.push(f.cliente && I.cliente[f.cliente] ? I.cliente[f.cliente].nome : "Todos os clientes");
    if (f.empresa) partes.push(A().empresa(f.empresa).razao || f.empresa);
    if (f.pessoa) partes.push("pessoa " + f.pessoa);
    partes.push(F.data(f.de) + " a " + F.data(f.ate));
    partes.push("pela data " + (f.por === "processamento" ? "de processamento" : "informada"));
    return partes.join(" · ");
  }

  function montar(partes, params) {
    if (RH) {
      var proprio = {};
      Object.keys(params).forEach(function (k) { proprio[k] = params[k]; });
      proprio.cliente = RH; /* o endereço não troca o cliente do acesso */
      var minhas = A().I.cliente[RH].empresas.map(function (e) { return e.cnpj; });
      if (proprio.empresa && minhas.indexOf(proprio.empresa) < 0) delete proprio.empresa;
      params = proprio;
    }
    var r = filtrar(params);
    var f = r.filtros, esc = A().esc;
    var topo = '<div class="cabecalho-tela"><h1>' + (RH ? "Meus extratos" : "Extratos") + "</h1></div>" +
      '<p class="subtitulo">A movimentação de um período: quem entrou, quem saiu e quem trocou de plano. Cada evento mostra duas datas: quando aconteceu (data informada) e quando entrou no sistema (data de processamento).</p>' +
      '<section class="secao"><h2>Filtrar e pesquisar</h2>' + formulario(f) + "</section>";
    if (r.erro) return topo + '<section class="secao"><div class="vazio" role="alert">' + esc(r.erro) + "</div></section>";

    var C = r.colunas, ev = r.eventos;
    var conta = { entrada: 0, saida: 0, troca_plano: 0 }, atrasados = 0, desfeitos = 0;
    ev.forEach(function (l) {
      conta[l[C.tipo]] = (conta[l[C.tipo]] || 0) + 1;
      if (F.atrasado(l[C.informada], l[C.processamento])) atrasados++;
      if (l[C.desfeito]) desfeitos++;
    });
    var saldo = conta.entrada - conta.saida;
    var resumo = '<p class="pequeno suave periodo">' + esc(descricao(f)) + "</p>" +
      (r.parcial ? '<p class="pequeno aviso-parcial">' + esc(r.parcial) + "</p>" : "") +
      '<div class="grade-3">' +
      '<div class="cartao"><p class="rotulo">Entradas</p><p class="valor-grande">' + F.numero(conta.entrada) + "</p></div>" +
      '<div class="cartao"><p class="rotulo">Saídas</p><p class="valor-grande">' + F.numero(conta.saida) + "</p></div>" +
      '<div class="cartao"><p class="rotulo">Trocas de plano</p><p class="valor-grande">' + F.numero(conta.troca_plano) + "</p></div>" +
      '<div class="cartao"><p class="rotulo">Saldo de vínculos</p><p class="valor-grande">' + (saldo > 0 ? "+ " : saldo < 0 ? "− " : "") + F.numero(Math.abs(saldo)) + '</p><p class="pequeno suave">entradas menos saídas</p></div>' +
      '<div class="cartao"><p class="rotulo">Atrasados ' + A().alerta("i", "o que é", "<p>Evento com a data informada num mês e o processamento em outro. É o que vira acerto na nota seguinte.</p>") +
        '</p><p class="valor-grande">' + F.numero(atrasados) + "</p></div>" +
      (desfeitos ? '<div class="cartao"><p class="rotulo">Em inclusão desfeita</p><p class="valor-grande">' + F.numero(desfeitos) + '</p><p class="pequeno suave">regra dos 5 dias (D-077)</p></div>' : "") +
      "</div>";

    var pg = A().paginar(ev, params.pagina, POR_VEZ, rota(), RH ? semCliente(f) : f);
    var linhas = pg.fatia.map(function (l) {
      var emp = A().empresa(l[C.cnpj]);
      var atraso = F.atrasado(l[C.informada], l[C.processamento]);
      return '<tr><td><a href="' + A().link(rota(), { pessoa: l[C.pessoa], de: "2023-01-01", ate: A().D.fim_da_base }) + '">' + esc(l[C.pessoa]) + "</a></td>" +
        '<td class="pequeno">' + esc(emp.razao || emp.cnpj) + "</td><td>" + F.tipoEvento(l[C.tipo]) + (l[C.desfeito] ? " " + A().alerta("i", "inclusão desfeita") : "") +
        "</td><td>" + esc(l[C.plano] || F.SEM_DADO) + "</td><td>" + F.data(l[C.informada]) + "</td><td>" + F.dataHora(l[C.processamento]) +
        (atraso ? ' <span class="pilula">atrasado</span>' : "") + '</td><td><span class="pilula">' + F.origem(l[C.origem]) + "</span></td></tr>";
    }).join("");

    var lista = ev.length
      ? pg.nav + '<div class="rolagem"><table><thead><tr><th>Pessoa</th><th>Empresa</th><th>Evento</th><th>Plano</th><th>Data informada</th><th>Data de processamento</th><th>Origem</th></tr></thead><tbody>' +
        linhas + "</tbody></table></div>" + pg.nav
      : A().vazio("Nenhuma movimentação no período.");

    var q = [];
    Object.keys(f).forEach(function (k) { if (f[k]) q.push(k + "=" + encodeURIComponent(f[k])); });
    return topo +
      '<section class="secao"><h2>Visão geral</h2>' + resumo + "</section>" +
      '<section class="secao"><h2>Eventos</h2>' + lista + "</section>" +
      '<section class="secao nao-imprimir"><h2>Baixar</h2><div class="linha-botoes">' +
        '<button type="button" class="botao" data-baixar="extrato:' + esc(q.join("&")) + '"' + (ev.length ? "" : " disabled") + ">Extrato em CSV</button>" +
        '<button type="button" class="botao" data-imprimir>Extrato em PDF (imprimir)</button>' +
        '<button type="button" class="botao" data-simulado="Na versão real, o arquivo iria por e-mail para o contato do cliente, depois de alguém do financeiro conferir.">Enviar por e-mail</button> ' + A().etiqueta("simulado") + "</div>" +
        '<p class="pequeno suave">O CSV traz todos os ' + F.numero(ev.length) + " eventos do filtro, não só a página que aparece.</p></section>";
  }

  function semCliente(f) { var g = {}; Object.keys(f).forEach(function (k) { if (k !== "cliente") g[k] = f[k]; }); return g; }

  window.Extrato = {
    filtrar: filtrar,
    montarRh: function (params, cliente) { RH = cliente; try { return montar([], params); } finally { RH = null; } }
  };
  window.App.registrar("extratos", { titulo: "Extratos", montar: montar });
})();
