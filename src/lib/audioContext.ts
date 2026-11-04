/**
 * Web Audio API manager for visualizers and real-time frequency analysis.
 * Safely handles cross-browser audio contexts and connection lifecycle.
 */

let sharedAudioContext: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;
let connectedElement: HTMLAudioElement | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

export function getAudioContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('Web Audio API is only available in browser');
  }

  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

export function getAudioAnalyser(audioElement?: HTMLAudioElement): AnalyserNode | null {
  if (typeof window === 'undefined') return null;

  try {
    const ctx = getAudioContext();

    if (!sharedAnalyser) {
      sharedAnalyser = ctx.createAnalyser();
      sharedAnalyser.fftSize = 256;
      sharedAnalyser.smoothingTimeConstant = 0.8;
    }

    // Connect audio element if provided and not connected yet
    if (audioElement && audioElement !== connectedElement) {
      // Clean up previous if necessary
      if (sourceNode) {
        try {
          sourceNode.disconnect();
        } catch (_) {}
      }

      connectedElement = audioElement;
      // Cross origin handling
      audioElement.crossOrigin = 'anonymous';

      try {
        sourceNode = ctx.createMediaElementSource(audioElement);
        sourceNode.connect(sharedAnalyser);
        sharedAnalyser.connect(ctx.destination);
      } catch (err) {
        console.warn('MediaElementSource error (likely already attached or CORS):', err);
      }
    }

    return sharedAnalyser;
  } catch (err) {
    console.warn('AudioContext initialization error:', err);
    return null;
  }
}
