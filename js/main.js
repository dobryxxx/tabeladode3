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

function postsDoSite() {
  const postsCms = typeof cmsPosts !== "undefined" ? cmsPosts : [];
  const slugsCms = new Set(postsCms.map((post) => post.slug));
  return [
    ...postsCms,
    ...posts.filter((post) => !slugsCms.has(post.slug))
  ];
}

function categoriaDoPost(post) {
  return categorias[post.categoria] || {
    nome: post.categoria,
    tagClasse: "tag--gray",
    badgeClasse: "card-side__badge--green"
  };
}

function imagemOuPlaceholder(post, classe, tipo, indice = 0) {
  if (post.imagem) {
    return `<img class="${classe}" src="${post.imagem}" alt="${post.titulo}" />`;
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

  area.outerHTML = `
    <a class="hero__main home-hero-card home-hero-card--draft editorial-card editorial-card--hero" href="guia-do-draft.html">
      <div class="home-hero-card__art" aria-hidden="true">
        <span>01</span>
        <span>BIG BOARD</span>
        <span>2026</span>
      </div>
      <div class="hero__main-content home-hero-card__content editorial-card__content">
        <div class="home-hero-card__eyebrow">
          <span class="tag tag--red">Draft Guide</span>
          <span>especial premium</span>
        </div>
        <h1 class="hero__main-title">Guia do Draft</h1>
        <p class="hero__main-excerpt">Big board, perfis, tiers e contexto dos principais prospectos da classe.</p>
        <div class="home-hero-card__footer">
          <span>Explorar guia</span>
          <span>scouting / ranking / projeção</span>
        </div>
      </div>
    </a>
  `;
}

function renderHeroLaterais() {
  const area = document.querySelector("#hero-laterais");
  if (!area) return;

  const post = postsDoSite().find((item) => item.destaque) || postsDoSite()[0];
  const categoria = post ? categoriaDoPost(post) : null;
  const prospects = typeof draftProspects !== "undefined" ? draftProspects.slice(0, 3) : [];

  const draftCard = `
    <a class="card-side home-hero-card home-hero-card--prospects editorial-card editorial-card--compact" href="guia-do-draft.html">
      <div class="home-hero-prospects">
        ${prospects.map((prospect) => `
          <div>
            <strong>#${prospect.rank}</strong>
            <span>${prospect.nome}</span>
          </div>
        `).join("")}
      </div>
      <div class="card-side__content editorial-card__content">
        <div class="tag tag--red">Top prospects</div>
        <h2 class="card-side__title">Os nomes para acompanhar</h2>
        <div class="meta meta--spaced">
          <span>board 2026</span><span>·</span><span>guia completo</span>
        </div>
      </div>
    </a>
  `;

  const postCard = post ? `
    <a class="card-side home-hero-card home-hero-card--feature editorial-card editorial-card--compact" href="${linkDoPost(post)}">
      ${imagemOuPlaceholder(post, "card-side__img", "lateral", 1)}
      <div class="card-side__content editorial-card__content">
        <div class="tag ${categoria.tagClasse}">${categoria.nome}</div>
        <h2 class="card-side__title">${post.titulo}</h2>
        <div class="meta meta--spaced">
          <span>${post.data}</span><span>·</span><span>${post.tempoLeitura}</span>
        </div>
      </div>
    </a>
  ` : "";

  area.innerHTML = draftCard + postCard;
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
      const destaqueHome = area.classList.contains("home-latest__grid") && indice === 0 ? " card-ultimas--home-feature" : "";

      return `
        <a class="card-ultimas editorial-card editorial-card--latest${destaqueHome}" href="${linkDoPost(post)}">
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

function iniciaisDraftHome(nome = "") {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("");
}

function renderHomeDraftProspects() {
  const area = document.querySelector("#home-draft-prospects");
  if (!area || typeof draftProspects === "undefined") return;

  area.innerHTML = draftProspects.slice(0, 4).map((prospect) => `
    <a class="home-draft-prospect" href="guia-do-draft.html">
      <div class="home-draft-prospect__rank">#${prospect.rank}</div>
      <div class="home-draft-prospect__photo">
        ${prospect.foto ? `<img src="${prospect.foto}" alt="${prospect.nome}" loading="lazy" />` : `<span>${iniciaisDraftHome(prospect.nome)}</span>`}
      </div>
      <div>
        <h3>${prospect.nome}</h3>
        <p>${[prospect.posicao, prospect.time].filter(Boolean).join(" / ")}</p>
      </div>
    </a>
  `).join("");
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
      ${(post.corpo || []).map((paragrafo) => `<p>${paragrafo}</p>`).join("")}
    </div>
  `;
}

renderHeroPrincipal();
renderHeroLaterais();
renderUltimas();
renderRankingDestaque();
renderHomeDraftProspects();
renderArtigo();
iniciarFiltroCategorias();
iniciarBusca();
iniciarHeaderSticky();
iniciarMenuMobile();
