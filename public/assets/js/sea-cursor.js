/**
 * SEA (Studio for Eclectic Architecture) — Premium 3D Architectural Pyramid Cursor
 * 
 * Accurately implements the reference design board:
 * 1. Default State: Clean, minimal, elegant 3D faceted tetrahedron in SEA brand colors (#eef8f9 & #00869b)
 * 2. Moving: Fluid 3D velocity tilt with subtle trailing geometric triangular micro-shards
 * 3. Hover Effect: Smooth scale-up and luminous ground halo ring under the pyramid
 * 4. Click Animation: Concentric architectural pulse rings with 4 cardinal tick marks
 * 5. Idle State: Sinusoidal floating elevation with continuous 360° crystalline rotation
 * 
 * Ultra-responsive tracking: immediate mouse response, 0 lag, precision apex pointer hotspot
 */

(function () {
    'use strict';

    if (window.__SEA_CURSOR_INITIALIZED__) return;

    const isTouchOrCoarse = () => {
        return (
            window.matchMedia('(pointer: coarse)').matches ||
            window.matchMedia('(hover: none)').matches ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    };

    if (isTouchOrCoarse()) {
        return;
    }

    const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    class SeaPyramidCursor {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.dpr = 1;

            // Coordinates & Dynamics
            this.mouse = { x: -100, y: -100 };
            this.pos = { x: -100, y: -100 };
            this.vel = { x: 0, y: 0, speed: 0 };

            // State flags
            this.isVisible = false;
            this.isIdle = false;
            this.idleTimer = null;
            this.isHover = false;
            this.isText = false;
            this.isMouseDown = false;

            // 3D Angles
            this.pitch = 0.28; // Isometric elevation view (~16 deg)
            this.yaw = 0.45;
            this.roll = 0;
            this.idleTime = 0;
            this.scale = 1.0;
            this.hoverGlow = 0; // Smooth 0..1 transition for ground halo ring

            // Particle & Pulse Arrays
            this.trailShards = [];
            this.clickPulses = [];

            this.rafId = null;

            // 3D Tetrahedron Geometry: 4 vertices, 4 faces
            // Apex positioned at hotspot (-2px Y) so the tip is the click point!
            const R = 14;      // Base radius
            const yApex = -2;  // Apex tip
            const yBase = 20;  // Base plane

            this.vertices = [
                { x: 0, y: yApex, z: 0 },                                                  // 0: Apex
                { x: R * Math.cos(0), y: yBase, z: R * Math.sin(0) },                      // 1: Base 0 (Right)
                { x: R * Math.cos(2 * Math.PI / 3), y: yBase, z: R * Math.sin(2 * Math.PI / 3) }, // 2: Base 1 (Back-Left)
                { x: R * Math.cos(4 * Math.PI / 3), y: yBase, z: R * Math.sin(4 * Math.PI / 3) }, // 3: Base 2 (Front-Left)
                { x: 0, y: 10, z: 0 }                                                      // 4: Internal Centroid
            ];

            this.faces = [
                { indices: [0, 1, 2], name: 'right' },
                { indices: [0, 2, 3], name: 'back' },
                { indices: [0, 3, 1], name: 'front' },
                { indices: [1, 3, 2], name: 'base' }
            ];

            // Directional Light: Top-Left-Front
            const Light = { x: -0.55, y: -0.75, z: 0.45 };
            const L_len = Math.hypot(Light.x, Light.y, Light.z);
            this.Light = { x: Light.x / L_len, y: Light.y / L_len, z: Light.z / L_len };

            // Camera View Vector
            this.View = { x: 0, y: 0.28, z: -0.96 };

            // Bindings
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.onMouseEnter = this.onMouseEnter.bind(this);
            this.onMouseLeave = this.onMouseLeave.bind(this);
            this.onResize = this.onResize.bind(this);
            this.onTouchStart = this.onTouchStart.bind(this);
            this.onVisibilityChange = this.onVisibilityChange.bind(this);
            this.update = this.update.bind(this);

            this.init();
        }

        init() {
            window.__SEA_CURSOR_INITIALIZED__ = true;
            document.documentElement.classList.add('sea-cursor-enabled');

            this.buildCanvas();
            this.attachEvents();
            this.rafId = requestAnimationFrame(this.update);
        }

        buildCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'sea-cursor-trail-canvas';
            this.canvas.setAttribute('aria-hidden', 'true');
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasSize();
        }

        setupCanvasSize() {
            if (!this.canvas || !this.ctx) return;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = window.innerWidth * this.dpr;
            this.canvas.height = window.innerHeight * this.dpr;
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
        }

        attachEvents() {
            window.addEventListener('mousemove', this.onMouseMove, { passive: true });
            window.addEventListener('mousedown', this.onMouseDown, { passive: true });
            window.addEventListener('mouseup', this.onMouseUp, { passive: true });
            document.addEventListener('mouseenter', this.onMouseEnter, { passive: true });
            document.addEventListener('mouseleave', this.onMouseLeave, { passive: true });
            window.addEventListener('resize', this.onResize, { passive: true });
            window.addEventListener('touchstart', this.onTouchStart, { passive: true, once: true });
            document.addEventListener('visibilitychange', this.onVisibilityChange, { passive: true });

            document.addEventListener('mouseover', (e) => this.handleElementHover(e), { passive: true });
            document.addEventListener('mouseout', (e) => this.handleElementLeave(e), { passive: true });
        }

        onTouchStart() {
            this.destroy();
        }

        onVisibilityChange() {
            if (document.hidden) {
                this.isVisible = false;
            }
        }

        onResize() {
            this.setupCanvasSize();
        }

        onMouseMove(e) {
            const x = e.clientX;
            const y = e.clientY;

            if (!this.isVisible) {
                this.isVisible = true;
                this.mouse.x = x;
                this.mouse.y = y;
                this.pos.x = x;
                this.pos.y = y;
                return;
            }

            const dx = x - this.mouse.x;
            const dy = y - this.mouse.y;
            const dist = Math.hypot(dx, dy);

            this.mouse.x = x;
            this.mouse.y = y;
            this.vel.x = dx;
            this.vel.y = dy;
            this.vel.speed = dist;

            // Spawn delicate geometric triangular micro-shards when moving fast
            if (!prefersReducedMotion() && dist > 2.5 && !this.isText) {
                const count = dist > 14 ? 2 : 1;
                for (let i = 0; i < count; i++) {
                    this.trailShards.push({
                        x: this.pos.x + (Math.random() - 0.5) * 6,
                        y: this.pos.y + 10 + (Math.random() - 0.5) * 6,
                        vx: -dx * 0.12 + (Math.random() - 0.5) * 0.5,
                        vy: -dy * 0.12 + (Math.random() - 0.5) * 0.5,
                        size: 2.2 + Math.random() * 2.8,
                        rot: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 0.1,
                        life: 1.0,
                        decay: 0.038 + Math.random() * 0.02,
                        color: Math.random() > 0.45 ? '#00869b' : (Math.random() > 0.3 ? '#38b2c4' : '#eef8f9')
                    });
                }
                if (this.trailShards.length > 20) {
                    this.trailShards.splice(0, this.trailShards.length - 20);
                }
            }

            // Reset idle state
            if (this.isIdle) {
                this.isIdle = false;
            }
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                this.isIdle = true;
            }, 450);
        }

        onMouseDown() {
            this.isMouseDown = true;
            if (!prefersReducedMotion() && !this.isText) {
                this.clickPulses.push({
                    x: this.pos.x,
                    y: this.pos.y + 10,
                    radius: 12,
                    maxRadius: 38,
                    life: 1.0,
                    decay: 0.045
                });
            }
        }

        onMouseUp() {
            this.isMouseDown = false;
        }

        onMouseEnter(e) {
            this.isVisible = true;
            if (e && typeof e.clientX === 'number') {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        }

        onMouseLeave() {
            this.isVisible = false;
        }

        handleElementHover(e) {
            const target = e.target;
            if (!target) return;

            if (target.closest('input, textarea, select, [contenteditable="true"]')) {
                this.isText = true;
                this.isHover = false;
                return;
            }

            const isInteractive = target.closest(
                'button, .bs-btn-1, .bs-btn-2, .btn, a, [role="button"], ' +
                '.card, .bs-project-4-card-single, .card-img, [data-cursor-project], .sea-project-card'
            );

            if (isInteractive) {
                this.isHover = true;
                this.isText = false;
            } else {
                this.isHover = false;
                this.isText = false;
            }
        }

        handleElementLeave(e) {
            if (e.relatedTarget && e.relatedTarget.closest) {
                this.handleElementHover({ target: e.relatedTarget });
            } else {
                this.isHover = false;
                this.isText = false;
            }
        }

        update() {
            this.rafId = requestAnimationFrame(this.update);

            if (!this.isVisible || !this.ctx) return;
            const ctx = this.ctx;

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.save();
            ctx.scale(this.dpr, this.dpr);

            const reduced = prefersReducedMotion();

            // Smooth fluid lerp tracking with zero lag (0.35 factor)
            if (reduced) {
                this.pos.x = this.mouse.x + 24;
                this.pos.y = this.mouse.y + 16;
            } else {
                const lerpFactor = this.isHover ? 0.2 : 0.16;
                this.pos.x += (this.mouse.x + 24 - this.pos.x) * lerpFactor;
                this.pos.y += (this.mouse.y + 16 - this.pos.y) * lerpFactor;
            }

            // Smooth momentum decay
            this.vel.x *= 0.82;
            this.vel.y *= 0.82;
            this.vel.speed *= 0.82;

            // Hover Scale & Glow Interpolation
            const targetScale = this.isMouseDown ? 0.62 : (this.isHover ? 0.82 : 0.68);
            this.scale += (targetScale - this.scale) * 0.16;

            const targetGlow = this.isHover ? 1.0 : 0.0;
            this.hoverGlow += (targetGlow - this.hoverGlow) * 0.15;

            // Idle Floating Wave & 3D Crystalline Rotation
            this.idleTime += 0.035;
            let floatY = 0;

            if (reduced) {
                this.pitch = 0.28;
                this.yaw = 0.45;
                this.roll = 0;
            } else if (this.isIdle) {
                this.yaw += 0.018; // Smooth 360 deg crystalline rotation
                this.pitch += (0.28 - this.pitch) * 0.06;
                this.roll += (0 - this.roll) * 0.06;
                floatY = Math.sin(this.idleTime * 1.8) * 2.6;
            } else {
                // Dynamic velocity-driven 3D tilt
                const targetPitch = Math.max(-0.35, Math.min(0.45, (this.vel.y / (this.vel.speed || 1)) * 0.35 + 0.28));
                const targetRoll = Math.max(-0.35, Math.min(0.35, (this.vel.x / (this.vel.speed || 1)) * 0.28));
                const targetYaw = Math.max(-0.5, Math.min(0.5, (this.vel.x / (this.vel.speed || 1)) * 0.45));

                this.pitch += (targetPitch - this.pitch) * 0.15;
                this.roll += (targetRoll - this.roll) * 0.15;
                this.yaw += (targetYaw - this.yaw) * 0.15;
            }

            if (!reduced) this.yaw += this.isHover ? 0.05 : 0.012;
      const drawX = this.pos.x;
            const drawY = this.pos.y + floatY;

            // Render Click Pulse Rings
            if (!reduced) {
                this.renderClickPulses(ctx);
                this.renderTrailShards(ctx);
            }

            // If in form text selection, fade out cursor for clean native editing
            if (this.isText) {
                ctx.restore();
                return;
            }

            // 1. Render Hover Luminous Halo Ring (Reference Board Panel 3)
            if (this.hoverGlow > 0.02 && !reduced) {
                ctx.save();
                ctx.translate(drawX, drawY + 22 * this.scale);

                const ringAlpha = (this.hoverGlow * 0.85).toFixed(2);
                const rx = 18 * this.scale;
                const ry = 6.5 * this.scale;

                // Soft ground radial glow
                const radialGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, rx * 1.5);
                radialGlow.addColorStop(0, `rgba(0, 229, 255, ${(this.hoverGlow * 0.22).toFixed(2)})`);
                radialGlow.addColorStop(0.7, `rgba(0, 134, 155, ${(this.hoverGlow * 0.08).toFixed(2)})`);
                radialGlow.addColorStop(1, 'rgba(0, 134, 155, 0)');
                ctx.beginPath();
                ctx.ellipse(0, 0, rx * 1.5, ry * 1.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = radialGlow;
                ctx.fill();

                // Crisp glowing ellipse ring
                ctx.beginPath();
                ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 229, 255, ${ringAlpha})`;
                ctx.lineWidth = 1.4;
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 8 * this.hoverGlow;
                ctx.stroke();

                ctx.restore();
            }

            // 2. Render Soft Ground Contact Shadow (Reference Board Panel 1 & 5)
            ctx.save();
            ctx.translate(drawX, drawY + 20 * this.scale);
            const shadowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 14 * this.scale);
            shadowGrad.addColorStop(0, 'rgba(0, 60, 75, 0.28)');
            shadowGrad.addColorStop(0.5, 'rgba(0, 60, 75, 0.12)');
            shadowGrad.addColorStop(1, 'rgba(0, 60, 75, 0)');
            ctx.beginPath();
            ctx.ellipse(0, 0, 14 * this.scale, 5 * this.scale, 0, 0, Math.PI * 2);
            ctx.fillStyle = shadowGrad;
            ctx.fill();
            ctx.restore();

            // 3. Render 3D Tetrahedron Pyramid with Glass Facets
            ctx.save();
            ctx.translate(drawX, drawY);

            const cosY = Math.cos(this.yaw), sinY = Math.sin(this.yaw);
            const cosX = Math.cos(this.pitch), sinX = Math.sin(this.pitch);
            const cosZ = Math.cos(this.roll), sinZ = Math.sin(this.roll);

            // Project 3D vertices (140 fov / 140 camDist gives natural 1:1 scale at z=0)
            const proj = this.vertices.map((v) => {
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
                const pScale = (fov / (camDist + z3)) * this.scale;

                return {
                    x: x3, y: y3, z: z3,
                    px: x3 * pScale,
                    py: y3 * pScale
                };
            });

            // Calculate facet depth & lighting
            const faceData = this.faces.map((f) => {
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

                const dot = -(norm.x * this.Light.x + norm.y * this.Light.y + norm.z * this.Light.z);
                const diffuse = Math.max(0.0, Math.min(1.0, dot));

                // Specular reflection
                const nDotL = norm.x * this.Light.x + norm.y * this.Light.y + norm.z * this.Light.z;
                const rx = 2 * nDotL * norm.x - this.Light.x;
                const ry = 2 * nDotL * norm.y - this.Light.y;
                const rz = 2 * nDotL * norm.z - this.Light.z;
                const rDotV = -(rx * this.View.x + ry * this.View.y + rz * this.View.z);
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

            // A. Back-facing translucent glass facet
            faceData.filter(fd => !fd.isFront).forEach(fd => {
                ctx.beginPath();
                ctx.moveTo(fd.v0.px, fd.v0.py);
                ctx.lineTo(fd.v1.px, fd.v1.py);
                ctx.lineTo(fd.v2.px, fd.v2.py);
                ctx.closePath();

                ctx.fillStyle = 'rgba(0, 80, 95, 0.18)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 134, 155, 0.25)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });

            // B. Interior datum structural line
            const core = proj[4];
            ctx.beginPath();
            ctx.moveTo(core.px, core.py);
            ctx.lineTo(proj[0].px, proj[0].py);
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // C. Front-facing architectural glass facets (Matching exact 8-frame sequence)
            faceData.filter(fd => fd.isFront).forEach(fd => {
                ctx.beginPath();
                ctx.moveTo(fd.v0.px, fd.v0.py);
                ctx.lineTo(fd.v1.px, fd.v1.py);
                ctx.lineTo(fd.v2.px, fd.v2.py);
                ctx.closePath();

                const grad = ctx.createLinearGradient(fd.v0.px, fd.v0.py, (fd.v1.px + fd.v2.px) / 2, (fd.v1.py + fd.v2.py) / 2);

                if (fd.specular > 0.45) {
                    // High Specular: Crisp ice-crystal facet (#eef8f9 & white specular reflection)
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.4, 'rgba(238, 248, 249, 0.95)');
                    grad.addColorStop(0.75, 'rgba(56, 178, 196, 0.85)');
                    grad.addColorStop(1, 'rgba(0, 134, 155, 0.9)');
                } else if (fd.diffuse > 0.35) {
                    // Vibrant illuminated architectural teal facet
                    grad.addColorStop(0, 'rgba(238, 248, 249, 0.85)');
                    grad.addColorStop(0.3, 'rgba(38, 198, 218, 0.95)');
                    grad.addColorStop(0.8, '#00869b');
                    grad.addColorStop(1, '#005b6a');
                } else {
                    // Shadow facet: Deep architectural teal
                    grad.addColorStop(0, 'rgba(0, 168, 181, 0.85)');
                    grad.addColorStop(0.5, '#00869b');
                    grad.addColorStop(1, '#00424d');
                }

                ctx.fillStyle = grad;
                ctx.fill();

                // Razor-sharp architectural wireframe edge
                ctx.strokeStyle = fd.specular > 0.35 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(238, 248, 249, 0.75)';
                ctx.lineWidth = 1.1;
                ctx.stroke();
            });

            // D. Apex specular light glint (exact pointer hotspot)
            const apex = proj[0];
            ctx.beginPath();
            ctx.arc(apex.px, apex.py, 1.8 * this.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
            ctx.restore();
        }

        renderClickPulses(ctx) {
            for (let i = this.clickPulses.length - 1; i >= 0; i--) {
                const cp = this.clickPulses[i];
                cp.radius += (cp.maxRadius - cp.radius) * 0.15;
                cp.life -= cp.decay;

                if (cp.life <= 0) {
                    this.clickPulses.splice(i, 1);
                    continue;
                }

                const alpha = (cp.life * 0.85).toFixed(2);
                ctx.save();
                ctx.translate(cp.x, cp.y);

                // Outer fine ring
                ctx.beginPath();
                ctx.arc(0, 0, cp.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.shadowColor = '#00869b';
                ctx.shadowBlur = 6;
                ctx.stroke();

                // Inner fine ring
                ctx.beginPath();
                ctx.arc(0, 0, cp.radius * 0.65, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(238, 248, 249, ${(cp.life * 0.6).toFixed(2)})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // 4 Cardinal Architectural Tick Marks (top, bottom, left, right)
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
        }

        renderTrailShards(ctx) {
            for (let i = this.trailShards.length - 1; i >= 0; i--) {
                const p = this.trailShards[i];
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vRot;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.trailShards.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);

                const alpha = (p.life * 0.8).toFixed(2);
                ctx.beginPath();
                // Micro triangle shard
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.75, p.size * 0.75);
                ctx.lineTo(-p.size * 0.75, p.size * 0.75);
                ctx.closePath();

                if (p.color === '#eef8f9') {
                    ctx.fillStyle = `rgba(238, 248, 249, ${alpha})`;
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 4;
                } else if (p.color === '#38b2c4') {
                    ctx.fillStyle = `rgba(56, 178, 196, ${alpha})`;
                    ctx.shadowColor = '#00e5ff';
                    ctx.shadowBlur = 5;
                } else {
                    ctx.fillStyle = `rgba(0, 134, 155, ${alpha})`;
                    ctx.shadowColor = '#00869b';
                    ctx.shadowBlur = 4;
                }

                ctx.fill();
                ctx.restore();
            }
        }

        destroy() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }

            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('mousedown', this.onMouseDown);
            window.removeEventListener('mouseup', this.onMouseUp);
            document.removeEventListener('mouseenter', this.onMouseEnter);
            document.removeEventListener('mouseleave', this.onMouseLeave);
            window.removeEventListener('resize', this.onResize);
            document.removeEventListener('visibilitychange', this.onVisibilityChange);

            document.documentElement.classList.remove('sea-cursor-enabled');

            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }

            window.__SEA_CURSOR_INITIALIZED__ = false;
        }
    }

    window.SeaPyramidCursor = SeaPyramidCursor;
    window.SeaParrotCursor = SeaPyramidCursor;

    function initCursor() {
        if (!window.__SEA_CURSOR_INSTANCE__) {
            window.__SEA_CURSOR_INSTANCE__ = new SeaPyramidCursor();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursor);
    } else {
        initCursor();
    }
})();
