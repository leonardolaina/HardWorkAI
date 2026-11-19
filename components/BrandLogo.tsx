'use client';

import React from 'react';
import { motion } from 'motion/react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'w-6 h-6 rounded-[7px]',
  md: 'w-7 h-7 rounded-[8px]',
  lg: 'w-11 h-11 rounded-[13px]',
};

export function BrandLogo({
  size = 'md',
  active = false,
  className = '',
}: BrandLogoProps) {
  return (
    <motion.span
      aria-hidden="true"
      animate={active ? { opacity: [1, 0.58, 1], scale: [1, 0.96, 1] } : { opacity: 1, scale: 1 }}
      transition={
        active
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.18 }
      }
      className={`relative inline-flex items-center justify-center shrink-0 select-none bg-[#C96442] dark:bg-[#D97757] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] ${SIZE_CLASSES[size]} ${className}`}
    >
      {/* Left architectural pillar */}
      <span className="absolute left-[22%] top-[22%] bottom-[22%] w-[14.5%] rounded-[1.5px] bg-[#FAF9F5]" />
      {/* Right architectural pillar */}
      <span className="absolute right-[22%] top-[22%] bottom-[22%] w-[14.5%] rounded-[1.5px] bg-[#FAF9F5]" />
      {/* Central bridge */}
      <span className="absolute left-[31%] right-[31%] top-[44.5%] h-[11%] bg-[#FAF9F5]" />
      {/* Precision forge diamond keystone */}
      <span className="absolute w-[18%] h-[18%] rotate-45 rounded-[1px] bg-[#FAF9F5] ring-2 ring-[#C96442] dark:ring-[#D97757]" />
    </motion.span>
  );
}

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-serif font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9] whitespace-nowrap shrink-0 ${className}`}
    >
      HardWork
      <span className="text-[#C96442] dark:text-[#D97757]">AI</span>
    </span>
  );
}
