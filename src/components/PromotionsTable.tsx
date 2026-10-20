import React, { useState, useMemo, useEffect } from 'react';
import {
  PromotionItem,
  ProductCategory,
  SupermarketName,
  ShoppingListItem,
  UserProfile,
  PriceAlert,
} from '../types';
import {
  Search,
  RefreshCw,
  Plus,
  Store,
  Scale,
  Bell,
  Volume2,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { extractProductPackageInfo, calculateUnitPrice } from '../utils/unitPriceCalculator';
import { PackageComparisonModal } from './PackageComparisonModal';
import { SubstitutesExplorerModal } from './SubstitutesExplorerModal';
import { PriceAlertModal } from './PriceAlertModal';
import { ProductSearchAdd } from './ProductSearchAdd';
import { getAllPassoFundoStores, calculateDistanceKm } from '../utils/passoFundoLocations';
import { getSubstitutesForProduct, ProductSubstitute } from '../utils/productSubstitutes';
import {
  getStoredPriceAlerts,
  savePriceAlert,
  removePriceAlert,
  evaluatePriceAlerts,
} from '../utils/priceAlerts';
import { normalizeSearchText, generateOrEstimateProduct } from '../utils/catalogueData';
import { CategoryChips } from './ui/CategoryChips';
import { ToggleChip } from './ui/ToggleChip';
import { SectionTitle } from './ui/SectionTitle';
import { ProductCard } from './ui/ProductCard';
import { SkeletonList } from './ui/SkeletonList';
import { EmptyState } from './ui/EmptyState';
import { BottomSheet } from './ui/BottomSheet';
import { PriceTag } from './ui/PriceTag';
import { EconomyBadge } from './ui/EconomyBadge';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';

interface PromotionsTableProps {
  items: PromotionItem[];
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: string;
  shoppingList: ShoppingListItem[];
  onAddToRancho: (item: PromotionItem, supermarket?: SupermarketName) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onRemoveItem?: (id: string) => void;
  onAddSubstituteToRancho?: (sub: ProductSubstitute, replaceOriginalName?: string) => void;
  onAddCustomProduct?: (item: PromotionItem, supermarket?: SupermarketName) => void;
  sources: { title: string; uri: string }[];
  userProfile?: UserProfile;
  initialOnlyNearby?: boolean;
  initialMarketFilter?: string;
  externalSearchQuery?: string;
  onExternalSearchChange?: (val: string) => void;
}

const categoryLabels: Record<ProductCategory, string> = {
  cesta_basica: 'Cesta Básica',
  carnes_proteinas: 'Carnes e Ovos',
  hortifruti: 'Hortifrúti',
  laticinios_frios: 'Laticínios',
  limpeza_higiene: 'Limpeza',
  outros: 'Bebidas e Outros',
};

export const PromotionsTable: React.FC<PromotionsTableProps> = ({
  items,
  isLoading,
  onRefresh,
  shoppingList,
  onAddToRancho,
  onUpdateQuantity,
  onRemoveItem,
  onAddSubstituteToRancho,
  onAddCustomProduct,
  userProfile,
  initialOnlyNearby = false,
  initialMarketFilter = 'all',
  externalSearchQuery,
  onExternalSearchChange,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;
  const setSearchQuery = (val: string) => {
    if (onExternalSearchChange) onExternalSearchChange(val);
    setInternalSearch(val);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecificMarket, setSelectedSpecificMarket] = useState<string>(initialMarketFilter);
  const [onlyEssentials, setOnlyEssentials] = useState(false);
  const [onlyPromos, setOnlyPromos] = useState(false);
  const [priceUnder10, setPriceUnder10] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyNearby, setOnlyNearby] = useState(initialOnlyNearby);

  // Modais / Sheets
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageModalInitial, setPackageModalInitial] = useState<{
    name: string;
    amount: number;
    unit: 'kg' | 'g' | 'L' | 'ml' | 'un';
    price: number;
  } | null>(null);

  const [isSubstitutesModalOpen, setIsSubstitutesModalOpen] = useState(false);
  const [alertModalItem, setAlertModalItem] = useState<PromotionItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<PromotionItem | null>(null);

  // Alertas de preço salvos
  const [priceAlerts, setPriceAlerts] = useState<Record<string, PriceAlert>>(() =>
    getStoredPriceAlerts()
  );

  useEffect(() => {
    if (initialMarketFilter) {
      setSelectedSpecificMarket(initialMarketFilter);
    }
  }, [initialMarketFilter]);

  useEffect(() => {
    setPriceAlerts((prev) => evaluatePriceAlerts(items, prev).updatedAlerts);
  }, [items]);

  const handleSaveAlert = (item: PromotionItem, targetPrice: number) => {
    const alertObj: PriceAlert = {
      itemId: item.id,
      itemName: item.name,
      targetPrice,
      currentLowestPrice: item.lowestPrice,
      cheapestMarket: item.cheapestMarket,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      isTriggered: item.lowestPrice <= targetPrice,
    };
    const updated = savePriceAlert(alertObj);
    setPriceAlerts({ ...updated });
  };

  const handleRemoveAlert = (itemId: string) => {
    const updated = removePriceAlert(itemId);
    setPriceAlerts({ ...updated });
  };

  // Leitura em voz alta (acessibilidade 70–90 anos)
  const handleSpeakOffer = (item: PromotionItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const reais = Math.floor(item.lowestPrice);
      const centavos = Math.round((item.lowestPrice - reais) * 100);
      const priceText =
        centavos > 0 ? `${reais} reais e ${centavos} centavos` : `${reais} reais`;
      const utterance = new SpeechSynthesisUtterance(
        `${item.name}. Menor preço hoje: ${priceText}, no ${item.cheapestMarket}.`
      );
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Mercados próximos pelo GPS (padrão Centro de Passo Fundo ou cidade atual no Brasil)
  const nearbyMarketNames = useMemo(() => {
    const stores = getAllPassoFundoStores();
    const lat = userProfile?.coordinates?.lat ?? -28.2628;
    const lng = userProfile?.coordinates?.lng ?? -52.4083;
    const radius = userProfile?.radiusKm ?? 5;
    const set = new Set<string>();
    stores.forEach((st) => {
      const d = calculateDistanceKm(lat, lng, st.lat, st.lng);
      if (d <= radius) {
        set.add(st.chain.toLowerCase());
        set.add(st.name.toLowerCase());
      }
    });
    return set;
  }, [userProfile]);

  // Categorias simplificadas para CategoryChips: Tudo, Hortifrúti, Carnes e Ovos, Outros
  const categoryItems = useMemo(() => {
    let hortifrutiCount = 0;
    let carnesCount = 0;
    let outrosCount = 0;

    items.forEach((it) => {
      if (it.category === 'hortifruti') hortifrutiCount++;
      else if (it.category === 'carnes_proteinas') carnesCount++;
      else outrosCount++;
    });

    return [
      { id: 'all', label: 'Tudo', count: items.length },
      { id: 'hortifruti', label: 'Hortifrúti', count: hortifrutiCount },
      { id: 'carnes_proteinas', label: 'Carnes e Ovos', count: carnesCount },
      { id: 'outros_geral', label: 'Outros', count: outrosCount },
    ];
  }, [items]);

  // Filtragem principal
  const filteredItems = useMemo(() => {
    const normQuery = normalizeSearchText(searchQuery);

    return items
      .filter((item) => {
        if (selectedCategory === 'hortifruti' && item.category !== 'hortifruti') return false;
        if (selectedCategory === 'carnes_proteinas' && item.category !== 'carnes_proteinas') return false;
        if (
          selectedCategory === 'outros_geral' &&
          (item.category === 'hortifruti' || item.category === 'carnes_proteinas')
        ) {
          return false;
        }
        if (onlyEssentials && !item.isEssential) return false;
        if (priceUnder10 && item.lowestPrice > 10) return false;
        if (onlyPromos && !item.prices.some((p) => p.isPromo)) return false;
        if (onlyFavorites && !priceAlerts[item.id]) return false;
        if (
          selectedSpecificMarket !== 'all' &&
          !item.prices.some(
            (p) => p.supermarket.toLowerCase() === selectedSpecificMarket.toLowerCase()
          )
        ) {
          return false;
        }
        if (onlyNearby && nearbyMarketNames.size > 0) {
          const hasNearby = item.prices.some((p) => {
            const mktLower = p.supermarket.toLowerCase();
            return Array.from(nearbyMarketNames).some(
              (nm) => mktLower.includes(nm) || nm.includes(mktLower)
            );
          });
          if (!hasNearby) return false;
        }
        if (normQuery) {
          const haystack = normalizeSearchText(
            `${item.name} ${item.brand || ''} ${item.cheapestMarket} ${
              categoryLabels[item.category] || ''
            }`
          );
          if (!haystack.includes(normQuery)) return false;
        }
        return true;
      })
      .sort((a, b) => a.lowestPrice - b.lowestPrice);
  }, [
    items,
    searchQuery,
    selectedCategory,
    onlyEssentials,
    priceUnder10,
    onlyPromos,
    onlyFavorites,
    selectedSpecificMarket,
    onlyNearby,
    nearbyMarketNames,
    priceAlerts,
  ]);

  // Destaques Relâmpago do Dia (Monster R$ 7,99, Sabonete Stock Center R$ 2,19, OMO, etc.)
  const dailySpotlightItems = useMemo(() => {
    const priorityIds = [
      'pf-energetico-monster-473ml',
      'pf-sabonete-barra-90g',
      'pf-sabao-omo-4kg',
      'pf-arroz-5kg',
      'pf-leite-uht-1l',
      'pf-peito-frango-kg',
    ];
    const highlighted = items.filter(
      (it) => it.isDailyHighlight || priorityIds.includes(it.id) || /monster|sabonete/i.test(it.name)
    );
    const sorted = [...highlighted].sort((a, b) => {
      const idxA = priorityIds.indexOf(a.id);
      const idxB = priorityIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.savingsPercent - a.savingsPercent;
    });
    return sorted.length > 0 ? sorted.slice(0, 8) : [...items].sort((a, b) => b.savingsPercent - a.savingsPercent).slice(0, 8);
  }, [items]);

  // Carrossel "Menores preços de hoje" (top 8 mais baratos)
  const lowestPriceHighlights = useMemo(() => {
    return [...items]
      .sort((a, b) => a.lowestPrice - b.lowestPrice)
      .slice(0, 8);
  }, [items]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSpecificMarket('all');
    setOnlyEssentials(false);
    setOnlyPromos(false);
    setPriceUnder10(false);
    setOnlyFavorites(false);
    setOnlyNearby(false);
  };

  const getCartEntry = (promo: PromotionItem) => {
    return shoppingList.find((s) => s.name.toLowerCase() === promo.name.toLowerCase());
  };

  const getUnitPriceText = (promo: PromotionItem): string | null => {
    const pkg = extractProductPackageInfo(promo.name, promo.unit);
    if (!pkg) return null;
    const calc = calculateUnitPrice(promo.lowestPrice, pkg);
    return calc.formatted !== '-' ? calc.formatted : null;
  };

  const openPackageCompareForItem = (promo: PromotionItem) => {
    const pkg = extractProductPackageInfo(promo.name, promo.unit);
    const validUnits = ['kg', 'g', 'L', 'ml', 'un'] as const;
    const mappedUnit = validUnits.includes(pkg?.standardUnit as any)
      ? (pkg.standardUnit as 'kg' | 'g' | 'L' | 'ml' | 'un')
      : 'kg';
    setPackageModalInitial({
      name: promo.name,
      amount: pkg?.packageAmount || 1,
      unit: mappedUnit,
      price: promo.lowestPrice,
    });
    setIsPackageModalOpen(true);
  };

  const selectedDetailSubstitutes = useMemo(() => {
    if (!selectedDetailItem) return [];
    return getSubstitutesForProduct(selectedDetailItem);
  }, [selectedDetailItem]);

  return (
    <div className="space-y-4">
      {/* 1. Barra enxuta de categorias: Tudo, Hortifrúti, Carnes e Ovos, Outros */}
      <CategoryChips
        items={categoryItems}
        activeId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* 2. DESTAQUE DO DIA (Monster R$ 7,99, Sabonete Stock Center R$ 2,19, Encartes & Redes Sociais) */}
      {!searchQuery.trim() && selectedCategory === 'all' && !isLoading && dailySpotlightItems.length > 0 && (
        <section className="space-y-2">
          <SectionTitle
            title="Promoções do dia em destaque"
            subtitle={`Encartes & redes sociais em ${userProfile?.neighborhood ? `${userProfile.neighborhood} · ` : ''}${userProfile?.city || 'Passo Fundo'}`}
          />
          <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar -mx-3 px-3 py-0.5">
            {dailySpotlightItems.map((item) => {
              const entry = getCartEntry(item);
              return (
                <ProductCard
                  key={`spotlight-${item.id}`}
                  item={item}
                  compact={true}
                  cartQuantity={entry?.quantity || 0}
                  onAdd={(it) => onAddToRancho(it)}
                  onOpenDetails={(it) => setSelectedDetailItem(it)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 2.5. Carrossel horizontal "Menores preços de hoje" */}
      {!searchQuery.trim() && selectedCategory === 'all' && !isLoading && lowestPriceHighlights.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            title="Itens mais baratos hoje"
            subtitle="Até R$ 6,00 nos mercados da sua região"
          />
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
            {lowestPriceHighlights.map((item) => {
              const entry = getCartEntry(item);
              return (
                <ProductCard
                  key={`highlight-${item.id}`}
                  item={item}
                  compact={true}
                  cartQuantity={entry?.quantity || 0}
                  onAdd={(it) => onAddToRancho(it)}
                  onOpenDetails={(it) => setSelectedDetailItem(it)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Lista vertical de ofertas */}
      <section className="space-y-3">
        <SectionTitle
          title="Catálogo completo da semana"
          subtitle={`${filteredItems.length} ${
            filteredItems.length === 1 ? 'produto verificado' : 'produtos verificados'
          } · Atualiza automaticamente ao vencer`}
          actionLabel={
            selectedCategory !== 'all' ||
            onlyEssentials ||
            onlyPromos ||
            priceUnder10 ||
            onlyFavorites ||
            onlyNearby ||
            selectedSpecificMarket !== 'all' ||
            searchQuery.trim()
              ? 'Limpar filtros'
              : undefined
          }
          onAction={clearAllFilters}
        />

        {isLoading ? (
          <SkeletonList count={5} />
        ) : filteredItems.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="Nenhuma oferta por aqui ainda"
              description={
                searchQuery.trim()
                  ? `Não encontramos "${searchQuery}" com os filtros atuais. Você pode limpar os filtros ou consultar o preço deste produto nos mercados agora.`
                  : 'Nenhum item corresponde aos filtros selecionados.'
              }
              actionLabel={
                searchQuery.trim() && onAddCustomProduct
                  ? `Adicionar "${searchQuery.trim()}" à lista`
                  : 'Limpar filtros'
              }
              onAction={() => {
                if (searchQuery.trim() && onAddCustomProduct) {
                  const estimated = generateOrEstimateProduct(
                    searchQuery.trim(),
                    userProfile?.city || 'Passo Fundo'
                  );
                  onAddCustomProduct(estimated);
                  setSearchQuery('');
                } else {
                  clearAllFilters();
                }
              }}
              secondaryActionLabel={searchQuery.trim() ? 'Limpar filtros' : undefined}
              onSecondaryAction={clearAllFilters}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const entry = getCartEntry(item);
              const alert = priceAlerts[item.id];
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  cartQuantity={entry?.quantity || 0}
                  unitPriceLabel={getUnitPriceText(item)}
                  hasAlert={Boolean(alert)}
                  isAlertTriggered={Boolean(alert?.isTriggered)}
                  onAdd={(it) => onAddToRancho(it)}
                  onIncrement={
                    entry && onUpdateQuantity ? () => onUpdateQuantity(entry.id, 1) : undefined
                  }
                  onDecrement={
                    entry
                      ? () => {
                          if (entry.quantity > 1 && onUpdateQuantity) {
                            onUpdateQuantity(entry.id, -1);
                          } else if (onRemoveItem) {
                            onRemoveItem(entry.id);
                          }
                        }
                      : undefined
                  }
                  onSpeak={handleSpeakOffer}
                  onOpenDetails={(it) => setSelectedDetailItem(it)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Busca de produto customizado na web */}
      {onAddCustomProduct && (
        <ProductSearchAdd
          onAddCustomProduct={onAddCustomProduct}
          cityName={userProfile?.city || 'Passo Fundo'}
        />
      )}

      {/* BottomSheet de Detalhes do Produto (Comparativo por mercado, preço/kg, substitutos, alerta e voz) */}
      <BottomSheet
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        title={selectedDetailItem?.name}
        subtitle={
          selectedDetailItem
            ? `${selectedDetailItem.brand ? `${selectedDetailItem.brand} · ` : ''}${
                selectedDetailItem.unit
              }${
                getUnitPriceText(selectedDetailItem)
                  ? ` · ${getUnitPriceText(selectedDetailItem)}`
                  : ''
              }`
            : undefined
        }
        footer={
          selectedDetailItem ? (
            <PrimaryButton
              onClick={() => {
                onAddToRancho(selectedDetailItem);
                setSelectedDetailItem(null);
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              Levar pelo menor preço (R${' '}
              {selectedDetailItem.lowestPrice.toFixed(2).replace('.', ',')})
            </PrimaryButton>
          ) : undefined
        }
      >
        {selectedDetailItem && (
          <div className="space-y-5">
            {/* Resumo da fonte do encarte e validade */}
            <div className="bg-field rounded-card p-3.5 space-y-1">
              <p className="text-[12px] font-semibold text-brand truncate">
                {selectedDetailItem.flyerSource || `Encarte verificado · ${selectedDetailItem.cheapestMarket}`}
              </p>
              <p className="text-[12px] font-medium text-ink-soft">
                {selectedDetailItem.validUntil || 'Oferta válida nesta semana'}
              </p>
            </div>

            {/* Ações rápidas do item */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSpeakOffer(selectedDetailItem)}
                className="min-h-[48px] rounded-field bg-field text-ink text-[12px] font-semibold flex items-center justify-center gap-1.5 px-2 active:scale-[0.98] transition-transform"
              >
                <Volume2 className="w-4 h-4 text-brand shrink-0" />
                <span>Ouvir</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const it = selectedDetailItem;
                  setSelectedDetailItem(null);
                  openPackageCompareForItem(it);
                }}
                className="min-h-[48px] rounded-field bg-field text-ink text-[12px] font-semibold flex items-center justify-center gap-1.5 px-2 active:scale-[0.98] transition-transform"
              >
                <Scale className="w-4 h-4 text-brand shrink-0" />
                <span>Preço/kg</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const it = selectedDetailItem;
                  setSelectedDetailItem(null);
                  setAlertModalItem(it);
                }}
                className="min-h-[48px] rounded-field bg-field text-ink text-[12px] font-semibold flex items-center justify-center gap-1.5 px-2 active:scale-[0.98] transition-transform"
              >
                <Bell className="w-4 h-4 text-brand shrink-0" />
                <span>Alerta</span>
              </button>
            </div>

            {/* Preços em cada supermercado */}
            <div className="space-y-2">
              <h4 className="text-[14px] font-bold text-ink">Preços por supermercado</h4>
              <div className="space-y-2">
                {[...selectedDetailItem.prices]
                  .sort((a, b) => a.price - b.price)
                  .map((p, idx) => {
                    const isCheapest = idx === 0;
                    return (
                      <div
                        key={`${p.supermarket}-${idx}`}
                        className={`rounded-field p-3.5 flex items-center justify-between gap-3 ${
                          isCheapest ? 'bg-save-soft' : 'bg-field'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Store
                              className={`w-4 h-4 shrink-0 ${
                                isCheapest ? 'text-save' : 'text-ink-soft'
                              }`}
                            />
                            <span className="text-[14px] font-semibold text-ink truncate">
                              {p.supermarket}
                            </span>
                            {isCheapest && <EconomyBadge label="Menor preço" />}
                          </div>
                          {(p.promoNote || p.validUntil) && (
                            <p className="text-[12px] text-ink-soft mt-0.5 truncate">
                              {p.promoNote ? `${p.promoNote}${p.validUntil ? ` · ${p.validUntil}` : ''}` : p.validUntil}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <PriceTag value={p.price} size="md" isLowest={isCheapest} />
                          <button
                            type="button"
                            onClick={() => {
                              onAddToRancho(selectedDetailItem, p.supermarket);
                              setSelectedDetailItem(null);
                            }}
                            className="min-h-[44px] px-3 rounded-pill bg-surface text-ink text-[12px] font-bold shadow-card active:scale-[0.98] transition-transform"
                          >
                            Escolher
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Substitutos mais baratos para este produto */}
            {selectedDetailSubstitutes.length > 0 && onAddSubstituteToRancho && (
              <div className="space-y-2">
                <h4 className="text-[14px] font-bold text-ink">Substituto mais barato</h4>
                {selectedDetailSubstitutes.slice(0, 2).map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-field rounded-field p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">
                        {sub.substituteName}
                      </p>
                      <p className="text-[12px] text-ink-soft truncate">
                        {sub.market} · Economiza R${' '}
                        {sub.savingsAmount.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddSubstituteToRancho(sub, selectedDetailItem.name);
                        setSelectedDetailItem(null);
                      }}
                      className="min-h-[44px] px-3.5 rounded-pill bg-save text-white text-[12px] font-bold shrink-0 active:scale-[0.98] transition-transform"
                    >
                      R$ {sub.estimatedPrice.toFixed(2).replace('.', ',')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Modais auxiliares em BottomSheet */}
      <PackageComparisonModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        initialProductName={packageModalInitial?.name}
        initialAmountA={packageModalInitial?.amount}
        initialUnitA={packageModalInitial?.unit}
        initialPriceA={packageModalInitial?.price}
      />

      <SubstitutesExplorerModal
        isOpen={isSubstitutesModalOpen}
        onClose={() => setIsSubstitutesModalOpen(false)}
        items={items}
        shoppingList={shoppingList}
        onApplySubstitute={(sub, originalName) => {
          if (onAddSubstituteToRancho) {
            onAddSubstituteToRancho(sub, originalName);
          }
          setIsSubstitutesModalOpen(false);
        }}
      />

      <PriceAlertModal
        isOpen={Boolean(alertModalItem)}
        onClose={() => setAlertModalItem(null)}
        item={alertModalItem}
        existingAlert={alertModalItem ? priceAlerts[alertModalItem.id] : undefined}
        onSaveAlert={handleSaveAlert}
        onRemoveAlert={handleRemoveAlert}
      />
    </div>
  );
};
