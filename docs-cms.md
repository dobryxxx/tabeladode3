# Guia rápido do CMS

## Como acessar

1. Abra `https://SEU-SITE.netlify.app/admin`.
2. Entre com o e-mail autorizado no Netlify Identity.
3. Abra `Conteúdo do site > Publicações`.

## Configuração inicial no Netlify

1. O site deve continuar com:
   - Build command: vazio
   - Publish directory: `.`
2. Em `Identity`, clique em `Enable Identity`.
3. Em `Identity > Services`, ative `Git Gateway`.
4. Em `Identity > Invite users`, convide o e-mail do cliente.
5. Em `Site configuration > Forms > Form notifications`, crie a notificação por e-mail para o formulário `contato`.

## Como criar um post

1. Entre em `/admin`.
2. Abra `Conteúdo do site > Publicações`.
3. Clique em `Add posts`.
4. Preencha título, resumo, data, categoria, imagem, autor, tempo de leitura, slug e corpo do texto.
5. Salve e publique.

## Como subir imagem

No campo `Imagem principal`, escolha ou envie um arquivo. O Decap CMS salva em `assets/uploads` e grava o caminho no post.

## Como editar post existente

Entre em `/admin`, abra `Publicações`, selecione o post na lista, altere os campos e publique novamente.

## Como o site lê os dados

O site é estático e não precisa de build. Os posts ficam em `data/posts.json`, e `js/main.js` carrega esse arquivo no navegador para montar os cards e artigos.

Se `data/posts.json` não carregar por algum motivo, o site usa `js/conteudo.js` como fallback.

## Como ver mensagens do contato

No painel da Netlify, abra `Forms` e selecione o formulário `contato`. Para receber por e-mail, use `Form notifications`.
