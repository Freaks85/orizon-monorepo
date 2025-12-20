"use client";

import React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white',
    success: 'bg-[#00ff9d]/10 text-[#00ff9d]',
    warning: 'bg-yellow-500/10 text-yellow-500',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono uppercase tracking-wider font-bold rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
