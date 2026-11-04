'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Plus,
  LogIn,
  Headphones,
  Zap,
  Shield,
  Music,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Github,
  Play,
  Volume2,
  Lock,
  Globe,
  Smile,
  Edit2,
  Check,
} from 'lucide-react';
import { getLocalUserProfile, saveLocalUserProfile, LocalUserProfile } from '@/lib/storage';
import { PRESET_AVATARS } from '@/lib/sampleTracks';

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Form states
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  useEffect(() => {
    const p = getLocalUserProfile();
    setProfile(p);
    setTempName(p.name);
    setTempAvatar(p.avatar);

    // Fetch active rooms
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms) setActiveRooms(data.rooms);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = {
      ...profile,
      name: tempName.trim() || profile.name,
      avatar: tempAvatar,
    };
    saveLocalUserProfile(updated);
    setProfile(updated);
    setIsEditingProfile(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          description: roomDescription,
          isPrivate,
          password: isPrivate ? roomPassword : '',
          ownerId: profile?.id,
          ownerName: profile?.name,
        }),
      });

      const data = await res.json();
      if (data.success && data.room) {
        router.push(`/room/${data.room.id}`);
      } else {
        alert(data.error || 'خطا در ساخت اتاق');
      }
    } catch (err) {
      // Fallback direct nav
      const slug = roomName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'room';
      router.push(`/room/${slug}-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim();
    if (!clean) return;
    router.push(`/room/${clean}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="w-full glass-panel border-b border-white/10 px-4 md:px-8 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight gradient-text">
                Harmoniq
              </span>
              <span className="hidden sm:inline-block mr-2 text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                همگام و بدون تاخیر
              </span>
            </div>
          </Link>

          {/* User Quick Profile & GitHub Link */}
          <div className="flex items-center gap-3">
            {profile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-full glass-button group text-right"
                title="تغییر نام و آواتار"
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-purple-500/40 group-hover:border-purple-400 transition"
                />
                <span className="text-xs font-medium text-slate-200 group-hover:text-white hidden sm:inline">
                  {profile.name}
                </span>
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-purple-300 hidden sm:inline" />
              </button>
            )}

            <a
              href="https://github.com/MRGhust"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl glass-button text-slate-300 hover:text-white transition"
              title="مشاهده سورس در گیتهاب"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex-1 flex flex-col justify-center items-center text-center">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-cyan-500/15 to-emerald-500/15 border border-purple-500/30 text-purple-300 text-xs md:text-sm font-medium mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>پخش ۱۰۰٪ هماهنگ موسیقی • بدون نیاز به سرور پولی</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl">
          با دوستانت <span className="gradient-text">همزمان و هماهنگ</span> موزیک گوش بده!
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-light">
          اتاق بسازید، دوستانتان را دعوت کنید، کنترل پخش و پلی‌لیست را مدیریت کنید و در لحظه با ریکشن و چت زنده، لذت موسیقی دورهمی را تجربه کنید.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-base md:text-lg shadow-xl shadow-purple-600/30 hover:shadow-cyan-500/30 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            <span>ساخت اتاق جدید (رایگان)</span>
          </button>

          <button
            onClick={() => setIsJoinOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel glass-panel-hover text-white font-semibold text-base md:text-lg border border-white/10 hover:border-white/20 transition flex items-center justify-center gap-3"
          >
            <LogIn className="w-5 h-5 text-cyan-400" />
            <span>ورود با کد یا لینک اتاق</span>
          </button>
        </div>

        {/* Active / Featured Rooms Showcase */}
        {activeRooms.length > 0 && (
          <div className="w-full max-w-3xl mb-16 text-right">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>اتاق‌های فعال و عمومی هم‌اکنون:</span>
              </h2>
              <span className="text-xs text-slate-400">یک کلیک برای ورود</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.id}`}
                  className="p-4 rounded-2xl glass-panel glass-panel-hover flex items-center justify-between text-right border border-white/10 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white group-hover:text-cyan-300 transition truncate">
                        {room.name}
                      </span>
                      {room.isPrivate ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Globe className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {room.nowPlaying ? `در حال پخش: ${room.nowPlaying}` : room.description}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition shrink-0 mr-3">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-right">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">همگام‌سازی فوق دقیق</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              با الگوریتم اصلاح انحراف فرکانسی (Drift Correction)، همه افراد اتاق در یک ثانیه دقیق به صورت همزمان به موسیقی گوش می‌دهند.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">مدیریت نقش‌ها و دسترسی</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              سازنده می‌تواند نقش دی‌جی (DJ) به دوستانش بدهد، دسترسی کنترل موزیک را محدود کند یا حتی کاربری را از اتاق اخراج کند.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 text-pink-400 group-hover:scale-110 transition">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">پلی‌لیست و ویژوالایزر نئون</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              پشتیبانی از لینک‌های مستقیم، رادیو آنلاین و آپلود فایل با اکولایزر تصویری زنده روی کانوَس و ریکشن‌های متحرک پروانه‌ای.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/10 px-4 md:px-8 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Harmoniq</span>
            <span>•</span>
            <span>اوپن سورس، رایگان و بدون تحریم</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/MRGhust"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>مخزن گیت‌هاب</span>
            </a>
            <span>•</span>
            <span>ساخته شده با Next.js و WebRTC</span>
          </div>
        </div>
      </footer>

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>ساخت اتاق جدید موسیقی</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              اتاق شما فوراً ساخته می‌شود و می‌توانید لینک آن را به دوستانتان بفرستید.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  نام اتاق <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دورهمی شبانه با بچه‌ها"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  توضیح کوتاه (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثال: گوش دادن به آهنگ‌های جدید"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-white">اتاق خصوصی با رمز</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                  />
                </div>

                {isPrivate && (
                  <input
                    type="password"
                    placeholder="رمز ورود دلخواه..."
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!roomName.trim() || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ساخت...' : 'ورود و راه‌اندازی اتاق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-cyan-400" />
              <span>پیوستن به اتاق موجود</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              شناسه یا کد اتاقی که دوستانتان برای شما فرستاده‌اند را وارد کنید:
            </p>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="مثال: chill-lounge یا کد ۶ رقمی"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono text-center tracking-wider"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-button text-xs font-medium text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition transform active:scale-95 disabled:opacity-50"
                >
                  پیوستن به اتاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smile className="w-5 h-5 text-purple-400" />
              <span>تنظیم نام و چهره کاربری شما</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  انتخاب آواتار:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempAvatar(av)}
                      className={`p-1.5 rounded-xl border transition transform hover:scale-105 ${
                        tempAvatar === av
                          ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/40'
                          : 'border-white/10 bg-slate-900/60'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-12 h-12 rounded-lg mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  نام نمایشی در روم:
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  maxLength={24}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl glass-button text-xs font-medium text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
