// src/audioController.js

const audioController = (() => {
  // Preload audio files
  const hitSound = new Audio();
  hitSound.src = 'assets/sounds/retro_explosion.mp3';
  
  const missSound = new Audio();
  missSound.src = 'assets/sounds/water_splash.mp3';
  
  const sunkSound = new Audio();
  sunkSound.src = 'assets/sounds/ship_sinking.mp3';
  
  const gameOverSound = new Audio();
  gameOverSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-medieval-show-fanfare-announcement-226.mp3';
  
  // Set volume levels
  hitSound.volume = 0.5;
  missSound.volume = 0.3;
  sunkSound.volume = 0.6;
  gameOverSound.volume = 0.7;
  
  // Check if we should play sounds (could be set by user preference)
  let soundEnabled = true; // Default to ON, user can toggle
  
  // Public methods
  const playHitSound = () => {
    if (!soundEnabled) return;
    hitSound.currentTime = 0; // Reset sound to beginning
    hitSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playMissSound = () => {
    if (!soundEnabled) return;
    missSound.currentTime = 0;
    missSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playSunkSound = () => {
    if (!soundEnabled) return;
    sunkSound.currentTime = 0;
    sunkSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playGameOverSound = () => {
    if (!soundEnabled) return;
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const toggleSound = () => {
    soundEnabled = !soundEnabled;
    // Optionally stop any currently playing sounds if toggled off
    if (!soundEnabled) {
        hitSound.pause();
        missSound.pause();
        sunkSound.pause();
        gameOverSound.pause();
    }
    return soundEnabled;
  };
  
  const isSoundEnabled = () => soundEnabled;
  
  return {
    playHitSound,
    playMissSound,
    playSunkSound,
    playGameOverSound,
    toggleSound,
    isSoundEnabled
  };
})();

export default audioController;