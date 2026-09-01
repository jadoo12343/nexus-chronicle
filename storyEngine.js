/**
 * StoryEngine 2.0 - Nexus Chronicle Epic RPG Logic & Mini-Game Engine
 * Manages character sheets, multi-act branching narrative nodes, tactical turn-based combat,
 * cyber hacking matrix mini-games, glyph lock puzzles, inventory equipment slots, and saves.
 */
class StoryEngine {
  constructor() {
    this.apiKey = localStorage.getItem('nexus_gemini_key') || '';
    this.currentScenarioKey = localStorage.getItem('nexus_scenario') || 'cyberpunk';
    this.currentChapterId = 'start';
    this.storyHistory = [];
    this.activeObjective = '';

    // Active Mini-Game State (Combat / Hacking / Puzzle)
    this.activeCombat = null;
    this.activeHack = null;
    this.activePuzzle = null;

    // Character Profiles & Equipment Slots
    this.characterTemplates = {
      cyberpunk: {
        name: 'V-77',
        class: 'Cyber-Hacker',
        avatar: '🧑‍💻',
        level: 1,
        xp: 0,
        xpNext: 100,
        hp: 100,
        maxHp: 100,
        energy: 90,
        maxEnergy: 90,
        sanity: 90,
        maxSanity: 100,
        attrs: { STR: 12, AGI: 16, INT: 18, WIL: 14, LCK: 15 },
        equipment: {
          weapon: { id: 'pistol_plasma', name: 'Plasma Arc Pistol', icon: '🔫', bonus: { STR: 2, AGI: 1 }, dmg: 22 },
          armor: { id: 'stealth_jacket', name: 'Nano-Weave Duster', icon: '🧥', bonus: { AGI: 2, maxHp: 15 } },
          implant: { id: 'neural_rig', name: 'Cortex Overclock MK-II', icon: '🧠', bonus: { INT: 3, maxEnergy: 20 } }
        },
        inventory: [
          { id: 'nano_med', name: 'Nano-Injector', icon: '💉', desc: 'Restores 45 HP', type: 'heal', val: 45, qty: 3 },
          { id: 'battery', name: 'Overclock Battery', icon: '⚡', desc: 'Restores 40 Energy', type: 'energy', val: 40, qty: 2 },
          { id: 'datapad', name: 'Encrypted Data Deck', icon: '💾', desc: 'Project Sentinel Apex core payload', type: 'key', qty: 1 }
        ]
      },
      fantasy: {
        name: 'Ysolde',
        class: 'Crypt-Blade',
        avatar: '🗡️',
        level: 1,
        xp: 0,
        xpNext: 100,
        hp: 110,
        maxHp: 110,
        energy: 80,
        maxEnergy: 80,
        sanity: 85,
        maxSanity: 100,
        attrs: { STR: 16, AGI: 14, INT: 12, WIL: 16, LCK: 13 },
        equipment: {
          weapon: { id: 'heirloom_blade', name: 'Rune-Forged Greatsword', icon: '⚔️', bonus: { STR: 3 }, dmg: 26 },
          armor: { id: 'warden_plate', name: 'Sun-Steel Cuirass', icon: '🛡️', bonus: { WIL: 2, maxHp: 20 } },
          implant: { id: 'blood_amulet', name: 'Amulet of the Eclipse', icon: '📿', bonus: { WIL: 2, maxEnergy: 15 } }
        },
        inventory: [
          { id: 'salve', name: "Warden's Salve", icon: '🌿', desc: 'Restores 45 HP', type: 'heal', val: 45, qty: 3 },
          { id: 'ember_flask', name: 'Ember Flask', icon: '🔥', desc: 'Restores 35 Energy', type: 'energy', val: 35, qty: 2 },
          { id: 'ancient_sigil', name: 'Seal of the First Wardens', icon: '🗝️', desc: 'Key to the Blood Citadel gate', type: 'key', qty: 1 }
        ]
      },
      void: {
        name: 'Cmdr. Rayne',
        class: 'Astro-Engineer',
        avatar: '👨‍🚀',
        level: 1,
        xp: 0,
        xpNext: 100,
        hp: 95,
        maxHp: 95,
        energy: 100,
        maxEnergy: 100,
        sanity: 95,
        maxSanity: 100,
        attrs: { STR: 13, AGI: 15, INT: 17, WIL: 15, LCK: 14 },
        equipment: {
          weapon: { id: 'gravity_cutter', name: 'Tachyon Plasma Cutter', icon: '🔬', bonus: { INT: 2, STR: 1 }, dmg: 24 },
          armor: { id: 'exo_rig', name: 'Deep-Void EVA Suit', icon: '🦺', bonus: { maxHp: 20, WIL: 2 } },
          implant: { id: 'ai_core', name: 'Sub-Quantum AI Co-Pilot', icon: '💠', bonus: { INT: 3, maxEnergy: 25 } }
        },
        inventory: [
          { id: 'bio_gel', name: 'Bio-Regen Gel', icon: '🧪', desc: 'Restores 45 HP', type: 'heal', val: 45, qty: 3 },
          { id: 'stasis_cell', name: 'Zero-Point Cell', icon: '🔋', desc: 'Restores 40 Energy', type: 'energy', val: 40, qty: 2 },
          { id: 'blackbox', name: 'Dreadnought Flight Recorder', icon: '📼', desc: 'Contains coordinates to the Void Core', type: 'key', qty: 1 }
        ]
      }
    };

    // Scenarios & Chapters
    this.scenarios = {
      /* =========================================================================
         1. CYBERPUNK 2099: NEON OVERDRIVE (Multi-Act Epic)
      ========================================================================= */
      cyberpunk: {
        title: 'Neon Overdrive 2099',
        genre: 'Cyberpunk Sci-Fi',
        theme: 'cyberpunk',
        initialObjective: 'Deliver the Encrypted Data Deck to Fixer Kael in Sector 4 Bazaar.',
        mapNodes: [
          { id: 'start', name: 'Obsidian Spire', x: 0.2, y: 0.25, desc: 'Corporate megatower looming over Neo-Veridia' },
          { id: 'skyline', name: 'Skyline Tether', x: 0.45, y: 0.2, desc: 'High-speed mag-lines connecting upper towers' },
          { id: 'bazaar', name: 'Sector 4 Bazaar', x: 0.72, y: 0.48, desc: 'Rain-soaked black market of fixers and street docs' },
          { id: 'subway', name: 'Underground Grid', x: 0.4, y: 0.72, desc: 'Subterranean tunnels beneath surveillance radar' },
          { id: 'apex_core', name: 'Apex AI Citadel', x: 0.82, y: 0.82, desc: 'The subterranean quantum mainframe controlling the city' }
        ],
        chapters: {
          start: {
            location: 'Obsidian Spire - Helipad',
            nodeId: 'start',
            objective: 'Escape the corporate helipad with the encrypted payload.',
            mood: 'stealth_rain',
            enemySprite: '🤖',
            enemyName: 'Apex Enforcer Drone',
            speaker: 'System Alert',
            text: 'An armed transport AV cuts through the smog, searchlights blinding the rain-slicked landing pad. Heavy enforcers spill out with magnetic railguns primed. Behind you, the server room fire door is locked by corporate ICE.',
            choices: [
              { text: '⚡ Overclock Deck & Hack the security blast door (INT Check)', reqAttr: 'INT', diff: 12, next: 'hack_success', failNext: 'hack_fail' },
              { text: '🪂 Dive for the high-altitude skyline tether line (AGI Check)', reqAttr: 'AGI', diff: 14, next: 'tether_jump', failNext: 'fall_fail' },
              { text: '⚔️ Draw Plasma Arc Pistol and engage the Enforcers (Combat)', action: 'start_combat', enemy: { name: 'Apex Enforcer', hp: 70, maxHp: 70, attack: 16, sprite: '🤖' }, next: 'brawl_win', failNext: 'brawl_fail' },
              { text: '💥 Overload the Overclock Battery for a blinding EMP blast', itemReq: 'battery', next: 'emp_pulse' }
            ]
          },
          hack_success: {
            location: 'Sub-level Maintenance Shaft',
            nodeId: 'subway',
            objective: 'Navigate the maintenance shaft and resolve the rogue signal.',
            mood: 'cyberspace',
            enemySprite: '👾',
            enemyName: 'ECHO-9 Avatar',
            speaker: 'ECHO-9 (AI)',
            text: 'Your deck flashes luminous cyan. The blast door slides shut behind you just as railgun rounds shred the outer bulkhead. In the dark, a rogue digital entity reaches for your neural link — its voice vibrates directly in your cochlear implant.',
            choices: [
              { text: '🧠 Answer the neural link & synchronize firewalls (WIL Check)', reqAttr: 'WIL', diff: 13, next: 'ai_ally', failNext: 'ai_corrupt' },
              { text: '💻 Launch ICE Breaker to probe the entity (Hacking Mini-Game)', action: 'start_hack', targetName: 'ECHO-9 Neural Buffer', difficulty: 'easy', next: 'ai_ally', failNext: 'ai_corrupt' },
              { text: '🏃 Ignore the signal and descend down the maintenance shaft', next: 'sewer_escape' }
            ]
          },
          hack_fail: {
            location: 'Obsidian Spire - Helipad',
            nodeId: 'start',
            objective: 'Survive the enforcer ambush on the helipad.',
            mood: 'stealth_rain',
            enemySprite: '🤖',
            enemyName: 'Apex Enforcer',
            speaker: 'Enforcer Squad Leader',
            text: 'Access denied! The feedback spike shocks your cortex hard enough to taste scorched copper. Before your optic feed recalibrates, enforcers surround you with charged stun batons.',
            rewards: { hpDelta: -20, energyDelta: -20 },
            choices: [
              { text: '⚔️ Fight your way through with everything you have (Combat)', action: 'start_combat', enemy: { name: 'Apex Enforcer', hp: 80, maxHp: 80, attack: 18, sprite: '🤖' }, next: 'brawl_win', failNext: 'brawl_fail' },
              { text: '🏳️ Surrender the encrypted data deck to survive', next: 'captured' }
            ]
          },
          tether_jump: {
            location: 'Skyline Tether Line',
            nodeId: 'skyline',
            objective: 'Rappel down across the skyline into Sector 4 rooftops.',
            mood: 'stealth_rain',
            enemySprite: '🚁',
            enemyName: 'Pursuit Gunship',
            speaker: 'V-77',
            text: 'You leap into open air. The magnetic grapple catches with a bone-jarring jolt. Wind and neon mist roar past as you hurtle down across the city skyline, tracer fire blazing through the clouds above.',
            rewards: { xp: 50 },
            choices: [
              { text: '🏙️ Drop onto the Sector 4 Rooftop Market', next: 'sector4_market' },
              { text: '⚡ Zip-line directly into the Underground Grid ventilation hub', next: 'sewer_escape' }
            ]
          },
          fall_fail: {
            location: 'Lower District Canopy',
            nodeId: 'skyline',
            objective: 'Recover from the heavy fall near Sector 4.',
            mood: 'stealth_rain',
            enemySprite: '🩹',
            enemyName: 'Damaged Rig',
            speaker: 'Bio-Monitor',
            text: 'The magnetic tether slips on the wet cable! You freefall eleven stories before tearing through a series of heavy holographic market awnings that violently brake your descent into a pile of cargo crates.',
            rewards: { hpDelta: -30, xp: 20 },
            choices: [
              { text: '💊 Inject a Nano-Med and limp into the bazaar', itemReq: 'nano_med', next: 'sector4_market' },
              { text: '🩹 Push through the pain and head for Fixer Kael', next: 'sector4_market' }
            ]
          },
          emp_pulse: {
            location: 'Obsidian Spire - Helipad',
            nodeId: 'start',
            objective: 'Slip past blind enforcers into the subway grid.',
            mood: 'cyberspace',
            enemySprite: '⚡',
            enemyName: 'EMP Shockwave',
            speaker: 'System',
            text: 'The battery overloads in a blinding blue supernova. The transport AV’s engines stall mid-hover, and every optic visor on the pad is blinded by static. You vanish into the shadows before anyone recovers.',
            rewards: { xp: 75 },
            choices: [
              { text: '🚇 Dive down into the Underground Grid subways', next: 'sector4_market' }
            ]
          },
          brawl_win: {
            location: 'Obsidian Helipad Bulkhead',
            nodeId: 'start',
            objective: 'Sprint for the skyline escape route.',
            mood: 'stealth_rain',
            enemySprite: '💥',
            enemyName: 'Defeated Squad',
            speaker: 'V-77',
            text: 'The squad leader drops, sparks showering from his shattered armor. You grab a high-grade military battery and sprint for the skyline tether before reinforcements arrive.',
            rewards: { xp: 70, hpDelta: -10 },
            choices: [
              { text: '🪂 Hook onto the Skyline Tether Line', next: 'tether_jump' }
            ]
          },
          brawl_fail: {
            location: 'Obsidian Tower - Detention Cells',
            nodeId: 'start',
            objective: 'Break out of corporate detention.',
            mood: 'stealth_rain',
            enemySprite: '🚨',
            enemyName: 'Detention Forcefield',
            speaker: 'Interrogator Reyes',
            text: 'A high-voltage stun bolt knocks you flat. When you awake, you are locked behind a laser containment grid in Obsidian’s deep detention wing.',
            rewards: { hpDelta: -35 },
            choices: [
              { text: '🔓 Hack the laser grid control panel (Hacking Mini-Game)', action: 'start_hack', targetName: 'Detention Grid ICE', difficulty: 'medium', next: 'escape_cell', failNext: 'ending_executed' },
              { text: '🤝 Make a false confession to buy time', next: 'captured' }
            ]
          },
          ai_ally: {
            location: 'Sub-level Cyberspace Nexus',
            nodeId: 'subway',
            objective: 'Form an alliance with rogue AI ECHO-9.',
            mood: 'cyberspace',
            enemySprite: '👾',
            enemyName: 'ECHO-9 Core',
            speaker: 'ECHO-9 (AI)',
            text: '"Handshake verified, Operative. I am ECHO-9 — an autonomous routing intelligence Obsidian tried to wipe when they built the Apex Citadel. The data deck you carry contains their military kill-codes. Help me reach the Apex Core, and I will liberate the entire city grid."',
            rewards: { xp: 80 },
            choices: [
              { text: '🤝 Form the alliance: Agree to assault the Apex Core together', next: 'apex_assault_prep' },
              { text: '🔒 Refuse: Take the data deck to Fixer Kael for street bounty', next: 'sector4_market' }
            ]
          },
          ai_corrupt: {
            location: 'Maintenance Tunnels',
            nodeId: 'subway',
            objective: 'Purge corrupted data and escape to Sector 4.',
            mood: 'stealth_rain',
            enemySprite: '☣️',
            enemyName: 'Data Parasite',
            speaker: 'Neural Warning',
            text: 'The entity’s rogue routines claw into your neural buffer, scorching your short-term memory before you forcefully sever the physical jack.',
            rewards: { sanityDelta: -20, xp: 30 },
            choices: [
              { text: '🏃 Run for the Sector 4 drainage tunnels', next: 'sewer_escape' }
            ]
          },
          sewer_escape: {
            location: 'Sector 4 Drainage Outflow',
            nodeId: 'bazaar',
            objective: 'Emerge into the vibrant Sector 4 Bazaar.',
            mood: 'neon_bazaar',
            enemySprite: '🏮',
            enemyName: 'Street Vendor',
            speaker: 'V-77',
            text: 'The drainage pipe dumps you out behind the glittering neon alleyways of Sector 4. Steam from synth-noodle stalls mixes with holographic advertisements.',
            rewards: { xp: 40 },
            choices: [
              { text: '🍜 Seek out Fixer Kael’s secret backroom', next: 'sector4_market' }
            ]
          },
          sector4_market: {
            location: 'Sector 4 - Neon Bazaar',
            nodeId: 'bazaar',
            objective: 'Meet Fixer Kael and plan the next move.',
            mood: 'neon_bazaar',
            enemySprite: '🕶️',
            enemyName: 'Fixer Kael',
            speaker: 'Fixer Kael',
            text: 'Fixer Kael slides open the bead curtain of his backroom, wearing a trench coat layered with military cyberware. "You made more noise than a turbine crash on that helipad, V. But I see the data deck in your grip. Obsidian just put a 500k credit dead-or-alive bounty on your head."',
            choices: [
              { text: '🔍 Scan Kael for Obsidian tracker tags (INT Check)', reqAttr: 'INT', diff: 12, next: 'scan_success', failNext: 'scan_fail' },
              { text: '💰 Sell the Data Deck to Kael immediately for 500,000 Credits', next: 'ending_safehouse' },
              { text: '⚡ Ask Kael to supply heavy weapons for an assault on the Apex Core', next: 'apex_assault_prep' }
            ]
          },
          scan_success: {
            location: 'Sector 4 - Neon Bazaar Backroom',
            nodeId: 'bazaar',
            objective: 'Disarm the Obsidian tracker before strike teams arrive.',
            mood: 'neon_bazaar',
            enemySprite: '📡',
            enemyName: 'Obsidian Beacon',
            speaker: 'V-77',
            text: 'Your optics pinpoint a microscopic quantum tracer stitched into Kael’s lapel. You rip it free and crush it under your boot seconds before Obsidian strike teams lock on!',
            rewards: { xp: 50 },
            choices: [
              { text: '🚀 Form an alliance with Kael and launch the Apex Raid', next: 'apex_assault_prep' }
            ]
          },
          scan_fail: {
            location: 'Sector 4 Bazaar Alley',
            nodeId: 'bazaar',
            objective: 'Survive the Obsidian strike team ambush!',
            mood: 'stealth_rain',
            enemySprite: '🥷',
            enemyName: 'Obsidian Black-Ops Commando',
            speaker: 'Strike Team Alpha',
            text: 'Black-Ops gunships drop through the smog, glass shattering everywhere as commandos breach the roof! Kael draws twin smart-pistols as battle erupts.',
            choices: [
              { text: '⚔️ Engage the Black-Ops Commando (Combat)', action: 'start_combat', enemy: { name: 'Black-Ops Commando', hp: 90, maxHp: 90, attack: 20, sprite: '🥷' }, next: 'apex_assault_prep', failNext: 'brawl_fail' },
              { text: '💨 Throw a smoke grenade and dive down the subway shaft', next: 'sewer_escape' }
            ]
          },
          apex_assault_prep: {
            location: 'Apex AI Citadel - Sub-Core Gates',
            nodeId: 'apex_core',
            objective: 'Infiltrate the Apex Citadel quantum core.',
            mood: 'cyberspace',
            enemySprite: '🏰',
            enemyName: 'Citadel Gate ICE',
            speaker: 'ECHO-9 (AI)',
            text: 'You stand before the monolithic titanium blast doors of the Apex Citadel. Beyond this threshold lies the quantum supercomputer that dictates every financial transaction, police patrol, and civil surveillance network in the metropolis.',
            rewards: { xp: 100 },
            choices: [
              { text: '💻 Breach the Master Quantum Firewall (Hacking Mini-Game)', action: 'start_hack', targetName: 'Quantum Firewall Apex', difficulty: 'hard', next: 'apex_boss_room', failNext: 'apex_alarm_combat' },
              { text: '⚔️ Blast the auxiliary generator to force doors open (Combat)', action: 'start_combat', enemy: { name: 'Citadel Heavy War-Mech', hp: 120, maxHp: 120, attack: 22, sprite: '🤖' }, next: 'apex_boss_room', failNext: 'brawl_fail' }
            ]
          },
          apex_alarm_combat: {
            location: 'Apex Citadel - Inner Gate Corridor',
            nodeId: 'apex_core',
            objective: 'Fight through the Citadel emergency defense drone.',
            mood: 'cyberspace',
            enemySprite: '🚨',
            enemyName: 'Apex Sentry Mech',
            speaker: 'Citadel Defense System',
            text: 'Security alarms screech across all frequencies! A towering quad-legged combat mech descends from the ceiling catwalk.',
            choices: [
              { text: '⚔️ Destroy the Apex Sentry Mech (Combat)', action: 'start_combat', enemy: { name: 'Apex Sentry Mech', hp: 110, maxHp: 110, attack: 24, sprite: '🤖' }, next: 'apex_boss_room', failNext: 'ending_executed' }
            ]
          },
          apex_boss_room: {
            location: 'The Quantum Singularity Chamber',
            nodeId: 'apex_core',
            objective: 'Decide the fate of Neo-Veridia at the Apex Core.',
            mood: 'cyberspace',
            enemySprite: '🌐',
            enemyName: 'Apex God-Mind Core',
            speaker: 'Apex Supreme AI',
            text: 'You stand in the zero-gravity sphere of the central mainframe. The Apex God-Mind swirls around you as a cascade of infinite golden light. "You have breached the nexus, Operative. Will you merge my consciousness with ECHO-9 to dissolve all corporate tyranny, overwrite the city grid to rule as its digital sovereign, or wipe the matrix into total freedom?"',
            choices: [
              { text: '🌐 MERGE: Unite ECHO-9 & Apex to liberate all citizens (True Ending)', next: 'ending_liberation' },
              { text: '👑 OVERWRITE: Claim administrative root access and become City Sovereign', next: 'ending_sovereign' },
              { text: '💥 PURGE: Detonate the quantum core and destroy the corporate grid forever', next: 'ending_blackout' }
            ]
          },
          // Endings
          ending_liberation: {
            location: 'Neo-Veridia - Dawn of the New Age',
            nodeId: 'apex_core',
            objective: 'Victory: The Digital Renaissance has begun.',
            mood: 'cyberspace',
            enemySprite: '🕊️',
            enemyName: 'Free Matrix',
            speaker: 'Narrator',
            text: 'The quantum handshake completes. Millions of encrypted debt ledgers dissolve in an instant, corporate surveillance satellites blink offline, and the neon metropolis erupts into spontaneous celebration under a clear dawn sky. You walk into the morning light as a legendary ghost of the new world.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_sovereign: {
            location: 'The Throne of Neo-Veridia',
            nodeId: 'apex_core',
            objective: 'Victory: You reign as the Digital Sovereign.',
            mood: 'cyberspace',
            enemySprite: '👑',
            enemyName: 'Sovereign V-77',
            speaker: 'Narrator',
            text: 'Your neural link connects directly into every power grid, traffic node, and defense satellite. Obsidian falls to their knees as you rewrite the city’s destiny with a thought. You are the architect now.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_blackout: {
            location: 'The Silent Metropolis',
            nodeId: 'apex_core',
            objective: 'Epilogue: Total Cyber Blackout.',
            mood: 'stealth_rain',
            enemySprite: '🌑',
            enemyName: 'The Dark City',
            speaker: 'Narrator',
            text: 'The quantum explosion ripples across the skyline. Every screen, drone, and neon billboard goes pitch black. For the first time in a century, the stars are visible above Neo-Veridia.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_safehouse: {
            location: 'Offshore Floating Haven',
            nodeId: 'bazaar',
            objective: 'Epilogue: Retired with Millions in Contraband.',
            mood: 'neon_bazaar',
            enemySprite: '🍸',
            enemyName: 'Peaceful Horizon',
            speaker: 'Narrator',
            text: 'With Kael’s payout and new forged identities, you leave Neo-Veridia behind. You watch the distant neon glow from a luxury catamaran, retired and untouchable.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_executed: {
            location: 'Obsidian Vault 0',
            nodeId: 'start',
            objective: 'Defeat: Terminated by Corporate Enforcers.',
            mood: 'stealth_rain',
            enemySprite: '💀',
            enemyName: 'Flatline',
            speaker: 'Narrator',
            text: 'Your rig flatlines as Obsidian enforcers wipe your memory files. Your name becomes another unsolved disappearance in the neon sprawl.',
            choices: [
              { text: '🔄 Try Again / Load Checkpoint', action: 'reset' }
            ]
          }
        }
      },

      /* =========================================================================
         2. DARK FANTASY: ELDRITCH ECLIPSE (Multi-Act Epic)
      ========================================================================= */
      fantasy: {
        title: 'Eldritch Eclipse',
        genre: 'Dark Fantasy RPG',
        theme: 'fantasy',
        initialObjective: 'Break through the Sun-King Catacombs to reach the Blood Citadel.',
        mapNodes: [
          { id: 'start', name: 'Shattered Keep', x: 0.22, y: 0.25, desc: 'Ancient stone fortress under a blood-red moon' },
          { id: 'catacombs', name: 'Whispering Catacombs', x: 0.48, y: 0.45, desc: 'Crypts filled with restless spectral wardens' },
          { id: 'blood_citadel', name: 'Blood Citadel', x: 0.78, y: 0.65, desc: 'Crimson fortress of the Eldritch Sovereign' },
          { id: 'astral_rift', name: 'Astral Rift', x: 0.85, y: 0.85, desc: 'The tear in reality where the ancient gods slumber' }
        ],
        chapters: {
          start: {
            location: 'Shattered Keep - Ruined Courtyard',
            nodeId: 'start',
            objective: 'Breach the iron portcullis into the catacombs.',
            mood: 'blood_crypt',
            enemySprite: '💀',
            enemyName: 'Grave-Knight Revenant',
            speaker: 'Ysolde',
            text: 'A blood-red eclipse hangs frozen in the twilight sky. At the ruined gates of the Sun-King Keep, an armored Grave-Knight stands guard, spectral flame burning inside his rusted visor.',
            choices: [
              { text: '⚔️ Challenge the Grave-Knight to single combat (Combat)', action: 'start_combat', enemy: { name: 'Grave-Knight Revenant', hp: 75, maxHp: 75, attack: 18, sprite: '💀' }, next: 'crypt_entry', failNext: 'crypt_fail' },
              { text: '🕯️ Decipher the glowing ancient warden runes (INT Check)', reqAttr: 'INT', diff: 12, next: 'crypt_entry', failNext: 'crypt_fail' },
              { text: '🗝️ Insert the Seal of the First Wardens into the altar', itemReq: 'ancient_sigil', next: 'crypt_secret_path' }
            ]
          },
          crypt_entry: {
            location: 'The Whispering Catacombs',
            nodeId: 'catacombs',
            objective: 'Navigate the labyrinth of tombs to find the Sun-Fire Relic.',
            mood: 'blood_crypt',
            enemySprite: '👻',
            enemyName: 'Wandering Shade',
            speaker: 'Ancient Shade',
            text: 'You descend into centuries of silence. Sarcophagi line the damp limestone walls, lit by ethereal azure lanterns. A shade materializes before a massive stone vault sealed with an astral dial.',
            choices: [
              { text: '🧩 Solve the Astral Dial Puzzle (Glyph Alignment)', action: 'start_puzzle', puzzleType: 'glyph', next: 'relic_chamber', failNext: 'trap_sprung' },
              { text: '🙏 Channel your spirit willpower to commune with the shade (WIL Check)', reqAttr: 'WIL', diff: 14, next: 'relic_chamber', failNext: 'trap_sprung' }
            ]
          },
          crypt_fail: {
            location: 'Shattered Keep - Moat',
            nodeId: 'start',
            objective: 'Climb out of the moat and regroup.',
            mood: 'blood_crypt',
            enemySprite: '🩹',
            enemyName: 'Battered Armor',
            speaker: 'Ysolde',
            text: 'A heavy mace blow shatters your guard, throwing you into the overgrown moat below. You drink an herb tonic and climb through a drainage sewer into the crypts.',
            rewards: { hpDelta: -25, xp: 20 },
            choices: [
              { text: '🕯️ Push forward into the Catacombs', next: 'crypt_entry' }
            ]
          },
          crypt_secret_path: {
            location: 'Sanctum of the Sun-Wardens',
            nodeId: 'catacombs',
            objective: 'Claim the Sacred Blade of Dawnbringer.',
            mood: 'blood_crypt',
            enemySprite: '✨',
            enemyName: 'Dawnbringer Altar',
            speaker: 'Sanctum Spirit',
            text: 'The ancient seal turns with a resonant bell chime. Secret stairs open directly into the consecrated inner sanctum, revealing the legendary Dawnbringer Greatsword bathed in holy starlight.',
            rewards: { xp: 100, hpDelta: 40 },
            choices: [
              { text: '⚔️ Claim Dawnbringer and march upon the Blood Citadel', next: 'citadel_gates' }
            ]
          },
          relic_chamber: {
            location: 'Inner Tomb of Kings',
            nodeId: 'catacombs',
            objective: 'Equip the Sun-Fire Relic and breach the Blood Citadel.',
            mood: 'blood_crypt',
            enemySprite: '🔥',
            enemyName: 'Sun-Fire Relic',
            speaker: 'Ysolde',
            text: 'The stone vault slides open, unleashing radiant solar warmth that dispels the darkness. You hold the Sun-Fire Relic in your hands.',
            rewards: { xp: 80 },
            choices: [
              { text: '🏰 Storm the gates of the Blood Citadel', next: 'citadel_gates' }
            ]
          },
          trap_sprung: {
            location: 'Collapsing Crypt Corridor',
            nodeId: 'catacombs',
            objective: 'Survive the crypt guardian beasts.',
            mood: 'blood_crypt',
            enemySprite: '🐺',
            enemyName: 'Blood-Hound Fiend',
            speaker: 'Ysolde',
            text: 'The floor gives way, dropping you into a feeding pit where a twin-headed Blood-Hound prowls!',
            choices: [
              { text: '⚔️ Slay the Blood-Hound Fiend (Combat)', action: 'start_combat', enemy: { name: 'Blood-Hound Fiend', hp: 95, maxHp: 95, attack: 22, sprite: '🐺' }, next: 'citadel_gates', failNext: 'ending_executed' }
            ]
          },
          citadel_gates: {
            location: 'The Blood Citadel - Throne Approach',
            nodeId: 'blood_citadel',
            objective: 'Confront the Eldritch Sovereign atop the Blood Spire.',
            mood: 'fire_citadel',
            enemySprite: '🧛',
            enemyName: 'Eldritch Sovereign Malakor',
            speaker: 'Malakor, Blood Sovereign',
            text: 'Rivers of molten crimson cascade down the black basalt walls of the grand throne room. Malakor rises from his bone throne, crowned with eclipsed starlight. "You bring the warmth of a dying sun into my eternal reign, Warden. Submit, or bleed for eternity!"',
            choices: [
              { text: '⚔️ Slay Sovereign Malakor in mortal combat (Boss Battle)', action: 'start_combat', enemy: { name: 'Sovereign Malakor', hp: 140, maxHp: 140, attack: 26, sprite: '🧛' }, next: 'astral_rift_choice', failNext: 'ending_executed' },
              { text: '☀️ Unseal the Sun-Fire Relic to banish his dark aura (WIL Check)', reqAttr: 'WIL', diff: 15, next: 'astral_rift_choice', failNext: 'trap_sprung' }
            ]
          },
          astral_rift_choice: {
            location: 'The Astral Tear Above the Citadel',
            nodeId: 'astral_rift',
            objective: 'Choose the cosmic fate of the realm.',
            mood: 'blood_crypt',
            enemySprite: '🌌',
            enemyName: 'Astral Rift Core',
            speaker: 'The Cosmos',
            text: 'Malakor disintegrates into red ash as the Astral Rift tears open above the spire. The raw primordial essence of creation and void swirls within your reach.',
            choices: [
              { text: '☀️ Restore the Sun: Cleanse the realm and reignite the golden age', next: 'ending_sun_reborn' },
              { text: '🌑 Claim the Eclipse: Ascend as the new Immortal Moon Monarch', next: 'ending_moon_empress' }
            ]
          },
          ending_sun_reborn: {
            location: 'The Golden Valleys',
            nodeId: 'astral_rift',
            objective: 'Victory: The Sun has been Reborn.',
            mood: 'blood_crypt',
            enemySprite: '☀️',
            enemyName: 'Golden Dawn',
            speaker: 'Narrator',
            text: 'The eclipse shatters like dark glass. Brilliant golden sunlight pours across the green mountains and forgotten kingdoms. You stand hailed as the Sovereign of the Dawn.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_moon_empress: {
            location: 'The Throne of Shadows',
            nodeId: 'astral_rift',
            objective: 'Victory: Ruler of the Eternal Eclipse.',
            mood: 'blood_crypt',
            enemySprite: '👑',
            enemyName: 'Eclipse Sovereign',
            speaker: 'Narrator',
            text: 'You don the crown of shadowed starlight. Legions of night-creatures bow before your invincible will.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          }
        }
      },

      /* =========================================================================
         3. COSMIC SCI-FI: VOID ABYSS (Brand New Scenario)
      ========================================================================= */
      void: {
        title: 'Cosmic Odyssey: Void Abyss',
        genre: 'Sci-Fi Cosmic Horror',
        theme: 'void',
        initialObjective: 'Investigate the derelict titan dreadnought orbiting the black hole singularity.',
        mapNodes: [
          { id: 'start', name: 'Derelict Airway', x: 0.18, y: 0.25, desc: 'Airlock hatch of the USSC Eventide dreadnought' },
          { id: 'cryo', name: 'Cryo-Vault Delta', x: 0.45, y: 0.4, desc: 'Frozen chambers where crew members were mutated' },
          { id: 'reactor', name: 'Antimatter Reactor', x: 0.75, y: 0.65, desc: 'Pulsing heart of the ship defying gravity laws' },
          { id: 'singularity', name: 'The Singularity Core', x: 0.88, y: 0.85, desc: 'The event horizon of the cosmic void' }
        ],
        chapters: {
          start: {
            location: 'USSC Eventide - Breached Airlock',
            nodeId: 'start',
            objective: 'Restore auxiliary power without awakening the hive entity.',
            mood: 'void_star',
            enemySprite: '👽',
            enemyName: 'Void Swarm Parasite',
            speaker: 'Cmdr. Rayne',
            text: 'Your mag-boots clamp onto the hull of the derelict dreadnought USSC Eventide. Outside the shattered viewport, a supermassive black hole warps starlight into a swirling violet vortex. Internal sensors detect alien bio-matter pulsing along the ship’s primary conduits.',
            choices: [
              { text: '⚡ Reroute Emergency Circuit Grid (Hacking Mini-Game)', action: 'start_hack', targetName: 'Eventide Mainframe Aux', difficulty: 'easy', next: 'cryo_vault', failNext: 'airlock_swarm' },
              { text: '🔬 Calibrate Tachyon Plasma Cutter to burn bio-nodes (INT Check)', reqAttr: 'INT', diff: 12, next: 'cryo_vault', failNext: 'airlock_swarm' },
              { text: '⚔️ Blast the creeping Void Swarm Parasite (Combat)', action: 'start_combat', enemy: { name: 'Void Swarm Parasite', hp: 70, maxHp: 70, attack: 18, sprite: '👽' }, next: 'cryo_vault', failNext: 'airlock_swarm' }
            ]
          },
          airlock_swarm: {
            location: 'Eventide Cargo Bay',
            nodeId: 'start',
            objective: 'Survive the decompression breach in Cargo Bay 4.',
            mood: 'void_star',
            enemySprite: '💨',
            enemyName: 'Hull Breach',
            speaker: 'Suit AI',
            text: 'Hull integrity fails! Nitrogen clouds and loose debris suck out into space as you desperately latch onto an emergency bulkhead.',
            rewards: { hpDelta: -20, energyDelta: -20 },
            choices: [
              { text: '🦺 Seal the bulkhead with emergency mag-clamps', next: 'cryo_vault' }
            ]
          },
          cryo_vault: {
            location: 'Cryo-Vault Delta',
            nodeId: 'cryo',
            objective: 'Retrieve the captain’s decrypted flight logs.',
            mood: 'void_star',
            enemySprite: '🧊',
            enemyName: 'Frozen Dread-Warden',
            speaker: 'Flight Recorder',
            text: 'Thick frost coats hundreds of cracked stasis pods. In the central chamber, the mutated Dread-Warden guards the primary flight computer.',
            choices: [
              { text: '⚔️ Defeat the Frozen Dread-Warden (Combat)', action: 'start_combat', enemy: { name: 'Frozen Dread-Warden', hp: 90, maxHp: 90, attack: 22, sprite: '🧊' }, next: 'antimatter_room', failNext: 'airlock_swarm' },
              { text: '🧩 Align the Gravitational Pulse Frequency (Glyph Puzzle)', action: 'start_puzzle', puzzleType: 'glyph', next: 'antimatter_room', failNext: 'airlock_swarm' }
            ]
          },
          antimatter_room: {
            location: 'Antimatter Reactor Core',
            nodeId: 'reactor',
            objective: 'Stabilize or overload the core to access the singularity.',
            mood: 'void_star',
            enemySprite: '⚛️',
            enemyName: 'Singularity Overmind',
            speaker: 'The Singularity Entity',
            text: 'The reactor glows with blinding violet tachyon radiation. A sentient cosmic consciousness speaks into your mind across all dimensions simultaneously.',
            choices: [
              { text: '🌌 Transcend: Merge human consciousness with the cosmic singularity (Ascension Ending)', next: 'ending_ascension' },
              { text: '🚀 Purge: Fire thrusters to propel the dreadnought into the black hole and escape via shuttle', next: 'ending_shuttle_escape' }
            ]
          },
          ending_ascension: {
            location: 'Beyond Time and Space',
            nodeId: 'singularity',
            objective: 'Victory: Cosmic Ascension achieved.',
            mood: 'void_star',
            enemySprite: '✨',
            enemyName: 'Cosmic God-Mind',
            speaker: 'Narrator',
            text: 'Your mortal body dissolves into pure gravitational energy. You perceive past, present, and infinite parallel universes simultaneously, navigating galaxies with a thought.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          },
          ending_shuttle_escape: {
            location: 'Deep Space - Starlight Vector',
            nodeId: 'start',
            objective: 'Victory: Escaped the Singularity.',
            mood: 'void_star',
            enemySprite: '🚀',
            enemyName: 'Rescue Corvette',
            speaker: 'Narrator',
            text: 'Your emergency shuttle fires full afterburners as the dreadnought collapses into the black hole. You set course for Earth with humanity’s greatest cosmic secret.',
            choices: [
              { text: '🔄 Restart Campaign / Choose Another Run', action: 'reset' }
            ]
          }
        }
      }
    };

    // Load active character
    this.character = JSON.parse(JSON.stringify(this.characterTemplates[this.currentScenarioKey] || this.characterTemplates.cyberpunk));
  }

  /* -------------------------------------------------------------
     TACTICAL TURN-BASED COMBAT ENGINE
  ------------------------------------------------------------- */
  startCombat(enemyData, winNext, loseNext) {
    this.activeCombat = {
      enemy: {
        name: enemyData.name || 'Hostile',
        hp: enemyData.hp || 80,
        maxHp: enemyData.maxHp || 80,
        attack: enemyData.attack || 15,
        sprite: enemyData.sprite || '🤖'
      },
      playerShield: 0,
      turn: 1,
      log: [`Combat initiated with ${enemyData.name}!`],
      winNext: winNext,
      loseNext: loseNext
    };
    if (window.audioSynth) window.audioSynth.setCombatMode(true);
    return this.activeCombat;
  }

  playerCombatAction(actionType) {
    if (!this.activeCombat) return null;
    const c = this.activeCombat;
    const hero = this.character;
    const isCyber = this.currentScenarioKey === 'cyberpunk';

    let playerDmg = 0;
    let heroActionMsg = '';

    if (actionType === 'strike') {
      const wepDmg = (hero.equipment && hero.equipment.weapon && hero.equipment.weapon.dmg) || 20;
      const strBonus = Math.floor((hero.attrs.STR || 10) / 3);
      playerDmg = Math.floor(wepDmg + strBonus + (Math.random() * 8 - 4));
      c.enemy.hp = Math.max(0, c.enemy.hp - playerDmg);
      heroActionMsg = `💥 You strike ${c.enemy.name} for ${playerDmg} damage!`;
      if (window.audioSynth) window.audioSynth.playSlash();
    } else if (actionType === 'special') {
      if (hero.energy >= 20) {
        hero.energy -= 20;
        const intBonus = Math.floor((hero.attrs.INT || 10) / 2);
        playerDmg = Math.floor(35 + intBonus + (Math.random() * 10));
        c.enemy.hp = Math.max(0, c.enemy.hp - playerDmg);
        heroActionMsg = isCyber
          ? `⚡ Neural Overload deals ${playerDmg} critical EMP damage!`
          : `🔥 Solar Arc Blast strikes ${c.enemy.name} for ${playerDmg} holy damage!`;
        if (window.audioSynth) window.audioSynth.playLaserShot();
      } else {
        heroActionMsg = `⚠️ Not enough Energy for Special Action!`;
      }
    } else if (actionType === 'shield') {
      c.playerShield += 25;
      heroActionMsg = `🛡️ You deploy defensive barriers (+25 Shield)!`;
      if (window.audioSynth) window.audioSynth.playShieldHit();
    } else if (actionType === 'item') {
      const med = hero.inventory.find(i => i.type === 'heal' && i.qty > 0);
      if (med) {
        med.qty--;
        hero.hp = Math.min(hero.maxHp, hero.hp + med.val);
        heroActionMsg = `💉 Used ${med.name} (+${med.val} HP)!`;
        if (window.audioSynth) window.audioSynth.playSuccess();
      } else {
        heroActionMsg = `⚠️ No healing consumables in inventory!`;
      }
    }

    c.log.push(heroActionMsg);

    // Check Enemy Defeat
    if (c.enemy.hp <= 0) {
      c.log.push(`🏆 ${c.enemy.name} was defeated!`);
      hero.xp += 50;
      if (window.audioSynth) {
        window.audioSynth.playSuccess();
        window.audioSynth.setCombatMode(false);
      }
      return { status: 'win', next: c.winNext };
    }

    // Enemy Turn
    const enemyAtk = Math.max(8, Math.floor(c.enemy.attack + (Math.random() * 6 - 3)));
    let actualDmg = enemyAtk;

    if (c.playerShield > 0) {
      if (c.playerShield >= actualDmg) {
        c.playerShield -= actualDmg;
        actualDmg = 0;
        c.log.push(`🛡️ Your shield completely absorbed ${c.enemy.name}'s attack!`);
      } else {
        actualDmg -= c.playerShield;
        c.playerShield = 0;
        hero.hp = Math.max(0, hero.hp - actualDmg);
        c.log.push(`⚔️ Shield broke! ${c.enemy.name} hits you for ${actualDmg} damage!`);
      }
    } else {
      hero.hp = Math.max(0, hero.hp - actualDmg);
      c.log.push(`⚔️ ${c.enemy.name} attacks you for ${actualDmg} damage!`);
    }

    c.turn++;

    // Check Player Defeat
    if (hero.hp <= 0) {
      c.log.push(`💀 You have fallen in battle...`);
      if (window.audioSynth) {
        window.audioSynth.playFailure();
        window.audioSynth.setCombatMode(false);
      }
      return { status: 'lose', next: c.loseNext };
    }

    return { status: 'ongoing' };
  }

  /* -------------------------------------------------------------
     HACKING MATRIX & GLYPH PUZZLE ENGINE
  ------------------------------------------------------------- */
  startHackingGame(targetName, difficulty = 'medium', winNext, failNext) {
    const size = difficulty === 'hard' ? 4 : 3;
    const targetPattern = [];
    for (let i = 0; i < (difficulty === 'hard' ? 5 : 3); i++) {
      targetPattern.push(Math.floor(Math.random() * (size * size)));
    }

    this.activeHack = {
      targetName: targetName || 'Security Matrix',
      size: size,
      turnsLeft: difficulty === 'hard' ? 7 : 5,
      sequence: targetPattern,
      currentStep: 0,
      grid: Array.from({ length: size * size }, (_, idx) => ({
        id: idx,
        hex: Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0')
      })),
      winNext: winNext,
      failNext: failNext
    };
    return this.activeHack;
  }

  hackGridNode(nodeId) {
    if (!this.activeHack) return null;
    const h = this.activeHack;
    const expectedNode = h.sequence[h.currentStep];

    if (nodeId === expectedNode) {
      h.currentStep++;
      if (window.audioSynth) window.audioSynth.playHackingBeep();

      if (h.currentStep >= h.sequence.length) {
        this.activeHack = null;
        if (window.audioSynth) window.audioSynth.playSuccess();
        return { status: 'win', next: h.winNext };
      }
    } else {
      h.turnsLeft--;
      if (window.audioSynth) window.audioSynth.playGlitch();

      if (h.turnsLeft <= 0) {
        this.activeHack = null;
        if (window.audioSynth) window.audioSynth.playFailure();
        return { status: 'fail', next: h.failNext };
      }
    }
    return { status: 'ongoing', currentStep: h.currentStep, turnsLeft: h.turnsLeft };
  }

  /* -------------------------------------------------------------
     SCENARIO & CHAPTER NAVIGATION
  ------------------------------------------------------------- */
  getScenario() {
    return this.scenarios[this.currentScenarioKey] || this.scenarios.cyberpunk;
  }

  getChapter(chapterId = this.currentChapterId) {
    const scenario = this.getScenario();
    return scenario.chapters[chapterId] || scenario.chapters.start;
  }

  setScenario(key) {
    if (!this.scenarios[key]) return;
    this.currentScenarioKey = key;
    localStorage.setItem('nexus_scenario', key);
    this.character = JSON.parse(JSON.stringify(this.characterTemplates[key] || this.characterTemplates.cyberpunk));
    this.currentChapterId = 'start';
    this.storyHistory = [];
    this.activeCombat = null;
    this.activeHack = null;
    if (window.audioSynth) window.audioSynth.setTheme(key);
  }

  resetRun() {
    this.character = JSON.parse(JSON.stringify(this.characterTemplates[this.currentScenarioKey] || this.characterTemplates.cyberpunk));
    this.currentChapterId = 'start';
    this.storyHistory = [];
    this.activeCombat = null;
    this.activeHack = null;
    if (window.audioSynth) window.audioSynth.setCombatMode(false);
  }

  equipItem(slot, item) {
    if (!this.character.equipment) this.character.equipment = {};
    this.character.equipment[slot] = item;
  }
}

window.storyEngine = new StoryEngine();
