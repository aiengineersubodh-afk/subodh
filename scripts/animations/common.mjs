export function wrapAnimationHtml(title, bgColor, canvasScript) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} Animation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    (function() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let w = canvas.width = window.innerWidth;
      let h = canvas.height = window.innerHeight;
      let isPaused = false;
      let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        if (typeof onResize === 'function') onResize(w, h);
      }
      window.addEventListener('resize', resize);

      window.addEventListener('message', (e) => {
        if (e.data === 'pause') isPaused = true;
        if (e.data === 'play') {
          if (isPaused) {
            isPaused = false;
            lastTime = performance.now();
            requestAnimationFrame(renderLoop);
          }
        }
      });

      document.addEventListener('visibilitychange', () => {
        isPaused = document.hidden;
        if (!isPaused) {
          lastTime = performance.now();
          requestAnimationFrame(renderLoop);
        }
      });

      ${canvasScript}

      let lastTime = performance.now();
      function renderLoop(now) {
        if (isPaused) return;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        if (typeof update === 'function') update(dt);
        if (typeof draw === 'function') draw(ctx, w, h);
        if (!prefersReducedMotion) {
          requestAnimationFrame(renderLoop);
        }
      }

      if (typeof init === 'function') init(w, h);
      requestAnimationFrame(renderLoop);
    })();
  </script>
</body>
</html>`;
}

