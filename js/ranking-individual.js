function slugRankingAtual() {
  const area = document.querySelector("#ranking-individual");
  const params = new URLSearchParams(window.location.search);
  return params.get("ranking") || area?.dataset.ranking || "t25m";
}

function renderRankingIndividual() {
  const area = document.querySelector("#ranking-individual");
  if (!area || typeof rankings === "undefined" || typeof rankingsDisponiveis === "undefined") return;

  const slug = slugRankingAtual();
  const meta = rankingsDisponiveis.find((item) => item.slug === slug);
  const jogadores = rankings
    .filter((jogador) => jogador.rankingSlug === slug)
    .sort((a, b) => a.ordem - b.ordem);
  if (!meta || jogadores.length === 0) return;

  document.title = `${meta.titulo} | Tabelado de 3`;
  const tipoRanking = slug === "t20f" ? "ranking feminino" : "ranking masculino";

  area.innerHTML = `
    <header class="ranking-detail__hero">
      <div class="ranking-detail__kicker">
        <span class="tag tag--red">${tipoRanking}</span>
        <span>${jogadores.length} nomes avaliados</span>
      </div>
      <h1>${meta.titulo}</h1>
      <p>Lista editorial do Tabelado de 3 com posi&ccedil;&atilde;o, perfil f&iacute;sico e contexto de clube/programa a partir da base limpa de rankings.</p>
    </header>

    <div class="ranking-detail__summary">
      <div>
        <strong>${jogadores[0].nome}</strong>
        <span>primeiro nome da lista</span>
      </div>
      <div>
        <strong>${contarCategorias(jogadores)}</strong>
        <span>perfis/posi&ccedil;&otilde;es mapeados</span>
      </div>
      <div>
        <strong>${contarCincoEstrelas(jogadores)}</strong>
        <span>nomes cinco estrelas</span>
      </div>
    </div>

    <section class="ranking-toolbar" aria-label="Filtros do ranking">
      <div>
        <span class="ranking-toolbar__label">filtrar por posi&ccedil;&atilde;o</span>
        <div class="ranking-filter" id="ranking-filtros-posicao">
          ${botoesFiltroPosicao(jogadores)}
        </div>
      </div>
      <strong id="ranking-contador">${jogadores.length} nomes</strong>
    </section>

    <section class="ranking-list" id="ranking-lista" aria-label="${meta.titulo}">
      ${renderRankingRows(jogadores)}
    </section>
  `;

  iniciarFiltroPosicoes(jogadores);
}

function renderRankingRows(jogadores) {
  return jogadores.map((jogador) => `
    <article class="ranking-row" data-posicao="${normalizarValor(jogador.categoria)}">
      <div class="ranking-row__position">${jogador.posicao}</div>
      <div class="ranking-row__main">
        <h2>${jogador.nome}</h2>
        <div class="ranking-row__stars" aria-label="${quantidadeEstrelas(jogador.estrelas)} de 5 estrelas">
          ${renderEstrelas(jogador.estrelas)}
        </div>
      </div>
      <div class="ranking-row__facts">
        ${dadoRanking("posi&ccedil;&atilde;o", jogador.categoria || "Em avalia&ccedil;&atilde;o")}
        ${dadoRanking("time/programa", jogador.time || "Em atualiza&ccedil;&atilde;o")}
        ${dadoRanking("altura/nascimento", jogador.bio2 || "Em atualiza&ccedil;&atilde;o")}
      </div>
    </article>
  `).join("");
}

function dadoRanking(label, valor) {
  return `
    <div class="ranking-row__fact">
      <span>${label}</span>
      <strong>${valor}</strong>
    </div>
  `;
}

function botoesFiltroPosicao(jogadores) {
  const posicoes = [...new Set(jogadores.map((jogador) => jogador.categoria).filter(Boolean))]
    .sort((a, b) => ordemPosicao(a) - ordemPosicao(b) || a.localeCompare(b));

  return `
    <button class="is-active" type="button" data-posicao="">todos</button>
    ${posicoes.map((posicao) => `
      <button type="button" data-posicao="${normalizarValor(posicao)}">${posicao}</button>
    `).join("")}
  `;
}

function iniciarFiltroPosicoes(jogadores) {
  const lista = document.querySelector("#ranking-lista");
  const contador = document.querySelector("#ranking-contador");
  const botoes = document.querySelectorAll("#ranking-filtros-posicao [data-posicao]");
  if (!lista || !contador || botoes.length === 0) return;

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const posicaoAtiva = botao.dataset.posicao;
      const filtrados = posicaoAtiva
        ? jogadores.filter((jogador) => normalizarValor(jogador.categoria) === posicaoAtiva)
        : jogadores;

      botoes.forEach((item) => item.classList.toggle("is-active", item === botao));
      lista.innerHTML = renderRankingRows(filtrados);
      contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? "nome" : "nomes"}`;
    });
  });
}

function renderEstrelas(estrelas) {
  const total = quantidadeEstrelas(estrelas);

  return Array.from({ length: 5 }, (_, index) => `
    <span class="${index < total ? "is-filled" : ""}" aria-hidden="true">★</span>
  `).join("");
}

function quantidadeEstrelas(estrelas = "") {
  return Math.min(5, (estrelas.match(/★/g) || []).length);
}

function contarCategorias(jogadores) {
  return new Set(jogadores.map((jogador) => jogador.categoria).filter(Boolean)).size;
}

function contarCincoEstrelas(jogadores) {
  return jogadores.filter((jogador) => quantidadeEstrelas(jogador.estrelas) === 5).length;
}

function normalizarValor(valor = "") {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ordemPosicao(posicao) {
  const ordem = ["armador", "armadora", "escolta", "lateral", "ala", "grande", "pivo"];
  const indice = ordem.indexOf(normalizarValor(posicao));
  return indice === -1 ? 99 : indice;
}

renderRankingIndividual();
