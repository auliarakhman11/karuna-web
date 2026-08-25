import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option<T = string> {
  value: T;
  label: string;
}

interface SearchableSelectProps<T = string> {
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find((opt) => opt.value === value)?.label || '';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={value ? '' : 'text-slate-500'}>{value ? selectedLabel : placeholder}</span>
        {value && (
          <X
            className="w-4 h-4 text-slate-400 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onChange('' as any);
            }}
          />
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 text-slate-200 placeholder-slate-500 border-b border-slate-700 focus:outline-none"
          />
          {filtered.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                setSearch('');
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {opt.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</div>
          )}
        </div>
      )}
    </div>
  );
}
