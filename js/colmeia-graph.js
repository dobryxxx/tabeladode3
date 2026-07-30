(function () {
  // Tunavel: numero minimo de conteudos para uma tag virar hub.
  const TAG_MIN_USES = 2;

  function slugify(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function arraySeguro(value) {
    return Array.isArray(value) ? value : [];
  }

  function textoSeguro(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function normalizarTags(tags) {
    const vistas = new Set();

    return arraySeguro(tags)
      .map((tag) => textoSeguro(tag).trim())
      .filter(Boolean)
      .map((label) => ({ label, slug: slugify(label) }))
      .filter((tag) => {
        if (!tag.slug || vistas.has(tag.slug)) return false;
        vistas.add(tag.slug);
        return true;
      });
  }

  function idRelacionado(relacionado) {
    if (!relacionado) return "";
    if (typeof relacionado === "string") return relacionado;
    return relacionado._id || relacionado._ref || relacionado.id || "";
  }

  const colecoes = [
    { campo: "posts", tipo: "post" },
    { campo: "tweets", tipo: "tweet" }
  ];

  function normalizarTweet(tweet = {}) {
    if (!tweet || typeof tweet !== "object") return undefined;

    return {
      nome: tweet.autorNome || tweet.nome || "",
      handle: tweet.autorHandle || tweet.handle || "",
      texto: tweet.texto || "",
      data: tweet.data || "",
      link: tweet.link || ""
    };
  }

  function criarNode(item, tipo) {
    const node = {
      id: item._id || item.id,
      tipo,
      label: item.label || item.titulo || item.title || item.nome || item.termo || item._id || item.id,
      slug: item.slug || "",
      href: item.href || item.link || "",
      tags: normalizarTags(item.tags).map((tag) => tag.label)
    };

    if (item.body) node.body = item.body;
    if (tipo === "tweet") node.tweet = normalizarTweet(item.tweet);

    return node;
  }

  function construirGrafo(dados = {}) {
    const nodesById = new Map();
    const contentNodeIds = new Set();
    const hubLinksByContent = new Map();
    const hubStats = new Map();
    const relacionadosInline = [];
    const structuralSlugs = new Set(normalizarTags(dados.settings?.tagsEstruturais).map((tag) => tag.slug));

    function registrarHub(contentId, hubTipo, prefix, label) {
      const texto = textoSeguro(label).trim();
      const slug = slugify(texto);
      if (!slug || structuralSlugs.has(slug)) return;

      const id = `${prefix}:${slug}`;
      if (!hubStats.has(id)) {
        hubStats.set(id, {
          id,
          tipo: hubTipo,
          slug,
          label: texto,
          contents: new Set()
        });
      }

      hubStats.get(id).contents.add(contentId);

      if (!hubLinksByContent.has(contentId)) hubLinksByContent.set(contentId, []);
      if (!hubLinksByContent.get(contentId).some((hub) => hub.id === id)) {
        hubLinksByContent.get(contentId).push({ id, label: texto });
      }
    }

    colecoes.forEach(({ campo, tipo }) => {
      arraySeguro(dados[campo]).forEach((item) => {
        if (!item || !(item._id || item.id)) return;

        const node = criarNode(item, tipo);
        nodesById.set(node.id, node);
        contentNodeIds.add(node.id);

        normalizarTags(item.tags).forEach((tag) => registrarHub(node.id, "tag", "tag", tag.label));
        arraySeguro(item.relacionados).map(idRelacionado).filter(Boolean).forEach((targetId) => {
          relacionadosInline.push({ source: node.id, target: targetId });
        });
      });
    });

    const validHubIds = new Set();
    hubStats.forEach((stat) => {
      if (stat.contents.size < TAG_MIN_USES) return;
      validHubIds.add(stat.id);
      nodesById.set(stat.id, {
        id: stat.id,
        tipo: stat.tipo,
        label: stat.label,
        slug: stat.slug
      });
    });

    const links = [];
    const linkKeys = new Set();
    const manualPairKeys = new Set();

    function addLink(link) {
      const key = [link.source, link.target, link.kind, link.via || "", link.peso || ""].join("|");
      if (linkKeys.has(key)) return;
      linkKeys.add(key);
      links.push(link);
    }

    function manualPairKey(source, target) {
      return [source, target].sort().join("|");
    }

    function addManualLink(link) {
      const pairKey = manualPairKey(link.source, link.target);
      if (manualPairKeys.has(pairKey)) return;
      manualPairKeys.add(pairKey);
      addLink(link);
    }

    hubLinksByContent.forEach((hubs, contentId) => {
      hubs.forEach((hub) => {
        if (!validHubIds.has(hub.id)) return;
        addLink({
          source: contentId,
          target: hub.id,
          kind: "tag",
          via: hub.label
        });
      });
    });

    // `relacionados` e a fonte editorial canonica. Ela entra primeiro para
    // prevalecer quando existir um documento `conexao` legado para o mesmo par.
    relacionadosInline.forEach((relacionado) => {
      if (!relacionado.source || !relacionado.target) return;
      if (relacionado.source === relacionado.target) return;
      if (!contentNodeIds.has(relacionado.source) || !contentNodeIds.has(relacionado.target)) return;

      addManualLink({
        source: relacionado.source,
        target: relacionado.target,
        kind: "manual",
        via: "relacionado",
        peso: 1,
        origem: "relacionado"
      });
    });

    // Compatibilidade de leitura: documentos `conexao` existentes continuam
    // visiveis, mas nao substituem a relacao canonica definida no conteudo.
    arraySeguro(dados.conexoes).forEach((conexao) => {
      if (!conexao?.de || !conexao?.para) return;
      if (conexao.de === conexao.para) return;
      if (!nodesById.has(conexao.de) || !nodesById.has(conexao.para)) return;

      addManualLink({
        source: conexao.de,
        target: conexao.para,
        kind: "manual",
        via: conexao.descricao || "",
        peso: conexao.peso || 1,
        origem: "conexao"
      });
    });

    // Sugestoes locais entram por ultimo. Qualquer relacao manual para o mesmo
    // par prevalece e remove a necessidade da conexao sugerida.
    const suggestionPairKeys = new Set();
    const sugestoes = Array.isArray(dados.sugestoes)
      ? dados.sugestoes
      : arraySeguro(window.colmeiaSuggestedRelations);
    sugestoes.forEach((sugestao) => {
      const source = sugestao?.source || sugestao?.de;
      const target = sugestao?.target || sugestao?.para;
      if (!source || !target || source === target) return;
      if (!contentNodeIds.has(source) || !contentNodeIds.has(target)) return;

      const pairKey = manualPairKey(source, target);
      if (manualPairKeys.has(pairKey) || suggestionPairKeys.has(pairKey)) return;
      suggestionPairKeys.add(pairKey);
      addLink({
        source,
        target,
        kind: "suggested",
        via: sugestao.via || "curadoria editorial",
        origem: "curadoria"
      });
    });

    const allNodes = [...nodesById.values()];
    const connectedIds = new Set();
    links.forEach((link) => {
      connectedIds.add(link.source);
      connectedIds.add(link.target);
    });

    const catalogNodes = allNodes.filter((node) => contentNodeIds.has(node.id));
    const isolatedNodes = catalogNodes.filter((node) => !connectedIds.has(node.id));
    const graphNodes = allNodes.filter((node) => connectedIds.has(node.id));

    return {
      nodes: graphNodes,
      links,
      catalogNodes,
      isolatedNodes,
      stats: {
        totalContent: catalogNodes.length,
        connectedContent: catalogNodes.length - isolatedNodes.length,
        isolatedContent: isolatedNodes.length
      }
    };
  }

  async function carregarDadosColmeia() {
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

  async function construirGrafoColmeiaSeguro() {
    const dados = await carregarDadosColmeia();
    return construirGrafo(dados);
  }

  window.T3ColmeiaGraph = {
    TAG_MIN_USES,
    slugify,
    construirGrafo,
    carregarDadosColmeia,
    construirGrafoColmeiaSeguro
  };
})();
