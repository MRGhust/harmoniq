'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Plus,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Repeat,
  Repeat1,
  ListMusic,
  Clock,
  Sparkles,
  AlertCircle,
  Disc3,
  User,
} from 'lucide-react';
import { Track, UserRole } from '@/types/room';

export interface PlaylistQueueProps {
  playlist: Track[];
  currentTrackIndex: number;
  isPlaying?: boolean;
  userRole: UserRole;
  loopMode: 'none' | 'one' | 'all';
  allowMembersToAddTracks?: boolean;
  onSelectTrack?: (index: number) => void;
  onMoveTrack?: (fromIndex: number, toIndex: number) => void;
  onRemoveTrack?: (index: number) => void;
  onClearPlaylist?: () => void;
  onOpenAddTrack: () => void;
  onChangeLoopMode?: (mode: 'none' | 'one' | 'all') => void;
  onLoadSampleTracks?: () => void;
}

export const PlaylistQueue: React.FC<PlaylistQueueProps> = ({
  playlist,
  currentTrackIndex,
  isPlaying = false,
  userRole,
  loopMode,
  allowMembersToAddTracks = true,
  onSelectTrack,
  onMoveTrack,
  onRemoveTrack,
  onClearPlaylist,
  onOpenAddTrack,
  onChangeLoopMode,
  onLoadSampleTracks,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isHost = userRole === 'host';
  const isDJ = userRole === 'dj';
  const canManage = isHost || isDJ;
  const canAdd = canManage || allowMembersToAddTracks;

  // Format seconds into mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cycleLoopMode = () => {
    if (!onChangeLoopMode) return;
    if (loopMode === 'none') {
      onChangeLoopMode('all');
    } else if (loopMode === 'all') {
      onChangeLoopMode('one');
    } else {
      onChangeLoopMode('none');
    }
  };

  const getLoopModeLabel = () => {
    switch (loopMode) {
      case 'one':
        return { text: 'تکرار آهنگ (Repeat 1)', icon: <Repeat1 className="w-3.5 h-3.5 text-cyan-400" /> };
      case 'all':
        return { text: 'تکرار لیست (Repeat All)', icon: <Repeat className="w-3.5 h-3.5 text-purple-400" /> };
      default:
        return { text: 'بدون تکرار (No Loop)', icon: <Repeat className="w-3.5 h-3.5 text-gray-500 opacity-60" /> };
    }
  };

  return (
    <div className="w-full flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base tracking-wide">
                صف پخش (Playlist Queue)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                {playlist.length}
              </span>
            </div>
            <p className="text-xs text-white/50">
              {playlist.length > 0
                ? `${playlist.length} آهنگ در صف انتظار`
                : 'آهنگی در صف وجود ندارد'}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {/* Loop Mode Toggle */}
          {onChangeLoopMode && (
            <button
              onClick={cycleLoopMode}
              title="تغییر حالت تکرار"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                loopMode !== 'none'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              {getLoopModeLabel().icon}
              <span className="hidden sm:inline">{getLoopModeLabel().text}</span>
            </button>
          )}

          {/* Clear Playlist (Host only) */}
          {isHost && playlist.length > 0 && onClearPlaylist && (
            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/40 rounded-xl px-2 py-1">
                  <span className="text-xs text-red-300">مطمئنید؟</span>
                  <button
                    onClick={() => {
                      onClearPlaylist();
                      setShowClearConfirm(false);
                    }}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded font-medium transition"
                  >
                    بله
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-xs text-white/70 hover:text-white px-1.5"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="پاک‌سازی کامل صف پخش"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">پاک کردن</span>
                </button>
              )}
            </div>
          )}

          {/* Add Track prominent button */}
          {canAdd && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAddTrack}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آهنگ</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Playlist Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[220px]">
        {playlist.length === 0 ? (
          /* Empty State */
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
              <Disc3 className="w-8 h-8 animate-spin-slow text-purple-400/70" />
            </div>
            <h3 className="text-white font-bold text-base mb-1">
              صف پخش خالی است
            </h3>
            <p className="text-white/50 text-xs sm:text-sm max-w-sm mb-5">
              هیچ آهنگی در صف قرار ندارد. برای شروع، آهنگ دلخواه خود را اضافه کنید یا از نمونه‌های آماده استفاده نمایید.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {canAdd && (
                <button
                  onClick={onOpenAddTrack}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن اولین آهنگ</span>
                </button>
              )}

              {onLoadSampleTracks && canManage && (
                <button
                  onClick={onLoadSampleTracks}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/20 transition"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>بارگذاری آهنگ‌های ترند و آماده</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {playlist.map((track, index) => {
              const isCurrent = index === currentTrackIndex;

              return (
                <motion.div
                  key={`${track.id}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative rounded-xl p-2.5 sm:p-3 transition-all flex items-center gap-3 border ${
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-900/40 to-slate-900/60 border-purple-500/50 shadow-lg shadow-purple-900/20'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Track Index or Playing Indicator */}
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {isCurrent ? (
                      <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                        <span
                          className={`w-1 bg-cyan-400 rounded-full ${
                            isPlaying ? 'eq-bar-1' : 'h-2'
                          }`}
                        />
                        <span
                          className={`w-1 bg-purple-400 rounded-full ${
                            isPlaying ? 'eq-bar-2' : 'h-3'
                          }`}
                        />
                        <span
                          className={`w-1 bg-emerald-400 rounded-full ${
                            isPlaying ? 'eq-bar-3' : 'h-1.5'
                          }`}
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-white/40 group-hover:hidden">
                        {index + 1}
                      </span>
                    )}

                    {!isCurrent && canManage && onSelectTrack && (
                      <button
                        onClick={() => onSelectTrack(index)}
                        title="پخش این آهنگ"
                        className="hidden group-hover:flex w-6 h-6 rounded-full bg-white/10 hover:bg-purple-600 items-center justify-center text-white transition"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail / Cover */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10 shadow">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-900/80 to-slate-900 text-purple-300">
                        <Music className="w-5 h-5" />
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute inset-0 bg-purple-600/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-semibold text-xs sm:text-sm truncate ${
                          isCurrent
                            ? 'text-white font-bold'
                            : 'text-white/90 group-hover:text-white'
                        }`}
                        title={track.title}
                      >
                        {track.title}
                      </h4>

                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-cyan-300 border border-purple-500/30 shrink-0">
                          در حال پخش
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5 truncate">
                      <span className="truncate">{track.artist || 'هنرمند ناشناس'}</span>
                      {track.addedBy?.name && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="flex items-center gap-0.5 text-white/40 truncate text-[10px]">
                            <User className="w-2.5 h-2.5" />
                            {track.addedBy.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-white/40 font-mono shrink-0 pl-2">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span>{formatDuration(track.duration)}</span>
                  </div>

                  {/* Actions (Reorder & Delete) */}
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      {onMoveTrack && (
                        <button
                          disabled={index === 0}
                          onClick={() => onMoveTrack(index, index - 1)}
                          title="انتقال به بالا"
                          className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      )}

                      {/* Move Down */}
                      {onMoveTrack && (
                        <button
                          disabled={index === playlist.length - 1}
                          onClick={() => onMoveTrack(index, index + 1)}
                          title="انتقال به پایین"
                          className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove Track */}
                      {onRemoveTrack && (
                        <button
                          onClick={() => onRemoveTrack(index)}
                          title="حذف از پلی‌لیست"
                          className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-white/40">
        <span>موقعیت جاری: {playlist.length > 0 ? `${currentTrackIndex + 1} از ${playlist.length}` : 'خالی'}</span>
        <div className="flex items-center gap-2">
          {canManage ? (
            <span className="text-emerald-400/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              دسترسی مدیریت صف
            </span>
          ) : (
            <span className="text-white/40">حالت شنونده</span>
          )}
        </div>
      </div>
    </div>
  );
};
export default PlaylistQueue;
