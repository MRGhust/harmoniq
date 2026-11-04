'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Crown,
  Disc3,
  Shield,
  Headphones,
  Volume2,
  VolumeX,
  UserX,
  MoreVertical,
  Activity,
  Search,
  Wifi,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { RoomUser, UserRole } from '@/types/room';

export interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: RoomUser[];
  currentUserId: string;
  currentUserRole: UserRole;
  onUpdateRole?: (userId: string, newRole: UserRole) => void;
  onToggleMute?: (userId: string) => void;
  onKickUser?: (userId: string) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onToggleMute,
  onKickUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [confirmKickUserId, setConfirmKickUserId] = useState<string | null>(null);

  const isHost = currentUserRole === 'host';
  const isModerator = currentUserRole === 'moderator';
  const canModerate = isHost || isModerator;

  // Filter users based on search
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const hostsCount = users.filter((u) => u.role === 'host').length;
  const djsCount = users.filter((u) => u.role === 'dj').length;
  const modCount = users.filter((u) => u.role === 'moderator').length;
  const listenerCount = users.filter((u) => u.role === 'listener').length;

  const validLatencies = users.map((u) => u.latencyMs || 25);
  const avgLatency = Math.round(
    validLatencies.reduce((a, b) => a + b, 0) / (validLatencies.length || 1)
  );

  // Latency badge helper
  const getLatencyBadge = (latency: number = 25) => {
    let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    let dot = 'bg-emerald-400';
    if (latency > 150) {
      color = 'text-red-400 bg-red-500/10 border-red-500/30';
      dot = 'bg-red-400';
    } else if (latency > 70) {
      color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      dot = 'bg-amber-400';
    }

    return (
      <span
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono ${color}`}
        title={`تاخیر پینگ: ${latency} میلی‌ثانیه`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
        <span>{latency}ms</span>
      </span>
    );
  };

  // Role badge helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>میزبان (Host)</span>
          </span>
        );
      case 'dj':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Disc3 className="w-3.5 h-3.5 text-purple-400" />
            <span>دی‌جی (DJ)</span>
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>ناظر (Moderator)</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
            <Headphones className="w-3.5 h-3.5 text-white/40" />
            <span>شنونده (Listener)</span>
          </span>
        );
    }
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
          className="relative w-full max-w-xl bg-[#12121e]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col my-auto max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    کاربران حاضر در اتاق (Room Members)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                    {users.length}
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  مدیریت دسترسی‌ها و بررسی وضعیت اتصال افراد
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 border-b border-white/10 bg-black/30 divide-x divide-x-reverse divide-white/5 text-center py-2.5">
            <div>
              <span className="block text-[11px] text-white/40">آنلاین</span>
              <span className="text-sm font-bold text-white">{users.length} نفر</span>
            </div>
            <div>
              <span className="block text-[11px] text-white/40">نقش‌ها</span>
              <span className="text-xs font-semibold text-purple-300">
                {hostsCount} میزبان • {djsCount} دی‌جی
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-white/40">میانگین تاخیر</span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {avgLatency}ms
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-white/5 bg-white/[0.01]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-white/30 absolute right-3 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجوی نام کاربر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 rounded-xl pr-9 pl-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs">
                هیچ کاربری با این نام یافت نشد.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isMe = user.id === currentUserId;
                const isTargetHost = user.role === 'host';
                const showMenu = activeMenuUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="relative flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition"
                  >
                    {/* User Profile */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="relative w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/15">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {user.isMuted && (
                          <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                            <VolumeX className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs sm:text-sm truncate">
                            {user.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
                              شما
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Latency and Action Menu */}
                    <div className="flex items-center gap-2 shrink-0">
                      {getLatencyBadge(user.latencyMs)}

                      {/* Management Action Menu Button */}
                      {isHost && !isMe && !isTargetHost && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuUserId(showMenu ? null : user.id)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {showMenu && (
                            <div className="absolute left-0 mt-1 w-44 rounded-xl bg-[#1b1b2d] border border-white/15 shadow-2xl p-1.5 z-20 space-y-1">
                              <span className="block px-2.5 py-1 text-[10px] text-white/40 font-semibold border-b border-white/5">
                                تغییر نقش (Change Role)
                              </span>

                              {/* Promote to DJ */}
                              {user.role !== 'dj' && onUpdateRole && (
                                <button
                                  onClick={() => {
                                    onUpdateRole(user.id, 'dj');
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-purple-300 hover:bg-purple-500/20 flex items-center gap-2 transition"
                                >
                                  <Disc3 className="w-3.5 h-3.5" />
                                  <span>ارتقا به دی‌جی (DJ)</span>
                                </button>
                              )}

                              {/* Promote to Moderator */}
                              {user.role !== 'moderator' && onUpdateRole && (
                                <button
                                  onClick={() => {
                                    onUpdateRole(user.id, 'moderator');
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>ارتقا به ناظر (Moderator)</span>
                                </button>
                              )}

                              {/* Demote to Listener */}
                              {user.role !== 'listener' && onUpdateRole && (
                                <button
                                  onClick={() => {
                                    onUpdateRole(user.id, 'listener');
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 flex items-center gap-2 transition"
                                >
                                  <Headphones className="w-3.5 h-3.5" />
                                  <span>تغییر به شنونده عادی</span>
                                </button>
                              )}

                              <div className="h-px bg-white/10 my-1" />

                              {/* Mute/Unmute */}
                              {onToggleMute && (
                                <button
                                  onClick={() => {
                                    onToggleMute(user.id);
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/20 flex items-center gap-2 transition"
                                >
                                  {user.isMuted ? (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>خروج از حالت بی‌صدا</span>
                                    </>
                                  ) : (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5" />
                                      <span>بی‌صدا کردن کاربر</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Kick User */}
                              {onKickUser && (
                                <button
                                  onClick={() => {
                                    setConfirmKickUserId(user.id);
                                    setActiveMenuUserId(null);
                                  }}
                                  className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>اخراج از اتاق (Kick)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirm Kick Overlay / Inline */}
                      {confirmKickUserId === user.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                          <div className="bg-[#1a1a2c] border border-red-500/40 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                              <UserX className="w-6 h-6" />
                            </div>
                            <h4 className="text-white font-bold text-base">
                              اخراج {user.name} از اتاق؟
                            </h4>
                            <p className="text-xs text-white/60">
                              این کاربر بلافاصله از جلسه همگام‌سازی خارج خواهد شد.
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setConfirmKickUserId(null)}
                                className="px-4 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 text-white transition"
                              >
                                انصراف
                              </button>
                              <button
                                onClick={() => {
                                  if (onKickUser) onKickUser(user.id);
                                  setConfirmKickUserId(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                              >
                                بله، اخراج کن
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-white/5 bg-black/20 text-[11px] text-white/40 flex items-center justify-between">
            <span>اتاق مجهز به پروتکل WebRTC / P2P کم‌تاخیر</span>
            <span className="text-emerald-400">تمام اعضا همگام هستند</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default UserListModal;
