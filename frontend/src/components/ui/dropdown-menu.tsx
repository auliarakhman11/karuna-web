'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'right',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-xl border border-slate-800 bg-slate-900 shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  icon,
  destructive = false,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors text-left',
        destructive
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export const DropdownSeparator: React.FC = () => (
  <div className="my-1 h-px bg-slate-800" />
);
