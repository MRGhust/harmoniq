'use client';

import React, { useState } from 'react';
import { Settings, Shield, Lock, MessageSquare, Heart, X, Check, Disc3 } from 'lucide-react';
import { RoomSettings } from '@/types/room';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md flat-card overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-[#1c1e2d] flex items-center justify-between bg-[#141522]">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>تنظیمات و دسترسی‌های اتاق</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
          {/* Permission 1: Add tracks */}
          <ToggleSwitch
            checked={form.allowMembersToAddTracks}
            onChange={(checked) => setForm({ ...form, allowMembersToAddTracks: checked })}
            icon={<Disc3 className="w-4 h-4 text-emerald-400" />}
            label="افزودن آهنگ توسط همه اعضا"
            description="اگر غیرفعال شود، تنها میزبان و دی‌جی اجازه اضافه کردن قطعات جدید را دارند."
          />

          {/* Permission 2: Control playback */}
          <ToggleSwitch
            checked={form.allowMembersToControlPlayback}
            onChange={(checked) => setForm({ ...form, allowMembersToControlPlayback: checked })}
            icon={<Shield className="w-4 h-4 text-cyan-400" />}
            label="کنترل پخش (Play / Pause / Seek) برای همه"
            description="در حالت خاموش، کنترل پخش به صورت انحصاری در اختیار میزبان و دی‌جی قرار می‌گیرد."
          />

          {/* Permission 3: Chat */}
          <ToggleSwitch
            checked={form.chatEnabled}
            onChange={(checked) => setForm({ ...form, chatEnabled: checked })}
            icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
            label="گفتگوی زنده اتاق"
            description="امکان ارسال پیام متنی توسط اعضای حاضر در اتاق."
          />

          {/* Permission 4: Reactions */}
          <ToggleSwitch
            checked={form.reactionsEnabled}
            onChange={(checked) => setForm({ ...form, reactionsEnabled: checked })}
            icon={<Heart className="w-4 h-4 text-rose-400" />}
            label="واکنش‌های ایموجی معلق"
            description="امکان ارسال ریکشن‌های متحرک روی صفحه برای اعضا."
          />

          {/* Permission 5: Private with password */}
          <div className="p-3.5 rounded-xl border border-[#1c1e2d] bg-[#11121d] space-y-3">
            <div
              onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  اتاق خصوصی با رمز عبور
                </span>
              </div>
              <div dir="ltr" className="shrink-0">
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    form.isPrivate ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      form.isPrivate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            {form.isPrivate && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور ورود به این اتاق..."
                className="w-full bg-[#161726] border border-[#24273d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl flat-button text-xs text-slate-400 hover:text-white"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl flat-button-primary text-xs font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره تنظیمات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
