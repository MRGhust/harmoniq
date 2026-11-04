'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Shield, Headphones, Crown, VolumeX } from 'lucide-react';
import { ChatMessage, UserRole } from '@/types/room';

interface RoomChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  isChatEnabled: boolean;
  onSendMessage: (text: string) => void;
}

export const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  currentUserId,
  isChatEnabled,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isChatEnabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
            <Crown className="w-2.5 h-2.5" />
            میزبان
          </span>
        );
      case 'dj':
        return (
          <span className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
            <Headphones className="w-2.5 h-2.5" />
            دی‌جی
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
            <Shield className="w-2.5 h-2.5" />
            ناظر
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/10 overflow-hidden">
      {/* Chat header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>گفتگوی زنده اتاق</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {messages.length} پیام
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-[220px] max-h-[360px] md:max-h-[460px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8 text-center">
            <MessageSquare className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
            <p>هنوز پیامی ارسال نشده است.</p>
            <p className="text-[11px] text-slate-600">اولین نفری باشید که سلام می‌کند!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-white/5">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={msg.avatar}
                  alt={msg.userName}
                  className="w-7 h-7 rounded-full bg-slate-800 shrink-0 border border-white/10"
                />

                <div
                  className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-slate-300">
                      {isMe ? 'شما' : msg.userName}
                    </span>
                    {getRoleBadge(msg.userRole)}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`px-3 py-2 rounded-2xl text-xs sm:text-sm break-words ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-tr-none shadow-md shadow-purple-500/10'
                        : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input form */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40">
        {isChatEnabled ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="نوشتن پیام در اتاق..."
              className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition transform active:scale-95 shadow-md shadow-purple-500/20"
              title="ارسال پیام"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1.5">
            <VolumeX className="w-3.5 h-3.5" />
            <span>چت توسط میزبان برای اعضا غیرفعال شده است</span>
          </div>
        )}
      </div>
    </div>
  );
};
