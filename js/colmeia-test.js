(async function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  if (typeof window === "undefined") {
    root.window = root;
    root.location = root.location || { hostname: "localhost" };
    require("./sanity-config.js");
    require("./sanity-api.js");
    require("./colmeia-data.js");
    require("./colmeia-graph.js");
  }

  if (!root.T3ColmeiaGraph?.construirGrafoColmeiaSeguro) return;

  const graph = await root.T3ColmeiaGraph.construirGrafoColmeiaSeguro();
  const nodesByTipo = graph.nodes.reduce((acc, node) => {
    acc[node.tipo] = (acc[node.tipo] || 0) + 1;
    return acc;
  }, {});
  const linksByKind = graph.links.reduce((acc, link) => {
    acc[link.kind] = (acc[link.kind] || 0) + 1;
    return acc;
  }, {});
  const manualByOrigem = graph.links
    .filter((link) => link.kind === "manual")
    .reduce((acc, link) => {
      const origem = link.origem || "conexao";
      acc[origem] = (acc[origem] || 0) + 1;
      return acc;
    }, { conexao: 0, relacionado: 0 });
  const connected = new Set();

  graph.links.forEach((link) => {
    connected.add(link.source);
    connected.add(link.target);
  });

  console.log("Colmeia nodes por tipo", nodesByTipo);
  console.log("Colmeia links por kind", linksByKind);
  console.log("Colmeia manuais por origem", manualByOrigem);
  console.log("Colmeia nos isolados", graph.nodes.filter((node) => !connected.has(node.id)).length);
})();
