import { wrapAnimationHtml } from "./common.mjs";

export const managementCommerceAnimations = {
  // 28. Finance
  "finance.html": wrapAnimationHtml(
    "Finance",
    "#070D18",
    `
    const candles = [];
    let tickT = 0;

    function init(w, h) {
      candles.length = 0;
      const count = 22;
      const cW = (w * 0.8) / count;
      let price = h * 0.5;

      for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.48) * 35;
        const open = price;
        const close = price + change;
        const high = Math.min(open, close) - Math.random() * 15;
        const low = Math.max(open, close) + Math.random() * 15;
        candles.push({ x: w * 0.1 + i * cW, w: cW * 0.65, open, close, high, low, isBull: close < open });
        price = close;
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      tickT += dt;
      if (tickT > 1.2) {
        tickT = 0;
        // Shift candles left and add new
        candles.shift();
        const last = candles[candles.length - 1];
        const cW = candles[0].w / 0.65;
        const change = (Math.random() - 0.48) * 30;
        const open = last.close;
        const close = open + change;
        const high = Math.min(open, close) - Math.random() * 15;
        const low = Math.max(open, close) + Math.random() * 15;
        candles.push({ x: last.x + cW, w: last.w, open, close, high, low, isBull: close < open });
        for (let i = 0; i < candles.length; i++) candles[i].x = w * 0.1 + i * cW;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Financial Candlesticks
      for (const c of candles) {
        ctx.strokeStyle = c.isBull ? "#22C55E" : "#EF4444";
        ctx.fillStyle = c.isBull ? "#22C55E" : "#EF4444";
        ctx.lineWidth = 1.2;

        // Wick
        ctx.beginPath();
        ctx.moveTo(c.x + c.w * 0.5, c.high);
        ctx.lineTo(c.x + c.w * 0.5, c.low);
        ctx.stroke();

        // Real Body
        const top = Math.min(c.open, c.close);
        const bH = Math.max(4, Math.abs(c.open - c.close));
        ctx.fillRect(c.x, top, c.w, bH);
      }

      // Moving Average line (EMA)
      ctx.beginPath();
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.8;
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const y = (c.open + c.close) * 0.5;
        if (i === 0) ctx.moveTo(c.x + c.w * 0.5, y); else ctx.lineTo(c.x + c.w * 0.5, y);
      }
      ctx.stroke();
    }
    `
  ),

  // 29. Marketing
  "marketing.html": wrapAnimationHtml(
    "Marketing",
    "#100A1A",
    `
    const leads = [];
    let spawnTimer = 0;

    function init(w, h) { leads.length = 0; }
    function onResize(w, h) { leads.length = 0; }

    function update(dt) {
      spawnTimer += dt;
      if (spawnTimer > 0.12) {
        spawnTimer = 0;
        leads.push({ x: w * 0.2 + Math.random() * (w * 0.6), y: h * 0.2, t: 0, speed: 0.6 + Math.random() * 0.6 });
      }

      for (let i = leads.length - 1; i >= 0; i--) {
        const l = leads[i];
        l.t += dt * l.speed;
        l.y = h * 0.2 + l.t * (h * 0.6);
        // Funnel narrowing effect
        const widthAtY = (w * 0.6) * (1 - l.t * 0.7);
        const minX = w * 0.5 - widthAtY * 0.5;
        const maxX = w * 0.5 + widthAtY * 0.5;
        if (l.x < minX || l.x > maxX || l.y > h * 0.8) {
          leads.splice(i, 1);
        }
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Conversion Funnel Outline
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.2);
      ctx.lineTo(w * 0.8, h * 0.2);
      ctx.lineTo(w * 0.55, h * 0.78);
      ctx.lineTo(w * 0.45, h * 0.78);
      ctx.closePath();
      ctx.strokeStyle = "rgba(217, 70, 239, 0.4)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Falling consumer lead particles
      for (const l of leads) {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = l.t > 0.6 ? "#D946EF" : "#8B5CF6";
        ctx.fill();
      }

      // Funnel stages divider lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let s = 1; s <= 2; s++) {
        const y = h * 0.2 + s * (h * 0.2);
        ctx.beginPath(); ctx.moveTo(w * 0.25, y); ctx.lineTo(w * 0.75, y); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    `
  ),

  // 30. Human Resource Management
  "human-resource-management.html": wrapAnimationHtml(
    "Human Resource Management",
    "#070F1E",
    `
    const tree = [];

    function init(w, h) {
      tree.length = 0;
      // Top level
      tree.push({ x: w * 0.5, y: h * 0.25, lvl: 0 });
      // Mid level (3 nodes)
      for (let i = 0; i < 3; i++) {
        tree.push({ x: (w / 4) * (i + 1), y: h * 0.5, lvl: 1, parent: 0 });
      }
      // Low level (6 nodes)
      for (let i = 0; i < 6; i++) {
        const parentIdx = 1 + Math.floor(i / 2);
        tree.push({ x: (w / 7) * (i + 1), y: h * 0.75, lvl: 2, parent: parentIdx });
      }
    }

    function onResize(w, h) { init(w, h); }
    function update(dt) {}

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Organizational hierarchy links
      ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
      ctx.lineWidth = 1.5;
      for (let i = 1; i < tree.length; i++) {
        const node = tree[i];
        const p = tree[node.parent];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }

      // Talent Nodes
      for (const n of tree) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.lvl === 0 ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = n.lvl === 0 ? "#F59E0B" : (n.lvl === 1 ? "#2563EB" : "#14B8A6");
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    `
  ),

  // 31. Operations
  "operations.html": wrapAnimationHtml(
    "Operations",
    "#0B1320",
    `
    const items = [];
    let progressT = 0;

    function init(w, h) {
      items.length = 0;
      for (let i = 0; i < 9; i++) {
        items.push({ x: (w / 10) * (i + 1), col: i % 3 });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      progressT = (progressT + dt * 0.6) % 1;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Kanban 3 Work-in-Progress (WIP) columns
      const cols = ["To Do", "In Progress", "Done"];
      const colW = (w * 0.8) / 3;
      const startX = w * 0.1;

      for (let i = 0; i < 3; i++) {
        const cx = startX + i * colW;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx, h * 0.2, colW - 10, h * 0.6);

        // Header label bar
        ctx.fillStyle = i === 1 ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.08)";
        ctx.fillRect(cx, h * 0.2, colW - 10, 22);

        // Kanban Card items
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
          ctx.fillRect(cx + 6, h * 0.32 + j * 32, colW - 22, 24);
          ctx.strokeStyle = i === 2 ? "#10B981" : (i === 1 ? "#F59E0B" : "#38BDF8");
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 6, h * 0.32 + j * 32, colW - 22, 24);
        }
      }
    }
    `
  ),

  // 32. Business Analytics
  "business-analytics.html": wrapAnimationHtml(
    "Business Analytics",
    "#070F1B",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.5;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Circular KPI Progress Gauges
      function drawGauge(gx, gy, val, color) {
        ctx.beginPath();
        ctx.arc(gx, gy, 32, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(gx, gy, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * val);
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      drawGauge(w * 0.28, h * 0.42, 0.78 + Math.sin(t) * 0.05, "#3B82F6");
      drawGauge(w * 0.72, h * 0.42, 0.64 + Math.cos(t) * 0.08, "#10B981");

      // Area Trend forecast chart at bottom
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.85);
      for (let x = 0; x < w * 0.8; x += 15) {
        const curY = h * 0.78 - Math.sin(x * 0.02 + t) * 18 - (x * 0.05);
        ctx.lineTo(w * 0.1 + x, curY);
      }
      ctx.lineTo(w * 0.9, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
      ctx.fill();
    }
    `
  ),

  // 33. Accounting and Auditing
  "accounting-auditing.html": wrapAnimationHtml(
    "Accounting and Auditing",
    "#0A0F17",
    `
    let balanceT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      balanceT += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.45;

      // Balancing Golden Scales of Double-Entry Bookkeeping (Debit vs Credit)
      // Fulcrum Stand
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 25); ctx.lineTo(cx, cy + 50);
      ctx.moveTo(cx - 30, cy + 50); ctx.lineTo(cx + 30, cy + 50);
      ctx.stroke();

      // Lever Beam oscillating slightly in equilibrium
      const tilt = Math.sin(balanceT) * 0.08;
      const beamL = 75;
      const leftX = cx - Math.cos(tilt) * beamL;
      const leftY = cy - 25 - Math.sin(tilt) * beamL;
      const rightX = cx + Math.cos(tilt) * beamL;
      const rightY = cy - 25 + Math.sin(tilt) * beamL;

      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.strokeStyle = "#EAB308";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Scale Pans
      ctx.strokeStyle = "rgba(234, 179, 8, 0.6)";
      ctx.lineWidth = 1.5;
      // Left Pan (Debit)
      ctx.beginPath();
      ctx.moveTo(leftX, leftY); ctx.lineTo(leftX - 15, leftY + 30);
      ctx.moveTo(leftX, leftY); ctx.lineTo(leftX + 15, leftY + 30);
      ctx.moveTo(leftX - 20, leftY + 30); ctx.lineTo(leftX + 20, leftY + 30);
      ctx.stroke();

      // Right Pan (Credit)
      ctx.beginPath();
      ctx.moveTo(rightX, rightY); ctx.lineTo(rightX - 15, rightY + 30);
      ctx.moveTo(rightX, rightY); ctx.lineTo(rightX + 15, rightY + 30);
      ctx.moveTo(rightX - 20, rightY + 30); ctx.lineTo(rightX + 20, rightY + 30);
      ctx.stroke();
    }
    `
  ),

  // 34. International Trade
  "international-trade.html": wrapAnimationHtml(
    "International Trade",
    "#061121",
    `
    const routes = [];
    let shipT = 0;

    function init(w, h) {
      routes.length = 0;
      routes.push({ x1: w * 0.15, y1: h * 0.4, x2: w * 0.45, y2: h * 0.6 });
      routes.push({ x1: w * 0.45, y1: h * 0.6, x2: w * 0.85, y2: h * 0.35 });
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      shipT = (shipT + dt * 0.4) % 1;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Maritime shipping route curved arcs
      ctx.strokeStyle = "rgba(14, 165, 233, 0.35)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 6]);
      for (const r of routes) {
        ctx.beginPath();
        ctx.moveTo(r.x1, r.y1);
        ctx.quadraticCurveTo((r.x1 + r.x2) * 0.5, (r.y1 + r.y2) * 0.5 - 25, r.x2, r.y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Port hub nodes
      const hubs = [
        { x: w * 0.15, y: h * 0.4 },
        { x: w * 0.45, y: h * 0.6 },
        { x: w * 0.85, y: h * 0.35 }
      ];

      for (const hub of hubs) {
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#F59E0B";
        ctx.fill();
      }

      // Moving cargo container ship
      const r = routes[0];
      const curX = r.x1 + (r.x2 - r.x1) * shipT;
      const curY = r.y1 + (r.y2 - r.y1) * shipT;

      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#38BDF8";
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 35. Econometrics
  "econometrics.html": wrapAnimationHtml(
    "Econometrics",
    "#091021",
    `
    let shiftT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      shiftT += dt * 0.9;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const startX = w * 0.15;
      const endX = w * 0.85;
      const baseY = h * 0.8;
      const topY = h * 0.2;

      // Coordinate axes (Price P vertical, Quantity Q horizontal)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, topY); ctx.lineTo(startX, baseY); ctx.lineTo(endX, baseY);
      ctx.stroke();

      // Supply Curve (Upward sloping: Green)
      ctx.beginPath();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.2;
      ctx.moveTo(startX + 20, baseY - 20);
      ctx.lineTo(endX - 20, topY + 20);
      ctx.stroke();

      // Demand Curve (Downward sloping: Red/Rose with economic shock shift)
      const shock = Math.sin(shiftT) * 25;
      ctx.beginPath();
      ctx.strokeStyle = "#F43F5E";
      ctx.lineWidth = 2.2;
      ctx.moveTo(startX + 20 + shock, topY + 20);
      ctx.lineTo(endX - 20 + shock, baseY - 20);
      ctx.stroke();

      // Market Equilibrium intersection point P*, Q*
      const eqX = (startX + endX) * 0.5 + shock * 0.5;
      const eqY = (topY + baseY) * 0.5;

      ctx.beginPath();
      ctx.arc(eqX, eqY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FBBF24";
      ctx.shadowColor = "#FBBF24";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 36. Corporate Governance
  "corporate-governance.html": wrapAnimationHtml(
    "Corporate Governance",
    "#0B101D",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = 60;

      // Hexagonal Stakeholder Governance Radar Matrix
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + t * 0.2;
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Fiduciary concentric compliance check rings
      for (let r = 20; r < radius; r += 18) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Stakeholder nodes
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + t * 0.2;
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#10B981" : "#F59E0B";
        ctx.fill();
      }
    }
    `
  ),

  // 37. Banking and FinTech
  "banking-fintech.html": wrapAnimationHtml(
    "Banking and FinTech",
    "#070D1A",
    `
    const blocks = [];
    let blockT = 0;

    function init(w, h) {
      blocks.length = 0;
      for (let i = 0; i < 4; i++) {
        blocks.push({
          x: (w / 5) * (i + 1),
          y: h * 0.5,
          hash: "0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16)
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      blockT += dt * 1.5;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Cryptographic chain links between blocks
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 2;
      for (let i = 0; i < blocks.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(blocks[i].x + 24, blocks[i].y);
        ctx.lineTo(blocks[i + 1].x - 24, blocks[i + 1].y);
        ctx.stroke();
      }

      // Distributed Ledger Blocks
      for (const b of blocks) {
        ctx.fillStyle = "#0F1E36";
        ctx.fillRect(b.x - 24, b.y - 18, 48, 36);
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x - 24, b.y - 18, 48, 36);

        // Verification indicator
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#10B981";
        ctx.fill();
      }
    }
    `
  )
};

