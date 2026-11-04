'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  Radio,
  Lock,
  Globe,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import { RoomData, UserRole } from '@/types/room';

interface RoomHeaderProps {
  room: RoomData;
  userCount: number;
  userRole: UserRole;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  onOpenInvite: () => void;
  onOpenUsers: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  userCount,
  userRole,
  connectionStatus,
  onOpenInvite,
  onOpenUsers,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">اتصال زنده</span>
          </span>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="hidden sm:inline">در حال اتصال...</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="hidden sm:inline">قطع اتصال</span>
          </span>
        );
    }
  };

  return (
    <header className="w-full glass-panel border-b border-white/10 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left / Start: Logo & Room details */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            title="بازگشت به صفحه اصلی"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <span className="hidden md:inline font-bold text-lg gradient-text tracking-wide">
              Harmoniq
            </span>
          </Link>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Room info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm sm:text-base truncate">
                {room.name}
              </h1>
              {room.settings.isPrivate ? (
                <span title="اتاق خصوصی" className="inline-flex items-center">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </span>
              ) : (
                <span title="اتاق عمومی" className="inline-flex items-center">
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>کد:</span>
              <button
                onClick={copyRoomCode}
                className="font-mono bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-purple-300 flex items-center gap-1 transition"
                title="کپی شناسه اتاق"
              >
                <span>{room.id}</span>
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Live status badge */}
        <div className="hidden lg:block">
          {getStatusBadge()}
        </div>

        {/* Right / End Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Invite Button */}
          <button
            onClick={onOpenInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-cyan-600/80 hover:from-purple-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-500/20 transition transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">دعوت دوستان</span>
          </button>

          {/* Users List Button */}
          <button
            onClick={onOpenUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-slate-200 text-xs sm:text-sm font-medium hover:text-white"
            title="اعضای حاضر در روم"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full text-xs font-mono">
              {userCount}
            </span>
          </button>

          {/* Settings Button (Host only) */}
          {userRole === 'host' && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl glass-button text-slate-300 hover:text-white"
              title="تنظیمات اتاق"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl glass-button text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition"
            title="خروج از اتاق"
          >
            <LogOut className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </header>
  );
};
