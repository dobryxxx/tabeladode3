const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function editorial() {
  const source = fs.readFileSync(require.resolve("../js/main.js"), "utf8");
  const context = vm.createContext({
    window: {location: {hostname: "localhost", href: "https://tabeladode3.com/por-escrito.html", search: ""}},
    URL, URLSearchParams, console
  });
  vm.runInContext(source.slice(0, source.lastIndexOf("\nrenderConteudoDinamico();")), context);
  return (code) => vm.runInContext(code, context);
}

test("Portable Text preserves combined marks, links and headings without trusting HTML", () => {
  const run = editorial();
  const result = run(`renderCorpoArtigo(normalizarCorpo([
    {_type:'block', style:'h2', children:[{text:'Título', marks:[]}]},
    {_type:'block', children:[{text:'<teste>', marks:['strong','em','link1']}], markDefs:[{_key:'link1',_type:'link',href:'https://example.com'}]},
    {_type:'block', listItem:'bullet', children:[{text:'Item', marks:['strong']}]},
    {_type:'block', children:[{text:'Seguro',marks:['bad']}],markDefs:[{_key:'bad',_type:'link',href:'javascript:alert(1)'}]}
  ]))`);
  assert.match(result, /<h2>Título<\/h2>/);
  assert.match(result, /<a href="https:\/\/example\.com\/"><em><strong>&lt;teste&gt;<\/strong><\/em><\/a>/);
  assert.match(result, /<ul><li><strong>Item<\/strong><\/li><\/ul>/);
  assert.doesNotMatch(result, /javascript:/);
});

test("Every placement shares the same explicit Sanity crop, with no automatic crop", () => {
  const run = editorial();
  const image = run(`imagemEditorial({imagem:'https://cdn.sanity.io/images/p/d/asset.jpg',imagemDimensions:{width:1000,height:800},imagemCrop:{left:.1,right:.2,top:.25,bottom:0}})`);
  assert.equal(new URL(image).searchParams.get('rect'), '100,200,700,600');
  assert.equal(run(`imagemEditorial({imagem:'https://example.com/image.jpg'})`), 'https://example.com/image.jpg');
});



test("Highlights are the latest three published posts, independent of legacy selection and category", () => {
  const run = editorial();
  run(`postsJson = [{slug:'local',titulo:'Local',categoria:'nba',data:'2026-11-07'}];
    postsSanity = [
      {slug:'old',titulo:'Old',categoria:'nba',dataPublicacao:'2025-01-01',destaqueHome:true,posicaoDestaque:'principal',ordemDestaque:1},
      {slug:'third',titulo:'Third',categoria:'nba',dataPublicacao:'2026-11-04',posicaoDestaque:'lateral'},
      {slug:'first',titulo:'First',categoria:'nba',dataPublicacao:'2026-11-06T18:00:00Z',posicaoDestaque:'none'},
      {slug:'second',titulo:'Second',categoria:'nba',dataPublicacao:'2026-11-06T12:00:00Z'},
      {slug:'draft',titulo:'Draft',categoria:'nba',dataPublicacao:'2026-11-07',status:'rascunho'},
      {slug:'hidden',titulo:'Hidden',categoria:'nba',dataPublicacao:'2026-11-07',status:'oculto'},
      {slug:'other',titulo:'Other',categoria:'lapsos',dataPublicacao:'2026-11-03',status:'publicado'}
    ];`);
  assert.equal(run(`destaquesDaCategoria().principais.map(p=>p.slug).join(',')`), 'first,second,third');
  assert.equal(run(`destaquesDaCategoria('nba').principais.map(p=>p.slug).join(',')`), 'first,second,third');
  assert.equal(run(`destaquesDaCategoria('nba').laterais.length`), 0);
  assert.equal(run(`destaquesDaCategoria('lapsos').principais[0].slug`), 'other');
  assert.equal(run(`destaquesDaCategoria('vazia').principais.length`), 0);
});

test("Editing an imported post cannot promote it above newer publications", () => {
  const run = editorial();
  run(`postsSanity = [
    {slug:'newer',titulo:'Newer',dataPublicacao:'2026-06-01'},
    {slug:'import',titulo:'Imported',dataPublicacao:'2026-05-13',_updatedAt:'2026-11-06'}
  ];`);
  assert.equal(run(`postsDoSite().map(p=>p.slug).join(',')`), 'newer,import');
  assert.equal(run(`destaquesDaCategoria().principais.map(p=>p.slug).join(',')`), 'newer,import');
});

test("Kauan's confirmed date correction applies to display and ordering without changing other dates", () => {
  const run = editorial();
  run(`postsSanity = [
    {slug:'kauan-raymundo-brasilia-basquete',titulo:'Kauan',dataPublicacao:'2028-07-05T15:00:00.000Z'},
    {slug:'september',titulo:'September',dataPublicacao:'2026-09-17'}
  ];`);
  assert.equal(run(`postsDoSite().map(p=>p.slug).join(',')`), 'september,kauan-raymundo-brasilia-basquete');
  assert.equal(run(`postsDoSite()[1].dataPublicacao`), '2026-07-05T15:00:00.000Z');
  assert.match(run(`postsDoSite()[1].data`), /2026/);
  assert.equal(run(`normalizarPost({slug:'other',dataPublicacao:'2028-07-05T15:00:00.000Z'}).dataPublicacao`), '2028-07-05T15:00:00.000Z');
  assert.equal(run(`normalizarPost({slug:'kauan-raymundo-brasilia-basquete',dataPublicacao:'2026-07-06T15:00:00.000Z'}).dataPublicacao`), '2026-07-06T15:00:00.000Z');
});

test("Offline highlights sort local publication dates and allow fewer than three posts", () => {
  const run = editorial();
  run(`postsJson = [{slug:'older',titulo:'Older',data:'2026-03-01'}, {slug:'newer',titulo:'Newer',data:'2026-04-01'}];`);
  assert.equal(run(`destaquesDaCategoria().principais.map(p=>p.slug).join(',')`), 'newer,older');
});
