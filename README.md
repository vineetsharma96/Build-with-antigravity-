# TYPE // TANK 🛡️🎯
### Tactical 180° Ballistic Defense Arcade Terminal

**TYPE//TANK** is an authentic retro DOS / arcade terminal typing defense simulator built purely with **HTML5, CSS, and vanilla JavaScript**. It features native procedural Web Audio sound synthesis and high-performance HTML5 Canvas 2D graphics with zero external libraries, frameworks, or audio files.

---

## 🕹️ Game Overview

Enemy warheads and tactical payloads descend from the upper airspace. Take command of an armored 180° servo-driven ballistic cannon to defend the ground perimeter. Type the characters of falling threats to aim and fire kinetic tracer rounds.

---

## ✨ Features

- **Authentic DOS / Arcade Aesthetic**:
  - Phosphor green, amber alerts, and crimson-red high-threat highlights.
  - Authentic retro arcade typography (`Press Start 2P`, `Share Tech Mono`, `VT323`).
  - Realistic CRT scanlines, cathode vignette, phosphor bloom, and a toggleable CRT overlay.
  - Bracketed DOS headers, ASCII marquee, and tactile military terminal UI.

- **Dynamic Aspect Ratio & Viewport Fit**:
  - **`AUTO [SCREEN FIT]`**: Fluid full-screen scaling without letterboxing.
  - **`16:9 [WIDESCREEN]`**: Centered cabinet with side bezels and deep cathode shadows.
  - **`4:3 [CLASSIC CRT]`**: Vintage arcade monitor ratio with authentic pillarboxing.
  - Responsive 100% zoom viewport fit with zero scroll-clipping on all standard displays.

- **Ballistic Combat Mechanics**:
  - Semicircular dome tank with animated treads, armor plating, and 180° servo turret.
  - Recoil pushback and muzzle flash particle explosions on every shot fired.
  - Visible ballistic projectiles with glowing tracer trails.
  - **Lowest-First Priority**: When multiple falling words share the same initial letter, the turret automatically locks onto the lowest / bottom-most threat.
  - **Kinetic Fire & Fade**: Typed characters instantly drop to ~35–40% opacity while uncompleted characters stay bright.

- **Crimson Bonus Threats**:
  - Rare high-speed red targets granting **3.5× score multipliers**.
  - Active crimson targets temporarily suppress same-initial words from spawning, followed by a **3-second exclusion cooldown window**.

- **4 Tactical Arsenal Modes**:
  - **Mode 1 [Alpha]**: Lowercase tactical words (`tank`, `radar`, `artillery`).
  - **Mode 2 [Bravo]**: Lowercase + Uppercase recon terms (`Tank`, `RadarX`, `DeltaForce`).
  - **Mode 3 [Charlie]**: Lowercase + Uppercase + Numbers (`Squad5`, `Tank99`, `v2.0`).
  - **Mode 4 [Delta]**: Full ballistic matrix (`[tank-01]`, `(8+9)`, `!alert!`).
  - Bi-directionally synchronized with granular character matrix toggles.

- **100% Native Procedural Web Audio API**:
  - Downward laser pitch sweeps.
  - Sub-bass metallic thump explosions.
  - High-pitched dual-tone crimson spawn sirens.
  - Distorted crunch buzz on perimeter damage.
  - Multi-tone victory fanfare arpeggios for new personal records.
  - Tactile terminal clicks and mute toggles.

- **Flight Logs & Record Celebrations**:
  - Lifetime operator statistics (Top Score, Peak WPM, Lifetime Accuracy, Total Kills).
  - Mode Bests Quad (Personal bests tracked per mode).
  - Filterable flight logs table with `★ PB` indicators.
  - Arcade record celebration banner and full-screen confetti particle burst on new high scores.

---

## ⌨️ Controls

| Key | Action |
| :--- | :--- |
| **`[A-Z, 0-9, Symbols]`** | Aim and fire cannon at hostiles in real time |
| **`[ENTER]` or `[SPACE]`** | Confirm prompts, advance screens, and repeat sortie |
| **`[ESC]`** | Abort combat sortie / return to base |
| **`[R]`** | Open Flight Logs (My Records) from debriefing screen |
| **`[M]`** | Open Arsenal Configuration from debriefing screen |
| **Header Controls** | Toggle CRT, Mute Audio, Cycle Aspect Ratio, Switch Callsign |

---

## 🚀 Running Locally

No installation or build steps required. Simply serve the files statically using any local web server:

```bash
# Using Python
python -m http.server 8844

# Or using Node
npx serve .
```

Open [http://localhost:8844](http://localhost:8844) in any modern web browser.

---

## 📂 Project Structure

```
├── index.html       # Semantic layout, marquee HUD, terminal screens, modals
├── style.css        # DOS CRT styling, aspect ratio framing, responsive layout
├── js/
│   ├── words.js     # Dictionaries for Modes 1-4, crimson threats, exclusion engine
│   ├── audio.js     # Native Web Audio API procedural synthesizer
│   ├── storage.js   # LocalStorage engine for records, logs, and settings
│   ├── game.js      # 60 FPS Canvas 2D engine, turret physics, ballistic tracers
│   └── app.js       # State machine, keyboard routing, record celebrations
└── README.md
```
