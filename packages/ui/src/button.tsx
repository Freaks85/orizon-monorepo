"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-[#00ff9d] text-black hover:bg-white",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] rounded-sm",
    md: "px-4 py-2.5 text-xs rounded-sm",
    lg: "px-6 py-4 text-sm rounded-sm",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </motion.button>
  );
}
