import React, { useState, useMemo } from 'react';
import {
  PromotionItem,
  ShoppingListItem,
  SupermarketName,
  ProductCategory,
} from '../types';
import {
  Plus,
  Trash2,
  Share2,
  FileDown,
  ShoppingCart,
  RotateCcw,
} from 'lucide-react';
import { generateRanchoPdf } from '../utils/generateRanchoPdf';
import { ToggleChip } from './ui/ToggleChip';
import { SectionTitle } from './ui/SectionTitle';
import { ListItemCheckbox } from './ui/ListItemCheckbox';
import { ProgressBar } from './ui/ProgressBar';
import { EmptyState } from './ui/EmptyState';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';

interface SingleMarketShoppingModeProps {
  promotions: PromotionItem[];
  shoppingList: ShoppingListItem[];
  onAddToRancho: (item: PromotionItem, supermarket?: SupermarketName) => void;
  onAddCustomShoppingItem: (item: ShoppingListItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleBought: (id: string) => void;
  onChangeMarket: (id: string, market: 'best' | SupermarketName) => void;
  onClearList: () => void;
  budgetLimit: number;
  monthlyIncome: number;
  familyMembers?: number;
  cityName: string;
  availableMarkets?: string[];
  initialMarketMode?: 'best' | string;
  previousSavedListCount?: number;
  onRestorePreviousList?: () => void;
  onSaveToHistory?: () => void;
  onSwitchToComparator?: () => void;
  onOpenShareModal?: () => void;
  onExportPdf?: () => void;
  onNavigateToOffers?: () => void;
}

const CATEGORY_ORDER: ProductCategory[] = [
  'cesta_basica',
  'carnes_proteinas',
  'hortifruti',
  'laticinios_frios',
  'limpeza_higiene',
  'outros',
];

const CATEGORY_TITLES: Record<ProductCategory, string> = {
  cesta_basica: 'Mercearia e Cesta Básica',
  carnes_proteinas: 'Açougue e Ovos',
  hortifruti: 'Hortifrúti e Feira',
  laticinios_frios: 'Laticínios e Frios',
  limpeza_higiene: 'Limpeza e Higiene',
  outros: 'Bebidas e Outros',
};

export const SingleMarketShoppingMode: React.FC<SingleMarketShoppingModeProps> = ({
  shoppingList,
  onAddCustomShoppingItem,
  onUpdateQuantity,
  onRemoveItem,
  onToggleBought,
  onClearList,
  budgetLimit,
  familyMembers = 1,
  cityName,
  availableMarkets = [
    'Stock Center',
    'Atacadão',
    'Supermercado Boqueirão',
    'Zaffari',
    'Bourbon',
    'Coqueiros',
  ],
  initialMarketMode = 'best',
  previousSavedListCount = 0,
  onRestorePreviousList,
  onSaveToHistory,
  onOpenShareModal,
  onExportPdf,
  onNavigateToOffers,
}) => {
  const [pricingMode, setPricingMode] = useState<'best' | 'single'>(
    initialMarketMode !== 'best' ? 'single' : 'best'
  );
  const [selectedMarket, setSelectedMarket] = useState<string>(
    initialMarketMode !== 'best' ? initialMarketMode : 'Stock Center'
  );

  // Barra de adição rápida de item avulso
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const getItemUnitPrice = (item: ShoppingListItem): { price: number; marketLabel: string } => {
    if (pricingMode === 'single') {
      const prices = item.prices || {};
      const matchKey = Object.keys(prices).find(
        (k) =>
          k.toLowerCase().includes(selectedMarket.toLowerCase()) ||
          (selectedMarket.toLowerCase().includes('stock') && k.toLowerCase().includes('stok')) ||
          (selectedMarket.toLowerCase().includes('stok') && k.toLowerCase().includes('stock'))
      );
      if (matchKey && typeof prices[matchKey as SupermarketName] === 'number') {
        return {
          price: prices[matchKey as SupermarketName]!,
          marketLabel: selectedMarket,
        };
      }
      return { price: item.unitPrice, marketLabel: selectedMarket };
    }

    // Modo melhor preço por item
    const prices = item.prices || {};
    let bestMkt = item.selectedMarket === 'best' ? 'Menor preço' : item.selectedMarket;
    let minVal = item.unitPrice;
    Object.entries(prices).forEach(([mkt, val]) => {
      if (typeof val === 'number' && val > 0 && val <= minVal) {
        minVal = val;
        bestMkt = mkt;
      }
    });
    return { price: minVal, marketLabel: bestMkt };
  };

  // Totais calculados (geral vs comprados no carrinho físico)
  const { totalGeneral, totalBought, boughtCount } = useMemo(() => {
    let gen = 0;
    let bgt = 0;
    let bCount = 0;
    shoppingList.forEach((it) => {
      const { price } = getItemUnitPrice(it);
      const lineTotal = price * it.quantity;
      gen += lineTotal;
      if (it.isBought) {
        bgt += lineTotal;
        bCount += 1;
      }
    });
    return { totalGeneral: gen, totalBought: bgt, boughtCount: bCount };
  }, [shoppingList, pricingMode, selectedMarket]);

  // Agrupamento por categoria para facilitar na gôndola
  const groupedByCategory = useMemo(() => {
    const groups: { category: ProductCategory; title: string; items: ShoppingListItem[] }[] = [];
    CATEGORY_ORDER.forEach((cat) => {
      const catItems = shoppingList.filter((i) => i.category === cat);
      if (catItems.length > 0) {
        groups.push({
          category: cat,
          title: CATEGORY_TITLES[cat],
          items: catItems,
        });
      }
    });
    return groups;
  }, [shoppingList]);

  const handleAddQuickItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    const parsedPrice = parseFloat(customPrice.replace(',', '.'));
    const unitPrice = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 9.9;

    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      category: 'outros',
      quantity: 1,
      unit: 'un',
      prices: {
        [selectedMarket]: unitPrice,
      },
      selectedMarket: pricingMode === 'single' ? selectedMarket : 'best',
      unitPrice,
      totalPrice: unitPrice,
      isEssential: true,
      priority: 'essencial',
      isBought: false,
    };

    onAddCustomShoppingItem(newItem);
    setCustomName('');
    setCustomPrice('');
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    generateRanchoPdf({
      items: shoppingList,
      budgetLimit,
      householdType: familyMembers > 1 ? 'casal' : 'solo',
      neighborhood: cityName,
      cityName,
      selectedMarket: pricingMode === 'single' ? selectedMarket : undefined,
    });
  };

  if (shoppingList.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          title="Seu carrinho está vazio"
          description="Adicione produtos nas ofertas de hoje ou gere um rancho pronto para acompanhar na gôndola."
          actionLabel={onNavigateToOffers ? 'Ver ofertas de hoje' : undefined}
          onAction={onNavigateToOffers}
        />

        {/* Barra de adição rápida mesmo com carrinho vazio */}
        <form
          onSubmit={handleAddQuickItem}
          className="bg-surface rounded-card shadow-card p-4 space-y-3"
        >
          <span className="block text-[14px] font-semibold text-ink">
            Adicionar item avulso
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nome do item..."
              className="flex-1 min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="R$"
              className="w-24 min-h-[48px] px-3 rounded-field bg-field text-ink text-[16px] font-semibold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            <button
              type="submit"
              aria-label="Adicionar item avulso"
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-brand text-white flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Toggle superior de modo (Melhor preço vs. Mercado único) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ToggleChip
            label="Menor preço por item"
            active={pricingMode === 'best'}
            onToggle={() => setPricingMode('best')}
          />
          <ToggleChip
            label="Comprar em 1 só mercado"
            active={pricingMode === 'single'}
            onToggle={() => setPricingMode('single')}
          />
        </div>

        {pricingMode === 'single' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
            {availableMarkets.map((mkt) => (
              <ToggleChip
                key={mkt}
                label={mkt}
                active={selectedMarket.toLowerCase() === mkt.toLowerCase()}
                onToggle={() => setSelectedMarket(mkt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Itens agrupados por categoria com SectionTitle e ListItemCheckbox */}
      <div className="space-y-6">
        {groupedByCategory.map((group) => (
          <section key={group.category} className="space-y-2.5">
            <SectionTitle
              title={group.title}
              subtitle={`${group.items.length} ${
                group.items.length === 1 ? 'item' : 'itens'
              }`}
            />
            <div className="space-y-2.5">
              {group.items.map((item) => {
                const { price, marketLabel } = getItemUnitPrice(item);
                const lineTotal = price * item.quantity;
                return (
                  <ListItemCheckbox
                    key={item.id}
                    item={item}
                    displayUnitPrice={price}
                    displayTotalPrice={lineTotal}
                    marketLabel={marketLabel}
                    onToggleBought={onToggleBought}
                    onIncrement={(id) => onUpdateQuantity(id, 1)}
                    onDecrement={(id) => onUpdateQuantity(id, -1)}
                    onRemove={onRemoveItem}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 3. Barra de adição rápida de item avulso */}
      <form
        onSubmit={handleAddQuickItem}
        className="bg-surface rounded-card shadow-card p-3.5 flex items-center gap-2"
      >
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Adicionar item avulso..."
          className="flex-1 min-h-[44px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <input
          type="number"
          step="0.01"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          placeholder="R$"
          className="w-20 min-h-[44px] px-2.5 rounded-field bg-field text-ink text-[16px] font-semibold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          aria-label="Adicionar item avulso à lista"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-brand text-white flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* 4. Painel de fechamento e ações do carrinho (PDF, Compartilhar, Restaurar, Limpar) */}
      <div className="bg-surface rounded-card shadow-float p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-[12px] font-medium text-ink-muted">
              No carrinho ({boughtCount}/{shoppingList.length}) · R${' '}
              {totalBought.toFixed(2).replace('.', ',')}
            </span>
            <p className="text-[22px] leading-tight font-extrabold text-ink tabular-nums mt-0.5">
              Total R$ {totalGeneral.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearList}
            className="min-h-[44px] px-3 rounded-pill text-[12px] font-semibold text-danger hover:bg-danger-soft flex items-center gap-1 active:scale-[0.98] transition-transform"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        </div>

        <ProgressBar current={totalGeneral} limit={budgetLimit} />

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <SecondaryButton
            id="btn-exportar-pdf-topo"
            onClick={handleExportPdf}
            icon={<FileDown className="w-4 h-4 text-brand" />}
          >
            Exportar PDF
          </SecondaryButton>

          {onOpenShareModal && (
            <SecondaryButton
              id="btn-compartilhar-lista-topo"
              onClick={onOpenShareModal}
              icon={<Share2 className="w-4 h-4 text-brand" />}
            >
              Compartilhar
            </SecondaryButton>
          )}
        </div>

        {previousSavedListCount > 0 && onRestorePreviousList && (
          <SecondaryButton
            onClick={onRestorePreviousList}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Restaurar lista anterior ({previousSavedListCount} itens)
          </SecondaryButton>
        )}

        {onSaveToHistory && (
          <PrimaryButton onClick={onSaveToHistory}>
            Finalizar compra e salvar no histórico
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};
