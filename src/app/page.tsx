'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Plus,
  LogIn,
  Server,
  Shield,
  Music,
  Users,
  Play,
  Lock,
  Globe,
  Edit2,
  Github,
  Zap,
} from 'lucide-react';
import { getLocalUserProfile, saveLocalUserProfile, LocalUserProfile } from '@/lib/storage';
import { PRESET_AVATARS } from '@/lib/sampleTracks';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

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
        alert(data.error || 'خطا در ایجاد اتاق');
      }
    } catch (err) {
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
    <div className="min-h-screen flex flex-col justify-between bg-[#090a10] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <nav className="w-full bg-[#0d0e17] border-b border-[#1c1e2d] px-4 md:px-8 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">Harmoniq</span>
              <span className="hidden sm:inline-block mr-2 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Cloud Hosted
              </span>
            </div>
          </Link>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {profile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-xl flat-button text-right"
                title="تغییر نام و آواتار"
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10"
                />
                <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                  {profile.name}
                </span>
                <Edit2 className="w-3 h-3 text-slate-500 hidden sm:inline" />
              </button>
            )}

            <a
              href="https://github.com/MRGhust/harmoniq"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl flat-button text-slate-400 hover:text-white transition"
              title="مشاهده سورس گیت‌هاب"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-14 flex-1 flex flex-col justify-center items-center text-center">
        {/* Server Hosted Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <Server className="w-3.5 h-3.5" />
          <span>میزبانی متمرکز ابری • موسیقی با قطع اینترنت سازنده هرگز قطع نمی‌شود</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 tracking-tight leading-tight max-w-3xl">
          پخش همگام موسیقی، <span className="text-emerald-400">میزبانی شده روی سرور</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal">
          اتاق بسازید، دوستانتان را دعوت کنید، نقش دی‌جی تعیین کنید و با کیفیت بالا و تاخیر صفر همگی با هم به موسیقی گوش دهید.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-16">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl flat-button-primary text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>ساخت اتاق جدید</span>
          </button>

          <button
            onClick={() => setIsJoinOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl flat-button text-sm font-semibold flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>ورود با کد اتاق</span>
          </button>
        </div>

        {/* Public Rooms */}
        {activeRooms.length > 0 && (
          <div className="w-full max-w-2xl mb-14 text-right">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>اتاق‌های فعال هم‌اکنون</span>
              </h2>
              <span className="text-xs text-slate-500">یک کلیک برای ورود فوری</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.id}`}
                  className="p-3.5 rounded-xl flat-card flex items-center justify-between text-right group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-400 transition truncate">
                        {room.name}
                      </span>
                      {room.isPrivate ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Globe className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {room.nowPlaying ? `در حال پخش: ${room.nowPlaying}` : room.description}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition mr-2 shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Core Architecture Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-right">
          <div className="flat-card p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">میزبانی سرور مرکزی (Server Clock)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اتاق‌ها و موقعیت زمانی روی سرور محاسبه می‌شوند؛ خروج سازنده یا کندی اینترنت او هیچ اثری روی پخش بقیه افراد ندارد.
            </p>
          </div>

          <div className="flat-card p-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">سطوح دسترسی و دی‌جی (Role Control)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              سازنده می‌تواند اختیارات را مدیریت کند، به افراد نقش DJ بدهد یا کنترل پخش را فقط برای افراد مجاز باز بگذارد.
            </p>
          </div>

          <div className="flat-card p-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">طراحی مینیمال و فلت (Ultra Clean)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              رابط کاربری مدرن، کادربندی استاندارد، پخش‌کننده متوازن بدون المان‌های شلوغ، و سازگاری بی‌نقص با موبایل و دسکتاپ.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0d0e17] border-t border-[#1c1e2d] px-4 md:px-8 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Harmoniq • پلتفرم پخش همزمان موسیقی روی سرور ابری</span>
          <a
            href="https://github.com/MRGhust/harmoniq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-400 transition"
          >
            مشاهده در گیت‌هاب (MRGhust/harmoniq)
          </a>
        </div>
      </footer>

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md flat-card p-6 text-right animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>ساخت اتاق جدید موسیقی</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              اتاق روی سرور ایجاد شده و لینک آن بلافاصله قابل اشتراک‌گذاری است.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  نام اتاق <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دورهمی دوستانه شبانه"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  توضیح کوتاه (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثال: پخش آهنگ‌های پاپ و بی‌کلام"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <ToggleSwitch
                checked={isPrivate}
                onChange={(checked) => setIsPrivate(checked)}
                icon={<Lock className="w-4 h-4 text-amber-400" />}
                label="اتاق خصوصی با رمز عبور"
                description="تنها افراد دارای رمز عبور اجازه ورود به این اتاق را خواهند داشت."
              />

              {isPrivate && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    رمز عبور اتاق <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="رمز ورود به این اتاق..."
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl flat-button text-xs font-medium text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!roomName.trim() || isSubmitting}
                  className="px-5 py-2 rounded-xl flat-button-primary text-xs font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ساخت...' : 'ورود و شروع اتاق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md flat-card p-6 text-right animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" />
              <span>پیوستن به اتاق موجود</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              شناسه یا کد اتاقی که دوستانتان فرستاده‌اند را وارد نمایید:
            </p>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="مثال: chill-lounge یا کد اتاق"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono text-center placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 rounded-xl flat-button text-xs font-medium text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-5 py-2 rounded-xl flat-button-primary text-xs font-bold disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md flat-card p-6 text-right animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-3">
              تنظیم پروفایل و چهره کاربری
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  تصویر فعلی:
                </label>
                <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-[#131420] border border-[#1e2030]">
                  <img
                    src={tempAvatar}
                    alt="Current Avatar"
                    className="w-14 h-14 rounded-xl object-cover bg-slate-800 border-2 border-emerald-500 shrink-0"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="avatar-file-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg flat-button text-xs text-emerald-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>آپلود عکس از گوشی یا دستگاه</span>
                    </label>
                    <input
                      type="file"
                      id="avatar-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const { compressAvatarImage } = await import('@/lib/storage');
                            const compressed = await compressAvatarImage(file);
                            setTempAvatar(compressed);
                          } catch (err) {
                            console.error('Failed to compress avatar image:', err);
                          }
                        }
                      }}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      پشتیبانی از انواع عکس گالری و دوربین گوشی
                    </p>
                  </div>
                </div>

                <label className="block text-xs text-slate-400 mb-2">
                  یا انتخاب از چهره‌های آماده:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempAvatar(av)}
                      className={`p-1 rounded-xl border transition ${
                        tempAvatar === av
                          ? 'border-emerald-500 bg-emerald-500/20'
                          : 'border-white/5 bg-slate-900'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-10 h-10 rounded-lg mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  نام در اتاق‌ها:
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  maxLength={24}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl flat-button text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl flat-button-primary text-xs font-bold"
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
