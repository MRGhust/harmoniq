'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FloatingReaction } from '@/types/room';

export interface EmojiReactionsProps {
  reactions?: FloatingReaction[];
  onSendReaction: (emoji: string) => void;
  disabled?: boolean;
  currentUserName?: string;
}

interface LocalFloatingItem {
  id: string;
  emoji: string;
  userName?: string;
  x: number; // percentage from 10% to 90%
  duration: number; // duration of flight
  size: number; // px size
}

const AVAILABLE_EMOJIS = [
  { emoji: '❤️', label: 'عشق (Love)' },
  { emoji: '🔥', label: 'آتشین (Fire)' },
  { emoji: '🎵', label: 'موزیک (Music)' },
  { emoji: '🚀', label: 'فوق‌العاده (Rocket)' },
  { emoji: '👏', label: 'تشویق (Clap)' },
  { emoji: '🎉', label: 'جشن (Party)' },
  { emoji: '🎧', label: 'هدفون (Headphones)' },
  { emoji: '💃', label: 'رقص (Dance)' },
];

export const EmojiReactions: React.FC<EmojiReactionsProps> = ({
  reactions = [],
  onSendReaction,
  disabled = false,
  currentUserName = 'من',
}) => {
  const [floatingItems, setFloatingItems] = useState<LocalFloatingItem[]>([]);
  const [clickedEmoji, setClickedEmoji] = useState<string | null>(null);

  // Sync external reactions incoming from network into floating items
  useEffect(() => {
    if (!reactions || reactions.length === 0) return;

    const latest = reactions[reactions.length - 1];
    if (!latest) return;

    const newItem: LocalFloatingItem = {
      id: latest.id || 'rx-' + Date.now() + '-' + Math.random(),
      emoji: latest.emoji,
      userName: latest.userName,
      x: latest.x || Math.floor(15 + Math.random() * 70),
      duration: 3 + Math.random() * 1.5,
      size: 28 + Math.floor(Math.random() * 16),
    };

    setFloatingItems((prev) => [...prev.slice(-30), newItem]);
  }, [reactions]);

  // Handle User Click on reaction bar
  const handleEmojiClick = (emoji: string, event: React.MouseEvent) => {
    if (disabled) return;

    setClickedEmoji(emoji);
    setTimeout(() => setClickedEmoji(null), 300);

    // Confetti burst for celebratory emojis
    if (emoji === '🎉' || emoji === '🔥' || emoji === '🚀') {
      try {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 25,
          spread: 60,
          origin: { x: originX, y: originY },
          colors: ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b'],
          disableForReducedMotion: true,
        });
      } catch {
        // Fallback silently if canvas not available
      }
    }

    // Immediate local feedback item
    const localItem: LocalFloatingItem = {
      id: 'local-' + Date.now() + '-' + Math.random(),
      emoji,
      userName: currentUserName,
      x: Math.floor(20 + Math.random() * 60),
      duration: 3.2 + Math.random() * 1.2,
      size: 32 + Math.floor(Math.random() * 14),
    };

    setFloatingItems((prev) => [...prev.slice(-30), localItem]);

    // Send to other room peers
    onSendReaction(emoji);
  };

  // Remove item once animation finishes
  const handleAnimationComplete = (id: string) => {
    setFloatingItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      {/* Floating Reactions Overlay Container */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {floatingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                y: window.innerHeight || 800,
                x: `${item.x}vw`,
                scale: 0.4,
                rotate: -15,
              }}
              animate={{
                opacity: [0, 1, 1, 0.8, 0],
                y: -120,
                x: [
                  `${item.x}vw`,
                  `${item.x + (Math.random() * 8 - 4)}vw`,
                  `${item.x + (Math.random() * 12 - 6)}vw`,
                ],
                scale: [0.4, 1.2, 1, 0.9, 0.7],
                rotate: [
                  -10,
                  Math.random() * 20 - 10,
                  Math.random() * -20 + 10,
                  0,
                ],
              }}
              transition={{
                duration: item.duration,
                ease: 'easeOut',
              }}
              onAnimationComplete={() => handleAnimationComplete(item.id)}
              className="absolute bottom-0 flex flex-col items-center select-none"
              style={{
                fontSize: `${item.size}px`,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            >
              <span>{item.emoji}</span>
              {item.userName && (
                <span className="text-[10px] text-white/80 font-medium bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm -mt-1 shadow whitespace-nowrap">
                  {item.userName}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji Reaction Bar at bottom */}
      <div className="flex items-center justify-center pointer-events-auto">
        <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-2xl bg-[#12121e]/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-950/30">
          <span className="hidden md:inline text-[11px] text-white/40 pl-1 font-medium select-none">
            واکنش زنده:
          </span>

          {AVAILABLE_EMOJIS.map(({ emoji, label }) => {
            const isJustClicked = clickedEmoji === emoji;

            return (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.35, y: -4 }}
                whileTap={{ scale: 0.85 }}
                disabled={disabled}
                onClick={(e) => handleEmojiClick(emoji, e)}
                title={label}
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed select-none ${
                  isJustClicked ? 'bg-purple-500/30 ring-2 ring-purple-400' : ''
                }`}
              >
                <span>{emoji}</span>

                {/* Subtle ripple effect on click */}
                {isJustClicked && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-xl bg-purple-400/40 pointer-events-none"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
};
export default EmojiReactions;
