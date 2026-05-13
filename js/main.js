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
  if (Array.isArray(corpo) && corpo.some((bloco) => bloco && bloco._type === "block")) {
    return corpo
      .filter((bloco) => bloco._type === "block")
      .map((bloco) => (bloco.children || []).map((child) => child.text || "").join(""))
      .map((paragrafo) => paragrafo.trim())
      .filter(Boolean);
  }

  if (Array.isArray(corpo)) return corpo;
  if (typeof corpo !== "string") return [];
  return corpo
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

function normalizarPost(post = {}) {
  const titulo = post.titulo || post.title || "";
  const resumo = post.resumo || post.excerpt || post.description || "";

  return {
    ...post,
    titulo,
    categoria: post.categoria || post.category || "ultimas",
    data: formatarDataPost(post.data || post.date || ""),
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
  const todos = [...postsSanity, ...postsJson, ...postsCms, ...postsBase].map(normalizarPost);
  const slugs = new Set();

  return todos.filter((post) => {
    if (!post.slug) return false;
    if (slugs.has(post.slug)) return false;
    slugs.add(post.slug);
    return true;
  });
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
  const post = postsDoSite().find((item) => item.destaque);
  if (!area || !post) return;

  const categoria = categoriaDoPost(post);

  area.innerHTML = `
    <a class="hero__main editorial-card editorial-card--hero" href="${linkDoPost(post)}">
      ${imagemOuPlaceholder(post, "hero__main-img", "hero")}
      <div class="hero__main-content editorial-card__content">
        <div class="hero__main-tag tag ${categoria.tagClasse}">${categoria.nome}</div>
        <h1 class="hero__main-title">${post.titulo}</h1>
        <p class="hero__main-excerpt">${post.excerpt}</p>
        <div class="meta meta--flush">
          <span>${post.data}</span>
          <span>·</span>
          <span>${post.tempoLeitura}</span>
        </div>
      </div>
    </a>
  `;
}

function renderHeroLaterais() {
  const area = document.querySelector("#hero-laterais");
  if (!area) return;

  area.innerHTML = postsDoSite()
    .filter((post) => post.lateral)
    .slice(0, 2)
    .map((post, indice) => {
      const categoria = categoriaDoPost(post);

      return `
        <a class="card-side editorial-card editorial-card--compact" href="${linkDoPost(post)}">
          ${imagemOuPlaceholder(post, "card-side__img", "lateral", indice)}
          <div class="card-side__badge ${categoria.badgeClasse}">
            ${iconeBasquete()}
          </div>
          <div class="card-side__content editorial-card__content">
            <div class="tag ${categoria.tagClasse}">${categoria.nome}</div>
            <h2 class="card-side__title">${post.titulo}</h2>
            <div class="meta meta--spaced">
              <span>${post.data}</span><span>·</span><span>${post.tempoLeitura}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
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
    .filter((post) => !post.destaque && !post.lateral)
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

function iniciarFiltroCategorias() {
  const links = document.querySelectorAll("[data-categoria]");
  if (links.length === 0) return;

  links.forEach((link) => {
    link.addEventListener("click", (evento) => {
      evento.preventDefault();
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      renderUltimas("", link.dataset.categoria || "");
    });
  });
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
    renderUltimas();
  }

  botao.addEventListener("click", () => {
    if (painel.classList.contains("is-open")) {
      fecharBusca();
      return;
    }

    abrirBusca();
  });

  campo.addEventListener("input", () => {
    renderUltimas(campo.value);
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
  const cards = document.querySelectorAll(".splash-entry");
  if (!cards.length) return;

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  cards.forEach((card) => {
    card.addEventListener("click", (evento) => {
      const destino = card.getAttribute("href");
      if (!destino || destino.startsWith("#") || reduzirMovimento) return;

      evento.preventDefault();
      card.classList.add("is-selected");
      document.body.classList.add("is-leaving");

      window.setTimeout(() => {
        window.location.href = destino;
      }, 320);
    });
  });
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
    cards.innerHTML = settings.cards
      .slice()
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99))
      .map((card, index) => `
        <a class="splash-entry" href="${card.link || "#"}" style="--entry-index: ${index + 1}">
          <span class="splash-entry__number">${card.numero || String(index + 1).padStart(2, "0")}</span>
          <span class="splash-entry__label">${card.titulo || "Área"}</span>
          <strong>${card.descricao || ""}</strong>
          <span class="splash-entry__cta">${card.cta || "Entrar"}</span>
        </a>
      `)
      .join("");
  }
}

async function carregarHomeSanity() {
  if (!document.querySelector(".splash-page") || !window.T3Sanity?.enabled) return;

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

function renderConteudoDinamico() {
  renderHeroPrincipal();
  renderHeroLaterais();
  renderUltimas();
  renderRankingDestaque();
  renderArtigo();
}

async function carregarPostsJson(logarFonte = true) {
  const usaPosts = document.querySelector("#hero-principal, #hero-laterais, #ultimas-posts, #artigo");
  if (!usaPosts) return;

  try {
    const resposta = await fetch("data/posts.json", { cache: "no-store" });
    if (!resposta.ok) throw new Error("posts.json indisponível");

    const dados = await resposta.json();
    postsJson = Array.isArray(dados) ? dados : (dados.posts || []);
    if (logarFonte) window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    renderConteudoDinamico();
  } catch (erro) {
    if (logarFonte) window.T3Sanity?.devLog?.("Fonte de posts: fallback local");
    console.warn("Não foi possível carregar data/posts.json. Usando posts locais.", erro);
  }
}

async function carregarPostsFontePrincipal() {
  const usaPosts = document.querySelector("#hero-principal, #hero-laterais, #ultimas-posts, #artigo");
  if (!usaPosts) return;

  await carregarPostsJson(false);

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
      ${(post.corpo.length ? post.corpo : ["Texto em atualização."]).map((paragrafo) => `<p>${markdownBasico(paragrafo)}</p>`).join("")}
    </div>
  `;
}

renderConteudoDinamico();
carregarPostsFontePrincipal();
iniciarFiltroCategorias();
iniciarBusca();
iniciarHeaderSticky();
iniciarMenuMobile();
iniciarSplashHome();
carregarHomeSanity();
