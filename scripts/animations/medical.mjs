import { wrapAnimationHtml } from "./common.mjs";

export const medicalAnimations = {
  // 13. General Medicine
  "general-medicine.html": wrapAnimationHtml(
    "General Medicine",
    "#0B080C",
    `
    let sweepX = 0;
    const ecgBuffer = [];

    function init(w, h) {
      ecgBuffer.length = 0;
      for (let x = 0; x < w; x++) {
        ecgBuffer.push(h * 0.5);
      }
    }

    function onResize(w, h) { init(w, h); }

    function getEcgY(t, midY) {
      const cycle = t % 120;
      if (cycle < 20) return midY;
      if (cycle < 30) return midY - 6; // P wave
      if (cycle < 45) return midY;
      if (cycle < 50) return midY + 8; // Q dip
      if (cycle < 58) return midY - 60; // R peak
      if (cycle < 65) return midY + 18; // S dip
      if (cycle < 80) return midY;
      if (cycle < 95) return midY - 14; // T wave
      return midY;
    }

    function update(dt) {
      const step = Math.floor(dt * 180);
      const midY = h * 0.5;
      for (let s = 0; s < step; s++) {
        sweepX = (sweepX + 1) % w;
        ecgBuffer[sweepX] = getEcgY(sweepX + (Date.now() * 0.05), midY);
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Hospital Monitor Grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // ECG Waveform trace
      ctx.beginPath();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.0;
      ctx.shadowColor = "#10B981";
      ctx.shadowBlur = 8;

      let started = false;
      for (let x = 0; x < w; x++) {
        // Gap near the sweep head
        if (Math.abs(x - sweepX) < 15) continue;
        const y = ecgBuffer[x];
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulse readout text
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#EF4444";
      ctx.fillText("HR: 72 BPM [NORMAL SINUS]", 20, 30);
      ctx.fillStyle = "#10B981";
      ctx.fillText("SpO2: 99%", 20, 50);
    }
    `
  ),

  // 14. Surgery
  "surgery.html": wrapAnimationHtml(
    "Surgery",
    "#070F14",
    `
    let targetX = 0;
    let targetY = 0;
    let t = 0;

    function init(w, h) {
      targetX = w * 0.5;
      targetY = h * 0.5;
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      t += dt * 1.5;
      targetX = w * 0.5 + Math.sin(t * 0.7) * (w * 0.25);
      targetY = h * 0.5 + Math.cos(t * 0.9) * (h * 0.2);
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Laparoscopic circular field of view
      const cx = w * 0.5;
      const cy = h * 0.5;
      const fovR = Math.min(w, h) * 0.42;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, fovR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.clip();

      // Tissue contour lines
      ctx.strokeStyle = "rgba(239, 68, 68, 0.12)";
      ctx.lineWidth = 1.2;
      for (let r = 20; r < fovR; r += 35) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Laser scalpel guidance crosshairs
      ctx.beginPath();
      ctx.moveTo(targetX - 25, targetY); ctx.lineTo(targetX + 25, targetY);
      ctx.moveTo(targetX, targetY - 25); ctx.lineTo(targetX, targetY + 25);
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Precision target reticle circle
      ctx.beginPath();
      ctx.arc(targetX, targetY, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#22C55E";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Micro-suture curved arc paths
      ctx.beginPath();
      ctx.arc(targetX - 35, targetY - 15, 20, 0.2, Math.PI * 0.9);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    }
    `
  ),

  // 15. Pharmacology
  "pharmacology.html": wrapAnimationHtml(
    "Pharmacology",
    "#0B0817",
    `
    const ligands = [];
    let bindProgress = 0;

    function init(w, h) {
      ligands.length = 0;
      for (let i = 0; i < 18; i++) {
        ligands.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          size: 4 + Math.random() * 3
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      bindProgress = (bindProgress + dt * 0.6) % 1;
      for (const l of ligands) {
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        if (l.x < 10 || l.x > w - 10) l.vx *= -1;
        if (l.y < 10 || l.y > h - 10) l.vy *= -1;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.45;
      const cy = h * 0.5;

      // Receptor active catalytic binding pocket (Lock-and-Key Model)
      ctx.beginPath();
      ctx.arc(cx, cy, 65, Math.PI * 0.3, Math.PI * 1.7);
      // Indented binding cleft
      ctx.arc(cx + 35, cy, 32, Math.PI * 0.8, Math.PI * 1.2, true);
      ctx.strokeStyle = "#8B5CF6";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Docking ligand molecule entering cleft
      const dockX = cx + 20 + Math.sin(bindProgress * Math.PI * 2) * 25;
      const dockY = cy;

      ctx.beginPath();
      ctx.arc(dockX, dockY, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
      ctx.shadowColor = "#06B6D4";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Free diffusing ligand molecules
      for (const l of ligands) {
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2);
        ctx.fillStyle = "#A78BFA";
        ctx.fill();
      }

      // Pharmacokinetic plasma concentration curve at bottom (C_max, T_max)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
      ctx.lineWidth = 1.8;
      const startX = w * 0.1;
      const baseY = h * 0.88;
      for (let x = 0; x < w * 0.8; x += 5) {
        const tVal = x * 0.03;
        const cVal = Math.exp(-tVal * 0.6) * Math.sin(tVal * 0.8) * 45;
        const curY = baseY - Math.max(0, cVal);
        if (x === 0) ctx.moveTo(startX + x, curY); else ctx.lineTo(startX + x, curY);
      }
      ctx.stroke();
    }
    `
  ),

  // 16. Microbiology
  "microbiology.html": wrapAnimationHtml(
    "Microbiology",
    "#051310",
    `
    const bacteria = [];

    function init(w, h) {
      bacteria.length = 0;
      for (let i = 0; i < 24; i++) {
        bacteria.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          len: 12 + Math.random() * 10,
          angle: Math.random() * Math.PI * 2,
          division: Math.random()
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      for (const b of bacteria) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += dt * 0.4;
        b.division = (b.division + dt * 0.2) % 1;
        if (b.x < 0) b.x = w; if (b.x > w) b.x = 0;
        if (b.y < 0) b.y = h; if (b.y > h) b.y = 0;
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Darkfield microscope circular viewing aperture
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.44;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(132, 204, 22, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.clip();

      // Bacilli bacteria rods with flagella
      for (const b of bacteria) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        // Capsule rod
        ctx.beginPath();
        const half = b.len * 0.5;
        ctx.moveTo(-half, -4);
        ctx.lineTo(half, -4);
        ctx.arc(half, 0, 4, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-half, 4);
        ctx.arc(-half, 0, 4, Math.PI / 2, -Math.PI / 2);
        ctx.fillStyle = "rgba(132, 204, 22, 0.75)";
        ctx.fill();

        // Flagella tail
        ctx.beginPath();
        ctx.moveTo(-half, 0);
        ctx.quadraticCurveTo(-half - 8, Math.sin(b.division * 10) * 6, -half - 18, 0);
        ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
    }
    `
  ),

  // 17. Biotechnology (Medical)
  "biotechnology.html": wrapAnimationHtml(
    "Medical Biotechnology",
    "#11081C",
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
      const cy = h * 0.48;

      // CRISPR-Cas9 Endonuclease Molecular Scissor Mechanism
      // Target DNA unwinding
      ctx.beginPath();
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 2.5;
      for (let x = w * 0.15; x < w * 0.85; x += 5) {
        // Strand 1
        const bulge = Math.exp(-Math.pow(x - cx, 2) / 3000) * 22;
        const y1 = cy - 14 - bulge + Math.sin(x * 0.05 + t) * 4;
        if (x === w * 0.15) ctx.moveTo(x, y1); else ctx.lineTo(x, y1);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 2.5;
      for (let x = w * 0.15; x < w * 0.85; x += 5) {
        // Strand 2
        const bulge = Math.exp(-Math.pow(x - cx, 2) / 3000) * 22;
        const y2 = cy + 14 + bulge - Math.sin(x * 0.05 + t) * 4;
        if (x === w * 0.15) ctx.moveTo(x, y2); else ctx.lineTo(x, y2);
      }
      ctx.stroke();

      // Guide RNA (sgRNA) in magenta
      ctx.beginPath();
      ctx.strokeStyle = "#EC4899";
      ctx.lineWidth = 2;
      for (let x = cx - 40; x < cx + 40; x += 4) {
        const y = cy - 6 + Math.sin(x * 0.1) * 3;
        if (x === cx - 40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Cas9 Endonuclease Cleavage Spark Flash
      if (Math.sin(t * 3) > 0.6) {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#FDE047";
        ctx.shadowColor = "#FDE047";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    `
  ),

  // 18. Neuroscience
  "neuroscience.html": wrapAnimationHtml(
    "Neuroscience",
    "#070C1A",
    `
    const dendrites = [];
    let pulseT = 0;

    function init(w, h) {
      dendrites.length = 0;
      const cx = w * 0.35;
      const cy = h * 0.5;

      // 6 main dendrite branches radiating from soma
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const len = 45 + Math.random() * 30;
        const x2 = cx + Math.cos(angle) * len;
        const y2 = cy + Math.sin(angle) * len;
        dendrites.push({ x1: cx, y1: cy, x2, y2 });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      pulseT = (pulseT + dt * 1.8) % 1;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const somaX = w * 0.35;
      const somaY = h * 0.5;
      const axonEndX = w * 0.85;
      const axonEndY = h * 0.5;

      // Dendrite arborization branches
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 1.6;
      for (const d of dendrites) {
        ctx.beginPath();
        ctx.moveTo(d.x1, d.y1);
        ctx.lineTo(d.x2, d.y2);
        ctx.stroke();
      }

      // Axon trunk
      ctx.beginPath();
      ctx.moveTo(somaX, somaY);
      ctx.lineTo(axonEndX, axonEndY);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Action potential electric pulse firing down the axon
      const pulseX = somaX + (axonEndX - somaX) * pulseT;
      ctx.beginPath();
      ctx.arc(pulseX, somaY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#00F0FF";
      ctx.shadowColor = "#00F0FF";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Soma (Cell Body)
      ctx.beginPath();
      ctx.arc(somaX, somaY, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#8B5CF6";
      ctx.shadowColor = "#8B5CF6";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Nucleus
      ctx.beginPath();
      ctx.arc(somaX, somaY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#FDE047";
      ctx.fill();
    }
    `
  ),

  // 19. Public Health
  "public-health.html": wrapAnimationHtml(
    "Public Health",
    "#0B131C",
    `
    const nodes = [];
    let spreadT = 0;

    function init(w, h) {
      nodes.length = 0;
      const count = 35;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: w * 0.15 + Math.random() * (w * 0.7),
          y: h * 0.2 + Math.random() * (h * 0.6),
          state: i === 0 ? 'infected' : (Math.random() < 0.4 ? 'immune' : 'susceptible')
        });
      }
    }

    function onResize(w, h) { init(w, h); }

    function update(dt) {
      spreadT += dt;
      if (spreadT > 2.0) {
        spreadT = 0;
        // Random infection spread
        const inf = nodes.filter(n => n.state === 'infected');
        if (inf.length < 15) {
          const target = nodes.find(n => n.state === 'susceptible');
          if (target) target.state = 'infected';
        } else {
          // Reset wave
          nodes.forEach((n, i) => n.state = i === 0 ? 'infected' : (Math.random() < 0.4 ? 'immune' : 'susceptible'));
        }
      }
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Contact transmission lines between nearby nodes
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (Math.hypot(dx, dy) < 70) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Epidemic Network Population Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        if (n.state === 'infected') {
          ctx.fillStyle = "#EF4444";
          ctx.shadowColor = "#EF4444";
          ctx.shadowBlur = 8;
        } else if (n.state === 'immune') {
          ctx.fillStyle = "#10B981";
        } else {
          ctx.fillStyle = "#38BDF8";
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    `
  ),

  // 20. Medical Imaging
  "medical-imaging.html": wrapAnimationHtml(
    "Medical Imaging",
    "#070B12",
    `
    let scanY = 0;

    function init(w, h) { scanY = h * 0.2; }
    function onResize(w, h) { scanY = h * 0.2; }

    function update(dt) {
      scanY += dt * 65;
      if (scanY > h * 0.8) scanY = h * 0.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Axial CT / MRI Tomographic slice aperture
      const r = Math.min(w, h) * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(37, 99, 235, 0.4)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Anatomical density contours
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * (i * 0.28), r * (i * 0.22), 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Active radiological laser scanning line
      ctx.beginPath();
      ctx.moveTo(cx - r, scanY);
      ctx.lineTo(cx + r, scanY);
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00F0FF";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // DICOM coordinates overlay
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(56, 189, 248, 0.5)";
      ctx.fillText("SLICE: 48/120  VOXEL: 0.5mm", 20, 25);
    }
    `
  ),

  // 21. Bioinformatics
  "bioinformatics.html": wrapAnimationHtml(
    "Bioinformatics",
    "#08101E",
    `
    const seqA = "ATGCGATCGATCGGCTA";
    const seqB = "ATGCG--CGATCCGCTA";
    let alignT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      alignT = (alignT + dt * 0.8) % seqA.length;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Sequence Alignment Matrix Grid
      ctx.font = "bold 13px monospace";
      const startX = w * 0.12;
      const charW = (w * 0.76) / seqA.length;

      for (let i = 0; i < seqA.length; i++) {
        const x = startX + i * charW;
        const curIdx = Math.floor(alignT);
        const isMatch = seqA[i] === seqB[i];

        // Sequence A (Top)
        ctx.fillStyle = i === curIdx ? "#00F0FF" : "#10B981";
        ctx.fillText(seqA[i], x, h * 0.38);

        // Alignment match bar
        ctx.fillStyle = isMatch ? "#10B981" : "#EF4444";
        ctx.fillRect(x + 2, h * 0.44, 4, isMatch ? 8 : 2);

        // Sequence B (Bottom)
        ctx.fillStyle = i === curIdx ? "#00F0FF" : "#8B5CF6";
        ctx.fillText(seqB[i], x, h * 0.58);
      }

      // Rooted phylogenetic tree cladogram at bottom
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.4;
      const treeY = h * 0.78;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, treeY); ctx.lineTo(w * 0.4, treeY);
      ctx.lineTo(w * 0.4, treeY - 20); ctx.lineTo(w * 0.6, treeY - 20);
      ctx.moveTo(w * 0.4, treeY); ctx.lineTo(w * 0.4, treeY + 20); ctx.lineTo(w * 0.7, treeY + 20);
      ctx.stroke();
    }
    `
  )
};

