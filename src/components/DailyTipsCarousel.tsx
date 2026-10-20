import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingDown } from 'lucide-react';
import {
  DailyTip,
  ShoppingListItem,
  BudgetProfile,
  UserProfile,
  RanchoHistoryEntry,
} from '../types';
import { SectionTitle } from './ui/SectionTitle';
import { EconomyBadge } from './ui/EconomyBadge';
import { SkeletonCard } from './ui/SkeletonCard';

interface DailyTipsCarouselProps {
  shoppingList: ShoppingListItem[];
  history: RanchoHistoryEntry[];
  profile: BudgetProfile;
  userProfile: UserProfile;
  currentTotal: number;
  onNavigateToOffers?: () => void;
  onNavigateToRancho?: () => void;
}

const STORAGE_KEY = 'rancho_daily_tips_cache_v1';

const INITIAL_FALLBACK_TIPS: DailyTip[] = [
  {
    id: 'tip-init-1',
    title: 'Quarta e quinta da feira',
    category: 'timing',
    icon: '',
    tag: 'Dia de feira',
    shortText:
      'No Stok Center e atacarejos da região, quartas e quintas têm os maiores descontos em hortifrúti fresco.',
    actionableAdvice:
      'Concentre a compra de frutas, legumes e ovos nesses dias para pagar até 35% menos no quilo.',
    potentialSavings: 'R$ 15 a R$ 25',
    badgeColor: 'emerald',
  },
  {
    id: 'tip-init-2',
    title: 'Proteína com melhor rendimento',
    category: 'substituicao',
    icon: '',
    tag: 'Troca econômica',
    shortText:
      'Alternar cortes bovinos caros com acém moído, peito de frango ou bandeja de 30 ovos reduz o gasto sem perder proteína.',
    actionableAdvice:
      'Substitua metade das carnes da semana por sobrecoxa ou ovos.',
    potentialSavings: 'R$ 20 a R$ 38',
    badgeColor: 'amber',
  },
  {
    id: 'tip-init-3',
    title: 'Limpeza em embalagem de 3L a 5L',
    category: 'atacado',
    icon: '',
    tag: 'Atacarejo',
    shortText:
      'Produtos de limpeza em galões e caixas maiores custam até 30% menos por litro ou quilo.',
    actionableAdvice:
      'Compre sabão e detergente uma vez por mês no atacarejo.',
    potentialSavings: 'R$ 12 a R$ 20',
    badgeColor: 'blue',
  },
  {
    id: 'tip-init-4',
    title: 'Olho no preço por quilo',
    category: 'alerta',
    icon: '',
    tag: 'Na gôndola',
    shortText:
      'Sempre confira o valor por quilo ou litro antes de levar pacotes promocionais.',
    actionableAdvice:
      'Use o comparador de embalagens nas ofertas para confirmar a economia real.',
    potentialSavings: 'R$ 8 a R$ 16',
    badgeColor: 'purple',
  },
];

export const DailyTipsCarousel: React.FC<DailyTipsCarouselProps> = ({
  shoppingList,
  history,
  profile,
  userProfile,
  currentTotal,
}) => {
  const [tips, setTips] = useState<DailyTip[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_FALLBACK_TIPS;
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchTips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shoppingList,
          history,
          profile,
          userProfile,
          currentTotal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tips) && data.tips.length > 0) {
          setTips(data.tips);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tips));
          } catch {}
        }
      }
    } catch {
      // Mantém dicas locais
    } finally {
      setIsLoading(false);
    }
  }, [shoppingList, history, profile, userProfile, currentTotal]);

  useEffect(() => {
    // Carrega silenciosamente se ainda não houver cache salvo
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) {
      fetchTips();
    }
  }, [fetchTips]);

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Dicas para economizar hoje"
        actionLabel={isLoading ? 'Atualizando...' : 'Novas dicas'}
        onAction={fetchTips}
      />

      {isLoading ? (
        <SkeletonCard heightClass="h-36" />
      ) : (
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="w-[268px] shrink-0 bg-surface rounded-card shadow-card p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-ink-muted">{tip.tag}</span>
                  {tip.potentialSavings && (
                    <EconomyBadge label={tip.potentialSavings} />
                  )}
                </div>
                <h3 className="text-[15px] font-semibold text-ink leading-snug">
                  {tip.title}
                </h3>
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  {tip.shortText}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[12px] font-medium text-save">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tip.actionableAdvice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
