import { wrapAnimationHtml } from "./common.mjs";

export const scienceAnimations = {
  // 22. Physics
  "physics.html": wrapAnimationHtml(
    "Physics",
    "#07081A",
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

      // Spacetime curvature grid depression in background
      ctx.strokeStyle = "rgba(139, 92, 246, 0.08)";
      ctx.lineWidth = 1;
      for (let r = 20; r < 160; r += 25) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Quantum Atomic Orbitals (3 elliptical electron shells)
      const shells = [
        { rx: 90, ry: 35, rot: 0, color: "#8B5CF6", speed: 2.2 },
        { rx: 90, ry: 35, rot: Math.PI / 3, color: "#00F0FF", speed: 1.8 },
        { rx: 90, ry: 35, rot: -Math.PI / 3, color: "#EC4899", speed: 2.5 }
      ];

      for (const s of shells) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(s.rot);

        // Orbital path
        ctx.beginPath();
        ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Orbiting quantum electron particle
        const ea = t * s.speed;
        const ex = Math.cos(ea) * s.rx;
        const ey = Math.sin(ea) * s.ry;

        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // Atomic Nucleus (protons & neutrons cluster)
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#FDE047";
      ctx.shadowColor = "#FDE047";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 23. Chemistry
  "chemistry.html": wrapAnimationHtml(
    "Chemistry",
    "#08121A",
    `
    let rot = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      rot += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = 55;

      // Rotating Benzene Ring Resonance Structure (Aromatic Hydrocarbon)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      const vertices = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        vertices.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
      }

      // Outer carbon-carbon bonds
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        if (i === 0) ctx.moveTo(vertices[i].x, vertices[i].y);
        else ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner aromatic delocalized pi-electron circle
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Carbon atom balls
      for (const v of vertices) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#10B981";
        ctx.fill();
      }

      ctx.restore();

      // Exothermic reaction potential energy curve in corner
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 1.5;
      const startX = w * 0.1;
      const baseY = h * 0.85;
      for (let x = 0; x < w * 0.8; x += 5) {
        const tVal = x * 0.03;
        // Activation energy barrier hump then drop (delta H < 0)
        const hump = Math.exp(-Math.pow(tVal - 2.5, 2) / 0.8) * 35;
        const curY = baseY - (tVal < 2.5 ? hump : hump - 15);
        if (x === 0) ctx.moveTo(startX + x, curY); else ctx.lineTo(startX + x, curY);
      }
      ctx.stroke();
    }
    `
  ),

  // 24. Mathematics
  "mathematics.html": wrapAnimationHtml(
    "Mathematics",
    "#060A14",
    `
    let t = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      t += dt * 0.6;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Golden Ratio Logarithmic Spiral (Fibonacci Spiral)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.65)";
      ctx.lineWidth = 1.8;
      for (let a = 0; a < Math.PI * 8; a += 0.08) {
        const r = 3 * Math.exp(0.12 * a);
        const x = cx + r * Math.cos(a + t);
        const y = cy + r * Math.sin(a + t);
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Parametric Lissajous / Harmonic curves in background
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
      ctx.lineWidth = 1.2;
      for (let th = 0; th < Math.PI * 2; th += 0.02) {
        const x = cx + Math.sin(th * 3 + t) * (w * 0.35);
        const y = cy + Math.sin(th * 2) * (h * 0.3);
        if (th === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    `
  ),

  // 25. Biology
  "biology.html": wrapAnimationHtml(
    "Biology",
    "#061610",
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
      const cy = h * 0.5;

      // Eukaryotic Cellular Mitosis (Metaphase / Anaphase Separation)
      // Cell membrane cleavage furrow
      ctx.beginPath();
      const pinch = Math.sin(t) * 15;
      ctx.ellipse(cx, cy, 95, 60 - pinch, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Centriole Spindle Poles
      const pole1X = cx - 65;
      const pole2X = cx + 65;
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(pole1X - 3, cy - 3, 6, 6);
      ctx.fillRect(pole2X - 3, cy - 3, 6, 6);

      // Microtubule spindle fibers pulling chromosomes
      ctx.strokeStyle = "rgba(45, 212, 191, 0.3)";
      ctx.lineWidth = 1;
      const chromoSeparation = Math.sin(t) * 20;

      for (let i = -3; i <= 3; i++) {
        const midY = cy + i * 12;
        // Fiber 1 to left chromatid
        ctx.beginPath();
        ctx.moveTo(pole1X, cy);
        ctx.lineTo(cx - chromoSeparation, midY);
        ctx.stroke();

        // Fiber 2 to right chromatid
        ctx.beginPath();
        ctx.moveTo(pole2X, cy);
        ctx.lineTo(cx + chromoSeparation, midY);
        ctx.stroke();

        // Chromosome sister chromatids (X-shape)
        ctx.fillStyle = "#A78BFA";
        ctx.fillRect(cx - chromoSeparation - 4, midY - 3, 8, 6);
        ctx.fillRect(cx + chromoSeparation - 4, midY - 3, 8, 6);
      }
    }
    `
  ),

  // 26. Statistics
  "statistics.html": wrapAnimationHtml(
    "Statistics",
    "#07111F",
    `
    let shift = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      shift += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5 + Math.sin(shift) * 25;
      const baseY = h * 0.82;
      const sigma = 55;

      // Gaussian Normal Bell Curve Shaded Region (-1 sigma to +1 sigma)
      ctx.beginPath();
      ctx.moveTo(cx - sigma, baseY);
      for (let x = cx - sigma; x <= cx + sigma; x += 2) {
        const z = (x - cx) / sigma;
        const y = baseY - (Math.exp(-0.5 * z * z) * (h * 0.55));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(cx + sigma, baseY);
      ctx.closePath();
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fill();

      // Full Normal Curve Outline
      ctx.beginPath();
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.2;
      for (let x = 0; x < w; x += 3) {
        const z = (x - cx) / sigma;
        const y = baseY - (Math.exp(-0.5 * z * z) * (h * 0.55));
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Standard deviation marker lines
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      // Mean mu
      ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, baseY - (h * 0.55)); ctx.stroke();
      // -1 sigma
      ctx.beginPath(); ctx.moveTo(cx - sigma, baseY); ctx.lineTo(cx - sigma, baseY - (h * 0.33)); ctx.stroke();
      // +1 sigma
      ctx.beginPath(); ctx.moveTo(cx + sigma, baseY); ctx.lineTo(cx + sigma, baseY - (h * 0.33)); ctx.stroke();
      ctx.setLineDash([]);
    }
    `
  ),

  // 27. Environmental Science
  "environmental-science.html": wrapAnimationHtml(
    "Environmental Science",
    "#05131C",
    `
    let flowT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      flowT += dt * 1.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Atmospheric Circulation & Ocean Conveyor Currents
      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const yBase = h * 0.25 + i * (h * 0.12);
        ctx.beginPath();
        ctx.strokeStyle = i < 3 ? "rgba(14, 165, 233, 0.4)" : "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1.8;

        for (let x = 0; x < w; x += 8) {
          const y = yBase + Math.sin(x * 0.015 + flowT + i) * 16;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Solar Radiation rays entering atmosphere
      ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const rx = w * 0.15 + i * (w * 0.14);
        ctx.beginPath();
        ctx.moveTo(rx, 10);
        ctx.lineTo(rx + 25, h * 0.35);
        ctx.stroke();
      }
    }
    `
  )
};

