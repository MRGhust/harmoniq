'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ShieldAlert, Zap } from 'lucide-react';
import { Track, PlaybackState, UserRole } from '@/types/room';
import { SyncEngine } from '@/lib/syncEngine';
import { getAudioAnalyser } from '@/lib/audioContext';

interface SynchronizedPlayerProps {
  currentTrack: Track | null;
  playback: PlaybackState;
  userRole: UserRole;
  allowMembersToControl: boolean;
  syncEngine: SyncEngine;
  onPlayStateChange: (isPlaying: boolean, currentTime: number) => void;
  onSeek: (newTime: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const SynchronizedPlayer: React.FC<SynchronizedPlayerProps> = ({
  currentTrack,
  playback,
  userRole,
  allowMembersToControl,
  syncEngine,
  onPlayStateChange,
  onSeek,
  onNextTrack,
  onPrevTrack,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isCatchingUp, setIsCatchingUp] = useState(false);

  const canControl = userRole === 'host' || userRole === 'dj' || allowMembersToControl;

  // Format time utility mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Connect Web Audio API Analyser
  useEffect(() => {
    if (audioRef.current) {
      getAudioAnalyser(audioRef.current);
    }
  }, [currentTrack]);

  // Handle source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
    }
  }, [currentTrack]);

  // Synchronization reconciliation loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const interval = setInterval(() => {
      if (isSeeking) return;

      const expected = syncEngine.calculateExpectedTime(
        playback.currentTime,
        playback.isPlaying,
        playback.updatedAt,
        playback.playbackRate
      );

      const result = syncEngine.reconcile(audio, expected, playback.isPlaying);
      setIsCatchingUp(result.action === 'rate-adjust');

      if (!isSeeking) {
        setLocalCurrentTime(audio.currentTime);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [playback, syncEngine, currentTrack, isSeeking]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!canControl) return;
    setHasUserInteracted(true);
    const audio = audioRef.current;
    const nextState = !playback.isPlaying;
    const time = audio ? audio.currentTime : playback.currentTime;
    onPlayStateChange(nextState, time);
  };

  // Handle Seek slider
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setLocalCurrentTime(target);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (!canControl) return;
    if (audioRef.current) {
      audioRef.current.currentTime = localCurrentTime;
    }
    onSeek(localCurrentTime);
  };

  const handleSeekStart = () => {
    if (canControl) {
      setIsSeeking(true);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 md:p-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient subtle glow */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || currentTrack?.duration || 0)}
        onEnded={onNextTrack}
      />

      {/* Autoplay blocker banner if needed */}
      {!hasUserInteracted && playback.isPlaying && (
        <div className="mb-4 bg-purple-900/40 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-purple-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <span>پخش آغاز شده است. برای فعال‌سازی صدا و همگامی کلیک کنید:</span>
          </div>
          <button
            onClick={() => {
              setHasUserInteracted(true);
              if (audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
            }}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition"
          >
            فعال‌سازی صدا
          </button>
        </div>
      )}

      {/* Track Info Display */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-lg relative group">
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-800/40 to-cyan-800/40 text-purple-300 font-bold text-lg">
                HQ
              </div>
            )}
            {playback.isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                <span className="w-1 bg-cyan-400 rounded-full eq-bar-1" />
                <span className="w-1 bg-purple-400 rounded-full eq-bar-2" />
                <span className="w-1 bg-pink-400 rounded-full eq-bar-3" />
                <span className="w-1 bg-emerald-400 rounded-full eq-bar-4" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white text-base md:text-lg truncate">
              {currentTrack ? currentTrack.title : 'صف پخش خالی است'}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 truncate">
              {currentTrack ? currentTrack.artist : 'آهنگی به لیست اضافه کنید'}
            </p>
          </div>
        </div>

        {/* Catch-up pill */}
        {isCatchingUp && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            در حال تطبیق نرم
          </div>
        )}
      </div>

      {/* Progress Bar & Timers */}
      <div className="space-y-1 mb-5">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={duration || currentTrack?.duration || 100}
            step={0.1}
            value={localCurrentTime}
            disabled={!canControl}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className={`w-full h-1.5 md:h-2 rounded-lg appearance-none cursor-pointer transition-all ${
              canControl
                ? 'bg-slate-700/80 accent-purple-500 hover:h-2.5'
                : 'bg-slate-800 accent-slate-500 cursor-not-allowed opacity-75'
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>{formatTime(localCurrentTime)}</span>
          {!canControl && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
              <ShieldAlert className="w-3 h-3" />
              کنترل فقط با دی‌جی یا میزبان
            </span>
          )}
          <span>{formatTime(duration || currentTrack?.duration || 0)}</span>
        </div>
      </div>

      {/* Main Controls & Local Volume */}
      <div className="flex items-center justify-between gap-2">
        {/* Playback Controls (Previous, Play/Pause, Next) */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onPrevTrack}
            disabled={!canControl}
            className={`p-2.5 rounded-xl text-slate-300 hover:text-white transition ${
              canControl ? 'glass-button' : 'opacity-40 cursor-not-allowed'
            }`}
            title="آهنگ قبلی"
          >
            <SkipForward className="w-5 h-5 rotate-180" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!canControl || !currentTrack}
            className={`p-3.5 md:p-4 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 shadow-lg ${
              canControl && currentTrack
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
            title={playback.isPlaying ? 'توقف' : 'پخش'}
          >
            {playback.isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            disabled={!canControl}
            className={`p-2.5 rounded-xl text-slate-300 hover:text-white transition ${
              canControl ? 'glass-button' : 'opacity-40 cursor-not-allowed'
            }`}
            title="آهنگ بعدی"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Local Volume Slider (Individual to each user) */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-xl">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition"
            title={isMuted ? 'صدا را باز کن' : 'بی‌صدا'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-16 md:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            title={`صدای محلی: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
};
