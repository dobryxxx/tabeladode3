(async function () {
  const canvas = document.querySelector("#colmeia-canvas");
  if (!canvas) return;

  const status = document.querySelector("#colmeia-status");

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  async function carregarColmeia() {
    if (!window.T3Sanity?.enabled || !window.T3Sanity?.fetchColmeia) {
      window.T3Sanity?.devLog?.("Fonte da Colmeia: fallback local");
      return window.colmeiaFallbackData || {};
    }

    try {
      const dados = await window.T3Sanity.fetchColmeia();
      if (!dados || typeof dados !== "object") throw new Error("Sanity sem dados da Colmeia");
      window.T3Sanity?.devLog?.("Fonte da Colmeia: Sanity");
      return dados;
    } catch (erro) {
      console.warn("Nao foi possivel carregar a Colmeia do Sanity. Usando fallback local.", erro);
      return window.colmeiaFallbackData || {};
    }
  }

  try {
    setStatus("Carregando Colmeia...");
    const dados = await carregarColmeia();
    const graph = window.T3ColmeiaGraph.construirGrafo(dados);

    window.T3ColmeiaView.createColmeiaView({
      canvas,
      detail: document.querySelector("#colmeia-detail"),
      filters: document.querySelector("#colmeia-filters"),
      search: document.querySelector("#colmeia-search"),
      centerButton: document.querySelector("#colmeia-center"),
      status,
      graph
    });
  } catch (erro) {
    console.warn("Falha ao construir a Colmeia. Usando fallback local.", erro);
    const graph = window.T3ColmeiaGraph.construirGrafo(window.colmeiaFallbackData || {});
    window.T3ColmeiaView.createColmeiaView({
      canvas,
      detail: document.querySelector("#colmeia-detail"),
      filters: document.querySelector("#colmeia-filters"),
      search: document.querySelector("#colmeia-search"),
      centerButton: document.querySelector("#colmeia-center"),
      status,
      graph
    });
  }
})();
