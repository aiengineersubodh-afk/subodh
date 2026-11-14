import { wrapAnimationHtml } from "./common.mjs";

export const artsLawAnimations = {
  // 38. Cognitive Psychology
  "cognitive-psychology.html": wrapAnimationHtml(
    "Cognitive Psychology",
    "#0B0A1A",
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

      // Dual-Process Cognitive Brain Model (System 1 vs System 2)
      // Left hemisphere: Fast, intuitive neural waves
      ctx.beginPath();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 1.6;
      for (let a = Math.PI * 0.5; a < Math.PI * 1.5; a += 0.05) {
        const r = 55 + Math.sin(a * 8 + t) * 6;
        const x = cx - 10 + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (a === Math.PI * 0.5) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Right hemisphere: Deliberative, structured analytical grid
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.6;
      for (let a = -Math.PI * 0.5; a < Math.PI * 0.5; a += 0.05) {
        const r = 55 + Math.cos(a * 6 - t) * 5;
        const x = cx + 10 + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (a === -Math.PI * 0.5) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Neural transmission impulses across corpus callosum
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    `
  ),

  // 39. Computational Linguistics
  "computational-linguistics.html": wrapAnimationHtml(
    "Computational Linguistics",
    "#07111F",
    `
    const tree = [];

    function init(w, h) {
      tree.length = 0;
      // Syntactic Dependency Parse Tree (S -> NP, VP)
      tree.push({ tag: "S", x: w * 0.5, y: h * 0.25 });
      tree.push({ tag: "NP", x: w * 0.32, y: h * 0.5, p: 0 });
      tree.push({ tag: "VP", x: w * 0.68, y: h * 0.5, p: 0 });
      tree.push({ tag: "Det", x: w * 0.22, y: h * 0.75, p: 1 });
      tree.push({ tag: "Noun", x: w * 0.42, y: h * 0.75, p: 1 });
      tree.push({ tag: "Verb", x: w * 0.6, y: h * 0.75, p: 2 });
      tree.push({ tag: "NP", x: w * 0.78, y: h * 0.75, p: 2 });
    }

    function onResize(w, h) { init(w, h); }
    function update(dt) {}

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Syntax tree branches
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1.5;
      for (let i = 1; i < tree.length; i++) {
        const n = tree[i];
        const p = tree[n.p];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // Syntax nodes
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const n of tree) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#0F1E36";
        ctx.fill();
        ctx.strokeStyle = "#06B6D4";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(n.tag, n.x, n.y);
      }
    }
    `
  ),

  // 40. Sociology and Development
  "sociology-development.html": wrapAnimationHtml(
    "Sociology and Development",
    "#0B101D",
    `
    const clusters = [];

    function init(w, h) {
      clusters.length = 0;
      // 3 Community Clusters
      const centers = [
        { cx: w * 0.3, cy: h * 0.4, color: "#F59E0B" },
        { cx: w * 0.7, cy: h * 0.45, color: "#0EA5E9" },
        { cx: w * 0.5, cy: h * 0.72, color: "#F43F5E" }
      ];

      for (const c of centers) {
        const nodes = [];
        for (let i = 0; i < 7; i++) {
          nodes.push({
            x: c.cx + (Math.random() - 0.5) * 60,
            y: c.cy + (Math.random() - 0.5) * 50,
            color: c.color
          });
        }
        clusters.push(nodes);
      }
    }

    function onResize(w, h) { init(w, h); }
    function update(dt) {}

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Intra-community social ties
      ctx.lineWidth = 1;
      for (const group of clusters) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            ctx.beginPath();
            ctx.moveTo(group[i].x, group[i].y);
            ctx.lineTo(group[j].x, group[j].y);
            ctx.stroke();
          }
        }
      }

      // Bridging social capital ties between communities
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(clusters[0][0].x, clusters[0][0].y);
      ctx.lineTo(clusters[1][0].x, clusters[1][0].y);
      ctx.lineTo(clusters[2][0].x, clusters[2][0].y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Individuals / Sociometric nodes
      for (const group of clusters) {
        for (const n of group) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
        }
      }
    }
    `
  ),

  // 41. Public Policy
  "public-policy.html": wrapAnimationHtml(
    "Public Policy",
    "#070F1B",
    `
    let cycleT = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      cycleT += dt * 0.8;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = 55;

      // Circular Continuous Policy Lifecycle Framework
      // Agenda -> Formulation -> Decision -> Implementation -> Evaluation
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 5 Policy Stages nodes around the circle
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i;
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#14B8A6";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Traveling policy feedback pulse along the circle
      const pulseA = cycleT;
      const px = cx + radius * Math.cos(pulseA);
      const py = cy + radius * Math.sin(pulseA);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#F59E0B";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 42. Modern History and Archives
  "modern-history-archives.html": wrapAnimationHtml(
    "Modern History and Archives",
    "#120D09",
    `
    let scanY = 0;

    function init(w, h) { scanY = h * 0.2; }
    function onResize(w, h) { scanY = h * 0.2; }

    function update(dt) {
      scanY += dt * 45;
      if (scanY > h * 0.8) scanY = h * 0.2;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);

      // Archival Parchment Sheet Outline
      ctx.strokeStyle = "rgba(217, 119, 6, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.2, h * 0.15, w * 0.6, h * 0.7);

      // Historical milestone timeline axis in center
      const midY = h * 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, midY);
      ctx.lineTo(w * 0.75, midY);
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Milestone epoch nodes
      for (let i = 0; i < 5; i++) {
        const mx = w * 0.28 + i * (w * 0.11);
        ctx.beginPath();
        ctx.arc(mx, midY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#FBBF24";
        ctx.fill();
      }

      // Archival preservation scanner laser sweep line
      ctx.beginPath();
      ctx.moveTo(w * 0.2, scanY);
      ctx.lineTo(w * 0.8, scanY);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    `
  ),

  // 43. Intellectual Property Law
  "intellectual-property-law.html": wrapAnimationHtml(
    "Intellectual Property Law",
    "#080E1C",
    `
    let rot = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      rot += dt * 0.6;
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Patent Claims Concentric Boundary Rings
      for (let r = 25; r <= 65; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Official Registered Trademark Certification Seal (R)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.font = "bold 18px serif";
      ctx.fillStyle = "#F59E0B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("R", 0, 1);

      ctx.restore();
    }
    `
  ),

  // 44. Cyber and Technology Law
  "cyber-technology-law.html": wrapAnimationHtml(
    "Cyber and Technology Law",
    "#090A17",
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

      // Legal Firewall Shield
      ctx.beginPath();
      ctx.moveTo(cx, cy - 50);
      ctx.lineTo(cx + 45, cy - 30);
      ctx.lineTo(cx + 45, cy + 15);
      ctx.quadraticCurveTo(cx + 45, cy + 50, cx, cy + 60);
      ctx.quadraticCurveTo(cx - 45, cy + 50, cx - 45, cy + 15);
      ctx.lineTo(cx - 45, cy - 30);
      ctx.closePath();
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // GDPR / Privacy Data Inspection Radar Sweep
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 25, t, t + 0.6);
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    `
  ),

  // 45. Constitutional Law
  "constitutional-law.html": wrapAnimationHtml(
    "Constitutional Law",
    "#0B0E17",
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

      // Greco-Roman Constitutional Portico Pillars (Tripartite Separation of Powers)
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1.8;

      // Pediment Triangle
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 25);
      ctx.lineTo(cx, cy - 60);
      ctx.lineTo(cx + 70, cy - 25);
      ctx.closePath();
      ctx.stroke();

      // 3 Constitutional Pillars (Legislative, Executive, Judicial)
      const pillars = [cx - 50, cx, cx + 50];
      for (const px of pillars) {
        ctx.strokeRect(px - 6, cy - 20, 12, 60);
      }

      // Base Stylobate
      ctx.strokeRect(cx - 75, cy + 40, 150, 10);

      // Scales of Justice balanced at top apex
      ctx.beginPath();
      ctx.arc(cx, cy - 40, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#EAB308";
      ctx.fill();
    }
    `
  ),

  // 46. Environmental Law
  "environmental-law.html": wrapAnimationHtml(
    "Environmental Law",
    "#051410",
    `
    let pulse = 0;

    function init(w, h) {}
    function onResize(w, h) {}

    function update(dt) {
      pulse = (pulse + dt * 1.2) % (Math.PI * 2);
    }

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Ecological Treaty Perimeter Shield
      const r = 55 + Math.sin(pulse) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Inner protected biosphere leaf contour
      ctx.beginPath();
      ctx.moveTo(cx, cy - 35);
      ctx.quadraticCurveTo(cx + 35, cy, cx, cy + 35);
      ctx.quadraticCurveTo(cx - 35, cy, cx, cy - 35);
      ctx.strokeStyle = "#0EA5E9";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Carbon cap-and-trade quota balance line
      ctx.beginPath();
      ctx.moveTo(cx - 45, cy);
      ctx.lineTo(cx + 45, cy);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    `
  ),

  // 47. International Arbitration
  "international-arbitration.html": wrapAnimationHtml(
    "International Arbitration",
    "#060E1C",
    `
    const treatyNodes = [];

    function init(w, h) {
      treatyNodes.length = 0;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const count = 5;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 / count) * i;
        treatyNodes.push({ x: cx + Math.cos(a) * 65, y: cy + Math.sin(a) * 65 });
      }
    }

    function onResize(w, h) { init(w, h); }
    function update(dt) {}

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Cross-border treaty jurisdiction links converging on central tribunal
      ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
      ctx.lineWidth = 1.4;
      for (const n of treatyNodes) {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }

      // Neutral Arbitral Tribunal center
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#F59E0B";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Member State jurisdiction nodes
      for (const n of treatyNodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#3B82F6";
        ctx.fill();
      }
    }
    `
  )
};

