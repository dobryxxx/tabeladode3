let rankingSanityAtual = null;

function slugRankingAtual() {
  const area = document.querySelector("#ranking-individual");
  const params = new URLSearchParams(window.location.search);
  return params.get("ranking") || area?.dataset.ranking || "t25m";
}

function dadosRankingAtual() {
  if (rankingSanityAtual) {
    return {
      meta: {
        slug: rankingSanityAtual.slug,
        titulo: rankingSanityAtual.titulo,
        descricao: rankingSanityAtual.descricao,
        imagem: rankingSanityAtual.imagem,
        imagemAlt: rankingSanityAtual.imagemAlt,
        categoria: rankingSanityAtual.categoria
      },
      jogadores: (rankingSanityAtual.itens || [])
        .map((item) => ({
          ...item,
          posicaoRanking: item.posicao,
          ordem: item.ordem || item.posicao || 999,
          avaliacao: item.nota ?? item.tier ?? null
        }))
        .sort((a, b) => a.ordem - b.ordem)
    };
  }

  if (typeof rankings === "undefined" || typeof rankingsDisponiveis === "undefined") {
    return {meta: null, jogadores: []};
  }

  const slug = slugRankingAtual();
  return {
    meta: rankingsDisponiveis.find((item) => item.slug === slug),
    jogadores: rankings
      .filter((jogador) => jogador.rankingSlug === slug)
      .map((jogador) => ({
        ...jogador,
        posicaoRanking: jogador.posicao,
        avaliacao: jogador.estrelas || null
      }))
      .sort((a, b) => a.ordem - b.ordem)
  };
}

function renderRankingIndividual() {
  const area = document.querySelector("#ranking-individual");
  if (!area) return;

  const slug = slugRankingAtual();
  const {meta, jogadores} = dadosRankingAtual();
  if (!meta || jogadores.length === 0) return;

  document.title = `${textoSeguro(meta.titulo)} | Tabelado de 3`;

  const rotulo = rotuloRanking(meta, slug);
  const descricao = meta.descricao || "Listagem editorial do Tabelado de 3 que apresenta, para cada jogador, posi&ccedil;&atilde;o, atributos f&iacute;sicos (altura, envergadura, etc.) e contexto institucional (clube ou programa universit&aacute;rio), consumindo dados da base de rankings j&aacute; normalizada.";
  const genero = generoRanking(meta, slug);
  const retorno = `rankings.html?genero=${encodeURIComponent(genero)}`;
  const imagem = meta.imagem || "";
  const altImagem = meta.imagemAlt || `${meta.titulo || "Ranking"} - arte da gera&ccedil;&atilde;o`;

  area.innerHTML = `
    <div class="ranking-detail-page">
      <a class="ranking-detail-back" href="${retorno}" aria-label="Voltar para rankings">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>

      <header class="ranking-detail-hero">
        <div class="ranking-detail-hero__content">
          <h1 class="ranking-detail-hero__title">
            <span>Ranking</span>
            <span class="ranking-detail-hero__year">${escapeHtml(rotulo)}</span>
          </h1>
          <p class="ranking-detail-hero__description">${descricao}</p>
        </div>
        ${imagem ? `
          <figure class="ranking-detail-hero__artwork">
            <img src="${escapeHtml(imagem)}" alt="${escapeHtml(altImagem)}" />
          </figure>
        ` : ""}
      </header>

      <ol class="ranking-detail-list" aria-label="${escapeHtml(meta.titulo || "Ranking")}">
        ${renderRankingRows(jogadores)}
      </ol>
    </div>
  `;
}

function renderRankingRows(jogadores) {
  return jogadores.map((jogador, index) => {
    const ranking = formatarPosicaoRanking(jogador.posicaoRanking || jogador.ordem || index + 1);
    const instituicao = separarInstituicao(jogador.time);
    const medidas = separarMedidas(jogador.bio2);
    const avaliacao = quantidadeEstrelas(jogador.avaliacao);

    return `
      <li class="ranking-athlete-row">
        <div class="ranking-athlete-row__rank">${escapeHtml(ranking)}</div>
        <div class="ranking-athlete-row__identity">
          <h2 class="ranking-athlete-row__name">${escapeHtml(jogador.nome || "")}</h2>
          ${avaliacao > 0 ? renderEstrelas(avaliacao) : ""}
        </div>
        <div class="ranking-athlete-row__meta-grid">
          ${jogador.categoria ? blocoMetaRanking("Posi&ccedil;&atilde;o", jogador.categoria) : ""}
          ${instituicao.principal ? blocoMetaRanking("Institui&ccedil;&atilde;o", instituicao.principal, instituicao.contexto) : ""}
          ${(medidas.altura || medidas.data) ? blocoMetaRanking("Medidas", medidas.altura, medidas.data) : ""}
        </div>
      </li>
    `;
  }).join("");
}

function blocoMetaRanking(label, principal, secundario = "") {
  return `
    <div class="ranking-athlete-row__meta" aria-label="${escapeHtml(textoSeguro(label))}">
      <span class="ranking-athlete-row__meta-label">${label}</span>
      ${principal ? `<strong>${escapeHtml(principal)}</strong>` : ""}
      ${secundario ? `<span class="ranking-athlete-row__meta-secondary">${escapeHtml(secundario)}</span>` : ""}
    </div>
  `;
}

function renderEstrelas(total) {
  return `
    <div class="ranking-athlete-row__stars" aria-label="Avalia&ccedil;&atilde;o: ${total} de 5">
      ${Array.from({ length: 5 }, (_, index) => `
        <svg class="${index < total ? "is-filled" : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 2.6l2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.2l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.6z"/>
        </svg>
      `).join("")}
    </div>
  `;
}

function quantidadeEstrelas(valor = "") {
  if (typeof valor === "number") return Math.max(0, Math.min(5, Math.round(valor)));
  if (typeof valor !== "string") return 0;

  const texto = valor.trim();
  const numero = Number(texto.replace(",", "."));
  if (Number.isFinite(numero) && numero > 0) return Math.max(0, Math.min(5, Math.round(numero)));

  const estrelasUnicode = (texto.match(/★/g) || []).length;
  const estrelasMojibake = (texto.match(/★/g) || []).length;
  return Math.min(5, estrelasUnicode + estrelasMojibake);
}

function formatarPosicaoRanking(posicao) {
  const numero = Number(String(posicao).replace(/\D+/g, ""));
  if (!Number.isFinite(numero) || numero <= 0) return textoSeguro(posicao);
  return String(numero).padStart(2, "0");
}

function separarInstituicao(valor = "") {
  const texto = textoSeguro(valor);
  const match = texto.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!match) return {principal: texto, contexto: ""};
  return {
    principal: match[1].trim(),
    contexto: `(${match[2].trim()})`
  };
}

function separarMedidas(valor = "") {
  const partes = textoSeguro(valor).split("|").map((parte) => parte.trim()).filter(Boolean);
  const altura = partes.slice(0, 2).join(" / ").replace(/m\b/i, "").replace(".", ",");
  const data = partes.slice(2).join(" / ");
  return {altura, data};
}

function rotuloRanking(meta, slug) {
  const origem = `${meta?.titulo || ""} ${slug || ""}`;
  const ano = origem.match(/\b(20\d{2})\b/);
  if (ano) return ano[1];
  const entreColchetes = (meta?.titulo || "").match(/\[([^\]]+)\]/);
  return (entreColchetes?.[1] || slug || "ranking").toUpperCase();
}

function generoRanking(meta, slug) {
  const categoria = textoSeguro(meta?.categoria).toLowerCase();
  if (slug === "t20f" || categoria.includes("feminino")) return "feminino";
  return "masculino";
}

function textoSeguro(valor = "") {
  return String(valor ?? "");
}

function escapeHtml(valor = "") {
  return textoSeguro(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function carregarRankingSanity() {
  if (!window.T3Sanity?.enabled || !document.querySelector("#ranking-individual")) return;

  try {
    const dados = await window.T3Sanity.fetchRankingBySlug(slugRankingAtual());
    if (!dados) return;
    rankingSanityAtual = dados;
    renderRankingIndividual();
  } catch (erro) {
    console.warn("Nao foi possivel carregar ranking do Sanity. Usando dados locais.", erro);
  }
}

async function iniciarRankingIndividual() {
  if (!document.querySelector("#ranking-individual")) return;

  if (window.T3SiteVisibilityReady) {
    await window.T3SiteVisibilityReady;
  }

  if (window.T3SiteVisibility?.isRankingsVisible?.() === false) {
    window.T3SiteVisibility.showRankingsUnavailable?.();
    return;
  }

  renderRankingIndividual();
  await carregarRankingSanity();
}

iniciarRankingIndividual();
