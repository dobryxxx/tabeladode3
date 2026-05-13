(function () {
  const state = {
    tips: [],
    query: "",
    category: "Todas"
  };

  const els = {
    total: document.getElementById("dicas-total"),
    featuredSection: document.getElementById("dicas-destaques-section"),
    featured: document.getElementById("dicas-destaques"),
    search: document.getElementById("dicas-busca"),
    filters: document.getElementById("dicas-categorias"),
    clear: document.getElementById("dicas-limpar"),
    grid: document.getElementById("dicas-grid"),
    empty: document.getElementById("dicas-vazio")
  };

  const isDev = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

  function log(message) {
    if (isDev) console.info(message);
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function text(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    const clean = String(value).trim();
    return clean || fallback;
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function plainPortableText(blocks) {
    if (!Array.isArray(blocks)) return "";
    return blocks
      .map((block) => {
        if (block?._type !== "block" || !Array.isArray(block.children)) return "";
        return block.children.map((child) => child?.text || "").join("");
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", {day: "2-digit", month: "short", year: "numeric"});
  }

  function normalizeTip(item, source = "local") {
    const title = text(item.title || item.titulo || item.nome, "Dica sem titulo");
    const category = text(item.category || item.categoria, "Geral");
    const body = item.body || item.corpo || item.description || item.descricao || "";
    const bodyText = Array.isArray(body) ? plainPortableText(body) : text(body);
    const image = text(item.image || item.mainImage || item.imagem || item.imageUrl || item.localImagePath);

    return {
      id: item._id || `${source}-${slugify(item.slug || title)}`,
      title,
      slug: slugify(item.slug || title),
      excerpt: text(item.excerpt || item.resumo || bodyText, "Curadoria do Tabelado de 3 para acompanhar melhor o jogo."),
      category,
      image,
      imageAlt: text(item.imageAlt || item.alt, title),
      externalUrl: text(item.externalUrl || item.link || item.url),
      linkLabel: text(item.linkLabel || item.cta, "Acessar dica"),
      body: bodyText,
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String) : [],
      publishedAt: item.publishedAt || item.data || item.date || "",
      featured: Boolean(item.featured || item.destaque),
      order: Number.isFinite(Number(item.order || item.ordem)) ? Number(item.order || item.ordem) : 9999,
      source
    };
  }

  function mergeTips(localTips, sanityTips) {
    const map = new Map();
    localTips.forEach((tip) => map.set(tip.slug || slugify(tip.title), tip));
    sanityTips.forEach((tip) => map.set(tip.slug || slugify(tip.title), tip));
    return [...map.values()].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
  }

  async function loadTips() {
    const fallbackTips = typeof dicasLocais !== "undefined" ? dicasLocais : window.dicasLocais || [];
    const localTips = fallbackTips.map((item) => normalizeTip(item, "local"));
    let sanityTips = [];

    try {
      if (window.T3Sanity?.enabled && typeof window.T3Sanity.fetchTips === "function") {
        const result = await window.T3Sanity.fetchTips();
        sanityTips = Array.isArray(result) ? result.map((item) => normalizeTip(item, "sanity")) : [];
      }
    } catch (error) {
      log(`Fonte de dicas: fallback local (${error.message})`);
    }

    if (sanityTips.length && localTips.length) log("Fonte de dicas: Sanity + fallback local");
    else if (sanityTips.length) log("Fonte de dicas: Sanity");
    else log("Fonte de dicas: fallback local");

    state.tips = mergeTips(localTips, sanityTips);
  }

  function tipMatches(tip) {
    const haystack = [
      tip.title,
      tip.excerpt,
      tip.category,
      tip.body,
      ...(tip.tags || [])
    ].join(" ").toLowerCase();

    const queryOk = !state.query || haystack.includes(state.query.toLowerCase());
    const categoryOk = state.category === "Todas" || tip.category === state.category;
    return queryOk && categoryOk;
  }

  function renderFilters() {
    if (!els.filters) return;
    const categories = ["Todas", ...new Set(state.tips.map((tip) => tip.category).filter(Boolean))];
    els.filters.innerHTML = categories.map((category) => `
      <button class="tips-chip${state.category === category ? " is-active" : ""}" type="button" data-category="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </button>
    `).join("");
  }

  function cardTemplate(tip, featured = false) {
    const date = formatDate(tip.publishedAt);
    const hasImage = Boolean(tip.image);
    const isExternal = /^https?:\/\//i.test(tip.externalUrl);
    const actionAttrs = tip.externalUrl
      ? `href="${escapeHtml(tip.externalUrl)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}`
      : "";
    const tags = tip.tags.slice(0, featured ? 4 : 3);
    const imageMarkup = hasImage
      ? `<img src="${escapeHtml(tip.image)}" alt="${escapeHtml(tip.imageAlt)}" loading="lazy" onerror="this.closest('.tip-card__media').classList.add('tip-card__media--empty'); this.remove();" />`
      : `<div class="tip-card__placeholder" aria-hidden="true">${escapeHtml(tip.title.slice(0, 2).toUpperCase())}</div>`;

    return `
      <article class="tip-card${featured ? " tip-card--featured" : ""}" data-slug="${escapeHtml(tip.slug)}">
        <div class="tip-card__media${hasImage ? "" : " tip-card__media--empty"}">
          ${imageMarkup}
        </div>
        <div class="tip-card__content">
          <div class="tip-card__meta">
            <span class="tip-card__category">${escapeHtml(tip.category)}</span>
            ${date ? `<time datetime="${escapeHtml(tip.publishedAt)}">${escapeHtml(date)}</time>` : ""}
          </div>
          <h3 class="tip-card__title">${escapeHtml(tip.title)}</h3>
          <p class="tip-card__excerpt">${escapeHtml(tip.excerpt)}</p>
          ${tags.length ? `<div class="tip-card__tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          ${tip.externalUrl
            ? `<a class="tip-card__action" ${actionAttrs}>${escapeHtml(tip.linkLabel)} <span aria-hidden="true">→</span></a>`
            : `<button class="tip-card__action tip-card__action--button" type="button" aria-expanded="false">Ver detalhes <span aria-hidden="true">→</span></button>`}
          ${tip.body && !tip.externalUrl ? `<div class="tip-card__body" hidden>${escapeHtml(tip.body).replace(/\n{2,}/g, "<br><br>")}</div>` : ""}
        </div>
      </article>
    `;
  }

  function renderFeatured() {
    const featured = state.tips.filter((tip) => tip.featured).slice(0, 3);
    if (!els.featured || !els.featuredSection) return;

    if (!featured.length || state.query || state.category !== "Todas") {
      els.featuredSection.hidden = true;
      els.featured.innerHTML = "";
      return;
    }

    els.featuredSection.hidden = false;
    els.featured.innerHTML = featured.map((tip) => cardTemplate(tip, true)).join("");
  }

  function renderGrid() {
    if (!els.grid) return;
    const visible = state.tips.filter(tipMatches);
    const featuredSlugs = new Set(state.tips.filter((tip) => tip.featured).slice(0, 3).map((tip) => tip.slug));
    const shouldSeparateFeatured = !state.query && state.category === "Todas";
    const gridTips = shouldSeparateFeatured ? visible.filter((tip) => !featuredSlugs.has(tip.slug)) : visible;

    els.grid.innerHTML = gridTips.map((tip) => cardTemplate(tip)).join("");
    if (els.empty) els.empty.hidden = visible.length > 0;
    if (els.total) els.total.textContent = `${state.tips.length} dicas publicadas`;
  }

  function renderAll() {
    renderFilters();
    renderFeatured();
    renderGrid();
  }

  function bindEvents() {
    els.search?.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      renderFeatured();
      renderGrid();
    });

    els.filters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category || "Todas";
      renderFilters();
      renderFeatured();
      renderGrid();
    });

    els.clear?.addEventListener("click", () => {
      state.query = "";
      state.category = "Todas";
      if (els.search) els.search.value = "";
      renderAll();
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest(".tip-card__action--button");
      if (!button) return;
      const body = button.closest(".tip-card")?.querySelector(".tip-card__body");
      if (!body) return;
      const isOpen = body.hidden;
      body.hidden = !isOpen;
      button.setAttribute("aria-expanded", String(isOpen));
      button.innerHTML = isOpen ? 'Fechar detalhes <span aria-hidden="true">↑</span>' : 'Ver detalhes <span aria-hidden="true">→</span>';
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadTips();
    renderAll();
  });
})();
