(function () {
  const TYPES = {
    post: { label: "post", group: "content" },
    prospect: { label: "prospect", group: "prospect" },
    termo: { label: "termo", group: "termo" },
    ranking: { label: "ranking", group: "content" },
    dica: { label: "dica", group: "content" },
    tweet: { label: "tweet", group: "tweet" },
    tag: { label: "tag", group: "hub" },
    posicao: { label: "posicao", group: "hub" },
    time: { label: "time", group: "hub" }
  };
  const TYPE_ORDER = ["post", "prospect", "termo", "ranking", "dica", "tweet", "tag", "posicao", "time"];

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTweetCard(tweet = {}) {
    return `
      <aside class="tweet-card">
        <span class="tweet-card__label">Tweet citado</span>
        ${tweet.texto ? `<p>${escapeHtml(tweet.texto)}</p>` : ""}
        ${tweet.nome || tweet.handle || tweet.data ? `<small>${escapeHtml([tweet.nome, tweet.handle, tweet.data].filter(Boolean).join(" | "))}</small>` : ""}
        ${tweet.link ? `<a href="${escapeHtml(tweet.link)}" target="_blank" rel="noopener noreferrer">Abrir no X</a>` : ""}
      </aside>
    `;
  }

  function createColmeiaView({ canvas, detail, filters, search, centerButton, status, graph }) {
    const ctx = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const colors = {
      black: css.getPropertyValue("--black").trim(),
      white: css.getPropertyValue("--white").trim(),
      orange: css.getPropertyValue("--laranja").trim(),
      blue: css.getPropertyValue("--blue").trim(),
      green: css.getPropertyValue("--green").trim(),
      gray: css.getPropertyValue("--gray-500").trim()
    };
    const nodes = graph.nodes.map((node, index) => ({
      ...node,
      x: Math.cos(index * 2.399) * (110 + index * 0.9),
      y: Math.sin(index * 2.399) * (110 + index * 0.9),
      vx: 0,
      vy: 0,
      radius: radiusFor(node)
    }));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const links = graph.links
      .map((link) => ({ ...link, sourceNode: nodeById.get(link.source), targetNode: nodeById.get(link.target) }))
      .filter((link) => link.sourceNode && link.targetNode);
    const activeTypes = new Set(TYPE_ORDER);
    let query = "";
    let width = 1;
    let height = 1;
    let dpr = 1;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let hoverNode = null;
    let focusNode = null;
    let dragNode = null;
    let draggingCanvas = false;
    let lastPointer = null;
    let animationFrame = null;

    function radiusFor(node) {
      if (node.tipo === "tag" || node.tipo === "posicao" || node.tipo === "time") return 17;
      if (node.tipo === "prospect") return 15;
      if (node.tipo === "tweet") return 14;
      return 12;
    }

    function colorFor(node) {
      if (node.tipo === "tag" || node.tipo === "posicao" || node.tipo === "time") return colors.orange;
      if (node.tipo === "prospect") return colors.blue;
      if (node.tipo === "termo") return colors.green;
      return colors.white;
    }

    function isVisible(node) {
      return activeTypes.has(node.tipo);
    }

    function matchesQuery(node) {
      if (!query) return true;
      const text = [node.label, node.body, node.slug, node.tweet?.texto, node.tweet?.handle].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    }

    function isNeighbor(node) {
      const selected = focusNode || hoverNode;
      if (!selected) return true;
      if (node === selected) return true;
      return links.some((link) =>
        (link.sourceNode === selected && link.targetNode === node) ||
        (link.targetNode === selected && link.sourceNode === node)
      );
    }

    function visibleLinks() {
      return links.filter((link) => isVisible(link.sourceNode) && isVisible(link.targetNode));
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      width = Math.max(320, rect.width);
      height = Math.max(420, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function worldToScreen(node) {
      return {
        x: width / 2 + panX + node.x * zoom,
        y: height / 2 + panY + node.y * zoom
      };
    }

    function screenToWorld(point) {
      return {
        x: (point.x - width / 2 - panX) / zoom,
        y: (point.y - height / 2 - panY) / zoom
      };
    }

    function pointer(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function hitTest(point) {
      for (let index = nodes.length - 1; index >= 0; index -= 1) {
        const node = nodes[index];
        if (!isVisible(node)) continue;
        const screen = worldToScreen(node);
        const radius = (node.radius + 5) * zoom;
        if (Math.hypot(point.x - screen.x, point.y - screen.y) <= radius) return node;
      }
      return null;
    }

    function tick() {
      const activeLinks = visibleLinks();
      nodes.forEach((node) => {
        if (!isVisible(node) || node === dragNode) return;
        node.vx += -node.x * 0.0007;
        node.vy += -node.y * 0.0007;
      });
      activeLinks.forEach((link) => {
        const a = link.sourceNode;
        const b = link.targetNode;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const desired = link.kind === "manual" ? 118 : 92;
        const force = (distance - desired) * 0.0009;
        const fx = dx / distance * force;
        const fy = dy / distance * force;
        if (a !== dragNode) { a.vx += fx; a.vy += fy; }
        if (b !== dragNode) { b.vx -= fx; b.vy -= fy; }
      });
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        if (!isVisible(a)) continue;
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          if (!isVisible(b)) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(8, Math.hypot(dx, dy));
          const force = 18 / (distance * distance);
          const fx = dx / distance * force;
          const fy = dy / distance * force;
          if (a !== dragNode) { a.vx -= fx; a.vy -= fy; }
          if (b !== dragNode) { b.vx += fx; b.vy += fy; }
        }
      }
      nodes.forEach((node) => {
        if (node === dragNode) return;
        node.vx *= 0.86;
        node.vy *= 0.86;
        node.x += node.vx;
        node.y += node.vy;
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colors.black;
      ctx.fillRect(0, 0, width, height);
      const selected = focusNode || hoverNode;
      visibleLinks().forEach((link) => {
        const a = worldToScreen(link.sourceNode);
        const b = worldToScreen(link.targetNode);
        const highlighted = !selected || link.sourceNode === selected || link.targetNode === selected;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = link.kind === "manual" ? colors.orange : colors.gray;
        ctx.globalAlpha = highlighted ? 0.65 : 0.1;
        ctx.lineWidth = link.kind === "manual" ? 2.4 : 1;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      nodes.forEach((node) => {
        if (!isVisible(node)) return;
        const p = worldToScreen(node);
        const searchMatch = matchesQuery(node);
        const muted = (selected && !isNeighbor(node)) || (query && !searchMatch);
        const highlighted = node === selected || (query && searchMatch);
        ctx.globalAlpha = muted ? 0.18 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, node.radius * zoom, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(node);
        ctx.fill();
        ctx.lineWidth = highlighted ? 3 : 1.5;
        ctx.strokeStyle = node.tipo === "tweet" ? colors.orange : colors.black;
        ctx.stroke();
        if (node.tipo === "tweet") {
          ctx.fillStyle = colors.black;
          ctx.font = `${Math.max(13, 15 * zoom)}px ${css.getPropertyValue("--font-display")}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u201c", p.x, p.y + 2);
        }
        if (zoom > 0.55 || node === selected) {
          ctx.fillStyle = colors.white;
          ctx.font = `700 ${Math.max(10, 11 * zoom)}px ${css.getPropertyValue("--font-body")}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(String(node.label || "").slice(0, 28), p.x, p.y + node.radius * zoom + 7);
        }
      });
      ctx.globalAlpha = 1;
    }

    function loop() {
      tick();
      draw();
      animationFrame = requestAnimationFrame(loop);
    }

    function renderFilters() {
      filters.innerHTML = TYPE_ORDER.map((type) => `
        <button class="colmeia-chip is-active" type="button" data-type="${type}">
          ${TYPES[type].label}
        </button>
      `).join("");
      filters.querySelectorAll("[data-type]").forEach((button) => {
        button.addEventListener("click", () => {
          const type = button.dataset.type;
          if (activeTypes.has(type)) activeTypes.delete(type);
          else activeTypes.add(type);
          button.classList.toggle("is-active", activeTypes.has(type));
          updateStatus();
          renderDetail(focusNode);
        });
      });
    }

    function renderDetail(node) {
      if (!node || !isVisible(node)) {
        detail.innerHTML = `
          <span class="colmeia-detail__eyebrow">selecione um n\u00f3</span>
          <h2>Explore a rede</h2>
          <p>Passe o cursor para ver vizinhos. Clique para fixar detalhes, arraste para reorganizar e use a roda do mouse para aproximar.</p>
        `;
        return;
      }
      const neighbors = links
        .filter((link) => link.sourceNode === node || link.targetNode === node)
        .map((link) => {
          const other = link.sourceNode === node ? link.targetNode : link.sourceNode;
          return `<li><span>${escapeHtml(TYPES[other.tipo]?.label || other.tipo)}</span>${escapeHtml(other.label)}${link.via ? `<small>${escapeHtml(link.via)}</small>` : ""}</li>`;
        })
        .slice(0, 12)
        .join("");
      detail.innerHTML = `
        <span class="colmeia-detail__eyebrow">${escapeHtml(TYPES[node.tipo]?.label || node.tipo)}</span>
        <h2>${escapeHtml(node.label)}</h2>
        ${node.body ? `<p>${escapeHtml(node.body)}</p>` : ""}
        ${node.tipo === "tweet" ? renderTweetCard(node.tweet) : ""}
        ${node.slug ? `<small class="colmeia-detail__slug">${escapeHtml(node.slug)}</small>` : ""}
        ${neighbors ? `<ul class="colmeia-detail__neighbors">${neighbors}</ul>` : `<p class="colmeia-detail__empty">N\u00f3 isolado no grafo atual.</p>`}
      `;
    }

    function updateStatus() {
      const visibleCount = nodes.filter(isVisible).length;
      const matches = query ? nodes.filter((node) => isVisible(node) && matchesQuery(node)).length : visibleCount;
      status.textContent = query
        ? `${visibleCount} n\u00f3s vis\u00edveis | ${matches} destacados | ${visibleLinks().length} conex\u00f5es`
        : `${visibleCount} n\u00f3s vis\u00edveis | ${visibleLinks().length} conex\u00f5es`;
    }

    canvas.addEventListener("pointermove", (event) => {
      const point = pointer(event);
      if (dragNode) {
        const world = screenToWorld(point);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.vx = 0;
        dragNode.vy = 0;
        return;
      }
      if (draggingCanvas && lastPointer) {
        panX += point.x - lastPointer.x;
        panY += point.y - lastPointer.y;
        lastPointer = point;
        return;
      }
      hoverNode = hitTest(point);
      canvas.style.cursor = hoverNode ? "grab" : "default";
    });
    canvas.addEventListener("pointerdown", (event) => {
      const point = pointer(event);
      const hit = hitTest(point);
      lastPointer = point;
      if (hit) {
        dragNode = hit;
        focusNode = hit;
        renderDetail(hit);
        canvas.setPointerCapture(event.pointerId);
        return;
      }
      draggingCanvas = true;
      focusNode = null;
      renderDetail(null);
    });
    canvas.addEventListener("pointerup", (event) => {
      dragNode = null;
      draggingCanvas = false;
      lastPointer = null;
      canvas.releasePointerCapture?.(event.pointerId);
    });
    canvas.addEventListener("click", (event) => {
      const hit = hitTest(pointer(event));
      focusNode = hit;
      renderDetail(hit);
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = pointer(event);
      const before = screenToWorld(point);
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.max(0.35, Math.min(2.8, zoom * factor));
      const after = screenToWorld(point);
      panX += (after.x - before.x) * zoom;
      panY += (after.y - before.y) * zoom;
    }, { passive: false });
    search?.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      updateStatus();
      if (focusNode && !isVisible(focusNode)) {
        focusNode = null;
        renderDetail(null);
      }
    });
    centerButton?.addEventListener("click", () => {
      zoom = 1;
      panX = 0;
      panY = 0;
      nodes.forEach((node) => { node.vx *= 0.2; node.vy *= 0.2; });
    });
    window.addEventListener("resize", resize);

    renderFilters();
    resize();
    updateStatus();
    renderDetail(null);
    loop();

    return {
      destroy() {
        cancelAnimationFrame(animationFrame);
      }
    };
  }

  window.T3ColmeiaView = {
    TYPES,
    createColmeiaView
  };
})();
