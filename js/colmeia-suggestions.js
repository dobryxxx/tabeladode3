(function () {
  "use strict";

  // Camada editorial inicial, local e reversivel. Estas relacoes nao sao
  // gravadas no Sanity e deixam de aparecer quando o mesmo par recebe uma
  // conexao manual.
  globalThis.colmeiaSuggestedRelations = [
    {
      source: "post-pastre-stella-azurra",
      target: "90fe3600-48f8-4610-ba83-a78e1b5a853d",
      via: "trajetória de Pedro Pastre"
    },
    {
      source: "post-mathias-alessanco-overtime-elite-ote",
      target: "94834e1e-e056-46ee-87b4-b7db7707feaf",
      via: "trajetória de Mathias Alessanco"
    },
    {
      source: "post-entrevista-prolla",
      target: "post-brasileiro-jogara-di-da-ncaa",
      via: "trajetória de Lucas Prolla"
    },
    {
      source: "post-brasileiro-jogara-di-da-ncaa",
      target: "post-lucas-prolla-commits-to-duquesne",
      via: "versões em português e inglês"
    },
    {
      source: "post-neora-francis-entrevista",
      target: "post-get-to-know-neora-francis",
      via: "versões em português e inglês"
    },
    {
      source: "post-auto-falante-ruan",
      target: "post-he-knew-the-script",
      via: "versões em português e inglês"
    },
    {
      source: "post-uma-conversa-com-maozinha",
      target: "post-maozinha-segue-na-g-league",
      via: "trajetória de Mãozinha"
    },
    {
      source: "post-oito-trocas-pra-salvar-a-nba",
      target: "post-resolvendo-a-fraca-deadline-da-nba",
      via: "série sobre a Trade Deadline"
    },
    {
      source: "post-edu-santos-ldb",
      target: "post-edu-santos-e-do-pinheiros",
      via: "trajetória de Edu Santos"
    },
    {
      source: "post-extenso-samis",
      target: "post-eduardo-klafke-samis-calderon-butler",
      via: "trajetória de Samis Calderon"
    },
    {
      source: "post-extenso-samis",
      target: "post-samis-calderon-ote",
      via: "trajetória de Samis Calderon"
    },
    {
      source: "post-samis-calderon-ote",
      target: "post-reynan-e-samis-overtime-elite",
      via: "Samis Calderon na OTE"
    },
    {
      source: "post-reynan-e-samis-overtime-elite",
      target: "post-reynan-pinheiros",
      via: "trajetória de Reynan dos Santos"
    },
    {
      source: "post-o-ladrao-de-hype",
      target: "post-hype-theft",
      via: "versões em português e inglês"
    },
    {
      source: "post-reynan-pinheiros",
      target: "post-o-ladrao-de-hype",
      via: "trajetória de Reynan dos Santos"
    },
    {
      source: "post-mathias-alessanco-overtime-elite-ote",
      target: "post-rauan-rodrigues-ote",
      via: "prospectos da Overtime Elite"
    },
    {
      source: "post-rauan-rodrigues-ote",
      target: "post-samis-calderon-ote",
      via: "prospectos da Overtime Elite"
    },
    {
      source: "post-bruno-solano-jogara-pelo-zentro-basket-madrid",
      target: "post-joao-gabriel-alves-e-do-zentro-basket-de-madri",
      via: "brasileiros no Zentro Basket"
    },
    {
      source: "post-joao-gabriel-alves-e-do-zentro-basket-de-madri",
      target: "post-leandro-cardoso-espanha-zentro",
      via: "brasileiros no Zentro Basket"
    },
    {
      source: "post-bruno-solano-jogara-pelo-zentro-basket-madrid",
      target: "post-o-mvp-do-brasileiro-sub-17",
      via: "destaques do Brasileiro Sub-17"
    },
    {
      source: "post-leandro-cardoso-espanha-zentro",
      target: "post-lucas-milchevski-jogara-na-espanha",
      via: "brasileiros no basquete espanhol"
    },
    {
      source: "post-lucas-milchevski-jogara-na-espanha",
      target: "post-orlando-cba-badajoz",
      via: "brasileiros no CBA Badajoz"
    },
    {
      source: "post-brenninho-e-do-pinheiros",
      target: "post-edu-santos-e-do-pinheiros",
      via: "movimentações do Pinheiros"
    },
    {
      source: "post-edu-santos-e-do-pinheiros",
      target: "post-lucas-thor-joga-pelo-pinheiros-em-2024",
      via: "movimentações do Pinheiros"
    },
    {
      source: "post-lucas-thor-joga-pelo-pinheiros-em-2024",
      target: "post-reynan-pinheiros",
      via: "movimentações do Pinheiros"
    },
    {
      source: "post-enrico-bianchi-paulistano",
      target: "post-paulistano-vai-vem-2024-2025",
      via: "mercado do Paulistano"
    },
    {
      source: "post-paulistano-vai-vem-2024-2025",
      target: "post-pietro-melo-e-do-paulistano",
      via: "mercado do Paulistano"
    },
    {
      source: "post-pietro-melo-e-do-paulistano",
      target: "post-victor-santos-assina-com-paulistano",
      via: "movimentações do Paulistano"
    },
    {
      source: "post-brasileiro-17-exato",
      target: "post-o-mvp-do-brasileiro-sub-17",
      via: "cobertura do Brasileiro Sub-17"
    },
    {
      source: "post-o-mvp-do-brasileiro-sub-17",
      target: "post-mastigado-cbi17",
      via: "cobertura do Brasileiro Sub-17"
    },
    {
      source: "post-brasileiro-sub-15-aonde-olhar",
      target: "post-cbi-15-2024",
      via: "cobertura do Brasileiro Sub-15"
    },
    {
      source: "post-cbi-15-2024",
      target: "post-clube-dos-15",
      via: "prospectos Sub-15"
    },
    {
      source: "post-mercado-da-base-ferve",
      target: "post-pa-pum-o-ano-virou-e-o-vai-vem-nao-parou",
      via: "série Mercado da Base"
    },
    {
      source: "90fe3600-48f8-4610-ba83-a78e1b5a853d",
      target: "post-gabriel-landeira-escolheu-georgetown",
      via: "brasileiros em Georgetown"
    },
    {
      source: "post-augusto-cassia-fecha-com-ole-miss",
      target: "post-eduardo-klafke-samis-calderon-butler",
      via: "brasileiros no College"
    },
    {
      source: "post-auto-falante-ruan",
      target: "post-daniel-onwenu-e-do-mexico-city-capitanes",
      via: "brasileiros no Mexico City Capitanes"
    },
    {
      source: "post-daniel-onwenu-e-do-mexico-city-capitanes",
      target: "post-maozinha-segue-na-g-league",
      via: "brasileiros na G-League"
    }
  ];
})();
