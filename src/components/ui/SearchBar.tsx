import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar produto ou marca...',
  onSubmit,
  id,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <Search className="w-4 h-4 text-ink-muted absolute left-3.5 pointer-events-none shrink-0" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-[38px] pl-9 pr-9 rounded-pill bg-field text-ink placeholder:text-ink-muted text-[14px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition"
      />
      {value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:text-ink absolute right-1 active:scale-[0.98] transition-transform"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
