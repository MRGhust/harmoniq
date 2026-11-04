'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  Radio,
  Server,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { RoomData, UserRole } from '@/types/room';

interface RoomHeaderProps {
  room: RoomData;
  userCount: number;
  userRole: UserRole;
  isServerHosted?: boolean;
  onOpenInvite: () => void;
  onOpenUsers: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  userCount,
  userRole,
  isServerHosted = true,
  onOpenInvite,
  onOpenUsers,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-[#0d0e17] border-b border-[#1c1e2d] px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Radio className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
              Harmoniq
            </span>
          </Link>

          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Room Title & Server Status */}
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-semibold text-white text-sm sm:text-base truncate">
              {room.name}
            </h1>

            <button
              onClick={copyRoomCode}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161826] hover:bg-[#1e2033] border border-white/5 text-[11px] text-slate-400 font-mono transition"
              title="کپی شناسه اتاق"
            >
              <span>{room.id}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Center: Server-Hosted Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Server className="w-3.5 h-3.5" />
          <span>میزبانی متمرکز سرور • فعال</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Invite Button */}
          <button
            onClick={onOpenInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flat-button-primary text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دعوت دوستان</span>
          </button>

          {/* Online Members Button */}
          <button
            onClick={onOpenUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flat-button text-xs font-medium text-slate-300 hover:text-white"
            title="اعضای حاضر در اتاق"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-800 text-slate-200 px-1.5 py-0.2 rounded-md font-mono text-[11px]">
              {userCount}
            </span>
          </button>

          {/* Settings Button (Host only) */}
          {userRole === 'host' && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl flat-button text-slate-400 hover:text-white"
              title="تنظیمات اتاق"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl flat-button text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20"
            title="خروج از اتاق"
          >
            <LogOut className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </header>
  );
};
