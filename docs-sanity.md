# Sanity CMS - Arquitetura editorial

O site público continua estático no Netlify, com HTML, CSS e JavaScript puro. O Sanity entra como painel editorial e fonte pública de dados.

## Onde fica o Studio

- Pasta: `sanity/`
- Rodar localmente: `cd sanity`, configurar `.env`, `npm install`, `npm run dev`
- Deploy do Studio: `npm run deploy`

## Configurar o front público

Edite `js/sanity-config.js`:

```js
window.T3_SANITY_CONFIG = {
  projectId: "SEU_PROJECT_ID",
  dataset: "production",
  apiVersion: "2025-05-13",
  useCdn: true
};
```

Enquanto `projectId` estiver como `SEU_PROJECT_ID`, o site usa os dados locais como fallback.

## Liberar CORS no Sanity

Para o navegador conseguir buscar dados do Sanity, adicione estas origens em `sanity.io/manage > API > CORS origins`:

- `http://127.0.0.1:8000`
- `http://localhost:8000`
- a URL final do Netlify, por exemplo `https://seu-site.netlify.app`

Não marque `Allow credentials`, porque o front público usa apenas dados públicos, sem token privado.

## Tipos de conteúdo

- Publicações: posts do Blog / Por Escrito.
- Dicas: curadoria de links, materiais, videos, referencias e guias praticos.
- Prospectos do Draft: jogadores do Guia do Draft.
- Rankings: listas editoriais com itens ordenados.
- Termos do Glossário: termos, categorias, níveis e exemplos.
- Categorias: categorias reutilizáveis por área.
- Autores: autores com foto, bio e links.
- Configurações da Home: headline, subheadline e cards da splash.
- Configurações gerais: nome, descrição, logo, redes e e-mail.

## Como cada página busca dados

- `/`: busca `homeSettings` e atualiza headline, subheadline e cards da splash.
- `/por-escrito.html`: busca posts publicados e ordena por data.
- `/dicas.html`: busca dicas publicadas, mescla fallback local e organiza destaques, busca e filtros.
- `/artigo.html?post=slug`: usa a lista de posts do Sanity quando disponível.
- `/guia-do-draft.html`: busca prospectos publicados e ordena por `rankingGeral`.
- `/rankings.html`: busca rankings publicados e monta a grade.
- `/ranking-individual.html?ranking=slug`: busca um ranking por slug.
- `/glossario.html`: busca termos publicados, preservando busca e filtros.

## Fallback

Durante a migração, o site mescla Sanity + dados locais. Quando existir duplicado, a versão do Sanity vence:

- Posts: duplicado por `slug`.
- Guia do Draft: duplicado por `slug`, nome normalizado ou nome + posição.
- Rankings: duplicado por `slug`.
- Glossário: duplicado por `slug` ou termo normalizado.

Se o Sanity não estiver configurado, estiver vazio ou falhar, o site continua usando:

- `data/posts.json`
- `js/conteudo.js`
- `js/draft-data.js`
- `js/rankings.js`
- `js/glossario.js`

## Queries usadas

As queries GROQ ficam em `js/sanity-api.js`, no objeto `queries`.

Principais nomes:

- `posts`
- `postBySlug`
- `draftProspects`
- `prospectBySlug`
- `rankings`
- `rankingBySlug`
- `glossaryTerms`
- `tips`
- `tipBySlug`
- `homeSettings`
- `siteSettings`

## Como criar uma Dica

1. Acesse `https://tabeladode3.sanity.studio/`.
2. Clique em `Dicas` no menu lateral.
3. Clique para criar uma nova dica.
4. Preencha `Titulo`, `Resumo`, `Categoria`, `Imagem principal` e, se existir, `Link externo`.
5. Use `Texto do botao/link` para controlar o CTA do card, como `Acessar`, `Ver video` ou `Ler material`.
6. Adicione tags para melhorar a busca da pagina.
7. Marque `Destaque` quando a dica deve aparecer no topo de `dicas.html`.
8. Use `Ordem` para controlar a prioridade: numeros menores aparecem primeiro.
9. Clique em `Publish`.

Na pagina publica `dicas.html`, as dicas aparecem em cards editoriais com busca e filtro por categoria. Links externos abrem em nova aba; links internos como `glossario.html` ou `guia-do-draft.html` abrem no proprio site.

Para trocar uma imagem, abra a dica no Studio e substitua `Imagem principal`. Se a imagem ainda estiver fora do Sanity, use `URL da imagem` temporariamente. Para ocultar uma dica sem apagar, altere `Status` para `Rascunho/oculto`.

Como foi criado um schema novo, depois de publicar o codigo rode:

```bash
cd sanity
npx sanity deploy --yes
```

Isso atualiza o painel publicado em `https://tabeladode3.sanity.studio/`.

## Como convidar o cliente

1. Acesse `sanity.io/manage`.
2. Abra o projeto do Tabelado de 3.
3. Vá em `Members`.
4. Convide o e-mail do cliente.
5. Dê permissão de editor/content editor.

## Migração dos dados locais para o Sanity

O script fica em `sanity/scripts/migrate-local-data-to-sanity.mjs`.

Ele lê:

- `data/posts.json`
- `js/conteudo.js`
- `js/draft-data.js`
- `js/dicas-data.js`
- `js/glossario.js`
- `js/rankings.js`

Por padrão ele roda em simulação e não escreve nada no Sanity:

```bash
cd sanity
node scripts/migrate-local-data-to-sanity.mjs
```

O dry-run salva um preview em:

```text
sanity/migration-preview.json
```

### Gerar token de escrita

1. Acesse `sanity.io/manage`.
2. Abra o projeto `eaeyiq4k`.
3. Vá em `API > Tokens`.
4. Clique em `Create token`.
5. Use permissão de escrita/editor.
6. Copie o token.
7. Crie ou edite `sanity/.env`:

```env
SANITY_STUDIO_PROJECT_ID=eaeyiq4k
SANITY_STUDIO_DATASET=production
SANITY_AUTH_TOKEN=cole_o_token_aqui
```

Nunca coloque esse token no front público.

### Rodar migração real

Depois de conferir o preview:

```bash
cd sanity
node scripts/migrate-local-data-to-sanity.mjs --write
```

O script usa `createOrReplace`, então pode ser reexecutado sem duplicar documentos. Os IDs são estáveis:

- `post-slug`
- `tip-slug`
- `draftProspect-slug`
- `glossaryTerm-slug`
- `ranking-slug`
- `category-slug`
- `author-slug`

### Imagens locais

Nesta primeira fase o script não sobe imagens como assets do Sanity. Ele preserva URLs externas em `imageUrl` e caminhos locais em `localImagePath`.

Depois, se fizer sentido, um segundo script pode transformar esses caminhos em assets reais do Sanity.

### Validar depois da migração

1. Abra o Sanity Studio.
2. Confira Publicações, Guia do Draft, Rankings e Glossário.
3. Publique/ajuste qualquer documento necessário.
4. Abra o site local ou Netlify.
5. Confira os logs do console: `Sanity + fallback local`.

## Correção de datas de publicações importadas

As publicações usam o campo `dataPublicacao` no Sanity. A migração foi ajustada para nunca usar a data atual como fallback automático em posts antigos.

Regra atual:

- se houver data original em `data/posts.json`, `js/conteudo.js` ou outro campo equivalente, ela é convertida para ISO;
- datas em `YYYY-MM-DD`, `DD/MM/YYYY` e textos como `25 de abr. de 2026` são aceitas;
- se não houver data confiável, o post recebe `2000-01-01T00:00:00.000Z`, para ficar no fim da listagem;
- o log da migração avisa quando precisou usar essa data neutra.

Para auditar posts já importados no Sanity sem alterar nada:

```bash
cd sanity
node scripts/fix-post-dates.mjs
```

O dry-run compara os posts locais com os documentos publicados no Sanity e mostra:

- total de posts encontrados no Sanity;
- total de posts locais com data válida;
- posts locais sem data original;
- quais posts seriam corrigidos;
- antes/depois de cada data;
- posts que exigem revisão manual.

Para corrigir de verdade, depois de revisar o dry-run:

```bash
cd sanity
node scripts/fix-post-dates.mjs --write
```

Esse script altera somente `dataPublicacao`. Ele não muda título, texto, imagem, slug, categoria ou qualquer outro campo. Também evita sobrescrever datas que parecem ter sido editadas manualmente: por padrão, só corrige datas ausentes, a data neutra antiga ou datas claramente vindas da importação incorreta.

Se alguma publicação não tiver fonte local confiável, edite a data manualmente no Studio.

## Limitações da solução sem build

- O navegador busca os dados públicos direto do Sanity.
- Não usamos token privado no front.
- Conteúdos privados/rascunhos não aparecem no site público.
- SEO de posts dinâmicos por query string é limitado em comparação com um build estático.
- O fallback local permanece útil durante a migração e para segurança.
