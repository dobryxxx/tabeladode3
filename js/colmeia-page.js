(function () {
  "use strict";

  function fallbackData() {
    return window.colmeiaFallbackData || {};
  }

  async function carregarColmeia() {
    if (!window.T3Sanity?.enabled || !window.T3Sanity?.fetchColmeia) {
      window.T3Sanity?.devLog?.("Fonte da Colmeia: fallback local");
      return fallbackData();
    }

    try {
      const dados = await window.T3Sanity.fetchColmeia();
      if (!dados || typeof dados !== "object") throw new Error("Sanity sem dados da Colmeia");
      window.T3Sanity?.devLog?.("Fonte da Colmeia: Sanity");
      return dados;
    } catch (erro) {
      console.warn("Nao foi possivel carregar a Colmeia do Sanity. Usando fallback local.", erro);
      return fallbackData();
    }
  }

  function mostrarFalha(message) {
    const loading = document.getElementById("colmeia-loading");
    if (loading) loading.textContent = message;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("cv");
    if (!canvas) return;

    if (window.T3SiteVisibilityReady) {
      await window.T3SiteVisibilityReady;
    }

    if (window.T3SiteVisibility?.isColmeiaVisible?.() === false) {
      window.T3SiteVisibility.showColmeiaUnavailable?.();
      return;
    }

    try {
      mostrarFalha("Carregando Colmeia...");
      const dados = await carregarColmeia();
      const graph = window.T3ColmeiaGraph.construirGrafo(dados);

      window.T3ColmeiaView.createColmeiaView({
        canvas,
        graph,
        chips: document.getElementById("chips"),
        legend: document.getElementById("legend"),
        search: document.getElementById("search"),
        reset: document.getElementById("reset"),
        panel: document.getElementById("panel"),
        panelContent: document.getElementById("panelContent"),
        panelClose: document.getElementById("panelClose"),
        listToggle: document.getElementById("listToggle"),
        mobileList: document.getElementById("mobileList"),
        mobileListContent: document.getElementById("mobileListContent"),
        loading: document.getElementById("colmeia-loading")
      });
    } catch (erro) {
      console.warn("Falha ao construir a Colmeia. Usando fallback local.", erro);
      try {
        const graph = window.T3ColmeiaGraph.construirGrafo(fallbackData());
        window.T3ColmeiaView.createColmeiaView({
          canvas,
          graph,
          chips: document.getElementById("chips"),
          legend: document.getElementById("legend"),
          search: document.getElementById("search"),
          reset: document.getElementById("reset"),
          panel: document.getElementById("panel"),
          panelContent: document.getElementById("panelContent"),
          panelClose: document.getElementById("panelClose"),
          listToggle: document.getElementById("listToggle"),
          mobileList: document.getElementById("mobileList"),
          mobileListContent: document.getElementById("mobileListContent"),
          loading: document.getElementById("colmeia-loading")
        });
      } catch (fallbackErro) {
        console.warn("Fallback local da Colmeia tambem falhou.", fallbackErro);
        mostrarFalha("Colmeia indisponivel no momento.");
      }
    }
  });
})();
