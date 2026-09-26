/**
 * TYPE//TANK - Word Dictionaries & Exclusion Engine
 * Supports 4 distinct tactical arsenal modes and crimson threat exclusion rules.
 */

const WORDS_MODE_1 = [
  "tank", "turret", "armor", "radar", "bunker", "cannon", "strike", "flak",
  "vector", "laser", "optics", "plasma", "missile", "breach", "perimeter",
  "ballistic", "tread", "chassis", "target", "reticle", "tracer", "shield",
  "vulcan", "howitzer", "patrol", "squadron", "barrage", "defend", "combat",
  "sortie", "recon", "scout", "stealth", "cipher", "matrix", "command",
  "payload", "override", "firewall", "protocol", "sector", "outpost", "garrison",
  "warhead", "caliber", "muzzle", "recoil", "traverse", "elevation", "ammo",
  "kinetic", "mortar", "sentry", "turmoil", "citadel", "bastion", "gunner",
  "loader", "driver", "breach", "deflection", "ricochet", "penetrate", "blast",
  "shrapnel", "hull", "turret", "hatch", "periscope", "engine", "exhaust",
  "sprocket", "suspension", "trench", "rampart", "bulwark", "redoubt", "frontline",
  "flank", "pincer", "advance", "retreat", "ambush", "supply", "convoy",
  "depot", "armory", "arsenal", "battery", "barricade", "intercept", "tactical",
  "salvo", "volley", "shockwave", "fragment", "casemate", "cupola", "mantlet",
  "glacis", "spall", "sabot", "heat", "smoke", "flare", "beacon", "relay",
  "sensor", "sonar", "telemetry", "uplink", "downlink", "frequency", "jamming",
  "scramble", "decoy", "counter", "thrust", "maneuver", "deploy", "entrench",
  "fortify", "overrun", "neutralize", "engage", "destroy", "annihilate", "vanguard",
  "spearhead", "bastion", "checkpoint", "stronghold", "perimeter", "minefield",
  "reconnaissance", "surveillance", "coordinates", "trajectory", "azimuth", "ballistics"
];

const WORDS_MODE_2 = [
  "Tank", "Radar", "Bunker", "Cannon", "Strike", "Flak", "Vector", "Laser",
  "Optics", "Plasma", "Missile", "Breach", "Perimeter", "Ballistic", "Tread",
  "Chassis", "Target", "Reticle", "Tracer", "Shield", "Vulcan", "Howitzer",
  "Patrol", "Squadron", "Barrage", "Combat", "Sortie", "Recon", "Stealth",
  "Cipher", "Matrix", "Command", "Payload", "Override", "Firewall", "Protocol",
  "Sector", "Outpost", "Garrison", "Warhead", "Caliber", "Muzzle", "Recoil",
  "Aegis", "Vanguard", "Kevlar", "Striker", "DeltaForce", "Phantom", "Specter",
  "Centurion", "Paladin", "Titan", "Warhammer", "Goliath", "NightHawk", "IronClad",
  "CyberOps", "BlackHawk", "TopGun", "Apex", "Overlord", "SkyFire", "Thunderbolt",
  "StormRider", "GhostRider", "SteelRain", "HellFire", "Dreadnought", "Marauder",
  "Juggernaut", "Crusader", "Wolverine", "Behemoth", "Valkyrie", "Dominator",
  "Avenger", "Reaper", "Vindicator", "Havoc", "RazorBack", "Predator", "Sentinel",
  "Enforcer", "ShadowOps", "Raptor", "Warmonger", "Deathstalker", "IronCurtain"
];

const WORDS_MODE_3 = [
  "Squad5", "Tank99", "v2.0", "F16", "Sector7", "Patrol88", "B52", "M1A2",
  "Armor01", "Alpha9", "Bravo6", "Delta4", "Echo11", "Fox3", "Kilo90", "T90MS",
  "Su57", "Mig31", "Unit101", "Platoon8", "Regiment42", "TaskForce9", "Battalion3",
  "Convoy7", "Battery6", "Flak88", "Howitzer155", "Vulcan20", "Caliber50",
  "Warhead9", "Zone404", "Grid88", "Outpost12", "Checkpoint4", "Sentry33",
  "Target00", "Bunker77", "Laser5", "Radar99", "Aegis3", "Vector9", "Cannon105",
  "Mortar82", "Chassis4", "Tread12", "Turret2", "Hull99", "Speed80", "Range500",
  "Code44", "Cipher7", "Matrix21", "System32", "Base8", "Ops99", "Callsign01",
  "Strike7", "Recon88", "Delta9", "Zulu1", "Victor5", "Tango7", "Whiskey9"
];

const WORDS_MODE_4 = [
  "[tank-01]", "(8+9)", "{cmd-9}", "!alert!", "[flak#3]", "&recon*", "<target-X>",
  "[mod+4]", "{tread=0}", "!breach!", "[def-77]", "$radar$", "%fire%", "(v3.1)",
  "[grid:4]", "*strike*", "~recon~", "[hull>80]", "{lock:1}", "<core:0>",
  "[code-7]", "!flak!", "(9*2)", "{pincer-1}", "[optics#2]", "<vector:9>",
  "+ammo+", "-recoil-", "[squad_5]", "{aim=180}", "!missile!", "[sector/4]",
  "(x+y=10)", "[salvo#9]", "{base.ok}", "$cyber$", "!danger!", "<armor:max>",
  "[bunker-9]", "{firewall:on}", "(flak+ammo)", "[status=1]", "!kill_9!",
  "<tread_rt>", "[overload!]", "{ammo>0}", "!critical!", "[turret-z]",
  "&jamming&", "[outpost_7]", "{matrix:4}", "(100-35)", "!lock_on!", "[f-16/c]"
];

// Special high-threat crimson words for each mode
const BONUS_WORDS = {
  1: ["annihilation", "devastation", "juggernaut", "interceptor", "bombardment", "cataclysm", "supremacy", "apocalypse", "hypervelocity"],
  2: ["MEGA-TANK", "DEATH-RAY", "WAR-CRIMSON", "DREADNOUGHT", "TITAN-CLASS", "HYPER-FLAK", "OMEGA-CORE", "EXTERMINATOR"],
  3: ["WarZone999", "HyperTank77", "MaxDamage100", "OmegaStrike88", "DoomCannon66", "UltraBunker50", "FinalSector00"],
  4: ["<<DEATH_99>>", "!ULTRA-NUKE!", "[CRITICAL#999]", "{DOOM_RAY=MAX}", "!!MELTDOWN!!", "[$HOSTILE_OMEGA$]", "(999*999)"]
};

/**
 * Word Manager and Exclusion Cooldown Tracker
 */
class WordManager {
  constructor() {
    this.activeCrimsonChar = null;
    this.cooldowns = new Map(); // char -> expiration timestamp (ms)
    this.cooldownDurationMs = 3000; // 3-second cooldown window after crimson word resolves
  }

  /**
   * Set active crimson bonus starting character
   */
  setActiveCrimson(char) {
    if (char) {
      this.activeCrimsonChar = char;
    }
  }

  /**
   * Resolve crimson bonus word: clear active status and initiate 3-second cooldown window
   */
  resolveCrimson(char) {
    if (char) {
      const targetChar = char;
      this.cooldowns.set(targetChar, Date.now() + this.cooldownDurationMs);
    }
    this.activeCrimsonChar = null;
  }

  /**
   * Check if a starting character is currently suppressed (active crimson or cooldown)
   */
  isCharSuppressed(char) {
    if (!char) return false;
    // Suppress if matches active crimson starting char
    if (this.activeCrimsonChar && this.activeCrimsonChar.toLowerCase() === char.toLowerCase()) {
      return true;
    }
    // Check cooldown window
    const now = Date.now();
    for (const [c, expireTime] of this.cooldowns.entries()) {
      if (now < expireTime) {
        if (c.toLowerCase() === char.toLowerCase()) {
          return true;
        }
      } else {
        this.cooldowns.delete(c);
      }
    }
    return false;
  }

  /**
   * Get dictionary for specified mode (1: Alpha, 2: Bravo, 3: Charlie, 4: Delta)
   */
  getDictionary(mode) {
    switch (Number(mode)) {
      case 2: return WORDS_MODE_2;
      case 3: return WORDS_MODE_3;
      case 4: return WORDS_MODE_4;
      case 1:
      default: return WORDS_MODE_1;
    }
  }

  /**
   * Get a random word for mode, ensuring starting char does not conflict with active words or cooldowns
   * @param {number} mode 1..4
   * @param {Array<string>} existingFirstChars starting letters of words currently on screen
   * @param {boolean} isBonus whether this requested word is a red bonus target
   */
  getRandomWord(mode, existingFirstChars = [], isBonus = false) {
    const wordList = isBonus ? BONUS_WORDS[mode] || BONUS_WORDS[1] : this.getDictionary(mode);
    const existingSet = new Set(existingFirstChars.map(c => c ? c.toLowerCase() : ""));

    // Find valid candidates
    const validCandidates = wordList.filter(w => {
      if (!w || w.length === 0) return false;
      const firstChar = w[0].toLowerCase();
      // If regular word, verify not suppressed by active crimson target or cooldown
      if (!isBonus && this.isCharSuppressed(firstChar)) {
        return false;
      }
      // If regular word, avoid duplicating an on-screen word's initial character if possible
      if (!isBonus && existingSet.has(firstChar)) {
        return false;
      }
      return true;
    });

    if (validCandidates.length > 0) {
      const idx = Math.floor(Math.random() * validCandidates.length);
      return validCandidates[idx];
    }

    // Fallback: pick any word from dictionary
    const fallbackIdx = Math.floor(Math.random() * wordList.length);
    return wordList[fallbackIdx];
  }

  /**
   * Samples for preview bar
   */
  getSampleWords(mode, count = 5) {
    const list = this.getDictionary(mode);
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

// Global export for vanilla JS
window.WordManager = new WordManager();
