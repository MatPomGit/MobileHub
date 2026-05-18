'use strict';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasConstrainedDeviceSignals() {
  const saveData = navigator.connection?.saveData === true;
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  return saveData || lowCpu;
}

export function getMotionProfile() {
  if (prefersReducedMotion()) {
    return 'none';
  }

  if (hasConstrainedDeviceSignals()) {
    return 'limited';
  }

  return 'full';
}

export function shouldReduceEffects() {
  return getMotionProfile() !== 'full';
}
