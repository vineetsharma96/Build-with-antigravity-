/**
 * TYPE//TANK - Application Controller & State Machine
 * Coordinates screen navigation, keyboard shortcuts, aspect ratio management,
 * bi-directional arsenal settings synchronization, debriefing, and records.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Screen Identifiers
  const SCREENS = {
    LOGIN: "screenLogin",
    SETTINGS: "screenSettings",
    INSTRUCTIONS: "screenInstructions",
    GAME: "screenGame",
    RESULT: "screenResult",
    RECORDS: "screenRecords"
  };

  let currentScreen = SCREENS.LOGIN;
  let activeModal = null;
  let selectedMode = window.StorageEngine.getMode();
  let currentCallsign = window.StorageEngine.getCallsign();
  let selectedAspect = window.StorageEngine.getAspect();
  let lastSortieStats = null;

  // DOM Elements - Screens
  const screenElements = {
    [SCREENS.LOGIN]: document.getElementById("screenLogin"),
    [SCREENS.SETTINGS]: document.getElementById("screenSettings"),
    [SCREENS.INSTRUCTIONS]: document.getElementById("screenInstructions"),
    [SCREENS.GAME]: document.getElementById("screenGame"),
    [SCREENS.RESULT]: document.getElementById("screenResult"),
    [SCREENS.RECORDS]: document.getElementById("screenRecords")
  };

  // DOM Elements - Cabinet & Layout
  const arcadeCabinet = document.getElementById("arcadeCabinet");
  const crtOverlay = document.getElementById("crtOverlay");
  const headerCallsign = document.getElementById("headerCallsign");
  const crtStatusText = document.getElementById("crtStatusText");
  const audioStatusText = document.getElementById("audioStatusText");
  const aspectStatusText = document.getElementById("aspectStatusText");

  // DOM Elements - Login
  const callsignInput = document.getElementById("callsignInput");
  const btnLoginSubmit = document.getElementById("btnLoginSubmit");

  // DOM Elements - Settings
  const modeCards = document.querySelectorAll(".mode-card");
  const chkUpper = document.getElementById("chkUpper");
  const chkNumbers = document.getElementById("chkNumbers");
  const chkSpecials = document.getElementById("chkSpecials");
  const boxUpper = document.getElementById("boxUpper");
  const boxNumbers = document.getElementById("boxNumbers");
  const boxSpecials = document.getElementById("boxSpecials");
  const aspectButtons = document.querySelectorAll(".aspect-btn");
  const streamPreviewBar = document.getElementById("streamPreviewBar");
  const btnSettingsBack = document.getElementById("btnSettingsBack");
  const btnSettingsNext = document.getElementById("btnSettingsNext");

  // DOM Elements - Instructions
  const btnInstructionsBack = document.getElementById("btnInstructionsBack");
  const btnInstructionsStart = document.getElementById("btnInstructionsStart");

  // DOM Elements - In-Game HUD
  const hudOp = document.getElementById("hudOp");
  const hudMode = document.getElementById("hudMode");
  const hudScore = document.getElementById("hudScore");
  const hudCombo = document.getElementById("hudCombo");
  const hudWpm = document.getElementById("hudWpm");
  const hudAcc = document.getElementById("hudAcc");
  const hudHullFill = document.getElementById("hudHullFill");
  const hudHullText = document.getElementById("hudHullText");
  const btnAbortGame = document.getElementById("btnAbortGame");
  const gameCanvas = document.getElementById("gameCanvas");

  // DOM Elements - Result / Debrief
  const recordBanner = document.getElementById("recordBanner");
  const debriefOp = document.getElementById("debriefOp");
  const debriefMode = document.getElementById("debriefMode");
  const debriefStatus = document.getElementById("debriefStatus");
  const recordComparisonBar = document.getElementById("recordComparisonBar");
  const metricScore = document.getElementById("metricScore");
  const metricWpm = document.getElementById("metricWpm");
  const metricAcc = document.getElementById("metricAcc");
  const metricWords = document.getElementById("metricWords");
  const metricCombo = document.getElementById("metricCombo");
  const metricTime = document.getElementById("metricTime");
  const btnResultConfig = document.getElementById("btnResultConfig");
  const btnResultLogs = document.getElementById("btnResultLogs");
  const btnResultRepeat = document.getElementById("btnResultRepeat");

  // DOM Elements - My Records
  const statBestScore = document.getElementById("statBestScore");
  const statMaxWpm = document.getElementById("statMaxWpm");
  const statAvgAcc = document.getElementById("statAvgAcc");
  const statTotalWords = document.getElementById("statTotalWords");
  const mb1Score = document.getElementById("mb1Score");
  const mb1Wpm = document.getElementById("mb1Wpm");
  const mb1Runs = document.getElementById("mb1Runs");
  const mb2Score = document.getElementById("mb2Score");
  const mb2Wpm = document.getElementById("mb2Wpm");
  const mb2Runs = document.getElementById("mb2Runs");
  const mb3Score = document.getElementById("mb3Score");
  const mb3Wpm = document.getElementById("mb3Wpm");
  const mb3Runs = document.getElementById("mb3Runs");
  const mb4Score = document.getElementById("mb4Score");
  const mb4Wpm = document.getElementById("mb4Wpm");
  const mb4Runs = document.getElementById("mb4Runs");
  const flightLogsTbody = document.getElementById("flightLogsTbody");
  const filterChips = document.querySelectorAll(".filter-chip");
  const btnPurgeLogsPrompt = document.getElementById("btnPurgeLogsPrompt");
  const btnRecordsBack = document.getElementById("btnRecordsBack");

  // DOM Elements - Modals
  const modalAbort = document.getElementById("modalAbort");
  const btnAbortCancel = document.getElementById("btnAbortCancel");
  const btnAbortConfirm = document.getElementById("btnAbortConfirm");

  const modalPurge = document.getElementById("modalPurge");
  const btnPurgeCancel = document.getElementById("btnPurgeCancel");
  const btnPurgeConfirm = document.getElementById("btnPurgeConfirm");

  const modalCallsign = document.getElementById("modalCallsign");
  const modalCallsignInput = document.getElementById("modalCallsignInput");
  const btnCallsignCancel = document.getElementById("btnCallsignCancel");
  const btnCallsignSave = document.getElementById("btnCallsignSave");

  // DOM Elements - Header Controls
  const btnSwitchCallsign = document.getElementById("btnSwitchCallsign");
  const btnToggleCrt = document.getElementById("btnToggleCrt");
  const btnToggleAudio = document.getElementById("btnToggleAudio");
  const btnCycleAspect = document.getElementById("btnCycleAspect");
  const btnHeaderLogs = document.getElementById("btnHeaderLogs");

  // Confetti Canvas
  const confettiCanvas = document.getElementById("confettiCanvas");

  // --- Initialize Combat Game Engine ---
  const game = new window.TankDefenseGame(
    gameCanvas,
    handleGameOver,
    updateHudStats
  );

  // ==========================================================================
  // NAVIGATION & STATE MACHINE
  // ==========================================================================

  function showScreen(screenId) {
    if (currentScreen === SCREENS.GAME && screenId !== SCREENS.GAME) {
      game.stop();
    }

    Object.values(screenElements).forEach(el => {
      if (el) el.classList.remove("active-view");
    });

    if (screenElements[screenId]) {
      screenElements[screenId].classList.add("active-view");
    }

    currentScreen = screenId;
    window.RetroAudio.playTerminalClick();

    // Screen specific hooks
    if (screenId === SCREENS.SETTINGS) {
      updateSettingsUI();
    } else if (screenId === SCREENS.GAME) {
      startGameSortie();
    } else if (screenId === SCREENS.RECORDS) {
      renderRecordsScreen();
    }
  }

  function openModal(modalEl) {
    activeModal = modalEl;
    modalEl.classList.remove("hidden");
    window.RetroAudio.playTerminalClick();
  }

  function closeModal() {
    if (activeModal) {
      activeModal.classList.add("hidden");
      activeModal = null;
      window.RetroAudio.playTerminalClick();
    }
  }

  // ==========================================================================
  // HEADER HUD & GLOBAL TOGGLES
  // ==========================================================================

  function refreshHeader() {
    headerCallsign.textContent = currentCallsign;
    hudOp.textContent = currentCallsign;

    // CRT Status
    const isCrt = window.StorageEngine.getCrt();
    if (isCrt) {
      document.body.classList.add("crt-enabled");
      crtStatusText.textContent = "ON";
      btnToggleCrt.setAttribute("aria-pressed", "true");
    } else {
      document.body.classList.remove("crt-enabled");
      crtStatusText.textContent = "OFF";
      btnToggleCrt.setAttribute("aria-pressed", "false");
    }

    // Audio Status
    const isMuted = window.RetroAudio.isMuted;
    audioStatusText.textContent = isMuted ? "OFF" : "ON";
    btnToggleAudio.setAttribute("aria-pressed", isMuted ? "false" : "true");

    // Aspect Ratio
    applyAspect(selectedAspect);
  }

  function applyAspect(aspect) {
    selectedAspect = window.StorageEngine.setAspect(aspect);
    aspectStatusText.textContent = selectedAspect;

    arcadeCabinet.classList.remove("aspect-auto", "aspect-16-9", "aspect-4-3");
    if (selectedAspect === "16:9") {
      arcadeCabinet.classList.add("aspect-16-9");
    } else if (selectedAspect === "4:3") {
      arcadeCabinet.classList.add("aspect-4-3");
    } else {
      arcadeCabinet.classList.add("aspect-auto");
    }

    // Update settings screen aspect buttons
    aspectButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.aspect === selectedAspect);
    });

    // Recalibrate game canvas
    setTimeout(() => {
      game.resize();
    }, 50);
  }

  btnToggleCrt.addEventListener("click", () => {
    const newState = !window.StorageEngine.getCrt();
    window.StorageEngine.setCrt(newState);
    refreshHeader();
    window.RetroAudio.playTerminalClick();
  });

  btnToggleAudio.addEventListener("click", () => {
    const isMuted = window.RetroAudio.toggleMute();
    audioStatusText.textContent = isMuted ? "OFF" : "ON";
    btnToggleAudio.setAttribute("aria-pressed", isMuted ? "false" : "true");
    window.RetroAudio.playTerminalClick();
  });

  btnCycleAspect.addEventListener("click", () => {
    const modes = ["AUTO", "16:9", "4:3"];
    const idx = modes.indexOf(selectedAspect);
    const nextAspect = modes[(idx + 1) % modes.length];
    applyAspect(nextAspect);
    window.RetroAudio.playTerminalClick();
  });

  btnSwitchCallsign.addEventListener("click", () => {
    modalCallsignInput.value = currentCallsign;
    openModal(modalCallsign);
    setTimeout(() => modalCallsignInput.focus(), 50);
  });

  btnHeaderLogs.addEventListener("click", () => {
    if (currentScreen === SCREENS.GAME) {
      game.pause();
      openModal(modalAbort);
    } else {
      showScreen(SCREENS.RECORDS);
    }
  });

  // ==========================================================================
  // SCREEN 1: LOGIN & CALLSIGN
  // ==========================================================================

  function handleLoginSubmit() {
    const val = callsignInput.value.trim();
    if (val) {
      currentCallsign = window.StorageEngine.setCallsign(val);
    } else {
      currentCallsign = window.StorageEngine.getCallsign();
    }
    refreshHeader();
    showScreen(SCREENS.SETTINGS);
  }

  btnLoginSubmit.addEventListener("click", handleLoginSubmit);
  callsignInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleLoginSubmit();
    }
  });

  // ==========================================================================
  // SCREEN 2: SETTINGS (ARSENAL & DISPLAY CONFIGURATION)
  // ==========================================================================

  function setMode(modeNum) {
    selectedMode = window.StorageEngine.setMode(modeNum);

    // Sync mode cards
    modeCards.forEach(c => {
      const isCur = Number(c.dataset.mode) === selectedMode;
      c.classList.toggle("active", isCur);
      c.setAttribute("aria-checked", isCur ? "true" : "false");
    });

    // Bi-directionally sync granular matrix toggles
    // Mode 1: none
    // Mode 2: Upper
    // Mode 3: Upper + Numbers
    // Mode 4: Upper + Numbers + Specials
    chkUpper.checked = selectedMode >= 2;
    chkNumbers.checked = selectedMode >= 3;
    chkSpecials.checked = selectedMode >= 4;

    boxUpper.textContent = chkUpper.checked ? "[X]" : "[ ]";
    boxNumbers.textContent = chkNumbers.checked ? "[X]" : "[ ]";
    boxSpecials.textContent = chkSpecials.checked ? "[X]" : "[ ]";

    // Update dynamic stream preview bar
    updatePreviewBar();
  }

  function updateMatrixFromCheckboxes() {
    let mode = 1;
    if (chkSpecials.checked) {
      mode = 4;
      chkUpper.checked = true;
      chkNumbers.checked = true;
    } else if (chkNumbers.checked) {
      mode = 3;
      chkUpper.checked = true;
    } else if (chkUpper.checked) {
      mode = 2;
    } else {
      mode = 1;
    }

    setMode(mode);
  }

  function updatePreviewBar() {
    const samples = window.WordManager.getSampleWords(selectedMode, 6);
    streamPreviewBar.textContent = samples.join("  ///  ");
  }

  function updateSettingsUI() {
    setMode(selectedMode);
    aspectButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.aspect === selectedAspect);
    });
  }

  modeCards.forEach(card => {
    card.addEventListener("click", () => {
      const mode = Number(card.dataset.mode);
      setMode(mode);
      window.RetroAudio.playTerminalClick();
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const mode = Number(card.dataset.mode);
        setMode(mode);
        window.RetroAudio.playTerminalClick();
      }
    });
  });

  [chkUpper, chkNumbers, chkSpecials].forEach(chk => {
    chk.addEventListener("change", () => {
      updateMatrixFromCheckboxes();
      window.RetroAudio.playTerminalClick();
    });
  });

  aspectButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      applyAspect(btn.dataset.aspect);
      window.RetroAudio.playTerminalClick();
    });
  });

  btnSettingsBack.addEventListener("click", () => {
    showScreen(SCREENS.LOGIN);
    callsignInput.focus();
  });

  btnSettingsNext.addEventListener("click", () => {
    showScreen(SCREENS.INSTRUCTIONS);
  });

  // ==========================================================================
  // SCREEN 3: INSTRUCTIONS & COMBAT BRIEFING
  // ==========================================================================

  btnInstructionsBack.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
  });

  btnInstructionsStart.addEventListener("click", () => {
    showScreen(SCREENS.GAME);
  });

  // ==========================================================================
  // SCREEN 4: GAME ARENA & REAL-TIME STATS HUD
  // ==========================================================================

  function getModeName(m) {
    switch (Number(m)) {
      case 2: return "BRAVO";
      case 3: return "CHARLIE";
      case 4: return "DELTA";
      case 1:
      default: return "ALPHA";
    }
  }

  function startGameSortie() {
    hudOp.textContent = currentCallsign;
    hudMode.textContent = getModeName(selectedMode);
    hudScore.textContent = "000000";
    hudCombo.textContent = "x1.0";
    hudWpm.textContent = "00";
    hudAcc.textContent = "100%";
    hudHullFill.style.width = "100%";
    hudHullFill.className = "hull-meter-fill fill-green";
    hudHullText.textContent = "100%";

    game.start(selectedMode, currentCallsign);
  }

  function updateHudStats(stats) {
    hudScore.textContent = String(stats.score).padStart(6, "0");
    hudCombo.textContent = `x${stats.combo.toFixed(1)}`;
    hudWpm.textContent = String(stats.wpm).padStart(2, "0");
    hudAcc.textContent = `${stats.accuracy}%`;
    hudHullText.textContent = `${stats.hull}%`;

    // Hull meter color-reactive states
    hudHullFill.style.width = `${stats.hull}%`;
    if (stats.hull > 50) {
      hudHullFill.className = "hull-meter-fill fill-green";
    } else if (stats.hull >= 25) {
      hudHullFill.className = "hull-meter-fill fill-amber";
    } else {
      hudHullFill.className = "hull-meter-fill fill-red";
    }
  }

  btnAbortGame.addEventListener("click", () => {
    game.pause();
    openModal(modalAbort);
  });

  // ==========================================================================
  // SCREEN 5: RESULT & SORTIE DEBRIEFING
  // ==========================================================================

  function handleGameOver(finalStats) {
    lastSortieStats = finalStats;

    // Check if new personal best for this specific mode
    const recordEval = window.StorageEngine.evaluateRecord(finalStats);
    const isNewPB = recordEval.isNewPB;

    // Format flight log entry
    const now = new Date();
    const logEntry = {
      id: Date.now(),
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      operator: currentCallsign,
      mode: finalStats.mode,
      score: finalStats.score,
      wpm: finalStats.wpm,
      accuracy: finalStats.accuracy,
      wordsDestroyed: finalStats.wordsDestroyed,
      crimsonDestroyed: finalStats.crimsonDestroyed,
      maxCombo: finalStats.maxCombo,
      survivalTimeSec: finalStats.survivalTimeSec,
      isPB: isNewPB
    };

    // Save log entry to localStorage
    window.StorageEngine.saveLog(logEntry);

    // Populate Debrief Screen
    debriefOp.textContent = currentCallsign;
    debriefMode.textContent = `MODE ${finalStats.mode} [${getModeName(finalStats.mode)}]`;
    debriefStatus.textContent = finalStats.hull > 0 ? "SORTIE ABORTED" : "DEFENSE BREACHED";
    debriefStatus.className = finalStats.hull > 0 ? "status-aborted" : "status-destroyed";

    metricScore.textContent = String(finalStats.score).padStart(6, "0");
    metricWpm.textContent = String(finalStats.wpm).padStart(2, "0");
    metricAcc.textContent = `${finalStats.accuracy}%`;
    metricWords.innerHTML = `${finalStats.wordsDestroyed} <span class="metric-sub">(${finalStats.crimsonDestroyed} CRIMSON)</span>`;
    metricCombo.textContent = `x${finalStats.maxCombo.toFixed(1)}`;

    const mins = Math.floor(finalStats.survivalTimeSec / 60);
    const secs = finalStats.survivalTimeSec % 60;
    metricTime.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    // Arcade Record Celebration Handling
    if (isNewPB) {
      recordBanner.classList.remove("hidden");
      recordComparisonBar.textContent = `★ OUTPERFORMED PRIOR MODE RECORD! NEW COMBAT BENCHMARK ESTABLISHED! ★`;
      window.RetroAudio.playFanfare();
      triggerConfettiCelebration();
    } else {
      recordBanner.classList.add("hidden");
      const deltaScore = recordEval.deltaScore;
      const deltaWpm = recordEval.deltaWpm;
      recordComparisonBar.textContent = `MODE RECORD: ${recordEval.prevBestScore} PTS | ${recordEval.prevBestWpm} WPM (DELTA TO SURPASS: +${Math.abs(deltaScore)} PTS / +${Math.abs(deltaWpm)} WPM)`;
    }

    showScreen(SCREENS.RESULT);
  }

  btnResultRepeat.addEventListener("click", () => {
    showScreen(SCREENS.GAME);
  });

  btnResultConfig.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
  });

  btnResultLogs.addEventListener("click", () => {
    showScreen(SCREENS.RECORDS);
  });

  // ==========================================================================
  // SCREEN 6: MY RECORDS / FLIGHT LOGS
  // ==========================================================================

  let currentLogFilter = "ALL";

  function renderRecordsScreen() {
    // 1. Lifetime Operator Overview
    const lifetime = window.StorageEngine.getLifetimeStats();
    statBestScore.textContent = String(lifetime.bestScore);
    statMaxWpm.textContent = String(lifetime.maxWpm);
    statAvgAcc.textContent = `${lifetime.avgAcc}%`;
    statTotalWords.textContent = String(lifetime.totalWords);

    // 2. Mode Bests Quad
    const mb1 = window.StorageEngine.getModeBest(1);
    mb1Score.textContent = mb1.score;
    mb1Wpm.textContent = mb1.wpm;
    mb1Runs.textContent = mb1.sorties;

    const mb2 = window.StorageEngine.getModeBest(2);
    mb2Score.textContent = mb2.score;
    mb2Wpm.textContent = mb2.wpm;
    mb2Runs.textContent = mb2.sorties;

    const mb3 = window.StorageEngine.getModeBest(3);
    mb3Score.textContent = mb3.score;
    mb3Wpm.textContent = mb3.wpm;
    mb3Runs.textContent = mb3.sorties;

    const mb4 = window.StorageEngine.getModeBest(4);
    mb4Score.textContent = mb4.score;
    mb4Wpm.textContent = mb4.wpm;
    mb4Runs.textContent = mb4.sorties;

    // 3. Render Table Rows
    renderFlightLogsTable();
  }

  function renderFlightLogsTable() {
    const logs = window.StorageEngine.getLogs();
    const filtered = currentLogFilter === "ALL"
      ? logs
      : logs.filter(l => Number(l.mode) === Number(currentLogFilter));

    flightLogsTbody.innerHTML = "";

    if (filtered.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="8" style="text-align: center; color: #558855; padding: 12px;">-- NO SORTIE LOGS RECORDED FOR THIS CRITERIA --</td>`;
      flightLogsTbody.appendChild(emptyRow);
      return;
    }

    filtered.forEach(log => {
      const tr = document.createElement("tr");
      const pbBadge = log.isPB ? `<span class="badge-pb">★ PB</span>` : "";
      tr.innerHTML = `
        <td>${log.timestamp}</td>
        <td>MODE ${log.mode} [${getModeName(log.mode)}]</td>
        <td><strong>${log.score}</strong>${pbBadge}</td>
        <td>${log.wpm}</td>
        <td>${log.accuracy}%</td>
        <td>x${Number(log.maxCombo).toFixed(1)}</td>
        <td>${log.wordsDestroyed} (${log.crimsonDestroyed || 0}★)</td>
        <td>${log.hull > 0 ? "ABORT" : "DESTROYED"}</td>
      `;
      flightLogsTbody.appendChild(tr);
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentLogFilter = chip.dataset.filter;
      renderFlightLogsTable();
      window.RetroAudio.playTerminalClick();
    });
  });

  btnPurgeLogsPrompt.addEventListener("click", () => {
    openModal(modalPurge);
  });

  btnRecordsBack.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
  });

  // ==========================================================================
  // MODAL ACTIONS
  // ==========================================================================

  // Abort Modal
  btnAbortCancel.addEventListener("click", () => {
    closeModal();
    game.resume();
  });

  btnAbortConfirm.addEventListener("click", () => {
    closeModal();
    const liveStats = game.getLiveStats();
    game.stop();
    handleGameOver(liveStats);
  });

  // Purge Modal
  btnPurgeCancel.addEventListener("click", () => {
    closeModal();
  });

  btnPurgeConfirm.addEventListener("click", () => {
    window.StorageEngine.purgeLogs();
    closeModal();
    renderRecordsScreen();
    window.RetroAudio.playDamageCrunch();
  });

  // Callsign Modal
  btnCallsignCancel.addEventListener("click", () => {
    closeModal();
  });

  btnCallsignSave.addEventListener("click", () => {
    const val = modalCallsignInput.value.trim();
    if (val) {
      currentCallsign = window.StorageEngine.setCallsign(val);
      refreshHeader();
    }
    closeModal();
  });

  // ==========================================================================
  // GLOBAL KEYBOARD ACCESSIBILITY & ROUTING
  // ==========================================================================

  window.addEventListener("keydown", (e) => {
    // 1. If Modal is Open
    if (activeModal) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (activeModal === modalAbort) {
          btnAbortCancel.click();
        } else if (activeModal === modalPurge) {
          btnPurgeCancel.click();
        } else if (activeModal === modalCallsign) {
          btnCallsignCancel.click();
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeModal === modalAbort) {
          btnAbortConfirm.click();
        } else if (activeModal === modalPurge) {
          btnPurgeConfirm.click();
        } else if (activeModal === modalCallsign) {
          btnCallsignSave.click();
        }
        return;
      }
      return;
    }

    // 2. Global Hotkey: ESC in Combat Arena -> Abort Modal
    if (currentScreen === SCREENS.GAME) {
      if (e.key === "Escape") {
        e.preventDefault();
        game.pause();
        openModal(modalAbort);
        return;
      }
      // Keystrokes are handled directly by game.handleKeydown
      return;
    }

    // 3. Screen Specific Keyboard Navigation
    if (currentScreen === SCREENS.LOGIN) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLoginSubmit();
      }
    } else if (currentScreen === SCREENS.SETTINGS) {
      if (e.key === "Enter") {
        e.preventDefault();
        showScreen(SCREENS.INSTRUCTIONS);
      }
    } else if (currentScreen === SCREENS.INSTRUCTIONS) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showScreen(SCREENS.GAME);
      }
    } else if (currentScreen === SCREENS.RESULT) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showScreen(SCREENS.GAME);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        showScreen(SCREENS.RECORDS);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        showScreen(SCREENS.SETTINGS);
      }
    } else if (currentScreen === SCREENS.RECORDS) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        showScreen(SCREENS.SETTINGS);
      }
    }
  });

  // Window resize handler
  window.addEventListener("resize", () => {
    game.resize();
  });

  // ==========================================================================
  // CONFETTI PARTICLE SYSTEM (VICTORY RECORDS)
  // ==========================================================================

  let confettiParticles = [];
  let confettiAnimId = null;

  function triggerConfettiCelebration() {
    confettiCanvas.style.display = "block";
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const ctx = confettiCanvas.getContext("2d");

    confettiParticles = [];
    const colors = ["#33ff66", "#ffff44", "#ff2244", "#00ffff", "#ffffff", "#ff8800"];

    for (let i = 0; i < 150; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: 0.006 + Math.random() * 0.008
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    function loopConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let aliveCount = 0;

      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.vx *= 0.985;
        p.rotation += p.vRot;
        p.life -= p.decay;

        if (p.life > 0) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        confettiAnimId = requestAnimationFrame(loopConfetti);
      } else {
        confettiCanvas.style.display = "none";
      }
    }

    confettiAnimId = requestAnimationFrame(loopConfetti);
  }

  // --- Initial Bootup ---
  callsignInput.value = currentCallsign;
  refreshHeader();
  showScreen(SCREENS.LOGIN);
});
