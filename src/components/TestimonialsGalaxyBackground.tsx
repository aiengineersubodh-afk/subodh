"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  size: number;
  color: string;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number; // 0: distant dust, 1: mid star, 2: bright foreground star
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function TestimonialsGalaxyBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = performance.now();
    let globalTime = 0;

    // Prefers-reduced-motion check
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    // Mouse state for gentle gravitational parallax
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isOver: false,
    };

    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = performance.now() + 2000;

    const starPalettes = [
      "rgba(255, 255, 255, ", // Pure white
      "rgba(224, 242, 254, ", // Soft cyan-blue
      "rgba(243, 232, 255, ", // Celestial lavender
      "rgba(254, 243, 199, ", // Warm amber star
      "rgba(199, 210, 254, ", // Indigo tint
    ];

    const initGalaxy = () => {
      stars = [];
      const isMobile = width < 768;
      const count = isMobile ? 85 : Math.min(220, Math.floor((width * height) / 6000));

      for (let i = 0; i < count; i++) {
        const depth = Math.random() < 0.2 ? 2 : Math.random() < 0.55 ? 1 : 0;
        const color = starPalettes[Math.floor(Math.random() * starPalettes.length)];
        const baseSize =
          depth === 2
            ? 1.8 + Math.random() * 1.2
            : depth === 1
            ? 1.1 + Math.random() * 0.7
            : 0.6 + Math.random() * 0.5;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.08 + depth * 0.05),
          vy: (Math.random() - 0.5) * (0.06 + depth * 0.04),
          baseSize,
          size: baseSize,
          color,
          alpha: 0.4 + Math.random() * 0.55,
          twinkleSpeed: 0.8 + Math.random() * 2.2,
          twinklePhase: Math.random() * Math.PI * 2,
          depth,
        });
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
      initGalaxy();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // Mouse Listeners attached to section
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isOver = true;
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

    // Pause animation when outside viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(parentSection);

    const spawnShootingStar = () => {
      const startX = Math.random() * (width * 0.8) + width * 0.1;
      const startY = Math.random() * (height * 0.5);
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // Downwards diagonal
      const speed = 480 + Math.random() * 320;
      const length = 90 + Math.random() * 80;
      const maxLife = 0.9 + Math.random() * 0.5;

      shootingStars.push({
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        opacity: 0.95,
        life: 0,
        maxLife,
      });
    };

    // Render loop
    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      if (!prefersReducedMotion && isVisible) {
        globalTime += dt;
      }

      // Smooth mouse follow
      if (mouse.isOver) {
        mouse.x += (mouse.targetX - mouse.x) * Math.min(1, dt * 6);
        mouse.y += (mouse.targetY - mouse.y) * Math.min(1, dt * 6);
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      // 1. Deep Midnight Cosmic Sky Background
      ctx.fillStyle = "#070B14";
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Nebula Clouds (Multi-layer glowing radial clusters)
      // Nebula 1: Deep Indigo / Purple cluster in top-left
      const neb1 = ctx.createRadialGradient(
        width * 0.28,
        height * 0.32,
        20,
        width * 0.28,
        height * 0.32,
        Math.max(width, height) * 0.45
      );
      neb1.addColorStop(0, "rgba(88, 28, 135, 0.22)"); // Purple
      neb1.addColorStop(0.5, "rgba(49, 46, 129, 0.15)"); // Indigo
      neb1.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      // Nebula 2: Subtle Cyan / Deep Blue cluster in bottom-right
      const neb2 = ctx.createRadialGradient(
        width * 0.72,
        height * 0.65,
        30,
        width * 0.72,
        height * 0.65,
        Math.max(width, height) * 0.5
      );
      neb2.addColorStop(0, "rgba(14, 116, 144, 0.18)"); // Cyan / Teal
      neb2.addColorStop(0.5, "rgba(30, 58, 138, 0.12)"); // Blue
      neb2.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // Nebula 3: Central warm stardust core
      const neb3 = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.35
      );
      neb3.addColorStop(0, "rgba(124, 58, 237, 0.12)");
      neb3.addColorStop(0.6, "rgba(30, 27, 75, 0.06)");
      neb3.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = neb3;
      ctx.fillRect(0, 0, width, height);

      // 3. Delicate Constellation Lines (connections between close foreground stars)
      const constellationDist = width < 768 ? 60 : 75;
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        if (s1.depth < 1) continue;

        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          if (s2.depth < 1) continue;

          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < constellationDist) {
            const lineAlpha = (1 - dist / constellationDist) * 0.16 * s1.alpha * s2.alpha;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // 4. Update and Draw Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (!prefersReducedMotion) {
          // Slow cosmic drift
          s.x += s.vx * dt * 60;
          s.y += s.vy * dt * 60;

          // Wrap around canvas edges
          if (s.x < 0) s.x = width;
          else if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          else if (s.y > height) s.y = 0;

          // Gentle mouse parallax shift
          if (mouse.isOver) {
            const mdx = mouse.x - s.x;
            const mdy = mouse.y - s.y;
            const mDist = Math.hypot(mdx, mdy);
            if (mDist < 180 && mDist > 0.01) {
              const pull = (1 - mDist / 180) * 1.5 * (s.depth + 1);
              s.x += (mdx / mDist) * pull * dt * 25;
              s.y += (mdy / mDist) * pull * dt * 25;
            }
          }
        }

        // Star twinkle
        const twinkle = 0.75 + Math.sin(globalTime * s.twinkleSpeed + s.twinklePhase) * 0.25;
        const curAlpha = Math.max(0.1, Math.min(1, s.alpha * twinkle));
        const curSize = s.baseSize * (prefersReducedMotion ? 1 : 0.9 + twinkle * 0.2);

        // Soft outer glow for bright foreground stars
        if (s.depth === 2 && !prefersReducedMotion) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, curSize * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${s.color}${curAlpha * 0.25})`;
          ctx.fill();
        }

        // Core star
        ctx.beginPath();
        ctx.arc(s.x, s.y, curSize, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${curAlpha})`;
        ctx.fill();
      }

      // 5. Occasional Shooting Stars
      if (!prefersReducedMotion) {
        if (time > nextShootingStarTime) {
          spawnShootingStar();
          nextShootingStarTime = time + 3500 + Math.random() * 4500;
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i];
          ss.life += dt;
          const progress = ss.life / ss.maxLife;

          if (progress >= 1) {
            shootingStars.splice(i, 1);
            continue;
          }

          // Advance position
          const moveDist = ss.speed * dt;
          ss.x += Math.cos(ss.angle) * moveDist;
          ss.y += Math.sin(ss.angle) * moveDist;

          // Tail calculations
          const tailX = ss.x - Math.cos(ss.angle) * ss.length;
          const tailY = ss.y - Math.sin(ss.angle) * ss.length;

          const currentOpacity =
            progress < 0.2
              ? (progress / 0.2) * ss.opacity
              : (1 - progress) * ss.opacity;

          const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
          grad.addColorStop(0, "rgba(255, 255, 255, 0)");
          grad.addColorStop(0.6, `rgba(186, 230, 253, ${currentOpacity * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${currentOpacity})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(ss.x, ss.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Shooting star head glow
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.fill();
        }
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
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#070B14]"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

