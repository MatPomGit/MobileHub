'use strict';
import { getMotionProfile } from './motion-settings.js';

const FPS_SAMPLE_MS = 1200;
const FPS_DEGRADE_THRESHOLD = 28;

function getParticleCount(profile, isMobile) {
  if (isMobile) {
    return profile === 'hero' ? 20 : 14;
  }

  return profile === 'hero' ? 44 : 26;
}

function getParticleRadius(isMobile) {
  return isMobile ? [0.8, 1.8] : [1, 2.6];
}

function createParticle(width, height, isMobile) {
  const [minRadius, maxRadius] = getParticleRadius(isMobile);
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * (isMobile ? 0.08 : 0.16),
    vy: (Math.random() - 0.5) * (isMobile ? 0.08 : 0.16),
    r: minRadius + Math.random() * (maxRadius - minRadius),
    alpha: 0.18 + Math.random() * 0.26,
  };
}

function initParticleSection(section) {
  const canvas = section.querySelector('.section-particles-canvas');
  if (!canvas) {
    return;
  }

  let isMobile = window.matchMedia('(max-width: 768px)').matches;
  const motionProfile = getMotionProfile();
  if (motionProfile === 'none') {
    return;
  }
  const useLimitedEffects = motionProfile === 'limited';
  const targetFps = isMobile ? 45 : 60;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return;
  }

  let frameId = 0;
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let fpsDegraded = false;
  let frameCounter = 0;
  let fpsMark = performance.now();

  let particles = [];

  function resizeCanvas() {
    isMobile = window.matchMedia('(max-width: 768px)').matches;
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = useLimitedEffects
      ? Math.max(6, Math.floor(getParticleCount(profile, isMobile) * 0.55))
      : getParticleCount(profile, isMobile);
    particles = Array.from({ length: count }, () => createParticle(width, height, isMobile));
  }

  function updateAndDraw() {
    frameCounter += 1;
    const now = performance.now();

    if (now - fpsMark >= FPS_SAMPLE_MS) {
      const fps = (frameCounter * 1000) / (now - fpsMark);
      fpsDegraded = fps < (useLimitedEffects ? targetFps - 10 : FPS_DEGRADE_THRESHOLD);
      frameCounter = 0;
      fpsMark = now;
    }

    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      if (!fpsDegraded) {
        const dx = pointerX - particle.x;
        const dy = pointerY - particle.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0 && distSq < 8000) {
          const influence = 0.0008;
          particle.vx += dx * influence;
          particle.vy += dy * influence;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.985;
      particle.vy *= 0.985;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      particle.x = Math.max(0, Math.min(width, particle.x));
      particle.y = Math.max(0, Math.min(height, particle.y));

      ctx.beginPath();
      ctx.fillStyle = `rgba(148, 163, 184, ${fpsDegraded ? particle.alpha * 0.45 : particle.alpha})`;
      ctx.arc(particle.x, particle.y, fpsDegraded ? Math.max(1, particle.r - 0.4) : particle.r, 0, Math.PI * 2);
      ctx.fill();
    }

    frameId = requestAnimationFrame(updateAndDraw);
  }

  section.addEventListener('pointermove', (event) => {
    const rect = section.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
  }, { passive: true });

  section.addEventListener('pointerleave', () => {
    pointerX = width / 2;
    pointerY = height / 2;
  }, { passive: true });

  resizeCanvas();
  pointerX = width / 2;
  pointerY = height / 2;
  updateAndDraw();

  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      return;
    }

    cancelAnimationFrame(frameId);
    updateAndDraw();
  });
}

export function initSectionParticles() {
  const sections = document.querySelectorAll('.particle-section');
  sections.forEach(initParticleSection);
}
