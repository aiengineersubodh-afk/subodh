import { wrapAnimationHtml } from "./common.mjs";

export const agricultureInterdisciplinaryAnimations = {
  // 48. Precision Agronomy
  "precision-agronomy.html": wrapAnimationHtml(
    "Precision Agronomy",
    "#07140B",
    `
    let droneX = 0;

    function init(w, h) { droneX = w * 0.1; }
    function onResize(w, h) { droneX = w * 0.1; }

    function update(dt) {
      droneX += dt * 55;
      if (droneX > w * 0.9) droneX = w * 0.1;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Multispectral NDVI Field Grid (False-color crop canopy)
      const rows = 5;
      const cols = 8;
      const cellW = (w * 0.8) / cols;
      const cellH = (h * 0.45) / rows;
      const startX = w * 0.1;
      const startY = h * 0.35;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = Math.sin(r * 0.8 + c * 0.5) * 0.5 + 0.5;
          ctx.fillStyle = val > 0.5 ? "rgba(34, 197, 94, " + (0.2 + val * 0.3) + ")" : "rgba(234, 88, 12, " + (0.2 + (1 - val) * 0.3) + ")";
          ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW - 2, cellH - 2);
        }
      }

      // Autonomous survey drone flight path line
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY - 25);
      ctx.lineTo(w * 0.9, startY - 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Drone icon & sensor scanning cone
      ctx.beginPath();
      ctx.arc(droneX, startY - 25, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#38BDF8";
      ctx.fill();

      // Optical sensor cone
      ctx.beginPath();
      ctx.moveTo(droneX, startY - 25);
      ctx.lineTo(droneX - 25, startY + 30);
      ctx.lineTo(droneX + 25, startY + 30);
      ctx.closePath();
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.fill();
    }
    `
  ),

  // 49. Plant Breeding and Genetics
  "plant-breeding-genetics.html": wrapAnimationHtml(
    "Plant Breeding and Genetics",
    "#06160F",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.0;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.45;

      // Mendelian Punnett Square 2x2 Grid (Rr x Rr)
      const size = 70;
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cx - size, cy - size, size * 2, size * 2);

      // Dividing cross
      ctx.beginPath();
      ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
      ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
      ctx.stroke();

      // Allele labels inside quadrants
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#A78BFA";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RR", cx - size * 0.5, cy - size * 0.5);
      ctx.fillText("Rr", cx + size * 0.5, cy - size * 0.5);
      ctx.fillText("rR", cx - size * 0.5, cy + size * 0.5);
      ctx.fillText("rr", cx + size * 0.5, cy + size * 0.5);

      // Chromosome linkage crossing-over curves at bottom
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
      ctx.lineWidth = 2;
      for (let x = w * 0.2; x <= w * 0.8; x += 5) {
        const y = h * 0.82 + Math.sin(x * 0.04 + t) * 12;
        if (x === w * 0.2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    `
  ),

  // 50. Soil and Water Engineering
  "soil-water-engineering.html": wrapAnimationHtml(
    "Soil and Water Engineering",
    "#120D08",
    `
    let dropT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      dropT = (dropT + dt * 0.8) % 1;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Soil vertical geological strata layers (Clay, Loam, Sand)
      const layers = [
        { y: h * 0.35, color: "rgba(180, 83, 9, 0.25)", label: "Topsoil / Loam" },
        { y: h * 0.55, color: "rgba(146, 64, 14, 0.35)", label: "Clay Subsoil" },
        { y: h * 0.75, color: "rgba(120, 53, 15, 0.45)", label: "Bedrock Strata" }
      ];

      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        ctx.fillStyle = l.color;
        ctx.fillRect(0, l.y, w, h - l.y);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, l.y); ctx.lineTo(w, l.y); ctx.stroke();
      }

      // Subsurface drip irrigation moisture bulb percolation
      const bulbX = w * 0.5;
      const emitterY = h * 0.35;

      for (let r = 15; r <= 65; r += 16) {
        ctx.beginPath();
        ctx.ellipse(bulbX, emitterY + r * 0.6, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(6, 182, 212, " + (0.8 - r / 80) + ")";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Moving water percolation droplet
      const curY = emitterY + dropT * 60;
      ctx.beginPath();
      ctx.arc(bulbX, curY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#38BDF8";
      ctx.fill();
    }
    `
  ),

  // 51. Horticulture Science
  "horticulture-science.html": wrapAnimationHtml(
    "Horticulture Science",
    "#06170E",
    `
    let growT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      growT += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const baseY = h * 0.82;

      // Smart Greenhouse structural apex framework
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, baseY);
      ctx.lineTo(w * 0.2, h * 0.35);
      ctx.lineTo(cx, h * 0.18);
      ctx.lineTo(w * 0.8, h * 0.35);
      ctx.lineTo(w * 0.8, baseY);
      ctx.stroke();

      // PAR (Photosynthetically Active Radiation) light spectrum rays from roof
      ctx.strokeStyle = "rgba(217, 70, 239, 0.25)";
      ctx.lineWidth = 1.8;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 20, h * 0.22);
        ctx.lineTo(cx + i * 35, baseY - 20);
        ctx.stroke();
      }

      // Plant phototropism stem growing toward light
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      const stemH = 65 + Math.sin(growT) * 10;
      ctx.quadraticCurveTo(cx - 15, baseY - stemH * 0.5, cx, baseY - stemH);
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Leaves
      ctx.fillStyle = "#84CC16";
      ctx.beginPath();
      ctx.ellipse(cx - 12, baseY - stemH * 0.5, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(cx + 12, baseY - stemH * 0.6, 12, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    `
  ),

  // 52. Agricultural Economics
  "agricultural-economics.html": wrapAnimationHtml(
    "Agricultural Economics",
    "#0F130B",
    `
    let cycleT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      cycleT += dt * 0.9;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Commodity Futures Market Cycles (Wheat / Corn harvest price cycles)
      const startX = w * 0.15;
      const baseY = h * 0.5;

      // Price cycle curve
      ctx.beginPath();
      ctx.strokeStyle = "#EAB308";
      ctx.lineWidth = 2.2;
      for (let x = 0; x < w * 0.7; x += 5) {
        const y = baseY + Math.sin(x * 0.02 + cycleT) * 35;
        if (x === 0) ctx.moveTo(startX + x, y); else ctx.lineTo(startX + x, y);
      }
      ctx.stroke();

      // Yield harvest seasonality bar chart below
      const bars = 10;
      const bW = (w * 0.7) / bars;
      for (let i = 0; i < bars; i++) {
        const val = Math.sin(i * 0.6 + cycleT * 0.5) * 0.5 + 0.5;
        const bH = val * 35;
        ctx.fillStyle = "rgba(34, 197, 94, 0.25)";
        ctx.fillRect(startX + i * bW, h * 0.82 - bH, bW - 4, bH);
      }
    }
    `
  ),

  // 53. Climate Systems and Sustainability
  "climate-systems-sustainability.html": wrapAnimationHtml(
    "Climate Systems and Sustainability",
    "#05111F",
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

      // Planetary Earth sphere wireframe
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.strokeStyle = "#0EA5E9";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Polar Ice Cap Albedo Reflection Feedback (Top & Bottom)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(cx, cy - 60, 25, Math.PI * 0.3, Math.PI * 0.7);
      ctx.fill();

      // Ocean Thermohaline circulation conveyor arcs
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 55, 25, t * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Greenhouse Gas Thermal Radiation Trapping Layer
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(249, 115, 22, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    `
  ),

  // 54. Quantum Information Science
  "quantum-information-science.html": wrapAnimationHtml(
    "Quantum Information Science",
    "#060817",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = 60;

      // Bloch Sphere (Geometrical representation of qubit state space)
      // Sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Equator ellipse
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Z-axis (North Pole |0>, South Pole |1>)
      ctx.beginPath();
      ctx.moveTo(cx, cy - r - 10);
      ctx.lineTo(cx, cy + r + 10);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Qubit State Vector |psi> in Superposition
      const theta = Math.PI * 0.35 + Math.sin(t) * 0.25;
      const phi = t * 1.5;

      const vx = cx + Math.sin(theta) * Math.cos(phi) * r;
      const vy = cy - Math.cos(theta) * r + Math.sin(theta) * Math.sin(phi) * (r * 0.35);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, vy);
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Qubit state point
      ctx.beginPath();
      ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FBBF24";
      ctx.shadowColor = "#FBBF24";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 55. Computational Social Science
  "computational-social-science.html": wrapAnimationHtml(
    "Computational Social Science",
    "#080E1C",
    `
    const agents = [];

    function init(w, h) {
      agents.length = 0;
      for (let i = 0; i < 40; i++) {
        agents.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 35,
          vy: (Math.random() - 0.5) * 35,
          group: Math.random() > 0.5 ? 1 : 2
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      for (const a of agents) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < 10 || a.x > w - 10) a.vx *= -1;
        if (a.y < 10 || a.y > h - 10) a.vy *= -1;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Agent-based Modeling Interaction Links
      ctx.lineWidth = 0.8;
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[i].x - agents[j].x;
          const dy = agents[i].y - agents[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 55) {
            ctx.beginPath();
            ctx.moveTo(agents[i].x, agents[i].y);
            ctx.lineTo(agents[j].x, agents[j].y);
            ctx.strokeStyle = agents[i].group === agents[j].group ? "rgba(6, 182, 212, 0.25)" : "rgba(244, 63, 94, 0.2)";
            ctx.stroke();
          }
        }
      }

      // Agents
      for (const a of agents) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = a.group === 1 ? "#06B6D4" : "#F43F5E";
        ctx.fill();
      }
    }
    `
  ),

  // 56. Biomedical Engineering Systems
  "biomedical-engineering-systems.html": wrapAnimationHtml(
    "Biomedical Engineering Systems",
    "#07101B",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.5;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Brain-Machine Interface (BMI) Neural Spikes to Bionic Signal
      // Neural cortical spike burst on left
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = w * 0.1; x < w * 0.45; x += 3) {
        const spike = (Math.sin(x * 0.2 + t * 4) > 0.8) ? (Math.random() * -30) : 0;
        const y = cy + spike;
        if (x === w * 0.1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Decoder Microchip Filter in center
      ctx.fillStyle = "#0F1E36";
      ctx.fillRect(cx - 18, cy - 18, 36, 36);
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 18, cy - 18, 36, 36);

      // Decoded Smooth Bionic Actuator Kinematic Waveform on right
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = cx + 18; x < w * 0.9; x += 4) {
        const y = cy + Math.sin((x - cx) * 0.04 + t * 2) * 22;
        if (x === cx + 18) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    `
  ),

  // 57. AI Ethics and Governance
  "ai-ethics-governance.html": wrapAnimationHtml(
    "AI Ethics and Governance",
    "#090D18",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const startX = w * 0.15;
      const baseY = h * 0.8;
      const topY = h * 0.2;

      // Algorithmic Fairness Pareto Efficiency Frontier Curve
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, topY); ctx.lineTo(startX, baseY); ctx.lineTo(w * 0.85, baseY);
      ctx.stroke();

      // Pareto Frontier (Tradeoff between Model Accuracy and Fairness Equity)
      ctx.beginPath();
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2.5;
      ctx.moveTo(startX + 20, topY + 20);
      ctx.quadraticCurveTo(w * 0.55, topY + 30, w * 0.8, baseY - 20);
      ctx.stroke();

      // Optimal Ethical Operating Point moving along frontier
      const progress = (Math.sin(t) + 1) * 0.5;
      const px = startX + 20 + progress * (w * 0.6);
      const py = topY + 20 + Math.pow(progress, 1.8) * (baseY - topY - 40);

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.shadowColor = "#10B981";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 58. Fallback (For any unmapped or future specializations)
  "fallback.html": wrapAnimationHtml(
    "Research Network",
    "#090D16",
    `
    const nodes = [];

    function init(w, h) {
      nodes.length = 0;
      const count = 28;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          radius: 2.5 + Math.random() * 2.5
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Graph Edge Connections
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 75) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = "rgba(37, 99, 235, " + (1 - dist / 75) * 0.35 + ")";
            ctx.stroke();
          }
        }
      }

      // Graph Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#38BDF8";
        ctx.fill();
      }
    }
    `
  )
};

