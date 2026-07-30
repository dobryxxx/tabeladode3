const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = globalThis;
global.location = {hostname: "localhost"};

require("../js/sanity-config.js");
require("../js/sanity-api.js");
require("../js/colmeia-suggestions.js");
require("../js/colmeia-graph.js");

const {construirGrafo} = globalThis.T3ColmeiaGraph;

test("separa o catalogo completo dos nos conectados do canvas", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A", relacionados: ["b"]},
      {_id: "b", label: "B"},
      {_id: "isolado", label: "Isolado"}
    ]
  });

  assert.deepEqual(graph.nodes.map((node) => node.id).sort(), ["a", "b"]);
  assert.deepEqual(graph.catalogNodes.map((node) => node.id).sort(), ["a", "b", "isolado"]);
  assert.deepEqual(graph.isolatedNodes.map((node) => node.id), ["isolado"]);
  assert.deepEqual(graph.stats, {
    totalContent: 3,
    connectedContent: 2,
    isolatedContent: 1
  });
});

test("relacionados prevalece sobre conexao legada duplicada", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A", relacionados: ["b"]},
      {_id: "b", label: "B"}
    ],
    conexoes: [
      {_id: "legacy", de: "b", para: "a", descricao: "legado", peso: 4}
    ]
  });

  const manual = graph.links.filter((link) => link.kind === "manual");
  assert.equal(manual.length, 1);
  assert.equal(manual[0].origem, "relacionado");
  assert.equal(manual[0].via, "relacionado");
});

test("relacao manual prevalece sobre sugestao curada para o mesmo par", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A", relacionados: ["b"]},
      {_id: "b", label: "B"}
    ],
    sugestoes: [
      {source: "a", target: "b", via: "mesmo tema"}
    ]
  });

  assert.equal(graph.links.length, 1);
  assert.equal(graph.links[0].kind, "manual");
  assert.equal(graph.links[0].origem, "relacionado");
});

test("inclui somente sugestoes com dois artigos publicados no catalogo", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A"},
      {_id: "b", label: "B"}
    ],
    sugestoes: [
      {source: "a", target: "b", via: "mesma trajetoria"},
      {source: "a", target: "ausente", via: "referencia ausente"},
      {source: "a", target: "a", via: "autorrelacao"}
    ]
  });

  const suggested = graph.links.filter((link) => link.kind === "suggested");
  assert.equal(suggested.length, 1);
  assert.equal(suggested[0].via, "mesma trajetoria");
  assert.equal(suggested[0].origem, "curadoria");
});

test("camada curada possui pares unicos e volume inicial controlado", () => {
  const suggestions = globalThis.colmeiaSuggestedRelations;
  const pairs = suggestions.map((item) => [item.source, item.target].sort().join("|"));

  assert.equal(suggestions.length, 37);
  assert.equal(new Set(pairs).size, suggestions.length);
  assert.equal(suggestions.some((item) => item.source === item.target), false);
  assert.equal(suggestions.every((item) => item.via), true);
});

test("ignora autorrelacoes e referencias para documentos ausentes", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A", relacionados: ["a", "ausente"]}
    ],
    conexoes: [
      {_id: "self", de: "a", para: "a"}
    ]
  });

  assert.equal(graph.links.length, 0);
  assert.equal(graph.nodes.length, 0);
  assert.equal(graph.isolatedNodes.length, 1);
});

test("cria hubs somente para tags compartilhadas e nao estruturais", () => {
  const graph = construirGrafo({
    posts: [
      {_id: "a", label: "A", tags: ["PnR", "basquete"]},
      {_id: "b", label: "B", tags: ["pnr", "basquete"]}
    ],
    settings: {
      tagsEstruturais: ["basquete"]
    }
  });

  const hubs = graph.nodes.filter((node) => node.tipo === "tag");
  assert.equal(hubs.length, 1);
  assert.equal(hubs[0].slug, "pnr");
  assert.equal(graph.links.filter((link) => link.kind === "tag").length, 2);
});

test("consulta publica da Colmeia inclui apenas artigos publicados e tweets", () => {
  const query = globalThis.T3Sanity.queries.colmeia;

  assert.match(query, /_type == "post"[^}]+coalesce\(status, "publicado"\) == "publicado"/s);
  assert.match(query, /_type == "tweetCard"/);
  assert.doesNotMatch(query, /_type == "glossaryTerm"/);
  assert.doesNotMatch(query, /_type == "ranking"/);
  assert.doesNotMatch(query, /_type == "tip"/);
  assert.doesNotMatch(query, /draftProspect/);
});

test("grafo ignora colecoes editoriais fora de artigos e tweets", () => {
  const graph = construirGrafo({
    posts: [{_id: "post", label: "Artigo", relacionados: ["tweet"]}],
    tweets: [{_id: "tweet", label: "Tweet"}],
    termos: [{_id: "termo", label: "Termo"}],
    rankings: [{_id: "ranking", label: "Ranking"}],
    dicas: [{_id: "dica", label: "Dica"}]
  });

  assert.deepEqual(graph.catalogNodes.map((node) => node.id).sort(), ["post", "tweet"]);
  assert.deepEqual(graph.nodes.map((node) => node.id).sort(), ["post", "tweet"]);
});

test("Studio filtra novas relacoes para artigos e tweets sem invalidar tipos legados", () => {
  const relationsSource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "colmeiaRelations.js"), "utf8");
  const glossarySource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "glossaryTerm.js"), "utf8");
  const rankingSource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "ranking.js"), "utf8");
  const tipSource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "tip.js"), "utf8");

  assert.match(relationsSource, /filter: '_type in \["post", "tweetCard"\]'/);
  assert.match(relationsSource, /\{type: 'glossaryTerm'\}/);
  assert.match(glossarySource, /name: 'relacionados'[\s\S]+hidden: true/);
  assert.match(rankingSource, /name: 'relacionados'[\s\S]+hidden: true/);
  assert.match(tipSource, /name: 'relacionados'[\s\S]+hidden: true/);
});

test("Studio oferece confirmacao de sugestoes no campo relacionados existente", () => {
  const componentSource = fs.readFileSync(
    path.join(__dirname, "..", "sanity", "components", "ColmeiaRelacionadosInput.jsx"),
    "utf8"
  );
  const postSource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "post.js"), "utf8");
  const tweetSource = fs.readFileSync(path.join(__dirname, "..", "sanity", "schemaTypes", "tweetCard.js"), "utf8");

  assert.match(componentSource, /onItemAppend\(\{\s*_key:/s);
  assert.match(componentSource, /_type: 'reference'/);
  assert.match(componentSource, /confirmsCurrent/);
  assert.match(componentSource, /Publique o conteúdo para confirmar/);
  assert.match(componentSource, /confirmingIdsRef\.current\.has/);
  assert.match(postSource, /components: \{input: ColmeiaRelacionadosInput\}/);
  assert.match(tweetSource, /components: \{input: ColmeiaRelacionadosInput\}/);
  assert.match(componentSource, /useFormValue\(\['_id'\]\)/);
});

test("canvas e paineis oferecem alternativa semantica segura", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "colmeia.html"), "utf8");

  assert.match(html, /<canvas id="cv" role="img"/);
  assert.doesNotMatch(html, /<canvas id="cv"[^>]+tabindex=/);
  assert.match(html, /id="panel" role="dialog"[^>]+aria-hidden="true" hidden/);
  assert.match(html, /id="mobileList"[^>]+role="region"[^>]+hidden/);
});

test("estado de erro permite tentar novamente", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "..", "js", "colmeia-page.js"), "utf8");

  assert.match(pageSource, /label: "Tentar novamente", onClick: iniciarColmeia/);
  assert.match(pageSource, /Verifique sua conexão e tente novamente/);
});

test("renderizacao do grafo dorme quando nao ha mudancas", () => {
  const viewSource = fs.readFileSync(path.join(__dirname, "..", "js", "colmeia-view.js"), "utf8");

  assert.match(viewSource, /function requestDraw\(\)/);
  assert.match(viewSource, /if \(keepAnimating\) requestDraw\(\)/);
  assert.doesNotMatch(viewSource, /frame = requestAnimationFrame\(draw\)/);
  assert.match(viewSource, /setCatalogOpen\(true, false\)/);
});
