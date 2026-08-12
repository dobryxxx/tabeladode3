const categorias = {
  "nba": {
    nome: "NBA",
    tagClasse: "tag--blue",
    badgeClasse: "card-side__badge--blue"
  },
  "auto-falante": {
    nome: "Auto-Falante",
    tagClasse: "tag--red",
    badgeClasse: "card-side__badge--blue"
  },
  "ultimas": {
    nome: "Últimas",
    tagClasse: "tag--green",
    badgeClasse: "card-side__badge--green"
  },
  "in-english": {
    nome: "In English",
    tagClasse: "tag--purple",
    badgeClasse: "card-side__badge--blue"
  },
  "extensos": {
    nome: "Extensos",
    tagClasse: "tag--orange",
    badgeClasse: "card-side__badge--green"
  },
  "lapsos": {
    nome: "Lapsos",
    tagClasse: "tag--muted-red",
    badgeClasse: "card-side__badge--green"
  },
  "mastigado": {
    nome: "Mastigado",
    tagClasse: "tag--gold",
    badgeClasse: "card-side__badge--blue"
  }
};

const placeholdersUltimas = [
  '<ellipse cx="140" cy="400" rx="110" ry="220" fill="#2a2a2a" opacity=".9"/>',
  '<ellipse cx="140" cy="400" rx="100" ry="210" fill="#2a2a2a" opacity=".9"/>',
  '<ellipse cx="140" cy="420" rx="120" ry="230" fill="#2a2a2a" opacity=".9"/>',
  '<ellipse cx="140" cy="390" rx="105" ry="215" fill="#2a2a2a" opacity=".9"/>'
];

let postsJson = [];
let postsSanity = [];
const devModePosts = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

function slugPost(post = {}) {
  return post.slug || post.link || "";
}

function parseDataEditorial(data) {
  if (!data) return null;
  const valor = String(data).trim();
  if (!valor) return null;

  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const brNumerica = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brNumerica) {
    const [, dia, mes, ano] = brNumerica;
    const date = new Date(`${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const meses = {
    jan: 0, janeiro: 0,
    fev: 1, fevereiro: 1,
    mar: 2, marco: 2,
    abr: 3, abril: 3,
    mai: 4, maio: 4,
    jun: 5, junho: 5,
    jul: 6, julho: 6,
    ago: 7, agosto: 7,
    set: 8, setembro: 8,
    out: 9, outubro: 9,
    nov: 10, novembro: 10,
    dez: 11, dezembro: 11
  };

  const normalizada = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, "");
  const textual = normalizada.match(/^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/);
  if (textual && Object.prototype.hasOwnProperty.call(meses, textual[2])) {
    return new Date(Number(textual[3]), meses[textual[2]], Number(textual[1]), 12);
  }

  const parsed = new Date(valor);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dataIsoDia(data) {
  const parsed = parseDataEditorial(data);
  if (!parsed) return "";
  const ano = parsed.getFullYear();
  const mes = String(parsed.getMonth() + 1).padStart(2, "0");
  const dia = String(parsed.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function timestampData(data) {
  const parsed = parseDataEditorial(data);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}

const diaImportacaoPosts = "2026-05-13";

function timestampOrdenacaoPost(post = {}, dataPrincipal) {
  const timestampPrincipal = timestampData(dataPrincipal);
  const timestampAtualizacao = timestampData(post._updatedAt);

  if (dataIsoDia(dataPrincipal) === diaImportacaoPosts && timestampAtualizacao > timestampPrincipal) {
    return timestampAtualizacao;
  }

  return timestampPrincipal;
}

function dataBrutaPost(post = {}) {
  return post.dataPublicacao || post.publishedAt || post.date || post.data || post._createdAt || null;
}

function dataSanityInvalidaOuImportada(dataSanity) {
  if (!dataSanity) return true;
  const dia = dataIsoDia(dataSanity);
  return !dia;
}

function escolherDataPost(post = {}, fallbackLocal) {
  const dataSanity = post.dataPublicacao || post.publishedAt || post.date || post._createdAt || null;
  const dataLocal = fallbackLocal ? dataBrutaPost(fallbackLocal) : null;

  if (post._fonte === "sanity" && dataLocal && dataSanityInvalidaOuImportada(dataSanity)) {
    return {
      valor: dataLocal,
      origem: "fallback local",
      dataSanity,
      dataLocal
    };
  }

  if (post._fonte === "sanity" && dataSanityInvalidaOuImportada(dataSanity) && !dataLocal) {
    return {
      valor: null,
      origem: "sem data confiável",
      dataSanity,
      dataLocal
    };
  }

  const dataPreferida = post.dataPublicacao || post.publishedAt || post.date || dataLocal || null;
  return {
    valor: dataPreferida,
    origem: dataPreferida === dataLocal && post._fonte === "sanity" ? "fallback local" : (post._fonte || "local"),
    dataSanity,
    dataLocal
  };
}

function formatarDataPost(data) {
  if (!data) return "";
  const valor = String(data);
  if (!/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor;

  const date = new Date(`${valor.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date).replace(".", ".");
}

function normalizarCorpo(corpo) {
  if (Array.isArray(corpo) && corpo.some((bloco) => bloco && (bloco._type === "block" || bloco._type === "tweetEmbed"))) {
    return corpo
      .map((bloco) => {
        if (bloco._type === "tweetEmbed") {
          return {
            tipo: "tweet",
            tweetUrl: bloco.tweetUrl || "",
            comentario: bloco.comentario || "",
            textoAlternativo: bloco.textoAlternativo || ""
          };
        }

        if (bloco._type !== "block") return "";

        return {
          tipo: "texto",
          texto: (bloco.children || []).map((child) => child.text || "").join("").trim()
        };
      })
      .filter((bloco) => typeof bloco === "object" ? (bloco.tipo === "tweet" ? bloco.tweetUrl : bloco.texto) : bloco)
      .filter(Boolean);
  }

  if (Array.isArray(corpo)) return corpo;
  if (typeof corpo !== "string") return [];
  return corpo
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

function normalizarPost(post = {}, fallbackLocal) {
  const titulo = post.titulo || post.title || "";
  const resumo = post.resumo || post.excerpt || post.description || "";
  const dataEscolhida = escolherDataPost(post, fallbackLocal);

  return {
    ...post,
    titulo,
    categoria: post.categoria || post.category || "ultimas",
    data: formatarDataPost(dataEscolhida.valor),
    dataPublicacao: dataEscolhida.valor,
    _dataTimestamp: timestampData(dataEscolhida.valor),
    _sortTimestamp: timestampOrdenacaoPost(post, dataEscolhida.valor),
    _createdAt: post._createdAt || "",
    _updatedAt: post._updatedAt || "",
    _createdTimestamp: timestampData(post._createdAt),
    _updatedTimestamp: timestampData(post._updatedAt),
    _sourceOrder: Number.isFinite(Number(post._sourceOrder)) ? Number(post._sourceOrder) : 999999,
    _dataPublicacaoSanity: dataEscolhida.dataSanity || "",
    _dataLocalOriginal: dataEscolhida.dataLocal || "",
    _dataFinal: dataEscolhida.valor || "",
    _origemData: dataEscolhida.origem,
    tempoLeitura: post.tempoLeitura || post.readingTime || "",
    imagem: post.imagem || post.image || "",
    excerpt: resumo,
    autor: post.autor || post.author || "",
    slug: post.slug || post.link || "",
    categoriaNome: post.categoriaNome || post.categoryName || "",
    corpo: normalizarCorpo(post.corpo || post.body),
    destaque: Boolean(post.destaque ?? post.featured),
    lateral: Boolean(post.lateral ?? post.side)
  };
}

function postsDoSite() {
  const postsCms = typeof cmsPosts !== "undefined" ? cmsPosts : [];
  const postsBase = typeof posts !== "undefined" ? posts : [];
  const locais = [...postsJson, ...postsCms, ...postsBase]
    .map((post) => ({...post, _fonte: post._fonte || "local"}))
    .filter((post) => slugPost(post));
  const locaisPorSlug = new Map();

  locais.forEach((post) => {
    if (!locaisPorSlug.has(slugPost(post))) locaisPorSlug.set(slugPost(post), post);
  });

  const mesclados = new Map();
  locais.forEach((post, indice) => {
    const slug = slugPost(post);
    if (!mesclados.has(slug)) {
      mesclados.set(slug, normalizarPost({...post, _sourceOrder: indice}));
    }
  });

  postsSanity.forEach((post, indice) => {
    const postSanity = {...post, _fonte: "sanity", _sourceOrder: indice};
    const slug = slugPost(postSanity);
    if (!slug) return;
    mesclados.set(slug, normalizarPost(postSanity, locaisPorSlug.get(slug)));
  });

  return [...mesclados.values()].sort((a, b) => {
    if (a._sortTimestamp !== b._sortTimestamp) return b._sortTimestamp - a._sortTimestamp;
    if (a._dataTimestamp !== b._dataTimestamp) return b._dataTimestamp - a._dataTimestamp;
    if (a._updatedTimestamp !== b._updatedTimestamp) return b._updatedTimestamp - a._updatedTimestamp;
    if (a._createdTimestamp !== b._createdTimestamp) return b._createdTimestamp - a._createdTimestamp;
    if (a._sourceOrder !== b._sourceOrder) return a._sourceOrder - b._sourceOrder;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

function logDebugDatasPosts() {
  if (!devModePosts || !postsSanity.length) return;
  console.table(postsDoSite().slice(0, 5).map((post) => ({
    titulo: post.titulo,
    slug: post.slug,
    dataPublicacaoSanity: post._dataPublicacaoSanity || null,
    dataLocal: post._dataLocalOriginal || null,
    dataFinal: post._dataFinal || null,
    origemFinalDaData: post._origemData
  })));
}

function categoriaDoPost(post) {
  return categorias[post.categoria] || {
    nome: post.categoriaNome || post.categoria || "Últimas",
    tagClasse: "tag--gray",
    badgeClasse: "card-side__badge--green"
  };
}

function imagemOuPlaceholder(post, classe, tipo, indice = 0) {
  if (post.imagem) {
    return `<img class="${classe}" src="${post.imagem}" alt="${post.titulo || "Imagem do artigo"}" loading="lazy" onerror="this.remove()" />`;
  }

  if (tipo === "hero") {
    return `
      <svg class="${classe}" viewBox="0 0 700 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="700" height="600" fill="#1a1a1a"/>
        <ellipse cx="240" cy="520" rx="180" ry="260" fill="#2a2a2a" opacity=".9"/>
        <ellipse cx="460" cy="560" rx="160" ry="280" fill="#222" opacity=".9"/>
        <ellipse cx="350" cy="480" rx="120" ry="200" fill="#333" opacity=".5"/>
      </svg>
    `;
  }

  if (tipo === "lateral") {
    const numero = indice === 0
      ? '<text x="170" y="140" font-family="monospace" font-size="48" fill="#333" font-weight="bold">34</text>'
      : "";
    const silhueta = indice === 0
      ? '<ellipse cx="200" cy="300" rx="130" ry="200" fill="#2a2a2a" opacity=".9"/>'
      : '<ellipse cx="190" cy="310" rx="110" ry="190" fill="#2a2a2a" opacity=".9"/>';

    return `
      <svg class="${classe}" viewBox="0 0 380 280" xmlns="http://www.w3.org/2000/svg">
        <rect width="380" height="280" fill="#1c1c1c"/>
        ${silhueta}
        ${numero}
      </svg>
    `;
  }

  return `
    <svg class="${classe}" viewBox="0 0 280 370" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="370" fill="#1a1a1a"/>
      ${placeholdersUltimas[indice % placeholdersUltimas.length]}
    </svg>
  `;
}

function iconeBasquete() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M4.9 4.9c3.1 3.1 3.1 8.1 0 11.2M19.1 4.9c-3.1 3.1-3.1 8.1 0 11.2M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10"/>
    </svg>
  `;
}

function dataComQuebra(data) {
  return data.replace(/ (de \d{4})$/, "<br/>$1");
}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function linkDoPost(post) {
  return `artigo.html?post=${post.slug}`;
}

function imagemRanking(ranking) {
  if (ranking.imagem) {
    return `<img class="rankings-card__img" src="${ranking.imagem}" alt="${ranking.nome}" />`;
  }

  return `
    <svg class="rankings-card__img" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="100" fill="#222"/>
      <ellipse cx="40" cy="110" rx="35" ry="60" fill="#333" opacity=".9"/>
    </svg>
  `;
}

function renderHeroPrincipal() {
  const area = document.querySelector("#hero-principal");
  if (!area) return;

  const todosPosts = postsDoSite();
  const postsHero = todosPosts.slice(0, 3);
  if (!postsHero.length) return;
  let indiceAtual = 0;

  function criarMarkup(post, indiceAtivo) {
    const categoria = categoriaDoPost(post);
    const indicadores = postsHero.length > 1
      ? `
        <div class="hero__indicators" role="tablist" aria-label="Alternar destaque">
          ${postsHero.map((_, indice) => `
            <button type="button" class="${indice === indiceAtivo ? "active" : ""}" data-hero-index="${indice}" aria-label="Ver destaque ${indice + 1}" aria-selected="${indice === indiceAtivo ? "true" : "false"}"></button>
          `).join("")}
        </div>
      `
      : "";

    return `
      <article class="hero__main editorial-card editorial-card--hero">
        <div class="hero__main-copy featured-story__content">
          <div class="hero__main-topline editorial-card__topline">
            <div class="hero__main-tag tag ${categoria.tagClasse}">${categoria.nome}</div>
            ${post.data ? `<span>${post.data}</span>` : ""}
          </div>
          <a href="${linkDoPost(post)}" class="hero__main-link">
            <h2 class="hero__main-title">${post.titulo}</h2>
          </a>
          <p class="hero__main-excerpt">${post.excerpt}</p>
          <div class="meta meta--flush">
            ${post.autor ? `<span>${post.autor}</span>` : ""}
            ${post.tempoLeitura ? `<span>${post.tempoLeitura}</span>` : ""}
          </div>
        </div>
        <a class="hero__main-media" href="${linkDoPost(post)}" aria-label="Ler ${post.titulo}">
          ${imagemOuPlaceholder(post, "hero__main-img", "hero")}
        </a>
        ${indicadores}
      </article>
    `;
  }

  function renderizar(indice = 0) {
    indiceAtual = indice;
    area.innerHTML = criarMarkup(postsHero[indice], indice);
    area.querySelectorAll("[data-hero-index]").forEach((botao) => {
      botao.addEventListener("click", () => renderizar(Number(botao.dataset.heroIndex || 0)));
    });
  }

  renderizar(0);
  if (postsHero.length > 1) {
    window.clearInterval(area._td3HeroTimer);
    area._td3HeroTimer = window.setInterval(() => {
      indiceAtual = (indiceAtual + 1) % postsHero.length;
      renderizar(indiceAtual);
    }, 6500);
  }
}

function renderHeroLaterais() {
  const area = document.querySelector("#hero-laterais");
  if (!area) return;
  area.innerHTML = "";
}
function postCombinaComBusca(post, termoBusca) {
  if (!termoBusca) return true;

  const categoria = categoriaDoPost(post);
  const alvo = normalizarTexto(`${post.titulo} ${post.categoria} ${categoria.nome}`);
  return alvo.includes(termoBusca);
}

function postCombinaComCategoria(post, categoriaAtiva) {
  return !categoriaAtiva || post.categoria === categoriaAtiva;
}

function renderUltimas(busca = "", categoriaAtiva = "") {
  const area = document.querySelector("#ultimas-posts");
  if (!area) return;

  const termoBusca = normalizarTexto(busca.trim());
  const postsFiltrados = postsDoSite()
    .filter((post) => postCombinaComCategoria(post, categoriaAtiva))
    .filter((post) => postCombinaComBusca(post, termoBusca));

  if (postsFiltrados.length === 0) {
    area.innerHTML = '<div class="busca-sem-resultados">Nenhum artigo encontrado.</div>';
    return;
  }

  area.innerHTML = postsFiltrados
    .map((post, indice) => {
      const categoria = categoriaDoPost(post);

      return `
        <a class="card-ultimas editorial-card editorial-card--latest" href="${linkDoPost(post)}">
          <div class="card-ultimas__img-wrap">
            ${imagemOuPlaceholder(post, "card-ultimas__img", "ultimas", indice)}
          </div>
          <div class="card-ultimas__content editorial-card__content">
            <div class="editorial-card__topline">
              <div class="tag ${categoria.tagClasse}">${categoria.nome}</div>
              <span>${post.data}</span>
            </div>
            <h3 class="card-ultimas__title">${post.titulo}</h3>
            <div class="card-ultimas__read editorial-card__meta">
              ${post.autor ? `<span>${post.autor}</span>` : ""}
              <span>${post.tempoLeitura}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderRankingDestaque() {
  const area = document.querySelector("#ranking-destaque");
  if (!area || typeof rankings === "undefined" || typeof rankingsDisponiveis === "undefined") return;

  const rankingMeta = rankingsDisponiveis.find((item) => item.slug === "t25m") || rankingsDisponiveis[0];
  const ranking = rankings.find((item) => item.rankingSlug === rankingMeta.slug);
  if (!ranking) return;

  area.innerHTML = `
    <div class="rankings-card">
      <div class="rankings-card__number">${ranking.posicao}</div>
      ${imagemRanking(ranking)}
      <div class="rankings-card__info">
        <div class="rankings-card__label">
          ${ranking.nome}<br/>${ranking.categoria} · ${ranking.time}<br/>${ranking.bio2}
        </div>
        <a href="${rankingMeta.pagina}" class="rankings-card__btn">ver ranking completo</a>
      </div>
    </div>
  `;
}

function categoriaAtivaPorUrl() {
  return new URLSearchParams(window.location.search).get("categoria") || "";
}

function iniciarFiltroCategorias() {
  const links = document.querySelectorAll("[data-categoria]");
  if (links.length === 0) return;

  function aplicarCategoria(categoria) {
    links.forEach((item) => {
      const ativo = (item.dataset.categoria || "") === categoria;
      item.classList.toggle("active", ativo);
      item.classList.toggle("is-active--blue", ativo);
      if (ativo) {
        item.setAttribute("aria-current", "true");
      } else {
        item.removeAttribute("aria-current");
      }
    });
    renderUltimas(document.querySelector("#busca-input")?.value || "", categoria);
  }

  aplicarCategoria(categoriaAtivaPorUrl());

  links.forEach((link) => {
    link.addEventListener("click", (evento) => {
      evento.preventDefault();
      const categoria = link.dataset.categoria || "";
      const url = new URL(window.location.href);
      if (categoria) {
        url.searchParams.set("categoria", categoria);
      } else {
        url.searchParams.delete("categoria");
      }
      window.history.pushState({categoria}, "", url);
      aplicarCategoria(categoria);
    });
  });

  window.addEventListener("popstate", () => aplicarCategoria(categoriaAtivaPorUrl()));
}
function iniciarBusca() {
  const botao = document.querySelector(".btn-search");
  const painel = document.querySelector("#barra-busca");
  const campo = document.querySelector("#busca-input");
  if (!botao || !painel || !campo) return;

  function abrirBusca() {
    painel.classList.add("is-open");
    botao.classList.add("is-active");
    painel.setAttribute("aria-hidden", "false");
    botao.setAttribute("aria-expanded", "true");
    window.setTimeout(() => campo.focus(), 120);
  }

  function fecharBusca() {
    painel.classList.remove("is-open");
    botao.classList.remove("is-active");
    painel.setAttribute("aria-hidden", "true");
    botao.setAttribute("aria-expanded", "false");
    campo.value = "";
    renderUltimas("", categoriaAtivaPorUrl());
  }

  botao.addEventListener("click", () => {
    if (painel.classList.contains("is-open")) {
      fecharBusca();
      return;
    }

    abrirBusca();
  });

  campo.addEventListener("input", () => {
    renderUltimas(campo.value, categoriaAtivaPorUrl());
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && painel.classList.contains("is-open")) {
      fecharBusca();
      botao.focus();
    }
  });
}

function iniciarHeaderSticky() {
  const header = document.querySelector(".top-nav");
  if (!header) return;

  function atualizarHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  atualizarHeader();
  window.addEventListener("scroll", atualizarHeader, { passive: true });
}

function iniciarMenuMobile() {
  const botao = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#mobile-menu");
  if (!botao || !menu) return;

  function abrirMenu() {
    menu.classList.add("is-open");
    botao.classList.add("is-open");
    botao.setAttribute("aria-expanded", "true");
    botao.setAttribute("aria-label", "Fechar menu");
  }

  function fecharMenu() {
    menu.classList.remove("is-open");
    botao.classList.remove("is-open");
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-label", "Abrir menu");
  }

  botao.addEventListener("click", () => {
    if (menu.classList.contains("is-open")) {
      fecharMenu();
      return;
    }

    abrirMenu();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", fecharMenu);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && menu.classList.contains("is-open")) {
      fecharMenu();
      botao.focus();
    }
  });

  document.addEventListener("click", (evento) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(evento.target) || botao.contains(evento.target)) return;
    fecharMenu();
  });
}

function iniciarSplashHome() {
  const intro = document.querySelector("[data-td3-intro]");
  const portal = document.querySelector("[data-td3-portal]");
  if (!intro || !portal) return;
  if (intro.dataset.td3IntroReady === "true") return;

  intro.dataset.td3IntroReady = "true";

  const frame = intro.querySelector("[data-td3-preloader-frame]");
  const contador = intro.querySelector("[data-td3-preloader-count]");
  const palavra = intro.querySelector("[data-td3-preloader-word]");
  const botaoPular = intro.querySelector("[data-td3-preloader-skip]");
  const status = intro.querySelector("[data-td3-preloader-status]");
  if (!frame || !contador || !palavra || !botaoPular) return;

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ordemQuadros = [
    3, 2, 5, 6, 10, 12, 13, 18, 21, 24, 8,
    9, 7, 11, 14, 17, 19, 20, 22, 23, 4, 15, 16,
    1,
  ];
  const focosMobilePorImagem = [38, 50, 55, 50, 38, 48, 50, 56, 50, 50, 56, 55, 38, 50, 55, 58, 50, 50, 58, 62, 45, 58, 53, 50];
  const caminhos = ordemQuadros.map(
    (numero) => `img/preloader/${numero}_resultado.webp`,
  );
  const focosMobile = ordemQuadros.map((numero) => focosMobilePorImagem[numero - 1]);
  const timers = new Set();
  let encerrado = false;

  function agendar(funcao, atraso) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      funcao();
    }, atraso);
    timers.add(timer);
    return timer;
  }

  function rolarParaPortal() {
    const easing = (progresso) => progresso * progresso * progresso * (progresso * (progresso * 6 - 15) + 10);

    if (window.T3Lenis?.scrollTo) {
      window.T3Lenis.scrollTo(portal, {
        duration: reduzirMovimento ? 0 : 1.55,
        easing,
      });
      return;
    }

    portal.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "start",
    });
  }

  function concluirEAvancar() {
    if (encerrado) return;
    encerrado = true;
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    window.removeEventListener("keydown", aoPressionarTecla);
    exibirQuadro(caminhos.length - 1);
    botaoPular.hidden = true;
    document.documentElement.classList.remove("td3-preloader-active");
    if (status) status.textContent = "Abertura concluída.";
    agendar(rolarParaPortal, reduzirMovimento ? 120 : 220);
  }

  function trocarPalavra(texto) {
    if (palavra.textContent === texto) return;
    palavra.textContent = texto;
    palavra.dataset.td3Word = texto;

    if (!reduzirMovimento && palavra.animate) {
      palavra.animate(
        [
          { opacity: 0, filter: "blur(7px)", transform: "translateY(18px)" },
          { opacity: 1, filter: "blur(0)", transform: "translateY(0)" },
        ],
        { duration: 420, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" },
      );
    }
  }

  function exibirQuadro(indice) {
    frame.src = caminhos[indice];
    frame.style.setProperty("--td3-frame-position-mobile", `${focosMobile[indice]}% 50%`);
    contador.textContent = String(indice + 1).padStart(2, "0");

    if (indice < 11) trocarPalavra("amor");
    else if (indice < 23) trocarPalavra("suor");
    else trocarPalavra("basquete");
  }

  function duracaoDoQuadro(indice) {
    if (indice === 0 || indice === 11) return 1100;
    if (indice === ordemQuadros.length - 1) return 1500;
    return 155;
  }

  function iniciarSequencia() {
    if (encerrado) return;

    if (reduzirMovimento) {
      exibirQuadro(caminhos.length - 1);
      agendar(concluirEAvancar, 700);
      return;
    }

    intro.classList.add("is-running");
    let indice = 0;
    exibirQuadro(indice);

    function proximoQuadro() {
      if (encerrado) return;
      indice += 1;

      if (indice < caminhos.length) {
        exibirQuadro(indice);
        agendar(proximoQuadro, duracaoDoQuadro(indice));
        return;
      }

      concluirEAvancar();
    }

    agendar(proximoQuadro, duracaoDoQuadro(indice));
  }

  function carregarImagem(caminho) {
    return new Promise((resolver) => {
      const imagem = new Image();
      imagem.decoding = "async";
      imagem.onload = resolver;
      imagem.onerror = resolver;
      imagem.src = caminho;
    });
  }

  function aoPressionarTecla(evento) {
    if (evento.key === "Escape") concluirEAvancar();
  }

  portal.hidden = false;
  botaoPular.addEventListener("click", concluirEAvancar);

  document.documentElement.classList.add("td3-preloader-active");
  window.scrollTo({ top: 0, behavior: "auto" });
  window.addEventListener("keydown", aoPressionarTecla);

  const caminhosPrioritarios = [...caminhos.slice(0, 11), caminhos.at(-1)];
  const caminhosPosteriores = caminhos.slice(11, -1);
  const primeiroAtoPronto = Promise.all(caminhosPrioritarios.map(carregarImagem));
  const limiteDeEspera = new Promise((resolver) => agendar(resolver, 2200));

  Promise.race([primeiroAtoPronto, limiteDeEspera]).then(() => {
    caminhosPosteriores.forEach(carregarImagem);
    iniciarSequencia();
  });
  agendar(concluirEAvancar, 11500);
}

// Responsive card stacks inspired by Skiper UI 16 / StickyCard_001.
// Free-version attribution: https://skiper-ui.com/v1/skiper16
function iniciarPilhasDeCardsResponsivas() {
  const configuracoes = [
    { lista: ".td3-portal__grid", card: ".td3-portal-card" },
    { lista: "#ultimas-posts", card: ".editorial-card" },
    { lista: "#dicas-destaques", card: ".tip-card" },
    { lista: "#dicas-grid", card: ".tip-card" },
    { lista: "#rankings-grid", card: ".ranking-generation-card" },
    { lista: ".ranking-detail-list", card: ".ranking-athlete-row" },
    { lista: "#glossario-lista", card: ".glossary-term-card" },
    {
      lista: "#draft-list",
      card: ".draft-prospect-card",
      compativel: (lista) => !lista.classList.contains("draft-guide-list--deep")
        && !lista.querySelector(".draft-prospect-card--expanded")
    }
  ];
  const pilhas = [];
  const listasRegistradas = new WeakSet();

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  let framePendente = false;
  let medicaoPendente = true;

  function registrarPilhas() {
    configuracoes.forEach((configuracao) => {
      document.querySelectorAll(configuracao.lista).forEach((elemento) => {
        if (listasRegistradas.has(elemento)) return;
        listasRegistradas.add(elemento);
        pilhas.push({
          ...configuracao,
          elemento,
          ativa: false,
          grupos: [],
          gruposAtivos: new Set(),
          gruposFixos: new Set(),
          topoDocumento: 0,
          percurso: 1,
          divisorFaixa: 4
        });
      });
    });
  }

  function cardsAtuais(pilha) {
    return Array.from(pilha.elemento.querySelectorAll(`:scope > ${pilha.card}`));
  }

  function limparPilha(pilha) {
    pilha.elemento.classList.remove("mobile-card-stack");
    cardsAtuais(pilha).forEach((card) => {
      card.classList.remove("mobile-stack-card");
      card.classList.remove("mobile-stack-card--active");
      card.style.removeProperty("--mobile-stack-offset");
      card.style.removeProperty("--mobile-stack-layer");
      card.style.removeProperty("--mobile-stack-scale");
    });
    pilha.ativa = false;
    pilha.grupos = [];
    pilha.gruposAtivos.clear();
    pilha.gruposFixos.clear();
  }

  function medirPilha(pilha) {
    const cards = cardsAtuais(pilha);
    const compativel = !pilha.compativel || pilha.compativel(pilha.elemento);
    if (reduzirMovimento.matches || !compativel || cards.length < 2) {
      limparPilha(pilha);
      return;
    }

    pilha.elemento.classList.add("mobile-card-stack");
    const grupos = [];

    cards.forEach((card) => {
      const topoNatural = card.offsetTop;
      let grupo = grupos.find((item) => Math.abs(item.topo - topoNatural) <= 2);
      if (!grupo) {
        grupo = { topo: topoNatural, cards: [] };
        grupos.push(grupo);
      }
      grupo.cards.push(card);
    });

    grupos.sort((grupoA, grupoB) => grupoA.topo - grupoB.topo);
    pilha.ativa = true;
    pilha.grupos = grupos;
    pilha.gruposAtivos.clear();
    pilha.gruposFixos.clear();
    pilha.topoDocumento = pilha.elemento.getBoundingClientRect().top + window.scrollY;
    pilha.percurso = Math.max(pilha.elemento.offsetHeight - window.innerHeight, 1);
    pilha.divisorFaixa = Math.max(grupos.length - 1, 4);

    grupos.forEach((grupo, indiceGrupo) => {
      const profundidade = Math.min(grupos.length - indiceGrupo - 1, 4);
      const offset = `${Math.min(indiceGrupo, 4) * 20}px`;
      const camada = String(indiceGrupo + 1);

      grupo.cards.forEach((card) => {
        card.classList.remove("mobile-stack-card");
        card.classList.remove("mobile-stack-card--active");
        card.style.setProperty("--mobile-stack-offset", offset);
        card.style.setProperty("--mobile-stack-layer", camada);
        card.style.setProperty("--mobile-stack-scale", "1");
      });

      grupo.inicio = Math.min(indiceGrupo / pilha.divisorFaixa, 0.99);
      grupo.escalaFinal = 1 - (profundidade * 0.1);
    });
  }

  function definirGrupoAtivo(grupo, ativo) {
    grupo.cards.forEach((card) => {
      card.classList.toggle("mobile-stack-card--active", ativo);
    });
  }

  function atualizarPilha(pilha) {
    if (!pilha.ativa || !pilha.grupos.length) return;

    const inicioVisual = Math.max(88, window.innerHeight * 0.1);
    const topoAtual = pilha.topoDocumento - window.scrollY;
    const progresso = Math.min(Math.max((inicioVisual - topoAtual) / pilha.percurso, 0), 1);
    const indiceAtual = Math.min(
      pilha.grupos.length - 1,
      Math.max(0, Math.floor(progresso * pilha.divisorFaixa))
    );
    const primeiroGrupoAtivo = Math.max(0, indiceAtual - 4);
    const ultimoGrupoFixo = Math.min(pilha.grupos.length - 1, indiceAtual + 1);
    const novosGruposAtivos = new Set();
    const novosGruposFixos = new Set();

    for (let indice = primeiroGrupoAtivo; indice <= indiceAtual; indice += 1) {
      novosGruposAtivos.add(indice);
    }
    for (let indice = primeiroGrupoAtivo; indice <= ultimoGrupoFixo; indice += 1) {
      novosGruposFixos.add(indice);
    }

    pilha.gruposFixos.forEach((indice) => {
      if (novosGruposFixos.has(indice)) return;
      pilha.grupos[indice].cards.forEach((card) => {
        card.classList.remove("mobile-stack-card");
        card.classList.remove("mobile-stack-card--active");
      });
    });

    novosGruposFixos.forEach((indice) => {
      pilha.grupos[indice].cards.forEach((card) => {
        card.classList.add("mobile-stack-card");
      });
    });

    pilha.gruposAtivos.forEach((indice) => {
      if (novosGruposAtivos.has(indice)) return;
      const grupo = pilha.grupos[indice];
      definirGrupoAtivo(grupo, false);
      if (indice < primeiroGrupoAtivo) {
        const escalaFinal = grupo.escalaFinal.toFixed(4);
        grupo.cards.forEach((card) => {
          card.style.setProperty("--mobile-stack-scale", escalaFinal);
        });
      }
    });

    novosGruposAtivos.forEach((indice) => {
      const grupo = pilha.grupos[indice];
      const progressoDoCard = Math.min(
        Math.max((progresso - grupo.inicio) / (1 - grupo.inicio), 0),
        1
      );
      const escala = 1 + ((grupo.escalaFinal - 1) * progressoDoCard);
      const escalaFormatada = escala.toFixed(4);

      definirGrupoAtivo(grupo, true);
      grupo.cards.forEach((card) => {
        if (card.style.getPropertyValue("--mobile-stack-scale") !== escalaFormatada) {
          card.style.setProperty("--mobile-stack-scale", escalaFormatada);
        }
      });
    });

    pilha.gruposAtivos = novosGruposAtivos;
    pilha.gruposFixos = novosGruposFixos;
  }

  function atualizar() {
    framePendente = false;
    registrarPilhas();
    for (let indice = pilhas.length - 1; indice >= 0; indice -= 1) {
      if (!pilhas[indice].elemento.isConnected) pilhas.splice(indice, 1);
    }
    if (medicaoPendente) {
      pilhas.forEach(medirPilha);
      medicaoPendente = false;
    }
    pilhas.forEach(atualizarPilha);
  }

  function solicitarAtualizacao() {
    if (framePendente) return;
    framePendente = true;
    window.requestAnimationFrame(atualizar);
  }

  function solicitarMedicao() {
    medicaoPendente = true;
    solicitarAtualizacao();
  }

  registrarPilhas();
  new MutationObserver(solicitarMedicao).observe(document.body, {
    childList: true,
    subtree: true
  });
  window.addEventListener("scroll", solicitarAtualizacao, { passive: true });
  window.addEventListener("resize", solicitarMedicao, { passive: true });
  window.addEventListener("load", solicitarMedicao, { once: true });
  reduzirMovimento.addEventListener?.("change", solicitarMedicao);
  solicitarMedicao();
}

// Adaptação global em JavaScript do Next Smooth Scroll.
// Componente de referência: https://framer.com/m/NextSmoothScroll-4fhrqO.js@CUL9Rnqi9k64fNtJwwEW
function iniciarRolagemSuaveSite() {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const barra = document.createElement("div");
  const preenchimento = document.createElement("span");
  let rolagem = null;
  let aoRolarLenis = null;

  barra.className = "site-scroll-progress";
  barra.setAttribute("aria-hidden", "true");
  preenchimento.className = "site-scroll-progress__fill";
  barra.appendChild(preenchimento);
  document.body.appendChild(barra);

  function atualizarProgresso(valor) {
    const progresso = Math.min(1, Math.max(0, Number(valor) || 0));
    preenchimento.style.transform = `scaleX(${progresso})`;
  }

  function atualizarProgressoNativo() {
    const documento = document.documentElement;
    const limite = Math.max(documento.scrollHeight - window.innerHeight, 1);
    atualizarProgresso((window.scrollY || documento.scrollTop || 0) / limite);
  }

  function encerrar() {
    if (rolagem && aoRolarLenis) rolagem.off?.("scroll", aoRolarLenis);
    if (window.T3Lenis === rolagem) window.T3Lenis = null;
    rolagem?.destroy();
    rolagem = null;
    aoRolarLenis = null;
    window.removeEventListener("scroll", atualizarProgressoNativo);
    window.removeEventListener("resize", atualizarProgressoNativo);
  }

  function iniciar() {
    encerrar();
    if (reduzirMovimento.matches || typeof window.Lenis !== "function") {
      atualizarProgressoNativo();
      window.addEventListener("scroll", atualizarProgressoNativo, { passive: true });
      window.addEventListener("resize", atualizarProgressoNativo, { passive: true });
      return;
    }

    rolagem = new window.Lenis({
      autoRaf: true,
      duration: 1,
      easing: (progresso) => Math.min(1, 1.001 - Math.pow(2, -10 * progresso)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      infinite: false
    });
    window.T3Lenis = rolagem;

    aoRolarLenis = (evento) => atualizarProgresso(evento?.progress);
    rolagem.on?.("scroll", aoRolarLenis);
    atualizarProgresso(rolagem.progress);
  }

  reduzirMovimento.addEventListener?.("change", iniciar);
  window.addEventListener("pagehide", () => {
    encerrar();
    barra.remove();
  }, { once: true });
  iniciar();
}

function renderHomeSettings(settings) {
  if (!settings) return;

  const headline = document.querySelector('[data-sanity-home="headline"]');
  const subheadline = document.querySelector('[data-sanity-home="subheadline"]');
  const cards = document.querySelector('[data-sanity-home="cards"]');

  if (headline && settings.headline) {
    const partes = String(settings.headline).split(/\s*\/\s*|\n+/).filter(Boolean);
    headline.innerHTML = partes.length > 1
      ? partes.map((parte) => `<span>${parte}</span>`).join("")
      : `<span>${settings.headline}</span>`;
  }

  if (subheadline && settings.subheadline) {
    subheadline.textContent = settings.subheadline;
  }

  if (cards && Array.isArray(settings.cards) && settings.cards.length) {
    const portalCards = settings.cards.filter(
      (card) => !String(card.link || "").includes("colmeia.html"),
    );

    cards.innerHTML = portalCards
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99))
      .map((card, index) => `
        <a class="td3-portal-card" href="${card.link || "#"}" style="--portal-index: ${index + 1}">
          <span class="td3-portal-card__icon" aria-hidden="true">${card.numero || String(index + 1).padStart(2, "0")}</span>
          <p>${card.descricao || card.cta || ""}</p>
          <strong>${card.titulo || "Ãrea"}</strong>
          <span class="td3-portal-card__arrow" aria-hidden="true">&rarr;</span>
        </a>
      `)
      .join("");
  }

  aplicarVisibilidadeSite(visibilidadeSiteAtual);
}

async function carregarHomeSanity() {
  if (!document.querySelector(".td3-entry") || !window.T3Sanity?.enabled) return;

  try {
    const settings = await window.T3Sanity.fetchHomeSettings();
    renderHomeSettings(settings);
    iniciarSplashHome();
  } catch (erro) {
    console.warn("Não foi possível carregar configurações da home no Sanity. Usando conteúdo local.", erro);
  }
}

function markdownBasico(texto) {
  return String(texto)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

function renderBlocoArtigo(bloco) {
  if (!bloco || typeof bloco === "string") return `<p>${markdownBasico(bloco || "")}</p>`;

  if (bloco.tipo === "texto") {
    return `<p>${markdownBasico(bloco.texto || "")}</p>`;
  }

  if (bloco.tipo === "tweet" && bloco.tweetUrl) {
    return `
      <aside class="tweet-card">
        <span class="tweet-card__label">Tweet citado</span>
        ${bloco.comentario ? `<p>${markdownBasico(bloco.comentario)}</p>` : ""}
        ${bloco.textoAlternativo ? `<small>${bloco.textoAlternativo}</small>` : ""}
        <a href="${bloco.tweetUrl}" target="_blank" rel="noopener noreferrer">Abrir no X</a>
      </aside>
    `;
  }

  return "";
}

function renderConteudoDinamico() {
  renderHeroPrincipal();
  renderHeroLaterais();
  renderUltimas("", categoriaAtivaPorUrl());
  renderRankingDestaque();
  renderArtigo();
}

async function carregarPostsJson(logarFonte = true, renderizarAoCarregar = true) {
  const usaPosts = document.querySelector("#hero-principal, #hero-laterais, #ultimas-posts, #artigo");
  if (!usaPosts) return;

  try {
    const resposta = await fetch("data/posts.json", { cache: "no-store" });
    if (!resposta.ok) throw new Error("posts.json indisponível");

    const dados = await resposta.json();
    postsJson = Array.isArray(dados) ? dados : (dados.posts || []);
    if (logarFonte) window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    if (renderizarAoCarregar) renderConteudoDinamico();
  } catch (erro) {
    if (logarFonte) window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    console.warn("Não foi possível carregar data/posts.json. Usando posts locais.", erro);
  }
}

async function carregarPostsFontePrincipal() {
  const usaPosts = document.querySelector("#hero-principal, #hero-laterais, #ultimas-posts, #artigo");
  if (!usaPosts) return;

  await carregarPostsJson(false, !window.T3Sanity?.enabled);

  if (!window.T3Sanity?.enabled) {
    window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    renderConteudoDinamico();
    return;
  }

  try {
    const dados = await window.T3Sanity.fetchPosts();
    postsSanity = Array.isArray(dados) ? dados : [];
    if (!postsSanity.length) throw new Error("Sanity sem posts publicados");
    window.T3Sanity?.devLog?.("Fonte de posts: Sanity + fallback local");
    logDebugDatasPosts();
    renderConteudoDinamico();
  } catch (erro) {
    window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    console.warn("Não foi possível carregar posts do Sanity. Usando fallback local.", erro);
    renderConteudoDinamico();
  }
}

function renderArtigo() {
  const area = document.querySelector("#artigo");
  if (!area) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("post");
  const post = postsDoSite().find((item) => item.slug === slug) || postsDoSite().find((item) => item.destaque);
  if (!post) return;

  const categoria = categoriaDoPost(post);
  document.title = `${post.titulo} | Tabelado de 3`;

  area.innerHTML = `
    <header class="artigo__cabecalho">
      <div class="tag ${categoria.tagClasse}">${categoria.nome}</div>
      <h1 class="artigo__titulo">${post.titulo}</h1>
      <div class="meta artigo__meta">
        <span>${post.data}</span>
        <span>·</span>
        <span>${post.tempoLeitura}</span>
      </div>
    </header>
    <div class="artigo__capa">
      ${imagemOuPlaceholder(post, "artigo__capa-img", "hero")}
    </div>
    <div class="artigo__corpo">
      ${(post.corpo.length ? post.corpo : ["Texto em atualização."]).map(renderBlocoArtigo).join("")}
    </div>
  `;
}

function renderPaginaIndisponivel(titulo, mensagem) {
  const main = document.querySelector("main");
  if (!main) return;

  main.innerHTML = `
    <section class="page-disabled">
      <div class="container page-disabled__inner">
        <span>temporariamente fora do ar</span>
        <h1>${titulo}</h1>
        <p>${mensagem}</p>
        <a href="index.html">voltar para a home</a>
      </div>
    </section>
  `;
}

function esconderLinksPagina(href) {
  document.querySelectorAll(`a[href="${href}"], a[href^="${href}?"]`).forEach((link) => {
    link.hidden = true;
    link.setAttribute("aria-hidden", "true");
  });
}

let visibilidadeSiteAtual = {
  showDraftGuide: true,
  showRankings: true,
  showColmeia: true,
  draftGuideHiddenMessage: "Estamos atualizando esta área. Volte em breve.",
  rankingsHiddenMessage: "Estamos atualizando esta área. Volte em breve.",
  colmeiaHiddenMessage: "Estamos atualizando esta área. Volte em breve.",
  _source: "fallback seguro"
};

function normalizarVisibilidadeSite(settings = {}) {
  settings = settings || {};

  if (Object.prototype.hasOwnProperty.call(settings, "showDraftGuide")) {
    return {
      ...visibilidadeSiteAtual,
      ...settings,
      showDraftGuide: settings.showDraftGuide !== false,
      showRankings: settings.showRankings !== false,
      showColmeia: settings.showColmeia !== false
    };
  }

  if (window.T3Sanity?.normalizeSiteSettings) {
    return window.T3Sanity.normalizeSiteSettings(settings, settings._source || "Sanity");
  }

  return {
    ...visibilidadeSiteAtual,
    showDraftGuide: settings.mostrarGuiaDoDraft !== false,
    showRankings: settings.mostrarRankings !== false,
    showColmeia: settings.mostrarColmeia !== false,
    draftGuideHiddenMessage: settings.mensagemGuiaOculto || visibilidadeSiteAtual.draftGuideHiddenMessage,
    rankingsHiddenMessage: settings.mensagemRankingsOculto || visibilidadeSiteAtual.rankingsHiddenMessage,
    colmeiaHiddenMessage: settings.mensagemColmeiaOculta || visibilidadeSiteAtual.colmeiaHiddenMessage,
    _source: settings._source || "Sanity"
  };
}

function aplicarVisibilidadeSite(settings = {}) {
  visibilidadeSiteAtual = normalizarVisibilidadeSite(settings);
  const mostrarGuia = visibilidadeSiteAtual.showDraftGuide !== false;
  const mostrarRankings = visibilidadeSiteAtual.showRankings !== false;
  const mostrarColmeia = visibilidadeSiteAtual.showColmeia !== false;
  const pagina = window.location.pathname.split("/").pop() || "index.html";

  if (!mostrarGuia) esconderLinksPagina("guia-do-draft.html");
  if (!mostrarRankings) {
    esconderLinksPagina("rankings.html");
    esconderLinksPagina("ranking-individual.html");
  }
  if (!mostrarColmeia) esconderLinksPagina("colmeia.html");

  window.T3Sanity?.devLog?.(`Configurações do site: ${visibilidadeSiteAtual._source || "fallback"} | Guia do Draft: ${mostrarGuia} | Rankings: ${mostrarRankings} | Colmeia: ${mostrarColmeia}`);

  if (!mostrarGuia && pagina === "guia-do-draft.html") {
    renderPaginaIndisponivel("Guia do Draft temporariamente indisponível", visibilidadeSiteAtual.draftGuideHiddenMessage);
    return visibilidadeSiteAtual;
  }

  if (!mostrarRankings && (pagina === "rankings.html" || pagina === "ranking-individual.html")) {
    renderPaginaIndisponivel("Rankings temporariamente indisponíveis", visibilidadeSiteAtual.rankingsHiddenMessage);
    return visibilidadeSiteAtual;
  }

  if (!mostrarColmeia && pagina === "colmeia.html") {
    renderPaginaIndisponivel("Colmeia", visibilidadeSiteAtual.colmeiaHiddenMessage);
    return visibilidadeSiteAtual;
  }

  if (!mostrarGuia) {
    esconderLinksPagina("guia-do-draft.html");
    if (pagina === "guia-do-draft.html") {
      renderPaginaIndisponivel("Guia do Draft", settings.mensagemGuiaOculto || "O Guia do Draft está temporariamente indisponível.");
    }
  }

  if (!mostrarRankings) {
    esconderLinksPagina("rankings.html");
    esconderLinksPagina("ranking-individual.html");
    if (pagina === "rankings.html" || pagina === "ranking-individual.html") {
      renderPaginaIndisponivel("Rankings", settings.mensagemRankingsOculto || "Os rankings estão temporariamente indisponíveis.");
    }
  }

  if (!mostrarColmeia) {
    esconderLinksPagina("colmeia.html");
    if (pagina === "colmeia.html") {
      renderPaginaIndisponivel("Colmeia", settings.mensagemColmeiaOculta || "Estamos atualizando esta área. Volte em breve.");
    }
  }
}

async function carregarConfiguracoesSite() {
  if (!window.T3Sanity?.fetchSiteVisibility) {
    aplicarVisibilidadeSite(visibilidadeSiteAtual);
    return visibilidadeSiteAtual;
  }

  try {
    const settings = await window.T3Sanity.fetchSiteVisibility();
    return aplicarVisibilidadeSite(settings || {});
  } catch (erro) {
    return aplicarVisibilidadeSite(visibilidadeSiteAtual);
    window.T3Sanity?.devLog?.("Configurações gerais indisponíveis. Mantendo páginas visíveis.");
  }
}

function guiaDoDraftVisivel() {
  return visibilidadeSiteAtual.showDraftGuide !== false;
}

function rankingsVisiveis() {
  return visibilidadeSiteAtual.showRankings !== false;
}

function colmeiaVisivel() {
  return visibilidadeSiteAtual.showColmeia !== false;
}

function mostrarGuiaDoDraftIndisponivel() {
  renderPaginaIndisponivel("Guia do Draft temporariamente indisponível", visibilidadeSiteAtual.draftGuideHiddenMessage);
}

function mostrarRankingsIndisponiveis() {
  renderPaginaIndisponivel("Rankings temporariamente indisponíveis", visibilidadeSiteAtual.rankingsHiddenMessage);
}

function mostrarColmeiaIndisponivel() {
  renderPaginaIndisponivel("Colmeia", visibilidadeSiteAtual.colmeiaHiddenMessage);
}

window.T3SiteVisibility = {
  get: () => visibilidadeSiteAtual,
  apply: aplicarVisibilidadeSite,
  isDraftGuideVisible: guiaDoDraftVisivel,
  isRankingsVisible: rankingsVisiveis,
  isColmeiaVisible: colmeiaVisivel,
  showDraftGuideUnavailable: mostrarGuiaDoDraftIndisponivel,
  showRankingsUnavailable: mostrarRankingsIndisponiveis,
  showColmeiaUnavailable: mostrarColmeiaIndisponivel
};

renderConteudoDinamico();
carregarPostsFontePrincipal();
iniciarFiltroCategorias();
iniciarBusca();
iniciarHeaderSticky();
iniciarMenuMobile();
iniciarSplashHome();
iniciarPilhasDeCardsResponsivas();
iniciarRolagemSuaveSite();
carregarHomeSanity();
window.T3SiteVisibilityReady = carregarConfiguracoesSite();
