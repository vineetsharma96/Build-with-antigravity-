/**
 * TYPE//TANK - LocalStorage Engine & Flight Log Database
 * Tracks operator profile, system configurations, mode records, and flight logs.
 */

const STORAGE_KEYS = {
  CALLSIGN: "typetank_callsign",
  MODE: "typetank_mode",
  ASPECT: "typetank_aspect",
  CRT: "typetank_crt",
  MUTED: "typetank_muted",
  LOGS: "typetank_flight_logs"
};

class StorageEngine {
  constructor() {
    this.defaultCallsign = "VANGUARD-1";
    this.defaultMode = 1;
    this.defaultAspect = "AUTO"; // "AUTO" | "16:9" | "4:3"
    this.defaultCrt = true;
  }

  // --- Callsign ---
  getCallsign() {
    const val = localStorage.getItem(STORAGE_KEYS.CALLSIGN);
    return val && val.trim() ? val.trim().toUpperCase() : this.defaultCallsign;
  }

  setCallsign(callsign) {
    const clean = callsign && callsign.trim() ? callsign.trim().toUpperCase().slice(0, 16) : this.defaultCallsign;
    localStorage.setItem(STORAGE_KEYS.CALLSIGN, clean);
    return clean;
  }

  // --- Mode ---
  getMode() {
    const val = localStorage.getItem(STORAGE_KEYS.MODE);
    const parsed = parseInt(val, 10);
    return [1, 2, 3, 4].includes(parsed) ? parsed : this.defaultMode;
  }

  setMode(mode) {
    const valid = [1, 2, 3, 4].includes(Number(mode)) ? Number(mode) : 1;
    localStorage.setItem(STORAGE_KEYS.MODE, String(valid));
    return valid;
  }

  // --- Aspect Ratio ---
  getAspect() {
    const val = localStorage.getItem(STORAGE_KEYS.ASPECT);
    return ["AUTO", "16:9", "4:3"].includes(val) ? val : this.defaultAspect;
  }

  setAspect(aspect) {
    const valid = ["AUTO", "16:9", "4:3"].includes(aspect) ? aspect : "AUTO";
    localStorage.setItem(STORAGE_KEYS.ASPECT, valid);
    return valid;
  }

  // --- CRT Overlay ---
  getCrt() {
    const val = localStorage.getItem(STORAGE_KEYS.CRT);
    return val === null ? this.defaultCrt : val === "true";
  }

  setCrt(enabled) {
    const bool = Boolean(enabled);
    localStorage.setItem(STORAGE_KEYS.CRT, String(bool));
    return bool;
  }

  // --- Flight Logs ---
  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse flight logs:", e);
      return [];
    }
  }

  saveLog(logEntry) {
    const logs = this.getLogs();
    logs.unshift(logEntry); // prepend latest
    // Cap stored logs at 100 entries to prevent infinite storage growth
    if (logs.length > 100) {
      logs.length = 100;
    }
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    return logs;
  }

  purgeLogs() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    return [];
  }

  // --- Mode Best Records ---
  getModeBest(mode) {
    const logs = this.getLogs();
    const modeLogs = logs.filter(l => Number(l.mode) === Number(mode));
    if (modeLogs.length === 0) {
      return { score: 0, wpm: 0, acc: 0, combo: 0, sorties: 0 };
    }

    let maxScore = 0;
    let maxWpm = 0;
    let maxAcc = 0;
    let maxCombo = 0;

    modeLogs.forEach(l => {
      if (l.score > maxScore) maxScore = l.score;
      if (l.wpm > maxWpm) maxWpm = l.wpm;
      if (l.accuracy > maxAcc) maxAcc = l.accuracy;
      if (l.maxCombo > maxCombo) maxCombo = l.maxCombo;
    });

    return {
      score: maxScore,
      wpm: maxWpm,
      acc: maxAcc,
      combo: maxCombo,
      sorties: modeLogs.length
    };
  }

  // --- Check Sortie Record Status ---
  evaluateRecord(currentSortie) {
    const prevBest = this.getModeBest(currentSortie.mode);
    const isNewPB = currentSortie.score > prevBest.score || (currentSortie.score === prevBest.score && currentSortie.wpm > prevBest.wpm);
    const deltaScore = currentSortie.score - prevBest.score;
    const deltaWpm = currentSortie.wpm - prevBest.wpm;

    return {
      isNewPB,
      prevBestScore: prevBest.score,
      prevBestWpm: prevBest.wpm,
      deltaScore,
      deltaWpm
    };
  }

  // --- Lifetime Operator Overview ---
  getLifetimeStats() {
    const logs = this.getLogs();
    if (logs.length === 0) {
      return {
        bestScore: 0,
        maxWpm: 0,
        avgAcc: 0,
        totalWords: 0,
        totalCrimson: 0,
        totalSorties: 0
      };
    }

    let bestScore = 0;
    let maxWpm = 0;
    let totalAcc = 0;
    let totalWords = 0;
    let totalCrimson = 0;

    logs.forEach(l => {
      if (l.score > bestScore) bestScore = l.score;
      if (l.wpm > maxWpm) maxWpm = l.wpm;
      totalAcc += Number(l.accuracy) || 0;
      totalWords += Number(l.wordsDestroyed) || 0;
      totalCrimson += Number(l.crimsonDestroyed) || 0;
    });

    return {
      bestScore,
      maxWpm,
      avgAcc: Math.round(totalAcc / logs.length),
      totalWords,
      totalCrimson,
      totalSorties: logs.length
    };
  }
}

// Global export for vanilla JS
window.StorageEngine = new StorageEngine();
