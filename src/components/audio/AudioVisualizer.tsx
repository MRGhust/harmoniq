'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getAudioAnalyser } from '@/lib/audioContext';
import { BarChart2, Activity, Disc3, Sparkles } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'radial';

export interface AudioVisualizerProps {
  /** Optional audio element to connect the analyser to */
  audioElement?: HTMLAudioElement | null;
  /** Force or reflect current playback state */
  isPlaying?: boolean;
  /** Active visual mode */
  mode?: VisualizerMode;
  /** Callback when visual mode changes */
  onModeChange?: (mode: VisualizerMode) => void;
  /** Enable automatic cycling between modes */
  autoCycle?: boolean;
  /** Interval in ms for auto-cycling modes (default 15000ms) */
  autoCycleIntervalMs?: number;
  /** Show the mode selection floating toolbar */
  showControls?: boolean;
  /** Custom CSS classes for the container */
  className?: string;
  /** Number of bars in bars mode (default 48) */
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying = false,
  mode: controlledMode,
  onModeChange,
  autoCycle = false,
  autoCycleIntervalMs = 15000,
  showControls = true,
  className = '',
  barCount = 48,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Peak caps physics memory for 'bars' mode
  const peaksRef = useRef<number[]>([]);
  // Phase counter for idle ambient animation
  const idlePhaseRef = useRef<number>(0);

  // Internal visual mode if not controlled
  const [internalMode, setInternalMode] = useState<VisualizerMode>('bars');
  const [isAutoCycleActive, setIsAutoCycleActive] = useState<boolean>(autoCycle);

  const activeMode = controlledMode || internalMode;

  const handleModeSelect = useCallback(
    (newMode: VisualizerMode) => {
      setInternalMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  // Auto cycle effect
  useEffect(() => {
    if (!isAutoCycleActive) return;
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial'];
    const timer = setInterval(() => {
      setInternalMode((prev) => {
        const nextIndex = (modes.indexOf(prev) + 1) % modes.length;
        const nextMode = modes[nextIndex];
        onModeChange?.(nextMode);
        return nextMode;
      });
    }, autoCycleIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoCycleActive, autoCycleIntervalMs, onModeChange]);

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser: AnalyserNode | null = null;
    try {
      analyser = getAudioAnalyser(audioElement || undefined);
    } catch {
      analyser = null;
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Resize handling with devicePixelRatio
    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    updateCanvasSize();

    // Render loop
    const render = () => {
      if (!canvas || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width === 0 || height === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Check if we have active audio data
      let hasSound = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        hasSound = sum / freqData.length > 5;
      }

      ctx.clearRect(0, 0, width, height);

      // Increment idle phase for smooth 60fps ambient drift
      idlePhaseRef.current += 0.025;
      const phase = idlePhaseRef.current;

      if (activeMode === 'bars') {
        renderBarsMode(ctx, width, height, freqData, hasSound, phase, barCount, peaksRef);
      } else if (activeMode === 'wave') {
        renderWaveMode(ctx, width, height, timeData, hasSound, phase);
      } else if (activeMode === 'radial') {
        renderRadialMode(ctx, width, height, freqData, hasSound, phase);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [audioElement, isPlaying, activeMode, barCount]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[160px] overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Visualizer Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Ambient background glow behind visualizer */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/20 via-transparent to-cyan-950/10" />

      {/* Mode Switcher Floating Glass Toolbar */}
      {showControls && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 shadow-lg z-10 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => handleModeSelect('bars')}
            title="Equalizer Bars"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'bars'
                ? 'bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white shadow-md shadow-cyan-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bars</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSelect('wave')}
            title="Sinusoidal Waveform"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'wave'
                ? 'bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white shadow-md shadow-cyan-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wave</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSelect('radial')}
            title="Radial Pulse"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'radial'
                ? 'bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white shadow-md shadow-cyan-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radial</span>
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={() => setIsAutoCycleActive((v) => !v)}
            title={isAutoCycleActive ? 'Disable Auto Cycle' : 'Enable Auto Cycle'}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              isAutoCycleActive
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </button>
        </div>
      )}

      {/* Subtle state badge bottom left */}
      <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 pointer-events-none select-none">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isPlaying ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse' : 'bg-neutral-600'
          }`}
        />
        <span className="text-[11px] font-mono tracking-wider text-neutral-400/80 uppercase">
          {isPlaying ? 'Live Audio Stream' : 'Ambient Standby'}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Render Helper 1: BARS MODE (Equalizer with Neon Gradients & Reflections)
// ---------------------------------------------------------------------------
function renderBarsMode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  hasSound: boolean,
  phase: number,
  barCount: number,
  peaksRef: React.MutableRefObject<number[]>
) {
  const usableHeight = height * 0.72; // Reserve lower 28% for reflection
  const baselineY = usableHeight;
  const gap = 3;
  const totalBarWidth = (width - gap * (barCount - 1)) / barCount;
  const barWidth = Math.max(2, totalBarWidth);

  // Initialize or resize peaks buffer
  if (peaksRef.current.length !== barCount) {
    peaksRef.current = new Array(barCount).fill(0);
  }

  // Pre-calculate neon vertical gradient for bars
  const barGradient = ctx.createLinearGradient(0, baselineY, 0, 0);
  barGradient.addColorStop(0, '#06b6d4'); // Cyan
  barGradient.addColorStop(0.5, '#8b5cf6'); // Purple
  barGradient.addColorStop(1, '#ec4899'); // Neon Pink / Magenta

  // Reflection gradient with fading opacity
  const reflectGradient = ctx.createLinearGradient(0, baselineY, 0, height);
  reflectGradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
  reflectGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
  reflectGradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

  for (let i = 0; i < barCount; i++) {
    let value = 0;

    if (hasSound) {
      // Map bar index to frequency spectrum with bass emphasis
      const freqIndex = Math.floor(Math.pow(i / barCount, 1.4) * (freqData.length * 0.75));
      value = freqData[freqIndex] / 255;
    } else {
      // Ambient undulating idle wave
      const wave1 = Math.sin(phase * 1.5 + i * 0.18);
      const wave2 = Math.cos(phase * 0.8 + i * 0.09);
      value = Math.max(0.08, (wave1 * 0.25 + wave2 * 0.2 + 0.35) * 0.4);
    }

    const barH = Math.max(4, value * (baselineY - 12));
    const x = i * (barWidth + gap);
    const y = baselineY - barH;

    // Peak drop physics
    const currentPeak = peaksRef.current[i] || 0;
    if (barH >= currentPeak) {
      peaksRef.current[i] = barH;
    } else {
      peaksRef.current[i] = Math.max(0, currentPeak - 1.4); // Gravity decay
    }
    const peakY = baselineY - peaksRef.current[i];

    // Main Bar
    ctx.fillStyle = barGradient;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 8;
    drawRoundedRect(ctx, x, y, barWidth, barH, Math.min(barWidth / 2, 4));

    // Peak Cap
    ctx.fillStyle = '#f472b6'; // bright pink cap
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.fillRect(x, Math.max(2, peakY - 3), barWidth, 2);

    // Glowing Reflection below baseline
    const reflectH = barH * 0.45;
    ctx.shadowBlur = 0;
    ctx.fillStyle = reflectGradient;
    drawRoundedRect(ctx, x, baselineY + 3, barWidth, reflectH, Math.min(barWidth / 2, 4));
  }
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Render Helper 2: WAVE MODE (Continuous Sinusoidal Waveform)
// ---------------------------------------------------------------------------
function renderWaveMode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeData: Uint8Array,
  hasSound: boolean,
  phase: number
) {
  const centerY = height * 0.5;
  const pointsCount = 120;
  const points: { x: number; y: number }[] = [];
  const secondaryPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const x = (i / (pointsCount - 1)) * width;
    let y = centerY;
    let ySecondary = centerY;

    if (hasSound) {
      const dataIndex = Math.floor((i / pointsCount) * timeData.length);
      const normalized = (timeData[dataIndex] - 128) / 128; // -1 to +1
      const amp = (height * 0.38) * normalized;
      y = centerY + amp;
      ySecondary = centerY + amp * 0.65 * Math.cos(i * 0.1);
    } else {
      // Fluid idle ambient sine wave
      const s1 = Math.sin(phase * 2 + i * 0.08);
      const s2 = Math.sin(phase * 1.2 + i * 0.04);
      const s3 = Math.cos(phase * 3 + i * 0.12);
      const amp = height * 0.18;
      y = centerY + (s1 * 0.6 + s2 * 0.4) * amp;
      ySecondary = centerY + (s2 * 0.7 + s3 * 0.3) * amp * 0.8;
    }

    points.push({ x, y });
    secondaryPoints.push({ x, y: ySecondary });
  }

  // Draw gradient area underneath secondary wave
  const fillGradient = ctx.createLinearGradient(0, centerY - 60, 0, height);
  fillGradient.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
  fillGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
  fillGradient.addColorStop(1, 'rgba(10, 10, 20, 0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // Secondary wave line (Magenta/Purple ghost harmonic)
  ctx.beginPath();
  ctx.moveTo(secondaryPoints[0].x, secondaryPoints[0].y);
  for (let i = 1; i < secondaryPoints.length; i++) {
    const prev = secondaryPoints[i - 1];
    const curr = secondaryPoints[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Primary wave line (Cyan/Electric Blue glow)
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  ctx.strokeStyle = '#22d3ee'; // bright cyan
  ctx.lineWidth = 3;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Render Helper 3: RADIAL MODE (Orbital Center Pulse with Circular Equalizer)
// ---------------------------------------------------------------------------
function renderRadialMode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  hasSound: boolean,
  phase: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.42;
  const baseRadius = maxRadius * 0.45;
  const radialBars = 64;

  // Center bass calculation
  let bassKick = 0;
  if (hasSound) {
    let bassSum = 0;
    const bassCount = 12;
    for (let b = 0; b < bassCount; b++) {
      bassSum += freqData[b];
    }
    bassKick = (bassSum / bassCount / 255) * 18;
  } else {
    bassKick = Math.sin(phase * 2) * 4;
  }

  const dynamicInnerRadius = Math.max(15, baseRadius + bassKick);

  // Draw Central Glowing Core
  const coreGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    2,
    centerX,
    centerY,
    dynamicInnerRadius
  );
  coreGradient.addColorStop(0, 'rgba(236, 72, 153, 0.85)');
  coreGradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.4)');
  coreGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');

  ctx.beginPath();
  ctx.arc(centerX, centerY, dynamicInnerRadius, 0, Math.PI * 2);
  ctx.fillStyle = coreGradient;
  ctx.shadowColor = '#8b5cf6';
  ctx.shadowBlur = 24;
  ctx.fill();

  // Draw Concentric Ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, dynamicInnerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Draw 360-degree Radial Bars
  for (let i = 0; i < radialBars; i++) {
    const angle = (i / radialBars) * Math.PI * 2 - Math.PI / 2;
    let magnitude = 0;

    if (hasSound) {
      // Symmetry: mirror frequencies on left & right
      const halfIndex = i < radialBars / 2 ? i : radialBars - i;
      const freqIdx = Math.floor(Math.pow(halfIndex / (radialBars / 2), 1.2) * (freqData.length * 0.6));
      magnitude = (freqData[freqIdx] / 255) * (maxRadius - dynamicInnerRadius);
    } else {
      // Ambient radial flower breathing
      const anglePhase = angle * 3 + phase * 2;
      magnitude = (Math.sin(anglePhase) * 0.5 + 0.5) * (maxRadius - dynamicInnerRadius) * 0.45;
    }

    const barLength = Math.max(4, magnitude);

    const x1 = centerX + Math.cos(angle) * (dynamicInnerRadius + 3);
    const y1 = centerY + Math.sin(angle) * (dynamicInnerRadius + 3);
    const x2 = centerX + Math.cos(angle) * (dynamicInnerRadius + 3 + barLength);
    const y2 = centerY + Math.sin(angle) * (dynamicInnerRadius + 3 + barLength);

    const progress = i / radialBars;
    // Dynamic color around circle: cyan -> purple -> pink -> cyan
    const r = Math.floor(6 + Math.abs(Math.sin(progress * Math.PI)) * 230);
    const g = Math.floor(182 - Math.abs(Math.cos(progress * Math.PI)) * 100);
    const b = 240;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
    ctx.lineWidth = Math.max(2, (2 * Math.PI * dynamicInnerRadius) / (radialBars * 1.8));
    ctx.lineCap = 'round';
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.shadowBlur = 8;
    ctx.stroke();
  }

  // Draw outer subtle particle/orbit ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 12]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
}

/**
 * Utility to draw rounded rectangles on HTML5 2D canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

export default AudioVisualizer;
