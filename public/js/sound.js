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
    }).catch(() => {
      // Audio failed (file not found or other error) - use TTS fallback silently
      const letter = App.lettersData?.find(l => l.id === letterId);
      if (letter && typeof Speech !== 'undefined' && Speech.speak) {
        Speech.speak(letter.name);
      }
      // Don't log errors to console - fallback is expected behavior
    });
  }
};