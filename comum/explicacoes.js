/* Os textos das explicações ("i"), em um lugar só (lote E).
   Regra da Ceci: toda regra aplicada aparece explicada, com os números da própria nota e a cláusula ou decisão.
   Nenhum texto aponta culpado nem afirma causa que a base não mostra (D-022).
   Os números vêm de dados.js; aqui só se escreve a frase. */
(function () {
  "use strict";
  var F = window.Formato;
  function A() { return window.App; }
  function e(v) { return A().esc(v); }

  var PAGAMENTO = { pos: "Pós-pago", pre: "Pré-pago" };

  function ondeEntraOAcerto(cliente, n) {
    var destino = n.acerto && n.acerto.entra_na_competencia;
    var p = ((A().D.onda_2 || {})[cliente.id] || {}).previa;
    var naPrevia = p && p.calculada && p.acertos.some(function (a) { return a.nota === n.nota; });
    if (naPrevia && p.competencia !== destino) return "próxima nota ainda não emitida (" + F.competencia(p.competencia) + ")";
    return "nota de " + F.competencia(destino);
  }

  /* "cláusula 5.2" ou "decisão D-044", pela ficha do cliente */
  function referencia(cliente, campo) {
    var l = (cliente.ficha || []).filter(function (x) { return x.campo === campo; })[0];
    if (!l || !l.referencia) return null;
    return l.origem === "decisao" ? "decisão " + l.referencia : "cláusula " + l.referencia;
  }
  function comRef(texto, ref) { return ref ? texto + " (" + e(ref) + ")" : texto; }

  function quem(cliente, n) {
    var t = cliente && cliente.unidade === "titular";
    return n === 1 ? (t ? "titular" : "vida") : (t ? "titulares" : "vidas");
  }

  function dataDoGrupo(n) {
    var g = A().I.grupo[n.cliente_id + "|" + n.competencia];
    return g || null;
  }

  var Explica = {
    PAGAMENTO: PAGAMENTO,
    referencia: referencia,
    quem: quem,

    /* ---------- o motivo de cada pessoa (linha da camada "as pessoas") ---------- */
    motivo: function (codigo, p, n, cliente) {
      var g = dataDoGrupo(n);
      switch (codigo) {
        case "saida_processada_depois":
          return "Saída informada em " + F.data(p.informada) + ", processada em " + F.dataHora(p.processamento) +
            ", depois da contagem. Estava na foto; pela regra, não conta.";
        case "entrada_processada_depois":
          return "Entrada informada em " + F.data(p.informada) + ", processada em " + F.dataHora(p.processamento) +
            ", depois da contagem. Não estava na foto; pela regra, conta.";
        case "ativa_no_mes_fora_do_dia_da_foto":
          if (cliente.metodo === "maximo_do_mes") {
            return "Estava nesta empresa no dia do máximo" + (g ? " (" + F.data(g.dia_do_maximo) + ")" : "") +
              ", mas não no dia da contagem. Pela regra, conta aqui.";
          }
          if (cliente.metodo === "proporcional_aos_dias") {
            return "Ativa " + F.numero(p.dias) + (p.dias === 1 ? " dia" : " dias") + " do mês, mas não no dia da contagem. Pela regra, conta pelos dias.";
          }
          return "Ativa em algum dia do mês, mas não no dia da contagem. Pela regra, conta: o contrato cobra quem ficou ativo ao menos 1 dia.";
        case "na_foto_fora_da_regra":
          if (cliente.metodo === "maximo_do_mes") {
            return "Estava nesta empresa no dia da contagem, mas não no dia do máximo" + (g ? " (" + F.data(g.dia_do_maximo) + ")" : "") +
              ". Pela regra, não conta aqui.";
          }
          return "Estava na foto, mas pela data informada não estava ativa no dia que a regra olha. Pela regra, não conta.";
        case "na_regra_fora_da_foto":
          return "Pela data informada, estava ativa no dia que a regra olha, mas não estava na foto. Pela regra, conta.";
        case "plano_diferente":
          return "Na foto estava no plano " + e(p.plano_na_foto || F.SEM_DADO) + "; pela regra, no plano " + e(p.plano || F.SEM_DADO) + ".";
        case "inclusao_desfeita":
          return "Inclusão desfeita em poucos dias: fica fora da cobrança (D-077).";
        default:
          return "Igual na foto e na regra.";
      }
    },

    /* ---------- o resumo dos motivos de uma nota (uma frase por motivo) ---------- */
    resumoDoMotivo: function (codigo, qtd, n, cliente) {
      var g = dataDoGrupo(n);
      var q = F.numero(qtd) + " " + (qtd === 1 ? "pessoa" : "pessoas");
      var textos = {
        saida_processada_depois: q + " com saída informada até o dia que a regra olha, processada depois da contagem: estavam na foto e, pela regra, não contam.",
        entrada_processada_depois: q + " com entrada informada até o dia que a regra olha, processada depois da contagem: não estavam na foto e, pela regra, contam.",
        ativa_no_mes_fora_do_dia_da_foto: cliente.metodo === "maximo_do_mes"
          ? q + " estavam nesta empresa no dia do máximo" + (g ? " (" + F.data(g.dia_do_maximo) + ")" : "") + ", mas não no dia da contagem: pela regra, contam aqui."
          : q + " ficaram ativas em algum dia do mês, mas não no dia da contagem: pela regra, contam.",
        na_foto_fora_da_regra: cliente.metodo === "maximo_do_mes"
          ? q + " estavam nesta empresa no dia da contagem, mas não no dia do máximo" + (g ? " (" + F.data(g.dia_do_maximo) + ")" : "") + ": pela regra, não contam aqui."
          : q + " estavam na foto, mas pela data informada não estavam ativas no dia que a regra olha.",
        na_regra_fora_da_foto: q + " estavam ativas pela data informada, mas não na foto.",
        plano_diferente: q + " com plano diferente entre a foto e a regra.",
        inclusao_desfeita: q + " em inclusão desfeita em poucos dias, fora da cobrança (D-077)."
      };
      return textos[codigo] || (q + ": " + e(codigo) + ".");
    },

    /* ---------- crédito e débito ---------- */
    creditoDebito: function () {
      return "<p><strong>Crédito:</strong> a nota cobrou mais do que a regra do contrato. A Medipreço devolve a diferença ao cliente, na próxima nota.</p>" +
        "<p><strong>Débito:</strong> a nota cobrou menos do que a regra. A Medipreço cobra a diferença, na próxima nota.</p>" +
        "<p>O saldo de um cliente soma as notas dos dois lados: um saldo pequeno pode esconder notas com diferença grande para cada lado. Por isso cada nota aparece separada.</p>";
    },

    /* ---------- os "i" das regras aplicadas na conta da nota ---------- */
    regrasAplicadas: function (n, cliente) {
      var I = A().I, saida = [];
      (n.observacoes || []).forEach(function (o) {
        if (o.codigo === "faixa_aplicada") {
          saida.push(A().alerta("i", "Faixa de preço: " + F.moeda(o.unitario) + " para todas as " + quem(cliente, 2),
            "<p>Pela regra havia " + F.numero(o.quantidade) + " " + quem(cliente, o.quantidade) + ". A faixa que vai até " + F.numero(o.ate) +
            " custa " + F.moeda(o.unitario) + " por vida, e vale para todas as vidas, não só para as que passam do limite" +
            comRef("", referencia(cliente, "preco")) + "; leitura escolhida na D-044.</p>" +
            "<p><strong>Ponto de atenção:</strong> passar de 5.000 vidas baixa o preço da fatura inteira. Nesta nota foram cobradas " +
            F.numero(n.quantidade_emitida) + " " + quem(cliente, n.quantidade_emitida) + " por " + F.moeda(n.valor_emitido) + "; pela regra são " +
            F.numero(n.quantidade_pela_regra) + " por " + F.moeda(n.valor_pela_regra) + ". O contrato é este; a Medipreço pode querer revê-lo.</p>"));
        }
        if (o.codigo === "minimo_aplicado") {
          saida.push(A().alerta("i", "Mínimo garantido aplicado: " + F.numero(o.minimo) + " " + quem(cliente, 2),
            "<p>Pela regra havia " + F.numero(o.contadas) + " " + quem(cliente, o.contadas) + " no dia de corte. O contrato garante o pagamento de no mínimo " +
            F.numero(o.minimo) + comRef("", referencia(cliente, "minimo_de_vidas")) + ". Por isso a conta pela regra usa " + F.numero(o.minimo) + ".</p>"));
        }
        if (o.codigo === "rateio") {
          var g = I.grupo[n.cliente_id + "|" + n.competencia];
          saida.push(A().alerta("i", "Rateio pelo dia do máximo (" + F.data(o.dia_do_maximo) + ")", Explica.rateio(g, cliente, n.nota)));
        }
        if (o.codigo === "arredondamento_no_total") {
          saida.push(A().alerta("i", "Proporcional aos dias, arredondado só no total",
            "<p>" + F.numero(o.pessoas) + " pessoas somaram " + F.numero(o.dias_somados) + " dias ativos num mês de " + F.numero(o.dias_do_mes) + " dias: " +
            F.numero(o.dias_somados) + " ÷ " + F.numero(o.dias_do_mes) + " = " + F.fracao(n.quantidade_pela_regra) + " mensalidades × " +
            F.moeda((n.itens_pela_regra[0] || {}).unitario) + " = " + F.moeda(n.valor_pela_regra) + ".</p>" +
            "<p><strong>Por que arredondar só o total:</strong> arredondar pessoa por pessoa acumularia centavos de diferença. Somamos as frações e arredondamos uma vez, em centavos (D-078).</p>" +
            "<p>O contrato diz pró-rata dia" + comRef("", referencia(cliente, "contagem")) + ", sem dizer o divisor nem se o dia da saída conta. Usamos os dias do próprio mês, e o dia da saída não conta (D-075).</p>"));
        }
        if (o.codigo === "plano_sem_preco") {
          saida.push(A().alerta("!", "Plano sem preço na ficha", "<p>Planos sem preço no contrato: " + e((o.planos || []).join(", ")) + ".</p>"));
        }
      });
      /* inclusão desfeita: vem do alerta A4 do mesmo cliente e competência */
      A().alertasDaNota(n).forEach(function (x) {
        if (x.alerta.id === "A4") {
          var r = x.caso.resumo, par = A().D.parametros.inclusao_desfeita_dias;
          saida.push(A().alerta("i", "Inclusão desfeita: " + F.numero(r.pessoas) + " pessoas fora da cobrança",
            "<p>" + F.numero(r.pessoas) + " pessoas foram incluídas em " + F.data(r.entradas_processadas_de) + " e retiradas em " + F.data(r.saidas_processadas_de) +
            " (" + e((r.origens_da_saida || []).map(F.origem).join(", ")) + ").</p>" +
            "<p><strong>A regra (D-077):</strong> conta como inclusão desfeita quando a saída é processada até " + F.numero(par.valor) +
            " dias depois da entrada, e a data informada da saída é o dia em que a entrada chegou ao sistema, ou depois. Quem cai nessa regra fica fora da cobrança (D-041).</p>" +
            "<p>Ao pé da letra, o contrato cobraria o mês inteiro de quem ficou ativo ao menos 1 dia. Fica como ponto de atenção.</p>"));
        }
      });
      if (cliente.metodo === "posicao_no_dia_de_corte") {
        saida.push(A().alerta("i", "Dia da saída não conta (provisório)",
          "<p>Quem sai no próprio dia de corte não conta naquele dia. O contrato não diz; é uma decisão provisória (D-040), que a Ceci vai confirmar com o Felipe.</p>"));
      }
      if (cliente.metodo === "proporcional_aos_dias") {
        saida.push(A().alerta("i", "Dia da saída não conta como dia ativo (provisório)",
          "<p>No proporcional aos dias, o dia da saída não entra na soma dos dias ativos. O contrato não diz; segue a decisão provisória D-040, aplicada à Faro na D-075.</p>"));
      }
      return saida;
    },

    /* ---------- rateio do grupo: total, divisão e a escolha do dia ---------- */
    rateio: function (g, cliente, destaque) {
      if (!g) return "<p>Sem o resumo do grupo para esta competência.</p>";
      var linhas = g.empresas.map(function (x) {
        var marca = x.nota === destaque ? ' class="destaque-linha"' : "";
        return "<tr" + marca + "><td>" + e(x.tomador) + '<br><span class="pequeno suave">' + e(x.nota) + "</span></td>" +
          '<td class="num">' + F.numero(x.quantidade_pela_regra) + '</td><td class="num">' + F.numero(x.quantidade_emitida) +
          '</td><td class="num">' + F.diferenca(x.diferenca) + "</td></tr>";
      }).join("");
      var dc = g.contagem_em.map(F.data).join(", ");
      return "<p><strong>O total do grupo:</strong> o contrato cobra o máximo de vidas do mês" + comRef("", referencia(cliente, "contagem")) +
        ". Em " + F.competencia(g.competencia) + ", o máximo foi " + F.numero(g.maximo) + " vidas, em " + F.data(g.dia_do_maximo) +
        ". Foram cobradas " + F.numero(g.quantidade_emitida) + ", pela contagem de " + dc + ". " +
        (g.diferenca === 0 ? "O total do grupo bate." : "No total do grupo, isso dá um " + F.acerto(g.diferenca) + ".") + "</p>" +
        "<p><strong>A divisão entre as empresas:</strong> o contrato manda ratear na proporção das vidas de cada uma" +
        comRef("", referencia(cliente, "notas")) + ", sem dizer o dia. Usamos a proporção do próprio dia do máximo (D-074, mantida na D-079): " +
        "o número do mês e a divisão vêm da mesma foto, e as partes somam o máximo exato.</p>" +
        '<div class="rolagem"><table><thead><tr><th>Empresa</th><th class="num">Pela regra (' + F.data(g.dia_do_maximo) + ')</th>' +
        '<th class="num">Emitida (' + dc + ')</th><th class="num">Diferença</th></tr></thead><tbody>' + linhas + "</tbody></table></div>" +
        "<p><strong>Ponto de atenção:</strong> quem muda de empresa dentro do grupo conta uma vez só, então o total não muda; muda só qual CNPJ recebe qual parte. " +
        "A diferença entre as empresas vem da escolha do dia, não de um erro. Outras leituras possíveis: a posição do último dia do mês, ou a média do mês. " +
        "Se a Medipreço usar outro dia, muda só um parâmetro.</p>";
    },

    /* ---------- nota sem cálculo ---------- */
    semCalculo: function (n, cliente) {
      var m = n.motivo || {};
      if (m.codigo === "base_termina_antes") {
        return "<p><strong>Aguardando o dia " + F.data(m.dia_necessario) + ".</strong> Não é esquecimento: o dia que a regra pede ainda não chegou.</p>" +
          "<p>" + e(cliente.nome) + " paga adiantado: a nota de " + F.competencia(n.competencia) + " saiu em " + F.data(n.emissao) + ", com " +
          F.numero(n.quantidade_emitida) + " " + quem(cliente, n.quantidade_emitida) + " contados em " + F.dataHora(n.contagem_em) + ". " +
          "A regra compara essa nota com a posição do dia " + F.data(m.dia_necessario) + " e compensa a diferença na nota seguinte" +
          comRef("", referencia(cliente, "compensacao")) + "; o dia da medida é a D-046.</p>" +
          "<p>A base vai até " + F.data(m.fim_da_base) + ". Quando o dia " + F.data(m.dia_necessario) + " estiver na base, o cálculo roda de novo e esta nota passa a ter valor pela regra.</p>";
      }
      if (m.codigo === "ficha_incompleta") {
        return "<p>A ficha do contrato está sem um campo obrigatório: " + e((m.falta || []).join(", ")) + ". A nota fica sem cálculo até a ficha ser completada.</p>";
      }
      return "<p>Esta nota não foi calculada. Motivo: " + e(m.codigo || F.SEM_DADO) + ".</p>";
    },

    /* ---------- como a regra conta, em uma frase com os números da nota ---------- */
    comoARegraConta: function (n, cliente) {
      var q = F.numero(n.quantidade_pela_regra) + " " + quem(cliente, n.quantidade_pela_regra);
      if (cliente.metodo === "posicao_no_dia_de_corte") {
        var pre = cliente.pagamento === "pre";
        return "O contrato manda contar quem estava ativo no dia " + F.data(n.dia_de_referencia) + comRef("", referencia(cliente, "contagem")) +
          ". Para saber quem estava ativo, vale a data em que a mudança de fato aconteceu, informada pelo RH, e não o dia em que ela entrou no sistema (D-038). " +
          "Por essa regra: " + q + ", " + F.moeda(n.valor_pela_regra) + "." +
          (pre ? " Como o pagamento é adiantado, a nota sai antes do mês e a diferença é compensada na nota seguinte" + comRef("", referencia(cliente, "compensacao")) + "." : "");
      }
      if (cliente.metodo === "maximo_do_mes") {
        var g = dataDoGrupo(n);
        return "Pela regra, conta o máximo de vidas do grupo no mês" + comRef("", referencia(cliente, "contagem")) +
          (g ? ": " + F.numero(g.maximo) + " vidas, em " + F.data(g.dia_do_maximo) + ". Nesse dia, esta empresa tinha " + q + ", " + F.moeda(n.valor_pela_regra) + " (rateio, D-074)." : ".");
      }
      if (cliente.metodo === "ativa_ao_menos_um_dia") {
        return "Pela regra, conta toda vida ativa por ao menos 1 dia no mês, pela data informada" + comRef("", referencia(cliente, "contagem")) +
          ": " + q + ", " + F.moeda(n.valor_pela_regra) + ".";
      }
      if (cliente.metodo === "proporcional_aos_dias") {
        return "Pela regra, cada vida conta pelos dias em que ficou ativa no mês" + comRef("", referencia(cliente, "contagem")) +
          ": " + F.fracao(n.quantidade_pela_regra) + " mensalidades, " + F.moeda(n.valor_pela_regra) + ".";
      }
      return "Pela regra: " + q + ", " + F.moeda(n.valor_pela_regra) + ".";
    },

    /* ---------- explicação da diferença (tarefa 21; o texto da Aurora é o modelo) ---------- */
    /* as pessoas de um motivo, com o intervalo das datas (só leitura de dados.js) */
    grupoDoMotivo: function (n, codigo) {
      var C = A().I.colunas, g = { qtd: 0, infDe: null, infAte: null, procDe: null, procAte: null, noDia: 0, exemplo: null };
      n.pessoas.forEach(function (l) {
        if (l[C.motivo] !== codigo) return;
        g.qtd++;
        var inf = l[C.informada], pro = l[C.processamento];
        if (inf) {
          if (!g.infDe || inf < g.infDe) g.infDe = inf;
          if (!g.infAte || inf > g.infAte) g.infAte = inf;
          if (inf === n.dia_de_referencia) g.noDia++;
        }
        if (pro) {
          if (!g.procDe || pro < g.procDe) g.procDe = pro;
          if (!g.procAte || pro > g.procAte) g.procAte = pro;
        }
        if (!g.exemplo && inf && inf !== n.dia_de_referencia) g.exemplo = { pessoa: l[C.pessoa], informada: inf, processamento: pro };
      });
      return g;
    },

    intervalo: function (de, ate, comHora) {
      var f = comHora ? F.dataHora : F.data;
      if (!de) return F.SEM_DADO;
      return de === ate || f(de) === f(ate) ? "em " + f(de) : "entre " + f(de) + " e " + f(ate);
    },

    glossario: function () {
      return A().alerta("i", "data informada × data de processamento",
        "<p><strong>Data informada:</strong> o dia em que a mudança de fato aconteceu (a pessoa entrou, saiu ou trocou de plano), segundo o RH.</p>" +
        "<p><strong>Data de processamento:</strong> o dia em que essa informação entrou no sistema da Medipreço. Pode ser dias depois.</p>" +
        "<p>A nota de hoje conta pelo que já estava no sistema na hora da contagem (a foto). A regra conta pelo que de fato valia no dia (o vídeo). A diferença entre as duas é o que chega atrasado.</p>");
    },

    explicacaoDaNota: function (n, cliente) {
      if (!n.calculada) return Explica.semCalculo(n, cliente);
      return "<p>A nota cobrou " + F.numero(n.quantidade_emitida) + " " + quem(cliente, n.quantidade_emitida) + " (" + F.moeda(n.valor_emitido) +
        "). A conta foi feita em " + F.dataHora(n.contagem_em) + ", com o que o sistema mostrava naquele momento.</p>" +
        "<p>" + Explica.comoARegraConta(n, cliente) + "</p>" + Explica.porQueDeuDiferente(n, cliente) + '<div class="glossario">' + Explica.glossario() + "</div>";
    },

    /* a parte que fica no fim da seção "A conta" da nota (pedido da Ceci): o porquê, o resultado e o que chegou depois */
    porQueDeuDiferente: function (n, cliente) {
      var partes = [];

      var mot = n.resumo_dos_motivos || {}, porque = [];
      if (mot.saida_processada_depois) {
        var gs = Explica.grupoDoMotivo(n, "saida_processada_depois");
        porque.push("<p><strong>" + F.numero(gs.qtd) + (gs.qtd === 1 ? " pessoa já tinha saído" : " pessoas já tinham saído") + "</strong> " + Explica.intervalo(gs.infDe, gs.infAte) +
          ", mas essas saídas só entraram no sistema " + Explica.intervalo(gs.procDe, gs.procAte, true) + ", depois da contagem. Por isso o sistema ainda mostrava " +
          (gs.qtd === 1 ? "essa pessoa" : "essas pessoas") + " na hora da contagem. Pela regra, não contam." +
          (gs.exemplo ? " Exemplo: " + e(gs.exemplo.pessoa) + " saiu em " + F.data(gs.exemplo.informada) + "; a saída entrou no sistema em " + F.dataHora(gs.exemplo.processamento) + "." : "") + "</p>");
        if (gs.noDia && cliente.metodo === "posicao_no_dia_de_corte") {
          porque.push('<div class="ponto-dia">' + A().alerta("i", F.numero(gs.noDia) + (gs.noDia === 1 ? " saiu" : " saíram") + " no próprio dia " + F.data(n.dia_de_referencia),
            "<p>Dessas, " + F.numero(gs.noDia) + (gs.noDia === 1 ? " saiu" : " saíram") + " no próprio dia " + F.data(n.dia_de_referencia) + ". Pela decisão provisória D-040, quem sai no dia de corte não conta naquele dia, mesmo que tenha estado ativo durante parte dele.</p>" +
            "<p>Se o Felipe disser que conta (ativo até o fim do dia), " + (gs.noDia === 1 ? "essa pessoa volta" : "essas pessoas voltam") + " para a conta desta nota.</p>") + "</div>");
        }
      }
      if (mot.entrada_processada_depois) {
        var ge = Explica.grupoDoMotivo(n, "entrada_processada_depois");
        porque.push("<p><strong>" + F.numero(ge.qtd) + (ge.qtd === 1 ? " pessoa já tinha entrado" : " pessoas já tinham entrado") + "</strong> " + Explica.intervalo(ge.infDe, ge.infAte) +
          ", mas essas entradas só chegaram ao sistema " + Explica.intervalo(ge.procDe, ge.procAte, true) + ", depois da contagem. A nota não as viu. Pela regra, contam." +
          (ge.exemplo ? " Exemplo: " + e(ge.exemplo.pessoa) + " entrou em " + F.data(ge.exemplo.informada) + "; a entrada chegou ao sistema em " + F.dataHora(ge.exemplo.processamento) + "." : "") + "</p>");
      }
      Object.keys(mot).forEach(function (k) {
        if (k === "saida_processada_depois" || k === "entrada_processada_depois") return;
        porque.push("<p>" + Explica.resumoDoMotivo(k, mot[k], n, cliente) + "</p>");
      });
      if (porque.length) partes.push('<h3 class="sub sem-margem">' + (n.diferenca === 0 ? "Pessoas diferentes, mesmo valor" : "Por que deu diferente") + "</h3>" + porque.join(""));
      else partes.push('<h3 class="sub sem-margem">A nota bate com a regra</h3>' + "<p>A foto e a regra têm as mesmas pessoas" +
        (n.diferenca === 0 ? ". Nada a acertar." : "; a diferença vem só do preço ou das regras aplicadas acima.") + "</p>");

      (n.observacoes || []).forEach(function (o) {
        if (o.codigo === "minimo_aplicado") partes.push("<p>Pela data informada eram " + F.numero(o.contadas) + "; o mínimo garantido de " + F.numero(o.minimo) + " vale.</p>");
        if (o.codigo === "faixa_aplicada" && o.unitario !== (n.linhas_emitidas[0] || {}).unitario) {
          partes.push("<p>O preço também muda: pela regra a faixa é de " + F.moeda(o.unitario) + " por vida, contra " + F.moeda((n.linhas_emitidas[0] || {}).unitario) + " na nota.</p>");
        }
      });
      if (n.diferenca === 0) {
        partes.push("<p><strong>Resultado:</strong> o valor bate com a regra" + (porque.length ? ": as diferenças de pessoas se compensam." : ".") + "</p>");
      } else {
        partes.push("<p><strong>Resultado:</strong> " + F.acerto(n.diferenca) + ", que entra na nota de " + F.competencia(n.acerto && n.acerto.entra_na_competencia) + ". " +
          (n.diferenca < 0 ? "A nota cobrou mais do que a regra: a Medipreço devolve ao cliente." : "A nota cobrou menos do que a regra: a Medipreço cobra a diferença.") + "</p>");
      }
      A().alertasDaNota(n).forEach(function (x) {
        if (x.alerta.id !== "A3") return;
        var r = x.caso.resumo, porDia = Explica.eventosPorDiaDeProcessamento(x.caso.eventos || []);
        partes.push('<p class="pequeno suave">Para completar: depois da contagem chegaram ' + F.numero(r.eventos) + " eventos com data informada nesta competência" +
          (porDia ? " (" + porDia + ")" : "") + ". " + (r.pessoas_que_mudam_a_contagem ? F.numero(r.pessoas_que_mudam_a_contagem) + " mudam esta nota (as de cima); " : "Nenhum muda esta nota; ") +
          (r.pessoas_que_nao_mudam ? (r.pessoas_que_mudam_a_contagem ? F.numero(r.pessoas_que_nao_mudam) + " não" : "todos os " + F.numero(r.pessoas_que_nao_mudam) + " ficam de fora") + (cliente.metodo === "posicao_no_dia_de_corte"
            ? ", porque aconteceram depois do dia " + F.data(n.dia_de_referencia) + " e ficam para o mês seguinte."
            : ": não mudam quem conta neste mês.") : "nenhum outro.") + "</p>");
      });
      return partes.join("");
    },

    /* "19 processados em 27/10/2026 e 18 em 03/11/2026" (contagem de linhas, só para o texto) */
    eventosPorDiaDeProcessamento: function (ids) {
      if (!ids.length) return "";
      var D = A().D, c = {}, por = {};
      D.eventos.colunas.forEach(function (nome, i) { c[nome] = i; });
      var quer = {};
      ids.forEach(function (id) { quer[id] = true; });
      D.eventos.linhas.forEach(function (l) {
        if (quer[l[c.id]]) { var d = String(l[c.processamento]).slice(0, 10); por[d] = (por[d] || 0) + 1; }
      });
      var dias = Object.keys(por).sort();
      if (dias.length > 4) return "";
      return dias.map(function (d, i) {
        return F.numero(por[d]) + (i === 0 ? (por[d] === 1 ? " processado em " : " processados em ") : " em ") + F.data(d);
      }).join(", ").replace(/, ([^,]*)$/, " e $1");
    },

    /* ---------- aviso ao cliente (tarefa 23) ---------- */
    /* onde entra o acerto: se a nota de destino já saiu, na próxima nota ainda não emitida (D-094, D-098) */
    avisoAoCliente: function (cliente, notas) {
      var com = notas.filter(function (n) { return n.calculada && n.diferenca !== 0; });
      if (!com.length) return null;
      var comp = com[0].competencia;
      var doMes = com.filter(function (n) { return n.competencia === comp; });
      var linhas = doMes.map(function (n) {
        var mot = n.resumo_dos_motivos || {};
        var atrasadas = (mot.saida_processada_depois || 0) + (mot.entrada_processada_depois || 0);
        return "Nota " + n.nota + (doMes.length > 1 ? " (" + n.tomador + ")" : "") + ": " + F.acerto(n.diferenca) +
          (atrasadas ? ", por " + F.numero(atrasadas) + (atrasadas === 1 ? " movimentação" : " movimentações") + " com data até o dia de corte que chegaram ao sistema depois da contagem" : "") + ".";
      });
      return "Olá, equipe " + cliente.nome + ".\n\n" +
        "Conferimos a cobrança de " + F.competencia(comp) + " pela regra do contrato. Encontramos " + (doMes.length > 1 ? "diferenças" : "uma diferença") + ":\n" +
        linhas.map(function (l) { return "• " + l; }).join("\n") + "\n\n" +
        "O acerto entra na " + ondeEntraOAcerto(cliente, doMes[0]) + ". " +
        "Se quiser o demonstrativo completo, é só pedir.\n\n" +
        "Qualquer dúvida, é só responder esta mensagem.\nEquipe Financeiro · Medipreço";
    },

    /* ---------- justificativa do cartão de cada caso de alerta ---------- */
    caso: function (a, c) {
      var r = c.resumo || {}, L = A().link.bind(A());
      var onde = '<a href="' + L("clientes/" + c.cliente_id) + '">' + e(c.cliente) + "</a> · " + F.competencia(c.competencia) +
        (c.nota ? ' · <a href="' + L("notas/" + c.nota) + '">' + e(c.nota) + "</a>" : "");
      var o = "";
      switch (a.id) {
        case "A1":
          o = F.numero(r.trocas) + " trocas para o plano " + e((r.para_os_planos || []).join(", ")) + ", informadas em " + F.data(r.informadas_de) +
            " e processadas em " + F.data(r.processadas_de) + ". A regra usa a data informada.";
          break;
        case "A2":
          o = F.numero(r.pessoas) + " pessoas apareciam ativas em duas empresas do grupo de " + F.data(r.de) + " a " + F.data(r.ate) +
            ", pelo que o sistema mostrava. Pela data informada, cada uma conta uma vez só no máximo do mês.";
          break;
        case "A3":
          o = F.numero(r.eventos) + " eventos processados depois da contagem de " + F.dataHora(r.contagem_em) + ", com data informada de " +
            F.data(r.informados_de) + " a " + F.data(r.informados_ate) + ". " + F.numero(r.pessoas_que_mudam_a_contagem) + " mudam a contagem da nota; " +
            F.numero(r.pessoas_que_nao_mudam) + " não" + (((A().I.cliente[c.cliente_id] || {}).metodo === "posicao_no_dia_de_corte")
              ? ", porque a data informada é depois do dia de corte." : ": não mudam quem conta neste mês.");
          break;
        case "A4":
          o = F.numero(r.pessoas) + " pessoas incluídas em " + F.data(r.entradas_processadas_de) + " e retiradas em " + F.data(r.saidas_processadas_de) +
            " (" + e((r.origens_da_saida || []).map(F.origem).join(", ")) + "). Ficam fora da cobrança (D-041, D-077).";
          break;
        case "A5":
          o = "A nota cobrou " + F.numero(r.cobrada) + "; no instante da contagem, a base mostrava " + F.numero(r.na_base_no_instante_da_contagem) +
            ", pela base de cobrança da própria nota. A base não mostra a causa.";
          break;
        case "A6":
          o = "Limite da faixa: " + F.numero(r.limite_da_faixa) + ". Perto quer dizer de " + F.numero(r.de) + " a " + F.numero(r.ate) + " (3%, D-050). " +
            (r.quantidades || []).map(function (q) { return (q.qual === "cobrada" ? "Cobradas: " : "Pela regra: ") + F.numero(q.quantidade) + " (a " + F.numero(q.distancia) + " do limite)"; }).join("; ") + ".";
          break;
        case "A7":
          o = "Mínimo garantido: " + F.numero(r.minimo) + ". Perto quer dizer até " + F.numero(r.ate) + " (3%, D-050). " +
            (r.quantidades || []).map(function (q) { return (q.qual === "cobrada" ? "Cobradas: " : "Pela regra: ") + F.numero(q.quantidade); }).join("; ") + "." +
            (r.minimo_aplicado ? " Pela regra ficou abaixo do mínimo, e o mínimo foi aplicado." : "");
          break;
        case "A8":
          o = "Contagem feita em " + F.data(r.contagem_em) + " (" + e(r.dia_da_semana_da_contagem) + "). O dia de corte, " + F.data(r.dia_de_corte_no_mes) +
            ", caiu num " + e(r.dia_da_semana_do_corte) + ". O contrato diz dia " + F.numero(r.dia_de_corte) +
            ", sem falar em dia útil; seguimos o dia 26 fixo (D-080). Pergunta para o Felipe: a contagem antes foi de propósito?";
          break;
        default:
          o = e(JSON.stringify(r));
      }
      return "<p><strong>Onde:</strong> " + onde + "</p><p>" + o + "</p>";
    },

    /* ---------- pontos de atenção para a Medipreço (Conferência e proposta) ---------- */
    pontos: function () {
      var D = A().D, I = A().I;
      function casos(id) { return (D.alertas.filter(function (a) { return a.id === id; })[0] || { casos: [] }).casos; }
      var a8 = casos("A8"), a4 = casos("A4")[0], a5 = casos("A5")[0];
      var a2 = casos("A2").filter(function (c) { return c.competencia === "2026-10"; })[0];
      var gOut = (D.grupos || []).filter(function (g) { return g.competencia === "2026-10"; })[0];
      var delta = I.nota["NF-01257"], estrela = I.nota["NF-01320"], bravo = I.nota["NF-01299"];
      var lista = [
        { titulo: "Quem sai no dia de corte", usamos: "Não conta naquele dia (D-040, provisório).", porque: "O contrato não diz. Fica destacado até o Felipe confirmar." },
        { titulo: "Dia 26 no fim de semana", usamos: "O dia 26 é fixo (D-080), mesmo quando a contagem é feita antes.",
          porque: F.numero(a8.length) + " notas foram contadas na sexta-feira anterior, porque o dia 26 caiu num sábado ou domingo. O alerta A8 mostra cada uma." },
        { titulo: "Rateio do Grupo Cedro", usamos: "A proporção do dia do máximo (D-074, D-079).",
          porque: gOut ? "Em outubro, o máximo foi " + F.numero(gOut.maximo) + " em " + F.data(gOut.dia_do_maximo) + (a2 ? ", antes de " + F.numero(a2.resumo.pessoas) + " pessoas mudarem de empresa" : "") + ". O total do grupo dá um " +
            F.acerto(gOut.diferenca) + "; a divisão entre as empresas depende do dia escolhido, que o contrato não fixa." : "O contrato não diz o dia." },
        { titulo: "Pró-rata da Faro", usamos: "Dias do próprio mês; o dia da saída não conta; arredonda-se só o total (D-075, D-078).", porque: "O contrato diz pró-rata dia, sem dizer o divisor." },
        { titulo: "Inclusão desfeita", usamos: "Fica fora da cobrança (D-041), pela regra dos 5 dias (D-077).",
          porque: a4 ? F.numero(a4.resumo.pessoas) + " pessoas da " + e(a4.cliente) + " entraram em " + F.data(a4.resumo.entradas_processadas_de) + " e saíram em " + F.data(a4.resumo.saidas_processadas_de) + ". Ao pé da letra, o contrato cobraria o mês inteiro." : "" },
        { titulo: "Faixa de preço da Delta", usamos: "A faixa vale para todas as vidas (D-044).",
          porque: delta ? "Em setembro, " + F.numero(delta.quantidade_pela_regra) + " vidas a " + F.moeda(delta.itens_pela_regra[0].unitario) + " custam " +
            F.moeda(Math.abs(delta.diferenca)) + " a menos que as " + F.numero(delta.quantidade_emitida) + " cobradas. Passar de 5.000 baixa a fatura inteira." : "" },
        { titulo: "Mínimo garantido da Estrela", usamos: "Vale o mínimo do contrato.",
          porque: estrela ? "Em outubro, pela data informada, eram " + F.numero((estrela.observacoes.filter(function (o) { return o.codigo === "minimo_aplicado"; })[0] || {}).contadas) +
            " vidas; a conta usa " + F.numero(estrela.quantidade_pela_regra) + ". Pela data de processamento parecia acima do mínimo." : "" },
        { titulo: "A nota que não bate com a base", usamos: "A diferença é mostrada, sem afirmar a causa (D-037).",
          porque: a5 ? e(a5.nota) + " cobrou " + F.numero(a5.resumo.cobrada) + "; no instante da contagem, a base tinha " + F.numero(a5.resumo.na_base_no_instante_da_contagem) + " titulares." : "" },
        { titulo: "Compensação da Bravo", usamos: "Medida no dia 26 do mês de referência (D-046).",
          porque: bravo ? e(bravo.nota) + " espera o dia " + F.data((bravo.motivo || {}).dia_necessario) + "; a base vai até " + F.data(D.fim_da_base) + "." : "" }
      ];
      return lista;
    }
  };

  window.Explica = Explica;
})();
