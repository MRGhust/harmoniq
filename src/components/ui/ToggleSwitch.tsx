'use client';

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  icon,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#11121d] border-[#1c1e2d]'
          : checked
          ? 'bg-[#141824] border-emerald-500/30 hover:border-emerald-500/50'
          : 'bg-[#11121d] border-[#1c1e2d] hover:border-[#272b40]'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <div className="flex items-start gap-3 min-w-0 pr-1">
        {icon && <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>}
        <div className="min-w-0">
          {label && (
            <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
              {label}
            </p>
          )}
          {description && (
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Modern iOS/Linear Style Flat Pill Switch */}
      <div dir="ltr" className="shrink-0">
        <div
          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
            checked ? 'bg-emerald-500' : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
