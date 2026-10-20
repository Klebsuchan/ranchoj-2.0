import React from 'react';
import { Check, Plus, Minus, Trash2 } from 'lucide-react';
import { ShoppingListItem } from '../../types';

export interface ListItemCheckboxProps {
  item: ShoppingListItem;
  displayUnitPrice: number;
  displayTotalPrice: number;
  marketLabel?: string;
  onToggleBought: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ListItemCheckbox: React.FC<ListItemCheckboxProps> = ({
  item,
  displayUnitPrice,
  displayTotalPrice,
  marketLabel,
  onToggleBought,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  return (
    <div
      className={`min-h-[56px] bg-surface rounded-card shadow-card p-4 flex items-center justify-between gap-3 transition-opacity ${
        item.isBought ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Info esquerda */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleBought(item.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleBought(item.id);
          }
        }}
        className="min-w-0 flex-1 cursor-pointer focus:outline-none"
      >
        <p
          className={`text-[15px] font-semibold truncate ${
            item.isBought ? 'line-through text-ink-muted' : 'text-ink'
          }`}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted mt-0.5 tabular-nums flex-wrap">
          <span>
            {item.quantity} × R$ {displayUnitPrice.toFixed(2).replace('.', ',')}
          </span>
          {marketLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{marketLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Controles de quantidade + preço + checkbox circular 24px à direita */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-field rounded-pill">
          <button
            type="button"
            onClick={() => (item.quantity > 1 ? onDecrement(item.id) : onRemove(item.id))}
            aria-label={item.quantity > 1 ? `Diminuir quantidade de ${item.name}` : `Remover ${item.name}`}
            className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-ink-soft hover:text-ink active:scale-[0.98] transition-transform"
          >
            {item.quantity > 1 ? <Minus className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5 text-danger" />}
          </button>
          <span className="px-1.5 text-[13px] font-bold text-ink tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onIncrement(item.id)}
            aria-label={`Aumentar quantidade de ${item.name}`}
            className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-ink-soft hover:text-ink active:scale-[0.98] transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <span
          className={`text-[14px] font-bold tabular-nums min-w-[66px] text-right ${
            item.isBought ? 'line-through text-ink-muted' : 'text-ink'
          }`}
        >
          R$ {displayTotalPrice.toFixed(2).replace('.', ',')}
        </span>

        <button
          type="button"
          onClick={() => onToggleBought(item.id)}
          aria-label={item.isBought ? `Desmarcar ${item.name} como comprado` : `Marcar ${item.name} como comprado`}
          aria-pressed={item.isBought}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-full"
        >
          <span
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.isBought
                ? 'bg-save border-save text-white'
                : 'border-slate-300 bg-surface'
            }`}
          >
            {item.isBought && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        </button>
      </div>
    </div>
  );
};
