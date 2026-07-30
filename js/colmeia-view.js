(function () {
  "use strict";

  const TYPE_ORDER = ["tag", "post", "tweet"];

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeSearch(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
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
    const listToggle = options.listToggle || root.getElementById("listToggle");
    const mobileList = options.mobileList || root.getElementById("mobileList");
    const mobileListContent = options.mobileListContent || root.getElementById("mobileListContent");
    const catalogClose = options.catalogClose || root.getElementById("catalogClose");
    const catalogSummary = options.catalogSummary || root.getElementById("catalogSummary");
    const searchStatus = options.searchStatus || root.getElementById("searchStatus");
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
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    const TYPES = {
      tag: { label: "Tag", color: C.laranja, hub: true },
      post: { label: "Publicação", color: C.white },
      tweet: { label: "Tweet", color: C.white, quote: true }
    };

    const ctx = canvas.getContext("2d");
    const rawNodes = graph.nodes;
    const catalogNodes = (graph.catalogNodes || rawNodes)
      .filter((node) => (node.type || node.tipo) !== "tag")
      .map((node) => ({...node, type: node.type || node.tipo}));
    const catalogById = {};
    catalogNodes.forEach((node) => { catalogById[node.id] = node; });
    const nodes = rawNodes.map((node, i) => {
      const angle = (i / rawNodes.length) * 2 * Math.PI;
      return {
        ...node,
        type: node.type || node.tipo,
        x: Math.cos(angle) * 400,
        y: Math.sin(angle) * 400,
        vx: 0,
        vy: 0,
        deg: 0,
        fixed: false
      };
    });
    const byId = {};
    nodes.forEach((node) => { byId[node.id] = node; });
    const searchableById = {};
    nodes.forEach((node) => {
      searchableById[node.id] = normalizeSearch([
        node.label,
        node.body,
        node.slug,
        ...(node.tags || []),
        node.tweet?.texto,
        node.tweet?.text,
        node.tweet?.handle
      ].filter(Boolean).join(" "));
    });

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
    const MIN_ZOOM = 0.45;
    const MAX_ZOOM = 4.2;
    let frame = null;

    function requestDraw() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        draw();
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      requestDraw();
    }

    window.addEventListener("resize", resize);
    resize();
    view.x = W / 2;
    view.y = H / 2;

    let alpha = 1;
    const ALPHA_DECAY = 0.025;
    const ALPHA_MIN = 0.005;
    function reheat(al) {
      alpha = Math.max(alpha, al || 0.5);
      requestDraw();
    }

    function setQuery(texto = "") {
      query = normalizeSearch(texto);
      searchMatches = query
        ? new Set(nodes.filter((node) => searchableById[node.id].includes(query)).map((node) => node.id))
        : null;
      fitView(false);
      renderCatalog();
      if (query) setCatalogOpen(true);
      requestDraw();
    }

    function setTypeHidden(type, hidden) {
      if (!TYPES[type]) return;
      const visibleTypeCount = TYPE_ORDER.filter((key) => !hiddenTypes[key]).length;
      if (hidden && !hiddenTypes[type] && visibleTypeCount <= 1) {
        if (searchStatus) searchStatus.textContent = "Mantenha pelo menos um tipo visível.";
        return;
      }
      hiddenTypes[type] = Boolean(hidden);
      if (!hiddenTypes[type]) delete hiddenTypes[type];
      if (focusId && !isVisible(byId[focusId])) closePanel();
      renderCatalog();
      requestDraw();
    }

    function toggleType(type) {
      setTypeHidden(type, !hiddenTypes[type]);
      return Boolean(hiddenTypes[type]);
    }

    function resetFilters() {
      Object.keys(hiddenTypes).forEach((type) => { delete hiddenTypes[type]; });
      renderCatalog();
      requestDraw();
    }

    function recenter() {
      closePanel();
      fitView(true);
      requestDraw();
    }

    function step(al) {
      const REP = 26000;
      const SPRING = 0.045;
      const CENTER = 0.022;
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
        const hubDeg = Math.max(link.s.deg, link.t.deg);
        const megaHub = isHub && hubDeg >= 20;
        const rest = link.kind === "manual"
          ? 78
          : (link.kind === "suggested" ? 104 : (megaHub ? 70 : (isHub ? 96 : 110)));
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
        const centerPull = (type.hub && node.deg < 5) ? CENTER * 2.0 : CENTER;
        node.vx += -node.x * centerPull;
        node.vy += -node.y * centerPull;
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
    let searchMatches = null;
    const hiddenTypes = {};

    function visibleNodes() {
      return nodes.filter((node) => !hiddenTypes[node.type]);
    }

    function isVisible(node) {
      return node && !hiddenTypes[node.type];
    }

    function fitView(animated) {
      if (reducedMotion) animated = false;
      const matched = searchMatches?.size
        ? nodes.filter((node) => searchMatches.has(node.id) && isVisible(node))
        : [];
      const all = matched.length ? matched : (visibleNodes().length ? visibleNodes() : nodes);
      if (!all.length) return;

      // Compute centroid and std-dev to exclude outliers from the bounding box.
      let sumX = 0;
      let sumY = 0;
      for (const node of all) { sumX += node.x; sumY += node.y; }
      const meanX = sumX / all.length;
      const meanY = sumY / all.length;

      let varX = 0;
      let varY = 0;
      for (const node of all) {
        varX += (node.x - meanX) ** 2;
        varY += (node.y - meanY) ** 2;
      }
      const stdX = Math.sqrt(varX / all.length);
      const stdY = Math.sqrt(varY / all.length);
      const limitX = (stdX || 1e4) * 2.5;
      const limitY = (stdY || 1e4) * 2.5;

      const core = all.filter(
        (node) => Math.abs(node.x - meanX) <= limitX && Math.abs(node.y - meanY) <= limitY
      );
      const set = core.length ? core : all;

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

      const pad = 80;
      const graphW = maxX - minX;
      const graphH = maxY - minY;
      let k = Math.min(W / (graphW + pad * 2), H / (graphH + pad * 2));
      k = Math.max(MIN_ZOOM, Math.min(k, 1.5));
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
      requestDraw();
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
      return searchMatches;
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
        if (!isVisible(node)) return 0;
        if (search && !search.has(node.id)) return 0.12;
        if (active && !active.has(node.id)) return 0.15;
        return 1;
      }

      function linkAlpha(link) {
        if (!isVisible(link.s) || !isVisible(link.t)) return 0;
        if (search && !search.has(link.s.id) && !search.has(link.t.id)) return 0.06;
        if (active) {
          const on = active.has(link.s.id) && active.has(link.t.id) && (focusId ? (link.s.id === focusId || link.t.id === focusId) : true);
          return on ? 1 : 0.06;
        }
        if (link.kind === "manual") return 0.85;
        if (link.kind === "suggested") return 0.58;
        return 1;
      }

      ctx.lineCap = "round";
      for (const link of links) {
        const alpha = linkAlpha(link);
        if (alpha <= 0) continue;
        const isMegaHub = link.kind !== "manual" &&
          (TYPES[link.s.type]?.hub || TYPES[link.t.type]?.hub) &&
          Math.max(link.s.deg, link.t.deg) >= 20;
        ctx.globalAlpha = isMegaHub ? alpha * 0.55 : alpha;
        ctx.setLineDash(link.kind === "suggested" ? [7, 6] : []);
        ctx.beginPath();
        ctx.moveTo(link.s.x, link.s.y);
        ctx.lineTo(link.t.x, link.t.y);
        if (link.kind === "manual") {
          ctx.strokeStyle = C.laranja;
          ctx.lineWidth = 1.7;
        } else if (link.kind === "suggested") {
          ctx.strokeStyle = C.laranja;
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = C.edge;
          ctx.lineWidth = isMegaHub ? 0.6 : 0.9;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
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
      const labelBoxes = [];
      const labelNodes = [...nodes].sort((a, b) => {
        const aEmphasized = Number((active && active.has(a.id)) || (search && search.has(a.id)) || a.id === focusId);
        const bEmphasized = Number((active && active.has(b.id)) || (search && search.has(b.id)) || b.id === focusId);
        return bEmphasized - aEmphasized || b.deg - a.deg;
      });
      for (const node of labelNodes) {
        const alpha = nodeAlpha(node);
        if (alpha <= 0.2) continue;
        const type = TYPES[node.type] || TYPES.post;
        const emphasized = (active && active.has(node.id)) || (search && search.has(node.id)) || node.id === focusId;
        const keyNode = node.deg >= 3 && view.k >= MIN_ZOOM;
        if (!type.hub && !showAll && !emphasized && !keyNode) continue;

        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const y = node.y + node.r + 6;
        if (type.hub) {
          ctx.font = `700 12.5px ${FONT_DISPLAY}`;
          ctx.fillStyle = C.laranjaSoft;
        } else {
          const labelSize = showAll ? 12 : Math.min(23, 10.5 / view.k);
          ctx.font = `400 ${labelSize}px ${FONT_BODY}`;
          ctx.fillStyle = "rgba(244,244,241,.86)";
        }
        const fullLabel = node.label || "";
        const displayLabel = fullLabel.length > 42 ? `${fullLabel.slice(0, 39).trim()}...` : fullLabel;
        const metrics = ctx.measureText(displayLabel);
        const labelHeight = type.hub ? 15 : (showAll ? 15 : 13 / view.k);
        const box = {
          left: node.x - metrics.width / 2 - 3 / view.k,
          right: node.x + metrics.width / 2 + 3 / view.k,
          top: y - 2 / view.k,
          bottom: y + labelHeight + 2 / view.k
        };
        const overlaps = labelBoxes.some((other) =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top
        );
        if (overlaps && !emphasized) continue;
        labelBoxes.push(box);
        ctx.fillText(displayLabel, node.x, y);
      }
      ctx.globalAlpha = 1;

      let keepAnimating = Boolean(target);
      if (alpha > ALPHA_MIN) {
        step(alpha);
        alpha *= (1 - ALPHA_DECAY);
        keepAnimating = true;
      }
      if (keepAnimating) requestDraw();
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
    let touchMode = null;
    let pinchDistance = 0;
    let listOpen = false;
    let lastTrigger = null;
    let panelCloseTimer = null;
    const backgroundElements = [
      root.querySelector(".td3-site-header"),
      root.querySelector(".shell"),
      root.getElementById("stage"),
      root.querySelector(".colmeia-footer")
    ].filter(Boolean);

    function setBackgroundInert(inert) {
      backgroundElements.forEach((element) => {
        element.inert = Boolean(inert);
      });
    }

    function focusableElements(container) {
      if (!container) return [];
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
      )).filter((element) => !element.hidden && element.getClientRects().length > 0);
    }

    function trapFocus(event, container) {
      if (event.key !== "Tab") return false;
      const focusable = focusableElements(container);
      if (!focusable.length) return false;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return true;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
        return true;
      }
      return false;
    }

    function localXY(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      };
    }

    function touchXY(touch) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    function touchMidpoint(touches) {
      const a = touchXY(touches[0]);
      const b = touchXY(touches[1]);
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
      };
    }

    function touchDistance(touches) {
      const a = touchXY(touches[0]);
      const b = touchXY(touches[1]);
      return Math.hypot(a.x - b.x, a.y - b.y);
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
          requestDraw();
        }
        return;
      }
      const node = pick(point.x, point.y);
      const nextHover = node ? node.id : null;
      if (hover !== nextHover) {
        hover = nextHover;
        requestDraw();
      }
      canvas.classList.toggle("pointer", Boolean(node));
    }

    function onPointerUp() {
      canvas.classList.remove("grabbing");
      if (down && !moved) {
        const node = pick(down.x, down.y);
        if (node) {
          lastTrigger = listToggle;
          focusNode(node.id);
        }
        else closePanel();
      }
      if (dragNode) dragNode.fixed = false;
      dragNode = null;
      down = null;
    }

    function releaseDragNode() {
      if (dragNode) dragNode.fixed = false;
      dragNode = null;
    }

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = localXY(event);
      const world = screenToWorld(point.x, point.y);
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      view.k = Math.max(MIN_ZOOM, Math.min(view.k * factor, MAX_ZOOM));
      view.x = point.x - world.x * view.k;
      view.y = point.y - world.y * view.k;
      target = null;
      requestDraw();
    }, { passive: false });

    canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      target = null;
      if (event.touches.length >= 2) {
        releaseDragNode();
        touchMode = "pinch";
        pinchDistance = touchDistance(event.touches);
        moved = true;
        canvas.classList.add("grabbing");
        return;
      }

      const point = touchXY(event.touches[0]);
      down = point;
      moved = false;
      touchMode = "single";
      const node = pick(point.x, point.y);
      if (node) {
        dragNode = node;
        node.fixed = true;
        reheat(0.5);
      }
      canvas.classList.add("grabbing");
    }, { passive: false });

    canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();
      if (touchMode === "pinch" && event.touches.length >= 2) {
        const midpoint = touchMidpoint(event.touches);
        const distance = touchDistance(event.touches);
        if (pinchDistance > 0) {
          const world = screenToWorld(midpoint.x, midpoint.y);
          const factor = distance / pinchDistance;
          view.k = Math.max(MIN_ZOOM, Math.min(view.k * factor, MAX_ZOOM));
          view.x = midpoint.x - world.x * view.k;
          view.y = midpoint.y - world.y * view.k;
          requestDraw();
        }
        pinchDistance = distance;
        target = null;
        return;
      }

      if (touchMode !== "single" || !event.touches.length || !down) return;
      const point = touchXY(event.touches[0]);
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
        requestDraw();
      }
    }, { passive: false });

    canvas.addEventListener("touchend", (event) => {
      event.preventDefault();
      const endedMode = touchMode;
      canvas.classList.remove("grabbing");
      if (touchMode === "single" && down && !moved) {
        const node = pick(down.x, down.y);
        if (node) {
          lastTrigger = listToggle;
          focusNode(node.id);
        }
        else closePanel();
      }
      releaseDragNode();
      down = null;
      pinchDistance = 0;
      touchMode = null;
      if (endedMode === "pinch") return;
    }, { passive: false });
    canvas.addEventListener("touchcancel", (event) => {
      event.preventDefault();
      canvas.classList.remove("grabbing");
      releaseDragNode();
      down = null;
      pinchDistance = 0;
      touchMode = null;
    }, { passive: false });

    function focusNode(id) {
      focusId = id;
      const node = byId[id] || catalogById[id];
      if (!node) return;
      setCatalogOpen(false);

      if (byId[id]) {
        const k = Math.max(view.k, 1.2);
        const desktop = window.innerWidth > 720;
        const cx = desktop ? (W - 360) / 2 : W / 2;
        const cy = desktop ? H / 2 : H * 0.34;
        if (reducedMotion) {
          view.x = cx - node.x * k;
          view.y = cy - node.y * k;
          view.k = k;
          target = null;
        } else {
          target = { x: cx - node.x * k, y: cy - node.y * k, k };
        }
      }

      renderPanel(node);
      if (panel) {
        window.clearTimeout(panelCloseTimer);
        panel.hidden = false;
        panel.inert = false;
        panel.setAttribute("aria-hidden", "false");
        setBackgroundInert(true);
        requestAnimationFrame(() => {
          panel.classList.add("open");
          panelClose?.focus();
        });
      }
      requestDraw();
    }

    function closePanel(restoreFocus = true) {
      focusId = null;
      if (panel) {
        panel.classList.remove("open");
        panel.inert = true;
        panel.setAttribute("aria-hidden", "true");
        setBackgroundInert(false);
        window.clearTimeout(panelCloseTimer);
        panelCloseTimer = window.setTimeout(() => {
          if (!panel.classList.contains("open")) panel.hidden = true;
        }, reducedMotion ? 0 : 430);
      }
      if (restoreFocus) {
        const triggerIsVisible = lastTrigger?.isConnected &&
          !lastTrigger.closest?.("[hidden]") &&
          lastTrigger.getClientRects?.().length;
        if (triggerIsVisible) lastTrigger.focus();
        else listToggle?.focus();
      }
      requestDraw();
    }
    if (panelClose) panelClose.onclick = closePanel;

    function connectionsHtml(node) {
      const connections = (adj[node.id] || []).filter((edge) => isVisible(edge.node));
      let html = "";
      if (connections.length) {
        html += `<div class="conn-title">Conexões &middot; ${connections.length}</div>`;
        const connectionPriority = { manual: 0, suggested: 1, tag: 2 };
        connections.sort((a, b) =>
          (connectionPriority[a.link.kind] ?? 3) - (connectionPriority[b.link.kind] ?? 3)
        );
        for (const edge of connections) {
          const connectionType = TYPES[edge.node.type] || TYPES.post;
          const marker = edge.link.kind === "manual"
            ? `<span class="mk manual"></span>`
            : edge.link.kind === "suggested"
              ? `<span class="mk suggested"></span>`
            : `<span class="mk" style="background:${connectionType.color}"></span>`;
          let via;
          if (edge.link.kind === "manual") {
            via = `<span class="via">${escapeHtml(edge.link.via || "editorial")}</span>`;
          } else if (edge.link.kind === "suggested") {
            via = `<span class="via">sugerida &middot; ${escapeHtml(edge.link.via || "curadoria editorial")}</span>`;
          } else {
            const hubNode = TYPES[edge.node.type]?.hub ? edge.node : (TYPES[node.type]?.hub ? node : null);
            via = `<span class="via">via ${escapeHtml(hubNode ? hubNode.label : "tag")}</span>`;
          }
          html += `<button class="conn" type="button" data-id="${escapeHtml(edge.node.id)}">${marker}<span class="lbl">${escapeHtml(edge.node.label)}</span>${via}</button>`;
        }
      } else {
        html = '<p class="connections-empty">Este conteúdo ainda não possui conexões publicadas.</p>';
      }
      return html;
    }

    function bindConnectionClicks(container) {
      container?.querySelectorAll(".conn").forEach((element) => {
        element.onclick = () => {
          lastTrigger = element;
          focusNode(element.getAttribute("data-id"));
        };
      });
    }

    function renderPanel(node) {
      if (!panelContent) return;
      const type = TYPES[node.type] || TYPES.post;
      let html = `<span class="badge"><span class="dot" style="background:${type.color}"></span>${type.label}</span>`;
      html += `<h2 id="panelTitle">${escapeHtml(node.label)}</h2>`;

      if (node.type === "tweet" && node.tweet) {
        html += makeTweetCard(node.tweet);
      } else if (node.body) {
        html += `<div class="body">${escapeHtml(node.body)}</div>`;
      }

      if (node.href) {
        const external = /^https?:\/\//i.test(node.href);
        html += `<a class="ext" href="${escapeHtml(node.href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>Abrir conteúdo \u2197</a>`;
      }

      html += connectionsHtml(node);

      panelContent.innerHTML = html;
      bindConnectionClicks(panelContent);
    }

    function nodeMatchesQuery(node) {
      if (hiddenTypes[node.type]) return false;
      if (!query) return true;

      const searchable = [
        node.label,
        node.body,
        node.slug,
        ...(node.tags || []),
        node.tweet?.texto,
        node.tweet?.handle
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeSearch(searchable).includes(query);
    }

    function renderCatalog() {
      if (!mobileListContent) return;
      const matches = catalogNodes
        .filter(nodeMatchesQuery)
        .sort((a, b) => String(a.label).localeCompare(String(b.label), "pt-BR"));
      const connectedCount = matches.filter((node) => Boolean(byId[node.id])).length;

      if (catalogSummary) {
        catalogSummary.textContent = query
          ? `${matches.length} resultado${matches.length === 1 ? "" : "s"}`
          : `${matches.length} conteúdos · ${connectedCount} conectados`;
      }
      if (searchStatus) {
        searchStatus.textContent = query
          ? `${matches.length} resultado${matches.length === 1 ? "" : "s"} encontrado${matches.length === 1 ? "" : "s"}`
          : `${matches.length} conteúdos disponíveis`;
      }

      if (!matches.length) {
        mobileListContent.innerHTML = `
          <div class="catalog-empty">
            <strong>Nenhum conteúdo encontrado.</strong>
            <span>Tente outro termo ou reative um filtro.</span>
          </div>
        `;
        return;
      }

      mobileListContent.innerHTML = matches.map((node) => {
        const type = TYPES[node.type] || TYPES.post;
        const connected = Boolean(byId[node.id]);
        return `
          <button class="catalog-item" type="button" data-id="${escapeHtml(node.id)}">
            <span class="catalog-item__type"><span class="dot" style="background:${type.color}"></span>${escapeHtml(type.label)}</span>
            <strong>${escapeHtml(node.label)}</strong>
            <span class="catalog-item__status">${connected ? "no mapa" : "somente no catálogo"}</span>
          </button>
        `;
      }).join("");

      mobileListContent.querySelectorAll(".catalog-item").forEach((element) => {
        element.onclick = () => {
          lastTrigger = element;
          focusNode(element.getAttribute("data-id"));
        };
      });
    }

    function setCatalogOpen(open, focusFirst = false) {
      listOpen = Boolean(open);
      listToggle?.setAttribute("aria-expanded", String(listOpen));
      if (listToggle) {
        const mobile = window.matchMedia?.("(max-width: 720px)")?.matches;
        listToggle.textContent = listOpen
          ? (mobile ? "ver mapa" : "fechar catálogo")
          : "ver catálogo";
      }
      mobileList?.classList.toggle("is-open", listOpen);
      document.body.classList.toggle("catalog-open", listOpen);
      if (mobileList) mobileList.hidden = !listOpen;
      if (listOpen) {
        closePanel(false);
        renderCatalog();
        if (focusFirst) mobileListContent?.querySelector(".catalog-item")?.focus();
      }
    }

    function renderChips() {
      if (!chipsEl) return;
      chipsEl.innerHTML = "";
      TYPE_ORDER.forEach((key) => {
        const type = TYPES[key];
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip on";
        chip.dataset.type = key;
        chip.setAttribute("aria-pressed", "true");
        chip.innerHTML = `<span class="dot" style="background:${type.color}"></span>${type.label}`;
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
      html += `<div class="row"><span class="ln"></span>Conexão editorial manual</div>`;
      html += `<div class="row"><span class="ln suggested"></span>Conexão sugerida</div>`;
      legendEl.innerHTML = html;
    }

    if (listToggle) {
      listToggle.onclick = () => {
        lastTrigger = listToggle;
        setCatalogOpen(!listOpen, !listOpen);
      };
    }
    if (catalogClose) {
      catalogClose.onclick = () => {
        setCatalogOpen(false);
        listToggle?.focus();
      };
    }

    function onKeyDown(event) {
      if (panel?.classList.contains("open") && trapFocus(event, panel)) return;
      if (event.key !== "Escape") return;
      if (listOpen) {
        setCatalogOpen(false);
        listToggle?.focus();
        return;
      }
      if (panel?.classList.contains("open")) closePanel();
    }
    window.addEventListener("keydown", onKeyDown);

    renderChips();
    renderLegend();
    renderCatalog();
    // Grafos com varios componentes precisam estabilizar antes do primeiro
    // enquadramento; caso contrario, continuam se afastando depois do fit.
    const initialSteps = Math.min(240, Math.max(100, nodes.length * 5));
    for (let i = 0; i < initialSteps; i += 1) step(1);
    alpha = reducedMotion ? ALPHA_MIN : 0.08;
    fitView(false);
    if (loading) loading.hidden = true;
    if (panel) panel.inert = true;
    if (window.matchMedia?.("(max-width: 720px)")?.matches) {
      setCatalogOpen(true, false);
    }
    requestDraw();

    return {
      destroy() {
        if (frame !== null) cancelAnimationFrame(frame);
        window.clearTimeout(panelCloseTimer);
        setBackgroundInert(false);
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
      },
      focusNode,
      closePanel,
      fitView,
      fit: fitView,
      recenter,
      setQuery,
      toggleType,
      setTypeHidden,
      resetFilters,
      openCatalog: (focusFirst = false) => setCatalogOpen(true, focusFirst)
    };
  }

  window.T3ColmeiaView = {
    TYPES: TYPE_ORDER,
    createColmeiaView
  };
})();
