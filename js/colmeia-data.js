(function () {
  window.colmeiaFallbackData = {
    posts: [
      {
        _id: "fallback-post-draft-brasileiro",
        label: "Draft brasileiro em contexto",
        body: "Leitura editorial sobre caminhos de desenvolvimento para prospectos brasileiros.",
        slug: "draft-brasileiro-contexto",
        tags: ["draft", "scouting", "desenvolvimento"]
      },
      {
        _id: "fallback-post-arremesso",
        label: "Arremesso como vantagem",
        body: "Como spacing e tomada de decisao mudam a avaliacao de jovens jogadores.",
        slug: "arremesso-como-vantagem",
        tags: ["arremesso", "spacing", "vantagem"],
        relacionados: ["fallback-dica-film-room"]
      },
      {
        _id: "fallback-post-isolado-a",
        label: "Conteudo isolado A",
        body: "No sem tags para testar relacao manual inline.",
        slug: "conteudo-isolado-a",
        tags: [],
        relacionados: ["fallback-post-isolado-b"]
      },
      {
        _id: "fallback-post-isolado-b",
        label: "Conteudo isolado B",
        body: "Outro no sem tags que deve receber aresta de relacionado.",
        slug: "conteudo-isolado-b",
        tags: []
      }
    ],
    prospects: [
      {
        _id: "fallback-prospect-armador",
        label: "Prospecto armador",
        body: "Criador primario com leitura de pick and roll.",
        slug: "prospecto-armador",
        posicao: "Armador",
        encaixes: ["San Antonio Spurs", "Orlando Magic", "San Antonio Spurs"],
        tags: ["criacao", "PnR", "vantagem"]
      },
      {
        _id: "fallback-prospect-ala",
        label: "Prospecto ala",
        body: "Ala fisico com defesa no ponto de ataque.",
        slug: "prospecto-ala",
        posicao: "Ala",
        encaixes: ["Orlando Magic", "Toronto Raptors", "Toronto Raptors"],
        tags: ["defesa", "ponto de ataque", "desenvolvimento"],
        relacionados: ["fallback-tweet-draft"]
      }
    ],
    termos: [
      {
        _id: "fallback-termo-spacing",
        label: "Spacing",
        body: "Organizacao ofensiva que amplia espacos para criar vantagem.",
        slug: "spacing",
        tags: ["spacing", "vantagem"]
      },
      {
        _id: "fallback-termo-pnr",
        label: "Pick and roll",
        body: "Acao entre bloqueador e manipulador para gerar leitura e vantagem.",
        slug: "pick-and-roll",
        tags: ["PnR", "criacao"]
      }
    ],
    rankings: [
      {
        _id: "fallback-ranking-2026",
        label: "Ranking 2026",
        body: "Lista editorial de acompanhamento da geracao.",
        slug: "ranking-2026",
        tags: ["draft", "scouting"]
      }
    ],
    dicas: [
      {
        _id: "fallback-dica-film-room",
        label: "Como assistir um jogo para scout",
        body: "Roteiro simples para observar vantagem, spacing e defesa.",
        slug: "film-room-scout",
        tags: ["scouting", "vantagem"],
        link: "dicas.html"
      }
    ],
    tweets: [
      {
        _id: "fallback-tweet-draft",
        label: "Tweet citado sobre desenvolvimento",
        slug: "fallback-tweet-draft",
        tags: ["draft", "desenvolvimento"],
        tweet: {
          autorNome: "Tabelado de 3",
          autorHandle: "@tabeladode3",
          texto: "Desenvolvimento nao e linha reta: contexto importa.",
          data: "2026-01-01",
          link: "https://x.com/tabeladode3"
        }
      }
    ],
    conexoes: [
      {
        _id: "fallback-conexao-1",
        de: "fallback-post-draft-brasileiro",
        para: "fallback-prospect-armador",
        descricao: "exemplo de leitura aplicada",
        peso: 3
      },
      {
        _id: "fallback-conexao-2",
        de: "fallback-termo-spacing",
        para: "fallback-post-arremesso",
        descricao: "conceito explicado no texto",
        peso: 2
      }
    ],
    settings: {
      tagsEstruturais: []
    }
  };
})();
