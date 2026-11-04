'use client';

import React from 'react';
import {
  Music,
  Plus,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Radio,
  Clock,
  Sparkles,
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
  allowMembersToAddTracks = true,
  onSelectTrack,
  onMoveTrack,
  onRemoveTrack,
  onClearPlaylist,
  onOpenAddTrack,
  onLoadSampleTracks,
}) => {
  const canManageQueue = userRole === 'host' || userRole === 'dj' || allowMembersToAddTracks;
  const isHost = userRole === 'host';

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '3:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full flat-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1c1e2d] flex items-center justify-between bg-[#141522]">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">صف پخش موسیقی</h3>
          <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
            {playlist.length}
          </span>
        </div>

        <button
          onClick={onOpenAddTrack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flat-button-primary text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن آهنگ</span>
        </button>
      </div>

      {/* Tracks List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[300px] max-h-[520px]">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12 text-center">
            <Music className="w-10 h-10 text-slate-600 mb-3 stroke-1" />
            <p className="font-medium text-slate-300 mb-1">صف پخش خالی است</p>
            <p className="text-slate-500 mb-4">آهنگ دلخواه خود را اضافه کنید یا از لیست پیش‌فرض استفاده نمایید.</p>
            {onLoadSampleTracks && (
              <button
                onClick={onLoadSampleTracks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flat-button text-xs text-emerald-400 hover:text-emerald-300"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بارگذاری آهنگ‌های نمونه</span>
              </button>
            )}
          </div>
        ) : (
          playlist.map((track, idx) => {
            const isCurrent = idx === currentTrackIndex;

            return (
              <div
                key={track.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-[#181a29] border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'bg-[#131420] border-transparent hover:border-[#212436] hover:bg-[#161726]'
                }`}
              >
                {/* Left: Thumbnail & Track info */}
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectTrack && onSelectTrack(idx)}
                >
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/5">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Music className="w-5 h-5" />
                      </div>
                    )}

                    {/* Playing indicator */}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {track.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-medium shrink-0">
                          در حال پخش
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                      <span className="truncate">{track.artist}</span>
                      <span>•</span>
                      <span className="font-mono">{formatDuration(track.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Move & Remove) */}
                {canManageQueue && (
                  <div className="flex items-center gap-1 shrink-0 mr-2">
                    {onMoveTrack && (
                      <>
                        <button
                          onClick={() => onMoveTrack(idx, Math.max(0, idx - 1))}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20 transition"
                          title="انتقال به بالا"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onMoveTrack(idx, Math.min(playlist.length - 1, idx + 1))}
                          disabled={idx === playlist.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20 transition"
                          title="انتقال به پایین"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {onRemoveTrack && (
                      <button
                        onClick={() => onRemoveTrack(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition ml-1"
                        title="حذف از صف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear Queue button for Host */}
      {isHost && playlist.length > 0 && onClearPlaylist && (
        <div className="p-3 border-t border-[#1c1e2d] bg-[#11121d] flex justify-end">
          <button
            onClick={onClearPlaylist}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition"
          >
            پاکسازی کل صف
          </button>
        </div>
      )}
    </div>
  );
};
