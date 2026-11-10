import {renderArticlePreview} from '../../scripts/article-preview.mjs';

export default async function articlePreview(request, context) {
  const page = new URL(request.url);
  if (request.method !== 'GET' || !page.searchParams.get('post')) return;
  const original = await context.next();
  if (original.status !== 200 || !original.headers.get('content-type')?.includes('text/html')) return original;
  const html = await renderArticlePreview(await original.text(), page, async () => {
    const archive = await fetch(new URL('/data/posts.json', page), {signal: AbortSignal.timeout(3500)});
    return archive.json();
  });
  const headers = new Headers(original.headers);
  for (const name of ['etag', 'content-length', 'content-encoding', 'last-modified']) headers.delete(name);
  headers.set('cache-control', 'no-store');
  return new Response(html, {headers});
}

export const config = {path: ['/artigo.html', '/artigo']};
