// src/audioController.js

const audioController = (() => {
  // Preload audio files
  const hitSound = new Audio();
  hitSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-explosion-3062.mp3';
  
  const missSound = new Audio();
  missSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-sea-waves-noise-1196.mp3';
  
  const sunkSound = new Audio();
  sunkSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-sea-mine-explosion-1184.mp3';
  
  const gameOverSound = new Audio();
  gameOverSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-medieval-show-fanfare-announcement-226.mp3';
  
  // Set volume levels
  hitSound.volume = 0.5;
  missSound.volume = 0.3;
  sunkSound.volume = 0.6;
  gameOverSound.volume = 0.7;
  
  // Public methods
  const playHitSound = () => {
    hitSound.currentTime = 0; // Reset sound to beginning
    hitSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playMissSound = () => {
    missSound.currentTime = 0;
    missSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playSunkSound = () => {
    sunkSound.currentTime = 0;
    sunkSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  const playGameOverSound = () => {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(e => console.warn('Sound play failed:', e));
  };
  
  // Check if we should play sounds (could be set by user preference)
  let soundEnabled = true;
  
  const toggleSound = () => {
    soundEnabled = !soundEnabled;
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