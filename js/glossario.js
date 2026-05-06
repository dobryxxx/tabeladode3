const glossario = [
  { termo: "Armador (1)", definicao: "Referencias: Trae Young, Chris Paul e Yago Mateus.", categoria: "Posicoes", nivel: "basico", tags: ["funcao", "criacao", "iniciacao"], nota: "Um time pode jogar com dois armadores.", destaque: true },
  { termo: "Escolta (1/2)", definicao: "Referencias: Kyrie Irving, Devin Booker e Georginho de Paula.", categoria: "Posicoes", nivel: "basico", tags: ["perimetro", "pontuacao"] },
  { termo: "Lateral (2/3)", definicao: "Referencias: Klay Thompson, Anthony Edwards e Didi Louzada.", categoria: "Posicoes", nivel: "basico", tags: ["alas", "perimetro", "3&D"] },
  { termo: "Ala (3/4)", definicao: "Referencias: Kevin Durant, Jayson Tatum e Samis Calderon.", categoria: "Posicoes", nivel: "basico", tags: ["versatilidade", "tamanho"] },
  { termo: "Grande (5)", definicao: "Referencias: Nikola Jokic, Rudy Gobert e Bruno Caboclo.", categoria: "Posicoes", nivel: "basico", tags: ["pivo", "garrafao", "altura"], nota: "Um time pode jogar com dois grandes.", destaque: true },
  { termo: "Ameaca dupla no Pick", definicao: "Capacidade de fazer o Pick e rolar para o aro (Pick and Roll), ou bater o bloqueio e abrir pra 3PT (Pick and Pop).", categoria: "Taticas", nivel: "avancado", tags: ["pick", "PnR", "PnP", "leitura"], destaque: true },
  { termo: "Apoios", definicao: "Ajuda defensiva.", categoria: "Defesa", nivel: "basico", tags: ["ajuda", "rotacao"] },
  { termo: "Bumerangue", definicao: "Jogador A passa pra B, que devolve imediatamente pra A, resetando o drible.", categoria: "Ataque", nivel: "intermediario", tags: ["passe", "ritmo", "reset"] },
  { termo: "C&S", definicao: "Catch and Shoot, fundamento de receber um passe e arremessar sem necessidade do drible.", categoria: "Arremessos", nivel: "basico", tags: ["catch and shoot", "3PT", "fundamento"], destaque: true },
  { termo: "Cadeado ou Parador", definicao: "Defensor que tem vantagem no ponto de ataque.", categoria: "Defesa", nivel: "intermediario", tags: ["ponto de ataque", "marcacao"] },
  { termo: "Canivete ofensivo ou defensivo", definicao: "Jogador capaz de servir diversas funcoes, segundo o sistema.", categoria: "Draft/Scouting", nivel: "intermediario", tags: ["versatilidade", "funcao", "sistema"] },
  { termo: "Catch-ataque", definicao: "Capacidade de atacar imediatamente apos receber um passe.", categoria: "Ataque", nivel: "intermediario", tags: ["drive", "vantagem", "decisao"] },
  { termo: "Cesteiro", definicao: "Jogador especialista em fazer cesta, principalmente criando seu arremesso.", categoria: "Ataque", nivel: "basico", tags: ["pontuacao", "criacao", "arremesso"] },
  { termo: "Closeout", definicao: "Acao defensiva no basquete em que um defensor fecha rapidamente o espaco aberto na quadra entre ele e um atacante com a bola. Geralmente para limitar ou impedir um arremesso livre, ou drive.", categoria: "Defesa", nivel: "intermediario", tags: ["contestacao", "perimetro", "drive"], destaque: true },
  { termo: "Corrida do grande", definicao: "Quando o grande corre a quadra pressionando o aro sem a bola.", categoria: "Ataque", nivel: "intermediario", tags: ["transicao", "garrafao", "pressao de aro"] },
  { termo: "Defensor posicional", definicao: "Jogador com ferramentas fisicas e tecnicas pra defender o atacante da sua posicao, mas nao oferece versatilidade alem.", categoria: "Defesa", nivel: "intermediario", tags: ["marcacao", "posicao", "scouting"] },
  { termo: "Defesa no espaco", definicao: "Capacidade de defender em situacao de 1v1 sem ajudas, ou na transicao.", categoria: "Defesa", nivel: "avancado", tags: ["1v1", "transicao", "perimetro"] },
  { termo: "Drive", definicao: "Acao de ir de fora do garrafao pra dentro do garrafao, de forma dinamica com a bola.", categoria: "Ataque", nivel: "basico", tags: ["infiltracao", "bola", "garrafao"], destaque: true },
  { termo: "Espacador posicional", definicao: "Jogador que espaca a quadra cumprindo sua posicao.", categoria: "Taticas", nivel: "intermediario", tags: ["spacing", "ataque", "posicionamento"] },
  { termo: "Facilitacao", definicao: "Capacidade de criar jogadas para companheiros de equipe com a bola.", categoria: "Ataque", nivel: "intermediario", tags: ["criacao", "passe", "playmaking"] },
  { termo: "Gaiola", definicao: "Um drible onde o jogador ofensivo trabalha para manter um defensor nas suas costas, nao permitindo que ele volte a posicao normal de defesa.", categoria: "Termos avancados", nivel: "avancado", tags: ["drible", "vantagem", "manipulacao"] },
  { termo: "Gatilho", definicao: "Jogador que arremessa de forma certeira e rapida.", categoria: "Arremessos", nivel: "basico", tags: ["arremesso", "rapidez", "3PT"] },
  { termo: "Iniciador ofensivo", definicao: "Jogador responsavel por comecar o ataque com a bola.", categoria: "Ataque", nivel: "basico", tags: ["criador", "bola", "posse"] },
  { termo: "LL", definicao: "Lance Livre.", categoria: "Regras", nivel: "basico", tags: ["lance livre", "pontuacao"] },
  { termo: "MIG", definicao: "Most Important Guy, o defensor mais proximo da linha de fundo e do aro, no lado fraco. Responsavel por fornecer a camada mais importante da ajuda.", categoria: "Defesa", nivel: "avancado", tags: ["lado fraco", "ajuda", "rotacao"] },
  { termo: "Molhar o pe", definicao: "Pisar no garrafao, com ou sem a bola.", categoria: "Ataque", nivel: "intermediario", tags: ["garrafao", "vantagem", "drive"] },
  { termo: "Motor", definicao: "O quanto um jogador se esforca em quadra. Ex.: O motor defensivo de Dennis Rodman e maior que o motor defensivo de Luka Doncic.", categoria: "Draft/Scouting", nivel: "basico", tags: ["energia", "esforco", "intensidade"] },
  { termo: "PdA", definicao: "Ponto de Ataque, posicao onde o atacante esta com a bola.", categoria: "Defesa", nivel: "intermediario", tags: ["ponto de ataque", "bola", "marcacao"] },
  { termo: "Pick", definicao: "Acao ofensiva quando ha um bloqueio na bola.", categoria: "Taticas", nivel: "basico", tags: ["bloqueio", "PnR", "PnP"], destaque: true },
  { termo: "Piso", definicao: "Curva de desenvolvimento mais baixa de um jogador.", categoria: "Draft/Scouting", nivel: "intermediario", tags: ["projecao", "potencial", "scouting"] },
  { termo: "Playmaker", definicao: "Jogador com acoes em quadra que impactam a sumula. Um Playmaker ofensivo gera assistencias ou pontos, enquanto um Playmaker defensivo gera roubos de bola e tocos.", categoria: "Termos avancados", nivel: "intermediario", tags: ["criacao", "impacto", "sumula"] },
  { termo: "PnP", definicao: "Pick and Pop. Um bloqueio no defensor do jogador que esta marcando a bola, onde o bloqueador abre pra a linha de 3PT espacando a quadra.", categoria: "Taticas", nivel: "intermediario", tags: ["pick and pop", "3PT", "spacing"] },
  { termo: "PnR", definicao: "Pick and Roll. Um bloqueio no defensor do jogador que esta marcando a bola, onde o bloqueador rola pra a cesta, pressionando o aro sem a bola.", categoria: "Taticas", nivel: "intermediario", tags: ["pick and roll", "bloqueio", "garrafao"] },
  { termo: "Pressao de aro", definicao: "Qualquer acao, com ou sem a bola, que ameace a defesa proxima ao aro.", categoria: "Ataque", nivel: "intermediario", tags: ["garrafao", "aro", "vantagem"] },
  { termo: "Saltar pra bola", definicao: "Ajuda rapida no lado forte, com o intuito de congestionar a linha de drive, mas sem deixar de se comprometer com o atacante original.", categoria: "Defesa", nivel: "avancado", tags: ["ajuda", "lado forte", "drive"] },
  { termo: "Sustentador", definicao: "Jogador que nao cede vantagem no 1v1 sem ajuda, mas tambem nao ganha vantagem.", categoria: "Draft/Scouting", nivel: "avancado", tags: ["vantagem", "1v1", "projecao"] },
  { termo: "Teto", definicao: "Curva de desenvolvimento mais alta de um jogador.", categoria: "Draft/Scouting", nivel: "basico", tags: ["potencial", "projecao"] },
  { termo: "Teto teorico", definicao: "O melhor caso de um jogador, muitas vezes um somatorio de ideias do que esse jogador pode se tornar, se ele conseguir desenvolver todos os fundamentos. Ex.: o teto teorico do Trae Young aos 15 anos incluia ele crescer mais do que esperado; ganhar massa e verticalidade.", categoria: "Draft/Scouting", nivel: "avancado", tags: ["potencial", "projecao", "desenvolvimento"] },
  { termo: "Tres niveis", definicao: "Linha de 3PT, meia distancia e garrafao.", categoria: "Arremessos", nivel: "basico", tags: ["pontuacao", "3PT", "meia distancia", "garrafao"] }
];

const estadoGlossario = {
  busca: "",
  categoria: "Todos",
  nivel: "Todos",
  letra: "Todos"
};

const nivelLabel = {
  basico: "Essencial",
  intermediario: "Intermediario",
  avancado: "Avancado"
};

const categoriaClasse = {
  "Ataque": "glossario-color-ataque",
  "Arremessos": "glossario-color-arremessos",
  "Defesa": "glossario-color-defesa",
  "Draft/Scouting": "glossario-color-scouting",
  "Regras": "glossario-color-regras",
  "Taticas": "glossario-color-taticas",
  "Termos avancados": "glossario-color-avancados"
};

function classeDaCategoria(categoria) {
  return categoriaClasse[categoria] || "glossario-color-default";
}

function normalizarGlossario(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resumoDefinicao(definicao) {
  return definicao.length > 118 ? `${definicao.slice(0, 118).trim()}...` : definicao;
}

function categoriasGlossario() {
  return ["Todos", ...new Set(glossario.map((item) => item.categoria))].sort((a, b) => {
    if (a === "Todos") return -1;
    if (b === "Todos") return 1;
    return a.localeCompare(b);
  });
}

function niveisGlossario() {
  return ["Todos", "basico", "intermediario", "avancado"];
}

function letrasDisponiveis() {
  return new Set(glossario.map((item) => normalizarGlossario(item.termo).charAt(0).toUpperCase()));
}

function termoCombina(item) {
  const textoBusca = normalizarGlossario([
    item.termo,
    item.definicao,
    item.categoria,
    item.nivel,
    item.tags.join(" ")
  ].join(" "));
  const primeiraLetra = normalizarGlossario(item.termo).charAt(0).toUpperCase();

  return (!estadoGlossario.busca || textoBusca.includes(normalizarGlossario(estadoGlossario.busca)))
    && (estadoGlossario.categoria === "Todos" || item.categoria === estadoGlossario.categoria)
    && (estadoGlossario.nivel === "Todos" || item.nivel === estadoGlossario.nivel)
    && (estadoGlossario.letra === "Todos" || primeiraLetra === estadoGlossario.letra);
}

function termosFiltrados() {
  return glossario
    .filter((item) => item.categoria !== "Posicoes")
    .filter(termoCombina)
    .sort((a, b) => a.termo.localeCompare(b.termo));
}

function botaoFiltro(label, ativo, attrs = "") {
  const cor = label === "Todos" ? "" : ` ${classeDaCategoria(label)}`;
  return `<button class="glossario-chip${cor}${ativo ? " is-active" : ""}" type="button" ${attrs}>${label}</button>`;
}

function renderFiltros() {
  const categorias = document.querySelector("#glossario-categorias");
  const niveis = document.querySelector("#glossario-niveis");

  if (categorias) {
    categorias.innerHTML = categoriasGlossario()
      .filter((categoria) => categoria !== "Posicoes")
      .map((categoria) => botaoFiltro(categoria, estadoGlossario.categoria === categoria, `data-categoria="${categoria}"`))
      .join("");
  }

  if (niveis) {
    niveis.innerHTML = niveisGlossario()
      .map((nivel) => botaoFiltro(nivel === "Todos" ? "Todos" : nivelLabel[nivel], estadoGlossario.nivel === nivel, `data-nivel="${nivel}"`))
      .join("");
  }

}

function renderPosicoesDestaque() {
  const area = document.querySelector("#glossario-posicoes-destaque");
  if (!area) return;

  area.innerHTML = glossario
    .filter((item) => item.categoria === "Posicoes")
    .map((item) => `
      <article class="glossario-position-card">
        <span class="glossario-position-card__number">${item.termo.match(/\((.*?)\)/)?.[1] || ""}</span>
        <div>
          <h3>${item.termo.replace(/\s*\(.*?\)/, "")}</h3>
          <p>${item.definicao}</p>
          ${item.nota ? `<small>${item.nota}</small>` : ""}
        </div>
      </article>
    `)
    .join("");
}

function renderLista() {
  const lista = document.querySelector("#glossario-lista");
  const vazio = document.querySelector("#glossario-vazio");
  const contagem = document.querySelector("#glossario-contagem");
  const total = document.querySelector("#glossario-total");
  if (!lista) return;

  const filtrados = termosFiltrados();
  if (total) total.textContent = glossario.length;
  if (contagem) contagem.textContent = `${filtrados.length} resultado${filtrados.length === 1 ? "" : "s"}`;

  lista.innerHTML = filtrados.map((item) => {
    const longa = item.definicao.length > 120;
    return `
      <article class="glossario-card" data-termo="${item.termo}">
        <div class="glossario-card__top">
          <span class="tag glossario-category ${classeDaCategoria(item.categoria)}">${item.categoria}</span>
          <span class="glossario-level">${nivelLabel[item.nivel]}</span>
        </div>
        <h3>${item.termo}</h3>
        <p class="glossario-card__summary">${resumoDefinicao(item.definicao)}</p>
        <p class="glossario-card__full" hidden>${item.definicao}</p>
        <div class="glossario-card__tags">
          ${item.tags.slice(0, 4).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        ${longa ? '<button class="glossario-more" type="button">ver mais</button>' : ""}
      </article>
    `;
  }).join("");

  if (vazio) vazio.hidden = filtrados.length > 0;
}

function renderGlossario() {
  renderFiltros();
  renderPosicoesDestaque();
  renderLista();
}

function iniciarEventosGlossario() {
  const busca = document.querySelector("#glossario-busca");
  const limpar = document.querySelector("#glossario-limpar");

  if (busca) {
    busca.addEventListener("input", () => {
      estadoGlossario.busca = busca.value;
      renderLista();
    });
  }

  document.addEventListener("click", (evento) => {
    const categoria = evento.target.closest("[data-categoria]");
    const nivel = evento.target.closest("[data-nivel]");
    const verMais = evento.target.closest(".glossario-more");

    if (categoria) {
      estadoGlossario.categoria = categoria.dataset.categoria;
      renderGlossario();
    }

    if (nivel) {
      estadoGlossario.nivel = nivel.dataset.nivel;
      renderGlossario();
    }

    if (verMais) {
      const card = verMais.closest(".glossario-card");
      const summary = card.querySelector(".glossario-card__summary");
      const full = card.querySelector(".glossario-card__full");
      const aberto = !full.hidden;
      summary.hidden = !aberto;
      full.hidden = aberto;
      verMais.textContent = aberto ? "ver mais" : "ver menos";
      card.classList.toggle("is-open", !aberto);
    }
  });

  if (limpar) {
    limpar.addEventListener("click", () => {
      estadoGlossario.busca = "";
      estadoGlossario.categoria = "Todos";
      estadoGlossario.nivel = "Todos";
      if (busca) busca.value = "";
      renderGlossario();
    });
  }
}

renderGlossario();
iniciarEventosGlossario();
