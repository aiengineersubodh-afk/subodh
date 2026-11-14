import { wrapAnimationHtml } from "./common.mjs";

export const engineeringAnimations = {
  // 1. Computer Science Engineering
  "computer-science-engineering.html": wrapAnimationHtml(
    "Computer Science Engineering",
    "#070D18",
    `
    const tokens = ['{ }', '0101', '&&', '=>', 'null', 'void', '0x7F', '<T>', 'return', 'ptr*'];
    const columns = [];
    const treeNodes = [];
    let pulseProgress = 0;

    function init(w, h) {
      columns.length = 0;
      const colCount = Math.floor(w / 40);
      for (let i = 0; i < colCount; i++) {
        columns.push({
          x: i * 40 + 10,
          y: Math.random() * h,
          speed: 20 + Math.random() * 35,
          text: tokens[Math.floor(Math.random() * tokens.length)],
          alpha: 0.15 + Math.random() * 0.3
        });
      }

      treeNodes.length = 0;
      const levels = 4;
      for (let lvl = 0; lvl < levels; lvl++) {
        const count = Math.pow(2, lvl);
        const y = h * 0.2 + (lvl * (h * 0.55 / levels));
        for (let j = 0; j < count; j++) {
          const x = (w / (count + 1)) * (j + 1);
          treeNodes.push({ x, y, lvl, idx: j, active: false });
        }
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      for (const col of columns) {
        col.y += col.speed * dt;
        if (col.y > h + 20) {
          col.y = -20;
          col.text = tokens[Math.floor(Math.random() * tokens.length)];
        }
      }
      pulseProgress = (pulseProgress + dt * 0.8) % 3;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Code stream columns
      ctx.font = "11px 'JetBrains Mono', 'Fira Code', monospace";
      for (const col of columns) {
        ctx.fillStyle = "rgba(0, 240, 255, " + col.alpha + ")";
        ctx.fillText(col.text, col.x, col.y);
      }

      // Binary tree connections
      for (let i = 0; i < treeNodes.length; i++) {
        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;
        const curr = treeNodes[i];
        if (leftIdx < treeNodes.length) {
          const left = treeNodes[leftIdx];
          ctx.beginPath();
          ctx.moveTo(curr.x, curr.y);
          ctx.lineTo(left.x, left.y);
          ctx.strokeStyle = "rgba(121, 40, 202, 0.25)";
          ctx.stroke();
        }
        if (rightIdx < treeNodes.length) {
          const right = treeNodes[rightIdx];
          ctx.beginPath();
          ctx.moveTo(curr.x, curr.y);
          ctx.lineTo(right.x, right.y);
          ctx.strokeStyle = "rgba(121, 40, 202, 0.25)";
          ctx.stroke();
        }
      }

      // Binary tree nodes & traversal pulse
      const activeLevel = Math.floor(pulseProgress);
      const frac = pulseProgress - activeLevel;
      for (let i = 0; i < treeNodes.length; i++) {
        const n = treeNodes[i];
        const isLevel = n.lvl === activeLevel;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isLevel ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isLevel ? "#00F0FF" : "rgba(121, 40, 202, 0.7)";
        ctx.shadowColor = isLevel ? "#00F0FF" : "transparent";
        ctx.shadowBlur = isLevel ? 12 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    `
  ),

  // 2. Artificial Intelligence and Machine Learning
  "artificial-intelligence-machine-learning.html": wrapAnimationHtml(
    "Artificial Intelligence and Machine Learning",
    "#0B0817",
    `
    const layers = [4, 6, 6, 3];
    const nodes = [];
    const signals = [];
    let spawnTimer = 0;

    function init(w, h) {
      nodes.length = 0;
      signals.length = 0;
      const layerSpacing = (w * 0.75) / (layers.length - 1);
      const startX = w * 0.125;

      for (let l = 0; l < layers.length; l++) {
        const count = layers[l];
        const colNodes = [];
        const ySpacing = (h * 0.7) / (count + 1);
        for (let i = 0; i < count; i++) {
          colNodes.push({
            x: startX + l * layerSpacing,
            y: h * 0.15 + (i + 1) * ySpacing,
            layer: l,
            idx: i,
            activation: 0.3 + Math.random() * 0.7,
            pulse: 0
          });
        }
        nodes.push(colNodes);
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      spawnTimer += dt;
      if (spawnTimer > 0.4) {
        spawnTimer = 0;
        // Spawn forward propagating signal from layer 0 to layer 1
        const srcCol = 0;
        const srcNode = Math.floor(Math.random() * nodes[srcCol].length);
        const dstNode = Math.floor(Math.random() * nodes[srcCol + 1].length);
        signals.push({
          srcL: 0,
          srcI: srcNode,
          dstL: 1,
          dstI: dstNode,
          t: 0,
          speed: 1.4
        });
      }

      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.t += s.speed * dt;
        if (s.t >= 1) {
          // Trigger next layer propagation
          const nextLayer = s.dstL + 1;
          if (nextLayer < layers.length && nodes[nextLayer]) {
            const nextDst = Math.floor(Math.random() * nodes[nextLayer].length);
            signals.push({
              srcL: s.dstL,
              srcI: s.dstI,
              dstL: nextLayer,
              dstI: nextDst,
              t: 0,
              speed: 1.6
            });
            nodes[s.dstL][s.dstI].pulse = 1.0;
          }
          signals.splice(i, 1);
        }
      }

      for (const col of nodes) {
        for (const n of col) {
          if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - dt * 2.5);
        }
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Decision boundary background curves
      ctx.strokeStyle = "rgba(139, 92, 246, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = h * 0.5 + Math.sin(x * 0.015) * 50 + Math.cos(x * 0.008) * 30;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Synaptic weights / connections
      for (let l = 0; l < nodes.length - 1; l++) {
        const colA = nodes[l];
        const colB = nodes[l + 1];
        for (const a of colA) {
          for (const b of colB) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(139, 92, 246, 0.12)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Synaptic signals
      for (const s of signals) {
        const p1 = nodes[s.srcL][s.srcI];
        const p2 = nodes[s.dstL][s.dstI];
        const sx = p1.x + (p2.x - p1.x) * s.t;
        const sy = p1.y + (p2.y - p1.y) * s.t;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#EC4899";
        ctx.shadowColor = "#EC4899";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Neural nodes
      for (const col of nodes) {
        for (const n of col) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5 + n.pulse * 4, 0, Math.PI * 2);
          ctx.fillStyle = n.pulse > 0.1 ? "#00F0FF" : "rgba(139, 92, 246, 0.85)";
          ctx.shadowColor = n.pulse > 0.1 ? "#00F0FF" : "transparent";
          ctx.shadowBlur = n.pulse * 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
    `
  ),

  // 3. Data Science
  "data-science.html": wrapAnimationHtml(
    "Data Science",
    "#06131F",
    `
    const points = [];
    let angle = 0;

    function init(w, h) {
      points.length = 0;
      const count = 75;
      for (let i = 0; i < count; i++) {
        // 3 clusters
        const cluster = i % 3;
        const cx = cluster === 0 ? -60 : cluster === 1 ? 60 : 0;
        const cy = cluster === 0 ? -40 : cluster === 1 ? 40 : 10;
        const cz = cluster === 0 ? 30 : cluster === 1 ? -30 : 0;
        points.push({
          x: cx + (Math.random() - 0.5) * 70,
          y: cy + (Math.random() - 0.5) * 60,
          z: cz + (Math.random() - 0.5) * 70,
          cluster: cluster
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      angle += dt * 0.45;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.48;

      // Draw 3D coordinate axes
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const scale = Math.min(w, h) * 0.0035;

      function project(x, y, z) {
        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA + 200;
        const fov = 220 / (rz + 220);
        return { px: cx + rx * fov * 2.2, py: cy + y * fov * 2.2, depth: rz };
      }

      // Draw rotating axes
      const o = project(0, 0, 0);
      const axX = project(80, 0, 0);
      const axY = project(0, 80, 0);
      const axZ = project(0, 0, 80);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(20, 184, 166, 0.2)";
      ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(axX.px, axX.py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(axY.px, axY.py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(axZ.px, axZ.py); ctx.stroke();

      // Regression curve line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1.8;
      for (let t = -80; t <= 80; t += 5) {
        const regY = Math.sin(t * 0.04 + angle * 0.5) * 35 + (t * 0.3);
        const regZ = Math.cos(t * 0.03) * 20;
        const pt = project(t, regY, regZ);
        if (t === -80) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
      }
      ctx.stroke();

      // Scatter points
      const colors = ["#14B8A6", "#10B981", "#38BDF8"];
      for (const p of points) {
        const pt = project(p.x, p.y, p.z);
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.cluster];
        ctx.fill();
      }

      // Histogram bars along bottom
      const bars = 18;
      const barW = (w * 0.7) / bars;
      const startX = w * 0.15;
      for (let i = 0; i < bars; i++) {
        const val = Math.sin(i * 0.5 + angle) * 0.5 + 0.5;
        const bH = val * (h * 0.16);
        ctx.fillStyle = "rgba(20, 184, 166, 0.18)";
        ctx.fillRect(startX + i * barW, h - bH - 12, barW - 3, bH);
      }
    }
    `
  ),

  // 4. Cybersecurity
  "cybersecurity.html": wrapAnimationHtml(
    "Cybersecurity",
    "#0B080F",
    `
    let radarAngle = 0;
    const packets = [];
    const hashes = ['7F83B165', 'E3B0C442', '9F86D081', 'A591A6D4', '046B6C7F'];

    function init(w, h) {
      packets.length = 0;
      for (let i = 0; i < 20; i++) {
        packets.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: 40 + Math.random() * 60,
          blocked: Math.random() > 0.5
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      radarAngle += dt * 1.6;
      for (const p of packets) {
        p.x -= p.speed * dt;
        if (p.x < 0) {
          p.x = w + 20;
          p.y = Math.random() * h;
        }
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.48;

      // Hexagonal Shield in Center
      function drawHex(radius, strokeStyle, width) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const x = cx + radius * Math.cos(a);
          const y = cy + radius * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = width;
        ctx.stroke();
      }

      drawHex(65, "rgba(239, 68, 68, 0.2)", 1);
      drawHex(50, "rgba(239, 68, 68, 0.5)", 1.5);
      drawHex(35, "rgba(245, 158, 11, 0.6)", 1.5);

      // Radar sweep
      const r = 75;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, radarAngle, radarAngle + 0.45);
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, "rgba(239, 68, 68, 0.3)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Radar line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(radarAngle) * r, cy + Math.sin(radarAngle) * r);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Intrusion packets
      for (const p of packets) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.blocked ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = p.blocked ? "#EF4444" : "#F59E0B";
        ctx.fill();
      }

      // Cryptographic hash watermark stream
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      for (let i = 0; i < 6; i++) {
        ctx.fillText("HASH::" + hashes[i % hashes.length] + " [SECURED]", 20, 25 + i * 28);
      }
    }
    `
  ),

  // 5. Electronics and Communication
  "electronics-communication.html": wrapAnimationHtml(
    "Electronics and Communication",
    "#060E1A",
    `
    const traces = [];
    let signalT = 0;

    function init(w, h) {
      traces.length = 0;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const y = (h / (count + 1)) * (i + 1);
        const segs = [
          { x: 0, y: y },
          { x: w * 0.25, y: y },
          { x: w * 0.35, y: y + (i % 2 === 0 ? 25 : -25) },
          { x: w * 0.7, y: y + (i % 2 === 0 ? 25 : -25) },
          { x: w * 0.8, y: y },
          { x: w, y: y }
        ];
        traces.push({ segs, speed: 0.8 + Math.random() * 0.8, t: Math.random() });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      signalT += dt * 2.5;
      for (const tr of traces) {
        tr.t = (tr.t + tr.speed * dt * 0.5) % 1;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // PCB Copper Traces
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(37, 99, 235, 0.25)";
      for (const tr of traces) {
        ctx.beginPath();
        for (let i = 0; i < tr.segs.length; i++) {
          const pt = tr.segs[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Pulsing electron current along trace
        const idx = Math.min(Math.floor(tr.t * (tr.segs.length - 1)), tr.segs.length - 2);
        const subT = (tr.t * (tr.segs.length - 1)) - idx;
        const p1 = tr.segs[idx];
        const p2 = tr.segs[idx + 1];
        const curX = p1.x + (p2.x - p1.x) * subT;
        const curY = p1.y + (p2.y - p1.y) * subT;

        ctx.beginPath();
        ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#00F0FF";
        ctx.shadowColor = "#00F0FF";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // RF Wave Propagation from Antenna
      const antX = w * 0.15;
      const antY = h * 0.5;
      for (let r = 15; r < 140; r += 25) {
        const curR = (r + signalT * 18) % 140;
        ctx.beginPath();
        ctx.arc(antX, antY, curR, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.strokeStyle = "rgba(0, 240, 255, " + Math.max(0, (1 - curR / 140) * 0.5) + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Oscilloscope modulated waveform along bottom
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
      ctx.lineWidth = 1.5;
      const oscY = h * 0.85;
      for (let x = 0; x < w; x += 3) {
        const carrier = Math.sin(x * 0.08 + signalT * 4);
        const mod = (Math.sin(x * 0.015 + signalT) + 1) * 0.5;
        const y = oscY + carrier * mod * 22;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    `
  ),

  // 6. Electrical Engineering
  "electrical-engineering.html": wrapAnimationHtml(
    "Electrical Engineering",
    "#0E0A05",
    `
    let phase = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      phase += dt * 3.0;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const midY = h * 0.48;

      // 3-Phase AC sinusoidal waveforms (V_A, V_B, V_C with 120deg offset)
      const phases = [
        { offset: 0, color: "#F59E0B", label: "Phase A" },
        { offset: (Math.PI * 2) / 3, color: "#FDE047", label: "Phase B" },
        { offset: (Math.PI * 4) / 3, color: "#EA580C", label: "Phase C" }
      ];

      for (const p of phases) {
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.8;
        for (let x = 0; x < w; x += 4) {
          const y = midY + Math.sin(x * 0.02 + phase + p.offset) * (h * 0.22);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Rotating magnetic field lines in center (stator / rotor simulation)
      const cx = w * 0.5;
      const cy = h * 0.48;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase * 0.25);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 75, 28, (Math.PI / 4) * i, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // High voltage spark arc occasionally flashing
      if (Math.sin(phase * 2) > 0.85) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.7)";
        ctx.lineWidth = 1.5;
        let arcX = w * 0.2;
        let arcY = h * 0.2;
        ctx.moveTo(arcX, arcY);
        for (let i = 0; i < 6; i++) {
          arcX += (w * 0.6) / 6;
          arcY += (Math.random() - 0.5) * 25;
          ctx.lineTo(arcX, arcY);
        }
        ctx.stroke();
      }
    }
    `
  ),

  // 7. Mechanical Engineering
  "mechanical-engineering.html": wrapAnimationHtml(
    "Mechanical Engineering",
    "#0D0E12",
    `
    let angle = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      angle += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Function to draw realistic mechanical gear with involute teeth
      function drawGear(gx, gy, radius, teeth, rot, color) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(rot);

        ctx.beginPath();
        const toothDepth = radius * 0.18;
        for (let i = 0; i < teeth; i++) {
          const a1 = (Math.PI * 2 / teeth) * i;
          const a2 = a1 + (Math.PI / teeth) * 0.5;
          const a3 = a1 + (Math.PI / teeth);
          const a4 = a1 + (Math.PI / teeth) * 1.5;

          const rOut = radius + toothDepth;
          const rIn = radius - toothDepth * 0.5;

          ctx.lineTo(rIn * Math.cos(a1), rIn * Math.sin(a1));
          ctx.lineTo(rOut * Math.cos(a2), rOut * Math.sin(a2));
          ctx.lineTo(rOut * Math.cos(a3), rOut * Math.sin(a3));
          ctx.lineTo(rIn * Math.cos(a4), rIn * Math.sin(a4));
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Inner hub & spokes
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        for (let s = 0; s < 4; s++) {
          const sa = (Math.PI / 2) * s;
          ctx.beginPath();
          ctx.moveTo(radius * 0.35 * Math.cos(sa), radius * 0.35 * Math.sin(sa));
          ctx.lineTo((radius - toothDepth) * Math.cos(sa), (radius - toothDepth) * Math.sin(sa));
          ctx.stroke();
        }

        ctx.restore();
      }

      // Interconnected 3-gear train
      const g1X = w * 0.35;
      const g1Y = h * 0.45;
      const g1R = Math.min(w, h) * 0.22;
      drawGear(g1X, g1Y, g1R, 16, angle, "#94A3B8");

      const g2R = g1R * 0.65;
      const g2X = g1X + (g1R + g2R) * 0.96;
      const g2Y = g1Y + 15;
      drawGear(g2X, g2Y, g2R, 10, -angle * (16 / 10), "#F97316");

      // Slider-crank piston mechanism on the right/bottom
      const crankR = 25;
      const rodL = 80;
      const crankX = g2X;
      const crankY = g2Y;
      const pinX = crankX + crankR * Math.cos(-angle * 1.6);
      const pinY = crankY + crankR * Math.sin(-angle * 1.6);
      const pistonX = pinX + Math.sqrt(rodL * rodL - Math.pow(pinY - crankY, 2));
      const pistonY = crankY;

      // Connecting rod
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(pistonX, pistonY);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Piston head
      ctx.fillStyle = "rgba(180, 83, 9, 0.4)";
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 1.5;
      ctx.fillRect(pistonX - 10, pistonY - 14, 24, 28);
      ctx.strokeRect(pistonX - 10, pistonY - 14, 24, 28);
    }
    `
  ),

  // 8. Civil Engineering
  "civil-engineering.html": wrapAnimationHtml(
    "Civil Engineering",
    "#0B1424",
    `
    let loadT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      loadT += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Blueprint drafting grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      const gSize = 25;
      for (let x = 0; x < w; x += gSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Pratt Truss Bridge Structural Framework
      const bays = 6;
      const bayW = (w * 0.8) / bays;
      const startX = w * 0.1;
      const botY = h * 0.65;
      const topY = h * 0.35;

      const topNodes = [];
      const botNodes = [];

      for (let i = 0; i <= bays; i++) {
        botNodes.push({ x: startX + i * bayW, y: botY });
        if (i > 0 && i < bays) {
          topNodes.push({ x: startX + i * bayW, y: topY });
        }
      }

      // Bottom chord
      ctx.beginPath();
      ctx.moveTo(botNodes[0].x, botNodes[0].y);
      for (let i = 1; i < botNodes.length; i++) ctx.lineTo(botNodes[i].x, botNodes[i].y);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top chord
      ctx.beginPath();
      ctx.moveTo(topNodes[0].x, topNodes[0].y);
      for (let i = 1; i < topNodes.length; i++) ctx.lineTo(topNodes[i].x, topNodes[i].y);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Diagonal and vertical truss members with FEA stress colors
      for (let i = 0; i < topNodes.length; i++) {
        const tn = topNodes[i];
        const bn = botNodes[i + 1];

        // Vertical member
        ctx.beginPath();
        ctx.moveTo(tn.x, tn.y);
        ctx.lineTo(bn.x, bn.y);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Diagonal member (tension: blue, compression: orange)
        const isComp = (i + Math.floor(loadT)) % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(topNodes[i].x, topNodes[i].y);
        ctx.lineTo(botNodes[i].x, botNodes[i].y);
        ctx.strokeStyle = isComp ? "#F59E0B" : "#38BDF8";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Moving live vehicle load vector
      const loadPos = (loadT % 1) * (w * 0.8) + startX;
      ctx.beginPath();
      ctx.moveTo(loadPos, botY - 25);
      ctx.lineTo(loadPos, botY - 5);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Load arrow tip
      ctx.beginPath();
      ctx.moveTo(loadPos - 4, botY - 12);
      ctx.lineTo(loadPos, botY - 5);
      ctx.lineTo(loadPos + 4, botY - 12);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    `
  ),

  // 9. Chemical Engineering
  "chemical-engineering.html": wrapAnimationHtml(
    "Chemical Engineering",
    "#041B1A",
    `
    const molecules = [];
    let vortexAngle = 0;

    function init(w, h) {
      molecules.length = 0;
      for (let i = 0; i < 35; i++) {
        molecules.push({
          x: w * 0.5 + (Math.random() - 0.5) * (w * 0.5),
          y: h * 0.45 + (Math.random() - 0.5) * (h * 0.4),
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          type: Math.random() > 0.5 ? 'A' : 'B'
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      vortexAngle += dt * 2.0;
      for (const m of molecules) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x < w * 0.2 || m.x > w * 0.8) m.vx *= -1;
        if (m.y < h * 0.25 || m.y > h * 0.75) m.vy *= -1;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Reactor vessel outline
      ctx.beginPath();
      ctx.rect(w * 0.2, h * 0.25, w * 0.6, h * 0.5);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Fluid level wave inside reactor
      ctx.beginPath();
      ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
      ctx.moveTo(w * 0.2, h * 0.75);
      for (let x = w * 0.2; x <= w * 0.8; x += 10) {
        const y = h * 0.35 + Math.sin(x * 0.03 + vortexAngle) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w * 0.8, h * 0.75);
      ctx.closePath();
      ctx.fill();

      // Center Impeller agitator shaft & blades
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.15);
      ctx.lineTo(cx, h * 0.65);
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Impeller blades
      const bladeW = Math.cos(vortexAngle) * 35;
      ctx.beginPath();
      ctx.moveTo(cx - bladeW, h * 0.65);
      ctx.lineTo(cx + bladeW, h * 0.65);
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Reactant molecules (Catalytic reaction: Green A + Teal B)
      for (const m of molecules) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = m.type === 'A' ? "#10B981" : "#06B6D4";
        ctx.fill();
      }
    }
    `
  ),

  // 10. Biotechnology (Engineering)
  "biotechnology.html": wrapAnimationHtml(
    "Biotechnology",
    "#061A18",
    `
    let rot = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      rot += dt * 1.5;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const count = 28;
      const stepY = (h * 0.8) / count;
      const startY = h * 0.1;
      const radius = Math.min(w * 0.28, 80);

      // Rotating 3D DNA Double Helix
      for (let i = 0; i < count; i++) {
        const y = startY + i * stepY;
        const a1 = rot + i * 0.28;
        const a2 = a1 + Math.PI;

        const x1 = cx + Math.sin(a1) * radius;
        const z1 = Math.cos(a1);

        const x2 = cx + Math.sin(a2) * radius;
        const z2 = Math.cos(a2);

        // Base pair hydrogen rung
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = "rgba(45, 212, 191, 0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Strand 1 node (Adenine / Thymine: Emerald)
        ctx.beginPath();
        ctx.arc(x1, y, 3.5 + z1 * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? "#10B981" : "#047857";
        ctx.fill();

        // Strand 2 node (Guanine / Cytosine: Violet)
        ctx.beginPath();
        ctx.arc(x2, y, 3.5 + z2 * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = z2 > 0 ? "#A78BFA" : "#6D28D9";
        ctx.fill();
      }
    }
    `
  ),

  // 11. Information Technology
  "information-technology.html": wrapAnimationHtml(
    "Information Technology",
    "#071224",
    `
    const clusters = [];
    const packets = [];
    let dispatchTimer = 0;

    function init(w, h) {
      clusters.length = 0;
      packets.length = 0;
      // Load balancer in center-top
      clusters.push({ id: 0, x: w * 0.5, y: h * 0.25, isLB: true });
      // 4 cluster servers
      for (let i = 0; i < 4; i++) {
        clusters.push({
          id: i + 1,
          x: (w / 5) * (i + 1),
          y: h * 0.65,
          isLB: false,
          load: 0.2 + Math.random() * 0.6
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      dispatchTimer += dt;
      if (dispatchTimer > 0.35) {
        dispatchTimer = 0;
        const target = 1 + Math.floor(Math.random() * 4);
        packets.push({
          srcX: clusters[0].x,
          srcY: clusters[0].y,
          dstX: clusters[target].x,
          dstY: clusters[target].y,
          t: 0,
          speed: 1.5
        });
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed * dt;
        if (p.t >= 1) packets.splice(i, 1);
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Connecting network bus lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(clusters[0].x, clusters[0].y);
        ctx.lineTo(clusters[i].x, clusters[i].y);
        ctx.stroke();
      }

      // Flying data packets
      for (const p of packets) {
        const px = p.srcX + (p.dstX - p.srcX) * p.t;
        const py = p.srcY + (p.dstY - p.srcY) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00F0FF";
        ctx.shadowColor = "#00F0FF";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Load Balancer
      ctx.fillStyle = "#2563EB";
      ctx.fillRect(clusters[0].x - 24, clusters[0].y - 14, 48, 28);
      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(clusters[0].x - 24, clusters[0].y - 14, 48, 28);

      // Draw Server Racks
      for (let i = 1; i <= 4; i++) {
        const c = clusters[i];
        ctx.fillStyle = "#0F1E36";
        ctx.fillRect(c.x - 22, c.y - 25, 44, 50);
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(c.x - 22, c.y - 25, 44, 50);

        // Blinking LED status lights
        for (let l = 0; l < 3; l++) {
          ctx.beginPath();
          ctx.arc(c.x - 12 + l * 12, c.y + 12, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = (Math.sin(Date.now() * 0.005 + i + l) > 0) ? "#10B981" : "#06B6D4";
          ctx.fill();
        }
      }
    }
    `
  ),

  // 12. Robotics and Automation
  "robotics-automation.html": wrapAnimationHtml(
    "Robotics and Automation",
    "#0F1118",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Conveyor belt at the bottom
      const beltY = h * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, beltY);
      ctx.lineTo(w, beltY);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Conveyor rollers
      for (let x = 20; x < w; x += 35) {
        ctx.beginPath();
        ctx.arc(x, beltY + 8, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#64748B";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Articulated 3-DOF Robotic Arm
      const baseX = w * 0.35;
      const baseY = beltY;

      // Base pedestal
      ctx.fillStyle = "#334155";
      ctx.fillRect(baseX - 25, baseY - 12, 50, 12);

      // Arm kinematic joint angles
      const l1 = 70;
      const l2 = 60;
      const a1 = -Math.PI * 0.45 + Math.sin(t) * 0.35;
      const a2 = Math.PI * 0.5 + Math.cos(t * 0.8) * 0.45;

      const j1X = baseX;
      const j1Y = baseY - 12;
      const j2X = j1X + Math.cos(a1) * l1;
      const j2Y = j1Y + Math.sin(a1) * l1;
      const effX = j2X + Math.cos(a1 + a2) * l2;
      const effY = j2Y + Math.sin(a1 + a2) * l2;

      // Arm Segment 1
      ctx.beginPath();
      ctx.moveTo(j1X, j1Y);
      ctx.lineTo(j2X, j2Y);
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Arm Segment 2
      ctx.beginPath();
      ctx.moveTo(j2X, j2Y);
      ctx.lineTo(effX, effY);
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // Joints
      ctx.beginPath();
      ctx.arc(j1X, j1Y, 6, 0, Math.PI * 2);
      ctx.arc(j2X, j2Y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#CBD5E1";
      ctx.fill();

      // Optical Laser Sensor Beam from end-effector
      ctx.beginPath();
      ctx.moveTo(effX, effY);
      ctx.lineTo(effX, beltY);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Laser impact spot on conveyor
      ctx.beginPath();
      ctx.arc(effX, beltY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#38BDF8";
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  )
};

