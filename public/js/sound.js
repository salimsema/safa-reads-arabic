/**
 * Safa Learns Arabic - Sound Module
 * Plays audio files for letter pronunciation, falls back to TTS if unavailable
 */

const Sound = {
  /**
   * Play sound for a letter
   * @param {number} letterId - The letter ID (1-29)
   * @param {string} nameEn - English name for filename (e.g., "haa", "alif")
   */
  play(letterId, nameEn) {
    const audio = new Audio(`/sounds/${letterId}_${nameEn}.mp3`);
    
    audio.play().then(() => {
      console.log(`[Sound] Playing: ${letterId}_${nameEn}.mp3`);
    }).catch((err) => {
      console.warn(`[Sound] Sound file not found, using TTS fallback: ${nameEn}`);
      // Fallback to TTS - need to get Arabic name from lettersData
      const letter = App.lettersData?.find(l => l.id === letterId);
      if (letter && typeof Speech !== 'undefined' && Speech.speak) {
        Speech.speak(letter.name);
      } else {
        console.error('[Sound] TTS not available');
      }
    });
  },

  /**
   * Check if sound file exists (preload check)
   */
  isAvailable(letterId) {
    return fetch(`/sounds/${letterId}_name.mp3`, { method: 'HEAD' })
      .then(response => response.ok)
      .catch(() => false);
  }
};