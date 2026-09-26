/**
 * TYPE//TANK - 60 FPS Canvas 2D Defense Engine
 * Real-time ballistic physics, 180° servo turret rotation, lowest-first targeting,
 * particle explosions, recoil, tracer bullets, and perimeter defense simulation.
 */

class TankDefenseGame {
  constructor(canvasElement, onGameOverCallback, onStatsUpdateCallback) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.onGameOver = onGameOverCallback;
    this.onStatsUpdate = onStatsUpdateCallback;

    // Simulation State
    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;

    // Dimensions
    this.width = 800;
    this.height = 600;
    this.dpr = 1;

    // Arsenal Mode & Rules
    this.mode = 1;
    this.callsign = "OPERATOR";

    // Tank & Turret Physics
    this.tankX = 400;
    this.tankY = 550;
    this.turretBaseRadius = 28;
    this.barrelLength = 38;
    this.barrelWidth = 9;
    this.turretAngle = -Math.PI / 2; // -90 deg (pointing straight up)
    this.targetAngle = -Math.PI / 2;
    this.recoilOffset = 0;
    this.hull = 100; // 0 to 100
    this.isTankDestroyed = false;

    // Combat Entities
    this.words = [];
    this.bullets = [];
    this.particles = [];
    this.muzzleFlashes = [];
    this.lockedWord = null;

    // Game Performance & Stats
    this.score = 0;
    this.combo = 1.0;
    this.maxCombo = 1.0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.wordsDestroyed = 0;
    this.crimsonDestroyed = 0;
    this.startTime = 0;
    this.elapsedTime = 0; // seconds

    // Spawning & Difficulty
    this.spawnTimer = 0;
    this.spawnInterval = 2.4; // seconds
    this.baseSpeed = 28; // pixels per second
    this.bonusCounter = 0;

    // Screen Shake
    this.shakeIntensity = 0;

    // Grid Radar Sweep
    this.radarSweepY = 0;

    // Handle Bindings
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    // Initial resize calibration
    this.resize();
  }

  /**
   * Recalibrate canvas dimensions for device pixel ratio and container size
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Recalibrate tank anchor position at bottom-center
    this.tankX = this.width / 2;
    this.tankY = this.height - 35;
    this.perimeterY = this.height - 65;

    // Keep active words within boundary
    this.words.forEach(w => {
      w.x = Math.max(20, Math.min(this.width - w.width - 20, w.x));
    });
  }

  /**
   * Start a new combat sortie
   */
  start(mode = 1, callsign = "OPERATOR") {
    this.mode = mode;
    this.callsign = callsign;

    // Reset stats
    this.score = 0;
    this.combo = 1.0;
    this.maxCombo = 1.0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.wordsDestroyed = 0;
    this.crimsonDestroyed = 0;
    this.hull = 100;
    this.isTankDestroyed = false;
    this.startTime = performance.now();
    this.elapsedTime = 0;

    // Reset entities
    this.words = [];
    this.bullets = [];
    this.particles = [];
    this.muzzleFlashes = [];
    this.lockedWord = null;

    // Reset turret
    this.turretAngle = -Math.PI / 2;
    this.targetAngle = -Math.PI / 2;
    this.recoilOffset = 0;

    // Reset difficulty timers
    this.spawnTimer = 0.5; // first word spawns quickly
    this.spawnInterval = 2.5;
    this.baseSpeed = 30;
    this.bonusCounter = 0;

    this.isRunning = true;
    this.isPaused = false;

    this.resize();

    // Listen to keydown
    window.addEventListener("keydown", this.handleKeydown);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);

    this.notifyStats();
  }

  /**
   * Pause combat sortie
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume combat sortie
   */
  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.lastFrameTime = performance.now();
    }
  }

  /**
   * Stop / abort combat sortie
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener("keydown", this.handleKeydown);
  }

  /**
   * Calculate live metrics
   */
  getLiveStats() {
    const elapsedMinutes = Math.max(this.elapsedTime / 60, 0.05);
    // Standard WPM: (characters typed / 5) / minutes
    const wpm = Math.round((this.correctKeystrokes / 5) / elapsedMinutes);
    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    return {
      score: this.score,
      combo: parseFloat(this.combo.toFixed(1)),
      maxCombo: parseFloat(this.maxCombo.toFixed(1)),
      wpm,
      accuracy,
      hull: Math.max(0, Math.round(this.hull)),
      wordsDestroyed: this.wordsDestroyed,
      crimsonDestroyed: this.crimsonDestroyed,
      survivalTimeSec: Math.floor(this.elapsedTime),
      mode: this.mode,
      callsign: this.callsign
    };
  }

  notifyStats() {
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getLiveStats());
    }
  }

  /**
   * Handle Keystroke Targeting & Firing
   */
  handleKeydown(e) {
    if (!this.isRunning || this.isPaused || this.isTankDestroyed) return;

    // Ignore modifier keys, tab, arrows, escape, etc.
    if (e.key === "Escape") {
      // Abort is handled by app.js
      return;
    }

    if (e.key.length !== 1 && e.key !== "Backspace") {
      return;
    }

    // Prevent default scrolling for Space / special keys during combat
    if (e.key === " " || e.key === "Backspace") {
      e.preventDefault();
    }

    const key = e.key;

    // Record total keystrokes for accuracy
    this.totalKeystrokes++;

    // 1. If currently locked onto a word
    if (this.lockedWord && !this.lockedWord.destroyed && this.lockedWord.y < this.perimeterY) {
      const expectedChar = this.lockedWord.text[this.lockedWord.typedIndex];

      if (key === expectedChar) {
        // HIT ON LOCKED WORD
        this.processHit(this.lockedWord);
      } else {
        // MISS ON LOCKED WORD
        this.processMiss(this.lockedWord);
      }
      return;
    }

    // 2. If NOT currently locked: find all active words starting with this key
    const matchingWords = this.words.filter(w =>
      !w.destroyed &&
      w.y < this.perimeterY &&
      w.typedIndex === 0 &&
      w.text[0] === key
    );

    if (matchingWords.length > 0) {
      // REQUIREMENT: If multiple visible words match, automatically target the LOWEST / BOTTOM-MOST (highest Y)
      matchingWords.sort((a, b) => b.y - a.y);
      const chosenTarget = matchingWords[0];

      // Lock onto this word!
      this.lockedWord = chosenTarget;
      this.processHit(chosenTarget);
    } else {
      // Total miss - no matching target
      this.processMiss(null);
    }
  }

  /**
   * Process a successful character hit
   */
  processHit(word) {
    this.correctKeystrokes++;
    const charIndex = word.typedIndex;
    const isLastChar = charIndex + 1 >= word.text.length;

    // Calculate exact target coordinate of this specific letter
    const charCoord = this.getCharCoordinate(word, charIndex);

    // Turn turret towards target
    this.aimTurretAt(charCoord.x, charCoord.y);

    // Fire visible ballistic bullet & muzzle flash
    this.fireBullet(charCoord.x, charCoord.y, word.isBonus);

    // Audio SFX
    window.RetroAudio.playLaserShot();

    // Advance typed index (fades this letter to ~35-40% opacity in render)
    word.typedIndex++;

    // Increment combo
    this.combo = Math.min(5.0, this.combo + 0.1);
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Points for individual letter hit
    const letterPoints = Math.round(15 * this.combo * (word.isBonus ? 3.5 : 1));
    this.score += letterPoints;

    // Check if word completed and destroyed!
    if (isLastChar) {
      this.destroyWord(word);
    }

    this.notifyStats();
  }

  /**
   * Process a typing error / miss
   */
  processMiss(targetWord) {
    window.RetroAudio.playErrorBuzz();
    // Reset combo
    this.combo = 1.0;

    // Small word shake if locked
    if (targetWord) {
      targetWord.shakeTimer = 0.2;
    }

    this.notifyStats();
  }

  /**
   * Fully neutralize / eliminate a word
   */
  destroyWord(word) {
    word.destroyed = true;
    this.wordsDestroyed++;
    if (word.isBonus) {
      this.crimsonDestroyed++;
      // Resolve crimson target in WordManager to start 3-second cooldown window
      window.WordManager.resolveCrimson(word.text[0]);
    }

    // Heavy explosion points
    const baseWordPoints = word.text.length * 60;
    const bonusMultiplier = word.isBonus ? 3.5 : 1.0;
    const totalWordScore = Math.round(baseWordPoints * this.combo * bonusMultiplier);
    this.score += totalWordScore;

    // Audio
    window.RetroAudio.playWordExplosion(word.isBonus);

    // Particle explosion at word location
    this.spawnWordExplosion(word.x + word.width / 2, word.y, word.isBonus, word.text);

    // Release target lock
    if (this.lockedWord === word) {
      this.lockedWord = null;
    }

    // Remove word from active list
    this.words = this.words.filter(w => w !== word);

    this.notifyStats();
  }

  /**
   * Calculate precise coordinate of a character in a word
   */
  getCharCoordinate(word, charIdx) {
    const charWidth = 14; // Approximate monospace width
    const startX = word.x + 8;
    const targetX = startX + (charIdx * charWidth) + (charWidth / 2);
    const targetY = word.y;
    return { x: targetX, y: targetY };
  }

  /**
   * Aim turret smoothly towards target coordinate (clamped to 180° upper semicircle)
   */
  aimTurretAt(x, y) {
    const dx = x - this.tankX;
    const dy = y - this.tankY;
    let angle = Math.atan2(dy, dx);

    // Clamp angle to upper 180° arc: from -Math.PI (left horizontal) to 0 (right horizontal)
    if (angle > 0) {
      // If below horizon, clamp to closest horizontal
      angle = dx < 0 ? -Math.PI : 0;
    }

    this.targetAngle = angle;
  }

  /**
   * Fire a ballistic bullet projectile towards coordinates
   */
  fireBullet(targetX, targetY, isBonus = false) {
    // Recoil kick
    this.recoilOffset = 7;

    // Calculate muzzle tip position
    const muzzleX = this.tankX + Math.cos(this.turretAngle) * (this.barrelLength + 6);
    const muzzleY = this.tankY + Math.sin(this.turretAngle) * (this.barrelLength + 6);

    // Muzzle flash particle burst
    this.muzzleFlashes.push({
      x: muzzleX,
      y: muzzleY,
      angle: this.turretAngle,
      life: 0.1,
      maxLife: 0.1
    });

    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 80;
      this.particles.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(this.turretAngle + spread) * speed,
        vy: Math.sin(this.turretAngle + spread) * speed,
        life: 0.15,
        maxLife: 0.15,
        color: "#ffffff",
        size: 2.5
      });
    }

    // Ballistic bullet projectile
    const dx = targetX - muzzleX;
    const dy = targetY - muzzleY;
    const dist = Math.hypot(dx, dy);
    const speed = 900; // px/sec

    this.bullets.push({
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      targetX,
      targetY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      distRemaining: dist,
      color: isBonus ? "#ff3355" : "#33ff66",
      isBonus
    });
  }

  /**
   * Spawn particle debris explosion for destroyed words
   */
  spawnWordExplosion(x, y, isBonus = false, text = "") {
    const particleCount = isBonus ? 45 : 28;
    const primaryColor = isBonus ? "#ff2244" : "#33ff66";
    const secondaryColor = "#ffffff";

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * (isBonus ? 240 : 160);
      const life = 0.4 + Math.random() * 0.4;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.94,
        gravity: 120,
        life,
        maxLife: life,
        color: Math.random() > 0.4 ? primaryColor : secondaryColor,
        size: 2 + Math.random() * 3
      });
    }

    // Expanding shockwave ring
    this.particles.push({
      x,
      y,
      radius: 4,
      maxRadius: isBonus ? 50 : 32,
      isRing: true,
      color: primaryColor,
      life: 0.35,
      maxLife: 0.35
    });
  }

  /**
   * Perimeter breach explosion and hull damage
   */
  triggerBreach(word) {
    const isBonus = word.isBonus;
    const damage = isBonus ? 30 : 20;

    this.hull = Math.max(0, this.hull - damage);
    this.combo = 1.0;
    this.shakeIntensity = isBonus ? 20 : 12;

    window.RetroAudio.playDamageCrunch(isBonus);

    // Particle explosion at perimeter line
    for (let i = 0; i < 35; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      const speed = 80 + Math.random() * 200;
      const life = 0.5 + Math.random() * 0.4;

      this.particles.push({
        x: word.x + word.width / 2,
        y: this.perimeterY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.95,
        gravity: 200,
        life,
        maxLife: life,
        color: Math.random() > 0.5 ? "#ff3344" : "#ffaa00",
        size: 3 + Math.random() * 3
      });
    }

    if (this.lockedWord === word) {
      this.lockedWord = null;
    }

    if (isBonus) {
      window.WordManager.resolveCrimson(word.text[0]);
    }

    this.words = this.words.filter(w => w !== word);
    this.notifyStats();

    // Check tank destruction
    if (this.hull <= 0 && !this.isTankDestroyed) {
      this.destroyTank();
    }
  }

  /**
   * Tank destruction sequence
   */
  destroyTank() {
    this.isTankDestroyed = true;
    this.hull = 0;
    this.shakeIntensity = 25;

    // Multiple staggered explosions on tank chassis
    for (let j = 0; j < 5; j++) {
      setTimeout(() => {
        if (!this.isRunning) return;
        window.RetroAudio.playDamageCrunch(true);
        window.RetroAudio.playWordExplosion(true);
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 60 + Math.random() * 260;
          const life = 0.6 + Math.random() * 0.6;
          this.particles.push({
            x: this.tankX + (Math.random() - 0.5) * 50,
            y: this.tankY + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 60,
            drag: 0.96,
            gravity: 160,
            life,
            maxLife: life,
            color: ["#ff0033", "#ff7700", "#ffff00", "#33ff66"][Math.floor(Math.random() * 4)],
            size: 3 + Math.random() * 4
          });
        }
      }, j * 220);
    }

    // Transition to debrief after explosions conclude
    setTimeout(() => {
      this.stop();
      if (this.onGameOver) {
        this.onGameOver(this.getLiveStats());
      }
    }, 1500);
  }

  /**
   * Spawning mechanism with red bonus rules and exclusion windows
   */
  spawnWord(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    // Progressive spawn interval: starts at 2.5s, speeds up down to 1.1s
    const speedUp = Math.min(1.4, (this.elapsedTime * 0.015) + (this.wordsDestroyed * 0.02));
    this.spawnInterval = Math.max(1.1, 2.5 - speedUp);
    this.spawnTimer = this.spawnInterval;

    // Check if Crimson Bonus Word should spawn
    this.bonusCounter++;
    const activeBonus = this.words.some(w => w.isBonus && !w.destroyed);
    let shouldSpawnBonus = !activeBonus && this.bonusCounter >= 8 && Math.random() < 0.6;

    if (shouldSpawnBonus) {
      this.bonusCounter = 0;
    }

    // Get currently active first characters
    const activeFirstChars = this.words.map(w => w.text[0]);

    // Request word from WordManager
    const text = window.WordManager.getRandomWord(this.mode, activeFirstChars, shouldSpawnBonus);
    if (!text) return;

    if (shouldSpawnBonus) {
      // Mark active crimson starting character
      window.WordManager.setActiveCrimson(text[0]);
      window.RetroAudio.playCrimsonSpawnChime();
    }

    // Measure approximate word width
    const wordWidth = text.length * 14 + 16;
    const padding = 25;
    const minX = padding;
    const maxX = Math.max(minX, this.width - wordWidth - padding);
    const posX = minX + Math.random() * (maxX - minX);

    // Speed: bonus words fall ~1.6x faster
    const currentSpeed = (this.baseSpeed + (this.elapsedTime * 0.5) + (this.wordsDestroyed * 0.35)) * (shouldSpawnBonus ? 1.6 : 1.0);

    const wordObj = {
      text,
      typedIndex: 0,
      x: posX,
      y: -20,
      width: wordWidth,
      height: 24,
      speed: currentSpeed,
      isBonus: shouldSpawnBonus,
      destroyed: false,
      shakeTimer: 0
    };

    this.words.push(wordObj);
  }

  /**
   * Main 60 FPS Update & Render Loop
   */
  loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = timestamp;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Update Physics & Logic
   */
  update(dt) {
    this.elapsedTime += dt;

    // Recoil spring recovery
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 35);
    }

    // Smooth turret angle servo interpolation (lerp)
    let angleDiff = this.targetAngle - this.turretAngle;
    // Normalize to -PI to PI
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.turretAngle += angleDiff * Math.min(1.0, dt * 14);

    // Update screen shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    }

    // Update radar sweep line
    this.radarSweepY = (this.radarSweepY + dt * 120) % (this.height - 70);

    // Spawning
    if (!this.isTankDestroyed) {
      this.spawnWord(dt);
    }

    // Update words
    for (let i = this.words.length - 1; i >= 0; i--) {
      const w = this.words[i];
      w.y += w.speed * dt;

      if (w.shakeTimer > 0) {
        w.shakeTimer = Math.max(0, w.shakeTimer - dt);
      }

      // Check perimeter breach
      if (w.y >= this.perimeterY) {
        this.triggerBreach(w);
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.prevX = b.x;
      b.prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const stepDist = Math.hypot(b.vx * dt, b.vy * dt);
      b.distRemaining -= stepDist;

      // Bullet reached target character!
      if (b.distRemaining <= 0) {
        // Impact sparks
        for (let s = 0; s < 7; s++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 40 + Math.random() * 80;
          this.particles.push({
            x: b.targetX,
            y: b.targetY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            drag: 0.9,
            gravity: 60,
            life: 0.15,
            maxLife: 0.15,
            color: b.color,
            size: 2
          });
        }
        this.bullets.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isRing) {
        p.radius += ((p.maxRadius - p.radius) * dt * 10);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.drag) {
          p.vx *= Math.pow(p.drag, dt * 60);
          p.vy *= Math.pow(p.drag, dt * 60);
        }
        if (p.gravity) {
          p.vy += p.gravity * dt;
        }
      }
    }

    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.life -= dt;
      if (mf.life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  /**
   * Render Canvas 2D
   */
  render() {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // Clear background with deep dark-green CRT cathode base
    ctx.fillStyle = "#020603";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Tactical Grid
    this.renderTacticalGrid(ctx);

    // Draw Perimeter Defense Line
    this.renderPerimeter(ctx);

    // Draw Falling Words
    this.renderWords(ctx);

    // Draw Projectile Bullets & Tracers
    this.renderBullets(ctx);

    // Draw Particles & Explosions
    this.renderParticles(ctx);

    // Draw Muzzle Flashes
    this.renderMuzzleFlashes(ctx);

    // Draw Tank & 180° Turret
    this.renderTank(ctx);

    ctx.restore();
  }

  /**
   * Render military tactical radar grid
   */
  renderTacticalGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(10, 45, 18, 0.4)";
    ctx.lineWidth = 1;

    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.perimeterY);
      ctx.stroke();
    }

    for (let y = 0; y < this.perimeterY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Subtle radar sweep beam
    const gradient = ctx.createLinearGradient(0, this.radarSweepY - 25, 0, this.radarSweepY);
    gradient.addColorStop(0, "rgba(51, 255, 102, 0)");
    gradient.addColorStop(1, "rgba(51, 255, 102, 0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, Math.max(0, this.radarSweepY - 25), this.width, 25);

    ctx.restore();
  }

  /**
   * Render glowing perimeter defense barrier
   */
  renderPerimeter(ctx) {
    ctx.save();
    const y = this.perimeterY;

    // Glowing laser barrier
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.hull > 25 ? "#33ff66" : "#ff3344";
    ctx.strokeStyle = this.hull > 25 ? "rgba(51, 255, 102, 0.85)" : "rgba(255, 51, 68, 0.9)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();

    // Defense Line Label
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.font = "9px 'Press Start 2P', monospace, sans-serif";
    ctx.fillStyle = this.hull > 25 ? "rgba(51, 255, 102, 0.5)" : "rgba(255, 51, 68, 0.7)";
    ctx.fillText("/// DEFENSE PERIMETER SHIELD ///", 20, y - 6);

    ctx.restore();
  }

  /**
   * Render falling words with character fade effect and targeting reticles
   */
  renderWords(ctx) {
    ctx.save();
    ctx.font = "14px 'Share Tech Mono', 'Press Start 2P', monospace";
    ctx.textBaseline = "middle";

    for (let i = 0; i < this.words.length; i++) {
      const w = this.words[i];
      if (w.destroyed) continue;

      const isLocked = this.lockedWord === w;
      let renderX = w.x;
      let renderY = w.y;

      if (w.shakeTimer > 0) {
        renderX += (Math.random() - 0.5) * 6;
      }

      // Background HUD Tag
      const bgHeight = 24;
      const bgPadding = 6;
      ctx.fillStyle = w.isBonus ? "rgba(50, 0, 10, 0.85)" : (isLocked ? "rgba(0, 30, 10, 0.9)" : "rgba(0, 15, 5, 0.75)");
      ctx.strokeStyle = w.isBonus ? "#ff2244" : (isLocked ? "#33ff66" : "rgba(51, 255, 102, 0.4)");
      ctx.lineWidth = isLocked ? 2 : 1;

      if (isLocked) {
        ctx.shadowBlur = w.isBonus ? 12 : 8;
        ctx.shadowColor = w.isBonus ? "#ff0033" : "#33ff66";
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(renderX - bgPadding, renderY - bgHeight / 2, w.width + bgPadding * 2, bgHeight);
      ctx.strokeRect(renderX - bgPadding, renderY - bgHeight / 2, w.width + bgPadding * 2, bgHeight);

      // Crimson Bonus Tag
      if (w.isBonus) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#ff0033";
        ctx.fillStyle = "#ff2244";
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillText("▲ 3.5x CRIMSON ▲", renderX, renderY - 18);
        ctx.font = "14px 'Share Tech Mono', 'Press Start 2P', monospace";
      }

      // Render Individual Characters
      const charWidth = 14;
      let curX = renderX + 4;

      for (let c = 0; c < w.text.length; c++) {
        const char = w.text[c];

        if (c < w.typedIndex) {
          // REQUIREMENT: Typed characters immediately drop to ~35-40% opacity!
          ctx.fillStyle = w.isBonus ? "rgba(255, 50, 70, 0.38)" : "rgba(51, 255, 102, 0.38)";
          ctx.shadowBlur = 0;
        } else if (c === w.typedIndex && isLocked) {
          // ACTIVE TARGETED CHARACTER: Crisp with glowing reticle / cursor underline
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 10;
          ctx.shadowColor = w.isBonus ? "#ff2244" : "#33ff66";

          // Pulsating cursor underline
          const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(curX, renderY + 8, charWidth - 2, 2.5);
        } else {
          // UNTYPED CHARACTERS: Crisp green or crimson
          ctx.fillStyle = w.isBonus ? "#ff3355" : "#33ff66";
          ctx.shadowBlur = w.isBonus ? 6 : 4;
          ctx.shadowColor = w.isBonus ? "#ff0033" : "#33ff66";
        }

        ctx.fillText(char, curX, renderY);
        curX += charWidth;
      }

      // Draw Reticle Brackets if currently locked target
      if (isLocked) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = w.isBonus ? "#ff2244" : "#33ff66";
        ctx.strokeStyle = w.isBonus ? "#ff2244" : "#33ff66";
        ctx.lineWidth = 2;

        const bSize = 6;
        const bLeft = renderX - bgPadding - 3;
        const bRight = renderX + w.width + bgPadding + 3;
        const bTop = renderY - bgHeight / 2 - 3;
        const bBottom = renderY + bgHeight / 2 + 3;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bLeft, bTop + bSize);
        ctx.lineTo(bLeft, bTop);
        ctx.lineTo(bLeft + bSize, bTop);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bRight - bSize, bTop);
        ctx.lineTo(bRight, bTop);
        ctx.lineTo(bRight, bTop + bSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bLeft, bBottom - bSize);
        ctx.lineTo(bLeft, bBottom);
        ctx.lineTo(bLeft + bSize, bBottom);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bRight - bSize, bBottom);
        ctx.lineTo(bRight, bBottom);
        ctx.lineTo(bRight, bBottom - bSize);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Render projectile bullets and high-velocity tracers
   */
  renderBullets(ctx) {
    ctx.save();
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];

      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;

      // Ballistic tracer line
      ctx.beginPath();
      ctx.moveTo(b.prevX, b.prevY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Projectile head
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render particles and shockwaves
   */
  renderParticles(ctx) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.globalAlpha = alpha;

      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Render muzzle flashes
   */
  renderMuzzleFlashes(ctx) {
    ctx.save();
    for (let i = 0; i < this.muzzleFlashes.length; i++) {
      const mf = this.muzzleFlashes[i];
      const alpha = mf.life / mf.maxLife;
      ctx.globalAlpha = alpha;

      ctx.save();
      ctx.translate(mf.x, mf.y);
      ctx.rotate(mf.angle);

      // Bright yellow/white flame oval
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#33ff66";
      ctx.beginPath();
      ctx.ellipse(8, 0, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Render Semicircular Tank & 180° Rotating Turret
   */
  renderTank(ctx) {
    ctx.save();
    const x = this.tankX;
    const y = this.tankY;

    // 1. Tread Chassis Base
    const chassisWidth = 84;
    const chassisHeight = 22;
    const treadX = x - chassisWidth / 2;
    const treadY = y + 10;

    // Tread housing
    ctx.fillStyle = "#0d2612";
    ctx.strokeStyle = "#33ff66";
    ctx.lineWidth = 2;
    ctx.strokeRect(treadX, treadY, chassisWidth, chassisHeight);
    ctx.fillRect(treadX, treadY, chassisWidth, chassisHeight);

    // Tread roller segments
    const segmentCount = 6;
    const segWidth = chassisWidth / segmentCount;
    ctx.strokeStyle = "rgba(51, 255, 102, 0.4)";
    ctx.lineWidth = 1.5;
    for (let s = 1; s < segmentCount; s++) {
      ctx.beginPath();
      ctx.moveTo(treadX + s * segWidth, treadY);
      ctx.lineTo(treadX + s * segWidth, treadY + chassisHeight);
      ctx.stroke();

      // Wheel hub
      ctx.fillStyle = "#041407";
      ctx.beginPath();
      ctx.arc(treadX + s * segWidth - segWidth / 2, treadY + chassisHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. Armor Glacis Plate
    ctx.fillStyle = "#123b1a";
    ctx.strokeStyle = "#33ff66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 34, treadY);
    ctx.lineTo(x - 26, y + 2);
    ctx.lineTo(x + 26, y + 2);
    ctx.lineTo(x + 34, treadY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Rotating 180° Turret Cannon Barrel (Behind Dome)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.turretAngle);

    // Apply recoil pushback along barrel axis
    const effectiveBarrelLength = this.barrelLength - this.recoilOffset;

    // Barrel body
    ctx.fillStyle = "#1b4d24";
    ctx.strokeStyle = "#33ff66";
    ctx.lineWidth = 2;
    ctx.fillRect(0, -this.barrelWidth / 2, effectiveBarrelLength, this.barrelWidth);
    ctx.strokeRect(0, -this.barrelWidth / 2, effectiveBarrelLength, this.barrelWidth);

    // Muzzle brake tip
    const brakeWidth = this.barrelWidth + 4;
    ctx.fillStyle = "#0a2610";
    ctx.fillRect(effectiveBarrelLength - 5, -brakeWidth / 2, 6, brakeWidth);
    ctx.strokeRect(effectiveBarrelLength - 5, -brakeWidth / 2, 6, brakeWidth);

    ctx.restore();

    // 4. Semicircular Dome Turret
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#33ff66";

    // Turret Dome base
    ctx.fillStyle = "#14401c";
    ctx.strokeStyle = "#33ff66";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Upper semicircle
    ctx.arc(x, y + 6, this.turretBaseRadius, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Turret Core Ring
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.hull > 25 ? "#33ff66" : "#ff3344";
    ctx.beginPath();
    ctx.arc(x, y + 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Turret armor bolts
    ctx.fillStyle = "#06170a";
    for (let a = Math.PI + 0.3; a <= Math.PI * 2 - 0.3; a += 0.5) {
      const bx = x + Math.cos(a) * (this.turretBaseRadius - 5);
      const by = y + 6 + Math.sin(a) * (this.turretBaseRadius - 5);
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }
}

// Global export for vanilla JS
window.TankDefenseGame = TankDefenseGame;
