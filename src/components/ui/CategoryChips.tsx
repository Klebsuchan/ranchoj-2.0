import React from 'react';

export interface CategoryChipItem {
  id: string;
  label: string;
  count?: number;
}

export interface CategoryChipsProps {
  items: CategoryChipItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  items,
  activeId,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-4 gap-1.5 w-full">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`h-9 px-2 rounded-xl text-[12px] font-bold whitespace-nowrap flex items-center justify-center gap-1 active:scale-[0.98] transition-transform focus:outline-none truncate ${
              isActive
                ? 'bg-brand text-white shadow-card'
                : 'bg-surface text-ink-soft shadow-card hover:text-ink'
            }`}
          >
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
