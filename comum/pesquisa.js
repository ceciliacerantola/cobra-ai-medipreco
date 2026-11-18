/* Pesquisa por palavra-chave e número (lote E, tarefa 25).
   Acha nota, cliente, empresa (razão social ou CNPJ), pessoa e números das notas (quantidade ou valor).
   Não intercepta o teclado: o Ctrl+F do navegador continua funcionando (D-052). */
(function () {
  "use strict";
  var F = window.Formato;
  var LIMITE = 30;
  function A() { return window.App; }

  function normal(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }
  function digitos(t) { return String(t || "").replace(/\D/g, ""); }

  /* "6.217,50" -> 6217.5 ; "721" -> 721 ; texto -> null */
  function comoNumero(q) {
    if (!/^[\d.,\s]+$/.test(q)) return null;
    var t = q.replace(/\s/g, "");
    if (t.indexOf(",") > -1) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    var v = parseFloat(t);
    return isNaN(v) ? null : v;
  }

  function procurar(qBruto) {
    var D = A().D, q = normal(qBruto), qd = digitos(qBruto), num = comoNumero(qBruto);
    var r = { notas: [], clientes: [], empresas: [], pessoas: [] };
    if (!q) return r;

    D.clientes.forEach(function (c) {
      if (normal(c.nome).indexOf(q) > -1 || normal(c.id) === q || normal(c.contrato.numero).indexOf(q) > -1) r.clientes.push(c);
      c.empresas.forEach(function (e) {
        if (normal(e.razao_social).indexOf(q) > -1 || (qd.length >= 4 && digitos(e.cnpj).indexOf(qd) > -1)) r.empresas.push({ empresa: e, cliente: c });
      });
    });

    D.notas.forEach(function (n) {
      var porTexto = normal(n.nota).indexOf(q) > -1 || normal(n.tomador).indexOf(q) > -1 || normal(n.cliente).indexOf(q) > -1 ||
        (qd.length >= 4 && (digitos(n.nota).indexOf(qd) > -1 || digitos(n.cnpj).indexOf(qd) > -1));
      var porNumero = null;
      if (num !== null) {
        if (n.quantidade_emitida === num) porNumero = F.numero(num) + " cobradas";
        else if (n.calculada && n.quantidade_pela_regra === num) porNumero = F.numero(num) + " pela regra";
        else if (n.valor_emitido === num) porNumero = "valor emitido " + F.moeda(num);
        else if (n.calculada && n.valor_pela_regra === num) porNumero = "valor pela regra " + F.moeda(num);
        else if (n.calculada && Math.abs(n.diferenca) === num && num !== 0) porNumero = F.acerto(n.diferenca);
      }
      if (porTexto || porNumero) r.notas.push({ nota: n, porque: porNumero });
    });

    if (/^p?\d{3,}$/.test(q)) {
      var cod = q.charAt(0) === "p" ? q.toUpperCase() : "P" + q;
      Object.keys(D.pessoas).forEach(function (p) { if (p.indexOf(cod) === 0) r.pessoas.push(p); });
    }
    return r;
  }

  function montar(partes, params) {
    var esc = A().esc, q = params.q || "";
    var cab = '<div class="cabecalho-tela"><h1>Pesquisa</h1></div>' +
      '<form class="filtros pesquisa-tela" data-rota="pesquisa" role="search"><label>Pesquisar<input type="search" name="q" value="' + esc(q) +
      '" placeholder="NF-01306, Cedro, 41.220.871, P685600, 721 ou 6.217,50"></label>' +
      '<div class="acoes-filtro"><button type="submit" class="botao principal">Pesquisar</button></div></form>' +
      '<p class="pequeno suave">Acha nota, cliente, empresa (nome ou CNPJ), pessoa (código) e números das notas: quantidade, valor ou diferença. O Ctrl+F do navegador também funciona em qualquer tela.</p>';
    if (!q.trim()) return cab + A().vazio("Digite o que procura.");

    var r = procurar(q);
    var total = r.notas.length + r.clientes.length + r.empresas.length + r.pessoas.length;
    if (!total) return cab + A().vazio("Nada encontrado para “" + q + "”.");

    var blocos = [];
    if (r.clientes.length) {
      blocos.push('<section class="secao"><h2>Clientes (' + r.clientes.length + ')</h2><ul class="resultados">' + r.clientes.map(function (c) {
        return '<li><a href="' + A().link("clientes/" + c.id) + '">' + esc(c.nome) + '</a> <span class="pequeno suave">· ' + esc(c.modelo) + "</span></li>";
      }).join("") + "</ul></section>");
    }
    if (r.empresas.length) {
      blocos.push('<section class="secao"><h2>Empresas (' + r.empresas.length + ')</h2><ul class="resultados">' + r.empresas.map(function (x) {
        return '<li><a href="' + A().link("clientes/" + x.cliente.id) + '">' + esc(x.empresa.razao_social) + '</a> <span class="pequeno suave">· ' + esc(x.empresa.cnpj) + " · " + esc(x.cliente.nome) +
          '</span> · <a class="pequeno" href="' + A().link("extratos", { empresa: x.empresa.cnpj }) + '">extrato</a></li>';
      }).join("") + "</ul></section>");
    }
    if (r.notas.length) {
      blocos.push('<section class="secao"><h2>Notas (' + r.notas.length + ')</h2><ul class="resultados">' + r.notas.slice(0, LIMITE).map(function (x) {
        var n = x.nota;
        return '<li><a href="' + A().link("notas/" + n.nota) + '">' + esc(n.nota) + "</a> · " + esc(n.tomador) + ' <span class="pequeno suave">· ' + F.competencia(n.competencia) +
          " · " + F.moeda(n.valor_emitido) + (x.porque ? " · achada por: " + esc(x.porque) : "") + "</span></li>";
      }).join("") + "</ul>" + (r.notas.length > LIMITE ? '<p class="pequeno suave">Mostrando ' + LIMITE + " de " + r.notas.length + ".</p>" : "") + "</section>");
    }
    if (r.pessoas.length) {
      blocos.push('<section class="secao"><h2>Pessoas (' + F.numero(r.pessoas.length) + ')</h2><ul class="resultados">' + r.pessoas.slice(0, LIMITE).map(function (p) {
        var info = A().D.pessoas[p] || [];
        return '<li><a href="' + A().link("extratos", { pessoa: p, de: "2023-01-01", ate: A().D.fim_da_base }) + '">' + esc(p) + '</a> <span class="pequeno suave">· ' + esc(info[0] || "") +
          (info[1] ? " · titular " + esc(info[1]) : "") + "</span></li>";
      }).join("") + "</ul>" + (r.pessoas.length > LIMITE ? '<p class="pequeno suave">Mostrando ' + LIMITE + " de " + F.numero(r.pessoas.length) + ". Digite mais números do código.</p>" : "") + "</section>");
    }
    return cab + '<p class="pequeno contagem-filtro">' + F.numero(total) + (total === 1 ? " resultado" : " resultados") + " para “" + esc(q) + "”.</p>" + blocos.join("");
  }

  window.Pesquisa = { procurar: procurar };
  window.App.registrar("pesquisa", { titulo: "Pesquisa", montar: montar });
})();
