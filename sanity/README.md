# Sanity Studio - Tabelado de 3

Este Studio é o painel editorial do site. Ele não altera o front público, que continua estático em HTML/CSS/JS puro.

## Rodar localmente

1. Entre na pasta `sanity`.
2. Copie `.env.example` para `.env`.
3. Preencha `SANITY_STUDIO_PROJECT_ID` e `SANITY_STUDIO_DATASET`.
4. Rode:

```bash
npm install
npm run dev
```

## Publicar o Studio

```bash
npm run deploy
```

## Tipos principais

- Publicações
- Prospectos do Draft
- Rankings
- Termos do Glossário
- Categorias
- Autores
- Configurações da Home
- Configurações gerais do site

O site público lê apenas dados publicados e públicos, sem token privado no navegador.
