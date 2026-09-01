/**
 * CinemaEngine - Next-Gen Side-by-Side Visual Scene & Picture Movie Engine
 * Renders procedural, multi-layered parallax vistas, dynamic weather/particles,
 * animated actor sprites, dramatic camera motions (Ken Burns), and action FX.
 */
class CinemaEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = 1280;
    this.height = 720;

    // Camera & Motion
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      panX: 0,
      targetPanX: 0,
      shake: 0,
      time: 0
    };

    // Current Scene Definition
    this.currentScene = {
      theme: 'cyberpunk',
      locationId: 'start',
      locationName: 'Obsidian Spire - Helipad',
      mood: 'stealth_rain', // 'stealth_rain', 'neon_bazaar', 'cyberspace', 'combat_fire', 'blood_crypt', 'void_star', etc.
      heroSprite: '🧑‍💻',
      heroName: 'V-77',
      enemySprite: '🤖',
      enemyName: 'Apex Enforcer',
      enemyVisible: true,
      subtitles: 'An armed transport AV sweeps the rain-slicked helipad with blinding searchlights.'
    };

    // Particle Systems
    this.particles = [];
    this.lightBeams = [];
    this.animFrameId = null;
    this.autoPlay = false;
    this.cameraMode = 'dynamic'; // 'dynamic', 'wide', 'closeup'

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.startRenderLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 1280) * dpr;
    this.canvas.height = (rect.height || 720) * dpr;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  initParticles() {
    this.particles = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        flicker: Math.random() * 0.05
      });
    }

    // Light searchlight beams
    this.lightBeams = [
      { angle: 0.8, speed: 0.008, sweep: 0.4, color: 'rgba(79, 209, 197, 0.15)' },
      { angle: 2.2, speed: -0.006, sweep: 0.5, color: 'rgba(239, 106, 95, 0.12)' }
    ];
  }

  setScene(sceneData) {
    this.currentScene = { ...this.currentScene, ...sceneData };
    this.triggerTransition();
  }

  triggerTransition() {
    this.camera.shake = 12;
    this.camera.targetZoom = 1.05 + Math.random() * 0.08;
    this.camera.targetPanX = (Math.random() - 0.5) * 40;
    this.initParticles();
  }

  triggerImpact(strength = 18) {
    this.camera.shake = strength;
    if (window.audioSynth) window.audioSynth.playGlitch();
  }

  triggerSlashFx() {
    this.slashFxTime = Date.now();
    this.triggerImpact(14);
  }

  triggerLaserFx() {
    this.laserFxTime = Date.now();
    this.triggerImpact(10);
  }

  startRenderLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  update() {
    this.camera.time += 0.016;

    // Smooth Camera lerp (Ken Burns subtle breathing motion)
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05;
    this.camera.panX += (this.camera.targetPanX - this.camera.panX) * 0.05;

    // Camera shake decay
    if (this.camera.shake > 0.1) {
      this.camera.x = (Math.random() - 0.5) * this.camera.shake;
      this.camera.y = (Math.random() - 0.5) * this.camera.shake;
      this.camera.shake *= 0.88;
    } else {
      this.camera.x = Math.sin(this.camera.time * 0.5) * 6;
      this.camera.y = Math.cos(this.camera.time * 0.4) * 4;
    }

    // Light searchlight motion
    this.lightBeams.forEach(b => {
      b.angle += b.speed;
    });

    // Particles update based on mood
    const mood = this.currentScene.mood;
    this.particles.forEach(p => {
      if (mood.includes('rain')) {
        p.y += p.vy * 5;
        p.x += p.vx - 1.5;
        if (p.y > this.height) { p.y = 0; p.x = Math.random() * this.width; }
      } else if (mood.includes('embers') || mood.includes('fire') || mood.includes('crypt')) {
        p.y -= p.vy * 1.5;
        p.x += Math.sin(this.camera.time + p.y * 0.05) * 1.2;
        if (p.y < 0) { p.y = this.height; p.x = Math.random() * this.width; }
      } else if (mood.includes('cyberspace') || mood.includes('void')) {
        p.x += (p.x - this.width / 2) * 0.015;
        p.y += (p.y - this.height / 2) * 0.015;
        p.size = Math.min(6, p.size * 1.01);
        if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
          p.x = this.width / 2 + (Math.random() - 0.5) * 100;
          p.y = this.height / 2 + (Math.random() - 0.5) * 100;
          p.size = Math.random() * 2 + 1;
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > this.height) p.y = 0;
        if (p.x > this.width) p.x = 0;
        if (p.x < 0) p.x = this.width;
      }
    });
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Clear Screen
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera Transform & Ken Burns Pan/Zoom
    ctx.translate(w / 2 + this.camera.x + this.camera.panX, h / 2 + this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-w / 2, -h / 2);

    // Render Scene Parallax Layers based on theme and location
    const theme = this.currentScene.theme;
    if (theme === 'cyberpunk') {
      this.renderCyberpunkBackdrop(ctx, w, h);
    } else if (theme === 'fantasy') {
      this.renderFantasyBackdrop(ctx, w, h);
    } else {
      this.renderVoidBackdrop(ctx, w, h);
    }

    // Render Atmospheric Light Beams & Searchlights
    this.renderSearchlights(ctx, w, h);

    // Render Foreground Scene Platform & Architecture
    this.renderStagePlatform(ctx, w, h);

    // Render Actors & Combatants
    this.renderActors(ctx, w, h);

    // Render Environmental Particles (Rain / Embers / Data motes)
    this.renderParticles(ctx, w, h);

    // Render Combat Action FX (Laser, Slash, EMP)
    this.renderActionFx(ctx, w, h);

    ctx.restore();

    // Render UI Overlays & Cinematic Letterbox Vignette
    this.renderCinematicFraming(ctx, w, h);
  }

  /* -------------------------------------------------------------
     PARALLAX BACKDROPS
  ------------------------------------------------------------- */
  renderCyberpunkBackdrop(ctx, w, h) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.5, '#0c1328');
    skyGrad.addColorStop(1, '#1b0e2b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant Neon Skyline (Layer 1)
    const t = this.camera.time;
    ctx.fillStyle = '#0b1626';
    for (let i = 0; i < 18; i++) {
      const bx = i * (w / 16) - 20;
      const bw = w / 18;
      const bh = 180 + Math.sin(i * 99) * 120;
      ctx.fillRect(bx, h - bh - 160, bw, bh + 160);
    }

    // Midground Megastructures & Hologram Billboards (Layer 2)
    for (let i = 0; i < 12; i++) {
      const bx = i * (w / 10) + 10;
      const bw = w / 13;
      const bh = 260 + Math.cos(i * 47) * 150;
      ctx.fillStyle = '#101e33';
      ctx.fillRect(bx, h - bh - 100, bw, bh + 100);

      // Window Grid Lights
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(79, 209, 197, 0.4)' : 'rgba(239, 106, 95, 0.4)';
      for (let wy = h - bh - 80; wy < h - 120; wy += 28) {
        if (Math.sin(wy + i + t) > 0.1) {
          ctx.fillRect(bx + 10, wy, bw - 20, 4);
        }
      }

      // Neon Hologram Billboard on select towers
      if (i === 3 || i === 8) {
        ctx.fillStyle = i === 3 ? 'rgba(79, 209, 197, 0.25)' : 'rgba(224, 172, 76, 0.25)';
        ctx.strokeStyle = i === 3 ? '#4fd1c5' : '#e0ac4c';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx - 15, h - bh - 160, 90, 40);
        ctx.fillRect(bx - 15, h - bh - 160, 90, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(i === 3 ? 'OBSIDIAN' : 'NEXUS-7', bx - 5, h - bh - 135);
      }
    }

    // Flying Vehicles / AVs in background
    ctx.fillStyle = 'rgba(79, 209, 197, 0.8)';
    const avX = (t * 80) % (w + 200) - 100;
    ctx.fillRect(avX, 220 + Math.sin(t) * 10, 24, 6);
    ctx.fillStyle = 'rgba(239, 106, 95, 0.9)';
    ctx.fillRect(avX - 4, 221 + Math.sin(t) * 10, 4, 4);
  }

  renderFantasyBackdrop(ctx, w, h) {
    // Dark Fantasy Sky with Blood Moon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a0505');
    skyGrad.addColorStop(0.6, '#1a0b0d');
    skyGrad.addColorStop(1, '#2c1410');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Eclipsed Blood Moon
    const moonX = w * 0.72;
    const moonY = h * 0.28;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 90);
    moonGrad.addColorStop(0, 'rgba(239, 106, 95, 0.9)');
    moonGrad.addColorStop(0.5, 'rgba(193, 84, 60, 0.4)');
    moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c1543c';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Gothic Spires & Mountain Ridges
    ctx.fillStyle = '#140c0b';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 60) {
      const spireH = 200 + Math.sin(x * 0.02) * 120 + ((x % 180 === 0) ? 140 : 0);
      ctx.lineTo(x, h - spireH - 60);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  }

  renderVoidBackdrop(ctx, w, h) {
    // Cosmic Void & Dying Star Singularity
    const skyGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.4, w * 0.7);
    skyGrad.addColorStop(0, '#2e1040');
    skyGrad.addColorStop(0.4, '#100820');
    skyGrad.addColorStop(1, '#030108');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Black Hole Accretion Disk
    const cx = w * 0.5;
    const cy = h * 0.35;
    const t = this.camera.time;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.2);

    const diskGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 160);
    diskGrad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
    diskGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
    diskGrad.addColorStop(0.8, 'rgba(244, 63, 94, 0.3)');
    diskGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 180, 45, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* -------------------------------------------------------------
     SEARCHLIGHTS & VOLUMETRIC LIGHTING
  ------------------------------------------------------------- */
  renderSearchlights(ctx, w, h) {
    this.lightBeams.forEach(b => {
      ctx.save();
      const originX = (Math.sin(b.angle) * 0.5 + 0.5) * w;
      const beamGrad = ctx.createLinearGradient(originX, 0, originX + Math.cos(b.angle) * 400, h);
      beamGrad.addColorStop(0, b.color);
      beamGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX + 250, h);
      ctx.lineTo(originX - 150, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  /* -------------------------------------------------------------
     FOREGROUND STAGE & PLATFORM
  ------------------------------------------------------------- */
  renderStagePlatform(ctx, w, h) {
    const platformY = h - 140;
    const platGrad = ctx.createLinearGradient(0, platformY, 0, h);
    platGrad.addColorStop(0, '#131b2c');
    platGrad.addColorStop(0.2, '#0c111c');
    platGrad.addColorStop(1, '#05070c');

    ctx.fillStyle = platGrad;
    ctx.fillRect(0, platformY, w, 140);

    // High-tech edge neon trim
    ctx.strokeStyle = this.currentScene.theme === 'fantasy' ? 'rgba(201, 161, 59, 0.6)' : 'rgba(79, 209, 197, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, platformY);
    ctx.lineTo(w, platformY);
    ctx.stroke();

    // Floor Perspective Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = -w * 0.5; x < w * 1.5; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, platformY);
      ctx.lineTo((x - w / 2) * 2.2 + w / 2, h);
      ctx.stroke();
    }
  }

  /* -------------------------------------------------------------
     ACTORS & FOE RENDERING (With Breathing & Combat Animation)
  ------------------------------------------------------------- */
  renderActors(ctx, w, h) {
    const groundY = h - 140;
    const t = this.camera.time;

    // 1. HERO OPERATIVE (Left Side)
    const heroX = w * 0.26;
    const heroBob = Math.sin(t * 3) * 5;
    const heroY = groundY - 110 + heroBob;

    // Hero Hologram Base Aura
    const auraGrad = ctx.createRadialGradient(heroX + 40, groundY - 10, 10, heroX + 40, groundY - 10, 80);
    auraGrad.addColorStop(0, 'rgba(79, 209, 197, 0.4)');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(heroX + 40, groundY - 5, 60, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hero Actor Card & Icon
    ctx.fillStyle = 'rgba(19, 27, 44, 0.85)';
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, heroX, heroY, 95, 115, 10);
    ctx.fill();
    ctx.stroke();

    // Hero Emoji / Portrait
    ctx.font = '48px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentScene.heroSprite || '🧑‍💻', heroX + 47, heroY + 62);

    // Hero Tag Badge
    ctx.fillStyle = '#4fd1c5';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(this.currentScene.heroName || 'OPERATIVE', heroX + 47, heroY + 98);

    // 2. ENEMY / NPC COMBATANT (Right Side)
    if (this.currentScene.enemyVisible) {
      const enemyX = w * 0.70;
      const enemyBob = Math.cos(t * 2.8) * 6;
      const enemyY = groundY - 110 + enemyBob;

      // Enemy Threat Aura
      const enemyAura = ctx.createRadialGradient(enemyX + 40, groundY - 10, 10, enemyX + 40, groundY - 10, 80);
      enemyAura.addColorStop(0, 'rgba(239, 106, 95, 0.4)');
      enemyAura.addColorStop(1, 'transparent');
      ctx.fillStyle = enemyAura;
      ctx.beginPath();
      ctx.ellipse(enemyX + 40, groundY - 5, 60, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Enemy Actor Card
      ctx.fillStyle = 'rgba(28, 18, 24, 0.85)';
      ctx.strokeStyle = '#ef6a5f';
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, enemyX, enemyY, 95, 115, 10);
      ctx.fill();
      ctx.stroke();

      // Enemy Portrait
      ctx.font = '48px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.currentScene.enemySprite || '🤖', enemyX + 47, enemyY + 62);

      // Enemy Tag Badge
      ctx.fillStyle = '#ef6a5f';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(this.currentScene.enemyName || 'TARGET', enemyX + 47, enemyY + 98);
    }
  }

  /* -------------------------------------------------------------
     PARTICLES
  ------------------------------------------------------------- */
  renderParticles(ctx, w, h) {
    const mood = this.currentScene.mood;
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      if (mood.includes('rain')) {
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + 12);
        ctx.stroke();
      } else if (mood.includes('embers') || mood.includes('fire')) {
        ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#4fd1c5';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /* -------------------------------------------------------------
     COMBAT ACTION VISUAL FX
  ------------------------------------------------------------- */
  renderActionFx(ctx, w, h) {
    const now = Date.now();

    // Laser Beam Flash FX
    if (this.laserFxTime && (now - this.laserFxTime < 240)) {
      const progress = (now - this.laserFxTime) / 240;
      ctx.save();
      ctx.strokeStyle = `rgba(79, 209, 197, ${1 - progress})`;
      ctx.lineWidth = 14 * (1 - progress);
      ctx.shadowColor = '#4fd1c5';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h - 200);
      ctx.lineTo(w * 0.72, h - 200);
      ctx.stroke();
      ctx.restore();
    }

    // Slash Arc FX
    if (this.slashFxTime && (now - this.slashFxTime < 240)) {
      const progress = (now - this.slashFxTime) / 240;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 106, 95, ${1 - progress})`;
      ctx.lineWidth = 10 * (1 - progress);
      ctx.shadowColor = '#ef6a5f';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(w * 0.72, h - 200, 60 * progress + 20, -0.8, 1.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* -------------------------------------------------------------
     CINEMATIC LETTERBOX & FRAMING
  ------------------------------------------------------------- */
  renderCinematicFraming(ctx, w, h) {
    // Top & Bottom Cinematic Letterbox Bars
    const barH = 36;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);

    // Location Header Tag in Top Bar
    ctx.fillStyle = '#4fd1c5';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`📍 SCENE // ${this.currentScene.locationName.toUpperCase()}`, 24, 23);

    // Live Subtitles Banner in Bottom Bar
    if (this.currentScene.subtitles) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'italic 13px "Fraunces", Georgia, serif';
      ctx.textAlign = 'center';
      const maxChars = 110;
      const subText = this.currentScene.subtitles.length > maxChars
        ? this.currentScene.subtitles.substring(0, maxChars) + '...'
        : this.currentScene.subtitles;
      ctx.fillText(`"${subText}"`, w / 2, h - 14);
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

window.CinemaEngine = CinemaEngine;
