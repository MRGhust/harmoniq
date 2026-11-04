'use client';

import React, { useState } from 'react';
import { Settings, Shield, Lock, MessageSquare, Heart, X, Check } from 'lucide-react';
import { RoomSettings } from '@/types/room';

interface RoomSettingsModalProps {
  isOpen: boolean;
  settings: RoomSettings;
  onClose: () => void;
  onSave: (newSettings: RoomSettings) => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<RoomSettings>({ ...settings });
  const [password, setPassword] = useState(settings.password || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      password: form.isPrivate ? password : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Settings className="w-5 h-5 text-purple-400" />
            <span>تنظیمات و دسترسی‌های اتاق</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Permission: Members add tracks */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <p className="text-sm font-medium text-white">افزودن آهنگ توسط همه اعضا</p>
              <p className="text-xs text-slate-400">
                در صورت غیرفعال بودن، فقط میزبان و دی‌جی اجازه اضافه کردن موزیک دارند.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.allowMembersToAddTracks}
              onChange={(e) =>
                setForm({ ...form, allowMembersToAddTracks: e.target.checked })
              }
              className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Permission: Members control playback */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <p className="text-sm font-medium text-white">کنترل پخش (Play/Pause/Seek) توسط همه</p>
              <p className="text-xs text-slate-400">
                اگر خاموش باشد، فقط نقش‌های مجاز (DJ و میزبان) آهنگ را کنترل می‌کنند.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.allowMembersToControlPlayback}
              onChange={(e) =>
                setForm({ ...form, allowMembersToControlPlayback: e.target.checked })
              }
              className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Chat Enabled */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-sm font-medium text-white">فعال بودن چت اتاق</p>
                <p className="text-xs text-slate-400">امکان ارسال پیام متنی توسط اعضا</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.chatEnabled}
              onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })}
              className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Reactions Enabled */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <div>
                <p className="text-sm font-medium text-white">ریکشن‌های ایموجی معلق</p>
                <p className="text-xs text-slate-400">نمایش ایموجی‌های پروانه‌ای روی صفحه</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.reactionsEnabled}
              onChange={(e) =>
                setForm({ ...form, reactionsEnabled: e.target.checked })
              }
              className="w-5 h-5 rounded accent-pink-500 cursor-pointer"
            />
          </div>

          {/* Private Room Toggle & Password */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-white">اتاق خصوصی با رمز عبور</p>
              </div>
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
              />
            </div>

            {form.isPrivate && (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور ورود به اتاق..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-button text-xs font-medium text-slate-300 hover:text-white"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-lg shadow-purple-500/20 transition transform active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
