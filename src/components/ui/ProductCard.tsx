import React from 'react';
import { Store, Plus, Minus, Volume2, MoreHorizontal, Wheat, Drumstick, Apple, Milk, SprayCan, ShoppingBag } from 'lucide-react';
import { PromotionItem, ProductCategory } from '../../types';
import { PriceTag } from './PriceTag';
import { EconomyBadge } from './EconomyBadge';
import { IconButton } from './IconButton';

export interface ProductCardProps {
  item: PromotionItem;
  cartQuantity?: number;
  unitPriceLabel?: string | null;
  hasAlert?: boolean;
  isAlertTriggered?: boolean;
  compact?: boolean;
  onAdd: (item: PromotionItem) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onSpeak?: (item: PromotionItem) => void;
  onOpenDetails?: (item: PromotionItem) => void;
}

const CategoryThumbIcon: React.FC<{ category: ProductCategory }> = ({ category }) => {
  switch (category) {
    case 'cesta_basica':
      return <Wheat className="w-7 h-7 text-ink-soft" />;
    case 'carnes_proteinas':
      return <Drumstick className="w-7 h-7 text-ink-soft" />;
    case 'hortifruti':
      return <Apple className="w-7 h-7 text-ink-soft" />;
    case 'laticinios_frios':
      return <Milk className="w-7 h-7 text-ink-soft" />;
    case 'limpeza_higiene':
      return <SprayCan className="w-7 h-7 text-ink-soft" />;
    default:
      return <ShoppingBag className="w-7 h-7 text-ink-soft" />;
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  cartQuantity = 0,
  unitPriceLabel,
  hasAlert = false,
  isAlertTriggered = false,
  compact = false,
  onAdd,
  onIncrement,
  onDecrement,
  onSpeak,
  onOpenDetails,
}) => {
  const hasSavings = item.highestPrice > item.lowestPrice && item.savingsPercent > 0;
  const cheapestEntry = item.prices.find((p) => p.price === item.lowestPrice);
  const regularRefPrice =
    cheapestEntry?.regularPrice && cheapestEntry.regularPrice > item.lowestPrice
      ? cheapestEntry.regularPrice
      : item.highestPrice;

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => (onOpenDetails ? onOpenDetails(item) : onAdd(item))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetails ? onOpenDetails(item) : onAdd(item);
          }
        }}
        className="w-[210px] shrink-0 bg-surface rounded-card shadow-card p-3 flex flex-col justify-between gap-2 active:scale-[0.98] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-11 h-11 rounded-field bg-field flex items-center justify-center shrink-0 relative">
            <CategoryThumbIcon category={item.category} />
            {item.isDailyHighlight && (
              <span className="absolute -top-1 -left-1 bg-brand text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-pill uppercase">
                Hoje
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-bold text-ink line-clamp-2 leading-tight" title={item.name}>
              {item.name}
            </h3>
            <p className="text-[10px] font-medium text-ink-muted truncate mt-0.5">
              {item.validUntil || item.brand || item.unit}
            </p>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-1.5">
            <PriceTag value={item.lowestPrice} size="md" isLowest={true} />
            {hasSavings && <EconomyBadge label={`−${item.savingsPercent}%`} />}
          </div>
          {regularRefPrice > item.lowestPrice && (
            <p className="text-[11px] font-medium text-ink-muted tabular-nums">
              De <span className="line-through">R$ {regularRefPrice.toFixed(2).replace('.', ',')}</span> por R$ {item.lowestPrice.toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft min-w-0">
            <Store className="w-3 h-3 text-brand shrink-0" />
            <span className="truncate">{item.cheapestMarket}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            aria-label={`Adicionar ${item.name} ao carrinho`}
            className="h-8 px-3 rounded-pill bg-brand hover:bg-brand-hover text-white text-[12px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{cartQuantity > 0 ? `(${cartQuantity})` : 'Levar'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (onOpenDetails ? onOpenDetails(item) : onAdd(item))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails ? onOpenDetails(item) : onAdd(item);
        }
      }}
      className="bg-surface rounded-card shadow-card p-3 flex flex-col gap-2.5 active:scale-[0.98] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="flex items-start gap-3">
        {/* Thumb 56px com ícone de categoria limpo */}
        <div className="w-14 h-14 rounded-field bg-field flex flex-col items-center justify-center shrink-0 relative">
          <CategoryThumbIcon category={item.category} />
          <span className="text-[10px] font-medium text-ink-muted mt-0.5">{item.unit}</span>
          {isAlertTriggered && (
            <span className="absolute -top-1 -right-1 bg-save text-white text-[9px] font-bold px-1.5 py-0.5 rounded-pill">
              Meta
            </span>
          )}
        </div>

        {/* Info central */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink truncate" title={item.name}>
              {item.name}
            </h3>
            {hasSavings && <EconomyBadge label={`−${item.savingsPercent}%`} />}
          </div>

          <p className="text-[12px] font-medium text-ink-muted truncate">
            {item.brand ? `${item.brand} · ${item.unit}` : item.unit}
            {unitPriceLabel ? ` · ${unitPriceLabel}` : ''}
          </p>

          <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
            <PriceTag value={item.lowestPrice} size="lg" isLowest={true} />
            {regularRefPrice > item.lowestPrice && (
              <span className="text-[12px] font-medium line-through text-ink-muted tabular-nums">
                R$ {regularRefPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé: Mercado + Encarte/Validade + Ações */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="min-w-0 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
          <Store className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="font-semibold text-ink truncate">{item.cheapestMarket}</span>
          <span aria-hidden="true" className="text-ink-muted">·</span>
          <span className="text-ink-muted truncate">{item.validUntil || item.verifiedDate || 'Hoje'}</span>
          {hasAlert && !isAlertTriggered && (
            <>
              <span aria-hidden="true" className="text-ink-muted">·</span>
              <span className="text-warn font-semibold">Alerta ativo</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onSpeak && (
            <IconButton
              ariaLabel={`Ouvir oferta de ${item.name}`}
              onClick={() => onSpeak(item)}
              icon={<Volume2 className="w-4 h-4" />}
            />
          )}

          {onOpenDetails && (
            <IconButton
              ariaLabel={`Mais opções e comparativo para ${item.name}`}
              onClick={() => onOpenDetails(item)}
              icon={<MoreHorizontal className="w-4 h-4" />}
            />
          )}

          {cartQuantity > 0 && onIncrement && onDecrement ? (
            <div className="flex items-center bg-field rounded-pill p-0.5">
              <button
                type="button"
                onClick={onDecrement}
                aria-label={`Diminuir quantidade de ${item.name}`}
                className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-ink hover:bg-surface active:scale-[0.98] transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-2 text-[14px] font-bold text-ink tabular-nums">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={onIncrement}
                aria-label={`Aumentar quantidade de ${item.name}`}
                className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-brand text-white active:scale-[0.98] transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(item)}
              aria-label={`Adicionar ${item.name} à lista`}
              className="min-h-[44px] px-4 rounded-pill bg-brand hover:bg-brand-hover text-white text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
