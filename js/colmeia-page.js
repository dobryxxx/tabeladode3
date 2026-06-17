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

  function bindColmeiaControls(view) {
    const search = document.getElementById("search");
    const reset = document.getElementById("reset");
    const chips = document.querySelectorAll("#chips [data-type]");

    search?.addEventListener("input", (event) => {
      view.setQuery?.(event.target.value);
    });

    reset?.addEventListener("click", () => {
      if (search) {
        search.value = "";
        view.setQuery?.("");
      }
      view.recenter?.();
    });

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const hidden = view.toggleType?.(chip.dataset.type);
        chip.classList.toggle("on", !hidden);
        chip.classList.toggle("off", Boolean(hidden));
      });
    });
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

      const view = window.T3ColmeiaView.createColmeiaView({
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
      bindColmeiaControls(view);
    } catch (erro) {
      console.warn("Falha ao construir a Colmeia. Usando fallback local.", erro);
      try {
        const graph = window.T3ColmeiaGraph.construirGrafo(fallbackData());
        const view = window.T3ColmeiaView.createColmeiaView({
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
        bindColmeiaControls(view);
      } catch (fallbackErro) {
        console.warn("Fallback local da Colmeia tambem falhou.", fallbackErro);
        mostrarFalha("Colmeia indisponivel no momento.");
      }
    }
  });
})();
