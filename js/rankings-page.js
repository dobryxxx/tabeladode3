function renderRankingsPage() {
  const area = document.querySelector("#rankings-grid");
  if (!area || typeof rankingsDisponiveis === "undefined") return;

  const rankingFeminino = rankingsDisponiveis.find((ranking) => ranking.slug === "t20f");
  const rankingsMasculinos = rankingsDisponiveis.filter((ranking) => ranking.slug !== "t20f");

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
            <img src="${rankingFeminino.imagem}" alt="${rankingFeminino.titulo}" />
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
        <img src="${ranking.imagem}" alt="${ranking.titulo}" />
      </div>
      <div class="ranking-card-page__content">
        <span>${subtitulo}</span>
        <h3>${ranking.titulo}</h3>
        <p>${ranking.total} jogadores</p>
      </div>
    </a>
  `;
}

renderRankingsPage();
