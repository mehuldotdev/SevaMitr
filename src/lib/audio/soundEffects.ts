/**
 * Sound effects engine (temporarily disabled per user instruction)
 */
class SoundEffects {
  playBell(_frequency = 520, _duration = 0.4) {}
  playSuccessChime() {}
  playGentleTryAgain() {}
  playRainSound(_duration = 2.0) {}
  playFluteTone(_frequency = 440, _duration = 0.8) {}
}

export const soundEffects = new SoundEffects();
