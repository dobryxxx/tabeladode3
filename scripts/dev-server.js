const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff": "font/woff",
  ".woff2": "font/woff2", ".mp4": "video/mp4"
};
const publicFolders = new Set(["js", "css", "img", "fonts", "data", "assets"]);

function createPreviewServer() {
  return http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, {Allow: "GET, HEAD"});
      return res.end();
    }
    try {
      const page = new URL(req.url, `http://${req.headers.host}`);
      const pathname = decodeURIComponent(page.pathname);
      if (["/studio", "/studio/", "/admin", "/admin/"].includes(pathname)) {
        res.writeHead(302, {Location: "http://127.0.0.1:3333/"});
        return res.end();
      }
      if (pathname === "/tabelado-de-3.html") {
        res.writeHead(302, {Location: "/"});
        return res.end();
      }
      const relative = pathname === "/" ? "index.html" : pathname === "/artigo" ? "artigo.html" : pathname.slice(1);
      const parts = relative.split(/[\\/]/);
      if (parts.some((part) => part.startsWith(".")) || (parts.length > 1 && !publicFolders.has(parts[0]))) {
        res.writeHead(404); return res.end("Arquivo não encontrado.");
      }
      const ext = path.extname(relative).toLowerCase();
      if (!mime[ext]) { res.writeHead(404); return res.end(); }
      const file = await fs.realpath(path.resolve(root, relative));
      if (!file.startsWith(root + path.sep)) { res.writeHead(404); return res.end(); }
      let body = await fs.readFile(file);
      if (ext === ".html") {
        let html = body.toString("utf8").replaceAll("https://tabeladode3.sanity.studio/", "http://127.0.0.1:3333/");
        if (relative === "artigo.html" && page.searchParams.has("post")) {
          const {renderArticlePreview} = await import("./article-preview.mjs");
          html = await renderArticlePreview(html, page, async () => {
            const archive = await fs.readFile(path.join(root, "data", "posts.json"), "utf8");
            return JSON.parse(archive.replace(/^\uFEFF/, ""));
          });
        }
        body = Buffer.from(html);
      }
      res.writeHead(200, {"Content-Type": mime[ext], "Content-Length": body.length});
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404); res.end("Arquivo não encontrado.");
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8000);
  createPreviewServer().listen(port, "127.0.0.1", () => {
    console.log(`Site local sem cache: http://127.0.0.1:${port}`);
    console.log("Editor local: npm run dev:studio (http://127.0.0.1:3333)");
  });
}
module.exports = {createPreviewServer};
