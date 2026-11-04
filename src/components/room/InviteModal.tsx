'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQRZoom, setShowQRZoom] = useState(false);

  // Generate shareable URL
  const shareableUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${roomId}`
      : `https://harmoniq.app/room/${roomId}`;

  // Copy Room Link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Copy Room 6-digit Code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `به اتاق موسیقی "${roomName}" در Harmoniq بپیوندید`,
          text: `همین حالا همراه با من به موسیقی زنده و هماهنگ در اتاق "${roomName}" گوش بده! کد اتاق: ${roomId}`,
          url: shareableUrl,
        });
      } catch (err) {
        // user aborted or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code as SVG
  const handleDownloadQR = () => {
    const svgElement = document.getElementById('room-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harmoniq-room-${roomId}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          className="relative w-full max-w-lg bg-[#12121e]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  دعوت دوستان به اتاق (Invite to Room)
                </h3>
                <p className="text-xs text-white/50 truncate max-w-[260px]">
                  اتاق: <span className="text-white font-medium">{roomName}</span>
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

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* 6-Digit Room Code Box */}
            <div className="rounded-2xl bg-gradient-to-tr from-purple-900/20 via-black/40 to-cyan-900/20 border border-white/10 p-4 text-center space-y-2">
              <span className="text-xs text-white/50">
                کد اختصاصی اتاق (Room Code)
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 tracking-wider">
                  {roomId}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="کپی کد اتاق"
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی کد</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Shareable Link */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                لینک مستقیم ورود به اتاق (Direct Join Link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white/90 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>کپی لینک</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive QR Code Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="relative p-3 rounded-xl bg-white shadow-xl shadow-black/50 shrink-0">
                <QRCodeSVG
                  id="room-qr-svg"
                  value={shareableUrl}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-white">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>اسکن سریع با موبایل (Scan & Join)</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  دوستان شما می‌توانند با دوربین گوشی هوشمند خود این بارکد را اسکن کرده و فوراً به اتاق متصل شوند.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>دانلود بارکد QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Native Share button */}
            <div className="pt-1">
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>اشتراک‌گذاری در پیام‌رسان‌ها (تلگرام، واتساپ، ...)</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-white/5 bg-black/20 text-[11px] text-white/40 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>پیوستن به اتاق بدون نیاز به نصب نرم‌افزار اضافی و مستقیم در مرورگر</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default InviteModal;
