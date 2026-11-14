"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  layer: number; // 0: back, 1: mid, 2: front
  color: string;
  glowColor: string;
  phase: number;
  speed: number;
  amp: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function FeaturedScholarsParticleBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = performance.now();
    let globalTime = 0;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    // Mouse state
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isOver: false,
      radius: 170,
    };

    const ripples: Ripple[] = [];
    let lastRippleTime = 0;

    const colorPalette = [
      { color: "rgba(0, 229, 255, ", glow: "rgba(0, 229, 255, 0.45)" }, // Cyan
      { color: "rgba(34, 211, 238, ", glow: "rgba(34, 211, 238, 0.4)" }, // Electric Cyan
      { color: "rgba(59, 130, 246, ", glow: "rgba(59, 130, 246, 0.35)" }, // Electric Blue
      { color: "rgba(168, 85, 247, ", glow: "rgba(168, 85, 247, 0.35)" }, // Violet
      { color: "rgba(236, 72, 153, ", glow: "rgba(236, 72, 153, 0.3)" }, // Magenta highlight
    ];

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const isMobile = width < 768;
      const count = isMobile ? 55 : Math.min(130, Math.floor((width * height) / 10000));

      const rows = isMobile ? 5 : 7;
      const cols = Math.ceil(count / rows);
      const cellW = width / (cols + 1);
      const cellH = height / (rows + 1);

      let idx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (idx >= count) break;
          const layer = idx % 3; // 0 = back, 1 = mid, 2 = front
          const paletteChoice = colorPalette[idx % colorPalette.length];

          const jitterX = (Math.random() - 0.5) * cellW * 0.8;
          const jitterY = (Math.random() - 0.5) * cellH * 0.8;
          const baseX = (c + 1) * cellW + jitterX;
          const baseY = (r + 1) * cellH + jitterY;

          particles.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
            layer,
            size: layer === 2 ? 2.8 + Math.random() * 1.2 : layer === 1 ? 2.0 + Math.random() * 0.8 : 1.2 + Math.random() * 0.6,
            color: paletteChoice.color,
            glowColor: paletteChoice.glow,
            phase: Math.random() * Math.PI * 2,
            speed: 0.6 + Math.random() * 0.8 + layer * 0.2,
            amp: 18 + layer * 14 + Math.random() * 8,
          });
          idx++;
        }
      }
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(300, rect.width);
      height = Math.max(300, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // Mouse Listeners attached to parent section container
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isOver = true;

      // Occasional gentle ripple on mouse movement
      const now = performance.now();
      if (now - lastRippleTime > 350) {
        ripples.push({
          x: mouse.targetX,
          y: mouse.targetY,
          radius: 10,
          maxRadius: mouse.radius * 1.2,
          alpha: 0.5,
        });
        lastRippleTime = now;
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;
      mouse.isOver = true;
    };

    const onMouseLeave = () => {
      mouse.isOver = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    const parentSection = container.closest("section") || container;
    parentSection.addEventListener("mousemove", onMouseMove as EventListener);
    parentSection.addEventListener("mouseenter", onMouseEnter as EventListener);
    parentSection.addEventListener("mouseleave", onMouseLeave as EventListener);

    // Pause animation when not in viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(parentSection);

    // Render loop
    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      if (!prefersReducedMotion && isVisible) {
        globalTime += dt;
      }

      // Smooth mouse follow
      if (mouse.isOver) {
        mouse.x += (mouse.targetX - mouse.x) * Math.min(1, dt * 10);
        mouse.y += (mouse.targetY - mouse.y) * Math.min(1, dt * 10);
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      // Clear with deep charcoal background
      ctx.fillStyle = "#0B0E14";
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric background gradient glow
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "rgba(14, 28, 54, 0.4)");
      bgGrad.addColorStop(0.5, "rgba(11, 16, 28, 0.2)");
      bgGrad.addColorStop(1, "rgba(11, 14, 20, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw active ripples around pointer
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += dt * 90;
        r.alpha -= dt * 0.55;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${r.alpha * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Update and draw particles in waves
      const connectDist = width < 768 ? 65 : 85;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Continuous organic wave oscillation
          const waveX = Math.cos(globalTime * p.speed * 0.7 + p.phase + p.baseY * 0.005) * (p.amp * 0.4);
          const waveY =
            Math.sin(globalTime * p.speed + p.phase + p.baseX * 0.004) * p.amp +
            Math.cos(globalTime * 0.4 + p.baseX * 0.002) * (p.amp * 0.3);

          const idealX = p.baseX + waveX;
          const idealY = p.baseY + waveY;

          // Mouse disturbance calculation
          let pushX = 0;
          let pushY = 0;
          if (mouse.isOver) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < mouse.radius && dist > 0.01) {
              const force = (1 - dist / mouse.radius) * 45 * (0.8 + p.layer * 0.3);
              pushX = (dx / dist) * force;
              pushY = (dy / dist) * force;
            }
          }

          // Spring damping motion towards (idealX + pushX, idealY + pushY)
          const targetX = idealX + pushX;
          const targetY = idealY + pushY;

          p.vx = (targetX - p.x) * 4.5;
          p.vy = (targetY - p.y) * 4.5;

          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }

        // Connecting lines between nearby particles in the same or adjacent layers
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (Math.abs(p.layer - p2.layer) > 1) continue;

          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectDist) {
            const lineAlpha = (1 - dist / connectDist) * (0.12 + p.layer * 0.07);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`;
            ctx.lineWidth = p.layer === 2 ? 0.9 : 0.6;
            ctx.stroke();
          }
        }

        // Particle pulse
        const pulse = 0.85 + Math.sin(globalTime * 1.5 + p.phase) * 0.25;
        const currentSize = p.size * (prefersReducedMotion ? 1 : pulse);
        const alpha = (0.45 + p.layer * 0.25) * (0.8 + Math.sin(globalTime * 2 + p.phase) * 0.2);

        // Soft outer glow for foreground particles
        if (p.layer === 2 && !prefersReducedMotion) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = p.glowColor;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.15, Math.min(0.95, alpha))})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      mediaQuery.removeEventListener("change", handleMotionChange);
      parentSection.removeEventListener("mousemove", onMouseMove as EventListener);
      parentSection.removeEventListener("mouseenter", onMouseEnter as EventListener);
      parentSection.removeEventListener("mouseleave", onMouseLeave as EventListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#0B0E14]"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

