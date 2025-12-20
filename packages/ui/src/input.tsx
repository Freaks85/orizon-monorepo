"use client";

import React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500",
              "focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 focus:border-[#00ff9d]/50",
              "transition-all duration-200",
              "font-mono text-sm",
              icon && "pl-10",
              error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
