const asset = '{ "url": asset->url, alt, crop, "size": asset->metadata.dimensions }';
const query = `*[_type == "post" && !(_id in path("drafts.**")) &&
  slug.current == $slug][0]{
  titulo, resumo, status,
  "shared": imagemCompartilhamento${asset},
  "cover": imagem${asset},
  "legacyCover": coalesce(imageUrl, localImagePath)
}`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function previewImage(post, page) {
  for (const image of [post.shared, post.cover, {url: post.legacyCover}]) {
    if (!image?.url) continue;
    let url;
    try { url = new URL(image.url, page); } catch { continue; }
    if (!['http:', 'https:'].includes(url.protocol)) continue;
    if (url.hostname === 'cdn.sanity.io') {
      const {crop, size} = image;
      if (crop && size?.width && size?.height) {
        const left = Math.round(size.width * (crop.left || 0));
        const top = Math.round(size.height * (crop.top || 0));
        const width = Math.max(1, size.width - left - Math.round(size.width * (crop.right || 0)));
        const height = Math.max(1, size.height - top - Math.round(size.height * (crop.bottom || 0)));
        url.searchParams.set('rect', [left, top, width, height].join(','));
      }
      url.searchParams.set('w', '1200');
      url.searchParams.set('h', '1200');
      url.searchParams.set('fit', 'max');
      url.searchParams.set('fm', 'jpg');
    }
    return {url: url.href, alt: image.alt || post.titulo};
  }
}

export async function renderArticlePreview(html, page, loadArchive, fetchPost = fetch) {
  const slug = page.searchParams.get('post');
  if (!slug || slug.length > 256) return html;
  const endpoint = new URL('https://eaeyiq4k.api.sanity.io/v2025-05-13/data/query/production');
  endpoint.searchParams.set('query', query);
  endpoint.searchParams.set('$slug', JSON.stringify(slug));
  let post;
  try {
    const response = await fetchPost(endpoint, {signal: AbortSignal.timeout(3500)});
    if (!response.ok) return html;
    post = (await response.json()).result;
    if (!post) {
      const archive = await loadArchive();
      const legacy = archive.posts.find(entry => entry.slug === slug);
      if (legacy) post = {...legacy, legacyCover: legacy.imagem};
    }
  } catch {
    return html;
  }
  if (!post?.titulo || (post.status && post.status !== 'publicado')) return html;

  const canonical = new URL(page.pathname, page.origin);
  canonical.searchParams.set('post', slug);
  const image = previewImage(post, canonical);
  const metadata = {
    'og:type': 'article', 'og:site_name': 'Tabelado de 3', 'og:url': canonical.href,
    'og:title': post.titulo, 'og:description': post.resumo, 'og:image': image?.url, 'og:image:alt': image?.alt,
    'twitter:card': image ? 'summary_large_image' : 'summary', 'twitter:site': '@tabeladode3',
    'twitter:title': post.titulo, 'twitter:description': post.resumo,
    'twitter:image': image?.url, 'twitter:image:alt': image?.alt
  };
  const tags = Object.entries(metadata).filter(([, value]) => value).map(([key, value]) =>
    `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}" />`
  );
  return html.replace(/<title>[^<]*<\/title>/i, () =>
    [`<title>${escapeHtml(post.titulo)} | Tabelado de 3</title>`, ...tags].join('\n  ')
  );
}
