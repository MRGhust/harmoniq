'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link as LinkIcon,
  Library,
  Upload,
  Play,
  Pause,
  Plus,
  Music,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Sparkles,
  Headphones,
  Info,
} from 'lucide-react';
import { Track } from '@/types/room';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';

export interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
  currentUserId?: string;
  currentUserName?: string;
}

type TabType = 'url' | 'samples' | 'upload';

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  currentUserId = 'user-me',
  currentUserName = 'من',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('url');

  // URL Tab States
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlArtist, setUrlArtist] = useState('');
  const [urlCover, setUrlCover] = useState('');
  const [urlDuration, setUrlDuration] = useState(0);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUrlPreviewing, setIsUrlPreviewing] = useState(false);
  const [isUrlValidating, setIsUrlValidating] = useState(false);

  // Sample Library Preview State
  const [previewingSampleId, setPreviewingSampleId] = useState<string | null>(null);

  // Upload Tab States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadBlobUrl, setUploadBlobUrl] = useState<string | null>(null);
  const [uploadDuration, setUploadDuration] = useState(0);
  const [isUploadPreviewing, setIsUploadPreviewing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Hidden Audio Element for previews
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any playing preview when modal closes or tabs change
  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setIsUrlPreviewing(false);
    setPreviewingSampleId(null);
    setIsUploadPreviewing(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
    }
  }, [isOpen]);

  useEffect(() => {
    stopPreview();
  }, [activeTab]);

  // Audio preview event handlers
  const handlePreviewEnded = () => {
    setIsUrlPreviewing(false);
    setPreviewingSampleId(null);
    setIsUploadPreviewing(false);
  };

  // Helper: Format seconds
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ---- URL TAB LOGIC ----
  const handleTestUrlPreview = () => {
    if (!urlInput.trim()) {
      setUrlError('لطفاً یک لینک معتبر وارد کنید.');
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      setUrlError('آدرس اینترنتی وارد شده معتبر نمی‌باشد.');
      return;
    }

    setUrlError(null);

    if (isUrlPreviewing) {
      stopPreview();
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.onended = handlePreviewEnded;
    }

    const audio = previewAudioRef.current;
    audio.src = urlInput;
    setIsUrlValidating(true);

    audio.onloadedmetadata = () => {
      setUrlDuration(audio.duration || 180);
      setIsUrlValidating(false);
      audio.play().then(() => {
        setIsUrlPreviewing(true);
      }).catch((e) => {
        console.warn('Audio playback error', e);
        setUrlError('امکان پخش این فایل صوتی وجود ندارد (خطای CORS یا فرمت نامعتبر).');
        setIsUrlPreviewing(false);
      });
    };

    audio.onerror = () => {
      setIsUrlValidating(false);
      setIsUrlPreviewing(false);
      setUrlError('فایل صوتی یافت نشد یا دسترسی به آن محدود است.');
    };
  };

  const handleAddUrlTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setUrlError('آدرس فایل صوتی الزامی است.');
      return;
    }

    const newTrack: Track = {
      id: 'track-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: urlTitle.trim() || 'آهنگ بدون عنوان',
      artist: urlArtist.trim() || 'هنرمند ناشناس',
      url: urlInput.trim(),
      duration: urlDuration > 0 ? Math.round(urlDuration) : 180,
      coverUrl: urlCover.trim() || undefined,
      addedBy: {
        id: currentUserId,
        name: currentUserName,
      },
    };

    stopPreview();
    onAddTrack(newTrack);
    // Reset form
    setUrlInput('');
    setUrlTitle('');
    setUrlArtist('');
    setUrlCover('');
    setUrlDuration(0);
    onClose();
  };

  // ---- SAMPLE TAB LOGIC ----
  const handleToggleSamplePreview = (sample: Track) => {
    if (previewingSampleId === sample.id) {
      stopPreview();
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.onended = handlePreviewEnded;
    }

    const audio = previewAudioRef.current;
    audio.src = sample.url;
    audio.play().then(() => {
      setPreviewingSampleId(sample.id);
    }).catch(console.error);
  };

  const handleAddSampleTrack = (sample: Track) => {
    const clonedTrack: Track = {
      ...sample,
      id: 'sample-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      addedBy: {
        id: currentUserId,
        name: currentUserName,
      },
    };
    stopPreview();
    onAddTrack(clonedTrack);
    onClose();
  };

  // ---- UPLOAD TAB LOGIC ----
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i)) {
      alert('لطفاً یک فایل صوتی معتبر (MP3, WAV, AAC, OGG) انتخاب کنید.');
      return;
    }

    // Revoke previous blob url if exists
    if (uploadBlobUrl) {
      URL.revokeObjectURL(uploadBlobUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadBlobUrl(blobUrl);

    // Auto extract title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setUploadTitle(cleanName);
    setUploadArtist('فایل محلی من');

    // Get duration via audio object
    const tempAudio = new Audio(blobUrl);
    tempAudio.onloadedmetadata = () => {
      setUploadDuration(tempAudio.duration || 120);
    };
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleToggleUploadPreview = () => {
    if (!uploadBlobUrl) return;

    if (isUploadPreviewing) {
      stopPreview();
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.onended = handlePreviewEnded;
    }

    const audio = previewAudioRef.current;
    audio.src = uploadBlobUrl;
    audio.play().then(() => {
      setIsUploadPreviewing(true);
    }).catch(console.error);
  };

  const handleAddUploadedTrack = () => {
    if (!uploadBlobUrl || !uploadedFile) return;

    const newTrack: Track = {
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: uploadTitle.trim() || uploadedFile.name,
      artist: uploadArtist.trim() || 'فایل محلی',
      url: uploadBlobUrl,
      duration: Math.round(uploadDuration) || 150,
      addedBy: {
        id: currentUserId,
        name: currentUserName,
      },
    };

    stopPreview();
    onAddTrack(newTrack);
    // Reset upload state
    setUploadedFile(null);
    setUploadBlobUrl(null);
    setUploadTitle('');
    setUploadArtist('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#12121e]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col my-auto max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  افزودن آهنگ به اتاق (Add Track)
                </h3>
                <p className="text-xs text-white/50">
                  انتخاب از لینک مستقیم، کتابخانه نمونه یا فایل صوتی شما
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopPreview();
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-black/20 px-3 pt-2 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'url'
                  ? 'bg-[#181829] text-purple-300 border-t-2 border-purple-500 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>لینک مستقیم (Direct URL)</span>
            </button>

            <button
              onClick={() => setActiveTab('samples')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'samples'
                  ? 'bg-[#181829] text-cyan-300 border-t-2 border-cyan-500 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>آهنگ‌های آماده و ترند (Sample Library)</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#181829] text-emerald-300 border-t-2 border-emerald-500 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>فایل صوتی شما (Local File)</span>
            </button>
          </div>

          {/* Modal Body / Tabs Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* TAB 1: DIRECT URL */}
            {activeTab === 'url' && (
              <form onSubmit={handleAddUrlTrack} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    آدرس مستقیم فایل صوتی (Audio URL) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/audio.mp3"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError(null);
                      }}
                      className="w-full bg-black/40 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition"
                    />
                    {urlInput && (
                      <button
                        type="button"
                        onClick={handleTestUrlPreview}
                        disabled={isUrlValidating}
                        className={`absolute left-2 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                          isUrlPreviewing
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                        }`}
                      >
                        {isUrlValidating ? (
                          <span>بررسی...</span>
                        ) : isUrlPreviewing ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>توقف پیش‌نمایش</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>تست صدا</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {urlError ? (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {urlError}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-white/40">
                      پشتیبانی از انواع فرمت‌های صوتی MP3، AAC، WAV و پادکست‌های آنلاین مستقیم.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      عنوان آهنگ (Track Title)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: قطعه بی کلام پاییز"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      نام هنرمند / خواننده (Artist)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شجریان / Lofi Beats"
                      value={urlArtist}
                      onChange={(e) => setUrlArtist(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    تصویر کاور (اختیاری - Cover Image URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={urlCover}
                    onChange={(e) => setUrlCover(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن به پلی‌لیست</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SAMPLE LIBRARY */}
            {activeTab === 'samples' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 text-xs text-white/50">
                  <span>آهنگ‌های پرطرفدار آماده با لینک مطمئن و سرعت بالا:</span>
                  <span>{SAMPLE_TRACKS.length} قطعه موجود</span>
                </div>

                <div className="space-y-2">
                  {SAMPLE_TRACKS.map((sample) => {
                    const isPreviewing = previewingSampleId === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                            {sample.coverUrl && (
                              <img
                                src={sample.coverUrl}
                                alt={sample.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleSamplePreview(sample)}
                              className={`absolute inset-0 flex items-center justify-center transition ${
                                isPreviewing
                                  ? 'bg-purple-900/60 text-cyan-300'
                                  : 'bg-black/40 text-white group-hover:bg-black/60'
                              }`}
                            >
                              {isPreviewing ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-xs sm:text-sm truncate">
                              {sample.title}
                            </h4>
                            <p className="text-[11px] text-white/50 truncate">
                              {sample.artist}
                            </p>
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {formatDuration(sample.duration)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSampleTrack(sample)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD LOCAL FILE */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center min-h-[160px] ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/15 bg-black/20 hover:border-white/30'
                  }`}
                >
                  <input
                    type="file"
                    id="audio-file-input"
                    accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="audio-file-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-white">
                      فایل صوتی خود را اینجا بکشید یا برای انتخاب کلیک کنید
                    </span>
                    <span className="text-xs text-white/40 mt-1">
                      فرمت‌های مجاز: MP3, WAV, AAC, OGG (پخش مستقیم بدون آپلود سرور)
                    </span>
                  </label>
                </div>

                {/* Selected File Details */}
                {uploadedFile && (
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>فایل آماده است: {uploadedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleUploadPreview}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1.5 transition"
                      >
                        {isUploadPreviewing ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>توقف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>پخش پیش‌نمایش ({formatDuration(uploadDuration)})</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          عنوان آهنگ
                        </label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full bg-black/40 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          نام هنرمند
                        </label>
                        <input
                          type="text"
                          value={uploadArtist}
                          onChange={(e) => setUploadArtist(e.target.value)}
                          className="w-full bg-black/40 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleAddUploadedTrack}
                        className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>افزودن این فایل به صف پخش</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/40">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    فایل‌های محلی با قابلیت پیشرفته Web Audio در مرورگر شما پخش می‌شوند و سایر اعضا از طریق جریان P2P یا بازپخش هماهنگ همگام‌سازی می‌گردند.
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default AddTrackModal;
