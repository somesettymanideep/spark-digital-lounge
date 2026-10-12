/**
 * SEA (Studio for Eclectic Architecture) — Animated Flying Parrot Cursor
 * 
 * Features:
 * - Beautiful, colorful flying parrot with realistic 3D wing flapping & undulating tail
 * - Natural aerodynamic flight physics: heading orientation, banking pitch, acceleration & hovering
 * - Subtle vertical flight bobbing (sine wave) simulating realistic bird lift
 * - Delicate teal flight trail behind the wings & tail
 * - Interactive states:
 *   - Navigation links: gentle hover in place
 *   - Project cards: graceful circular glide & "EXPLORE" badge
 *   - Buttons: luminous SEA teal glow
 *   - Idle: calm hovering with gentle wing beats
 * - Accessible: respects prefers-reduced-motion, auto-disables on touch/mobile, pointer-events: none
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

    class SeaParrotCursor {
        constructor() {
            this.container = null;
            this.anchor = null;
            this.parrotWrapper = null;
            this.targetDot = null;
            this.exploreBadge = null;
            this.canvas = null;
            this.ctx = null;

            // Coordinates & Flight Dynamics
            this.mouse = { x: -100, y: -100 };
            this.pos = { x: -100, y: -100 };
            this.velocity = { x: 0, y: 0, speed: 0 };
            this.facing = 1; // 1 = facing right, -1 = facing left
            this.pitch = 0; // vertical banking angle (degrees)
            this.flightTime = 0;
            this.orbitAngle = 0; // for project glide orbit

            // State flags
            this.isVisible = false;
            this.isIdle = false;
            this.isActive = false;
            this.currentState = 'default'; // 'default' | 'nav' | 'button' | 'project' | 'text'
            this.idleTimer = null;

            // Trail particles
            this.trail = [];
            this.wingSide = 1;

            this.rafId = null;

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

            this.buildDOM();
            this.setupCanvas();
            this.attachEvents();
            this.rafId = requestAnimationFrame(this.update);
        }

        buildDOM() {
            // Trail Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'sea-cursor-trail-canvas';
            this.canvas.setAttribute('aria-hidden', 'true');
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            // Main Cursor Container
            this.container = document.createElement('div');
            this.container.className = 'sea-cursor-container';
            this.container.setAttribute('aria-hidden', 'true');

            this.anchor = document.createElement('div');
            this.anchor.className = 'sea-cursor-anchor';

            // Precision targeting dot near beak tip
            this.targetDot = document.createElement('div');
            this.targetDot.className = 'sea-cursor-target-dot';

            // Parrot Wrapper
            this.parrotWrapper = document.createElement('div');
            this.parrotWrapper.className = 'sea-parrot-wrapper';
            this.parrotWrapper.innerHTML = `
                <svg class="sea-parrot-svg" viewBox="0 0 62 52">
                    <defs>
                        <!-- Body gradient: Cyan to Emerald-Teal to Dark Teal -->
                        <linearGradient id="seaParrotBody" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#00E5FF" />
                            <stop offset="30%" stop-color="#00A8B5" />
                            <stop offset="70%" stop-color="#008C9E" />
                            <stop offset="100%" stop-color="#005F73" />
                        </linearGradient>

                        <!-- Far Wing gradient (darker for 3D depth) -->
                        <linearGradient id="seaParrotWingFarGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#004652" />
                            <stop offset="60%" stop-color="#006F80" />
                            <stop offset="100%" stop-color="#008C9E" />
                        </linearGradient>

                        <!-- Near Wing gradient: Vibrant flight feathers -->
                        <linearGradient id="seaParrotWingNearGrad" x1="0%" y1="100%" x2="80%" y2="0%">
                            <stop offset="0%" stop-color="#005F73" />
                            <stop offset="35%" stop-color="#008C9E" />
                            <stop offset="70%" stop-color="#00B4D8" />
                            <stop offset="100%" stop-color="#00E5FF" />
                        </linearGradient>

                        <!-- Wing shoulder accent (golden-yellow to emerald) -->
                        <linearGradient id="seaParrotAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#FFD166" />
                            <stop offset="50%" stop-color="#06D6A0" />
                            <stop offset="100%" stop-color="#008C9E" />
                        </linearGradient>

                        <!-- Tail gradient -->
                        <linearGradient id="seaParrotTailGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#008C9E" />
                            <stop offset="50%" stop-color="#005F73" />
                            <stop offset="100%" stop-color="#081F2C" />
                        </linearGradient>
                    </defs>

                    <!-- FAR WING (Behind body) -->
                    <g class="sea-parrot-wing-far">
                        <path d="M24,18 C26,11 31,4 39,2 C41,2 41,5 38,9 C35,13 31,17 27,21 Z" fill="url(#seaParrotWingFarGrad)" />
                        <path d="M25,18 C28,13 34,7 42,5 C43,6 42,8 39,12 C35,16 30,20 27,22 Z" fill="#005060" opacity="0.6" />
                    </g>

                    <!-- LONG FLOWING TAIL FEATHERS -->
                    <g class="sea-parrot-tail">
                        <!-- Main central streamer -->
                        <path d="M16,26 C12,32 6,41 2,48 C3,48 7,42 15,31 Z" fill="url(#seaParrotTailGrad)" />
                        <!-- Secondary upper feather -->
                        <path d="M17,25 C14,30 9,37 4,43 C6,42 11,35 17,29 Z" fill="#008C9E" opacity="0.85" />
                        <!-- Golden accent line -->
                        <path d="M16,26 C13,31 8,38 4,43" stroke="#FFD166" stroke-width="0.8" fill="none" opacity="0.75" />
                    </g>

                    <!-- BODY & HEAD GROUP -->
                    <g class="sea-parrot-body-group">
                        <!-- Main torso & rump -->
                        <path d="M16,24 C18,20 23,17 31,17 C37,17 44,18 48,22 C47,26 42,29 34,29 C25,29 18,28 16,24 Z" fill="url(#seaParrotBody)" />

                        <!-- Chest & throat bulge -->
                        <path d="M31,17 C37,17 43,19 46,23 C44,27 38,29 32,29 C28,29 25,28 24,25 C25,20 28,17 31,17 Z" fill="#00A8B5" />

                        <!-- Head with elegant feathered crown -->
                        <path d="M42,19 C43,14 47,13 51,15 C54,16 56,18 57,21 C56,24 53,25 48,25 C45,25 43,22 42,19 Z" fill="#00E5FF" />

                        <!-- White cheek patch (signature macaw/parakeet aesthetic) -->
                        <ellipse cx="49" cy="20" rx="3.5" ry="2.5" fill="#FFFFFF" opacity="0.95" />

                        <!-- Realistic dark eye with golden amber ring and glint -->
                        <circle cx="49.5" cy="19.5" r="1.6" fill="#FFD166" />
                        <circle cx="49.5" cy="19.5" r="1.1" fill="#081F2C" />
                        <circle cx="49.8" cy="19.2" r="0.4" fill="#FFFFFF" />

                        <!-- Curved parrot beak -->
                        <!-- Upper curved mandible -->
                        <path d="M54,19 C57,19 60,21 59,25 C58,25 56,23 54,23 Z" fill="#1C2833" />
                        <!-- Lower mandible -->
                        <path d="M55,23 C57,23 58,24 57,25 C55,25 54,24 55,23 Z" fill="#0E171D" />
                        <!-- Subtle beak highlight -->
                        <path d="M54,19 C56,19 58,20 58.5,22" stroke="#FFFFFF" stroke-width="0.5" fill="none" opacity="0.45" />

                        <!-- Underbelly / legs contour -->
                        <path d="M28,28 C29,30 31,31 32,29" stroke="#FFB703" stroke-width="1.2" stroke-linecap="round" fill="none" />
                    </g>

                    <!-- NEAR WING (Foreground, layered multi-color flight plumage) -->
                    <g class="sea-parrot-wing-near">
                        <!-- Primary flight feathers (long outer sweep) -->
                        <path d="M27,19 C30,11 36,3 46,1 C48,1 48,4 44,9 C40,14 34,20 29,23 Z" fill="url(#seaParrotWingNearGrad)" />
                        
                        <!-- Secondary flight feathers (middle layer) -->
                        <path d="M28,19 C31,13 37,7 44,6 C45,7 44,9 41,13 C37,17 32,22 29,23 Z" fill="#008C9E" opacity="0.9" />

                        <!-- Wing shoulder coverts with golden-emerald brilliance -->
                        <path d="M28,19 C31,16 35,13 39,12 C40,14 38,17 35,19 C32,21 30,21 28,19 Z" fill="url(#seaParrotAccentGrad)" />

                        <!-- Delicate feather rib hairlines -->
                        <path d="M29,19 C35,12 40,7 45,2" stroke="#FFFFFF" stroke-width="0.5" fill="none" opacity="0.6" />
                        <path d="M30,20 C34,15 38,11 42,7" stroke="#00E5FF" stroke-width="0.5" fill="none" opacity="0.5" />
                    </g>
                </svg>
            `;

            // "EXPLORE" Project Badge
            this.exploreBadge = document.createElement('div');
            this.exploreBadge.className = 'sea-parrot-badge-explore';
            this.exploreBadge.innerHTML = `
                <div class="badge-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </div>
                <span class="text">EXPLORE</span>
            `;

            this.anchor.appendChild(this.exploreBadge);
            this.anchor.appendChild(this.parrotWrapper);
            this.anchor.appendChild(this.targetDot);
            this.container.appendChild(this.anchor);
            document.body.appendChild(this.container);
        }

        setupCanvas() {
            if (!this.canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
            if (this.ctx) {
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
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
                this.hide();
            }
        }

        onResize() {
            this.setupCanvas();
        }

        onMouseMove(e) {
            const x = e.clientX;
            const y = e.clientY;

            if (!this.isVisible) {
                this.show();
                this.pos.x = x;
                this.pos.y = y;
            }

            const dx = x - (this.mouse.x === -100 ? x : this.mouse.x);
            const dy = y - (this.mouse.y === -100 ? y : this.mouse.y);
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.mouse.x = x;
            this.mouse.y = y;

            this.velocity.x = dx;
            this.velocity.y = dy;
            this.velocity.speed = dist;

            // Update facing direction smoothly:
            // If moving significantly right -> face right (1)
            // If moving significantly left -> face left (-1)
            if (dx > 1.2) {
                this.facing = 1;
            } else if (dx < -1.2) {
                this.facing = -1;
            }

            // Calculate flight pitch (banking angle based on climb/dive)
            if (dist > 1) {
                // Pitch angle: dive down (positive pitch) or climb up (negative pitch)
                const targetPitch = Math.max(-24, Math.min(24, (dy / (dist || 1)) * 22 * this.facing));
                this.pitch += (targetPitch - this.pitch) * 0.25;
            } else {
                this.pitch += (0 - this.pitch) * 0.15;
            }

            // Emit delicate flight trail particles behind wings & tail
            if (!prefersReducedMotion() && dist > 1.5) {
                this.emitFlightTrail(this.pos.x, this.pos.y, dx, dy, dist);
            }

            // Reset idle timer
            if (this.isIdle) {
                this.isIdle = false;
                this.container.classList.remove('is-idle');
            }
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                this.isIdle = true;
                this.container.classList.add('is-idle');
            }, 1200);
        }

        emitFlightTrail(x, y, dx, dy, dist) {
            const len = Math.max(0.001, dist);
            const nx = dx / len;
            const ny = dy / len;
            const px = -ny;
            const py = nx;

            const count = dist > 20 ? 3 : dist > 8 ? 2 : 1;

            for (let i = 0; i < count; i++) {
                this.wingSide = -this.wingSide;
                const side = this.wingSide;

                // Trail originates slightly behind the parrot body
                const spread = (Math.random() - 0.5) * 14;
                const spawnX = x - nx * 18 + px * spread;
                const spawnY = y - ny * 18 + py * spread;

                const colors = ['#00E5FF', '#008C9E', '#006F80', '#FFFFFF', '#FFD166'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                this.trail.push({
                    x: spawnX,
                    y: spawnY,
                    vx: -nx * 0.6 + (Math.random() - 0.5) * 0.5,
                    vy: -ny * 0.6 + (Math.random() - 0.5) * 0.5 + 0.15,
                    size: 1.2 + Math.random() * 2.2,
                    alpha: 0.85,
                    life: 1.0,
                    decay: 0.024 + Math.random() * 0.02,
                    color: color
                });
            }

            if (this.trail.length > 75) {
                this.trail.splice(0, this.trail.length - 75);
            }
        }

        onMouseDown() {
            this.isActive = true;
            this.container.classList.add('is-active');
        }

        onMouseUp() {
            this.isActive = false;
            this.container.classList.remove('is-active');
        }

        onMouseEnter() {
            this.show();
        }

        onMouseLeave() {
            this.hide();
        }

        show() {
            this.isVisible = true;
            this.container.classList.add('is-visible');
            this.container.classList.remove('is-hidden');
        }

        hide() {
            this.isVisible = false;
            this.container.classList.remove('is-visible');
            this.container.classList.add('is-hidden');
        }

        handleElementHover(e) {
            const target = e.target;
            if (!target) return;

            if (target.closest('input, textarea, select, [contenteditable="true"]')) {
                this.setState('text');
                return;
            }

            const projectTarget = target.closest(
                '.bs-project-4-card-single, .card-img, [data-cursor-text], .bs-project-item, [data-cursor-project], .sea-project-card'
            );
            if (projectTarget) {
                this.setState('project');
                return;
            }

            const buttonTarget = target.closest(
                'button, .bs-btn-1, .bs-btn-2, .btn, a.know-about-btn, input[type="submit"], ' +
                '.bs-offcanvas-btn-1, .bs-t4-next, .bs-t4-prev, .bs-back-to-top-btn, ' +
                '.bs-header-2-action-link, [role="button"]'
            );
            if (buttonTarget) {
                this.setState('button');
                return;
            }

            const navTarget = target.closest(
                'nav a, .bs-main-navigation a, .navbar-nav a, header a, ' +
                '.mobile-main-navigation a, .sea-social-item, .bs-footer-2-widgets a, a'
            );
            if (navTarget) {
                this.setState('nav');
                return;
            }

            this.setState('default');
        }

        handleElementLeave(e) {
            if (e.relatedTarget && e.relatedTarget.closest) {
                this.handleElementHover({ target: e.relatedTarget });
            } else {
                this.setState('default');
            }
        }

        setState(newState) {
            if (this.currentState === newState) return;

            this.container.classList.remove('state-nav', 'state-button', 'state-project', 'state-text');
            if (newState !== 'default') {
                this.container.classList.add(`state-${newState}`);
            }
            this.currentState = newState;
        }

        update() {
            this.rafId = requestAnimationFrame(this.update);

            if (!this.isVisible) return;

            const reduced = prefersReducedMotion();
            this.flightTime += 0.05;

            // Target coordinates
            let targetX = this.mouse.x;
            let targetY = this.mouse.y;

            // If in project state: circular glide orbit around project element
            if (this.currentState === 'project' && !reduced) {
                this.orbitAngle += 0.045;
                const orbitRadius = 26;
                targetX += Math.cos(this.orbitAngle) * orbitRadius;
                targetY += Math.sin(this.orbitAngle) * (orbitRadius * 0.65);
                this.facing = Math.cos(this.orbitAngle + 0.1) >= 0 ? 1 : -1;
            }

            // Smooth flight easing (lerp with aerodynamic momentum)
            if (reduced) {
                this.pos.x = targetX;
                this.pos.y = targetY;
            } else {
                const lerpFactor = this.currentState === 'nav' ? 0.12 : (this.currentState === 'project' ? 0.16 : 0.18);
                this.pos.x += (targetX - this.pos.x) * lerpFactor;
                this.pos.y += (targetY - this.pos.y) * lerpFactor;
            }

            // Subtle vertical flight bobbing (natural wing lift undulation)
            let bobY = 0;
            if (!reduced) {
                const bobFreq = this.isIdle ? 3.2 : 6.5;
                const bobAmp = this.isIdle ? 4.5 : 2.5;
                bobY = Math.sin(this.flightTime * bobFreq) * bobAmp;
            }

            // Dynamic flight classes based on speed
            const distFromTarget = Math.hypot(this.mouse.x - this.pos.x, this.mouse.y - this.pos.y);
            if (distFromTarget > 18) {
                this.container.classList.add('is-speeding');
                this.container.classList.remove('is-hovering');
            } else {
                this.container.classList.remove('is-speeding');
                this.container.classList.add('is-hovering');
            }

            // Positioning container
            this.container.style.transform = `translate3d(${this.pos.x.toFixed(1)}px, ${(this.pos.y + bobY).toFixed(1)}px, 0)`;

            // Orient parrot wrapper: facing direction (scaleX) & pitch angle
            const scaleX = this.facing;
            const pitchRot = reduced ? 0 : this.pitch;
            this.parrotWrapper.style.transform = `translate(-55%, -50%) scaleX(${scaleX}) rotate(${pitchRot.toFixed(1)}deg)`;

            // Render Flight Trail
            if (!reduced && this.ctx) {
                this.renderTrail();
            }
        }

        renderTrail() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = this.trail.length - 1; i >= 0; i--) {
                const p = this.trail[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.trail.splice(i, 1);
                    continue;
                }

                const alpha = Math.max(0, p.life * p.alpha).toFixed(3);
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);

                if (p.color === '#FFFFFF') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.shadowColor = '#00E5FF';
                    ctx.shadowBlur = 6;
                } else if (p.color === '#FFD166') {
                    ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`;
                    ctx.shadowColor = '#FFD166';
                    ctx.shadowBlur = 4;
                } else {
                    ctx.fillStyle = `rgba(0, 140, 158, ${alpha})`;
                    ctx.shadowColor = '#008C9E';
                    ctx.shadowBlur = 5;
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
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            window.__SEA_CURSOR_INITIALIZED__ = false;
        }
    }

    window.SeaParrotCursor = SeaParrotCursor;

    function initCursor() {
        if (!window.__SEA_CURSOR_INSTANCE__) {
            window.__SEA_CURSOR_INSTANCE__ = new SeaParrotCursor();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursor);
    } else {
        initCursor();
    }
})();
