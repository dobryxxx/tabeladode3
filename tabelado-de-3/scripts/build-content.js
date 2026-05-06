const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "content", "posts");
const outputFile = path.join(root, "js", "cms-posts.js");

function parseFrontmatter(source) {
  source = source.replace(/^\uFEFF/, "");
  if (!source.startsWith("---")) return { data: {}, body: source };

  const end = source.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: source };

  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4).trim();
  const data = {};
  let currentKey = null;

  raw.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;

    const listMatch = line.match(/^\s+-\s+(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(cleanValue(listMatch[1]));
      return;
    }

    const pair = line.match(/^([^:]+):\s*(.*)$/);
    if (!pair) return;

    currentKey = pair[1].trim();
    const value = pair[2].trim();
    data[currentKey] = value ? cleanValue(value) : "";
  });

  return { data, body };
}

function cleanValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToParagraphs(markdown = "") {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^#{1,6}\s+/.test(block)) {
        return `<strong>${inlineMarkdown(block.replace(/^#{1,6}\s+/, ""))}</strong>`;
      }

      if (/^[-*]\s+/m.test(block)) {
        return block
          .split(/\r?\n/)
          .map((line) => line.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean)
          .map((line) => `• ${inlineMarkdown(line)}`)
          .join("<br/>");
      }

      return inlineMarkdown(block.replace(/\r?\n/g, "<br/>"));
    });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date).replace(".", ".");
}

function slugFromFilename(file) {
  return path.basename(file, path.extname(file));
}

function normalizeImage(image = "") {
  if (!image) return "";
  return image.startsWith("/") ? image.slice(1) : image;
}

function readPosts() {
  if (!fs.existsSync(postsDir)) return [];

  return fs.readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(postsDir, file);
      const { data, body } = parseFrontmatter(fs.readFileSync(fullPath, "utf8"));
      if (!data.title) return null;

      return {
        titulo: data.title,
        categoria: data.category || "ultimas",
        data: formatDate(data.date),
        dataOriginal: data.date || "",
        tempoLeitura: data.readingTime || "",
        imagem: normalizeImage(data.image),
        excerpt: data.excerpt || "",
        autor: data.author || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        slug: data.slug || slugFromFilename(file),
        corpo: markdownToParagraphs(body),
        destaque: Boolean(data.featured),
        lateral: Boolean(data.side)
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.dataOriginal).localeCompare(String(a.dataOriginal)));
}

const posts = readPosts();
const output = `const cmsPosts = ${JSON.stringify(posts, null, 2)};\n`;

fs.writeFileSync(outputFile, output, "utf8");
console.log(`CMS: ${posts.length} post(s) gerado(s) em js/cms-posts.js`);
