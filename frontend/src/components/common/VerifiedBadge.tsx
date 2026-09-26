'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  status?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
  className?: string;
}

export default function VerifiedBadge({
  isVerified,
  status,
  size = 'sm',
  showText = false,
  text = 'Verified',
  className = '',
}: VerifiedBadgeProps) {
  const verified = isVerified || status === 'VERIFIED';
  if (!verified) return null;

  const sizeClasses = {
    xs: 'w-3.5 h-3.5 text-[8px]',
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle group cursor-help ${className}`}
      title="এনআইডি/কেওয়াইসি ভেরিফাইড একাউন্ট (Verified Account)"
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm shadow-blue-500/30 ring-1 ring-blue-400/40 shrink-0 ${sizeClasses[size]}`}
      >
        <Check className={`${iconSizes[size]} stroke-[3.5]`} />
      </span>
      {showText && (
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
          {text}
        </span>
      )}
    </span>
  );
}
