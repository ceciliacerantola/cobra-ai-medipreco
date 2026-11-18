/* Tela E1 — Entrada (login simulado). Tarefa 29 (tela) e 35 (C1: entrar).
   Clicar no e-mail mostra os dois acessos fictícios; escolher um preenche a senha em asteriscos;
   "Entrar" abre a visão do acesso, ou o link pedido antes de entrar (?volta=...).
   Ninguém digita senha e nada é enviado. A página lembra quem entrou só enquanto a aba estiver aberta (D-096). */
(function () {
  "use strict";
  function A() { return window.App; }

  var ACESSOS = [
    { email: "felipe@medipreco.exemplo", visao: "medipreco", rotulo: "Visão Medipreço", perfil: "Financeiro › Fechamento" },
    { email: "rh@aurora.exemplo", visao: "rh", rotulo: "Visão Empresa/RH", perfil: "RH · Aurora Logística" }
  ];
  var escolhido = null;

  function marca() {
    return '<div class="entrada-marca"><img src="comum/marca/logo-simbolo.png" alt="">' +
      '<div><span class="marca-nome">Medipreço</span><br>' + A().nomeNaMarca + "</div></div>";
  }

  function desenhar() {
    var esc = A().esc, r = A().rota();
    var volta = r.params.volta || "";
    return '<form class="cartao entrada" data-entrada data-volta="' + esc(volta) + '" novalidate>' + marca() +
      '<p class="entrada-aviso"><strong>Demonstração.</strong> Os acessos abaixo são fictícios. Isto simula a troca de conta; não há login real.</p>' +
      (volta ? '<p class="pequeno suave">Depois de entrar, você volta para o link que abriu.</p>' : "") +
      '<label class="rotulo" for="entrada-email">E-mail</label>' +
      '<button type="button" id="entrada-email" class="entrada-email" aria-haspopup="listbox" aria-expanded="false" data-abrir-acessos>' +
        '<span class="suave">Escolha um dos dois acessos</span></button>' +
      '<ul class="entrada-acessos" role="listbox" aria-label="Acessos fictícios" hidden>' +
        ACESSOS.map(function (a, i) {
          return '<li role="option" aria-selected="false"><button type="button" data-acesso="' + i + '"><strong>' + esc(a.email) + "</strong>" +
            '<span class="pequeno suave">' + esc(a.rotulo) + " · " + esc(a.perfil) + "</span></button></li>";
        }).join("") +
      "</ul>" +
      '<label class="rotulo" for="entrada-senha">Senha</label>' +
      '<input id="entrada-senha" class="entrada-senha" type="text" readonly value="" placeholder="preenchida ao escolher o acesso" ' +
        'title="Preenchida sozinha ao escolher o acesso. Ninguém digita senha.">' +
      '<p class="entrada-erro" role="alert" hidden>Escolha um dos dois acessos para entrar.</p>' +
      '<div class="linha-botoes entrada-botoes">' +
        '<button type="submit" class="botao principal">Entrar</button>' +
        '<button type="button" class="botao" data-simulado="Na versão real, aqui se pediria um link para criar uma senha nova.">Esqueci a senha</button>' + A().etiqueta("simulado") +
      "</div>" +
      '<p class="pequeno entrada-links"><a href="#/administrador">Acesso de administrador</a> · <a href="#/sobre">Sobre esta demo</a></p>' +
      "</form>";
  }

  function escolher(form, i) {
    escolhido = ACESSOS[i];
    form.querySelector("#entrada-email").innerHTML = "<strong>" + A().esc(escolhido.email) + '</strong><span class="pequeno suave"> · ' + A().esc(escolhido.rotulo) + "</span>";
    form.querySelector("#entrada-email").setAttribute("aria-expanded", "false");
    form.querySelector(".entrada-acessos").hidden = true;
    Array.prototype.forEach.call(form.querySelectorAll("[role=option]"), function (li, j) { li.setAttribute("aria-selected", j === i ? "true" : "false"); });
    form.querySelector("#entrada-senha").value = "••••••••";
    form.querySelector(".entrada-erro").hidden = true;
  }

  document.addEventListener("click", function (ev) {
    var form = ev.target.closest && ev.target.closest("[data-entrada]");
    if (!form) return;
    if (ev.target.closest("[data-abrir-acessos]")) {
      var lista = form.querySelector(".entrada-acessos");
      lista.hidden = !lista.hidden;
      form.querySelector("#entrada-email").setAttribute("aria-expanded", lista.hidden ? "false" : "true");
      return;
    }
    var op = ev.target.closest("[data-acesso]");
    if (op) { escolher(form, +op.getAttribute("data-acesso")); return; }
    var sim = ev.target.closest("[data-simulado]");
    if (sim) {
      var e = form.querySelector(".entrada-erro");
      e.textContent = "Simulado. " + sim.getAttribute("data-simulado");
      e.hidden = false;
    }
  });

  document.addEventListener("submit", function (ev) {
    var form = ev.target;
    if (!form.hasAttribute || !form.hasAttribute("data-entrada")) return;
    ev.preventDefault();
    if (!escolhido) {
      var e = form.querySelector(".entrada-erro");
      e.textContent = "Escolha um dos dois acessos para entrar.";
      e.hidden = false;
      form.querySelector("#entrada-email").focus();
      return;
    }
    A().entrar(escolhido.visao, form.getAttribute("data-volta"));
  });

  A().registrar("entrada", {
    titulo: "Entrada",
    montar: function () { escolhido = null; return desenhar(); }
  });

  /* espaço reservado (D-053): a pasta administrador/ fica para a onda 3 */
  A().registrar("administrador", {
    titulo: "Administrador",
    montar: function () {
      return '<div class="cartao entrada">' + marca() +
        '<h1 class="entrada-titulo">Acesso de administrador</h1>' +
        '<p class="suave">Este acesso ainda não existe nesta demonstração.</p>' +
        '<p class="entrada-links"><a href="#/entrada">Voltar para a entrada</a></p></div>';
    }
  });
})();
