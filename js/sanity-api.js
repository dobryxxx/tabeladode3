(function () {
  const config = window.T3_SANITY_CONFIG || {};
  const projectId = config.projectId || "";
  const dataset = config.dataset || "production";
  const apiVersion = config.apiVersion || "2025-05-13";
  const enabled = Boolean(projectId && projectId !== "SEU_PROJECT_ID");
  const devMode = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const useCdn = devMode ? false : config.useCdn !== false;
  const host = useCdn ? "apicdn.sanity.io" : "api.sanity.io";

  const queries = {
    posts: `*[_type == "post" && status == "publicado"] | order(dataPublicacao desc) {
      _id,
      "titulo": titulo,
      "title": titulo,
      "slug": slug.current,
      "resumo": resumo,
      "excerpt": resumo,
      "imagem": coalesce(imagem.asset->url, imageUrl, localImagePath),
      "image": coalesce(imagem.asset->url, imageUrl, localImagePath),
      "imagemAlt": imagem.alt,
      "categoria": coalesce(categoria->slug.current, "ultimas"),
      "category": coalesce(categoria->slug.current, "ultimas"),
      "categoriaNome": coalesce(categoria->nome, "Últimas"),
      "autor": autor->nome,
      "author": autor->nome,
      dataPublicacao,
      "publishedAt": dataPublicacao,
      "date": dataPublicacao,
      "data": dataPublicacao,
      "tempoLeitura": tempoLeitura,
      "tags": tags,
      "destaque": posicaoDestaque == "principal" || destaqueHome == true,
      "lateral": posicaoDestaque == "lateral",
      "corpo": corpo
    }`,
    postBySlug: `*[_type == "post" && status == "publicado" && slug.current == $slug][0] {
      _id,
      "titulo": titulo,
      "title": titulo,
      "slug": slug.current,
      "resumo": resumo,
      "excerpt": resumo,
      "imagem": coalesce(imagem.asset->url, imageUrl, localImagePath),
      "image": coalesce(imagem.asset->url, imageUrl, localImagePath),
      "imagemAlt": imagem.alt,
      "categoria": coalesce(categoria->slug.current, "ultimas"),
      "category": coalesce(categoria->slug.current, "ultimas"),
      "categoriaNome": coalesce(categoria->nome, "Últimas"),
      "autor": autor->nome,
      "author": autor->nome,
      dataPublicacao,
      "publishedAt": dataPublicacao,
      "date": dataPublicacao,
      "data": dataPublicacao,
      "tempoLeitura": tempoLeitura,
      "tags": tags,
      "destaque": posicaoDestaque == "principal" || destaqueHome == true,
      "lateral": posicaoDestaque == "lateral",
      "corpo": corpo
    }`,
    tips: `*[_type == "tip" && status == "publicado"] | order(featured desc, coalesce(order, 9999) asc, publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      "mainImage": coalesce(mainImage.asset->url, imageUrl, localImagePath),
      "image": coalesce(mainImage.asset->url, imageUrl, localImagePath),
      "imageAlt": mainImage.alt,
      imageUrl,
      localImagePath,
      externalUrl,
      linkLabel,
      body,
      tags,
      publishedAt,
      featured,
      order
    }`,
    tipBySlug: `*[_type == "tip" && status == "publicado" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      "mainImage": coalesce(mainImage.asset->url, imageUrl, localImagePath),
      "image": coalesce(mainImage.asset->url, imageUrl, localImagePath),
      "imageAlt": mainImage.alt,
      imageUrl,
      localImagePath,
      externalUrl,
      linkLabel,
      body,
      tags,
      publishedAt,
      featured,
      order
    }`,
    draftProspects: `*[_type == "draftProspect" && status == "publicado"] | order(rankingGeral asc) {
      "nome": nome,
      "slug": slug.current,
      "foto": coalesce(foto.asset->url, imageUrl, localImagePath),
      "fotoAlt": foto.alt,
      "rank": rankingGeral,
      "tier": tier,
      "posicao": posicao,
      "time": time,
      "idade": idade,
      "altura": altura,
      "peso": peso,
      "classeDraft": classeDraft,
      "arquetipoDefensivo": arquetipoDefensivo,
      "arquetipoOfensivo": arquetipoOfensivo,
      "motivoEscolha": motivoEscolha,
      "espelho": espelho,
      "tetoPiso": tetoPiso,
      "bio": resumo,
      "tags": tags,
      "destaque": destaqueGuia,
      "status": status,
      "updatedAt": _updatedAt
    }`,
    prospectBySlug: `*[_type == "draftProspect" && status == "publicado" && slug.current == $slug][0] {
      "nome": nome,
      "slug": slug.current,
      "foto": coalesce(foto.asset->url, imageUrl, localImagePath),
      "rank": rankingGeral,
      "tier": tier,
      "posicao": posicao,
      "time": time,
      "idade": idade,
      "altura": altura,
      "peso": peso,
      "classeDraft": classeDraft,
      "arquetipoDefensivo": arquetipoDefensivo,
      "arquetipoOfensivo": arquetipoOfensivo,
      "motivoEscolha": motivoEscolha,
      "espelho": espelho,
      "tetoPiso": tetoPiso,
      "bio": resumo,
      "tags": tags
    }`,
    rankings: `*[_type == "ranking" && status == "publicado"] | order(data desc, titulo asc) {
      "slug": slug.current,
      "titulo": titulo,
      "descricao": descricao,
      "imagem": coalesce(capa.asset->url, imageUrl, localImagePath),
      "imagemAlt": capa.alt,
      "categoria": categoria,
      "data": data,
      "autor": autor->nome,
      "destaque": destaqueHome,
      "total": count(itens),
      "itens": itens[] {
        "posicao": posicao,
        "ordem": posicao,
        "nome": nome,
        "imagem": coalesce(imagem.asset->url, imageUrl, localImagePath),
        "descricao": descricao,
        "tier": tier,
        "nota": nota,
        "categoria": posicaoQuadra,
        "time": time,
        "bio2": alturaNascimento,
        "linkRelacionado": linkRelacionado,
        "prospectoSlug": prospecto->slug.current,
        "postSlug": postRelacionado->slug.current
      }
    }`,
    rankingBySlug: `*[_type == "ranking" && status == "publicado" && slug.current == $slug][0] {
      "slug": slug.current,
      "titulo": titulo,
      "descricao": descricao,
      "imagem": coalesce(capa.asset->url, imageUrl, localImagePath),
      "categoria": categoria,
      "data": data,
      "autor": autor->nome,
      "total": count(itens),
      "itens": itens[] {
        "posicao": posicao,
        "ordem": posicao,
        "nome": nome,
        "imagem": coalesce(imagem.asset->url, imageUrl, localImagePath),
        "descricao": descricao,
        "tier": tier,
        "nota": nota,
        "categoria": posicaoQuadra,
        "time": time,
        "bio2": alturaNascimento,
        "linkRelacionado": linkRelacionado
      }
    }`,
    glossaryTerms: `*[_type == "glossaryTerm" && status == "publicado"] | order(coalesce(ordem, 9999) asc, termo asc) {
      "termo": termo,
      "slug": slug.current,
      "definicao": coalesce(explicacaoCompleta, definicaoCurta),
      "definicaoCurta": definicaoCurta,
      "categoria": categoria,
      "nivel": nivel,
      "tags": tags,
      "exemploUso": exemploUso,
      "destaque": destaque,
      "ordem": ordem
    }`,
    homeSettings: `*[_type == "homeSettings"][0] {
      headline,
      subheadline,
      textoApoio,
      "cards": cards[] {
        numero,
        titulo,
        descricao,
        cta,
        link,
        ordem
      },
      "postDestaque": postDestaque->{titulo, "slug": slug.current, resumo, "imagem": coalesce(imagem.asset->url, imageUrl, localImagePath)},
      "rankingDestaque": rankingDestaque->{titulo, "slug": slug.current, descricao, "imagem": coalesce(capa.asset->url, imageUrl, localImagePath)},
      "guiaDraftDestaque": guiaDraftDestaque->{nome, "slug": slug.current, rankingGeral, posicao, "foto": coalesce(foto.asset->url, imageUrl, localImagePath)},
      botaoPrincipal,
      botaoSecundario
    }`,
    siteSettings: `*[_type == "siteSettings"][0] {
      nomeSite,
      descricao,
      "logo": logo.asset->url,
      "logoAlt": logo.alt,
      linksPrincipais,
      emailContato,
      redesSociais
    }`
  };

  function sanitizeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function devLog(message) {
    if (devMode) console.info(message);
  }

  function buildUrl(query, params = {}) {
    const url = new URL(`https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}`);
    url.searchParams.set("query", query);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(`$${key}`, JSON.stringify(value));
    });
    return url.toString();
  }

  async function fetchQuery(query, params = {}) {
    if (!enabled) return null;
    const response = await fetch(buildUrl(query, params));
    if (!response.ok) throw new Error(`Sanity retornou ${response.status}`);
    const payload = await response.json();
    return payload.result;
  }

  async function fetchNamed(name, params) {
    if (!queries[name]) throw new Error(`Query Sanity não encontrada: ${name}`);
    return fetchQuery(queries[name], params);
  }

  window.T3Sanity = {
    enabled,
    queries,
    fetchQuery,
    fetchNamed,
    fetchPosts: () => fetchNamed("posts"),
    fetchPostBySlug: (slug) => fetchNamed("postBySlug", {slug}),
    fetchTips: () => fetchNamed("tips"),
    fetchTipBySlug: (slug) => fetchNamed("tipBySlug", {slug}),
    fetchDraftProspects: () => fetchNamed("draftProspects"),
    fetchProspectBySlug: (slug) => fetchNamed("prospectBySlug", {slug}),
    fetchRankings: () => fetchNamed("rankings"),
    fetchRankingBySlug: (slug) => fetchNamed("rankingBySlug", {slug}),
    fetchGlossaryTerms: () => fetchNamed("glossaryTerms"),
    fetchHomeSettings: () => fetchNamed("homeSettings"),
    fetchSiteSettings: () => fetchNamed("siteSettings"),
    sanitizeText,
    devLog
  };
})();
