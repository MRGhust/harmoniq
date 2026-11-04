'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  RefreshCw,
  Info,
  X,
  Gauge,
  Sliders,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export interface LatencyIndicatorProps {
  /** Round-trip or network latency in milliseconds */
  latencyMs?: number;
  /** Estimated playback time drift in seconds */
  driftSec?: number;
  /** Callback to trigger a manual force resynchronization */
  onResync?: () => void | Promise<void>;
  /** External resyncing loading flag */
  isResyncing?: boolean;
  /** Whether current user is the room host */
  isHost?: boolean;
  /** Preferred display language ('en' | 'fa') */
  locale?: 'en' | 'fa';
  /** Extra CSS classes */
  className?: string;
}

export const LatencyIndicator: React.FC<LatencyIndicatorProps> = ({
  latencyMs = 24,
  driftSec,
  onResync,
  isResyncing = false,
  isHost = false,
  locale = 'fa',
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalResyncing, setInternalResyncing] = useState(false);

  const resyncing = isResyncing || internalResyncing;

  // Determine health category: Green (<60ms), Amber (60-150ms), Red (>150ms)
  const getHealthLevel = (ms: number): 'optimal' | 'moderate' | 'degraded' => {
    if (ms < 60) return 'optimal';
    if (ms <= 150) return 'moderate';
    return 'degraded';
  };

  const health = getHealthLevel(latencyMs);

  const colorStyles = {
    optimal: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]',
      labelEn: 'Synced',
      labelFa: 'همگام',
      icon: CheckCircle2,
    },
    moderate: {
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]',
      labelEn: 'Fair',
      labelFa: 'مطلوب',
      icon: AlertTriangle,
    },
    degraded: {
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      dot: 'bg-rose-400',
      ping: 'bg-rose-400',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      labelEn: 'High Drift',
      labelFa: 'تاخیر بالا',
      icon: AlertOctagon,
    },
  }[health];

  const handleResyncClick = async () => {
    if (resyncing || !onResync) return;
    setInternalResyncing(true);
    try {
      await Promise.resolve(onResync());
    } finally {
      // Brief feedback delay
      setTimeout(() => setInternalResyncing(false), 600);
    }
  };

  const statusLabel = locale === 'fa' ? colorStyles.labelFa : colorStyles.labelEn;
  const resyncButtonLabel = locale === 'fa' ? 'همگام‌سازی مجدد' : 'Force Resync';

  return (
    <>
      {/* Latency & Sync Bar Card */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/70 backdrop-blur-md border ${colorStyles.border} shadow-lg transition-all duration-300 ${className}`}
      >
        {/* Pulsing Live Status Dot */}
        <div className="relative flex items-center justify-center w-2.5 h-2.5">
          <span
            className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${colorStyles.ping}`}
          />
          <span
            className={`relative inline-flex w-2 h-2 rounded-full ${colorStyles.dot} ${colorStyles.glow}`}
          />
        </div>

        {/* Sync Text & Latency Display */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
          <span className={`${colorStyles.text} font-sans`}>{statusLabel}</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-200">{latencyMs}ms</span>

          {driftSec !== undefined && Math.abs(driftSec) > 0.05 && (
            <span className="text-[10px] text-neutral-400">
              (Δ {Math.round(driftSec * 1000)}ms)
            </span>
          )}

          {isHost && (
            <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] uppercase font-sans border border-purple-500/30">
              Host
            </span>
          )}
        </div>

        {/* Resync Action Button */}
        {onResync && (
          <button
            type="button"
            onClick={handleResyncClick}
            disabled={resyncing}
            title={resyncButtonLabel}
            className="flex items-center gap-1 ml-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 text-cyan-400 ${resyncing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">{resyncButtonLabel}</span>
          </button>
        )}

        {/* Information / Drift Explanation Trigger */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title={locale === 'fa' ? 'راهنمای مکانیزم همگام‌سازی' : 'Sync Mechanism Info'}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sync Drift Correction Explanatory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-neutral-900/90 border border-white/10 p-6 shadow-2xl backdrop-blur-xl text-neutral-200"
              dir={locale === 'fa' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">
                      {locale === 'fa'
                        ? 'موتور همگام‌سازی هارمونیک'
                        : 'Harmoniq Synchronization Engine'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {locale === 'fa'
                        ? 'نحوه اصلاح تاخیر و ناهماهنگی صوتی'
                        : 'How audio drift correction & clock sync work'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Overview Card */}
              <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-400">
                    {locale === 'fa' ? 'وضعیت فعلی اتصال:' : 'Current Connection:'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-semibold ${colorStyles.text}`}>
                      {statusLabel}
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="font-mono text-neutral-200">{latencyMs}ms RTT</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-neutral-400">
                    {locale === 'fa' ? 'آستانه تحمل:' : 'Tolerance:'}
                  </span>
                  <p className="font-mono text-cyan-400 mt-1">±80ms</p>
                </div>
              </div>

              {/* 3 Steps of Audio Drift Correction */}
              <div className="mt-4 space-y-3 text-xs leading-relaxed">
                {/* Step 1: NTP Clock Sync */}
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      {locale === 'fa'
                        ? '۱. کالیبراسیون ساعت مبتنی بر NTP'
                        : '1. NTP-based Clock Calibration'}
                    </h4>
                    <p className="text-neutral-400 mt-0.5">
                      {locale === 'fa'
                        ? 'با محاسبه پیوسته زمان رفت و برگشت پینگ (RTT)، اختلاف زمانی ساعت محلی شما با میزبان محاسبه و خنثی می‌گردد.'
                        : 'Continuously samples round-trip ping time to estimate clock offset between local machine and host.'}
                    </p>
                  </div>
                </div>

                {/* Step 2: Pitch-Preserved Catchup */}
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      {locale === 'fa'
                        ? '۲. تنظیم نرم نرخ پخش (بدون تغییر گام صدا)'
                        : '2. Micro-rate Catchup (Pitch Preserved)'}
                    </h4>
                    <p className="text-neutral-400 mt-0.5">
                      {locale === 'fa'
                        ? 'در تاخیرهای جزئی (۱۵۰ تا ۸۰۰ میلی‌ثانیه)، سرعت پخش به آرامی بین ۰.۹۲x تا ۱.۰۸x تغییر می‌کند تا بدون قطع شدن یا پرش صدا، هماهنگی کامل حفظ شود.'
                        : 'For minor drift (150ms - 800ms), audio playback rate dynamically adjusts between 0.92x and 1.08x smoothly without audible skips.'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Hard Resync Guard */}
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      {locale === 'fa'
                        ? '۳. جهش بلادرنگ در انحراف بالا'
                        : '3. Hard Seek Re-alignment'}
                    </h4>
                    <p className="text-neutral-400 mt-0.5">
                      {locale === 'fa'
                        ? 'در صورت غیرفعال ماندن تب یا قطع شبکه بیش از ۸۰۰ میلی‌ثانیه، موقعیت دقیق پخش سریعاً به میلی‌ثانیه دقیق میزبان پرش می‌کند.'
                        : 'If drift exceeds 800ms (e.g. background tab throttling), an instant seek aligns position with the host.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer with Resync Button */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs transition-colors"
                >
                  {locale === 'fa' ? 'بستن' : 'Close'}
                </button>

                {onResync && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleResyncClick();
                      setIsModalOpen(false);
                    }}
                    disabled={resyncing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resyncing ? 'animate-spin' : ''}`} />
                    <span>{resyncButtonLabel}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LatencyIndicator;
