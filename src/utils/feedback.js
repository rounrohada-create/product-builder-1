/**
 * 햅틱 피드백 및 사운드 효과 유틸리티
 */

// 햅틱 피드백 (진동)
export const triggerHaptic = (pattern = [50]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// 버튼 클릭 사운드 생성
export const createClickSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

// 성공 사운드
export const createSuccessSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1200;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};

// 에러 사운드
export const createErrorSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 400;
  oscillator.type = 'sawtooth';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
};

// 통합 피드백 함수
export const triggerFeedback = (type = 'click') => {
  switch (type) {
    case 'click':
      triggerHaptic([50]);
      createClickSound();
      break;
    case 'success':
      triggerHaptic([100, 50, 100]);
      createSuccessSound();
      break;
    case 'error':
      triggerHaptic([200]);
      createErrorSound();
      break;
    default:
      triggerHaptic([50]);
      createClickSound();
  }
};
