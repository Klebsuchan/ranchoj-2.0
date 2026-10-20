import React from 'react';
import { PromotionItem, ShoppingListItem } from '../types';
import { ProductSubstitute, getSubstitutesForProduct } from '../utils/productSubstitutes';
import { TrendingDown, Store, Check, Plus } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';
import { PriceTag } from './ui/PriceTag';
import { EconomyBadge } from './ui/EconomyBadge';
import { EmptyState } from './ui/EmptyState';
import { SecondaryButton } from './ui/SecondaryButton';

interface SubstitutesExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PromotionItem[];
  shoppingList: ShoppingListItem[];
  onApplySubstitute: (sub: ProductSubstitute, originalItemName: string) => void;
}

export const SubstitutesExplorerModal: React.FC<SubstitutesExplorerModalProps> = ({
  isOpen,
  onClose,
  items,
  shoppingList,
  onApplySubstitute,
}) => {
  if (!isOpen) return null;

  const substitutePairs = items
    .map((item) => {
      const subs = getSubstitutesForProduct(item);
      return {
        item,
        bestSubstitute: subs[0] || null,
        allSubstitutes: subs,
      };
    })
    .filter((pair) => pair.bestSubstitute !== null);

  const totalPotentialSavings = substitutePairs.reduce(
    (acc, curr) => acc + (curr.bestSubstitute?.savingsAmount || 0),
    0
  );

  const isSubstituteInRancho = (subName: string) => {
    return shoppingList.some((s) =>
      s.name.toLowerCase().includes(subName.toLowerCase().split('(')[0].trim())
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Opções mais baratas"
      subtitle={`Troque marcas ou cortes e economize até R$ ${totalPotentialSavings.toFixed(2).replace('.', ',')}`}
      footer={<SecondaryButton onClick={onClose}>Fechar</SecondaryButton>}
    >
      {substitutePairs.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="w-8 h-8" />}
          title="Seus itens já estão no menor preço"
          description="Não há trocas mais baratas disponíveis para os produtos atuais."
        />
      ) : (
        <div className="space-y-3">
          {substitutePairs.map(({ item, bestSubstitute }) => {
            if (!bestSubstitute) return null;
            const alreadyAdded = isSubstituteInRancho(bestSubstitute.substituteName);

            return (
              <div
                key={`sub-${item.id}`}
                className="bg-field rounded-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-ink-muted line-through truncate">
                      Em vez de: {item.name} (R$ {item.lowestPrice.toFixed(2).replace('.', ',')})
                    </p>
                    <h4 className="text-[15px] font-semibold text-ink mt-0.5">
                      {bestSubstitute.substituteName}
                    </h4>
                    <p className="text-[12px] font-medium text-ink-soft mt-0.5">
                      {bestSubstitute.reason}
                    </p>
                  </div>
                  <EconomyBadge
                    label={`−R$ ${bestSubstitute.savingsAmount.toFixed(2).replace('.', ',')}`}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                  <div>
                    <PriceTag value={bestSubstitute.estimatedPrice} size="md" isLowest={true} />
                    <div className="flex items-center gap-1 text-[12px] font-medium text-ink-soft mt-0.5">
                      <Store className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span>{bestSubstitute.market}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onApplySubstitute(bestSubstitute, item.name)}
                    disabled={alreadyAdded}
                    className={`min-h-[44px] px-4 rounded-pill text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] transition-transform ${
                      alreadyAdded
                        ? 'bg-save-soft text-save'
                        : 'bg-brand hover:bg-brand-hover text-white'
                    }`}
                  >
                    {alreadyAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Na lista</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Trocar por este</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
};
