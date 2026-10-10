import React, { useEffect, useRef } from "react";

/**
 * ArchitecturalCursor — React Component
 *
 * Implements the SEA animated flying parrot custom cursor for React routes.
 * Uses direct DOM manipulation & HTML5 Canvas to eliminate React re-renders (0 re-renders during motion).
 */
export const ArchitecturalCursor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parrotWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const isTouchOrCoarse =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isTouchOrCoarse) return;

    const prefersReducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.documentElement.classList.add("sea-cursor-enabled");

    const container = containerRef.current;
    const parrotWrapper = parrotWrapperRef.current;
    const canvas = canvasRef.current;
    if (!container || !parrotWrapper || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number | null = null;
    let isVisible = false;
    let isIdle = false;
    let idleTimer: any = null;
    let flightTime = 0;
    let orbitAngle = 0;
    let facing = 1;
    let pitch = 0;
    let currentState = "default";

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    const trail: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      life: number;
      decay: number;
      color: string;
    }> = [];

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();

    const showCursor = () => {
      isVisible = true;
      container.classList.add("is-visible");
      container.classList.remove("is-hidden");
    };

    const hideCursor = () => {
      isVisible = false;
      container.classList.remove("is-visible");
      container.classList.add("is-hidden");
    };

    const emitFlightTrail = (x: number, y: number, dx: number, dy: number, dist: number) => {
      const len = Math.max(0.001, dist);
      const nx = dx / len;
      const ny = dy / len;
      const px = -ny;
      const py = nx;
      const count = dist > 20 ? 3 : dist > 8 ? 2 : 1;

      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 14;
        const spawnX = x - nx * 18 + px * spread;
        const spawnY = y - ny * 18 + py * spread;
        const colors = ["#00E5FF", "#008C9E", "#006F80", "#FFFFFF", "#FFD166"];
        const color = colors[Math.floor(Math.random() * colors.length)] ?? "#008C9E";

        trail.push({
          x: spawnX,
          y: spawnY,
          vx: -nx * 0.6 + (Math.random() - 0.5) * 0.5,
          vy: -ny * 0.6 + (Math.random() - 0.5) * 0.5 + 0.15,
          size: 1.2 + Math.random() * 2.2,
          alpha: 0.85,
          life: 1.0,
          decay: 0.024 + Math.random() * 0.02,
          color,
        });
      }

      if (trail.length > 75) {
        trail.splice(0, trail.length - 75);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (!isVisible) {
        showCursor();
        pos.x = x;
        pos.y = y;
      }

      const dx = x - (mouse.x === -100 ? x : mouse.x);
      const dy = y - (mouse.y === -100 ? y : mouse.y);
      const dist = Math.sqrt(dx * dx + dy * dy);

      mouse.x = x;
      mouse.y = y;

      if (dx > 1.2) {
        facing = 1;
      } else if (dx < -1.2) {
        facing = -1;
      }

      if (dist > 1) {
        const targetPitch = Math.max(-24, Math.min(24, (dy / (dist || 1)) * 22 * facing));
        pitch += (targetPitch - pitch) * 0.25;
      } else {
        pitch += (0 - pitch) * 0.15;
      }

      if (!prefersReducedMotion() && dist > 1.5) {
        emitFlightTrail(pos.x, pos.y, dx, dy, dist);
      }

      if (isIdle) {
        isIdle = false;
        container.classList.remove("is-idle");
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdle = true;
        container.classList.add("is-idle");
      }, 1200);
    };

    const handleMouseDown = () => {
      container.classList.add("is-active");
    };

    const handleMouseUp = () => {
      container.classList.remove("is-active");
    };

    const setCursorState = (newState: string) => {
      if (currentState === newState) return;
      container.classList.remove("state-nav", "state-button", "state-project", "state-text");
      if (newState !== "default") {
        container.classList.add(`state-${newState}`);
      }
      currentState = newState;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        setCursorState("text");
        return;
      }
      if (target.closest(".bs-project-4-card-single, .card-img, [data-cursor-text], .bs-project-item")) {
        setCursorState("project");
        return;
      }
      if (target.closest('button, .btn, .bs-btn-1, .bs-btn-2, a.know-about-btn, [role="button"]')) {
        setCursorState("button");
        return;
      }
      if (target.closest("nav a, .navbar-nav a, header a, a")) {
        setCursorState("nav");
        return;
      }
      setCursorState("default");
    };

    const handleMouseOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as HTMLElement | null;
      if (rel) {
        handleMouseOver({ target: rel } as any);
      } else {
        setCursorState("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseenter", showCursor, { passive: true });
    document.addEventListener("mouseleave", hideCursor, { passive: true });
    window.addEventListener("resize", setupCanvas, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });

    const update = () => {
      rafId = requestAnimationFrame(update);
      if (!isVisible) return;

      const reduced = prefersReducedMotion();
      flightTime += 0.05;

      let targetX = mouse.x;
      let targetY = mouse.y;

      if (currentState === "project" && !reduced) {
        orbitAngle += 0.045;
        const orbitRadius = 26;
        targetX += Math.cos(orbitAngle) * orbitRadius;
        targetY += Math.sin(orbitAngle) * (orbitRadius * 0.65);
        facing = Math.cos(orbitAngle + 0.1) >= 0 ? 1 : -1;
      }

      if (reduced) {
        pos.x = targetX;
        pos.y = targetY;
      } else {
        const lerpFactor = currentState === "nav" ? 0.12 : currentState === "project" ? 0.16 : 0.18;
        pos.x += (targetX - pos.x) * lerpFactor;
        pos.y += (targetY - pos.y) * lerpFactor;
      }

      let bobY = 0;
      if (!reduced) {
        const bobFreq = isIdle ? 3.2 : 6.5;
        const bobAmp = isIdle ? 4.5 : 2.5;
        bobY = Math.sin(flightTime * bobFreq) * bobAmp;
      }

      const distFromTarget = Math.hypot(mouse.x - pos.x, mouse.y - pos.y);
      if (distFromTarget > 18) {
        container.classList.add("is-speeding");
        container.classList.remove("is-hovering");
      } else {
        container.classList.remove("is-speeding");
        container.classList.add("is-hovering");
      }

      container.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${(pos.y + bobY).toFixed(1)}px, 0)`;

      const scaleX = facing;
      const pitchRot = reduced ? 0 : pitch;
      parrotWrapper.style.transform = `translate(-55%, -50%) scaleX(${scaleX}) rotate(${pitchRot.toFixed(1)}deg)`;

      if (!reduced) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = trail.length - 1; i >= 0; i--) {
          const p = trail[i];
          if (!p) continue;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;


          if (p.life <= 0) {
            trail.splice(i, 1);
            continue;
          }

          const alpha = Math.max(0, p.life * p.alpha).toFixed(3);
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);

          if (p.color === "#FFFFFF") {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowColor = "#00E5FF";
            ctx.shadowBlur = 6;
          } else if (p.color === "#FFD166") {
            ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`;
            ctx.shadowColor = "#FFD166";
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = `rgba(0, 140, 158, ${alpha})`;
            ctx.shadowColor = "#008C9E";
            ctx.shadowBlur = 5;
          }

          ctx.fill();
          ctx.restore();
        }
      }
    };

    rafId = requestAnimationFrame(update);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseenter", showCursor);
      document.removeEventListener("mouseleave", hideCursor);
      window.removeEventListener("resize", setupCanvas);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.documentElement.classList.remove("sea-cursor-enabled");
    };
  }, []);

  return (
    <>
      <canvas id="sea-cursor-trail-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="sea-cursor-container" ref={containerRef} aria-hidden="true">
        <div className="sea-cursor-anchor">
          <div className="sea-parrot-badge-explore">
            <div className="badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </div>
            <span className="text">EXPLORE</span>
          </div>

          <div className="sea-parrot-wrapper" ref={parrotWrapperRef}>
            <svg className="sea-parrot-svg" viewBox="0 0 62 52">
              <defs>
                <linearGradient id="seaParrotBodyReact" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="30%" stopColor="#00A8B5" />
                  <stop offset="70%" stopColor="#008C9E" />
                  <stop offset="100%" stopColor="#005F73" />
                </linearGradient>

                <linearGradient id="seaParrotWingFarGradReact" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#004652" />
                  <stop offset="60%" stopColor="#006F80" />
                  <stop offset="100%" stopColor="#008C9E" />
                </linearGradient>

                <linearGradient id="seaParrotWingNearGradReact" x1="0%" y1="100%" x2="80%" y2="0%">
                  <stop offset="0%" stopColor="#005F73" />
                  <stop offset="35%" stopColor="#008C9E" />
                  <stop offset="70%" stopColor="#00B4D8" />
                  <stop offset="100%" stopColor="#00E5FF" />
                </linearGradient>

                <linearGradient id="seaParrotAccentGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD166" />
                  <stop offset="50%" stopColor="#06D6A0" />
                  <stop offset="100%" stopColor="#008C9E" />
                </linearGradient>

                <linearGradient id="seaParrotTailGradReact" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#008C9E" />
                  <stop offset="50%" stopColor="#005F73" />
                  <stop offset="100%" stopColor="#081F2C" />
                </linearGradient>
              </defs>

              <g className="sea-parrot-wing-far">
                <path d="M24,18 C26,11 31,4 39,2 C41,2 41,5 38,9 C35,13 31,17 27,21 Z" fill="url(#seaParrotWingFarGradReact)" />
                <path d="M25,18 C28,13 34,7 42,5 C43,6 42,8 39,12 C35,16 30,20 27,22 Z" fill="#005060" opacity="0.6" />
              </g>

              <g className="sea-parrot-tail">
                <path d="M16,26 C12,32 6,41 2,48 C3,48 7,42 15,31 Z" fill="url(#seaParrotTailGradReact)" />
                <path d="M17,25 C14,30 9,37 4,43 C6,42 11,35 17,29 Z" fill="#008C9E" opacity="0.85" />
                <path d="M16,26 C13,31 8,38 4,43" stroke="#FFD166" strokeWidth="0.8" fill="none" opacity="0.75" />
              </g>

              <g className="sea-parrot-body-group">
                <path d="M16,24 C18,20 23,17 31,17 C37,17 44,18 48,22 C47,26 42,29 34,29 C25,29 18,28 16,24 Z" fill="url(#seaParrotBodyReact)" />
                <path d="M31,17 C37,17 43,19 46,23 C44,27 38,29 32,29 C28,29 25,28 24,25 C25,20 28,17 31,17 Z" fill="#00A8B5" />
                <path d="M42,19 C43,14 47,13 51,15 C54,16 56,18 57,21 C56,24 53,25 48,25 C45,25 43,22 42,19 Z" fill="#00E5FF" />
                <ellipse cx="49" cy="20" rx="3.5" ry="2.5" fill="#FFFFFF" opacity="0.95" />
                <circle cx="49.5" cy="19.5" r="1.6" fill="#FFD166" />
                <circle cx="49.5" cy="19.5" r="1.1" fill="#081F2C" />
                <circle cx="49.8" cy="19.2" r="0.4" fill="#FFFFFF" />
                <path d="M54,19 C57,19 60,21 59,25 C58,25 56,23 54,23 Z" fill="#1C2833" />
                <path d="M55,23 C57,23 58,24 57,25 C55,25 54,24 55,23 Z" fill="#0E171D" />
                <path d="M54,19 C56,19 58,20 58.5,22" stroke="#FFFFFF" strokeWidth="0.5" fill="none" opacity="0.45" />
                <path d="M28,28 C29,30 31,31 32,29" stroke="#FFB703" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </g>

              <g className="sea-parrot-wing-near">
                <path d="M27,19 C30,11 36,3 46,1 C48,1 48,4 44,9 C40,14 34,20 29,23 Z" fill="url(#seaParrotWingNearGradReact)" />
                <path d="M28,19 C31,13 37,7 44,6 C45,7 44,9 41,13 C37,17 32,22 29,23 Z" fill="#008C9E" opacity="0.9" />
                <path d="M28,19 C31,16 35,13 39,12 C40,14 38,17 35,19 C32,21 30,21 28,19 Z" fill="url(#seaParrotAccentGradReact)" />
                <path d="M29,19 C35,12 40,7 45,2" stroke="#FFFFFF" strokeWidth="0.5" fill="none" opacity="0.6" />
                <path d="M30,20 C34,15 38,11 42,7" stroke="#00E5FF" strokeWidth="0.5" fill="none" opacity="0.5" />
              </g>
            </svg>
          </div>

          <div className="sea-cursor-target-dot" />
        </div>
      </div>
    </>
  );
};
