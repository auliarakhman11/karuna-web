'use client';

import React from 'react';
import Select from 'react-select';

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
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div className={`relative ${className}`}>
      <Select
        value={selectedOption}
        onChange={(newValue: any) => {
          onChange(newValue ? newValue.value : ('' as any));
        }}
        options={options}
        placeholder={placeholder}
        isClearable={true}
        isSearchable={true}
        classNames={{
          control: (state) =>
            `!bg-slate-950 !border-slate-700 !rounded-xl !min-h-[42px] ${
              state.isFocused ? '!border-indigo-500 !ring-1 !ring-indigo-500' : ''
            }`,
          input: () => '!text-slate-200',
          singleValue: () => '!text-slate-200',
          menu: () => '!bg-slate-950 !border !border-slate-700 !rounded-xl !overflow-hidden !z-50',
          menuList: () => '!p-1',
          option: (state) =>
            `!cursor-pointer !rounded-lg !mb-1 ${
              state.isSelected
                ? '!bg-indigo-600 !text-white'
                : state.isFocused
                ? '!bg-slate-800 !text-slate-200'
                : '!text-slate-200 hover:!bg-slate-800'
            }`,
          placeholder: () => '!text-slate-500',
          indicatorSeparator: () => '!bg-slate-700',
          dropdownIndicator: () => '!text-slate-400 hover:!text-slate-300',
          clearIndicator: () => '!text-slate-400 hover:!text-slate-300',
        }}
        styles={{
          control: (base) => ({ ...base, boxShadow: 'none' }),
          menu: (base) => ({ ...base, zIndex: 9999 }),
        }}
      />
    </div>
  );
}
