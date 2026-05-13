/**
 * Safa Learns Arabic - Main Application
 */

const App = {
  // DOM elements
  container: null,
  newLettersBtn: document.getElementById('newLetters'),
  autoShuffle: document.getElementById('autoShuffle'),
  progressEl: document.getElementById('progress'),
  modeSingle: document.getElementById('modeSingle'),
  modeMulti: document.getElementById('modeMulti'),
  
  // State
  currentLetters: [],
  lettersData: [],
  readCount: 0,
  totalLetters: 0,
  autoShuffleInterval: null,
  isCelebration: false,
  currentMode: 'multi',
  
  // Colors for letters
  colors: [
    '#1B5E20', '#2E7D32', '#388E3C', '#43A047',
    '#C62828', '#D32F2F', '#1565C0', '#1976D2',
    '#6A1B9A', '#7B1FA2', '#EF6C00', '#F57C00'
  ],

  /**
   * Initialize the application
   */
  async init() {
    console.log('[App] Initializing...');
    
    this.container = document.getElementById('letterContainer');
    await this.loadLettersData();
    
    // Event listeners
    this.newLettersBtn.addEventListener('click', () => this.loadLetters(true));
    this.autoShuffle.addEventListener('change', () => this.toggleAutoShuffle());
    
    this.modeSingle?.addEventListener('change', () => {
      if (this.modeSingle.checked) {
        console.log('[App] Mode: single');
        this.currentMode = 'single';
        this.loadLetters(true);
      }
    });
    
    this.modeMulti?.addEventListener('change', () => {
      if (this.modeMulti.checked) {
        console.log('[App] Mode: multi');
        this.currentMode = 'multi';
        this.loadLetters(true);
      }
    });
    
    // Toggle controls panel (slides from right)
    const toggleBtn = document.getElementById('toggleControls');
    const controls = document.getElementById('controls');
    let controlsVisible = false;
    
    toggleBtn.addEventListener('click', () => {
      controlsVisible = !controlsVisible;
      controls.classList.toggle('visible', controlsVisible);
      toggleBtn.textContent = controlsVisible ? '‹' : '›';
    });
    
    // Online/offline status
    this.updateOnlineStatus();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
    
    // Handle resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.relayoutCurrentLetters(), 250);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.relayoutCurrentLetters(), 400);
    });
    
    console.log('[App] Loading letters...');
    this.loadLetters(true);
  },

  /**
   * Get current letters state from DOM
   */
  relayoutCurrentLetters() {
    const currentState = this.getCurrentLetterState();
    if (!currentState.length) return;
    this.currentLetters = currentState.map(s => s.letter);
    this.readCount = currentState.filter(s => s.read).length;
    this.renderLetters();
  },

  /**
   * Load letters data from JSON file
   */
  async loadLettersData() {
    try {
      console.log('[App] Loading letters...');
      const res = await fetch('/data/letters.json');
      const data = await res.json();
      this.lettersData = data.letters;
      console.log(`[App] Loaded ${this.lettersData.length} Arabic letters`);
    } catch (err) {
      console.error('[App] Failed to load letters:', err);
    }
  },

  /**
   * Get random letters
   */
  getOfflineLetters(count) {
    if (!this.lettersData || !this.lettersData.length) return [];
    const shuffled = [...this.lettersData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  /**
   * Load and display letters
   */
  async loadLetters(fresh = false) {
    const count = this.currentMode === 'single' ? 1 : this.getResponsiveLetterCount();
    console.log(`[App] Loading ${count} letters (mode: ${this.currentMode})`);
    
    try {
      if (this.lettersData && this.lettersData.length) {
        this.currentLetters = this.getOfflineLetters(count);
      }
      this.readCount = 0;
      this.totalLetters = 0;
      this.isCelebration = false;
      this.renderLetters();
    } catch (err) {
      console.error('[App] Error loading letters:', err);
    }
  },

  /**
   * Update online status
   */
  updateOnlineStatus() {
    const indicator = document.getElementById('online-status');
    if (!indicator) return;
    indicator.style.display = navigator.onLine ? 'none' : 'block';
  },

  /**
   * Get responsive letter count
   */
  getResponsiveLetterCount() {
    const width = window.innerWidth;
    const area = width * window.innerHeight;
    if (width < 600) return 5;
    if (width < 900) return 7;
    if (area < 900000) return 8;
    if (area < 1600000) return 10;
    return 12;
  },

  /**
   * Get current letters state from DOM
   */
  getCurrentLetterState() {
    return Array.from(document.querySelectorAll('.letter')).map(el => ({
      letter: el.dataset.letter || el.textContent.trim(),
      transliteration: el.dataset.transliteration || '',
      read: el.classList.contains('read')
    }));
  },

  /**
   * Main render function
   */
  renderLetters() {
    this.container.innerHTML = '';
    
    // Always show progress
    if (this.progressEl) this.progressEl.style.display = 'block';
    
    if (this.currentMode === 'single') {
      this.renderSingleMode();
    } else {
      this.renderMultiMode();
    }
    
    this.updateProgressDisplay();
  },

  /**
   * Render single letter mode - big letter with transliteration below
   */
  renderSingleMode() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const letters = [...this.currentLetters].slice(0, 1);
    if (!letters.length) return;
    
    const letterObj = letters[0];
    const letter = letterObj.letter;
    const letterName = letterObj.name;
    const transliteration = letterObj.nameEn;
    
    console.log(`[App] Single: ${letter} (${transliteration})`);
    
    // Use smaller font to leave room for transliteration
    const letterHeight = h * 0.30;
    const fontSize = Math.min(w * 0.45, letterHeight);
    const finalFontSize = Math.max(70, Math.min(180, fontSize));
    
    // Wrapper for vertical stacking
    const wrapper = document.createElement('div');
    wrapper.className = 'single-letter-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '50%';
    wrapper.style.top = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    
    // Arabic letter - use only single-letter class (not .letter to avoid position:absolute conflict)
    const el = document.createElement('div');
    el.className = 'single-letter';
    el.textContent = letter;
    
    // Transliteration - use CSS class
    const transEl = document.createElement('div');
    transEl.className = 'transliteration';
    transEl.textContent = transliteration;
    
    wrapper.appendChild(el);
    wrapper.appendChild(transEl);
    this.container.appendChild(wrapper);
    
    this.totalLetters = 1;
    this.readCount = 0;
    
    // Click on whole wrapper plays sound, then load new letter
    wrapper.style.cursor = 'pointer';
    wrapper.onclick = () => {
      console.log(`[App] Tapped: ${letter} (id: ${letterObj.id})`);
      Sound.play(letterObj.id, transliteration);
      setTimeout(() => this.loadLetters(true), 800);
    };
  },

  /**
   * Render multiple letters mode
   */
  renderMultiMode() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const padX = Math.max(24, w * 0.04);
    const padTop = Math.max(60, h * 0.08);
    const padBottom = Math.max(24, h * 0.05);
    
    const safeLeft = padX;
    const safeRight = w - padX;
    const safeTop = padTop;
    const safeBottom = h - padBottom;
    const safeW = safeRight - safeLeft;
    const safeH = safeBottom - safeTop;
    
    const cols = w < 500 ? 2 : (w < 900 ? 3 : 4);
    const rows = 3;
    const zoneW = safeW / cols;
    const zoneH = safeH / rows;
    
    const zones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        zones.push({ col: c, row: r });
      }
    }
    for (let i = zones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zones[i], zones[j]] = [zones[j], zones[i]];
    }
    
    const letters = [...this.currentLetters].slice(0, zones.length);
    const currentState = this.getCurrentLetterState();
    const stateMap = new Map(currentState.map(s => [s.letter, s.read]));
    
    this.totalLetters = letters.length;
    console.log(`[App] Rendering ${letters.length} letters`);
    
    letters.forEach((letterObj, i) => {
      const zone = zones[i];
      const letter = letterObj.letter;
      const letterName = letterObj.name;
      const transliteration = letterObj.nameEn;
      
      const zoneLeft = safeLeft + zone.col * zoneW;
      const zoneTop = safeTop + zone.row * zoneH;
      const zoneRight = zoneLeft + zoneW;
      const zoneBot = zoneTop + zoneH;
      
      const fontSize = Math.min(zoneW * 0.7, zoneH * 0.65);
      const finalFontSize = Math.max(80, Math.min(200, fontSize));
      
      const el = document.createElement('div');
      el.className = 'letter';
      el.textContent = letter;
      el.dataset.letter = letter;
      el.dataset.name = letterName;
      el.dataset.transliteration = transliteration;
      el.style.position = 'absolute';
      el.style.fontSize = finalFontSize + 'px';
      el.style.color = this.colors[i % this.colors.length];
      el.style.whiteSpace = 'nowrap';
      el.style.lineHeight = '1.2';
      el.style.boxSizing = 'border-box';
      
      const estWidth = finalFontSize * 0.9;
      const estHeight = finalFontSize * 1.1;
      const innerPad = 8;
      
      const minX = zoneLeft + innerPad;
      const maxX = zoneRight - estWidth - innerPad;
      const minY = zoneTop + innerPad;
      const maxY = zoneBot - estHeight - innerPad;
      
      const x = minX < maxX ? minX + Math.random() * (maxX - minX) : minX;
      const y = minY < maxY ? minY + Math.random() * (maxY - minY) : minY;
      
      el.style.left = Math.round(x) + 'px';
      el.style.top = Math.round(y) + 'px';
      
      if (stateMap.get(letter)) {
        el.classList.add('read');
        el.dataset.read = 'true';
      }
      
      // Click plays sound once
      el.onclick = () => this.handleLetterClick(el, letter, letterName, transliteration, letterObj.id);
      this.container.appendChild(el);
    });
  },

  /**
   * Handle letter click
   */
  handleLetterClick(el, letter, letterName, transliteration, letterId) {
    if (el.classList.contains('read')) {
      console.log(`[App] Replay: ${transliteration} (id: ${letterId})`);
      Sound.play(letterId, transliteration);
      return;
    }
    
    console.log(`[App] Clicked: ${letter} (${transliteration}) (id: ${letterId})`);
    
    // Play sound ONCE
    Sound.play(letterId, transliteration);
    
    el.classList.add('read');
    el.classList.add('celebrate');
    
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = '✨';
    el.appendChild(sparkle);
    
    this.readCount++;
    this.updateProgressDisplay();
    
    if (this.readCount === this.totalLetters) {
      setTimeout(() => this.showCelebration(), 500);
    }
  },

  /**
   * Show celebration
   */
  showCelebration() {
    this.isCelebration = true;
    console.log('[App] Celebration!');
    
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.textContent = '🎉 Great Job! 🎉';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
      this.loadLetters();
    }, 3000);
  },

  /**
   * Toggle auto-shuffle
   */
  toggleAutoShuffle() {
    if (this.autoShuffle.checked) {
      this.autoShuffleInterval = setInterval(() => this.loadLetters(), 60000);
    } else {
      clearInterval(this.autoShuffleInterval);
    }
  },

  /**
   * Update progress display
   */
  updateProgressDisplay() {
    if (this.progressEl) {
      this.progressEl.textContent = `Read: ${this.readCount} / ${this.totalLetters} ⭐`;
    }
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => console.log('[App] SW registered'))
      .catch((error) => console.error('[App] SW failed:', error));
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
    installBtn.addEventListener('click', async () => {
      installBtn.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt = null;
    });
  }
});
window.addEventListener('appinstalled', () => {
  console.log('[App]Installed!');
  deferredPrompt = null;
});