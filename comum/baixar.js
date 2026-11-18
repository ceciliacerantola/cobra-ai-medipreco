/* Baixar em CSV (lote E, tarefa 26): o demonstrativo de uma nota e o extrato de um período.
   O arquivo tem o mesmo total da tela: os números são os mesmos de dados.js, sem conta nova.
   Separador ";" e vírgula decimal, para abrir direto no Excel em português. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }

  function celula(v) {
    if (v === null || v === undefined) return "";
    var t = typeof v === "number" ? String(v).replace(".", ",") : String(v);
    return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  function linha(lista) { return lista.map(celula).join(";"); }

  function salvar(nome, linhas) {
    var texto = "﻿" + linhas.join("\r\n") + "\r\n";
    var blob = new Blob([texto], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000);
  }

  function demonstrativo(numero) {
    var I = A().I, n = I.nota[numero];
    if (!n) return null;
    var c = I.cliente[n.cliente_id], C = I.colunas;
    var L = [];
    L.push(linha(["Demonstrativo", n.nota, "Dados fictícios do kit do case (demonstração)"]));
    L.push(linha(["Cliente", n.cliente])); L.push(linha(["Tomador", n.tomador, n.cnpj]));
    L.push(linha(["Competência", F.competencia(n.competencia)])); L.push(linha(["Emissão", F.data(n.emissao)]));
    L.push(linha(["Contagem feita em", F.dataHora(n.contagem_em)]));
    L.push("");
    L.push(linha(["Como a nota foi emitida", "Quantidade", "Preço", "Valor"]));
    n.linhas_emitidas.forEach(function (l) { L.push(linha([l.item, l.quantidade, l.unitario, l.valor])); });
    L.push(linha(["Total emitido", n.quantidade_emitida, "", n.valor_emitido]));
    if (n.calculada) {
      L.push("");
      L.push(linha(["Pela regra do contrato", "Quantidade", "Preço", "Valor"]));
      n.itens_pela_regra.forEach(function (i) { L.push(linha([i.descricao, i.quantidade, i.unitario, i.valor])); });
      L.push(linha(["Total pela regra", n.quantidade_pela_regra, "", n.valor_pela_regra]));
      L.push(linha(["Diferença (pela regra − emitido)", "", "", n.diferenca]));
      /* destino do acerto como na tela (D-094/D-098): pelo bloco `caminho`, não pela competência seguinte */
      var ac = (n.caminho || []).filter(function (x) { return x.etapa === "acerto"; })[0] || {};
      var destino = ac.situacao === "na_previa" || ac.situacao === "a_vir" ? "na nota de " + F.competencia(ac.competencia)
        : ac.situacao === "nao_acertada" ? "não acertada (a nota de " + F.competencia(ac.competencia) + " saiu sem ela)" : "";
      L.push(linha(["Acerto", F.acerto(n.diferenca), destino]));
      L.push("");
      L.push(linha(["Pessoa", "Tipo", "Empresa", "CNPJ", "Plano", "Na foto", "Pela regra", "Dias", "Por quê"]));
      n.pessoas.forEach(function (l) {
        var p = { pessoa: l[C.pessoa], tipo: l[C.tipo], plano: l[C.plano], dias: l[C.dias], informada: l[C.informada], processamento: l[C.processamento], plano_na_foto: l[C.plano_na_foto] };
        var emp = A().empresa(l[C.cnpj]);
        L.push(linha([p.pessoa, p.tipo, emp.razao, emp.cnpj, p.plano, l[C.na_foto] ? "sim" : "não", l[C.na_regra] ? "sim" : "não", p.dias,
          window.Explica.motivo(l[C.motivo], p, n, c)]));
      });
    } else {
      L.push(""); L.push(linha(["Sem cálculo", "aguardando " + F.data((n.motivo || {}).dia_necessario)]));
    }
    return { nome: "demonstrativo-" + n.nota + ".csv", linhas: L };
  }

  function extrato(query) {
    var params = {};
    String(query || "").split("&").forEach(function (par) {
      if (!par) return;
      var kv = par.split("=");
      params[kv[0]] = decodeURIComponent(kv[1] || "");
    });
    var r = window.Extrato.filtrar(params);
    if (r.erro) return null;
    var C = r.colunas, f = r.filtros;
    var L = [linha(["Extrato", F.data(f.de) + " a " + F.data(f.ate), "pela data " + (f.por === "processamento" ? "de processamento" : "informada"), "Dados fictícios do kit do case (demonstração)"])];
    L.push(linha(["Pessoa", "Empresa", "CNPJ", "Evento", "Plano", "Data informada", "Data de processamento", "Atrasado", "Origem", "Inclusão desfeita"]));
    r.eventos.forEach(function (l) {
      var emp = A().empresa(l[C.cnpj]);
      L.push(linha([l[C.pessoa], emp.razao, emp.cnpj, F.tipoEvento(l[C.tipo]), l[C.plano], F.data(l[C.informada]), F.dataHora(l[C.processamento]),
        F.atrasado(l[C.informada], l[C.processamento]) ? "sim" : "não", F.origem(l[C.origem]), l[C.desfeito] ? "sim" : "não"]));
    });
    L.push(linha(["Total de eventos", r.eventos.length]));
    return { nome: "extrato-" + f.de + "-a-" + f.ate + ".csv", linhas: L };
  }

  /* resumo consolidado de uma nota, para o RH (D-105): sem pessoas nem eventos */
  function resumo(numero) {
    var I = A().I, n = I.nota[numero];
    if (!n) return null;
    var ac = (n.caminho || []).filter(function (x) { return x.etapa === "acerto"; })[0] || {};
    var L = [linha(["Resumo da nota", n.nota, "Dados fictícios do kit do case (demonstração)"])];
    L.push(linha(["Cliente", n.cliente])); L.push(linha(["Tomador", n.tomador, n.cnpj]));
    L.push(linha(["Competência", F.competencia(n.competencia)])); L.push(linha(["Emissão", F.data(n.emissao)]));
    L.push(linha(["Cobrado", n.quantidade_emitida, "", n.valor_emitido]));
    if (n.calculada) {
      L.push(""); L.push(linha(["Pelo contrato", "Quantidade", "Preço", "Valor"]));
      n.itens_pela_regra.forEach(function (i) { L.push(linha([i.descricao, i.quantidade, i.unitario, i.valor])); });
      L.push(linha(["Total pelo contrato", n.quantidade_pela_regra, "", n.valor_pela_regra]));
      L.push(linha(["Ajuste", n.diferenca === 0 ? "sem ajuste" : F.acerto(n.diferenca),
        ac.situacao === "na_previa" || ac.situacao === "a_vir" ? "entra na nota de " + F.competencia(ac.competencia) : n.diferenca === 0 ? "" : "ainda não aplicado"]));
    } else {
      L.push(linha(["Pelo contrato", "conferência em andamento"]));
    }
    return { nome: "resumo-" + n.nota + ".csv", linhas: L };
  }

  /* lista de vidas ativas hoje de um cliente (visão Empresa/RH, tarefa 44) */
  function vidas(id) {
    var I = A().I, c = I.cliente[id], a = ((A().D.onda_2 || {})[id] || {}).ativos_hoje;
    if (!c || !a) return null;
    var C = {};
    a.colunas.forEach(function (n, i) { C[n] = i; });
    var L = [linha(["Vidas ativas", c.nome, "em " + F.data(a.dia) + ", pela data informada", "Dados fictícios do kit do case (demonstração)"])];
    L.push(linha(["Pessoa", "Tipo", "Plano", "Empresa", "CNPJ"]));
    a.linhas.forEach(function (l) { var emp = A().empresa(l[C.cnpj]); L.push(linha([l[C.pessoa], l[C.tipo], l[C.plano], emp.razao, emp.cnpj])); });
    L.push(linha(["Total", a.linhas.length]));
    return { nome: "vidas-ativas-" + id + "-" + a.dia + ".csv", linhas: L };
  }

  window.Baixar = {
    demonstrativo: demonstrativo,
    extrato: extrato,
    vidas: vidas,
    resumo: resumo,
    executar: function (pedido) {
      var i = pedido.indexOf(":"), tipo = pedido.slice(0, i), resto = pedido.slice(i + 1);
      var arq = tipo === "nota" ? demonstrativo(resto) : tipo === "extrato" ? extrato(resto) : tipo === "vidas" ? vidas(resto) : tipo === "resumo" ? resumo(resto) : null;
      if (arq) salvar(arq.nome, arq.linhas);
    }
  };
})();
