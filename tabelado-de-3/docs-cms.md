# Guia rápido do CMS

## Como acessar

1. Abra `https://SEU-SITE.netlify.app/admin`.
2. Entre com o e-mail autorizado no Netlify Identity.
3. Clique em `Posts`.

## Configuração inicial no Netlify

1. Suba a pasta `tabelado-de-3` para um repositório no GitHub.
2. No Netlify, crie um site com `Add new site > Import an existing project`.
3. Conecte o GitHub e selecione o repositório.
4. Use:
   - Build command: `npm run build`
   - Publish directory: `.`
5. Depois do primeiro deploy, ative `Identity`.
6. Em `Identity > Services`, ative `Git Gateway`.
7. Convide o e-mail do cliente em `Identity > Invite users`.
8. Em `Forms > Form notifications`, configure o e-mail que receberá as mensagens de contato.

## Como criar um post

1. Clique em `New Post`.
2. Preencha título, slug, data, categoria, resumo, imagem, autor, tempo de leitura e corpo do texto.
3. Use `Save` para salvar.
4. Use `Publish` para publicar.

## Como subir imagem

No campo `Imagem principal`, clique para enviar o arquivo. O CMS salva a imagem em `assets/uploads` e usa esse caminho no site.

## Como editar post existente

Entre em `/admin`, abra `Posts`, selecione o post, altere os campos e publique novamente.

## Como ver mensagens do contato

No painel da Netlify, abra o site e vá em `Forms`. As mensagens enviadas pelo formulário aparecem ali. Para receber por e-mail, configure notificações em `Forms > Form notifications`.

## Observação

O site continua estático. No deploy, o Netlify roda `npm run build`, lê os arquivos em `content/posts` e gera `js/cms-posts.js`.
