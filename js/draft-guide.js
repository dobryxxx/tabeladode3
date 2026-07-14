const draftState = {
  search: "",
  position: "",
  team: "",
  range: "",
  sort: "rank",
  view: "skim",
  viewTransition: "",
  openProfileKey: ""
};

let draftSanityProspects = [];
let draftEventosIniciados = false;
let draftViewAnimationTimer;
let draftReadingBarTicking = false;
const draftYear = window.T3DraftArea?.year || "2026";

function draftData() {
  const locais = draftYear === "2026" && typeof draftProspects !== "undefined" ? draftProspects : [];
  const sanityOrdenado = draftSanityProspects.some((prospect) => prospect?._rankOrigem === "draftBoard");

  if (draftSanityProspects.length) {
    const sanity = draftSanityProspects.map(normalizarProspectSanity);

    if (sanityOrdenado) {
      return sanity.map((prospect, index) => ({
        ...prospect,
        rank: index + 1
      }));
    }

    return sanity.sort((a, b) => (Number(a.rank) || 9999) - (Number(b.rank) || 9999));
  }

  if (sanityOrdenado) {
    return mesclarProspectsOrdenados(locais, draftSanityProspects);
  }

  return mesclarProspects(locais, draftSanityProspects)
    .sort((a, b) => (Number(a.rank) || 9999) - (Number(b.rank) || 9999));
}

function normalizarDraft(valor = "") {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bindDraftImageFallback(root = document) {
  root.querySelectorAll("[data-draft-image]").forEach((image) => {
    image.addEventListener("error", () => image.remove(), { once: true });
  });
}

function chaveProspect(prospect = {}) {
  if (prospect.slug) return `slug:${normalizarDraft(prospect.slug)}`;
  if (prospect.nome) return `nome:${normalizarDraft(prospect.nome)}`;
  return `composto:${normalizarDraft([prospect.nome, prospect.posicao].join("-"))}`;
}

function atualizarDraftReadingBar() {
  const bar = document.querySelector("[data-draft-reading-bar]");
  const browser = document.querySelector(".draft-guide-browser");
  if (!bar || !browser) return;

  const barRect = bar.getBoundingClientRect();
  const browserRect = browser.getBoundingClientRect();
  const ativa = barRect.top <= 1 && browserRect.bottom > bar.offsetHeight + 1;
  document.body.classList.toggle("draft-reading-bar-active", ativa);
}

function agendarDraftReadingBar() {
  if (draftReadingBarTicking) return;
  draftReadingBarTicking = true;

  requestAnimationFrame(() => {
    draftReadingBarTicking = false;
    atualizarDraftReadingBar();
  });
}

function iniciarDraftReadingBar() {
  const bar = document.querySelector("[data-draft-reading-bar]");
  if (!bar) return;

  if (bar.dataset.draftReadingReady) {
    atualizarDraftReadingBar();
    return;
  }

  bar.dataset.draftReadingReady = "true";
  window.addEventListener("scroll", agendarDraftReadingBar, { passive: true });
  window.addEventListener("resize", agendarDraftReadingBar);
  atualizarDraftReadingBar();
}

function normalizarProspectSanity(prospect = {}) {
  const rank = Number(prospect.rank || prospect.rankingGeral || prospect.ordem || 9999);

  return {
    ...prospect,
    rank,
    slug: prospect.slug || normalizarDraft(prospect.nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    nome: prospect.nome || "Prospecto sem nome",
    foto: prospect.foto || "",
    posicao: prospect.posicao || "",
    time: prospect.time || "",
    altura: prospect.altura || "",
    alturaImperial: prospect.alturaImperial || "",
    idade: prospect.idade || "",
    tier: prospect.tier || prospect.alcance || "",
    alcance: prospect.alcance || prospect.tier || "",
    bio: prospect.bio || prospect.resumo || "",
    chaveDesenvolvimento: prospect.chaveDesenvolvimento || "",
    observacoes: prospect.observacoes || "",
    encaixes: Array.isArray(prospect.encaixes) ? prospect.encaixes.filter(Boolean) : [],
    encaixesTimes: Array.isArray(prospect.encaixesTimes) ? prospect.encaixesTimes.filter(Boolean) : [],
    tags: Array.isArray(prospect.tags) ? prospect.tags : []
  };
}

function mesclarProspects(locais = [], sanity = []) {
  const mapa = new Map();
  const aliases = new Map();

  function registrar(alias, chave) {
    if (alias) aliases.set(alias, chave);
  }

  locais.forEach((prospect) => {
    if (!prospect) return;
    const chave = chaveProspect(prospect);
    mapa.set(chave, prospect);
    registrar(chave, chave);
    registrar(prospect.slug ? `slug:${normalizarDraft(prospect.slug)}` : "", chave);
    registrar(prospect.nome ? `nome:${normalizarDraft(prospect.nome)}` : "", chave);
    registrar(`composto:${normalizarDraft([prospect.nome, prospect.posicao].join("-"))}`, chave);
  });

  sanity.map(normalizarProspectSanity).forEach((prospect) => {
    const chavesPossiveis = [
      prospect.slug ? `slug:${normalizarDraft(prospect.slug)}` : "",
      prospect.nome ? `nome:${normalizarDraft(prospect.nome)}` : "",
      `composto:${normalizarDraft([prospect.nome, prospect.posicao].join("-"))}`
    ].filter(Boolean);
    const chave = chavesPossiveis.map((item) => aliases.get(item)).find(Boolean) || chaveProspect(prospect);

    mapa.set(chave, {
      ...(mapa.get(chave) || {}),
      ...prospect
    });
    chavesPossiveis.forEach((alias) => registrar(alias, chave));
  });

  return [...mapa.values()].filter((p) => p.ocultoNoGuia !== true);
}

function mesclarProspectsOrdenados(locais = [], sanity = []) {
  const locaisPorChave = new Map();
  locais.forEach((prospect) => {
    if (!prospect) return;
    locaisPorChave.set(chaveProspect(prospect), prospect);
    if (prospect.slug) locaisPorChave.set(`slug:${normalizarDraft(prospect.slug)}`, prospect);
    if (prospect.nome) locaisPorChave.set(`nome:${normalizarDraft(prospect.nome)}`, prospect);
  });

  const usados = new Set();
  const ordenados = sanity.map(normalizarProspectSanity).map((prospect, index) => {
    const chaves = [
      prospect.slug ? `slug:${normalizarDraft(prospect.slug)}` : "",
      prospect.nome ? `nome:${normalizarDraft(prospect.nome)}` : "",
      chaveProspect(prospect)
    ].filter(Boolean);
    const local = chaves.map((chave) => locaisPorChave.get(chave)).find(Boolean);
    chaves.forEach((chave) => usados.add(chave));

    return {
      ...(local || {}),
      ...prospect,
      rank: index + 1
    };
  });

  const restantes = locais
    .filter((prospect) => {
      const chaves = [
        chaveProspect(prospect),
        prospect.slug ? `slug:${normalizarDraft(prospect.slug)}` : "",
        prospect.nome ? `nome:${normalizarDraft(prospect.nome)}` : ""
      ].filter(Boolean);
      return !chaves.some((chave) => usados.has(chave));
    })
    .sort((a, b) => (Number(a.rank) || 9999) - (Number(b.rank) || 9999))
    .map((prospect, index) => ({
      ...prospect,
      rank: ordenados.length + index + 1
    }));

  return [...ordenados, ...restantes].filter((p) => p.ocultoNoGuia !== true);
}

function iniciais(nome = "") {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("");
}

function opcoesUnicas(campo) {
  return [...new Set(draftData().map((item) => item[campo]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function opcoesEncaixes() {
  return [...new Set(draftData().flatMap((prospect) => [
    ...(Array.isArray(prospect.encaixesTimes) ? prospect.encaixesTimes.map((time) => time.nome || time.sigla).filter(Boolean) : []),
    ...(Array.isArray(prospect.encaixes) ? prospect.encaixes.filter(Boolean) : [])
  ]))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function prospectCombinaEncaixe(prospect, encaixe) {
  if (!encaixe) return true;
  const alvo = normalizarDraft(encaixe);
  const encaixes = [
    ...(Array.isArray(prospect.encaixesTimes) ? prospect.encaixesTimes.flatMap((time) => [time.nome, time.sigla]).filter(Boolean) : []),
    ...(Array.isArray(prospect.encaixes) ? prospect.encaixes.filter(Boolean) : [])
  ];
  return encaixes.some((item) => normalizarDraft(item) === alvo);
}

function preencherSelect(id, label, opcoes) {
  const select = document.querySelector(id);
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(label)}</option>${opcoes.map((opcao) => `<option value="${escapeHtml(opcao)}">${escapeHtml(opcao)}</option>`).join("")}`;
}

function fotoOuPlaceholder(prospect, classe = "") {
  const nome = prospect.nome || "Foto do prospecto";
  if (prospect.foto) {
    return `<img class="${escapeHtml(classe)}" src="${escapeHtml(prospect.foto)}" alt="${escapeHtml(nome)}" loading="lazy" data-draft-image />`;
  }

  return `
    <div class="${escapeHtml(classe)} draft-prospect-card__placeholder" aria-label="Sem foto de ${escapeHtml(prospect.nome)}">
      <span>${escapeHtml(iniciais(prospect.nome))}</span>
    </div>
  `;
}

function renderHero() {
  const artwork = document.querySelector("[data-draft-hero-artwork]");
  const yearLabel = document.querySelector("[data-draft-hero-year]");
  if (yearLabel) yearLabel.textContent = draftYear;
  if (!artwork) return;

  const prospects = draftData()
    .filter((prospect) => prospect?.foto)
    .slice(0, 4);

  if (!prospects.length) {
    artwork.innerHTML = "";
    artwork.setAttribute("hidden", "");
    return;
  }

  artwork.removeAttribute("hidden");
  artwork.innerHTML = prospects.map((prospect, index) => `
    <figure class="draft-guide-hero__portrait draft-guide-hero__portrait--${index + 1}">
      <img src="${escapeHtml(prospect.foto)}" alt="${escapeHtml(prospect.fotoAlt || prospect.nome || "Prospecto do Draft")}" ${index === 0 ? 'loading="eager"' : 'loading="lazy"'} data-draft-image />
    </figure>
  `).join("");
  bindDraftImageFallback(artwork);
}

function prospectCombina(prospect) {
  const busca = normalizarDraft(draftState.search);
  const alvo = normalizarDraft([
    prospect.nome,
    prospect.posicao,
    prospect.time,
    prospect.alcance,
    prospect.status,
    prospect.espelho,
    prospect.bio
  ].join(" "));

  return (!busca || alvo.includes(busca))
    && (!draftState.position || prospect.posicao === draftState.position)
    && (!draftState.team || prospect.time === draftState.team)
    && prospectCombinaEncaixe(prospect, draftState.range);
}

function ordenarProspects(lista) {
  return [...lista].sort((a, b) => {
    if (draftState.sort === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (draftState.sort === "posicao") return (a.posicao || "").localeCompare(b.posicao || "", "pt-BR") || a.rank - b.rank;
    return a.rank - b.rank;
  });
}

function dadoDraft(label, valor) {
  return valor ? `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(valor)}</strong></div>` : "";
}

function dadoDraftFixo(label, valor, fallback = "em atualização") {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(valor || fallback)}</strong></div>`;
}

function obterEncaixes(prospect = {}) {
  const timesComLogo = Array.isArray(prospect.encaixesTimes) ? prospect.encaixesTimes : [];
  const timesTexto = Array.isArray(prospect.encaixes) ? prospect.encaixes : [];
  return [
    ...timesComLogo.map((time) => ({
      nome: time.nome || time.name || time.sigla || "",
      sigla: time.sigla || "",
      logo: time.logo || time.logoUrl || "",
      alt: time.logoAlt || `Logo ${time.nome || time.sigla || "time"}`
    })),
    ...timesTexto
      .filter((nome) => !timesComLogo.some((time) => normalizarDraft(time.nome || time.sigla) === normalizarDraft(nome)))
      .map((nome) => ({ nome, sigla: "", logo: "", alt: "" }))
  ].filter((time) => time.nome || time.sigla || time.logo);
}

function renderEncaixes(prospect = {}) {
  const itens = obterEncaixes(prospect);

  if (!itens.length) return "";

  return `
    <div class="draft-fit-list" aria-label="Melhores encaixes">
      ${itens.map((time) => {
        const label = time.sigla || time.nome;
        const nomeCompleto = time.nome || label;
        return `
          <span class="draft-fit" title="${escapeHtml(nomeCompleto)}">
            ${time.logo
              ? `<img src="${escapeHtml(time.logo)}" alt="${escapeHtml(time.alt)}" loading="lazy" data-draft-image />`
              : `<span class="draft-fit__fallback">${escapeHtml(iniciais(label || nomeCompleto))}</span>`}
            <span>${escapeHtml(nomeCompleto)}</span>
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function renderEncaixesPeek(prospect = {}) {
  const itens = obterEncaixes(prospect).slice(0, 3);
  if (!itens.length) return "";

  const logos = itens.map((time, index) => {
    const label = time.sigla || time.nome;
    const nomeCompleto = time.nome || label;
    const indice = index + 1;
    return `
      <span class="draft-peek-fit draft-peek-fit--${indice}" title="${escapeHtml(nomeCompleto)}">
        ${time.logo
          ? `<span class="draft-peek-fit__logo draft-peek-fit__logo--${indice}"><img class="draft-peek-fit__logo-img" src="${escapeHtml(time.logo)}" alt="${escapeHtml(time.alt)}" loading="lazy" data-draft-image /></span>`
          : `<span class="draft-peek-fit__logo draft-peek-fit__fallback draft-peek-fit__logo--${indice}">${escapeHtml(iniciais(label || nomeCompleto))}</span>`}
      </span>
    `;
  }).join("");

  return `
    <div class="draft-peek-fits" aria-label="Melhores encaixes">
      ${logos}
    </div>
  `;
}

function renderDetalhePerfil(label, valor, classe = "") {
  return `
    <div class="draft-prospect-card__detail ${escapeHtml(classe)}">
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(valor)}</p>
    </div>
  `;
}

function renderDetalhePerfilOpcional(label, valor, classe = "") {
  return valor ? renderDetalhePerfil(label, valor, classe) : "";
}

function renderProspectCardVariant(prospect, index = 0) {
  const encaixesPerfil = renderEncaixes(prospect);
  const encaixesPeek = renderEncaixesPeek(prospect);
  const chave = chaveProspect(prospect);
  const inlineExpandido = draftState.view !== "deep" && draftState.openProfileKey === chave;
  const encaixesVisual = draftState.view === "peek" && !inlineExpandido ? encaixesPeek : encaixesPerfil;
  const temPerfil = Boolean(
    prospect.observacoes
    || prospect.motivoEscolha
    || prospect.chaveDesenvolvimento
    || prospect.arquetipoOfensivo
    || prospect.arquetipoDefensivo
    || prospect.tetoPiso
    || prospect.espelho
    || encaixesPerfil
  );
  const expandido = draftState.view === "deep" || inlineExpandido;
  const variante = expandido ? "deep" : draftState.view;
  const alcanceTexto = prospect.alcance || prospect.tier || "";
  const alturaTexto = [prospect.altura, prospect.alturaImperial].filter(Boolean).join(" / ");
  const rankTexto = String(prospect.rank || "");
  const nomeTexto = prospect.nome || "Prospecto sem nome";
  const rankClasse = rankTexto.length >= 3
    ? " draft-prospect-card__rank--triple"
    : rankTexto.length === 2
      ? " draft-prospect-card__rank--double"
      : "";

  return `
    <article class="draft-prospect-card draft-prospect-surface--glass draft-prospect-card--${variante}${expandido ? " draft-prospect-card--expanded" : ""}${inlineExpandido ? " draft-prospect-card--inline-deep" : ""}" data-draft-card data-draft-key="${escapeHtml(chave)}" data-draft-variant="${variante}" tabindex="-1" style="--draft-card-index: ${index};">
      <div class="draft-prospect-card__rank${rankClasse}" aria-label="Ranking ${escapeHtml(prospect.rank)}">
        <strong>${escapeHtml(prospect.rank)}</strong>
      </div>
      <div class="draft-prospect-card__photo">
        ${fotoOuPlaceholder(prospect, "draft-prospect-card__img")}
      </div>
      <div class="draft-prospect-card__content">
        <div class="draft-prospect-card__eyebrow">
          <span>${escapeHtml(prospect.posicao || "posicao em aberto")}</span>
          ${alcanceTexto ? `<span>alcance ${escapeHtml(alcanceTexto)}</span>` : ""}
        </div>
        <h3>
          ${temPerfil
            ? `<button type="button" class="draft-prospect-card__name-button" data-draft-profile-trigger aria-expanded="${expandido}">${escapeHtml(nomeTexto)}</button>`
            : escapeHtml(nomeTexto)}
        </h3>
        <p>${escapeHtml(prospect.espelho ? `Espelho: ${prospect.espelho}` : prospect.bio || "Perfil em atualizacao.")}</p>
        <div class="draft-prospect-card__meta">
          ${dadoDraftFixo("posicao", prospect.posicao)}
          ${dadoDraftFixo("time", prospect.time)}
          ${dadoDraftFixo("altura", alturaTexto)}
          ${dadoDraftFixo("idade", prospect.idade)}
          ${dadoDraftFixo("alcance", alcanceTexto)}
        </div>
        ${prospect.espelho ? `
          <div class="draft-prospect-card__mirror">
            <span>espelho:</span>
            <strong>${escapeHtml(prospect.espelho)}</strong>
          </div>
        ` : ""}
      </div>
      <div class="draft-prospect-card__aside">
        ${prospect.tetoPiso ? `<div><span>teto/piso</span><strong>${escapeHtml(prospect.tetoPiso)}</strong></div>` : ""}
        ${encaixesVisual ? `
          <div class="draft-prospect-card__fits">
            <span>Melhores encaixes</span>
            ${encaixesVisual}
          </div>
        ` : ""}
      </div>
      <div class="draft-prospect-card__details">
        ${temPerfil ? `
          ${prospect.observacoes ? `
            <section class="draft-prospect-card__editorial" aria-label="Pitaco">
              <span class="draft-prospect-card__section-label">pitaco</span>
              <p>${escapeHtml(prospect.observacoes)}</p>
            </section>
          ` : ""}
          <section class="draft-prospect-card__analysis" aria-label="Analise do prospecto">
            ${renderDetalhePerfilOpcional("Por que vale uma escolha?", prospect.motivoEscolha, "draft-prospect-card__detail--reading")}
            ${renderDetalhePerfilOpcional("Chave de desenvolvimento", prospect.chaveDesenvolvimento, "draft-prospect-card__detail--reading")}
          </section>
          <aside class="draft-prospect-card__profile-aside" aria-label="Ficha de scouting">
            ${renderDetalhePerfilOpcional("Arquetipo ofensivo", prospect.arquetipoOfensivo)}
            ${renderDetalhePerfilOpcional("Arquetipo defensivo", prospect.arquetipoDefensivo)}
            ${encaixesPerfil ? `
              <div class="draft-prospect-card__detail draft-prospect-card__detail--fits">
                <span>Melhores encaixes</span>
                ${encaixesPerfil}
              </div>
            ` : ""}
            ${renderDetalhePerfilOpcional("Espelho", prospect.espelho)}
          </aside>
        ` : "<p>Sem detalhes adicionais no CSV.</p>"}
      </div>
    </article>
  `;
}

function ajustarEspelhosPeek(root = document) {
  root.querySelectorAll(".draft-prospect-card--peek .draft-prospect-card__mirror").forEach((mirror) => {
    const label = mirror.querySelector("span");
    const value = mirror.querySelector("strong");
    if (!label || !value) return;

    value.style.fontSize = "";

    const style = getComputedStyle(mirror);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const available = mirror.clientWidth - label.offsetWidth - gap;
    if (available <= 0 || value.scrollWidth <= available) return;

    const baseSize = Number.parseFloat(style.fontSize) || 20;
    const nextSize = Math.max(13, Math.floor(baseSize * (available / value.scrollWidth) * 10) / 10);
    value.style.fontSize = `${nextSize}px`;
  });
}

function renderDraftList() {
  const lista = document.querySelector("#draft-list");
  const contador = document.querySelector("#draft-count");
  if (!lista || !contador) return;

  const filtrados = ordenarProspects(draftData().filter(prospectCombina));
  contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? "prospect encontrado" : "prospects encontrados"}`;
  lista.className = `draft-guide-list draft-guide-list--${draftState.view}${draftState.viewTransition ? ` draft-guide-list--${draftState.viewTransition}` : ""}`;

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="draft-empty-state">Nenhum prospect encontrado com esses filtros.</div>';
    return;
  }

  lista.innerHTML = filtrados.map(renderProspectCardVariant).join("");
  bindDraftImageFallback(lista);
  requestAnimationFrame(() => ajustarEspelhosPeek(lista));

  if (!lista.dataset.draftSkimClickBound) {
    lista.dataset.draftSkimClickBound = "true";
    lista.addEventListener("click", (event) => {
      if (draftState.view === "deep") return;
      const card = event.target.closest("[data-draft-card]");
      if (!card || !lista.contains(card)) return;
      if (draftState.openProfileKey === card.dataset.draftKey) {
        card.classList.add("draft-prospect-card--inline-closing");
        window.setTimeout(() => {
          if (draftState.openProfileKey !== card.dataset.draftKey) return;
          draftState.openProfileKey = "";
          renderDraftList();
        }, 320);
        return;
      }

      draftState.openProfileKey = card.dataset.draftKey;
      renderDraftList();
    });
  }
}

function finalizarAnimacaoModo(lista, duracao = 520) {
  if (!lista) return;

  clearTimeout(draftViewAnimationTimer);
  lista.classList.remove("draft-guide-list--changing");
  void lista.offsetWidth;
  lista.classList.add("draft-guide-list--changing");
  draftViewAnimationTimer = setTimeout(() => {
    lista.classList.remove("draft-guide-list--changing");
    lista.classList.remove("draft-guide-list--opening-peek", "draft-guide-list--closing-peek");
    draftState.viewTransition = "";
  }, duracao);
}

function aplicarEstadoModoVisualizacao(nextView, previousView, options = {}) {
  draftState.view = nextView;
  draftState.viewTransition = previousView === "skim" && nextView === "peek"
    ? "opening-peek"
    : previousView === "peek" && nextView === "skim"
      ? "closing-peek"
      : "";
  if (nextView === "deep") draftState.openProfileKey = "";

  try {
    localStorage.setItem("t3-draft-view", draftState.view);
  } catch {
    // Storage may be unavailable in privacy modes.
  }

  document.querySelectorAll("[data-draft-view]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.draftView === draftState.view));
  });

  renderDraftList();
}

function aplicarModoVisualizacao(view, options = {}) {
  const modos = new Set(["skim", "peek", "deep"]);
  const previousView = draftState.view;
  const nextView = modos.has(view) ? view : "skim";
  if (previousView === nextView) return;

  aplicarEstadoModoVisualizacao(nextView, previousView, options);

  const lista = document.querySelector("#draft-list");
  if (!lista) return;
  finalizarAnimacaoModo(lista);
}

function debounce(fn, delay = 160) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function iniciarDraftGuide() {
  if (draftData().length === 0) {
    const count = document.querySelector("#draft-count");
    const list = document.querySelector("#draft-list");
    if (count) count.textContent = "0 prospects encontrados";
    if (list) {
      list.innerHTML = `<div class="draft-empty-state">O Guia do Draft ${escapeHtml(draftYear)} ainda está sendo preparado no Studio.</div>`;
    }
    return;
  }

  try {
    const savedView = localStorage.getItem("t3-draft-view");
    if (["skim", "peek", "deep"].includes(savedView)) draftState.view = savedView;
    if (savedView === "peruse") localStorage.setItem("t3-draft-view", "skim");
  } catch {
    // Keep the default view.
  }

  preencherSelect("#draft-position", "todas", opcoesUnicas("posicao"));
  preencherSelect("#draft-team", "todos", opcoesUnicas("time"));
  preencherSelect("#draft-range", "todos", opcoesEncaixes());

  renderHero();
  renderDraftList();
  iniciarDraftReadingBar();

  if (draftEventosIniciados) return;
  draftEventosIniciados = true;

  const busca = document.querySelector("#draft-search");
  const posicao = document.querySelector("#draft-position");
  const time = document.querySelector("#draft-team");
  const alcance = document.querySelector("#draft-range");
  const ordenacao = document.querySelector("#draft-sort");
  const limpar = document.querySelector("#draft-clear");
  const modosVisualizacao = document.querySelectorAll("[data-draft-view]");
  const atualizarBusca = debounce(() => {
    draftState.search = busca.value;
    renderDraftList();
  });

  busca?.addEventListener("input", atualizarBusca);
  window.addEventListener("resize", debounce(() => {
    if (draftState.openProfileKey && draftState.view !== "deep") {
      renderDraftList();
      return;
    }

    ajustarEspelhosPeek(document.querySelector("#draft-list") || document);
  }, 120));
  posicao?.addEventListener("change", () => { draftState.position = posicao.value; renderDraftList(); });
  time?.addEventListener("change", () => { draftState.team = time.value; renderDraftList(); });
  alcance?.addEventListener("change", () => { draftState.range = alcance.value; renderDraftList(); });
  ordenacao?.addEventListener("change", () => { draftState.sort = ordenacao.value; renderDraftList(); });
  modosVisualizacao.forEach((button) => {
    button.addEventListener("click", () => aplicarModoVisualizacao(button.dataset.draftView));
  });
  modosVisualizacao.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.draftView === draftState.view));
  });
  limpar?.addEventListener("click", () => {
    Object.assign(draftState, { search: "", position: "", team: "", range: "", sort: "rank" });
    if (busca) busca.value = "";
    if (posicao) posicao.value = "";
    if (time) time.value = "";
    if (alcance) alcance.value = "";
    if (ordenacao) ordenacao.value = "rank";
    renderDraftList();
  });
}

async function iniciarFonteDraftGuide() {
  if (!document.querySelector("#draft-list")) return;

  if (window.T3SiteVisibilityReady) {
    await window.T3SiteVisibilityReady;
  }

  if (window.T3SiteVisibility?.isDraftGuideVisible?.() === false) {
    window.T3SiteVisibility.showDraftGuideUnavailable?.();
    return;
  }

  if (!window.T3Sanity?.enabled) {
    window.T3Sanity?.devLog?.("Fonte do guia do draft: fallback local");
    iniciarDraftGuide();
    return;
  }

  try {
    const dados = await window.T3Sanity.fetchDraftProspects(draftYear);
    draftSanityProspects = Array.isArray(dados) ? dados : [];
    if (!draftSanityProspects.length && draftYear === "2026") throw new Error("Sanity sem prospectos publicados");
    window.T3Sanity?.devLog?.("Fonte do guia do draft: Sanity");
    iniciarDraftGuide();
  } catch (erro) {
    window.T3Sanity?.devLog?.("Fonte do guia do draft: fallback local");
    console.warn("Não foi possível carregar Guia do Draft do Sanity. Usando CSV local.", erro);
    iniciarDraftGuide();
  }
}

iniciarFonteDraftGuide();
