(function () {
  const state = {
    search: "",
    round: "",
    time: "",
    status: "",
    sort: "rank"
  };
  const draftYear = window.T3DraftArea?.year || "2026";

  let reviewData = null;

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeColor(value = "") {
    return /^#[0-9a-f]{3,8}$/i.test(String(value).trim())
      ? String(value).trim()
      : "var(--laranja)";
  }

  function slugify(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatDate(value) {
    if (!value) return `Draft ${draftYear}`;
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return `Draft ${draftYear}`;
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function fact(label, value) {
    if (!value) return "";
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function playerImage(prospecto = {}) {
    if (prospecto.foto) {
      return `<img src="${escapeHtml(prospecto.foto)}" alt="${escapeHtml(prospecto.fotoAlt || prospecto.nome || "Prospecto")}" loading="eager" decoding="async" data-review-image data-review-fallback="${escapeHtml(initials(prospecto.nome || "?"))}" />`;
    }
    return `<div class="draft-review-pick__placeholder">${escapeHtml(initials(prospecto.nome || "?"))}</div>`;
  }

  function initials(value = "?") {
    return String(value || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("");
  }

  function teamLogo(time = {}) {
    if (time.logo) {
      return `<img src="${escapeHtml(time.logo)}" alt="${escapeHtml(time.logoAlt || `Logo ${time.nome || time.sigla || "franquia"}`)}" loading="eager" decoding="async" data-review-image data-review-fallback="${escapeHtml(time.sigla || "NBA")}" />`;
    }
    return `<strong>${escapeHtml(time.sigla || "NBA")}</strong>`;
  }

  function notaDaEscolha(item = {}) {
    const vereditoCurto = String(item.chamada || "").trim();
    const notaMatch = vereditoCurto.match(/^(\d{1,2}(?:[,.]\d)?)(?:\s*\/\s*10)?$/);
    if (notaMatch) {
      return escapeHtml(notaMatch[1]);
    }
    if (/^(?:[A-F][+-]?|S\/N)$/i.test(vereditoCurto)) {
      return escapeHtml(vereditoCurto);
    }
    if (item.nota === 0) return "0";
    return escapeHtml(item.nota || "10");
  }

  function textoDoPitaco(item = {}) {
    return escapeHtml(item.opiniao || "A análise desta escolha será publicada em breve.");
  }

  function espelhoDoProspecto(prospecto = {}) {
    const value = prospecto.espelho || prospecto.resumo || "";
    return escapeHtml(String(value).replace(/^espelho:\s*/i, "").trim());
  }

  function alturaDoProspecto(prospecto = {}) {
    return [prospecto.altura, prospecto.alturaImperial].filter(Boolean).join(" / ");
  }

  function notaRealDaEscolha(item = {}) {
    if (item.nota === 0) return "0";
    const nota = String(item.nota || item.chamada || "").trim();
    return nota ? escapeHtml(nota) : "";
  }

  function renderHeroArtwork() {
    const artwork = document.querySelector("[data-draft-review-artwork]");
    if (!artwork) return;

    const prospects = (Array.isArray(reviewData?.escolhas) ? reviewData.escolhas : [])
      .map((item) => item.prospecto)
      .filter((prospecto) => prospecto?.foto)
      .slice(0, 4);

    artwork.hidden = prospects.length === 0;
    artwork.innerHTML = prospects.map((prospecto, index) => `
      <figure class="draft-review-hero__portrait draft-review-hero__portrait--${index + 1}">
        <img src="${escapeHtml(prospecto.foto)}" alt="${escapeHtml(prospecto.fotoAlt || prospecto.nome || "Prospecto do Draft")}" ${index === 0 ? 'loading="eager"' : 'loading="lazy"'} decoding="async" data-review-image data-review-fallback="${escapeHtml(initials(prospecto.nome || "?"))}" />
      </figure>
    `).join("");
  }

  function renderPick(item, index) {
    const time = item.time || {};
    const prospecto = item.prospecto || null;
    const confirmed = Boolean(prospecto && prospecto.nome);
    const number = String(item.numeroEscolha || index + 1).padStart(2, "0");
    const pickNumber = String(Number(item.numeroEscolha || index + 1) || item.numeroEscolha || index + 1);
    const prospectRank = String(prospecto?.rank || prospecto?.ranking || number).replace(/^#/, "");
    const color = safeColor(time.corPrimaria);
    const teamSlug = slugify(time.slug || time.nome || time.sigla);
    const round = escapeHtml(item.rodada || 1);
    const teamSigla = escapeHtml(time.sigla || "");
    const grade = notaRealDaEscolha(item);

    if (!confirmed) {
      return `
        <article class="draft-review-pick draft-review-pick--pending" style="--review-team-color:${color}" data-round="${round}" data-team="${teamSigla}" data-status="pending">
          <div class="draft-review-pick__number"><span>Escolha</span><strong>${number}</strong></div>
          <div class="draft-review-pick__team draft-review-pick__team--pending">
            <div class="draft-review-pick__team-logo">${teamLogo(time)}</div>
            <div>
              <span>no relógio</span>
              <h3>${escapeHtml(time.nome || "Franquia a definir")}</h3>
            </div>
          </div>
          <div class="draft-review-pick__waiting">
            <span>aguardando seleção</span>
            <p>O card será completado automaticamente quando o prospecto for escolhido no Studio.</p>
          </div>
        </article>
      `;
    }

    return `
      <article class="draft-review-pick draft-review-card" id="draft-review-card-${escapeHtml(teamSlug)}" style="--review-team-color:${color}" data-round="${round}" data-team="${teamSigla}" data-status="confirmed">
        <div class="draft-review-card__portrait-window">
          ${playerImage(prospecto)}
        </div>

        <div class="draft-review-card__content">
          <div class="draft-review-card__team-row">
            <div class="draft-review-card__team-copy">
              <h3>${escapeHtml(time.nome || "Franquia")}</h3>
              <p>com a escolha <strong>n&uacute;mero ${escapeHtml(pickNumber)}</strong>, seleciona:</p>
            </div>
            <div class="draft-review-card__logo-window">
              ${teamLogo(time)}
            </div>
          </div>

          <div class="draft-review-card__identity">
            <div class="draft-review-card__pick"><strong>#${escapeHtml(prospectRank)}</strong></div>
            <h3>${escapeHtml(prospecto.nome)}</h3>
            <div class="draft-review-card__meta">
              ${fact("posi\u00e7\u00e3o", prospecto.posicao)}
              ${fact("time", prospecto.time)}
              ${fact("altura", alturaDoProspecto(prospecto))}
              ${fact("idade", prospecto.idade)}
              ${fact("alcance", prospecto.alcance || prospecto.tier)}
            </div>
            <p class="draft-review-card__mirror"><strong>${espelhoDoProspecto(prospecto)}</strong></p>
          </div>

          <div class="draft-review-card__pitaco-copy">
            <div class="draft-review-card__analysis-header">
              <span class="draft-review-card__pitaco-label">Inspe\u00e7\u00e3o</span>
              ${grade ? `<span class="draft-review-card__score-label">Nota: <strong>${grade}</strong></span>` : ""}
            </div>
            <div class="draft-review-card__pitaco-text">
              <p>${textoDoPitaco(item)}</p>
            </div>
          </div>
        </div>
      </article>
    `;


  }
  function renderList() {
    const list = document.querySelector("#draft-review-list");
    const count = document.querySelector("#draft-review-count");
    if (!list || !count) return;

    const search = slugify(state.search);
    const picks = (Array.isArray(reviewData?.escolhas) ? reviewData.escolhas : [])
      .filter((item) => {
        const prospecto = item.prospecto || {};
        const time = item.time || {};
        const status = prospecto.nome ? "confirmed" : "pending";
        const searchable = slugify([
          prospecto.nome,
          prospecto.posicao,
          prospecto.espelho,
          time.nome,
          time.sigla,
          item.numeroEscolha
        ].filter(Boolean).join(" "));

        return (!search || searchable.includes(search))
          && (!state.round || String(item.rodada || "") === state.round)
          && (!state.time || time.sigla === state.time)
          && (!state.status || status === state.status);
      })
      .sort((a, b) => {
        if (state.sort === "team") {
          return String(a.time?.nome || "").localeCompare(String(b.time?.nome || ""), "pt-BR");
        }
        return (Number(a.numeroEscolha) || 999) - (Number(b.numeroEscolha) || 999);
      });

    count.textContent = `${picks.length} ${picks.length === 1 ? "escolha exibida" : "escolhas exibidas"}`;
    list.innerHTML = picks.length
      ? picks.map(renderPick).join("")
      : '<div class="draft-review-empty">Nenhuma escolha encontrada com esses filtros.</div>';

    const targetId = window.location.hash ? window.location.hash.slice(1) : "";
    if (targetId) {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: "center", inline: "nearest" });
      });
    }
  }

  function bindImageFallbacks() {
    const list = document.querySelector("#draft-review-list");
    if (!list || list.dataset.reviewFallbackBound === "true") return;
    list.dataset.reviewFallbackBound = "true";
    list.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.matches("[data-review-image]")) return;
      const fallback = image.dataset.reviewFallback || "NBA";
      const replacement = document.createElement("strong");
      replacement.className = "draft-review-image-fallback";
      replacement.textContent = fallback;
      image.replaceWith(replacement);
    }, true);
  }

  function renderHeader(source) {
    const title = "Inspeção do Draft";
    const intro = reviewData.introducao || "Bem-vindo ao Guia do Draft da NBA do Tabelado De 3, sua fonte de referência sobre basquete de base. Navegue entre o Big Board, com pitacos detalhados sobre mais de 80 jogadores por classe ou, se preferir, leia as inspeções de todas as escolhas realizadas na noite do draft - desse ano e dos anteriores também.";
    const titleElement = document.querySelector("#draft-review-title");
    const subtitleElement = document.querySelector("#draft-review-subtitle");

    if (titleElement) {
      titleElement.innerHTML = `INSPEÇÃO DO<br />DRAFT <span class="draft-review-hero__year" data-draft-hero-year>${escapeHtml(draftYear)}</span>`;
    }
    if (subtitleElement) {
      subtitleElement.textContent = intro;
    }
    document.title = `${title} ${draftYear} | Tabelado de 3`;
    renderHeroArtwork();
  }

  function fillTeamFilter() {
    const select = document.querySelector("#draft-review-team");
    if (!select) return;
    const teams = [...new Map(
      (reviewData.escolhas || [])
        .filter((item) => item.time?.sigla)
        .map((item) => [item.time.sigla, item.time])
    ).values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    select.innerHTML = '<option value="">todos</option>'
      + teams.map((team) => `<option value="${escapeHtml(team.sigla)}">${escapeHtml(team.nome)}</option>`).join("");
  }

  function bindControls() {
    document.querySelector("#draft-review-search")?.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-round")?.addEventListener("change", (event) => {
      state.round = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-team")?.addEventListener("change", (event) => {
      state.time = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-status")?.addEventListener("change", (event) => {
      state.status = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-sort")?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-clear")?.addEventListener("click", () => {
      Object.assign(state, { search: "", round: "", time: "", status: "", sort: "rank" });
      document.querySelector("#draft-review-search").value = "";
      document.querySelector("#draft-review-round").value = "";
      document.querySelector("#draft-review-team").value = "";
      document.querySelector("#draft-review-status").value = "";
      document.querySelector("#draft-review-sort").value = "rank";
      renderList();
    });
  }

  async function loadReview() {
    const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    let source = "Sanity";

    try {
      reviewData = await window.T3Sanity?.fetchDraftReview?.(draftYear);
    } catch (error) {
      console.warn("Não foi possível carregar a Inspeção do Sanity.", error);
    }

    if (!reviewData?.escolhas?.length && isLocal && draftYear === "2026") {
      reviewData = window.T3_DRAFT_REVIEW_FALLBACK;
      source = "prévia local";
    }

    if (!reviewData) {
      reviewData = {
        titulo: `Inspeção ${draftYear}`,
        subtitulo: "A cobertura escolha por escolha entra no ar em breve.",
        introducao: "",
        escolhas: []
      };
      source = "aguardando dados";
    }

    renderHeader(source);
    fillTeamFilter();
    bindControls();
    bindImageFallbacks();
    renderList();
    document.body.classList.add("draft-review-ready");
  }

  document.addEventListener("DOMContentLoaded", loadReview);
})();
