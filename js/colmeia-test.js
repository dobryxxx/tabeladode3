(async function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  if (typeof window === "undefined") {
    root.window = root;
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
  const connected = new Set();

  graph.links.forEach((link) => {
    connected.add(link.source);
    connected.add(link.target);
  });

  console.log("Colmeia nodes por tipo", nodesByTipo);
  console.log("Colmeia links por kind", linksByKind);
  console.log("Colmeia nos isolados", graph.nodes.filter((node) => !connected.has(node.id)).length);
})();
