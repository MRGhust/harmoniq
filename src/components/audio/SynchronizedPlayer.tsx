'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Server,
  Lock,
  Radio,
  Sliders,
} from 'lucide-react';
import { Track, PlaybackState, UserRole } from '@/types/room';
import { getAudioAnalyser } from '@/lib/audioContext';

interface SynchronizedPlayerProps {
  currentTrack: Track | null;
  playback: PlaybackState;
  userRole: UserRole;
  allowMembersToControl: boolean;
  onPlayStateChange: (isPlaying: boolean, currentTime: number) => void;
  onSeek: (newTime: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onChangeLoopMode?: (mode: 'none' | 'one' | 'all') => void;
  loopMode?: 'none' | 'one' | 'all';
}

export const SynchronizedPlayer: React.FC<SynchronizedPlayerProps> = ({
  currentTrack,
  playback,
  userRole,
  allowMembersToControl,
  onPlayStateChange,
  onSeek,
  onNextTrack,
  onPrevTrack,
  onChangeLoopMode,
  loopMode = 'all',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(playback.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const canControl = userRole === 'host' || userRole === 'dj' || allowMembersToControl;

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Connect Audio Analyser for visualizer
  useEffect(() => {
    if (audioRef.current) {
      getAudioAnalyser(audioRef.current);
    }
  }, [currentTrack]);

  // Handle track source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
    }
  }, [currentTrack]);

  // Synchronize with server playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || isSeeking) return;

    // Check play/pause state
    if (playback.isPlaying && audio.paused) {
      audio.play().catch(() => {});
    } else if (!playback.isPlaying && !audio.paused) {
      audio.pause();
    }

    // Check drift against server position
    const serverPosition = playback.currentTime;
    const drift = Math.abs(audio.currentTime - serverPosition);

    if (drift > 1.2) {
      audio.currentTime = serverPosition;
    } else if (drift > 0.25) {
      // Soft catch-up: slightly tune speed
      audio.playbackRate = audio.currentTime < serverPosition ? 1.05 : 0.95;
    } else {
      audio.playbackRate = 1.0;
    }
  }, [playback.isPlaying, playback.currentTime, currentTrack, isSeeking]);

  // Animation frame for local timeline
  useEffect(() => {
    let animId: number;
    const updateProgress = () => {
      if (audioRef.current && !isSeeking) {
        setLocalCurrentTime(audioRef.current.currentTime);
      }
      animId = requestAnimationFrame(updateProgress);
    };
    animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, [isSeeking]);

  // Update audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!canControl || !currentTrack) return;
    setHasInteracted(true);
    const nextState = !playback.isPlaying;
    const pos = audioRef.current ? audioRef.current.currentTime : localCurrentTime;
    onPlayStateChange(nextState, pos);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (!canControl) return;
    if (audioRef.current) {
      audioRef.current.currentTime = localCurrentTime;
    }
    onSeek(localCurrentTime);
  };

  const toggleLoop = () => {
    if (!onChangeLoopMode) return;
    const modes: ('none' | 'one' | 'all')[] = ['all', 'one', 'none'];
    const next = modes[(modes.indexOf(loopMode) + 1) % modes.length];
    onChangeLoopMode(next);
  };

  const currentDuration = duration || currentTrack?.duration || 180;
  const progressPercent = currentDuration > 0 ? (localCurrentTime / currentDuration) * 100 : 0;

  return (
    <div className="w-full flat-card p-5 sm:p-6 relative overflow-hidden flex flex-col gap-5">
      {/* Hidden HTML5 Audio Tag */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || currentTrack?.duration || 0)}
        onEnded={onNextTrack}
      />

      {/* Autoplay Unblocker Banner if paused by browser */}
      {!hasInteracted && playback.isPlaying && (
        <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>پخش هماهنگ سرور فعال است. برای روشن شدن صدای دستگاه کلیک کنید:</span>
          </div>
          <button
            onClick={() => {
              setHasInteracted(true);
              audioRef.current?.play().catch(() => {});
            }}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
          >
            فعال‌سازی صدا
          </button>
        </div>
      )}

      {/* Top Section: Media Artwork & Details */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Flat Minimalist Artwork Box */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shrink-0 shadow-lg group">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 gap-1">
              <Radio className="w-8 h-8 text-emerald-400/60" />
              <span className="text-[11px] font-mono">Harmoniq</span>
            </div>
          )}

          {/* Playing wave badge */}
          {playback.isPlaying && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE</span>
            </div>
          )}
        </div>

        {/* Track Title, Artist, & Cloud Hosting Indicator */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium w-fit mb-2 self-center sm:self-start">
            <Server className="w-3 h-3" />
            <span>میزبانی مستقل روی سرور ابری • بدون وابستگی به اینترنت افراد</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white truncate mb-1">
            {currentTrack ? currentTrack.title : 'هیچ آهنگی در صف نیست'}
          </h2>

          <p className="text-sm text-slate-400 truncate mb-2">
            {currentTrack ? currentTrack.artist : 'از بخش صف، آهنگ دلخواه خود را اضافه کنید'}
          </p>

          {currentTrack?.addedBy?.name && (
            <p className="text-xs text-slate-500">
              اضافه شده توسط: <span className="text-slate-300">{currentTrack.addedBy.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Middle Section: Seek Slider & Timers */}
      <div className="space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={currentDuration}
            step={0.1}
            value={localCurrentTime}
            disabled={!canControl}
            onMouseDown={() => canControl && setIsSeeking(true)}
            onTouchStart={() => canControl && setIsSeeking(true)}
            onChange={(e) => setLocalCurrentTime(parseFloat(e.target.value))}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${
              canControl
                ? 'bg-slate-800 accent-emerald-400 hover:h-2'
                : 'bg-slate-800 accent-slate-600 cursor-not-allowed opacity-60'
            }`}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 font-mono px-0.5">
          <span>{formatTime(localCurrentTime)}</span>
          {!canControl && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400/90 font-sans">
              <Lock className="w-3 h-3" />
              کنترل اختصاصی با میزبان یا دی‌جی
            </span>
          )}
          <span>{formatTime(currentDuration)}</span>
        </div>
      </div>

      {/* Bottom Section: Standard Symmetrical Media Controls & Local Volume */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
        {/* Left Side: Loop Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLoop}
            className={`p-2 rounded-xl transition ${
              loopMode === 'none'
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            }`}
            title={`حالت تکرار: ${loopMode === 'one' ? 'تک‌آهنگ' : loopMode === 'all' ? 'کل صف' : 'خاموش'}`}
          >
            {loopMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Center: Main Playback Controls (Prev, Play/Pause, Next) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevTrack}
            disabled={!canControl}
            className={`p-2.5 rounded-xl text-slate-300 hover:text-white flat-button transition ${
              !canControl && 'opacity-40 cursor-not-allowed'
            }`}
            title="آهنگ قبلی"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!canControl || !currentTrack}
            className={`w-13 h-13 p-3.5 rounded-2xl flex items-center justify-center transition transform active:scale-95 shadow-md ${
              canControl && currentTrack
                ? 'flat-button-primary shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
            className={`p-2.5 rounded-xl text-slate-300 hover:text-white flat-button transition ${
              !canControl && 'opacity-40 cursor-not-allowed'
            }`}
            title="آهنگ بعدی"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Local Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition p-1.5"
            title={isMuted ? 'باز کردن صدا' : 'بی‌صدا'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
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
            className="w-16 sm:w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            title={`صدای دستگاه: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
};
