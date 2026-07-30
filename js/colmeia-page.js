(function () {
  "use strict";

  async function carregarColmeia() {
    if (!window.T3Sanity?.enabled || !window.T3Sanity?.fetchColmeia) {
      throw new Error("Fonte de dados da Colmeia indisponivel");
    }

    const dados = await window.T3Sanity.fetchColmeia();
    if (!dados || typeof dados !== "object") throw new Error("Sanity sem dados da Colmeia");
    window.T3Sanity?.devLog?.("Fonte da Colmeia: Sanity");
    return dados;
  }

  function mostrarCarregamento(message) {
    const loading = document.getElementById("colmeia-loading");
    if (loading) loading.textContent = message;
  }

  function esconderEstado() {
    const state = document.getElementById("colmeia-state");
    if (!state) return;
    state.hidden = true;
    state.replaceChildren();
  }

  function mostrarEstado(message, kind = "error", action) {
    const loading = document.getElementById("colmeia-loading");
    const state = document.getElementById("colmeia-state");
    if (loading) loading.hidden = true;
    if (!state) return;
    state.hidden = false;
    state.dataset.kind = kind;
    const text = document.createElement("p");
    text.textContent = message;
    state.replaceChildren(text);

    if (action?.label && typeof action.onClick === "function") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "colmeia-state__action";
      button.textContent = action.label;
      button.addEventListener("click", action.onClick, { once: true });
      state.appendChild(button);
    }
  }

  function bindColmeiaControls(view) {
    const search = document.getElementById("search");
    const reset = document.getElementById("reset");
    const chips = document.querySelectorAll("#chips [data-type]");

    if (search) search.oninput = (event) => {
      view.setQuery?.(event.target.value);
    };

    if (reset) reset.onclick = () => {
      if (search) {
        search.value = "";
        view.setQuery?.("");
      }
      view.resetFilters?.();
      chips.forEach((chip) => {
        chip.classList.add("on");
        chip.classList.remove("off");
        chip.setAttribute("aria-pressed", "true");
      });
      view.recenter?.();
      const status = document.getElementById("searchStatus");
      if (status) status.textContent = "Mapa recentralizado.";
    };

    chips.forEach((chip) => {
      chip.onclick = () => {
        const hidden = view.toggleType?.(chip.dataset.type);
        chip.classList.toggle("on", !hidden);
        chip.classList.toggle("off", Boolean(hidden));
        chip.setAttribute("aria-pressed", String(!hidden));
      };
    });
  }

  let activeView = null;

  async function iniciarColmeia() {
    const canvas = document.getElementById("cv");
    if (!canvas) return;

    try {
      activeView?.destroy?.();
      activeView = null;
      esconderEstado();
      mostrarCarregamento("Carregando Colmeia...");
      const loading = document.getElementById("colmeia-loading");
      if (loading) loading.hidden = false;
      const dados = await carregarColmeia();
      const graph = window.T3ColmeiaGraph.construirGrafo({
        ...dados,
        sugestoes: window.colmeiaSuggestedRelations || []
      });

      activeView = window.T3ColmeiaView.createColmeiaView({
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
        catalogClose: document.getElementById("catalogClose"),
        catalogSummary: document.getElementById("catalogSummary"),
        searchStatus: document.getElementById("searchStatus"),
        loading: document.getElementById("colmeia-loading")
      });
      bindColmeiaControls(activeView);
      if (!graph.nodes.length) {
        mostrarEstado(
          graph.catalogNodes.length
            ? "Ainda não há conexões publicadas. Explore os conteúdos pelo catálogo."
            : "Ainda não há conteúdos publicados na Colmeia.",
          "empty",
          graph.catalogNodes.length
            ? { label: "Abrir catálogo", onClick: () => activeView?.openCatalog?.(true) }
            : null
        );
      }
    } catch (erro) {
      console.warn("Falha ao carregar a Colmeia.", erro);
      mostrarEstado(
        "Não foi possível carregar a Colmeia. Verifique sua conexão e tente novamente.",
        "error",
        { label: "Tentar novamente", onClick: iniciarColmeia }
      );
    }
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

    iniciarColmeia();
  });
})();
