import React, { useEffect, useRef } from "react";

/**
 * ArchitecturalCursor — React Component
 *
 * Implements the SEA Premium 3D Architectural Pyramid Custom Cursor for React routes.
 * Accurately reproduces the reference design board:
 * 1. Default State: Clean, minimal, elegant 3D faceted tetrahedron (#eef8f9 & #00869b)
 * 2. Moving: Fluid 3D velocity tilt with subtle trailing geometric triangular micro-shards
 * 3. Hover Effect: Smooth scale-up and luminous ground halo ring under the pyramid
 * 4. Click Animation: Concentric architectural pulse rings with 4 cardinal tick marks
 * 5. Idle State: Sinusoidal floating elevation with continuous 360° crystalline rotation
 *
 * Direct DOM canvas rendering: 0 React re-renders during motion.
 */
export const ArchitecturalCursor: React.FC = () => {
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setupCanvasSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    setupCanvasSize();

    let rafId: number | null = null;
    let isVisible = false;
    let isIdle = false;
    let idleTimer: any = null;
    let isHover = false;
    let isText = false;
    let isMouseDown = false;

    // 3D Angles
    let pitch = 0.28;
    let yaw = 0.45;
    let roll = 0;
    let idleTime = 0;
    let scale = 1.0;
    let hoverGlow = 0;

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    const vel = { x: 0, y: 0, speed: 0 };

    const trailShards: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rot: number;
      vRot: number;
      life: number;
      decay: number;
      color: string;
    }> = [];

    const clickPulses: Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      life: number;
      decay: number;
    }> = [];

    // 3D Tetrahedron Geometry: 4 vertices, 4 faces
    // Apex positioned at hotspot (-2px Y) so the tip is the click point!
    const R = 14;
    const yApex = -2;
    const yBase = 20;

    const vertices = [
      { x: 0, y: yApex, z: 0 },
      { x: R * Math.cos(0), y: yBase, z: R * Math.sin(0) },
      { x: R * Math.cos((2 * Math.PI) / 3), y: yBase, z: R * Math.sin((2 * Math.PI) / 3) },
      { x: R * Math.cos((4 * Math.PI) / 3), y: yBase, z: R * Math.sin((4 * Math.PI) / 3) },
      { x: 0, y: 10, z: 0 }
    ];

    const faces = [
      { indices: [0, 1, 2], name: "right" },
      { indices: [0, 2, 3], name: "back" },
      { indices: [0, 3, 1], name: "front" },
      { indices: [1, 3, 2], name: "base" }
    ];

    const Light = { x: -0.55, y: -0.75, z: 0.45 };
    const L_len = Math.hypot(Light.x, Light.y, Light.z);
    Light.x /= L_len;
    Light.y /= L_len;
    Light.z /= L_len;

    const View = { x: 0, y: 0.28, z: -0.96 };

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (!isVisible) {
        isVisible = true;
        mouse.x = x;
        mouse.y = y;
        pos.x = x;
        pos.y = y;
        return;
      }

      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const dist = Math.hypot(dx, dy);

      mouse.x = x;
      mouse.y = y;
      vel.x = dx;
      vel.y = dy;
      vel.speed = dist;

      if (!prefersReducedMotion() && dist > 2.5 && !isText) {
        const count = dist > 14 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          trailShards.push({
            x: pos.x + (Math.random() - 0.5) * 6,
            y: pos.y + 10 + (Math.random() - 0.5) * 6,
            vx: -dx * 0.12 + (Math.random() - 0.5) * 0.5,
            vy: -dy * 0.12 + (Math.random() - 0.5) * 0.5,
            size: 2.2 + Math.random() * 2.8,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.1,
            life: 1.0,
            decay: 0.038 + Math.random() * 0.02,
            color: Math.random() > 0.45 ? "#00869b" : Math.random() > 0.3 ? "#38b2c4" : "#eef8f9"
          });
        }
        if (trailShards.length > 20) {
          trailShards.splice(0, trailShards.length - 20);
        }
      }

      if (isIdle) {
        isIdle = false;
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdle = true;
      }, 450);
    };

    const handleMouseDown = () => {
      isMouseDown = true;
      if (!prefersReducedMotion() && !isText) {
        clickPulses.push({
          x: pos.x,
          y: pos.y + 10,
          radius: 12,
          maxRadius: 38,
          life: 1.0,
          decay: 0.045
        });
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      isVisible = true;
      if (e && typeof e.clientX === "number") {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        isText = true;
        isHover = false;
        return;
      }

      const isInteractive = target.closest(
        'button, .bs-btn-1, .bs-btn-2, .btn, a, [role="button"], .card, .bs-project-4-card-single, .card-img, [data-cursor-project], .sea-project-card'
      );

      if (isInteractive) {
        isHover = true;
        isText = false;
      } else {
        isHover = false;
        isText = false;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as HTMLElement | null;
      if (rel && rel.closest) {
        handleMouseOver({ target: rel } as any);
      } else {
        isHover = false;
        isText = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", setupCanvasSize, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });

    const update = () => {
      rafId = requestAnimationFrame(update);

      if (!isVisible || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const reduced = prefersReducedMotion();

      if (reduced) {
        pos.x = mouse.x + 24;
        pos.y = mouse.y + 16;
      } else {
        const lerpFactor = isHover ? 0.2 : 0.16;
        pos.x += (mouse.x + 24 - pos.x) * lerpFactor;
        pos.y += (mouse.y + 16 - pos.y) * lerpFactor;
      }

      vel.x *= 0.82;
      vel.y *= 0.82;
      vel.speed *= 0.82;

      const targetScale = isMouseDown ? 0.62 : isHover ? 0.82 : 0.68;
      scale += (targetScale - scale) * 0.16;

      const targetGlow = isHover ? 1.0 : 0.0;
      hoverGlow += (targetGlow - hoverGlow) * 0.15;

      idleTime += 0.035;
      let floatY = 0;

      if (reduced) {
        pitch = 0.28;
        yaw = 0.45;
        roll = 0;
      } else if (isIdle) {
        yaw += 0.018;
        pitch += (0.28 - pitch) * 0.06;
        roll += (0 - roll) * 0.06;
        floatY = Math.sin(idleTime * 1.8) * 2.6;
      } else {
        const targetPitch = Math.max(-0.35, Math.min(0.45, (vel.y / (vel.speed || 1)) * 0.35 + 0.28));
        const targetRoll = Math.max(-0.35, Math.min(0.35, (vel.x / (vel.speed || 1)) * 0.28));
        const targetYaw = Math.max(-0.5, Math.min(0.5, (vel.x / (vel.speed || 1)) * 0.45));

        pitch += (targetPitch - pitch) * 0.15;
        roll += (targetRoll - roll) * 0.15;
        yaw += (targetYaw - yaw) * 0.15;
      }

      if (!reduced) yaw += isHover ? 0.05 : 0.012;
      const drawX = pos.x;
      const drawY = pos.y + floatY;

      // Render Click Pulses
      if (!reduced) {
        for (let i = clickPulses.length - 1; i >= 0; i--) {
          const cp = clickPulses[i];
          cp.radius += (cp.maxRadius - cp.radius) * 0.15;
          cp.life -= cp.decay;

          if (cp.life <= 0) {
            clickPulses.splice(i, 1);
            continue;
          }

          const alpha = (cp.life * 0.85).toFixed(2);
          ctx.save();
          ctx.translate(cp.x, cp.y);

          ctx.beginPath();
          ctx.arc(0, 0, cp.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "#00869b";
          ctx.shadowBlur = 6;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, cp.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238, 248, 249, ${(cp.life * 0.6).toFixed(2)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          const tickLen = 4;
          const r = cp.radius;
          ctx.beginPath();
          ctx.moveTo(r, 0); ctx.lineTo(r + tickLen, 0);
          ctx.moveTo(-r, 0); ctx.lineTo(-r - tickLen, 0);
          ctx.moveTo(0, -r); ctx.lineTo(0, -r - tickLen);
          ctx.moveTo(0, r); ctx.lineTo(0, r + tickLen);
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();
        }

        // Render Trail Shards
        for (let i = trailShards.length - 1; i >= 0; i--) {
          const p = trailShards[i];
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vRot;
          p.life -= p.decay;

          if (p.life <= 0) {
            trailShards.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);

          const alpha = (p.life * 0.8).toFixed(2);
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.75, p.size * 0.75);
          ctx.lineTo(-p.size * 0.75, p.size * 0.75);
          ctx.closePath();

          if (p.color === "#eef8f9") {
            ctx.fillStyle = `rgba(238, 248, 249, ${alpha})`;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 4;
          } else if (p.color === "#38b2c4") {
            ctx.fillStyle = `rgba(56, 178, 196, ${alpha})`;
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 5;
          } else {
            ctx.fillStyle = `rgba(0, 134, 155, ${alpha})`;
            ctx.shadowColor = "#00869b";
            ctx.shadowBlur = 4;
          }

          ctx.fill();
          ctx.restore();
        }
      }

      if (isText) {
        ctx.restore();
        return;
      }

      // 1. Hover Luminous Halo Ring
      if (hoverGlow > 0.02 && !reduced) {
        ctx.save();
        ctx.translate(drawX, drawY + 22 * scale);

        const ringAlpha = (hoverGlow * 0.85).toFixed(2);
        const rx = 18 * scale;
        const ry = 6.5 * scale;

        const radialGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, rx * 1.5);
        radialGlow.addColorStop(0, `rgba(0, 229, 255, ${(hoverGlow * 0.22).toFixed(2)})`);
        radialGlow.addColorStop(0.7, `rgba(0, 134, 155, ${(hoverGlow * 0.08).toFixed(2)})`);
        radialGlow.addColorStop(1, "rgba(0, 134, 155, 0)");
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 1.5, ry * 1.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = radialGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${ringAlpha})`;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 8 * hoverGlow;
        ctx.stroke();

        ctx.restore();
      }

      // 2. Soft Ground Contact Shadow
      ctx.save();
      ctx.translate(drawX, drawY + 20 * scale);
      const shadowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 14 * scale);
      shadowGrad.addColorStop(0, "rgba(0, 60, 75, 0.28)");
      shadowGrad.addColorStop(0.5, "rgba(0, 60, 75, 0.12)");
      shadowGrad.addColorStop(1, "rgba(0, 60, 75, 0)");
      ctx.beginPath();
      ctx.ellipse(0, 0, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // 3. 3D Tetrahedron Pyramid with Glass Facets
      ctx.save();
      ctx.translate(drawX, drawY);

      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
      const cosZ = Math.cos(roll), sinZ = Math.sin(roll);

      const proj = vertices.map((v) => {
        const x1 = v.x * cosY + v.z * sinY;
        const y1 = v.y;
        const z1 = -v.x * sinY + v.z * cosY;

        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        const x3 = x2 * cosZ - y2 * sinZ;
        const y3 = x2 * sinZ + y2 * cosZ;
        const z3 = z2;

        const fov = 140;
        const camDist = 140;
        const pScale = (fov / (camDist + z3)) * scale;

        return {
          x: x3, y: y3, z: z3,
          px: x3 * pScale,
          py: y3 * pScale
        };
      });

      const faceData = faces.map((f) => {
        const v0 = proj[f.indices[0]];
        const v1 = proj[f.indices[1]];
        const v2 = proj[f.indices[2]];

        const u = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const w = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

        const nx = u.y * w.z - u.z * w.y;
        const ny = u.z * w.x - u.x * w.z;
        const nz = u.x * w.y - u.y * w.x;
        const len = Math.hypot(nx, ny, nz) || 1;
        const norm = { x: nx / len, y: ny / len, z: nz / len };

        const avgZ = (v0.z + v1.z + v2.z) / 3;
        const isFront = nz < 0;

        const dot = -(norm.x * Light.x + norm.y * Light.y + norm.z * Light.z);
        const diffuse = Math.max(0.0, Math.min(1.0, dot));

        const nDotL = norm.x * Light.x + norm.y * Light.y + norm.z * Light.z;
        const rx = 2 * nDotL * norm.x - Light.x;
        const ry = 2 * nDotL * norm.y - Light.y;
        const rz = 2 * nDotL * norm.z - Light.z;
        const rDotV = -(rx * View.x + ry * View.y + rz * View.z);
        const specular = Math.pow(Math.max(0.0, rDotV), 10);

        return {
          face: f,
          v0, v1, v2,
          avgZ,
          isFront,
          diffuse,
          specular
        };
      });

      faceData.sort((a, b) => b.avgZ - a.avgZ);

      // Back-facing translucent facet
      faceData.filter(fd => !fd.isFront).forEach(fd => {
        ctx.beginPath();
        ctx.moveTo(fd.v0.px, fd.v0.py);
        ctx.lineTo(fd.v1.px, fd.v1.py);
        ctx.lineTo(fd.v2.px, fd.v2.py);
        ctx.closePath();

        ctx.fillStyle = "rgba(0, 80, 95, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 134, 155, 0.25)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Interior datum line
      const core = proj[4];
      ctx.beginPath();
      ctx.moveTo(core.px, core.py);
      ctx.lineTo(proj[0].px, proj[0].py);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Front-facing glass facets matching reference sequence
      faceData.filter(fd => fd.isFront).forEach(fd => {
        ctx.beginPath();
        ctx.moveTo(fd.v0.px, fd.v0.py);
        ctx.lineTo(fd.v1.px, fd.v1.py);
        ctx.lineTo(fd.v2.px, fd.v2.py);
        ctx.closePath();

        const grad = ctx.createLinearGradient(fd.v0.px, fd.v0.py, (fd.v1.px + fd.v2.px) / 2, (fd.v1.py + fd.v2.py) / 2);

        if (fd.specular > 0.45) {
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.4, "rgba(238, 248, 249, 0.95)");
          grad.addColorStop(0.75, "rgba(56, 178, 196, 0.85)");
          grad.addColorStop(1, "rgba(0, 134, 155, 0.9)");
        } else if (fd.diffuse > 0.35) {
          grad.addColorStop(0, "rgba(238, 248, 249, 0.85)");
          grad.addColorStop(0.3, "rgba(38, 198, 218, 0.95)");
          grad.addColorStop(0.8, "#00869b");
          grad.addColorStop(1, "#005b6a");
        } else {
          grad.addColorStop(0, "rgba(0, 168, 181, 0.85)");
          grad.addColorStop(0.5, "#00869b");
          grad.addColorStop(1, "#00424d");
        }

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = fd.specular > 0.35 ? "rgba(255, 255, 255, 0.95)" : "rgba(238, 248, 249, 0.75)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });

      // Apex specular gleam (exact pointer hotspot)
      const apex = proj[0];
      ctx.beginPath();
      ctx.arc(apex.px, apex.py, 1.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      ctx.restore();
    };

    rafId = requestAnimationFrame(update);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", setupCanvasSize);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.documentElement.classList.remove("sea-cursor-enabled");
    };
  }, []);

  return <canvas id="sea-cursor-trail-canvas" ref={canvasRef} aria-hidden="true" />;
};
