/* Formatação em português do Brasil.
   Regras (06-montagem/arquitetura-e-visual/arquitetura.md): dado ausente vira "—", nunca zero;
   data é lida como TEXTO (ano, mês, dia), sem fuso, para o dia de corte não mudar na tela. */
(function () {
  "use strict";

  var SEM_DADO = "—";
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
               "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var inteiro = new Intl.NumberFormat("pt-BR");

  function ausente(v) { return v === null || v === undefined || v === "" || (typeof v === "number" && isNaN(v)); }

  window.Formato = {
    SEM_DADO: SEM_DADO,

    /* 6378 -> "R$ 6.378,00" */
    moeda: function (v) { return ausente(v) ? SEM_DADO : moeda.format(v); },

    /* 5051 -> "5.051" */
    numero: function (v) { return ausente(v) ? SEM_DADO : inteiro.format(v); },

    /* -160.5 -> "− R$ 160,50" ; 0 -> "R$ 0,00" ; com sinal explícito */
    diferenca: function (v) {
      if (ausente(v)) return SEM_DADO;
      if (v === 0) return moeda.format(0);
      return (v < 0 ? "− " : "+ ") + moeda.format(Math.abs(v));
    },

    /* "2026-10-26" ou "2026-10-26 09:00:00" -> "26/10/2026" */
    data: function (iso) {
      var p = ausente(iso) ? null : /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
      return p ? p[3] + "/" + p[2] + "/" + p[1] : SEM_DADO;
    },

    /* "2026-10-26 09:00:00" -> "26/10/2026 09:00" */
    dataHora: function (iso) {
      var p = ausente(iso) ? null : /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(iso));
      return p ? p[3] + "/" + p[2] + "/" + p[1] + " " + p[4] + ":" + p[5] : this.data(iso);
    },

    /* "2026-10" -> "outubro de 2026" */
    competencia: function (c) {
      var p = ausente(c) ? null : /^(\d{4})-(\d{2})/.exec(String(c));
      return p ? MESES[parseInt(p[2], 10) - 1] + " de " + p[1] : SEM_DADO;
    },

    /* "carga_rh" -> "carga do RH" (o nome mostrado é sempre o mesmo, sistema-visual §6) */
    origem: function (o) {
      var nomes = { carga_rh: "carga do RH", portal_rh: "portal do RH", suporte_medipreco: "suporte" };
      return ausente(o) ? SEM_DADO : (nomes[o] || String(o));
    },

    tipoEvento: function (t) {
      var nomes = { entrada: "Entrada", saida: "Saída", troca_plano: "Troca de plano" };
      return ausente(t) ? SEM_DADO : (nomes[t] || String(t));
    },

    /* 264.80645 -> "264,8065" (Faro: quantidade fracionada; até 4 casas) */
    fracao: function (v) {
      if (ausente(v)) return SEM_DADO;
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(v);
    },

    /* "2026-07-26" -> "domingo" (lido como texto, sem fuso) */
    diaDaSemana: function (iso) {
      var p = ausente(iso) ? null : /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
      if (!p) return SEM_DADO;
      var dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
      return dias[new Date(Date.UTC(+p[1], +p[2] - 1, +p[3])).getUTCDay()];
    },

    /* diferença "pela regra − emitido": negativa = crédito ao cliente; positiva = débito (a Medipreço cobra) */
    acerto: function (v) {
      if (ausente(v)) return SEM_DADO;
      if (v === 0) return "sem diferença";
      return (v < 0 ? "crédito de " : "débito de ") + moeda.format(Math.abs(v));
    },

    /* mês diferente entre a data informada e a de processamento */
    atrasado: function (informada, processamento) {
      if (ausente(informada) || ausente(processamento)) return false;
      return String(informada).slice(0, 7) !== String(processamento).slice(0, 7);
    }
  };
})();
