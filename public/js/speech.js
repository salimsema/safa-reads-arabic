/**
 * Safa Learns Arabic - Text-to-Speech Module
 * Plays sound ONCE when tapped
 */

const Speech = {
  synth: window.speechSynthesis,
  voicesLoaded: false,
  arabicVoices: [],

  /**
   * Initialize speech synthesis
   */
  async init() {
    if (!this.synth) {
      console.warn('[Speech] Not supported');
      return false;
    }

    const loadVoices = () => {
      const voices = this.synth.getVoices();
      this.arabicVoices = voices.filter(v => v.lang.startsWith('ar'));
      this.voicesLoaded = true;
      console.log(`[Speech] ${this.arabicVoices.length} Arabic voices`);
    };

    if (this.synth.getVoices().length > 0) {
      loadVoices();
    } else {
      this.synth.onvoiceschanged = loadVoices;
    }
    return true;
  },

  /**
   * Speak a single utterance
   */
  speak(text) {
    if (!this.synth) return false;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.6;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const voice =
      this.arabicVoices.find(v => v.name.includes('زارية')) ||
      this.arabicVoices.find(v => v.lang === 'ar-SA') ||
      this.arabicVoices.find(v => v.lang === 'ar-EG') ||
      this.arabicVoices[0];
    if (voice) utterance.voice = voice;

    this.synth.speak(utterance);
    console.log(`[Speech] Speaking: ${text}`);
    return true;
  },

  isSupported() {
    return !!this.synth;
  }
};

Speech.init();