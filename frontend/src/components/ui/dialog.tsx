'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Modal */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden',
          className
        )}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0 bg-slate-900 z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] flex-1">
          {children}
        </div>

        {/* Sticky Footer (if provided) */}
        {footer && (
          <div className="p-4 px-6 border-t border-slate-800 shrink-0 bg-slate-900 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

