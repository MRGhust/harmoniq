'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, VolumeX } from 'lucide-react';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        return <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">میزبان</span>;
      case 'dj':
        return <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded font-medium">دی‌جی</span>;
      case 'moderator':
        return <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded font-medium">ناظر</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full flat-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1c1e2d] flex items-center justify-between bg-[#141522]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">گفتگوی زنده اتاق</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {messages.length} پیام
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-[280px] max-h-[520px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10 text-center">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
            <p>هنوز پیامی ارسال نشده است.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="text-[11px] text-slate-400 bg-slate-900 px-3 py-0.5 rounded-full border border-white/5">
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
                  src={msg.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={msg.userName}
                  className="w-7 h-7 rounded-lg bg-slate-800 shrink-0 border border-white/5"
                />

                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-slate-300">
                      {isMe ? 'شما' : msg.userName}
                    </span>
                    {getRoleBadge(msg.userRole)}
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm break-words ${
                      isMe
                        ? 'bg-emerald-600 text-slate-950 font-medium rounded-tl-none'
                        : 'bg-[#181928] text-slate-200 border border-[#212438] rounded-tr-none'
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

      {/* Input Field */}
      <div className="p-3 border-t border-[#1c1e2d] bg-[#11121d]">
        {isChatEnabled ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="نوشتن پیام در اتاق..."
              className="flex-1 bg-[#161726] border border-[#23263b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              maxLength={280}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl flat-button-primary disabled:opacity-30 transition"
              title="ارسال پیام"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
            <VolumeX className="w-3.5 h-3.5" />
            <span>چت توسط میزبان غیرفعال شده است</span>
          </div>
        )}
      </div>
    </div>
  );
};
