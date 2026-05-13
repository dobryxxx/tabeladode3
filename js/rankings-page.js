let rankingsSanity = [];

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

function renderRankingsPage() {
  const area = document.querySelector("#rankings-grid");
  const todosRankings = rankingsDisponiveisDoSite();
  if (!area || todosRankings.length === 0) return;

  const rankingFeminino = todosRankings.find((ranking) => ranking.slug === "t20f" || ranking.categoria === "feminino");
  const rankingsMasculinos = todosRankings.filter((ranking) => ranking !== rankingFeminino);

  area.innerHTML = `
    <section class="ranking-group ranking-group--masculino">
      <div class="ranking-group__header">
        <div>
          <span class="ranking-group__eyebrow">masculino</span>
          <h2>Gerações e topo geral</h2>
        </div>
        <p>${rankingsMasculinos.length} rankings disponíveis</p>
      </div>

      <div class="ranking-grid ranking-grid--masculino">
        ${rankingsMasculinos.map((ranking) => cardRanking(ranking)).join("")}
      </div>
    </section>

    ${rankingFeminino ? `
      <section class="ranking-group ranking-group--feminino">
        <div class="ranking-feature">
          <div class="ranking-feature__copy">
            <span class="ranking-group__eyebrow">feminino</span>
            <h2>Top 20 feminino</h2>
            <p>O ranking feminino ganha um bloco próprio para ficar claro na navegação e valorizar a lista como uma editoria separada.</p>
            <a class="ranking-feature__link" href="${rankingFeminino.pagina}">ver ranking completo</a>
          </div>
          <a class="ranking-feature__media" href="${rankingFeminino.pagina}" aria-label="${rankingFeminino.titulo}">
            ${rankingFeminino.imagem
              ? `<img src="${rankingFeminino.imagem}" alt="${rankingFeminino.titulo || "Ranking feminino"}" loading="lazy" onerror="this.remove()" />`
              : `<div class="ranking-card-page__placeholder" aria-hidden="true"></div>`}
            <div>
              <span>${rankingFeminino.total} jogadoras</span>
              <strong>${rankingFeminino.titulo}</strong>
            </div>
          </a>
        </div>
      </section>
    ` : ""}
  `;
}

function cardRanking(ranking) {
  const subtitulo = ranking.slug === "t25m" ? "top 25 masculino" : `classe ${ranking.slug}`;

  return `
    <a class="ranking-card-page" href="${ranking.pagina}">
      <div class="ranking-card-page__image">
        ${ranking.imagem
          ? `<img src="${ranking.imagem}" alt="${ranking.titulo || "Ranking"}" loading="lazy" onerror="this.remove()" />`
          : `<div class="ranking-card-page__placeholder" aria-hidden="true"></div>`}
      </div>
      <div class="ranking-card-page__content">
        <span>${subtitulo}</span>
        <h3>${ranking.titulo}</h3>
        <p>${ranking.total} jogadores</p>
      </div>
    </a>
  `;
}

async function iniciarFonteRankings() {
  if (!document.querySelector("#rankings-grid")) return;

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
    console.warn("Não foi possível carregar rankings do Sanity. Usando dados locais.", erro);
    renderRankingsPage();
  }
}

iniciarFonteRankings();
