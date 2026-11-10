const test = require("node:test");
const assert = require("node:assert/strict");
const {once} = require("node:events");
const {createPreviewServer} = require("../scripts/dev-server");

test("Local preview serves current code without cache and keeps editor navigation local", async (t) => {
  const server = createPreviewServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base + "/por-escrito.html");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("cache-control"), /no-store/);
  const html = await page.text();
  assert.match(html, /http:\/\/127\.0\.0\.1:3333\//);
  assert.doesNotMatch(html, /https:\/\/tabeladode3.sanity.studio\//);
  const code = await fetch(base + "/js/main.js?v=test", {headers: {"If-Modified-Since": "Fri, 01 Jan 2100 00:00:00 GMT"}});
  assert.equal(code.status, 200);
  assert.match(await code.text(), /function destaquesDaCategoria/);
  for (const url of ["/.env", "/sanity/.env", "/.git/config", "/js/%2e%2e%5c.env"]) {
    assert.equal((await fetch(base + url)).status, 404);
  }
  const studio = await fetch(base + "/studio", {redirect: "manual"});
  assert.equal(studio.headers.get("location"), "http://127.0.0.1:3333/");
});
