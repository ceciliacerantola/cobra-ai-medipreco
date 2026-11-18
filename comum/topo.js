/* Topo, menu, rodapé, navegação e índice dos dados (lote E, tarefa 16).
   Cada tela se registra com App.registrar(id, { titulo, montar(partes, params) }).
   Endereço de cada tela: #/tela/parte?chave=valor. O botão voltar do navegador funciona
   porque toda mudança de tela, filtro ou página é uma mudança de endereço.
   A página não calcula valor de nota: tudo vem de dados.js, gerado pelo cálculo. */
(function () {
  "use strict";

  var NOME_DA_PAGINA = "Cobra aí"; /* nome de trabalho: fica escrito só aqui */

  /* Duas visões (spec, Topo). A visão Empresa/RH usa endereços que começam por "rh/". */
  var MENU = [
    { id: "inicio", rotulo: "Início" },
    { id: "clientes", rotulo: "Clientes" },
    { id: "notas", rotulo: "Notas" },
    { id: "extratos", rotulo: "Extratos" },
    { id: "calendario", rotulo: "Calendário" },
    { id: "conferencia", rotulo: "Conferência" }
  ];
  var MENU_RH = [
    { id: "rh/inicio", rotulo: "Início" },
    { id: "rh/notas", rotulo: "Minhas notas" },
    { id: "rh/extratos", rotulo: "Meus extratos" },
    { id: "rh/vidas", rotulo: "Minhas vidas" },
    { id: "rh/perfil", rotulo: "Meu perfil" }
  ];
  /* telas que pertencem a um item do menu (ex.: as abas de Notas acendem "Notas") */
  var GRUPO_DO_MENU = { "notas-a-emitir": "notas", "notas-como-emitir": "notas", pesquisa: null };
  var TELA_INICIAL = "inicio";
  var SEM_TOPO = { entrada: true, administrador: true }; /* telas sem topo e sem menu */
  var SEM_ENTRAR = { entrada: true, administrador: true, sobre: true, ajuda: true }; /* abrem sem ter entrado */
  var CHAVE_DA_ABA = "cobra-ai-entrou"; /* memória da própria aba (D-096): fechou a aba, esquece */
  /* tela equivalente na outra visão ("Ver como", C2); sem equivalente, vai ao Início */
  var PARA_RH = { notas: "rh/notas", "notas-a-emitir": "rh/notas", "notas-como-emitir": "rh/notas", extratos: "rh/extratos", ajuda: "ajuda", sobre: "sobre" };
  var PARA_MEDIPRECO = { notas: "notas", extratos: "extratos" };

  var SINO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

  /* Ajuda e Sobre valem para as duas visões (D-066): o topo fica na visão de quem entrou (ou da última troca em "Ver como"), para o RH não ver o menu da Medipreço */
  var DAS_DUAS_VISOES = { sobre: true, ajuda: true };
  function visaoDa(r, entrou) {
    if (DAS_DUAS_VISOES[r.tela]) return entrou === "rh" ? "rh" : "medipreco";
    return r.tela === "rh" ? "rh" : "medipreco";
  }

  function esc(v) {
    return String(v === null || v === undefined ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- índice dos dados: montado uma vez, usado por todas as telas ---------- */
  function montarIndice(D) {
    var I = {
      cliente: {}, nota: {}, notasDoCliente: {}, empresa: {}, clienteDoCnpj: {},
      cnpj: D.cnpjs, grupo: {}, eventosDaPessoa: null, colunas: {}
    };
    D.clientes.forEach(function (c) {
      I.cliente[c.id] = c;
      I.notasDoCliente[c.id] = [];
      c.empresas.forEach(function (e) { I.empresa[e.cnpj] = e; I.clienteDoCnpj[e.cnpj] = c.id; });
    });
    D.notas.forEach(function (n) {
      I.nota[n.nota] = n;
      if (I.notasDoCliente[n.cliente_id]) I.notasDoCliente[n.cliente_id].push(n);
    });
    /* mais recente primeiro: competência, depois número da nota */
    Object.keys(I.notasDoCliente).forEach(function (id) {
      I.notasDoCliente[id].sort(function (a, b) {
        return a.competencia === b.competencia ? (a.nota < b.nota ? -1 : 1) : (a.competencia < b.competencia ? 1 : -1);
      });
    });
    (D.grupos || []).forEach(function (g) { I.grupo[g.cliente_id + "|" + g.competencia] = g; });
    D.colunas_das_pessoas.forEach(function (c, i) { I.colunas[c] = i; });
    return I;
  }

  var App = {
    telas: {},
    esc: esc,
    nome: NOME_DA_PAGINA,
    D: null,
    I: null,

    registrar: function (id, tela) { this.telas[id] = tela; },

    /* ---------- endereços ---------- */
    rota: function () {
      var h = (location.hash || "").replace(/^#\/?/, "");
      var q = h.indexOf("?");
      var caminho = q > -1 ? h.slice(0, q) : h;
      var params = {};
      if (q > -1) {
        h.slice(q + 1).split("&").forEach(function (par) {
          if (!par) return;
          var kv = par.split("=");
          try { params[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " ")); } catch (e) { /* parte ilegível: ignorada */ }
        });
      }
      var partes = caminho.split("/").filter(Boolean).map(function (p) {
        try { return decodeURIComponent(p); } catch (e) { return p; }
      });
      return { tela: partes[0] || TELA_INICIAL, partes: partes.slice(1), params: params };
    },

    /* App.link("notas/NF-01306", { ver: "video" }) -> "#/notas/NF-01306?ver=video" */
    link: function (caminho, params) {
      var q = [];
      Object.keys(params || {}).forEach(function (k) {
        var v = params[k];
        if (v !== undefined && v !== null && v !== "") q.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
      });
      return "#/" + caminho + (q.length ? "?" + q.join("&") : "");
    },

    /* ---------- peças de tela ---------- */
    /* etiqueta discreta para o que não funciona de verdade ("simulado") ou é rascunho para a Ceci aprovar */
    etiqueta: function (tipo, dica) {
      var textos = {
        simulado: "Demonstração: isto não funciona de verdade nesta página.",
        rascunho: "Texto em rascunho: espera a aprovação da Ceci."
      };
      return '<span class="etiqueta" title="' + esc(dica || textos[tipo] || "") + '">' + esc(tipo) + "</span>";
    },

    /* pílula de alerta: "i" (informação) ou "!" (pendente). Com justificativa (HTML), abre um cartão. */
    alerta: function (tipo, rotulo, justificativa) {
      var pendente = tipo === "!";
      var pilula = '<span class="pilula ' + (pendente ? "pendente" : "info") + '"><span class="icone" aria-hidden="true">' +
        (pendente ? "!" : "i") + "</span>" + esc(rotulo) + "</span>";
      if (!justificativa) return pilula;
      return '<details class="alerta' + (pendente ? " pendente" : "") + '"><summary>' + pilula +
        '</summary><div class="justificativa">' + justificativa + "</div></details>";
    },

    vazio: function (texto) { return '<p class="vazio">' + esc(texto) + "</p>"; },

    naoEncontrado: function (texto, voltarPara, rotulo) {
      return this.vazio(texto) + '<p class="migalha voltar"><a href="' + this.link(voltarPara) + '">' + esc(rotulo) + "</a></p>";
    },

    semDados: function () {
      return '<div class="vazio"><p><strong>Os dados não carregaram.</strong></p>' +
        '<p>O arquivo <code>pagina/dados.js</code> não foi encontrado ou está com erro. Para gerar de novo, de dentro da pasta do projeto: ' +
        "<code>python3 calculo/calculo.py</code>, <code>python3 conferencia/conferencia.py</code> e <code>python3 calculo/gerar-dados-da-pagina.py</code>.</p></div>";
    },

    /* paginação "50 por vez": devolve a fatia e os links */
    paginar: function (lista, pagina, porVez, caminho, params) {
      var total = lista.length, paginas = Math.max(1, Math.ceil(total / porVez));
      var p = Math.min(Math.max(1, parseInt(pagina, 10) || 1), paginas);
      var fatia = lista.slice((p - 1) * porVez, p * porVez);
      var F = window.Formato, self = this;
      function para(n) { var x = {}; Object.keys(params || {}).forEach(function (k) { x[k] = params[k]; }); x.pagina = n; return self.link(caminho, x); }
      var nav = "";
      if (paginas > 1) {
        nav = '<nav class="paginas" aria-label="Páginas">' +
          (p > 1 ? '<a class="botao" href="' + para(p - 1) + '">‹ Anteriores</a>' : '<span class="botao" aria-disabled="true">‹ Anteriores</span>') +
          '<span class="pequeno suave">' + F.numero((p - 1) * porVez + 1) + " a " + F.numero(Math.min(p * porVez, total)) + " de " + F.numero(total) +
          " · página " + p + " de " + paginas + "</span>" +
          (p < paginas ? '<a class="botao" href="' + para(p + 1) + '">Próximas ›</a>' : '<span class="botao" aria-disabled="true">Próximas ›</span>') +
          "</nav>";
      }
      return { fatia: fatia, nav: nav, pagina: p, paginas: paginas };
    },

    /* nome da empresa pelo CNPJ (ou pelo índice do CNPJ, como vem nas linhas compactas) */
    empresa: function (cnpjOuIndice) {
      var cnpj = typeof cnpjOuIndice === "number" ? this.I.cnpj[cnpjOuIndice] : cnpjOuIndice;
      var e = this.I.empresa[cnpj];
      return { cnpj: cnpj || null, razao: e ? e.razao_social : null };
    },

    /* eventos de uma pessoa, montados só quando alguém pede (13 mil linhas) */
    eventosDaPessoa: function (pessoa) {
      var I = this.I;
      if (!I.eventosDaPessoa) {
        I.eventosDaPessoa = {};
        var c = {};
        this.D.eventos.colunas.forEach(function (nome, i) { c[nome] = i; });
        I.colunaDoEvento = c;
        this.D.eventos.linhas.forEach(function (l) {
          var p = l[c.pessoa];
          (I.eventosDaPessoa[p] = I.eventosDaPessoa[p] || []).push(l);
        });
      }
      return I.eventosDaPessoa[pessoa] || [];
    },

    /* os casos de alerta ligados a uma nota (pela nota, ou pelo cliente e competência quando o caso não tem nota) */
    alertasDaNota: function (n) {
      var saida = [];
      this.D.alertas.forEach(function (a) {
        a.casos.forEach(function (c) {
          var daNota = c.nota ? c.nota === n.nota : (c.cliente_id === n.cliente_id && c.competencia === n.competencia);
          if (daNota) saida.push({ alerta: a, caso: c });
        });
      });
      return saida;
    },

    alertasDoCliente: function (id) {
      var saida = [];
      this.D.alertas.forEach(function (a) {
        a.casos.forEach(function (c) { if (c.cliente_id === id) saida.push({ alerta: a, caso: c }); });
      });
      return saida;
    },

    /* ---------- topo e rodapé ---------- */
    /* topo da visão: refeito só quando a visão muda (ou quando entra/sai da Entrada) */
    montarTopo: function (visao) {
      var F = window.Formato;
      var hoje = this.D ? F.data(this.D.hoje) : F.SEM_DADO;
      var faixas = document.getElementById("faixas"), topo = document.getElementById("topo");
      document.getElementById("rodape").innerHTML =
        "<div><span>Demonstração · dados fictícios do kit do case “O fechamento do mês”.</span>" +
        "<span>A base vai até " + esc(hoje) + ". Os números vêm do cálculo (calculo/) e da conferência (conferencia/).</span></div>";
      if (visao === "nenhuma") { faixas.innerHTML = ""; topo.innerHTML = ""; topo.hidden = true; return; }
      topo.hidden = false;
      var rh = visao === "rh";
      faixas.innerHTML =
        '<div class="faixa"><div><strong>Demonstração</strong><span>Dados fictícios do kit do case. Nada é enviado, gravado nem emitido.</span></div></div>' +
        ""; /* faixa "Perguntas em aberto" retirada a pedido da Ceci (D-090); as perguntas seguem na Conferência e nas explicações */

      var menu = rh ? MENU_RH : MENU;
      var pesquisa = rh
        ? '<form class="pesquisa" role="search" data-rota="rh/pesquisa">' + /* só dados da empresa do acesso (D-107) */
            '<input type="search" name="q" aria-label="Pesquisar" autocomplete="off" ' +
            'placeholder="Pesquisar nas suas notas e pessoas (ex.: NF-01306, P106336)"></form>'
        : '<form class="pesquisa" role="search" data-rota="pesquisa">' +
            '<input type="search" name="q" aria-label="Pesquisar" autocomplete="off" ' +
            'placeholder="Pesquisar nota, cliente, CNPJ ou pessoa (ex.: NF-01306, Cedro, P685600)"></form>';

      topo.innerHTML =
        '<div class="topo-linha">' +
          '<a class="marca" href="#/' + (rh ? "rh/inicio" : "inicio") + '" aria-label="Medipreço, ' + esc(NOME_DA_PAGINA) + ': ir para o Início">' +
            '<img src="comum/marca/logo-simbolo.png" alt="">' +
            '<span><span class="marca-nome">Medipreço</span><br><span class="marca-sub">' + esc(NOME_DA_PAGINA) + "</span></span>" +
          "</a>" +
          pesquisa +
          '<span class="hoje">Hoje: <strong>' + esc(hoje) + "</strong></span>" +
          '<span class="sino-lugar"><button type="button" class="botao-icone sino" aria-label="Avisos" aria-expanded="false" aria-controls="painel-sino" data-sino>' +
            SINO + '<span class="contador" hidden></span></button><div id="painel-sino" class="painel-sino" hidden></div></span>' +
        "</div>" +
        '<div class="topo-linha topo-conta">' +
          '<span class="ver-como" role="group" aria-label="Ver como" title="Isto simula a troca de conta; não há login real.">Ver como: ' +
            '<a href="#/inicio" data-ver-como="medipreco"' + (rh ? "" : ' aria-current="true"') + ">Medipreço</a>" +
            '<a href="#/rh/inicio" data-ver-como="rh"' + (rh ? ' aria-current="true"' : "") + ">Empresa/RH</a></span>" +
          '<span class="perfil">' + (rh ? "RH · Aurora" : "Financeiro › Fechamento") + "</span>" +
          '<span class="links-topo"><a href="#/ajuda">Ajuda</a>' +
            '<a href="#/sobre">Sobre esta demo</a>' +
            '<a class="sair" href="#/entrada" data-sair>Sair</a></span>' +
        "</div>" +
        '<nav class="menu" aria-label="Telas">' +
          menu.map(function (m) { return '<a href="#/' + m.id + '" data-tela="' + m.id + '">' + esc(m.rotulo) + "</a>"; }).join("") +
        "</nav>";
    },

    /* ---------- entrar, trocar de visão e sair (C1, C2; tarefa 35) ---------- */
    entrou: function () {
      if (this._entrou) return this._entrou;
      try { this._entrou = window.sessionStorage.getItem(CHAVE_DA_ABA) || null; } catch (e) { /* sem memória da aba: só nesta abertura */ }
      return this._entrou;
    },
    lembrar: function (visao) {
      this._entrou = visao;
      try { if (visao) window.sessionStorage.setItem(CHAVE_DA_ABA, visao); else window.sessionStorage.removeItem(CHAVE_DA_ABA); } catch (e) { /* ignora */ }
    },
    /* chamado pela Entrada: lembra a visão e vai para o link pedido antes (ou o Início da visão) */
    entrar: function (visao, volta) {
      this.lembrar(visao);
      location.hash = volta ? "#/" + volta : (visao === "rh" ? "#/rh/inicio" : "#/inicio");
    },
    equivalente: function (r, paraVisao) {
      if (paraVisao === "rh") return PARA_RH[r.tela] || "rh/inicio";
      return r.tela === "rh" ? (PARA_MEDIPRECO[r.partes[0]] || "inicio") : r.tela;
    },

    mostrar: function () {
      var r = this.rota();
      if (!SEM_ENTRAR[r.tela] && !this.entrou()) {
        /* link direto sem ter entrado: vai à Entrada e, depois de entrar, volta para cá (C1, caso raro) */
        var pedido = (location.hash || "").replace(/^#\/?/, "");
        location.replace("#/entrada" + (pedido ? "?volta=" + encodeURIComponent(pedido) : ""));
        return;
      }
      var tela = this.telas[r.tela];
      var alvo = document.getElementById("tela");

      var visao = SEM_TOPO[r.tela] ? "nenhuma" : visaoDa(r, this.entrou());
      if (visao !== this._visao) { this.montarTopo(visao); this._visao = visao; }
      if (visao !== "nenhuma" && window.Avisos && this.D) window.Avisos.atualizarSino(visao);
      document.body.setAttribute("data-visao", visao);
      var itemDoMenu = r.tela === "rh" ? "rh/" + (r.partes[0] || "inicio")
        : (GRUPO_DO_MENU.hasOwnProperty(r.tela) ? GRUPO_DO_MENU[r.tela] : r.tela);

      Array.prototype.forEach.call(document.querySelectorAll(".menu a"), function (a) {
        if (a.getAttribute("data-tela") === itemDoMenu) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      var campo = document.querySelector(".pesquisa input");
      if (campo && (r.tela === "pesquisa" || (r.tela === "rh" && r.partes[0] === "pesquisa"))) campo.value = r.params.q || "";

      if (!tela) {
        alvo.innerHTML = this.naoEncontrado("Tela não encontrada.", visao === "rh" ? "rh/inicio" : TELA_INICIAL, "Ir para o Início");
      } else if (!this.D) {
        alvo.innerHTML = this.semDados();
      } else {
        try {
          alvo.innerHTML = tela.montar(r.partes, r.params);
        } catch (erro) {
          alvo.innerHTML = this.vazio("Esta tela não pôde ser montada. Detalhe: " + erro.message);
        }
      }
      document.title = (tela ? tela.titulo + " · " : "") + NOME_DA_PAGINA + " · Medipreço (demonstração)";
      /* volta ao topo só quando muda de tela ou de item; filtro e página mantêm a posição perto */
      var chave = r.tela + "/" + r.partes.join("/");
      if (chave !== this._ultima) window.scrollTo(0, 0);
      this._ultima = chave;
      /* ao escolher uma pessoa, a tela desce até os eventos dela */
      /* aviso do sino com "ir": desce até o trecho certo da tela (D-102) */
      var ancora = (r.params.pessoa && document.getElementById("eventos")) || (r.params.ir && document.getElementById(r.params.ir));
      if (ancora && ancora.scrollIntoView) ancora.scrollIntoView({ block: "start" });
    },

    /* ---------- ações da página (delegadas: funcionam em qualquer tela) ---------- */
    ligarAcoes: function () {
      var self = this;
      document.addEventListener("submit", function (ev) {
        var form = ev.target;
        if (!form.getAttribute || !form.getAttribute("data-rota")) return;
        ev.preventDefault();
        var params = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (el.name && el.value !== "") params[el.name] = el.value.trim();
        });
        location.hash = self.link(form.getAttribute("data-rota"), params);
      });
      document.addEventListener("click", function (ev) {
        var alvo = ev.target.closest ? ev.target : null;
        if (!alvo) return;
        var ver = alvo.closest("[data-ver-como]");
        if (ver) {
          ev.preventDefault();
          var v = ver.getAttribute("data-ver-como");
          self.lembrar(v);
          var destino = "#/" + self.equivalente(self.rota(), v);
          if (location.hash === destino) self.mostrar(); /* Ajuda e Sobre: mesma tela, só troca o topo */
          else location.hash = destino;
          return;
        }
        if (alvo.closest("[data-sair]")) {
          ev.preventDefault();
          self.lembrar(null);
          location.hash = "#/entrada";
          return;
        }
        var sino = alvo.closest("[data-sino]");
        var painel = document.getElementById("painel-sino");
        if (sino && painel) {
          var abrir = painel.hidden;
          painel.hidden = !abrir;
          sino.setAttribute("aria-expanded", abrir ? "true" : "false");
          return;
        }
        if (painel && !painel.hidden && (!alvo.closest("#painel-sino") || alvo.closest("a"))) {
          painel.hidden = true;
          var b = document.querySelector("[data-sino]");
          if (b) b.setAttribute("aria-expanded", "false");
        }
        /* C15 (tarefa 47): botão simulado mostra o que aconteceria na versão real; nada sai da página.
           A Entrada tem o seu próprio aviso (entrada.js). */
        var sim = alvo.closest("[data-simulado]");
        if (sim && !sim.closest("[data-entrada]")) { self.avisoSimulado(sim); return; }
        var el = alvo.closest("[data-copiar], [data-baixar], [data-imprimir]");
        if (!el) return;
        if (el.hasAttribute("data-copiar")) self.copiar(el);
        if (el.hasAttribute("data-baixar") && window.Baixar) window.Baixar.executar(el.getAttribute("data-baixar"));
        if (el.hasAttribute("data-imprimir")) window.print();
      });
    },

    /* uma mensagem por grupo de botões: clicar de novo troca o texto, não repete */
    avisoSimulado: function (botao) {
      var texto = botao.getAttribute("data-simulado") || "Isto não funciona de verdade nesta demonstração.";
      var grupo = botao.closest(".linha-botoes") || botao.parentNode;
      var msg = grupo.nextElementSibling;
      if (!msg || !msg.classList.contains("msg-simulado")) {
        msg = document.createElement("p");
        msg.className = "msg-simulado";
        msg.setAttribute("role", "status");
        grupo.parentNode.insertBefore(msg, grupo.nextSibling);
      }
      msg.innerHTML = "<strong>Simulado.</strong> ";
      msg.appendChild(document.createTextNode(texto));
    },

    fecharSinoComEsc: function () {
      document.addEventListener("keydown", function (ev) {
        var painel = document.getElementById("painel-sino");
        if (ev.key === "Escape" && painel && !painel.hidden) {
          painel.hidden = true;
          var b = document.querySelector("[data-sino]");
          if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
        }
      });
    },

    copiar: function (botao) {
      var origem = document.getElementById(botao.getAttribute("data-copiar"));
      if (!origem) return;
      var texto = origem.innerText;
      function feito(ok) {
        var antes = botao.getAttribute("data-rotulo") || botao.textContent;
        botao.setAttribute("data-rotulo", antes);
        botao.textContent = ok ? "Copiado" : "Não deu para copiar: selecione o texto";
        setTimeout(function () { botao.textContent = antes; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(false); });
      } else {
        var area = document.createElement("textarea");
        area.value = texto; document.body.appendChild(area); area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(area); feito(ok);
      }
    },

    /* topo preso no alto: some ao rolar para baixo, volta ao rolar para cima (como o site da Medipreço) */
    ligarRolagem: function () {
      var ultimo = window.pageYOffset || 0, topo = document.getElementById("topo");
      window.addEventListener("scroll", function () {
        var y = window.pageYOffset || 0;
        if (Math.abs(y - ultimo) < 6) return;
        if (y > ultimo && y > topo.offsetHeight + 60) topo.classList.add("escondido");
        else topo.classList.remove("escondido");
        ultimo = y;
      }, { passive: true });
      topo.addEventListener("focusin", function () { topo.classList.remove("escondido"); });
    },

    iniciar: function () {
      this.D = window.DADOS || null;
      if (this.D) this.I = montarIndice(this.D);
      this.ligarAcoes();
      this.fecharSinoComEsc();
      this.ligarRolagem();
      this.mostrar();
      window.addEventListener("hashchange", this.mostrar.bind(this));
    }
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", function () { App.iniciar(); });
})();
