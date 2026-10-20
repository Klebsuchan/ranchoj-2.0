import React, { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Check,
  Plus,
  Minus,
  User,
  Users,
  Home,
  ChevronLeft,
} from 'lucide-react';
import {
  UserProfile,
  PromotionItem,
  ShoppingListItem,
} from '../types';
import {
  generateRanchoProntoOptions,
  RanchoProntoOption,
} from '../utils/ranchoProntoGenerator';
import { StepperDots } from './ui/StepperDots';
import { SectionTitle } from './ui/SectionTitle';
import { PriceTag } from './ui/PriceTag';
import { EconomyBadge } from './ui/EconomyBadge';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { ToggleChip } from './ui/ToggleChip';
import { BottomSheet } from './ui/BottomSheet';

interface RanchoProntoSelectorProps {
  userProfile: UserProfile;
  promotions: PromotionItem[];
  onApplyRancho: (items: ShoppingListItem[], budget: number, optionTitle: string) => void;
  onOpenMap?: () => void;
  onNavigateToCart?: () => void;
  initialBudget?: number;
  className?: string;
}

const BUDGET_PRESETS_BY_HOUSEHOLD: Record<'solo' | 'casal' | 'familia', number[]> = {
  solo: [350, 450, 600, 750],
  casal: [650, 850, 1050, 1350],
  familia: [980, 1350, 1750, 2200],
};

export const RanchoProntoSelector: React.FC<RanchoProntoSelectorProps> = ({
  userProfile,
  promotions,
  onApplyRancho,
  initialBudget = 450,
  className = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [household, setHousehold] = useState<'solo' | 'casal' | 'familia'>('solo');
  const [cycleDays, setCycleDays] = useState<15 | 30>(30);
  const [selectedBudget, setSelectedBudget] = useState<number>(initialBudget);
  const [customInputValue, setCustomInputValue] = useState<string>(String(initialBudget));
  const [selectedOptionId, setSelectedOptionId] = useState<
    'maxima-economia' | 'mais-proximo' | 'combo-inteligente'
  >('maxima-economia');
  const [detailSheetOption, setDetailSheetOption] = useState<RanchoProntoOption | null>(null);

  const options = useMemo(() => {
    return generateRanchoProntoOptions({
      budget: selectedBudget,
      householdType: household,
      familyMembers: household === 'casal' ? 2 : household === 'familia' ? 4 : 1,
      userCoords: userProfile.coordinates,
      userNeighborhood: userProfile.neighborhood,
      availablePromotions: promotions,
    });
  }, [selectedBudget, household, userProfile.coordinates, userProfile.neighborhood, promotions]);

  const currentOption = useMemo(() => {
    return options.find((o) => o.id === selectedOptionId) || options[0];
  }, [options, selectedOptionId]);

  const [itemsState, setItemsState] = useState<ShoppingListItem[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentOption && currentOption.items) {
      setItemsState(currentOption.items.map((item) => ({ ...item })));
      setExcludedIds(new Set());
    }
  }, [currentOption]);

  const activeItems = useMemo(() => {
    return itemsState.filter((i) => !excludedIds.has(i.id));
  }, [itemsState, excludedIds]);

  const activeTotal = useMemo(() => {
    return activeItems.reduce((acc, i) => acc + i.totalPrice, 0);
  }, [activeItems]);

  const handleSelectHousehold = (type: 'solo' | 'casal' | 'familia') => {
    setHousehold(type);
    const defaultVal = type === 'solo' ? 450 : type === 'casal' ? 850 : 1350;
    setSelectedBudget(defaultVal);
    setCustomInputValue(String(defaultVal));
  };

  const handleBudgetInputChange = (val: string) => {
    setCustomInputValue(val);
    const parsed = Number(val);
    if (!isNaN(parsed) && parsed >= 100) {
      setSelectedBudget(parsed);
    }
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    setItemsState((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextQty = Math.max(1, it.quantity + delta);
          return {
            ...it,
            quantity: nextQty,
            totalPrice: Number((it.unitPrice * nextQty).toFixed(2)),
          };
        }
        return it;
      })
    );
  };

  const handleToggleIncludeItem = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmApply = (opt?: RanchoProntoOption) => {
    const targetOption = opt || currentOption;
    if (!targetOption) return;
    const listToSend =
      opt && opt.id !== currentOption?.id ? opt.items : activeItems;
    onApplyRancho(listToSend, selectedBudget, targetOption.title);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Indicador de passos */}
      <StepperDots
        totalSteps={3}
        currentStep={step}
        onSelectStep={(s) => setStep(s as 1 | 2 | 3)}
        labels={['Seu perfil', 'Seu orçamento', 'Rancho pronto']}
      />

      {/* PASSO 1: PERFIL (Solo / Casal / Família) */}
      {step === 1 && (
        <div className="space-y-5">
          <SectionTitle
            title="Para quem é o rancho?"
            subtitle="Ajustamos as quantidades de arroz, carnes e limpeza para a sua casa"
          />

          <div className="space-y-3">
            {[
              {
                id: 'solo' as const,
                title: 'Moro sozinho(a)',
                desc: 'Quantidades na medida para 1 pessoa sem desperdício',
                icon: <User className="w-6 h-6" />,
              },
              {
                id: 'casal' as const,
                title: 'Casal (2 pessoas)',
                desc: 'Cesta balanceada para duas pessoas dividirem o mês',
                icon: <Users className="w-6 h-6" />,
              },
              {
                id: 'familia' as const,
                title: 'Família (3 a 4 pessoas)',
                desc: 'Fardos e embalagens econômicas de maior rendimento',
                icon: <Home className="w-6 h-6" />,
              },
            ].map((card) => {
              const isSelected = household === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectHousehold(card.id)}
                  className={`w-full min-h-[76px] p-4 rounded-card text-left flex items-center justify-between gap-3.5 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    isSelected
                      ? 'bg-brand-soft border-2 border-brand shadow-card'
                      : 'bg-surface border border-slate-200 shadow-card'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-field flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-brand text-white' : 'bg-field text-ink-soft'
                      }`}
                    >
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink">{card.title}</p>
                      <p className="text-[12px] font-medium text-ink-soft mt-0.5">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand bg-brand text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>

          <PrimaryButton onClick={() => setStep(2)}>
            Continuar para orçamento
          </PrimaryButton>
        </div>
      )}

      {/* PASSO 2: ORÇAMENTO + CICLO 15/30 DIAS */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] px-2 -ml-2 text-[13px] font-semibold text-ink-soft hover:text-ink flex items-center gap-1 active:scale-[0.98] transition-transform"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar ao perfil</span>
            </button>
          </div>

          <SectionTitle
            title="Quanto você quer gastar?"
            subtitle="Montaremos a melhor cesta dentro do seu limite"
          />

          <div className="bg-surface rounded-card shadow-card p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1.5">
                Teto máximo do seu rancho (R$)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[17px] font-bold text-ink-soft">
                  R$
                </span>
                <input
                  type="number"
                  step="10"
                  min="150"
                  value={customInputValue}
                  onChange={(e) => handleBudgetInputChange(e.target.value)}
                  className="w-full min-h-[56px] pl-12 pr-4 rounded-field bg-field text-ink text-[24px] font-extrabold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                />
              </div>
            </div>

            {/* Valores sugeridos */}
            <div className="space-y-2">
              <span className="block text-[12px] font-medium text-ink-muted">
                Valores sugeridos
              </span>
              <div className="grid grid-cols-4 gap-2">
                {BUDGET_PRESETS_BY_HOUSEHOLD[household].map((preset) => (
                  <ToggleChip
                    key={preset}
                    label={`R$ ${preset}`}
                    active={selectedBudget === preset}
                    onToggle={() => {
                      setSelectedBudget(preset);
                      setCustomInputValue(String(preset));
                    }}
                    className="justify-center"
                  />
                ))}
              </div>
            </div>

            {/* Ciclo 15 ou 30 dias */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block text-[12px] font-medium text-ink-muted">
                Duração da compra
              </span>
              <div className="grid grid-cols-2 gap-2">
                <ToggleChip
                  label="Para 30 dias (mês)"
                  active={cycleDays === 30}
                  onToggle={() => setCycleDays(30)}
                  className="justify-center"
                />
                <ToggleChip
                  label="Para 15 dias (quinzena)"
                  active={cycleDays === 15}
                  onToggle={() => setCycleDays(15)}
                  className="justify-center"
                />
              </div>
            </div>
          </div>

          <PrimaryButton onClick={() => setStep(3)}>
            Ver 3 opções de rancho pronto
          </PrimaryButton>
        </div>
      )}

      {/* PASSO 3: RESULTADO (3 OPÇÕES EM CARDS VERTICAIS GRANDES) */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] px-2 -ml-2 text-[13px] font-semibold text-ink-soft hover:text-ink flex items-center gap-1 active:scale-[0.98] transition-transform"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ajustar orçamento (R$ {selectedBudget})</span>
            </button>
          </div>

          <SectionTitle
            title="Rancho pronto para você"
            subtitle={`3 estratégias calculadas para R$ ${selectedBudget} (${cycleDays} dias)`}
          />

          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = opt.id === selectedOptionId;
              const displayTotal = isSelected ? activeTotal : opt.totalPrice;
              const displayItems = isSelected ? activeItems : opt.items;
              const primaryStore = opt.stores[0];
              const secondaryStore = opt.stores[1];
              const distKm = primaryStore?.distanceKm ?? opt.fuelEstimate?.distanceKm ?? 2.0;

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOptionId(opt.id);
                    }
                  }}
                  className={`rounded-card p-4 space-y-3 transition cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-surface border-2 border-brand shadow-float'
                      : 'bg-surface border border-slate-200 shadow-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-brand">
                        {opt.badge}
                      </span>
                      <h3 className="text-[17px] font-bold text-ink mt-0.5">
                        {opt.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft mt-0.5">
                        <Store className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate">
                          {primaryStore?.name || 'Stock Center'}
                          {secondaryStore ? ` + ${secondaryStore.name}` : ''}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{distKm.toFixed(1)} km</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <PriceTag value={displayTotal} size="lg" isLowest={isSelected} />
                      {opt.savingsAmount > 0 && (
                        <div>
                          <EconomyBadge
                            label={`Economiza R$ ${opt.savingsAmount.toFixed(0)}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo dos itens em 2 linhas */}
                  <p className="text-[14px] text-ink-soft line-clamp-2 leading-snug">
                    <strong className="text-ink font-semibold">
                      {displayItems.length} itens:
                    </strong>{' '}
                    {displayItems.map((i) => `${i.quantity}x ${i.name.split('(')[0].trim()}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOptionId(opt.id);
                        setDetailSheetOption(opt);
                      }}
                      className="min-h-[44px] px-3 -ml-3 text-[13px] font-semibold text-brand hover:underline"
                    >
                      Ver detalhes ({displayItems.length} itens)
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOptionId(opt.id);
                        handleConfirmApply(opt);
                      }}
                      className={`min-h-[44px] px-4 rounded-pill text-[13px] font-bold whitespace-nowrap active:scale-[0.98] transition-transform ${
                        isSelected
                          ? 'bg-brand text-white'
                          : 'bg-field text-ink hover:bg-slate-200'
                      }`}
                    >
                      Escolher esta opção
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <PrimaryButton onClick={() => handleConfirmApply()}>
            Enviar ao carrinho (R$ {activeTotal.toFixed(2).replace('.', ',')})
          </PrimaryButton>
        </div>
      )}

      {/* BottomSheet de detalhes e ajuste de quantidade da opção selecionada */}
      <BottomSheet
        isOpen={Boolean(detailSheetOption)}
        onClose={() => setDetailSheetOption(null)}
        title={detailSheetOption?.title}
        subtitle={`${activeItems.length} itens selecionados · Total R$ ${activeTotal
          .toFixed(2)
          .replace('.', ',')}`}
        footer={
          <PrimaryButton
            onClick={() => {
              setDetailSheetOption(null);
              handleConfirmApply();
            }}
          >
            Enviar {activeItems.length} itens ao carrinho
          </PrimaryButton>
        }
      >
        <div className="space-y-2.5">
          {itemsState.map((item) => {
            const isExcluded = excludedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-field p-3.5 bg-field flex items-center justify-between gap-3 ${
                  isExcluded ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleIncludeItem(item.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left min-h-[44px]"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      !isExcluded
                        ? 'bg-save border-save text-white'
                        : 'border-slate-300 bg-surface'
                    }`}
                  >
                    {!isExcluded && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-[14px] font-semibold truncate ${
                        isExcluded ? 'line-through text-ink-muted' : 'text-ink'
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-[12px] font-medium text-ink-muted tabular-nums">
                      R$ {item.unitPrice.toFixed(2).replace('.', ',')} / {item.unit} ·{' '}
                      {item.selectedMarket}
                    </p>
                  </div>
                </button>

                {!isExcluded && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-surface rounded-pill">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.id, -1)}
                        aria-label={`Diminuir ${item.name}`}
                        className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 text-[13px] font-bold text-ink tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.id, 1)}
                        aria-label={`Aumentar ${item.name}`}
                        className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[13px] font-bold text-ink tabular-nums min-w-[58px] text-right">
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};
