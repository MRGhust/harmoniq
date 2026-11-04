'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Link as LinkIcon,
  Radio,
  Upload,
  Play,
  Pause,
  Plus,
  Check,
  Music,
  AlertCircle,
} from 'lucide-react';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';
import { Track } from '@/types/room';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: {
    title: string;
    artist: string;
    url: string;
    duration?: number;
    coverUrl?: string;
  }) => void;
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'streams' | 'upload'>('url');

  // URL Tab States
  const [directUrl, setDirectUrl] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Audio preview player
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedBlobUrl, setUploadedBlobUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePreview = (url: string) => {
    if (!previewAudioRef.current) return;
    if (previewUrl === url && isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      setPreviewUrl(url);
      previewAudioRef.current.src = url;
      previewAudioRef.current.play().then(() => setIsPreviewPlaying(true)).catch(() => {});
    }
  };

  const handleAddDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    onAddTrack({
      title: trackTitle.trim() || 'آهنگ بدون عنوان',
      artist: trackArtist.trim() || 'هنرمند ناشناس',
      url: directUrl.trim(),
      coverUrl: coverUrl.trim() || undefined,
      duration: 210,
    });

    handleClose();
  };

  const handleAddStream = (track: Track) => {
    onAddTrack({
      title: track.title,
      artist: track.artist,
      url: track.url,
      coverUrl: track.coverUrl,
      duration: track.duration,
    });
    handleClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const blobUrl = URL.createObjectURL(file);
    setUploadedBlobUrl(blobUrl);

    // Auto extract title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTrackTitle(cleanName);
    setTrackArtist('فایل محلی');
  };

  const handleConfirmFileUpload = () => {
    if (!uploadedBlobUrl || !selectedFile) return;

    onAddTrack({
      title: trackTitle || selectedFile.name,
      artist: trackArtist || 'فایل محلی',
      url: uploadedBlobUrl,
      duration: 240,
    });

    handleClose();
  };

  const handleClose = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewUrl(null);
    setIsPreviewPlaying(false);
    setDirectUrl('');
    setTrackTitle('');
    setTrackArtist('');
    setCoverUrl('');
    setSelectedFile(null);
    setUploadedBlobUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      {/* Hidden audio for preview */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setIsPreviewPlaying(false)}
        crossOrigin="anonymous"
      />

      <div className="w-full max-w-lg flat-card overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1c1e2d] flex items-center justify-between bg-[#141522]">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>افزودن آهنگ به صف پخش</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1c1e2d] bg-[#0f101a] p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'url'
                ? 'bg-[#181a29] text-white border border-[#23273e]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>لینک مستقیم / استریم</span>
          </button>

          <button
            onClick={() => setActiveTab('streams')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'streams'
                ? 'bg-[#181a29] text-white border border-[#23273e]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>رادیوهای زنده ۲۴/۷</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-[#181a29] text-white border border-[#23273e]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>آپلود فایل دستگاه</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: Direct URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleAddDirectUrl} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  لینک مستقیم فایل صوتی یا استریم (MP3, AAC, OGG, HLS) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/audio.mp3"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    نام آهنگ
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: Starboy"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    نام خواننده
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: The Weeknd"
                    value={trackArtist}
                    onChange={(e) => setTrackArtist(e.target.value)}
                    className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  لینک کاور آرت (اختیاری)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>

              {directUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => togglePreview(directUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flat-button text-xs text-slate-300 hover:text-white"
                  >
                    {isPreviewPlaying && previewUrl === directUrl ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-emerald-400" />
                        <span>توقف تست صدا</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تست پخش زنده</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1e2d]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl flat-button text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!directUrl.trim()}
                  className="px-5 py-2 rounded-xl flat-button-primary text-xs font-bold disabled:opacity-50"
                >
                  افزودن به صف پخش
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Live Internet Radio Stations */}
          {activeTab === 'streams' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400 mb-3">
                ایستگاه‌های رادیویی با کیفیت و بدون وقفه ۲۴ ساعته اینترنتی:
              </p>

              {SAMPLE_TRACKS.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#131420] border border-[#1e2030] hover:border-emerald-500/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={stream.coverUrl}
                      alt={stream.title}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {stream.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {stream.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 mr-2">
                    <button
                      type="button"
                      onClick={() => togglePreview(stream.url)}
                      className="p-2 rounded-lg flat-button text-slate-300 hover:text-white"
                      title="پیش‌شنوایی"
                    >
                      {isPreviewPlaying && previewUrl === stream.url ? (
                        <Pause className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddStream(stream)}
                      className="px-3 py-1.5 rounded-lg flat-button-primary text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Local File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#24273d] hover:border-emerald-500/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-[#131420]">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-file-input"
                />
                <label
                  htmlFor="audio-file-input"
                  className="cursor-pointer flex flex-col items-center w-full"
                >
                  <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-xs font-semibold text-white mb-1">
                    برای انتخاب فایل از گوشی یا کامپیوتر کلیک کنید
                  </p>
                  <p className="text-[11px] text-slate-500">
                    پشتیبانی از فرمت‌های MP3, WAV, AAC, OGG
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="p-3.5 rounded-xl bg-[#141624] border border-[#22253b] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">
                        {selectedFile.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="عنوان آهنگ"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      className="bg-[#1a1c2e] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="خواننده"
                      value={trackArtist}
                      onChange={(e) => setTrackArtist(e.target.value)}
                      className="bg-[#1a1c2e] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmFileUpload}
                      className="px-4 py-2 rounded-xl flat-button-primary text-xs font-bold w-full flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>افزودن فایل به صف اتاق</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
