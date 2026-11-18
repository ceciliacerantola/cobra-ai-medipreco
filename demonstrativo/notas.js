/* Tela M3 — Notas, com dado de verdade (lote E, tarefas 18 a 21).
   Lista com filtros; a nota em camadas: total, a conta, as pessoas (50 por vez) e os eventos da pessoa.
   Botão foto do dia de corte / vídeo do mês. Explicação da diferença com os números do cálculo. */
(function () {
  "use strict";
  var F = window.Formato;
  var POR_VEZ = 50;
  function A() { return window.App; }
  function X() { return window.Explica; }

  /* as três abas da tela Notas; usadas também por notas-a-emitir/ (lote F, tarefa 31) */
  function abas(ativa) {
    ativa = ativa || "notas";
    var itens = [["notas", "Emitidas"], ["notas-a-emitir", "A emitir"], ["notas-como-emitir", "Como emitir"]];
    return '<nav class="abas" aria-label="Notas">' + itens.map(function (i) {
      return '<a class="aba' + (i[0] === ativa ? ' ativa" aria-current="page' : "") + '" href="#/' + i[0] + '">' + i[1] + "</a>";
    }).join("") + "</nav>";
  }
  window.App.abasDasNotas = abas;

  function temPendente(n) {
    return A().alertasDaNota(n).some(function (x) { return x.alerta.tipo === "!"; });
  }

  function opcoes(lista, atual) {
    return lista.map(function (o) {
      return '<option value="' + A().esc(o.valor) + '"' + (o.valor === (atual || "") ? " selected" : "") + ">" + A().esc(o.rotulo) + "</option>";
    }).join("");
  }

  function lista(params) {
    var D = A().D, esc = A().esc;
    var comps = [];
    D.notas.forEach(function (n) { if (comps.indexOf(n.competencia) < 0) comps.push(n.competencia); });
    comps.sort().reverse();

    var filtradas = D.notas.filter(function (n) {
      if (params.cliente && n.cliente_id !== params.cliente) return false;
      if (params.competencia && n.competencia !== params.competencia) return false;
      if (params.situacao === "pendentes" && !temPendente(n)) return false;
      if (params.situacao === "com_diferenca" && !(n.calculada && n.diferenca !== 0)) return false;
      if (params.situacao === "sem_calculo" && n.calculada) return false;
      return true;
    });

    var filtros = '<form class="filtros" data-rota="notas" aria-label="Filtrar notas">' +
      '<label>Cliente<select name="cliente">' + opcoes([{ valor: "", rotulo: "Todos" }].concat(D.clientes.map(function (c) { return { valor: c.id, rotulo: c.nome }; })), params.cliente) + "</select></label>" +
      '<label>Competência<select name="competencia">' + opcoes([{ valor: "", rotulo: "Todas" }].concat(comps.map(function (c) { return { valor: c, rotulo: F.competencia(c) }; })), params.competencia) + "</select></label>" +
      '<label>Situação<select name="situacao">' + opcoes([
        { valor: "", rotulo: "Todas" }, { valor: "pendentes", rotulo: "Notas pendentes (!)" },
        { valor: "com_diferenca", rotulo: "Com diferença" }, { valor: "sem_calculo", rotulo: "Sem cálculo" }], params.situacao) + "</select></label>" +
      '<div class="acoes-filtro"><button type="submit" class="botao principal">Filtrar</button> <a class="botao" href="' + A().link("notas") + '">Limpar</a></div>' +
      "</form>";

    var grupos = {}, ordem = [];
    filtradas.slice().sort(function (a, b) {
      return a.competencia === b.competencia ? (a.nota < b.nota ? -1 : 1) : (a.competencia < b.competencia ? 1 : -1);
    }).forEach(function (n) {
      if (!grupos[n.competencia]) { grupos[n.competencia] = []; ordem.push(n.competencia); }
      grupos[n.competencia].push(n);
    });
    var corpo = ordem.map(function (comp) {
      var itens = grupos[comp].map(function (n) {
        var c = A().I.cliente[n.cliente_id];
        var direita = n.calculada
          ? '<span class="num"><strong>' + F.moeda(n.valor_emitido) + '</strong><br><span class="pequeno ' + (n.diferenca === 0 ? "suave" : "") + '">' + F.acerto(n.diferenca) + "</span></span>"
          : '<span class="num"><strong>' + F.moeda(n.valor_emitido) + '</strong><br><span class="pequeno suave">aguardando ' + F.data((n.motivo || {}).dia_necessario) + "</span></span>";
        return '<li><a class="item-link" href="' + A().link("notas/" + n.nota) + '"><span class="item">' +
          "<span><strong>" + esc(n.nota) + "</strong> · " + esc(n.tomador) + (temPendente(n) ? " " + A().alerta("!", "pendente") : "") +
            '<br><span class="pequeno suave">emitida em ' + F.data(n.emissao) + " · " + F.numero(n.quantidade_emitida) + " " + X().quem(c, n.quantidade_emitida) + " cobradas</span></span>" +
          direita + "</span></a></li>";
      }).join("");
      return '<section class="secao"><h2>Competência: ' + F.competencia(comp) + '</h2><ul class="linha-do-tempo">' + itens + "</ul></section>";
    }).join("");

    return '<div class="cabecalho-tela"><h1>Notas</h1></div>' +
      '<p class="subtitulo">A competência é o mês que a nota cobra; a data de emissão é o dia em que ela saiu. Clique em uma nota para ver de onde veio cada número.</p>' +
      abas() + filtros +
      '<p class="pequeno suave contagem-filtro">' + F.numero(filtradas.length) + " de " + F.numero(D.notas.length) + " notas.</p>" +
      (corpo || A().vazio("Nenhuma nota com esses filtros."));
  }

  /* ---------- tarefa 42: caminho da nota (D-069, sem pagamento: D-099) ---------- */
  /* As datas vêm prontas de dados.js (bloco `caminho`); aqui só se escreve a frase. */
  function fraseDoAcerto(a) {
    var esc = A().esc;
    if (!a) return F.SEM_DADO;
    if (a.situacao === "nao_calculada") return "Sem cálculo, sem acerto por enquanto.";
    if (a.situacao === "sem_diferenca") return "Sem acerto: a nota bate com a regra.";
    var o = (a.tipo === "credito" ? "Crédito" : "Débito") + " de " + F.moeda(a.valor);
    if (a.situacao === "na_previa") {
      return o + " entra na nota de " + F.competencia(a.competencia) +
        (a.entrava_em && a.entrava_em !== a.competencia ? " (a de " + F.competencia(a.entrava_em) + " já tinha saído)" : "") + ".";
    }
    if (a.situacao === "nao_acertada") {
      return o + ": diferença de meses passados, não acertada. A nota de " + F.competencia(a.competencia) + " (" + esc(a.nota_que_saiu) + ") saiu sem ela.";
    }
    return o + " entra na nota de " + F.competencia(a.competencia) + ".";
  }

  /* Faixa do caminho retirada a pedido da Ceci (D-102; versão antiga em _arquivo/2026-11-17-notas-com-faixa-do-caminho.js).
     Fica só o que era novo: o selo de situação ao lado do número e o vencimento, quando o contrato define o prazo. */
  function etapasDaNota(n) {
    var e = {};
    (n.caminho || []).forEach(function (x) { e[x.etapa] = x; });
    return e;
  }

  function seloDaNota(n) {
    var e = etapasDaNota(n), a = e.acerto || {}, v = e.vencimento || {};
    if (!n.caminho) return "";
    if (v.dia && !v.feito) return '<span class="selo-situacao a-vir">Próximo passo: vencimento em ' + F.data(v.dia) + "</span>";
    if (a.situacao === "na_previa" || a.situacao === "a_vir") return '<span class="selo-situacao a-vir">Próximo passo: acerto na nota de ' + F.competencia(a.competencia) + "</span>";
    if (a.situacao === "nao_acertada") return '<span class="selo-situacao">Nota emitida · diferença não acertada</span>';
    if (a.situacao === "nao_calculada") return '<span class="selo-situacao">Nota emitida · sem cálculo</span>';
    return '<span class="selo-situacao">✓ Nota concluída</span>';
  }

  function linhaDoVencimento(n) {
    var v = etapasDaNota(n).vencimento;
    if (!v || !v.dia) return "";
    return "<div><dt>Vencimento</dt><dd>" + F.data(v.dia) + ' <span class="pequeno suave">(' + v.dias + " dias depois da emissão, cláusula " + A().esc(v.clausula) + ")</span></dd></div>";
  }

  /* ---------- tarefa 40: por que mudou desde o mês passado (D-093: pelas pessoas da regra) ---------- */
  function listaDePessoas(n, codigos, rotulo, trocas) {
    var esc = A().esc;
    if (!codigos.length) return '<div class="grupo-mudanca vazio"><p class="rotulo">' + rotulo + '</p><p class="valor-medio">0</p></div>';
    var itens = codigos.map(function (p) {
      var cod = trocas ? p[0] : p;
      return '<li><a href="' + A().link("notas/" + n.nota, { pessoa: cod }) + '">' + esc(cod) + "</a>" +
        (trocas ? ' <span class="pequeno suave">' + esc(p[1]) + " → " + esc(p[2]) + "</span>" : "") + "</li>";
    }).join("");
    return '<details class="grupo-mudanca"><summary><span class="rotulo">' + rotulo + '</span><span class="valor-medio">' + F.numero(codigos.length) +
      '</span><span class="pequeno abrir">ver quem</span></summary><ul class="pessoas-mudanca">' + itens + "</ul></details>";
  }

  function porQueMudou(n, c) {
    var v = n.variacao, esc = A().esc;
    var h = '<h3 class="sub">Por que mudou desde o mês passado</h3>';
    if (!n.calculada || !v) return h + '<p class="pequeno suave">Sem cálculo, sem comparação com o mês anterior.</p>';
    var dif = v.quantidade_atual - v.quantidade_anterior;
    var varias = c.empresas.length > 1 && c.metodo === "maximo_do_mes";
    var anterior = A().I.notasDoCliente[c.id].filter(function (x) { return x.competencia === v.competencia_anterior && x.cnpj === n.cnpj; })[0];
    var frase = "Pela regra" + (varias ? ", nesta empresa" : "") + ": " + F.numero(v.quantidade_anterior) + " " + X().quem(c, v.quantidade_anterior) + " em " +
      F.competencia(v.competencia_anterior) + " e " + F.numero(v.quantidade_atual) + " em " + F.competencia(n.competencia) +
      (dif === 0 ? ", a mesma quantidade." : " (" + (dif > 0 ? "+" : "−") + F.numero(Math.abs(dif)) + ").");
    var extra = "";
    if (c.metodo === "proporcional_aos_dias") {
      extra = "Aqui se contam pessoas. A conta cobra " + F.fracao(n.quantidade_pela_regra) + " mensalidades, porque cada pessoa entra pelos dias em que esteve ativa no mês.";
    } else if (n.quantidade_pela_regra !== v.quantidade_atual) {
      extra = "A conta cobra " + F.numero(n.quantidade_pela_regra) + ", e não " + F.numero(v.quantidade_atual) + ": vale o mínimo garantido do contrato.";
    }
    var emitidos = '<p class="pequeno">Valor emitido: ' + F.competencia(v.competencia_anterior) + " " +
      (anterior ? "<strong>" + F.moeda(anterior.valor_emitido) + '</strong> (<a href="' + A().link("notas/" + anterior.nota) + '">' + esc(anterior.nota) + "</a>)"
        : F.SEM_DADO + " (sem nota na base; a comparação usa a contagem pela regra)") +
      " · " + F.competencia(n.competencia) + " <strong>" + F.moeda(n.valor_emitido) + "</strong></p>";
    return h + '<p class="regra-frase">' + frase + "</p>" +
      '<div class="grade-mudancas">' + listaDePessoas(n, v.entradas, "Entraram") + listaDePessoas(n, v.saidas, "Saíram") +
        (v.trocas.length || /por plano/.test(c.modelo) ? listaDePessoas(n, v.trocas, "Trocaram de plano", true) : "") + "</div>" +
      (extra ? '<p class="pequeno">' + extra + "</p>" : "") + emitidos;
  }

  /* ---------- camadas da nota ---------- */
  function camadaTotal(n, c) {
    if (!n.calculada) {
      return '<div class="grade-3"><div class="cartao"><p class="rotulo">Valor emitido</p><p class="valor-grande">' + F.moeda(n.valor_emitido) + '</p><p class="pequeno suave">' +
        F.numero(n.quantidade_emitida) + " " + X().quem(c, n.quantidade_emitida) + " cobrados</p></div>" +
        '<div class="cartao"><p class="rotulo">Valor pela regra do contrato</p><p class="valor-grande">' + F.SEM_DADO + '</p><p class="pequeno suave">não calculada: aguardando ' +
        F.data((n.motivo || {}).dia_necessario) + "</p></div></div>" +
        '<div class="cartao aviso-sem-calculo">' + X().semCalculo(n, c) + "</div>" + porQueMudou(n, c);
    }
    var qr = c.metodo === "proporcional_aos_dias" ? F.fracao(n.quantidade_pela_regra) + " mensalidades" : F.numero(n.quantidade_pela_regra) + " " + X().quem(c, n.quantidade_pela_regra);
    return '<div class="grade-3">' +
      '<div class="cartao"><p class="rotulo">Valor emitido</p><p class="valor-grande">' + F.moeda(n.valor_emitido) + '</p><p class="pequeno suave">' +
        F.numero(n.quantidade_emitida) + " " + X().quem(c, n.quantidade_emitida) + " cobradas</p></div>" +
      '<div class="cartao"><p class="rotulo">Valor pela regra do contrato</p><p class="valor-grande">' + F.moeda(n.valor_pela_regra) + '</p><p class="pequeno suave">' + qr + " pela regra</p></div>" +
      '<div class="cartao"><p class="rotulo">Diferença</p><p class="valor-grande">' + F.diferenca(n.diferenca) + '</p><p class="pequeno suave">' +
        (n.diferenca === 0 ? "sem acerto" : fraseDoAcerto((n.caminho || []).filter(function (x) { return x.etapa === "acerto"; })[0])) + "</p></div></div>" +
      porQueMudou(n, c);
  }

  function camadaConta(n, c) {
    var esc = A().esc;
    var emitidas = n.linhas_emitidas.map(function (l) {
      return "<tr><td>" + esc(l.item) + '</td><td class="num">' + F.numero(l.quantidade) + '</td><td class="num">' + F.moeda(l.unitario) + '</td><td class="num">' + F.moeda(l.valor) + "</td></tr>";
    }).join("");
    var tabelaEmitida = '<h3 class="sub">Como a nota foi emitida</h3><div class="rolagem"><table><thead><tr><th>Item</th><th class="num">Quantidade</th><th class="num">Preço</th><th class="num">Valor</th></tr></thead><tbody>' +
      emitidas + '</tbody><tfoot><tr><td>Total</td><td></td><td></td><td class="num destaque-linha">' + F.moeda(n.valor_emitido) + "</td></tr></tfoot></table></div>" +
      '<p class="pequeno suave nota-de-rodape">Base da cobrança: ' + esc((n.linhas_emitidas[0] || {}).base || F.SEM_DADO) + ". Contagem em " + F.dataHora(n.contagem_em) + ".</p>";
    if (!n.calculada) return tabelaEmitida;

    var regra = n.itens_pela_regra.map(function (i) {
      var q = c.metodo === "proporcional_aos_dias" ? F.fracao(i.quantidade) : F.numero(i.quantidade);
      return "<tr><td>" + esc(i.descricao) + (i.cnpj ? '<br><span class="pequeno suave">' + esc(i.cnpj) + "</span>" : "") + '</td><td class="num">' + q +
        '</td><td class="num">' + F.moeda(i.unitario) + '</td><td class="num">' + F.moeda(i.valor) + "</td></tr>";
    }).join("");
    var regras = X().regrasAplicadas(n, c);
    return tabelaEmitida +
      '<h3 class="sub">Como fica pela regra do contrato</h3>' +
      '<p class="regra-frase">' + X().comoARegraConta(n, c) + "</p>" +
      '<div class="rolagem"><table><thead><tr><th>Item</th><th class="num">Quantidade</th><th class="num">Preço</th><th class="num">Valor</th></tr></thead><tbody>' +
      regra + '</tbody><tfoot><tr><td>Total</td><td></td><td></td><td class="num destaque-linha">' + F.moeda(n.valor_pela_regra) + "</td></tr></tfoot></table></div>" +
      (regras.length ? '<div class="regras-aplicadas"><p class="rotulo">Regras aplicadas nesta conta</p>' + regras.map(function (r) { return "<div>" + r + "</div>"; }).join("") + "</div>" : "") +
      '<div class="cartao explicacao">' + X().porQueDeuDiferente(n, c) + "</div>";
  }

  function linhasDePessoas(n) {
    var C = A().I.colunas;
    return n.pessoas.map(function (l) {
      return {
        pessoa: l[C.pessoa], tipo: l[C.tipo], cnpj: l[C.cnpj], plano: l[C.plano], na_foto: l[C.na_foto] === 1, na_regra: l[C.na_regra] === 1,
        dias: l[C.dias], motivo: l[C.motivo], informada: l[C.informada], processamento: l[C.processamento], plano_na_foto: l[C.plano_na_foto]
      };
    });
  }

  function camadaPessoas(n, c, params) {
    if (!n.calculada) return A().vazio("Sem cálculo, sem a lista de pessoas pela regra. A nota mostra só o que foi emitido.");
    var ver = params.ver === "foto" ? "foto" : "video";
    var todas = linhasDePessoas(n);
    var comDiferenca = todas.filter(function (p) { return p.motivo; });
    var filtro = params.filtro || (comDiferenca.length ? "diferenca" : "todas");
    var lista = filtro === "diferenca" ? comDiferenca : todas.filter(function (p) { return ver === "foto" ? p.na_foto : p.na_regra; });
    var caminho = "notas/" + n.nota;
    var base = { ver: ver, filtro: filtro, pessoa: params.pessoa };
    var pg = A().paginar(lista, params.pagina, POR_VEZ, caminho, base);
    var esc = A().esc, varias = c.empresas.length > 1;

    function opc(valor, rotulo, qtd) {
      var ativo = filtro === valor;
      return '<a class="botao' + (ativo ? " principal" : "") + '" aria-pressed="' + ativo + '" href="' +
        A().link(caminho, { ver: ver, filtro: valor }) + '">' + rotulo + " (" + F.numero(qtd) + ")</a>";
    }
    var naVisao = todas.filter(function (p) { return ver === "foto" ? p.na_foto : p.na_regra; }).length;
    var escolha = '<div class="linha-botoes filtro-pessoas" role="group" aria-label="Quais pessoas">' +
      opc("diferenca", "Só as que fazem a diferença", comDiferenca.length) +
      opc("todas", ver === "foto" ? "Todas na foto" : "Todas pela regra", naVisao) + "</div>";

    var linhas = pg.fatia.map(function (p) {
      var sel = params.pessoa === p.pessoa;
      var emp = A().empresa(p.cnpj);
      return "<tr" + (sel ? ' class="selecionada"' : "") + '><td><a href="' + A().link(caminho, { ver: ver, filtro: filtro, pagina: pg.pagina, pessoa: p.pessoa }) + '">' +
        esc(p.pessoa) + "</a></td><td>" + esc(p.tipo || F.SEM_DADO) + "</td>" +
        (varias ? '<td class="pequeno">' + esc(emp.razao || emp.cnpj || F.SEM_DADO) + "</td>" : "") +
        "<td>" + esc(p.plano || F.SEM_DADO) + "</td><td>" + (p.na_foto ? "sim" : "não") + "</td><td>" +
        (c.metodo === "proporcional_aos_dias" && p.na_regra ? F.numero(p.dias) + (p.dias === 1 ? " dia" : " dias") : (p.na_regra ? "sim" : "não")) + "</td>" +
        '<td class="pequeno">' + X().motivo(p.motivo, p, n, c) + "</td></tr>";
    }).join("");

    return escolha + pg.nav +
      (lista.length ? '<div class="rolagem"><table><thead><tr><th>Pessoa</th><th>Tipo</th>' + (varias ? "<th>Empresa</th>" : "") +
        "<th>Plano</th><th>Na foto</th><th>" + (c.metodo === "proporcional_aos_dias" ? "Dias pela regra" : "Pela regra") + "</th><th>Por quê</th></tr></thead><tbody>" +
        linhas + "</tbody></table></div>" : A().vazio("Nenhuma pessoa nesta lista.")) + pg.nav;
  }

  /* C6: os eventos de uma pessoa, separados por empresa */
  function camadaEventos(n, params) {
    var esc = A().esc;
    if (!params.pessoa) return A().vazio("Clique no código de uma pessoa para ver os eventos dela, com as duas datas e a origem.");
    var evs = A().eventosDaPessoa(params.pessoa);
    if (!evs.length) return A().vazio("Pessoa " + params.pessoa + " sem eventos na base.");
    var C = A().I.colunaDoEvento, D = A().D;
    var info = D.pessoas[params.pessoa] || [];
    var porEmpresa = {}, ordem = [];
    evs.forEach(function (l) {
      var k = l[C.cnpj];
      if (!porEmpresa[k]) { porEmpresa[k] = []; ordem.push(k); }
      porEmpresa[k].push(l);
    });
    var blocos = ordem.map(function (k) {
      var emp = A().empresa(k);
      var linhas = porEmpresa[k].map(function (l) {
        var atraso = F.atrasado(l[C.informada], l[C.processamento]);
        var depois = String(l[C.processamento]) > String(n.contagem_em);
        return "<tr><td>" + F.tipoEvento(l[C.tipo]) + (l[C.desfeito] ? " " + A().alerta("i", "inclusão desfeita") : "") + "</td><td>" + esc(l[C.plano] || F.SEM_DADO) +
          "</td><td>" + F.data(l[C.informada]) + "</td><td>" + F.dataHora(l[C.processamento]) +
          (atraso ? ' <span class="pilula">atrasado</span>' : "") + (depois ? ' <span class="pilula">depois da contagem</span>' : "") +
          '</td><td><span class="pilula">' + F.origem(l[C.origem]) + "</span></td></tr>";
      }).join("");
      return '<h3 class="sub">' + esc(emp.razao || F.SEM_DADO) + ' <span class="pequeno suave">' + esc(emp.cnpj || "") + "</span></h3>" +
        '<div class="rolagem"><table><thead><tr><th>Evento</th><th>Plano</th><th>Data informada</th><th>Data de processamento</th><th>Origem</th></tr></thead><tbody>' + linhas + "</tbody></table></div>";
    }).join("");
    return '<p class="pequeno">Pessoa <strong>' + esc(params.pessoa) + "</strong> · " + esc(info[0] || F.SEM_DADO) + (info[1] ? " · titular " + esc(info[1]) : "") +
      (ordem.length > 1 ? " · aparece em " + ordem.length + " empresas" : "") +
      ' · <a href="' + A().link("extratos", { pessoa: params.pessoa, de: "2023-01-01", ate: D.fim_da_base }) + '">ver no extrato</a></p>' + blocos;
  }

  /* uma frase sobre quem está só de um lado; sem diferença, diz que bate */
  function diferencaEmPalavras(ver, soNaFoto, soNoVideo) {
    function pessoas(q) { return F.numero(q) + (q === 1 ? " pessoa" : " pessoas"); }
    if (!soNaFoto && !soNoVideo) return '<p class="pequeno"><strong>Foto e vídeo têm as mesmas pessoas.</strong></p>';
    var frases = [];
    if (ver === "foto") {
      if (soNaFoto) frases.push("Inclui " + pessoas(soNaFoto) + " que, pela regra, não contam.");
      if (soNoVideo) frases.push("Faltam " + pessoas(soNoVideo) + " que, pela regra, contam.");
    } else {
      if (soNaFoto) frases.push("Não inclui " + pessoas(soNaFoto) + " que estavam na foto: pela regra, não contam.");
      if (soNoVideo) frases.push("Inclui " + pessoas(soNoVideo) + " que não estavam na foto: pela regra, contam.");
    }
    return '<p class="pequeno"><strong>' + frases.join(" ") + "</strong> O porquê está no fim de “2. A conta”, e a lista em “3. As pessoas”.</p>";
  }

  /* C5: foto do dia de corte × vídeo do mês. O quadro muda inteiro com o botão. */
  function fotoVideo(n, c, params) {
    var ver = params.ver === "foto" ? "foto" : "video";
    var caminho = "notas/" + n.nota, filtro = params.filtro, esc = A().esc;
    var botoes = '<div class="linha-botoes foto-video" role="group" aria-label="Foto ou vídeo">' +
      '<a class="botao' + (ver === "foto" ? " principal" : "") + '" aria-pressed="' + (ver === "foto") + '" href="' + A().link(caminho, { ver: "foto", filtro: filtro }) + '">Foto do dia de corte</a>' +
      '<a class="botao' + (ver === "video" ? " principal" : "") + '" aria-pressed="' + (ver === "video") + '" href="' + A().link(caminho, { ver: "video", filtro: filtro }) + '">Vídeo do mês</a>' +
      X().glossario() + "</div>";
    if (!n.calculada) return botoes + '<p class="pequeno suave">Sem cálculo: só a foto existe por enquanto (a nota emitida).</p>';

    var pessoas = linhasDePessoas(n);
    var soNaFoto = pessoas.filter(function (p) { return p.na_foto && !p.na_regra; }).length;
    var soNoVideo = pessoas.filter(function (p) { return p.na_regra && !p.na_foto; }).length;
    var fracao = c.metodo === "proporcional_aos_dias";
    var quadro;
    if (ver === "foto") {
      var linhasF = n.foto.linhas.map(function (l) { return "<li>" + esc(l.item) + ": <strong>" + F.numero(l.refeita) + "</strong></li>"; }).join("");
      quadro = '<div class="quadro-fv foto"><p class="rotulo">A foto · ' + F.dataHora(n.contagem_em) + " · pela data de processamento</p>" +
        '<p class="valor-grande">' + F.numero(n.foto.quantidade) + " " + X().quem(c, n.foto.quantidade) + "</p>" +
        (n.foto.linhas.length > 1 ? '<ul class="pequeno">' + linhasF + "</ul>" : "") +
        "<p>É o que o sistema mostrava no instante da contagem. Foi com ela que a nota saiu. A foto não vê o que aconteceu antes, mas só chegou ao sistema depois.</p>" +
        diferencaEmPalavras("foto", soNaFoto, soNoVideo) + "</div>";
    } else {
      var linhasV = n.itens_pela_regra.map(function (i) { return "<li>" + esc(i.descricao) + ": <strong>" + (fracao ? F.fracao(i.quantidade) : F.numero(i.quantidade)) + "</strong></li>"; }).join("");
      quadro = '<div class="quadro-fv video"><p class="rotulo">O vídeo · ' + F.competencia(n.competencia) + " · pela data informada</p>" +
        '<p class="valor-grande">' + (fracao ? F.fracao(n.quantidade_pela_regra) + " mensalidades" : F.numero(n.quantidade_pela_regra) + " " + X().quem(c, n.quantidade_pela_regra)) + "</p>" +
        (n.itens_pela_regra.length > 1 ? '<ul class="pequeno">' + linhasV + "</ul>" : "") +
        "<p>É o que de fato valia, pela data em que cada mudança aconteceu, incluindo o que só chegou ao sistema depois da contagem. É a regra do contrato (D-038).</p>" +
        diferencaEmPalavras("video", soNaFoto, soNoVideo) + "</div>";
    }
    return botoes + quadro;
  }

  /* A nota aberta é só da visão Medipreço; o RH vê um resumo próprio (D-105, em visao-empresa-rh.js). */

  function umaNota(numero, params) {
    var I = A().I, esc = A().esc;
    var n = I.nota[numero];
    if (!n) return A().naoEncontrado("Nota não encontrada: " + numero + ".", "notas", "Voltar para Notas");
    var c = I.cliente[n.cliente_id];

    var alertas = A().alertasDaNota(n).map(function (x) {
      return "<div>" + A().alerta(x.alerta.tipo, x.alerta.id + " · " + x.alerta.nome, X().caso(x.alerta, x.caso)) + "</div>";
    }).join("");

    return '<p class="migalha"><a href="' + A().link("notas") + '">Notas</a> › ' + esc(n.nota) + "</p>" +
      '<div class="cabecalho-tela"><h1>' + esc(n.nota) + " " + seloDaNota(n) + '</h1><a href="' + A().link("clientes/" + n.cliente_id) + '">' + esc(n.cliente) + "</a></div>" +
      '<dl class="dados-nota">' +
        "<div><dt>Tomador</dt><dd>" + esc(n.tomador) + " · " + esc(n.cnpj) + "</dd></div>" +
        "<div><dt>Competência</dt><dd>" + F.competencia(n.competencia) + "</dd></div>" +
        "<div><dt>Data de emissão</dt><dd>" + F.data(n.emissao) + "</dd></div>" +
        "<div><dt>Contagem feita em</dt><dd>" + F.dataHora(n.contagem_em) + " <span class=\"pequeno suave\">(" + F.diaDaSemana(n.contagem_em) + ")</span></dd></div>" +
        linhaDoVencimento(n) +
        "<div><dt>Modelo</dt><dd>" + esc(c.modelo) + "</dd></div></dl>" +
      fotoVideo(n, c, params) +
      '<section class="secao camada"><h2><span class="passo">1</span> Total</h2>' + camadaTotal(n, c) + "</section>" +
      '<section class="secao camada"><h2><span class="passo">2</span> A conta</h2>' + camadaConta(n, c) + "</section>" +
      '<section class="secao camada"><h2><span class="passo">3</span> As pessoas</h2>' + camadaPessoas(n, c, params) + "</section>" +
      '<section class="secao camada" id="eventos"><h2><span class="passo">4</span> Os eventos da pessoa</h2>' + camadaEventos(n, params) + "</section>" +
      '<section class="secao"><h2>Alertas desta nota</h2>' + (alertas ? '<div class="lista-alertas">' + alertas + "</div>" : A().vazio("Nenhum alerta.")) + "</section>" +
      '<section class="secao nao-imprimir"><h2>Baixar</h2><div class="linha-botoes">' +
        '<button type="button" class="botao" data-baixar="nota:' + esc(n.nota) + '">Demonstrativo em CSV</button>' +
        '<button type="button" class="botao" data-imprimir>Demonstrativo em PDF (imprimir)</button>' +
        '<button type="button" class="botao" data-simulado="Na versão real, o arquivo iria por e-mail para o contato do cliente, depois de alguém do financeiro conferir.">Enviar por e-mail</button> ' + A().etiqueta("simulado") + "</div>" +
        '<p class="pequeno suave">O CSV traz o total emitido, o total pela regra, a diferença e todas as pessoas da nota. O PDF sai pela impressão do navegador.</p></section>';
  }
  /* peças usadas pelo resumo da nota na visão Empresa/RH (D-105) */
  window.NotaAberta = { selo: seloDaNota, vencimento: linhaDoVencimento };

  window.App.registrar("notas", {
    titulo: "Notas",
    montar: function (partes, params) { return partes[0] ? umaNota(partes[0], params) : lista(params); }
  });
})();
