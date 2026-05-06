const draftState = {
  search: "",
  position: "",
  team: "",
  range: "",
  sort: "rank"
};

function normalizarDraft(valor = "") {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iniciais(nome = "") {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("");
}

function dataCurta(valor) {
  if (!valor) return "sem data";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "sem data";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function opcoesUnicas(campo) {
  return [...new Set(draftProspects.map((item) => item[campo]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function preencherSelect(id, label, opcoes) {
  const select = document.querySelector(id);
  if (!select) return;
  select.innerHTML = `<option value="">${label}</option>${opcoes.map((opcao) => `<option value="${opcao}">${opcao}</option>`).join("")}`;
}

function renderDraftStats() {
  const area = document.querySelector("#draft-guide-stats");
  if (!area || typeof draftProspects === "undefined") return;

  const total = draftProspects.length;
  const posicoes = opcoesUnicas("posicao").length;
  const times = opcoesUnicas("time").length;
  const ultimaAtualizacao = draftProspects
    .map((item) => item.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  area.innerHTML = `
    <div><strong>${total}</strong><span>prospects</span></div>
    <div><strong>${posicoes}</strong><span>posições</span></div>
    <div><strong>${times}</strong><span>times/ligas</span></div>
    <div><strong>${dataCurta(ultimaAtualizacao)}</strong><span>atualização</span></div>
  `;
}

function fotoOuPlaceholder(prospect, classe = "") {
  if (prospect.foto) {
    return `<img class="${classe}" src="${prospect.foto}" alt="${prospect.nome}" loading="lazy" />`;
  }

  return `
    <div class="${classe} draft-prospect-card__placeholder" aria-label="Sem foto de ${prospect.nome}">
      <span>${iniciais(prospect.nome)}</span>
    </div>
  `;
}

function renderFeatured() {
  const area = document.querySelector("#draft-featured");
  if (!area) return;

  area.innerHTML = draftProspects.slice(0, 3).map((prospect) => `
    <article class="draft-feature-card">
      <div class="draft-feature-card__rank">#${prospect.rank}</div>
      <div class="draft-feature-card__photo">${fotoOuPlaceholder(prospect, "draft-feature-card__img")}</div>
      <div class="draft-feature-card__body">
        <span>${prospect.posicao || "prospect"}</span>
        <h3>${prospect.nome}</h3>
        <p>${prospect.time || prospect.bio || "Contexto em atualização"}</p>
      </div>
    </article>
  `).join("");
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
    && (!draftState.range || prospect.alcance === draftState.range);
}

function ordenarProspects(lista) {
  return [...lista].sort((a, b) => {
    if (draftState.sort === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (draftState.sort === "posicao") return (a.posicao || "").localeCompare(b.posicao || "", "pt-BR") || a.rank - b.rank;
    return a.rank - b.rank;
  });
}

function dadoDraft(label, valor) {
  return valor ? `<div><span>${label}</span><strong>${valor}</strong></div>` : "";
}

function renderProspectCard(prospect) {
  const detalhes = [
    ["Arquétipo ofensivo", prospect.arquetipoOfensivo],
    ["Arquétipo defensivo", prospect.arquetipoDefensivo],
    ["Por que vale uma escolha?", prospect.motivoEscolha],
    ["Chave para desenvolvimento", prospect.chaveDesenvolvimento],
    ["Teto vs piso", prospect.tetoPiso],
    ["Espelho", prospect.espelho]
  ].filter(([, valor]) => valor);

  return `
    <article class="draft-prospect-card" data-draft-card>
      <div class="draft-prospect-card__rank">#${prospect.rank}</div>
      <div class="draft-prospect-card__photo">
        ${fotoOuPlaceholder(prospect, "draft-prospect-card__img")}
      </div>
      <div class="draft-prospect-card__content">
        <div class="draft-prospect-card__eyebrow">
          <span>${prospect.posicao || "posição em aberto"}</span>
          ${prospect.alcance ? `<span>${prospect.alcance}</span>` : ""}
          ${prospect.status ? `<span>${prospect.status}</span>` : ""}
        </div>
        <h2>${prospect.nome}</h2>
        <p>${prospect.espelho ? `Espelho: ${prospect.espelho}` : prospect.bio || "Perfil em atualização."}</p>
        <div class="draft-prospect-card__meta">
          ${dadoDraft("time/liga", prospect.time)}
          ${dadoDraft("altura", [prospect.altura, prospect.alturaImperial].filter(Boolean).join(" / "))}
          ${dadoDraft("idade", prospect.idade)}
        </div>
      </div>
      <div class="draft-prospect-card__aside">
        ${prospect.tetoPiso ? `<div><span>teto/piso</span><strong>${prospect.tetoPiso}</strong></div>` : ""}
        <button type="button" class="draft-prospect-card__toggle" ${detalhes.length ? "" : "disabled"}>ver perfil</button>
      </div>
      <div class="draft-prospect-card__details">
        ${detalhes.length ? detalhes.map(([label, valor]) => `
          <div>
            <span>${label}</span>
            <p>${valor}</p>
          </div>
        `).join("") : "<p>Sem detalhes adicionais no CSV.</p>"}
      </div>
    </article>
  `;
}

function renderDraftList() {
  const lista = document.querySelector("#draft-list");
  const contador = document.querySelector("#draft-count");
  if (!lista || !contador) return;

  const filtrados = ordenarProspects(draftProspects.filter(prospectCombina));
  contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? "prospect encontrado" : "prospects encontrados"}`;

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="draft-empty-state">Nenhum prospect encontrado com esses filtros.</div>';
    return;
  }

  lista.innerHTML = filtrados.map(renderProspectCard).join("");
  lista.querySelectorAll(".draft-prospect-card__toggle").forEach((botao) => {
    botao.addEventListener("click", () => {
      const card = botao.closest("[data-draft-card]");
      card.classList.toggle("draft-prospect-card--expanded");
      botao.textContent = card.classList.contains("draft-prospect-card--expanded") ? "fechar perfil" : "ver perfil";
    });
  });
}

function debounce(fn, delay = 160) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function iniciarDraftGuide() {
  if (typeof draftProspects === "undefined") return;

  preencherSelect("#draft-position", "todas", opcoesUnicas("posicao"));
  preencherSelect("#draft-team", "todos", opcoesUnicas("time"));
  preencherSelect("#draft-range", "todos", opcoesUnicas("alcance"));

  renderDraftStats();
  renderFeatured();
  renderDraftList();

  const busca = document.querySelector("#draft-search");
  const posicao = document.querySelector("#draft-position");
  const time = document.querySelector("#draft-team");
  const alcance = document.querySelector("#draft-range");
  const ordenacao = document.querySelector("#draft-sort");
  const limpar = document.querySelector("#draft-clear");
  const atualizarBusca = debounce(() => {
    draftState.search = busca.value;
    renderDraftList();
  });

  busca?.addEventListener("input", atualizarBusca);
  posicao?.addEventListener("change", () => { draftState.position = posicao.value; renderDraftList(); });
  time?.addEventListener("change", () => { draftState.team = time.value; renderDraftList(); });
  alcance?.addEventListener("change", () => { draftState.range = alcance.value; renderDraftList(); });
  ordenacao?.addEventListener("change", () => { draftState.sort = ordenacao.value; renderDraftList(); });
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

iniciarDraftGuide();
