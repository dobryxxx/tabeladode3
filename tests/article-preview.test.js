const test = require('node:test');
const assert = require('node:assert/strict');

const template = '<head><title>Tabelado de 3</title></head><body>Matéria</body>';
const page = new URL('https://example.org/artigo.html?post=materia&utm_source=x');
const article = {
  titulo: 'Basquete & "base"', resumo: 'Entrevista', status: 'publicado',
  cover: {url: 'img/capa.png', alt: 'Capa da matéria'}
};

async function render(post, archive = []) {
  const {renderArticlePreview} = await import('../scripts/article-preview.mjs');
  return renderArticlePreview(template, page, async () => ({posts: archive}),
    async () => Response.json({result: post}));
}

test('Share image overrides the cover and clearing it restores the absolute cover URL', async () => {
  const custom = await render({...article, shared: {url: 'https://example.org/x.jpg', alt: 'Foto para o X'}});
  assert.match(custom, /name="twitter:image" content="https:\/\/example\.org\/x\.jpg"/);
  assert.match(custom, /property="og:image:alt" content="Foto para o X"/);
  assert.doesNotMatch(custom, /capa\.png|utm_source/);
  assert.match(custom, /Basquete &amp; &quot;base&quot;/);
  const fallback = await render({...article, shared: {url: null}});
  assert.match(fallback, /name="twitter:image" content="https:\/\/example\.org\/img\/capa\.png"/);
  assert.match(fallback, /name="twitter:card" content="summary_large_image"/);
});

test('Legacy published covers are supported and hidden posts never fall back to an archived cover', async () => {
  const archive = [{...article, slug: 'materia', imagem: '/img/legado.png'}];
  delete archive[0].cover;
  assert.match(await render(null, archive), /name="twitter:image" content="https:\/\/example\.org\/img\/legado\.png"/);
  assert.equal(await render({...article, status: 'rascunho'}, archive), template);
  assert.equal(await render(null), template);
});
