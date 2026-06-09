(function () {
  "use strict";

  const TYPE_ORDER = ["tag", "posicao", "time", "post", "prospect", "termo", "ranking", "dica", "tweet"];

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function makeTweetCard(tweet = {}) {
    const text = tweet.texto || tweet.text || "";
    const handle = tweet.handle || tweet.autorHandle || "";
    const name = tweet.nome || tweet.name || tweet.autorNome || "";
    const date = tweet.data || tweet.date || "";
    const link = tweet.link || tweet.tweetUrl || "";

    return `
      <aside class="tweet-card">
        <span class="tweet-card__label">Tweet citado</span>
        ${text ? `<p>${escapeHtml(text)}</p>` : ""}
        ${name || handle || date ? `<small>${escapeHtml([name, handle, date].filter(Boolean).join(" | "))}</small>` : ""}
        ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir no X</a>` : ""}
      </aside>
    `;
  }

  function createColmeiaView(options = {}) {
    const canvas = options.canvas;
    const graph = options.graph || { nodes: [], links: [] };
    const root = options.root || document;
    const chipsEl = options.chips || root.getElementById("chips");
    const legendEl = options.legend || root.getElementById("legend");
    const searchEl = options.search || root.getElementById("search");
    const resetEl = options.reset || root.getElementById("reset");
    const panel = options.panel || root.getElementById("panel");
    const panelContent = options.panelContent || root.getElementById("panelContent");
    const panelClose = options.panelClose || root.getElementById("panelClose");
    const loading = options.loading || root.getElementById("colmeia-loading");

    if (!canvas) throw new Error("Canvas da Colmeia nao encontrado");

    const css = getComputedStyle(document.body || document.documentElement);
    const v = (name) => css.getPropertyValue(name).trim();
    const C = {
      black: v("--black"),
      white: v("--white"),
      laranja: v("--laranja"),
      blue: v("--blue"),
      green: v("--green"),
      laranjaSoft: v("--col-laranja-soft"),
      bgSoft: v("--col-bg-soft"),
      muted: v("--col-muted"),
      hair: v("--col-hair"),
      edge: "rgba(244,244,241,.5)"
    };
    const FONT_DISPLAY = v("--font-display");
    const FONT_BODY = v("--font-body");
    const TYPES = {
      tag: { label: "Tag", color: C.laranja, hub: true },
      posicao: { label: "Posicao", color: C.laranja, hub: true },
      time: { label: "Time NBA", color: C.laranja, hub: true },
      post: { label: "Publicacao", color: C.white },
      prospect: { label: "Prospecto", color: C.blue },
      termo: { label: "Termo", color: C.green },
      ranking: { label: "Ranking", color: C.white, ring: true },
      dica: { label: "Dica", color: C.white, arrow: true },
      tweet: { label: "Tweet", color: C.white, quote: true }
    };

    const ctx = canvas.getContext("2d");
    const nodes = graph.nodes.map((node) => ({
      ...node,
      type: node.type || node.tipo,
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      vx: 0,
      vy: 0,
      deg: 0,
      fixed: false
    }));
    const byId = {};
    nodes.forEach((node) => { byId[node.id] = node; });

    const links = graph.links
      .map((link) => ({
        s: byId[link.source] || byId[link.s],
        t: byId[link.target] || byId[link.t],
        kind: link.kind || "tag",
        via: link.via || "",
        peso: link.peso || 1
      }))
      .filter((link) => link.s && link.t);

    links.forEach((link) => {
      link.s.deg += 1;
      link.t.deg += 1;
    });

    const adj = {};
    nodes.forEach((node) => { adj[node.id] = []; });
    links.forEach((link) => {
      adj[link.s.id].push({ node: link.t, link });
      adj[link.t.id].push({ node: link.s, link });
    });

    function radius(node) {
      const type = TYPES[node.type] || TYPES.post;
      if (type.hub) return 16 + Math.min(node.deg, 9) * 1.7;
      if (node.type === "tweet" || node.type === "ranking" || node.type === "dica") return 15;
      return 14;
    }
    nodes.forEach((node) => { node.r = radius(node); });

    let W = 0;
    let H = 0;
    let dpr = 1;
    let target = null;
    const view = { x: 0, y: 0, k: 1 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }

    window.addEventListener("resize", resize);
    resize();
    view.x = W / 2;
    view.y = H / 2;

    let alpha = 1;
    const ALPHA_DECAY = 0.03;
    const ALPHA_MIN = 0.005;
    function reheat(al) {
      alpha = Math.max(alpha, al || 0.5);
    }

    function step(al) {
      const REP = 26000;
      const SPRING = 0.045;
      const CENTER = 0.014;
      const DAMP = 0.86;

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) d2 = 0.01;
          const d = Math.sqrt(d2);
          const f = REP / d2;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      for (const link of links) {
        const sourceType = TYPES[link.s.type] || {};
        const targetType = TYPES[link.t.type] || {};
        const isHub = sourceType.hub || targetType.hub;
        const rest = link.kind === "manual" ? 78 : (isHub ? 96 : 110);
        const dx = link.t.x - link.s.x;
        const dy = link.t.y - link.s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const f = (d - rest) * SPRING;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        link.s.vx += fx;
        link.s.vy += fy;
        link.t.vx -= fx;
        link.t.vy -= fy;
      }

      for (const node of nodes) {
        const type = TYPES[node.type] || {};
        node.vx += -node.x * CENTER;
        node.vy += -node.y * CENTER;
        if (node.fixed) {
          node.vx = 0;
          node.vy = 0;
          continue;
        }
        node.vx *= DAMP;
        node.vy *= DAMP;
        const mass = (type.hub ? 0.55 : 1) * al;
        node.x += node.vx * mass;
        node.y += node.vy * mass;
      }
    }

    let hover = null;
    let focusId = null;
    let query = "";
    const hiddenTypes = {};
    let frame = null;

    function visibleNodes() {
      return nodes.filter((node) => !hiddenTypes[node.type]);
    }

    function isVisible(node) {
      return node && !hiddenTypes[node.type];
    }

    function fitView(animated) {
      const set = visibleNodes().length ? visibleNodes() : nodes;
      if (!set.length) return;

      let minX = 1e9;
      let minY = 1e9;
      let maxX = -1e9;
      let maxY = -1e9;

      for (const node of set) {
        minX = Math.min(minX, node.x - node.r);
        maxX = Math.max(maxX, node.x + node.r);
        minY = Math.min(minY, node.y - node.r);
        maxY = Math.max(maxY, node.y + node.r);
      }

      const pad = 100;
      const graphW = maxX - minX;
      const graphH = maxY - minY;
      let k = Math.min(W / (graphW + pad * 2), H / (graphH + pad * 2));
      k = Math.max(0.35, Math.min(k, 1.5));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const x = W / 2 - cx * k;
      const y = H / 2 - cy * k;

      if (animated) target = { x, y, k };
      else {
        view.x = x;
        view.y = y;
        view.k = k;
        target = null;
      }
    }

    function activeSet() {
      const key = focusId || hover;
      if (!key) return null;
      const set = new Set([key]);
      for (const edge of adj[key] || []) {
        if (isVisible(edge.node)) set.add(edge.node.id);
      }
      return set;
    }

    function searchSet() {
      if (!query) return null;
      const q = query.toLowerCase();
      const set = new Set();

      for (const node of nodes) {
        const type = TYPES[node.type] || {};
        if (type.hub) continue;
        const text = [node.label, node.body, node.slug, node.tweet?.texto, node.tweet?.text, node.tweet?.handle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (text.includes(q)) set.add(node.id);
      }

      return set;
    }

    function hex(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI / 180) * (60 * i - 90);
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    }

    function draw() {
      if (target) {
        view.x += (target.x - view.x) * 0.12;
        view.y += (target.y - view.y) * 0.12;
        view.k += (target.k - view.k) * 0.12;
        if (Math.abs(target.x - view.x) < 0.4 && Math.abs(target.k - view.k) < 0.002) target = null;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(view.x, view.y);
      ctx.scale(view.k, view.k);

      const active = activeSet();
      const search = searchSet();

      function nodeAlpha(node) {
        const type = TYPES[node.type] || {};
        if (!isVisible(node)) return 0;
        if (search && !type.hub && !search.has(node.id)) return 0.12;
        if (active && !active.has(node.id)) return 0.15;
        return 1;
      }

      function linkAlpha(link) {
        if (!isVisible(link.s) || !isVisible(link.t)) return 0;
        if (active) {
          const on = active.has(link.s.id) && active.has(link.t.id) && (focusId ? (link.s.id === focusId || link.t.id === focusId) : true);
          return on ? 1 : 0.06;
        }
        return link.kind === "manual" ? 0.85 : 1;
      }

      ctx.lineCap = "round";
      for (const link of links) {
        const alpha = linkAlpha(link);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(link.s.x, link.s.y);
        ctx.lineTo(link.t.x, link.t.y);
        if (link.kind === "manual") {
          ctx.strokeStyle = C.laranja;
          ctx.lineWidth = 1.7;
        } else {
          ctx.strokeStyle = C.edge;
          ctx.lineWidth = 0.9;
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const node of nodes) {
        const alpha = nodeAlpha(node);
        if (alpha <= 0) continue;
        const type = TYPES[node.type] || TYPES.post;
        const focused = node.id === focusId;
        ctx.globalAlpha = alpha;

        if (focused) {
          ctx.shadowColor = C.laranja;
          ctx.shadowBlur = 22;
        }
        hex(node.x, node.y, node.r);

        if (type.hub) {
          ctx.fillStyle = C.laranja;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(20,20,20,.6)";
          ctx.stroke();
        } else {
          ctx.fillStyle = C.bgSoft;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.lineWidth = focused ? 2 : 1.4;
          ctx.strokeStyle = type.color;
          ctx.stroke();
          if (type.ring) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3.4, 0, Math.PI * 2);
            ctx.fillStyle = C.laranja;
            ctx.fill();
          }
          if (type.quote) {
            ctx.fillStyle = type.color;
            ctx.font = `600 15px ${FONT_DISPLAY}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\u201d", node.x, node.y + 1);
          }
          if (type.arrow) {
            ctx.fillStyle = type.color;
            ctx.font = `600 13px ${FONT_DISPLAY}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\u2197", node.x, node.y);
          }
        }
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      const showAll = view.k > 0.92;
      for (const node of nodes) {
        const alpha = nodeAlpha(node);
        if (alpha <= 0.2) continue;
        const type = TYPES[node.type] || TYPES.post;
        const emphasized = (active && active.has(node.id)) || (search && search.has(node.id)) || node.id === focusId;
        if (!type.hub && !showAll && !emphasized) continue;

        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const y = node.y + node.r + 6;
        if (type.hub) {
          ctx.font = `700 12.5px ${FONT_DISPLAY}`;
          ctx.fillStyle = C.laranjaSoft;
        } else {
          ctx.font = `400 12px ${FONT_BODY}`;
          ctx.fillStyle = "rgba(244,244,241,.86)";
        }
        ctx.fillText(node.label || "", node.x, y);
      }
      ctx.globalAlpha = 1;

      if (alpha > ALPHA_MIN) {
        step(alpha);
        alpha *= (1 - ALPHA_DECAY);
      }
      frame = requestAnimationFrame(draw);
    }

    function screenToWorld(sx, sy) {
      return {
        x: (sx - view.x) / view.k,
        y: (sy - view.y) / view.k
      };
    }

    function pick(sx, sy) {
      const world = screenToWorld(sx, sy);
      let best = null;
      let bestDistance = 1e9;
      for (const node of nodes) {
        if (!isVisible(node)) continue;
        const dx = node.x - world.x;
        const dy = node.y - world.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < node.r + 4 && distance < bestDistance) {
          bestDistance = distance;
          best = node;
        }
      }
      return best;
    }

    let down = null;
    let dragNode = null;
    let moved = false;

    function localXY(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      };
    }

    function onPointerDown(event) {
      const point = localXY(event);
      down = point;
      moved = false;
      const node = pick(point.x, point.y);
      if (node) {
        dragNode = node;
        node.fixed = true;
        reheat(0.5);
      }
      canvas.classList.add("grabbing");
    }

    function onPointerMove(event) {
      const point = localXY(event);
      if (down) {
        if (Math.abs(point.x - down.x) + Math.abs(point.y - down.y) > 4) moved = true;
        if (dragNode) {
          const world = screenToWorld(point.x, point.y);
          dragNode.x = world.x;
          dragNode.y = world.y;
          dragNode.vx = 0;
          dragNode.vy = 0;
          reheat(0.3);
        } else {
          view.x += point.x - down.x;
          view.y += point.y - down.y;
          target = null;
          down = point;
        }
        return;
      }
      const node = pick(point.x, point.y);
      hover = node ? node.id : null;
      canvas.classList.toggle("pointer", Boolean(node));
    }

    function onPointerUp() {
      canvas.classList.remove("grabbing");
      if (down && !moved) {
        const node = pick(down.x, down.y);
        if (node) focusNode(node.id);
        else closePanel();
      }
      if (dragNode) dragNode.fixed = false;
      dragNode = null;
      down = null;
    }

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = localXY(event);
      const world = screenToWorld(point.x, point.y);
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      view.k = Math.max(0.35, Math.min(view.k * factor, 4.2));
      view.x = point.x - world.x * view.k;
      view.y = point.y - world.y * view.k;
      target = null;
    }, { passive: false });

    function mt(event) {
      const touch = event.touches[0] || event.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    canvas.addEventListener("touchstart", (event) => {
      canvas.dispatchEvent(new MouseEvent("mousedown", mt(event)));
    }, { passive: true });
    canvas.addEventListener("touchmove", (event) => {
      window.dispatchEvent(new MouseEvent("mousemove", mt(event)));
    }, { passive: true });
    canvas.addEventListener("touchend", () => {
      window.dispatchEvent(new MouseEvent("mouseup", {}));
    });

    function focusNode(id) {
      focusId = id;
      const node = byId[id];
      if (!node) return;
      const k = Math.max(view.k, 1.2);
      const desktop = window.innerWidth > 720;
      const cx = desktop ? (W - 360) / 2 : W / 2;
      const cy = desktop ? H / 2 : H * 0.34;
      target = { x: cx - node.x * k, y: cy - node.y * k, k };
      renderPanel(node);
      panel?.classList.add("open");
    }

    function closePanel() {
      focusId = null;
      panel?.classList.remove("open");
    }
    panelClose?.addEventListener("click", closePanel);

    function renderPanel(node) {
      if (!panelContent) return;
      const type = TYPES[node.type] || TYPES.post;
      let html = `<span class="badge"><span class="dot" style="background:${type.color}"></span>${type.label}</span>`;
      html += `<h2>${escapeHtml(node.label)}</h2>`;

      if (node.type === "tweet" && node.tweet) {
        html += makeTweetCard(node.tweet);
      } else if (node.body) {
        html += `<div class="body">${escapeHtml(node.body)}</div>`;
      }

      if (node.type === "dica" && node.link) {
        html += `<a class="ext" href="${escapeHtml(node.link)}" target="_blank" rel="noopener">Acessar \u2197</a>`;
      }

      const connections = (adj[node.id] || []).filter((edge) => isVisible(edge.node));
      if (connections.length) {
        html += `<div class="conn-title">Conexoes · ${connections.length}</div>`;
        connections.sort((a, b) => (a.link.kind === "manual" ? -1 : 1) - (b.link.kind === "manual" ? -1 : 1));
        for (const edge of connections) {
          const connectionType = TYPES[edge.node.type] || TYPES.post;
          const marker = edge.link.kind === "manual"
            ? `<span class="mk manual"></span>`
            : `<span class="mk" style="background:${connectionType.color}"></span>`;
          let via;
          if (edge.link.kind === "manual") {
            via = `<span class="via">${escapeHtml(edge.link.via || "editorial")}</span>`;
          } else {
            const hubNode = TYPES[edge.node.type]?.hub ? edge.node : (TYPES[node.type]?.hub ? node : null);
            via = `<span class="via">via ${escapeHtml(hubNode ? hubNode.label : "tag")}</span>`;
          }
          html += `<div class="conn" data-id="${edge.node.id}">${marker}<span class="lbl">${escapeHtml(edge.node.label)}</span>${via}</div>`;
        }
      }

      panelContent.innerHTML = html;
      panelContent.querySelectorAll(".conn").forEach((element) => {
        element.addEventListener("click", () => focusNode(element.getAttribute("data-id")));
      });
    }

    function renderChips() {
      if (!chipsEl) return;
      chipsEl.innerHTML = "";
      TYPE_ORDER.forEach((key) => {
        const type = TYPES[key];
        const chip = document.createElement("div");
        chip.className = "chip on";
        chip.dataset.type = key;
        chip.innerHTML = `<span class="dot" style="background:${type.color}"></span>${type.label}`;
        chip.addEventListener("click", () => {
          hiddenTypes[key] = !hiddenTypes[key];
          chip.classList.toggle("on", !hiddenTypes[key]);
          chip.classList.toggle("off", Boolean(hiddenTypes[key]));
          if (focusId && !isVisible(byId[focusId])) closePanel();
        });
        chipsEl.appendChild(chip);
      });
    }

    function renderLegend() {
      if (!legendEl) return;
      let html = "";
      TYPE_ORDER.forEach((key) => {
        const type = TYPES[key];
        html += `<div class="row"><span class="swatch" style="background:${type.color}"></span>${type.label}</div>`;
      });
      html += `<div class="row"><span class="ln"></span>Conexao editorial manual</div>`;
      legendEl.innerHTML = html;
    }

    searchEl?.addEventListener("input", (event) => {
      query = event.target.value.trim();
    });
    resetEl?.addEventListener("click", () => {
      closePanel();
      query = "";
      if (searchEl) searchEl.value = "";
      fitView(true);
    });

    renderChips();
    renderLegend();
    for (let i = 0; i < 600; i += 1) step(1);
    alpha = 0.08;
    fitView(false);
    if (loading) loading.hidden = true;
    frame = requestAnimationFrame(draw);

    return {
      destroy() {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
      },
      focusNode,
      closePanel,
      fitView
    };
  }

  window.T3ColmeiaView = {
    TYPES: TYPE_ORDER,
    createColmeiaView
  };
})();
