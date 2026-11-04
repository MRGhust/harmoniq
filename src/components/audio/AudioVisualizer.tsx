'use client';

import React, { useEffect, useRef } from 'react';
import { getAudioAnalyser } from '@/lib/audioContext';

export type VisualizerMode = 'bars' | 'wave' | 'radial';

export interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  mode?: VisualizerMode;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let idlePhase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const analyser = getAudioAnalyser();
      const numBars = 36;
      const barSpacing = 4;
      const totalSpacing = (numBars - 1) * barSpacing;
      const barWidth = Math.max(2, (width - totalSpacing) / numBars);

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Render sleek flat bars
        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * (bufferLength * 0.6));
          const value = dataArray[dataIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * height * 0.85);

          const x = i * (barWidth + barSpacing);
          const y = (height - barHeight) / 2;

          // Flat Emerald to Cyan Gradient
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#06b6d4');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Subtle ambient idle breathing wave
        idlePhase += 0.04;
        for (let i = 0; i < numBars; i++) {
          const sine = Math.sin(idlePhase + i * 0.25);
          const barHeight = isPlaying ? 8 + sine * 6 : 4 + Math.abs(sine) * 3;
          const x = i * (barWidth + barSpacing);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = isPlaying ? '#10b981' : '#222538';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Handle high DPI
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying]);

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-8 opacity-80"
        style={{ display: 'block' }}
      />
    </div>
  );
};
