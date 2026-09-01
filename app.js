/**
 * App.js - Nexus Chronicle 2.0 Master Application Controller
 * Orchestrates CinemaEngine, StoryEngine, Procedural AudioSynth,
 * Turn-Based Combat, Cyber Hacking, World Map, and UI/UX state.
 */
document.addEventListener('DOMContentLoaded', () => {
  const engine = window.storyEngine;
  const audio = window.audioSynth;
  let cinema = null;

  // Initialize Cinema Visual Engine
  if (document.getElementById('cinema-canvas') && window.CinemaEngine) {
    cinema = new window.CinemaEngine('cinema-canvas');
    window.cinemaEngine = cinema;
  }

  // DOM Elements
  const bgCanvas = document.getElementById('bg-canvas');
  const storyLogEl = document.getElementById('story-log');
  const storyChoicesEl = document.getElementById('story-choices');
  const diceModal = document.getElementById('dice-modal');
  const diceValEl = document.getElementById('dice-value');
  const diceTitleEl = document.getElementById('dice-title');
  const diceSubEl = document.getElementById('dice-subtitle');
  const diceConfirmBtn = document.getElementById('dice-confirm-btn');
  const toastContainer = document.getElementById('toast-container');
  const resetRunBtn = document.getElementById('reset-run-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const autoplayBtn = document.getElementById('autoplay-btn');

  // Scene & Header Elements
  const sceneLocationText = document.getElementById('scene-location-text');
  const cinemaObjectiveText = document.getElementById('cinema-objective-text');
  const speakerAvatarIcon = document.getElementById('speaker-avatar-icon');
  const storySpeakerName = document.getElementById('story-speaker-name');
  const customPromptInput = document.getElementById('custom-prompt-input');
  const sendPromptBtn = document.getElementById('send-prompt-btn');
  const exportStoryBtn = document.getElementById('export-story-btn');

  // Dossier Quick Stats Elements
  const charNameEl = document.getElementById('char-name');
  const charClassEl = document.getElementById('char-class');
  const charLevelEl = document.getElementById('char-level');
  const dossierAvatarIcon = document.getElementById('dossier-avatar-icon');
  const hpFillEl = document.getElementById('hp-fill');
  const hpTextEl = document.getElementById('hp-text');
  const energyFillEl = document.getElementById('energy-fill');
  const energyTextEl = document.getElementById('energy-text');
  const sanityFillEl = document.getElementById('sanity-fill');
  const sanityTextEl = document.getElementById('sanity-text');

  // Combat HUD Elements
  const combatOverlay = document.getElementById('combat-overlay');
  const combatHeroName = document.getElementById('combat-hero-name');
  const combatHeroHpFill = document.getElementById('combat-hero-hp-fill');
  const combatHeroHpText = document.getElementById('combat-hero-hp-text');
  const combatEnemyName = document.getElementById('combat-enemy-name');
  const combatEnemyHpFill = document.getElementById('combat-enemy-hp-fill');
  const combatEnemyHpText = document.getElementById('combat-enemy-hp-text');

  // Hacking HUD Elements
  const hackOverlay = document.getElementById('hack-overlay');
  const hackTargetTitle = document.getElementById('hack-target-title');
  const hackTurnsBadge = document.getElementById('hack-turns-badge');
  const hackGridContainer = document.getElementById('hack-grid-container');

  // State
  let activeTab = 'cinema-hub';
  let isAutoPlay = false;
  let autoPlayTimer = null;
  let typewriterInterval = null;
  let pendingDiceRoll = null;

  /* -------------------------------------------------------------
     1. TOAST NOTIFICATIONS
  ------------------------------------------------------------- */
  function showToast(message, icon = '✨') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  /* -------------------------------------------------------------
     2. BACKGROUND CURSOR PARTICLES
  ------------------------------------------------------------- */
  function initParticleCanvas() {
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    let width = bgCanvas.width = window.innerWidth;
    let height = bgCanvas.height = window.innerHeight;
    let mouse = { x: width / 2, y: height / 2 };

    window.addEventListener('resize', () => {
      width = bgCanvas.width = window.innerWidth;
      height = bgCanvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    }));

    function render() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= (dx / dist) * 1.5;
          p.y -= (dy / dist) * 1.5;
        }

        ctx.fillStyle = `rgba(79, 209, 197, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(render);
    }
    render();
  }

  /* -------------------------------------------------------------
     3. CHAPTER TRANSITION & STORY LOG RENDERING
  ------------------------------------------------------------- */
  function loadChapter(chapterId) {
    engine.currentChapterId = chapterId;
    const chapter = engine.getChapter(chapterId);
    const scenario = engine.getScenario();
    const hero = engine.character;

    // 1. Update Cinema Visual Viewport
    if (cinema) {
      cinema.setScene({
        theme: engine.currentScenarioKey,
        locationId: chapter.nodeId || 'start',
        locationName: chapter.location || 'Unknown Sector',
        mood: chapter.mood || 'stealth_rain',
        heroSprite: hero.avatar || '🧑‍💻',
        heroName: hero.name || 'Operative',
        enemySprite: chapter.enemySprite || '🤖',
        enemyName: chapter.enemyName || 'Target Hostile',
        enemyVisible: !!chapter.enemySprite,
        subtitles: chapter.text
      });
    }

    // 2. Update Header & Objective Bars
    if (sceneLocationText) sceneLocationText.textContent = chapter.location || 'Unknown Location';
    if (cinemaObjectiveText) cinemaObjectiveText.textContent = chapter.objective || scenario.initialObjective;
    if (storySpeakerName) storySpeakerName.textContent = chapter.speaker || 'Narrator';
    if (speakerAvatarIcon) speakerAvatarIcon.textContent = chapter.enemySprite || '🎙️';

    // 3. Process Rewards / Stat Deltas
    if (chapter.rewards) {
      if (chapter.rewards.xp) {
        hero.xp += chapter.rewards.xp;
        showToast(`+${chapter.rewards.xp} XP Gained!`, '⭐');
      }
      if (chapter.rewards.hpDelta) {
        hero.hp = Math.max(0, Math.min(hero.maxHp, hero.hp + chapter.rewards.hpDelta));
        showToast(`${chapter.rewards.hpDelta > 0 ? '+' : ''}${chapter.rewards.hpDelta} HP`, '❤️');
      }
      if (chapter.rewards.energyDelta) {
        hero.energy = Math.max(0, Math.min(hero.maxEnergy, hero.energy + chapter.rewards.energyDelta));
      }
      if (chapter.rewards.sanityDelta) {
        hero.sanity = Math.max(0, Math.min(hero.maxSanity, hero.sanity + chapter.rewards.sanityDelta));
      }
    }

    // 4. Update Quick Dossier HUD
    updateCharacterUI();

    // 5. Render Story Bubble with Typewriter
    renderStoryBubble(chapter);

    // 6. Check for Combat or Hacking Mini-Games
    if (chapter.action === 'start_combat' && chapter.enemy) {
      initiateCombat(chapter.enemy, chapter.next, chapter.failNext);
    } else if (chapter.action === 'start_hack') {
      initiateHacking(chapter.targetName, chapter.difficulty, chapter.next, chapter.failNext);
    } else {
      if (combatOverlay) combatOverlay.style.display = 'none';
      if (hackOverlay) hackOverlay.style.display = 'none';
      renderChoices(chapter.choices || []);
    }

    // 7. Auto-play handling if active
    if (isAutoPlay && chapter.choices && chapter.choices.length > 0) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = setTimeout(() => {
        const autoChoice = chapter.choices[0];
        handleChoiceClick(autoChoice);
      }, 5000);
    }
  }

  function renderStoryBubble(chapter) {
    if (!storyLogEl) return;

    const bubble = document.createElement('div');
    bubble.className = 'story-bubble';
    bubble.innerHTML = `
      <div class="story-bubble-loc">📍 ${chapter.location.toUpperCase()}</div>
      <div class="story-bubble-text"></div>
    `;
    storyLogEl.appendChild(bubble);
    storyLogEl.scrollTop = storyLogEl.scrollHeight;

    const textEl = bubble.querySelector('.story-bubble-text');
    const fullText = chapter.text;
    let charIdx = 0;

    if (typewriterInterval) clearInterval(typewriterInterval);

    typewriterInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        textEl.textContent += fullText[charIdx];
        if (charIdx % 3 === 0 && audio) audio.playTypewriter();
        charIdx++;
        storyLogEl.scrollTop = storyLogEl.scrollHeight;
      } else {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
      }
    }, 14);
  }

  /* -------------------------------------------------------------
     4. DECISION MATRIX & CHOICES
  ------------------------------------------------------------- */
  function renderChoices(choices) {
    if (!storyChoicesEl) return;
    storyChoicesEl.innerHTML = '';

    if (!choices || choices.length === 0) {
      const restartBtn = document.createElement('button');
      restartBtn.className = 'choice-action-card';
      restartBtn.innerHTML = `<span>🔄 Start New Adventure</span>`;
      restartBtn.addEventListener('click', () => {
        engine.resetRun();
        loadChapter('start');
      });
      storyChoicesEl.appendChild(restartBtn);
      return;
    }

    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-action-card';

      let reqBadgeHtml = '';
      if (c.reqAttr) {
        reqBadgeHtml = `<span class="choice-req-badge">🎲 ${c.reqAttr} Check (DC ${c.diff})</span>`;
      } else if (c.itemReq) {
        reqBadgeHtml = `<span class="choice-req-badge" style="color:var(--accent-cyan);">📦 Req Item</span>`;
      } else if (c.action === 'start_combat') {
        reqBadgeHtml = `<span class="choice-req-badge" style="color:var(--accent-red);">⚔️ Combat Encounter</span>`;
      } else if (c.action === 'start_hack') {
        reqBadgeHtml = `<span class="choice-req-badge" style="color:var(--primary);">💻 Cyber ICE Breach</span>`;
      }

      btn.innerHTML = `<span>${c.text}</span> ${reqBadgeHtml}`;
      btn.addEventListener('click', () => handleChoiceClick(c));
      btn.addEventListener('mouseenter', () => audio && audio.playHover());
      storyChoicesEl.appendChild(btn);
    });
  }

  function handleChoiceClick(choice) {
    if (audio) audio.playClick();

    // Check if choice requires an item in inventory
    if (choice.itemReq) {
      const hasItem = engine.character.inventory.some(i => i.id === choice.itemReq && i.qty > 0);
      if (!hasItem) {
        showToast('Required item is not in your backpack!', '⚠️');
        if (audio) audio.playFailure();
        return;
      }
    }

    // Check for d20 Dice Skill Check
    if (choice.reqAttr && choice.diff) {
      triggerDiceModal(choice);
      return;
    }

    // Mini-Game Actions
    if (choice.action === 'start_combat') {
      initiateCombat(choice.enemy, choice.next, choice.failNext);
      return;
    }
    if (choice.action === 'start_hack') {
      initiateHacking(choice.targetName || 'ICE', choice.difficulty || 'medium', choice.next, choice.failNext);
      return;
    }
    if (choice.action === 'reset') {
      engine.resetRun();
      loadChapter('start');
      return;
    }

    loadChapter(choice.next);
  }

  /* -------------------------------------------------------------
     5. D20 DICE MODAL
  ------------------------------------------------------------- */
  function triggerDiceModal(choice) {
    pendingDiceRoll = choice;
    if (!diceModal) return;
    diceModal.classList.add('active');
    diceConfirmBtn.style.display = 'none';
    diceTitleEl.textContent = `${choice.reqAttr} Skill Check (DC ${choice.diff})`;
    diceSubEl.textContent = 'Rolling d20...';
    diceValEl.textContent = '🎲';

    if (audio) audio.playDiceRoll();

    let rollCount = 0;
    const rollAnim = setInterval(() => {
      diceValEl.textContent = Math.floor(Math.random() * 20) + 1;
      rollCount++;
      if (rollCount > 8) {
        clearInterval(rollAnim);
        finalizeDiceRoll(choice);
      }
    }, 80);
  }

  function finalizeDiceRoll(choice) {
    const rawRoll = Math.floor(Math.random() * 20) + 1;
    const attrVal = engine.character.attrs[choice.reqAttr] || 10;
    const mod = Math.floor((attrVal - 10) / 2);
    const total = rawRoll + mod;
    const success = total >= choice.diff;

    diceValEl.textContent = rawRoll;
    diceSubEl.innerHTML = `Roll: <b>${rawRoll}</b> + Mod (${mod >= 0 ? '+' : ''}${mod}) = <b>${total}</b> vs DC ${choice.diff} <br><span style="color:${success ? '#10b981' : '#ef4444'}; font-weight:bold; font-size:1.1rem;">${success ? 'SUCCESS' : 'FAILED'}</span>`;

    if (success) {
      if (audio) audio.playSuccess();
    } else {
      if (audio) audio.playFailure();
    }

    diceConfirmBtn.style.display = 'inline-block';
    diceConfirmBtn.onclick = () => {
      diceModal.classList.remove('active');
      if (success) {
        loadChapter(choice.next);
      } else {
        loadChapter(choice.failNext || choice.next);
      }
    };
  }

  /* -------------------------------------------------------------
     6. TACTICAL COMBAT HUD CONTROLLER
  ------------------------------------------------------------- */
  function initiateCombat(enemyData, winNext, loseNext) {
    engine.startCombat(enemyData, winNext, loseNext);
    if (!combatOverlay) return;
    combatOverlay.style.display = 'block';
    updateCombatHUD();
  }

  function updateCombatHUD() {
    const c = engine.activeCombat;
    if (!c) return;

    const hero = engine.character;
    if (combatHeroName) combatHeroName.textContent = hero.name;
    if (combatHeroHpText) combatHeroHpText.textContent = `${hero.hp} / ${hero.maxHp} HP`;
    if (combatHeroHpFill) combatHeroHpFill.style.width = `${(hero.hp / hero.maxHp) * 100}%`;

    if (combatEnemyName) combatEnemyName.textContent = c.enemy.name;
    if (combatEnemyHpText) combatEnemyHpText.textContent = `${c.enemy.hp} / ${c.enemy.maxHp} HP`;
    if (combatEnemyHpFill) combatEnemyHpFill.style.width = `${(c.enemy.hp / c.enemy.maxHp) * 100}%`;

    // Render latest combat log entry to story log
    if (c.log.length > 0) {
      const latestMsg = c.log[c.log.length - 1];
      const bubble = document.createElement('div');
      bubble.className = 'story-bubble combat-entry';
      bubble.innerHTML = `<div>${latestMsg}</div>`;
      storyLogEl.appendChild(bubble);
      storyLogEl.scrollTop = storyLogEl.scrollHeight;
    }
  }

  // Combat Move Buttons
  const strikeBtn = document.getElementById('combat-act-strike');
  const specialBtn = document.getElementById('combat-act-special');
  const shieldBtn = document.getElementById('combat-act-shield');
  const itemBtn = document.getElementById('combat-act-item');

  function handleCombatTurn(action) {
    const res = engine.playerCombatAction(action);
    if (cinema) {
      if (action === 'strike') cinema.triggerSlashFx();
      if (action === 'special') cinema.triggerLaserFx();
      if (action === 'shield') cinema.triggerImpact(12);
    }
    updateCombatHUD();
    updateCharacterUI();

    if (res && res.status === 'win') {
      showToast('Combat Encounter Cleared!', '🏆');
      setTimeout(() => {
        combatOverlay.style.display = 'none';
        loadChapter(res.next);
      }, 1200);
    } else if (res && res.status === 'lose') {
      showToast('Critical Damage Sustained!', '💀');
      setTimeout(() => {
        combatOverlay.style.display = 'none';
        loadChapter(res.next);
      }, 1200);
    }
  }

  if (strikeBtn) strikeBtn.addEventListener('click', () => handleCombatTurn('strike'));
  if (specialBtn) specialBtn.addEventListener('click', () => handleCombatTurn('special'));
  if (shieldBtn) shieldBtn.addEventListener('click', () => handleCombatTurn('shield'));
  if (itemBtn) itemBtn.addEventListener('click', () => handleCombatTurn('item'));

  /* -------------------------------------------------------------
     7. CYBER HACKING MATRIX CONTROLLER
  ------------------------------------------------------------- */
  function initiateHacking(targetName, difficulty, winNext, failNext) {
    const hack = engine.startHackingGame(targetName, difficulty, winNext, failNext);
    if (!hackOverlay) return;
    hackOverlay.style.display = 'flex';
    if (hackTargetTitle) hackTargetTitle.textContent = `⚡ BREACHING ${hack.targetName.toUpperCase()}`;
    renderHackGrid();
  }

  function renderHackGrid() {
    const hack = engine.activeHack;
    if (!hack || !hackGridContainer) return;

    if (hackTurnsBadge) hackTurnsBadge.textContent = `TURNS LEFT: ${hack.turnsLeft}`;
    hackGridContainer.innerHTML = '';
    hackGridContainer.style.gridTemplateColumns = `repeat(${hack.size}, 1fr)`;

    hack.grid.forEach(cell => {
      const cellEl = document.createElement('div');
      cellEl.className = 'hack-cell';
      cellEl.textContent = cell.hex;

      cellEl.addEventListener('click', () => {
        const res = engine.hackGridNode(cell.id);
        if (res && res.status === 'win') {
          showToast('ICE System Bypassed!', '🔓');
          cellEl.classList.add('solved');
          setTimeout(() => {
            hackOverlay.style.display = 'none';
            loadChapter(res.next);
          }, 800);
        } else if (res && res.status === 'fail') {
          showToast('Security Alert: Lockdown Triggered!', '🚨');
          setTimeout(() => {
            hackOverlay.style.display = 'none';
            loadChapter(res.next);
          }, 800);
        } else {
          renderHackGrid();
        }
      });
      hackGridContainer.appendChild(cellEl);
    });
  }

  /* -------------------------------------------------------------
     8. CHARACTER & INVENTORY UI SYNC
  ------------------------------------------------------------- */
  function updateCharacterUI() {
    const hero = engine.character;
    if (charNameEl) charNameEl.textContent = hero.name;
    if (charClassEl) charClassEl.textContent = hero.class;
    if (charLevelEl) charLevelEl.textContent = `LVL ${hero.level}`;
    if (dossierAvatarIcon) dossierAvatarIcon.textContent = hero.avatar;

    if (hpTextEl) hpTextEl.textContent = `${hero.hp}/${hero.maxHp}`;
    if (hpFillEl) hpFillEl.style.width = `${(hero.hp / hero.maxHp) * 100}%`;

    if (energyTextEl) energyTextEl.textContent = `${hero.energy}/${hero.maxEnergy}`;
    if (energyFillEl) energyFillEl.style.width = `${(hero.energy / hero.maxEnergy) * 100}%`;

    if (sanityTextEl) sanityTextEl.textContent = `${hero.sanity}/${hero.maxSanity}`;
    if (sanityFillEl) sanityFillEl.style.width = `${(hero.sanity / hero.maxSanity) * 100}%`;

    // Attribute scores
    ['str', 'agi', 'int', 'wil', 'lck'].forEach(k => {
      const el = document.getElementById(`attr-${k}`);
      if (el) el.textContent = hero.attrs[k.toUpperCase()] || 10;
    });

    // Equipment items
    if (hero.equipment) {
      if (hero.equipment.weapon) {
        document.getElementById('equip-weapon-name').textContent = hero.equipment.weapon.name;
        document.getElementById('equip-weapon-icon').textContent = hero.equipment.weapon.icon;
      }
      if (hero.equipment.armor) {
        document.getElementById('equip-armor-name').textContent = hero.equipment.armor.name;
        document.getElementById('equip-armor-icon').textContent = hero.equipment.armor.icon;
      }
      if (hero.equipment.implant) {
        document.getElementById('equip-implant-name').textContent = hero.equipment.implant.name;
        document.getElementById('equip-implant-icon').textContent = hero.equipment.implant.icon;
      }
    }

    // Inventory Backpack
    const invGrid = document.getElementById('inventory-grid');
    if (invGrid) {
      invGrid.innerHTML = '';
      hero.inventory.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item-card';
        itemEl.innerHTML = `
          <div class="item-top">
            <span class="item-icon">${item.icon}</span>
            <span class="item-qty">x${item.qty}</span>
          </div>
          <span class="item-name">${item.name}</span>
          <span class="item-desc">${item.desc}</span>
        `;
        itemEl.addEventListener('click', () => {
          if (item.type === 'heal' && item.qty > 0) {
            item.qty--;
            hero.hp = Math.min(hero.maxHp, hero.hp + item.val);
            showToast(`Used ${item.name} (+${item.val} HP)!`, '💖');
            if (audio) audio.playSuccess();
            updateCharacterUI();
          } else if (item.type === 'energy' && item.qty > 0) {
            item.qty--;
            hero.energy = Math.min(hero.maxEnergy, hero.energy + item.val);
            showToast(`Used ${item.name} (+${item.val} Energy)!`, '⚡');
            if (audio) audio.playSuccess();
            updateCharacterUI();
          }
        });
        invGrid.appendChild(itemEl);
      });
    }
  }

  /* -------------------------------------------------------------
     9. SCENARIO & TAB SWITCHING
  ------------------------------------------------------------- */
  // Scenario Buttons
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioKey = btn.getAttribute('data-scenario');
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.body.setAttribute('data-theme', scenarioKey);
      engine.setScenario(scenarioKey);
      showToast(`Campaign switched to ${engine.getScenario().title}`, '🌌');
      if (audio) audio.playTabSwitch();
      loadChapter('start');
    });
  });

  // Nav Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
      const activeView = document.getElementById(`tab-${tabId}`);
      if (activeView) activeView.classList.add('active');

      if (tabId === 'map') renderWorldMap();
      if (audio) audio.playTabSwitch();
    });
  });

  /* -------------------------------------------------------------
     10. WORLD MAP CANVAS RENDERER
  ------------------------------------------------------------- */
  function renderWorldMap() {
    const mapCanvas = document.getElementById('map-canvas');
    if (!mapCanvas) return;
    const ctx = mapCanvas.getContext('2d');
    mapCanvas.width = 1280;
    mapCanvas.height = 720;

    const w = mapCanvas.width;
    const h = mapCanvas.height;
    const scenario = engine.getScenario();

    // Map Backdrop
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Grid Matrix Lines
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw Route Connections between nodes
    const nodes = scenario.mapNodes || [];
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    nodes.forEach((n, idx) => {
      const nx = n.x * w;
      const ny = n.y * h;
      if (idx === 0) ctx.moveTo(nx, ny);
      else ctx.lineTo(nx, ny);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Map Beacons
    nodes.forEach(n => {
      const nx = n.x * w;
      const ny = n.y * h;
      const isCurrent = (engine.getChapter().nodeId === n.id);

      // Pulse Glow
      if (isCurrent) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(nx, ny, 32, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isCurrent ? '#ef4444' : '#4fd1c5';
      ctx.beginPath();
      ctx.arc(nx, ny, 12, 0, Math.PI * 2);
      ctx.fill();

      // Node Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(n.name, nx + 20, ny + 5);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
      ctx.font = '12px "Fraunces", Georgia, serif';
      ctx.fillText(n.desc, nx + 20, ny + 24);
    });
  }

  /* -------------------------------------------------------------
     11. HEADER TOOLS & EXPORT
  ------------------------------------------------------------- */
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (!audio) return;
      const muted = audio.toggleMute();
      audioToggleBtn.textContent = muted ? '🔇' : '🔊';
      showToast(muted ? 'Soundtracks Muted' : 'Audio Synthesizer Enabled', '🎵');
      if (!muted && !audio.isAmbientPlaying) audio.startAmbient();
    });
  }

  if (resetRunBtn) {
    resetRunBtn.addEventListener('click', () => {
      if (confirm('Reset current story progression?')) {
        engine.resetRun();
        loadChapter('start');
        showToast('Campaign Reset to Chapter 1', '🔄');
      }
    });
  }

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', () => {
      isAutoPlay = !isAutoPlay;
      autoplayBtn.classList.toggle('active', isAutoPlay);
      autoplayBtn.textContent = isAutoPlay ? '⏸️ Auto' : '▶️ Auto';
      showToast(isAutoPlay ? 'Cinematic Auto-Play: ON' : 'Cinematic Auto-Play: OFF', '🎬');
    });
  }

  const camZoomBtn = document.getElementById('cam-zoom-btn');
  if (camZoomBtn && cinema) {
    camZoomBtn.addEventListener('click', () => {
      cinema.triggerTransition();
      showToast('Camera Angle Shifted', '🎥');
    });
  }

  const cinemaShakeBtn = document.getElementById('cinema-shake-btn');
  if (cinemaShakeBtn && cinema) {
    cinemaShakeBtn.addEventListener('click', () => {
      cinema.triggerImpact(22);
    });
  }

  // Custom Prompt Execution
  if (sendPromptBtn && customPromptInput) {
    const handleCustomPrompt = () => {
      const prompt = customPromptInput.value.trim();
      if (!prompt) return;
      customPromptInput.value = '';

      const bubble = document.createElement('div');
      bubble.className = 'story-bubble event';
      bubble.innerHTML = `
        <div class="story-bubble-loc">⚡ CUSTOM DIRECTIVE</div>
        <div>"${prompt}"</div>
      `;
      storyLogEl.appendChild(bubble);
      storyLogEl.scrollTop = storyLogEl.scrollHeight;

      showToast('Custom narrative action executed!', '✨');
      if (audio) audio.playSuccess();
    };
    sendPromptBtn.addEventListener('click', handleCustomPrompt);
    customPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCustomPrompt();
    });
  }

  // Export Story Log
  if (exportStoryBtn) {
    exportStoryBtn.addEventListener('click', () => {
      const entries = Array.from(document.querySelectorAll('.story-bubble')).map(b => b.innerText).join('\n\n---\n\n');
      const blob = new Blob([`# Nexus Chronicle 2.0 - Story Log\n\n${entries}`], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_chronicle_story_log_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Story Log exported successfully!', '📥');
    });
  }

  // Start background procedural audio on first user interaction
  document.body.addEventListener('click', () => {
    if (audio && !audio.isAmbientPlaying && !audio.muted) {
      audio.startAmbient();
    }
  }, { once: true });

  // Initial Boot
  initParticleCanvas();
  loadChapter('start');
});
