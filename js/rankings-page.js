let rankingsSanity = [];
let rankingsGeneroAtual = "masculino";

function rankingsDisponiveisDoSite() {
  const locais = typeof rankingsDisponiveis !== "undefined" ? rankingsDisponiveis : [];
  return mesclarRankings(locais, rankingsSanity).map((ranking) => ({
    ...ranking,
    pagina: ranking.pagina || `ranking-individual.html?ranking=${ranking.slug}`,
    total: ranking.total || (ranking.itens || []).length
  }));
}

function chaveRanking(ranking = {}) {
  return String(ranking.slug || ranking.titulo || "").toLowerCase();
}

function mesclarRankings(locais = [], sanity = []) {
  const mapa = new Map();

  locais.forEach((ranking) => {
    if (chaveRanking(ranking)) mapa.set(chaveRanking(ranking), ranking);
  });

  sanity.forEach((ranking) => {
    if (!chaveRanking(ranking)) return;
    mapa.set(chaveRanking(ranking), {
      ...(mapa.get(chaveRanking(ranking)) || {}),
      ...ranking
    });
  });

  return [...mapa.values()];
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generoDoRanking(ranking = {}) {
  return ranking.slug === "t20f" || ranking.categoria === "feminino" ? "feminino" : "masculino";
}

function labelDoRanking(ranking = {}) {
  const slug = String(ranking.slug || "");
  const ano = slug.match(/\d{4}/)?.[0];
  if (ano) return ano;

  return slug.replace(/^ranking-/, "").toUpperCase()
    || String(ranking.titulo || "ranking").replace(/^ranking\s*/i, "").replace(/[\[\]]/g, "").toUpperCase();
}

function atualizarToggleGenero() {
  document.querySelectorAll("[data-ranking-genero]").forEach((botao) => {
    const ativo = botao.dataset.rankingGenero === rankingsGeneroAtual;
    botao.classList.toggle("is-active", ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });
}

function atualizarHeroRanking(rankings = []) {
  const imagemHero = document.querySelector("#rankings-hero-image");
  if (!imagemHero) return;

  const rankingHero = rankings.find((ranking) => generoDoRanking(ranking) === "feminino") || rankings[0];
  if (!rankingHero?.imagem) return;

  imagemHero.src = rankingHero.imagem;
  imagemHero.alt = rankingHero.titulo || "Ranking Tabelado de 3";
}

function renderRankingsPage() {
  const area = document.querySelector("#rankings-grid");
  const todosRankings = rankingsDisponiveisDoSite();
  if (!area || todosRankings.length === 0) return;

  atualizarHeroRanking(todosRankings);
  atualizarToggleGenero();

  const rankingsFiltrados = todosRankings.filter((ranking) => generoDoRanking(ranking) === rankingsGeneroAtual);
  area.innerHTML = rankingsFiltrados.map((ranking) => cardRanking(ranking)).join("");
}

function cardRanking(ranking) {
  return `
    <a class="ranking-card-page ranking-generation-card" href="${escapeHtml(ranking.pagina)}" aria-label="${escapeHtml(ranking.titulo || "Ranking")}">
      <div class="ranking-generation-card__media">
        ${ranking.imagem
          ? `<img class="ranking-generation-card__image" src="${escapeHtml(ranking.imagem)}" alt="${escapeHtml(ranking.titulo || "Ranking")}" />`
          : `<div class="ranking-card-page__placeholder ranking-generation-card__placeholder" aria-hidden="true"></div>`}
      </div>
      <div class="ranking-generation-card__label">
        <span class="ranking-generation-card__year">${escapeHtml(labelDoRanking(ranking))}</span>
      </div>
    </a>
  `;
}

function iniciarEventosRankingsPage() {
  document.addEventListener("click", (evento) => {
    const botaoGenero = evento.target.closest("[data-ranking-genero]");
    if (!botaoGenero) return;

    rankingsGeneroAtual = botaoGenero.dataset.rankingGenero;
    renderRankingsPage();
  });
}

async function iniciarFonteRankings() {
  if (!document.querySelector("#rankings-grid")) return;

  if (window.T3SiteVisibilityReady) {
    await window.T3SiteVisibilityReady;
  }

  if (window.T3SiteVisibility?.isRankingsVisible?.() === false) {
    window.T3SiteVisibility.showRankingsUnavailable?.();
    return;
  }

  if (!window.T3Sanity?.enabled) {
    window.T3Sanity?.devLog?.("Fonte de rankings: fallback local");
    renderRankingsPage();
    return;
  }

  try {
    const dados = await window.T3Sanity.fetchRankings();
    rankingsSanity = Array.isArray(dados) ? dados : [];
    if (!rankingsSanity.length) throw new Error("Sanity sem rankings publicados");
    window.T3Sanity?.devLog?.("Fonte de rankings: Sanity + fallback local");
    renderRankingsPage();
  } catch (erro) {
    window.T3Sanity?.devLog?.("Fonte de rankings: fallback local");
    console.warn("Nao foi possivel carregar rankings do Sanity. Usando dados locais.", erro);
    renderRankingsPage();
  }
}

iniciarEventosRankingsPage();
iniciarFonteRankings();
