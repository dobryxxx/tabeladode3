(function () {
  const state = {
    time: ""
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
      return `<img src="${escapeHtml(prospecto.foto)}" alt="${escapeHtml(prospecto.fotoAlt || prospecto.nome || "Prospecto")}" loading="lazy" />`;
    }
    const initials = String(prospecto.nome || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("");
    return `<div class="draft-review-pick__placeholder">${escapeHtml(initials)}</div>`;
  }

  function teamLogo(time = {}) {
    if (time.logo) {
      return `<img src="${escapeHtml(time.logo)}" alt="${escapeHtml(time.logoAlt || `Logo ${time.nome || time.sigla || "franquia"}`)}" loading="lazy" />`;
    }
    return `<strong>${escapeHtml(time.sigla || "NBA")}</strong>`;
  }

  function renderPick(item, index) {
    const time = item.time || {};
    const prospecto = item.prospecto || null;
    const confirmed = Boolean(prospecto && prospecto.nome);
    const number = String(item.numeroEscolha || index + 1).padStart(2, "0");
    const color = safeColor(time.corPrimaria);

    if (!confirmed) {
      return `
        <article class="draft-review-pick draft-review-pick--pending" style="--review-team-color:${color}" data-round="${item.rodada || 1}" data-team="${escapeHtml(time.sigla || "")}" data-status="pending">
          <div class="draft-review-pick__number"><span>escolha</span><strong>${number}</strong></div>
          <div class="draft-review-pick__team draft-review-pick__team--pending">
            <div class="draft-review-pick__team-logo">${teamLogo(time)}</div>
            <div>
              <span>no relógio</span>
              <h2>${escapeHtml(time.nome || "Franquia a definir")}</h2>
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
      <article class="draft-review-pick" style="--review-team-color:${color}" data-round="${item.rodada || 1}" data-team="${escapeHtml(time.sigla || "")}" data-status="confirmed">
        <div class="draft-review-pick__number"><span>escolha</span><strong>${number}</strong></div>
        <header class="draft-review-pick__team">
          <div class="draft-review-pick__team-logo">${teamLogo(time)}</div>
          <div>
            <span>${escapeHtml(time.sigla || "NBA")} seleciona</span>
            <h2>${escapeHtml(time.nome || "Franquia")}</h2>
          </div>
          <div class="draft-review-pick__team-watermark" aria-hidden="true">${teamLogo(time)}</div>
        </header>
        <div class="draft-review-pick__player">
          <div class="draft-review-pick__portrait">
            ${playerImage(prospecto)}
            <div class="draft-review-pick__logo-badge">${teamLogo(time)}</div>
          </div>
          <div class="draft-review-pick__identity">
            <span>${escapeHtml(prospecto.posicao || "Prospecto")} · ${escapeHtml(prospecto.time || "Draft 2026")}</span>
            <h3>${escapeHtml(prospecto.nome)}</h3>
            <p>${prospecto.espelho ? `Espelho: ${escapeHtml(prospecto.espelho)}` : escapeHtml(prospecto.resumo || "")}</p>
            <div class="draft-review-pick__facts">
              ${fact("idade", prospecto.idade)}
              ${fact("altura", [prospecto.altura, prospecto.alturaImperial].filter(Boolean).join(" / "))}
              ${fact("peso", prospecto.peso)}
              ${fact("board T3", prospecto.rankingGeral ? `${prospecto.rankingGeral}` : "")}
            </div>
          </div>
        </div>
        <div class="draft-review-pick__editorial">
          <span class="draft-review-pick__editorial-label">o pitaco</span>
          <h4>${escapeHtml(item.chamada || "Review em atualizacao")}</h4>
          <p>${escapeHtml(item.opiniao || "A análise desta escolha será publicada em breve.")}</p>
        </div>
      </article>
    `;
  }

  function filteredPicks() {
    const picks = Array.isArray(reviewData?.escolhas) ? reviewData.escolhas : [];
    return picks.filter((item) => {
      return !state.time || item.time?.sigla === state.time;
    });
  }

  function renderList() {
    const list = document.querySelector("#draft-review-list");
    const count = document.querySelector("#draft-review-count");
    if (!list || !count) return;

    const picks = filteredPicks();
    count.textContent = `${picks.length} ${picks.length === 1 ? "escolha exibida" : "escolhas exibidas"}`;
    list.innerHTML = picks.length
      ? picks.map(renderPick).join("")
      : '<div class="draft-review-empty">Nenhuma escolha encontrada com esses filtros.</div>';
  }

  function renderHeader(source) {
    document.querySelector("#draft-review-title").textContent = reviewData.titulo || "Review do Draft";
    document.querySelector("#draft-review-subtitle").textContent = reviewData.subtitulo || "Cada escolha, um pitaco.";
    document.querySelector("#draft-review-intro").textContent = reviewData.introducao || "";
    document.querySelector("#draft-review-date").textContent = formatDate(reviewData.dataDraft);

    const picks = Array.isArray(reviewData.escolhas) ? reviewData.escolhas : [];
    const confirmed = picks.filter((item) => item.prospecto?.nome).length;
    const pending = picks.length - confirmed;
    document.querySelector("#draft-review-progress").innerHTML = `
      <div><strong>${confirmed}</strong><span>analisadas</span></div>
      <div><strong>${pending}</strong><span>no relógio</span></div>
      <div><strong>${picks.length}</strong><span>escolhas</span></div>
    `;

    const sourceLabel = document.querySelector("#draft-review-source");
    if (sourceLabel) sourceLabel.textContent = source;
  }

  function fillTeamFilter() {
    const select = document.querySelector("#draft-review-team");
    if (!select) return;
    const teams = [...new Map(
      (reviewData.escolhas || [])
        .filter((item) => item.time?.sigla)
        .map((item) => [item.time.sigla, item.time])
    ).values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    select.innerHTML = '<option value="">todas as franquias</option>'
      + teams.map((team) => `<option value="${escapeHtml(team.sigla)}">${escapeHtml(team.nome)}</option>`).join("");
  }

  function bindControls() {
    document.querySelector("#draft-review-team")?.addEventListener("change", (event) => {
      state.time = event.target.value;
      renderList();
    });

    document.querySelector("#draft-review-clear")?.addEventListener("click", () => {
      state.time = "";
      document.querySelector("#draft-review-team").value = "";
      renderList();
    });
  }

  async function loadReview() {
    const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    let source = "Sanity";

    try {
      reviewData = await window.T3Sanity?.fetchDraftReview?.(draftYear);
    } catch (error) {
      console.warn("Não foi possível carregar a Review do Draft do Sanity.", error);
    }

    if (!reviewData?.escolhas?.length && isLocal && draftYear === "2026") {
      reviewData = window.T3_DRAFT_REVIEW_FALLBACK;
      source = "prévia local";
    }

    if (!reviewData) {
      reviewData = {
        titulo: `Review do Draft ${draftYear}`,
        subtitulo: "A cobertura escolha por escolha entra no ar em breve.",
        introducao: "",
        escolhas: []
      };
      source = "aguardando dados";
    }

    renderHeader(source);
    fillTeamFilter();
    bindControls();
    renderList();
    document.body.classList.add("draft-review-ready");
  }

  document.addEventListener("DOMContentLoaded", loadReview);
})();
