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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg flat-card overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1e2d] bg-[#141522]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  دعوت دوستان به اتاق (Invite to Room)
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">
                  اتاق: <span className="text-white font-medium">{roomName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white flat-button transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4 bg-[#11121d]">
            {/* 6-Digit Room Code Box */}
            <div className="rounded-xl bg-[#141624] border border-[#1e2032] p-4 text-center space-y-2">
              <span className="text-xs text-slate-400">
                کد اختصاصی اتاق (Room Code)
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-wider">
                  {roomId}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="کپی کد اتاق"
                  className="px-3 py-1.5 rounded-lg text-xs flat-button text-slate-300 hover:text-white flex items-center gap-1.5 transition"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                لینک مستقیم ورود به اتاق (Direct Join Link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full bg-[#161726] border border-[#24273d] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono select-all focus:outline-none transition"
                />
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flat-button-primary transition flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
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
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#141624] border border-[#1e2032]">
              <div className="relative p-3 rounded-xl bg-white shrink-0 border border-white/10">
                <QRCodeSVG
                  id="room-qr-svg"
                  value={shareableUrl}
                  size={110}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-white">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>اسکن سریع با موبایل (Scan & Join)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  دوستان شما می‌توانند با دوربین گوشی هوشمند خود این بارکد را اسکن کرده و فوراً به اتاق متصل شوند.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flat-button text-slate-300 hover:text-white transition"
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
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold flat-button flex items-center justify-center gap-2 text-slate-200 hover:text-white transition"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>اشتراک‌گذاری در پیام‌رسان‌ها (تلگرام، واتساپ، ...)</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-[#1c1e2d] bg-[#0f101a] text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>پیوستن به اتاق بدون نیاز به نصب نرم‌افزار اضافی و مستقیم در مرورگر</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default InviteModal;
