'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Disc, Play, Pause, Sparkles } from 'lucide-react';

export interface VinylCoverProps {
  /** Track album art URL */
  coverUrl?: string;
  /** Song title */
  title?: string;
  /** Artist name */
  artist?: string;
  /** Whether track is actively playing */
  isPlaying?: boolean;
  /** Size variant or exact px diameter */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show realistic turntable tonearm needle */
  showTonearm?: boolean;
  /** Optional play/pause click handler */
  onTogglePlay?: () => void;
  /** Optional extra Tailwind class */
  className?: string;
}

export const VinylCover: React.FC<VinylCoverProps> = ({
  coverUrl,
  title = 'Untitled Track',
  artist = 'Harmoniq Audio',
  isPlaying = false,
  size = 'lg',
  showTonearm = true,
  onTogglePlay,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine pixel dimension based on size prop
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 180;
      case 'md':
        return 240;
      case 'xl':
        return 380;
      case 'lg':
      default:
        return 300;
    }
  };

  const dimension = getDimension();
  const vinylSize = Math.round(dimension * 0.88);
  const centerLabelSize = Math.round(vinylSize * 0.36);

  const hasValidCover = !!coverUrl && !imgError;

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center ${className}`}
      style={{ width: dimension + (showTonearm ? 48 : 0), height: dimension + 36 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Turntable Platter Base Platform */}
      <div
        className="relative flex items-center justify-center rounded-3xl bg-[#11121d] border border-[#1e2030] p-4 transition-all duration-500"
        style={{
          width: dimension,
          height: dimension,
          boxShadow: isPlaying
            ? '0 0 30px -10px rgba(16, 185, 129, 0.25)'
            : 'none',
        }}
      >
        {/* Subtle Platter Well Inset Ring */}
        <div
          className="absolute rounded-full border border-white/5 bg-neutral-900/60 shadow-inner"
          style={{ width: vinylSize + 12, height: vinylSize + 12 }}
        />

        {/* Ambient Platter Neon Backlight Glow */}
        <motion.div
          animate={{
            opacity: isPlaying ? [0.4, 0.7, 0.4] : 0.2,
            scale: isPlaying ? [0.98, 1.02, 0.98] : 0.95,
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-600/30 to-pink-500/20 blur-xl pointer-events-none"
          style={{ width: vinylSize + 20, height: vinylSize + 20 }}
        />

        {/* THE VINYL RECORD */}
        <motion.div
          animate={{
            rotate: isPlaying ? 360 : 0,
          }}
          transition={
            isPlaying
              ? { repeat: Infinity, duration: 4, ease: 'linear' }
              : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }
          className="relative rounded-full flex items-center justify-center cursor-pointer shadow-2xl"
          style={{
            width: vinylSize,
            height: vinylSize,
            background:
              'radial-gradient(circle at 50% 50%, #161622 0%, #0d0d14 70%, #08080d 100%)',
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.8), inset 0 0 1px 1px rgba(255,255,255,0.08), inset 0 0 20px rgba(0,0,0,0.9)',
          }}
          onClick={onTogglePlay}
        >
          {/* Vinyl Grooves Texture */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `repeating-radial-gradient(
                circle at 50% 50%,
                transparent 0,
                transparent 2px,
                rgba(255, 255, 255, 0.025) 3px,
                transparent 4px
              )`,
            }}
          />

          {/* Anisotropic Vinyl Sheen Reflection Glare (Dual Triangular Highlights) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-40 mix-blend-screen"
            style={{
              background: `conic-gradient(
                from 35deg at 50% 50%,
                transparent 0deg,
                rgba(255, 255, 255, 0.12) 35deg,
                transparent 70deg,
                transparent 180deg,
                rgba(255, 255, 255, 0.12) 215deg,
                transparent 250deg,
                transparent 360deg
              )`,
            }}
          />

          {/* Outer Vinyl Edge Lip */}
          <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

          {/* Run-out groove ring */}
          <div
            className="absolute rounded-full border border-neutral-700/40 pointer-events-none"
            style={{ width: centerLabelSize + 22, height: centerLabelSize + 22 }}
          />

          {/* Center Label / Album Artwork */}
          <div
            className="relative rounded-full overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-md group"
            style={{ width: centerLabelSize, height: centerLabelSize }}
          >
            {hasValidCover ? (
              <img
                src={coverUrl}
                alt={title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              /* Fallback Artwork Design */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-purple-900 via-indigo-950 to-cyan-900 p-2 text-center text-white">
                <Music2 className="w-5 h-5 text-cyan-400 mb-0.5 animate-pulse" />
                <span className="text-[8px] font-bold tracking-tight text-neutral-200 line-clamp-1">
                  {title}
                </span>
                <span className="text-[7px] text-cyan-300/80 line-clamp-1">
                  {artist}
                </span>
              </div>
            )}

            {/* Brass Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-gradient-to-b from-amber-300 via-amber-600 to-amber-900 border border-amber-200 flex items-center justify-center shadow-md">
              <div className="w-2 h-2 rounded-full bg-neutral-950 shadow-inner" />
            </div>

            {/* Hover Play/Pause Overlay indicator */}
            {onTogglePlay && (
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white drop-shadow-md" />
                    ) : (
                      <Play className="w-6 h-6 text-cyan-400 drop-shadow-md ml-0.5" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* REALISTIC TURNTABLE TONEARM */}
        {showTonearm && (
          <div
            className="absolute top-2 right-2 pointer-events-none"
            style={{ width: 60, height: dimension * 0.9 }}
          >
            {/* Tonearm Base / Gimbal Pivot */}
            <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950 border border-neutral-600 shadow-xl flex items-center justify-center">
              {/* Metallic Pivot Ring */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-400 via-neutral-600 to-neutral-800 border border-white/20 shadow-md flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 shadow-inner" />
              </div>
              {/* Counterweight cylinder behind pivot */}
              <div className="absolute -top-3.5 right-1.5 w-7 h-4 rounded-sm bg-gradient-to-r from-neutral-500 via-neutral-300 to-neutral-600 border border-white/20 shadow-md" />
            </div>

            {/* Tonearm Rotating Body */}
            <motion.div
              initial={false}
              animate={{
                rotate: isPlaying ? 34 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 45,
                damping: 14,
                mass: 1.2,
              }}
              style={{
                transformOrigin: '28px 22px',
              }}
              className="absolute top-2 right-2 w-14 h-full"
            >
              {/* Curved Aluminum Tonearm Tube (SVG Path for precision) */}
              <svg
                viewBox="0 0 60 220"
                className="w-full h-[220px] overflow-visible drop-shadow-lg"
              >
                <defs>
                  <linearGradient id="tonearmMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>

                {/* S-Shaped Tone Arm Rod */}
                <path
                  d="M 28 22 Q 26 80, 20 120 T 12 180 L 8 200"
                  fill="none"
                  stroke="url(#tonearmMetal)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Headshell / Cartridge block */}
                <polygon
                  points="2,196 16,192 12,216 -2,220"
                  fill="#1e293b"
                  stroke="#64748b"
                  strokeWidth="1"
                />

                {/* Stylus / Needle Indicator */}
                <circle cx="5" cy="216" r="2.5" fill="#f43f5e" />
              </svg>

              {/* Glowing Laser / Needle Contact Light when playing */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute bottom-2 left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                />
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Track Info Caption with glass badge */}
      {(title || artist) && (
        <div className="mt-3 flex items-center gap-2 max-w-[280px] px-3 py-1.5 rounded-full bg-neutral-900/60 backdrop-blur-md border border-white/5 shadow-sm text-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
          <div className="truncate text-xs">
            <span className="font-semibold text-neutral-100 truncate">{title}</span>
            <span className="text-neutral-400 font-normal ml-1.5 truncate">
              • {artist}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinylCover;
