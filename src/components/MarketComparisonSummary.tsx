import React, { useState } from 'react';
import { ShoppingListItem, SupermarketName, UserProfile } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Share2,
  MapPin,
} from 'lucide-react';
import { ShareRanchoModal } from './ShareRanchoModal';
import {
  PASSO_FUNDO_STORES,
  calculateDistanceKm,
  calculateFuelAndTrip,
} from '../utils/passoFundoLocations';
import { SectionTitle } from './ui/SectionTitle';
import { PriceTag } from './ui/PriceTag';
import { EconomyBadge } from './ui/EconomyBadge';
import { ProgressBar } from './ui/ProgressBar';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';

interface MarketComparisonSummaryProps {
  items: ShoppingListItem[];
  budgetLimit: number;
  userProfile?: UserProfile;
  onSelectMarketForCart?: (market: SupermarketName) => void;
}

export const MarketComparisonSummary: React.FC<MarketComparisonSummaryProps> = ({
  items,
  budgetLimit,
  userProfile,
  onSelectMarketForCart,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (items.length === 0) return null;

  const userLat = userProfile?.coordinates?.lat || -28.2618;
  const userLng = userProfile?.coordinates?.lng || -52.408;

  const getMarketProximity = (market: SupermarketName) => {
    const stores = PASSO_FUNDO_STORES.filter((s) => s.chain === market);
    if (stores.length === 0) return { distanceKm: 3.0, fuel: calculateFuelAndTrip(3.0) };

    let minD = Infinity;
    for (const s of stores) {
      const d = calculateDistanceKm(userLat, userLng, s.lat, s.lng);
      if (d < minD) minD = d;
    }
    return {
      distanceKm: minD,
      fuel: calculateFuelAndTrip(minD),
    };
  };

  const totals: Record<SupermarketName, number> = {
    'Stock Center': 0,
    'Supermercado Boqueirão': 0,
    'Atacadão': 0,
    'Zaffari': 0,
    'Bourbon': 0,
    'Coqueiros': 0,
  };

  let splitOptimizedTotal = 0;

  items.forEach((item) => {
    const prices = item.prices || {};
    const stok = (prices['Stock Center'] || item.unitPrice) * item.quantity;
    const boqueirao = (prices['Supermercado Boqueirão'] || item.unitPrice * 1.02) * item.quantity;
    const atacadao = (prices['Atacadão'] || item.unitPrice) * item.quantity;
    const zaffari = (prices['Zaffari'] || item.unitPrice) * item.quantity;
    const bourbon = (prices['Bourbon'] || item.unitPrice) * item.quantity;
    const coqueiros = (prices['Coqueiros'] || item.unitPrice * 1.04) * item.quantity;

    totals['Stock Center'] += stok;
    totals['Supermercado Boqueirão'] += boqueirao;
    totals['Atacadão'] += atacadao;
    totals['Zaffari'] += zaffari;
    totals['Bourbon'] += bourbon;
    totals['Coqueiros'] += coqueiros;

    const validVals = [stok, boqueirao, atacadao, zaffari, bourbon, coqueiros].filter(
      (v) => v > 0
    );
    const minVal =
      validVals.length > 0 ? Math.min(...validVals) : item.unitPrice * item.quantity;
    splitOptimizedTotal += minVal;
  });

  const marketEntries = (Object.entries(totals) as [SupermarketName, number][]).sort(
    (a, b) => a[1] - b[1]
  );
  const cheapestSingleMarket = marketEntries[0];
  const mostExpensiveMarket = marketEntries[marketEntries.length - 1];
  const totalMaxSavings = Math.max(0, mostExpensiveMarket[1] - splitOptimizedTotal);

  return (
    <div className="space-y-6">
      {/* 1. Header da tela: Total na opção mais barata + Orçamento com ProgressBar */}
      <div className="bg-surface rounded-card shadow-card p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium text-ink-muted">
              Menor total em 1 único mercado ({cheapestSingleMarket[0]})
            </p>
            <div className="mt-1">
              <PriceTag value={cheapestSingleMarket[1]} size="lg" isLowest={true} />
            </div>
          </div>
          <span className="text-[12px] font-medium text-ink-muted tabular-nums">
            Teto: R$ {budgetLimit.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <ProgressBar current={cheapestSingleMarket[1]} limit={budgetLimit} />
      </div>

      {/* 2. Ranking de mercados em CARDS verticais */}
      <section className="space-y-3">
        <SectionTitle
          title="Onde seu rancho fica mais barato"
          subtitle={`Comparando ${items.length} ${
            items.length === 1 ? 'item' : 'itens'
          } nos mercados de ${userProfile?.city || 'Passo Fundo'}`}
        />

        <div className="space-y-3">
          {marketEntries.map(([marketName, marketTotal], idx) => {
            const isFirst = idx === 0;
            const diffFromBest = marketTotal - cheapestSingleMarket[1];
            const fitsBudget = marketTotal <= budgetLimit;
            const proximity = getMarketProximity(marketName);
            const proportionPct =
              mostExpensiveMarket[1] > 0
                ? Math.min(100, Math.round((marketTotal / mostExpensiveMarket[1]) * 100))
                : 100;

            return (
              <div
                key={marketName}
                onClick={() => onSelectMarketForCart && onSelectMarketForCart(marketName)}
                role={onSelectMarketForCart ? 'button' : undefined}
                tabIndex={onSelectMarketForCart ? 0 : undefined}
                className={`rounded-card p-4 space-y-3 transition ${
                  isFirst
                    ? 'bg-save-soft border-2 border-save shadow-card'
                    : 'bg-surface shadow-card'
                } ${onSelectMarketForCart ? 'cursor-pointer active:scale-[0.98]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Medalha de posição */}
                    <span
                      className={`w-8 h-8 rounded-full text-[13px] font-bold tabular-nums flex items-center justify-center shrink-0 ${
                        isFirst
                          ? 'bg-save text-white'
                          : 'bg-field text-ink-soft'
                      }`}
                    >
                      {idx + 1}º
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-ink truncate">
                        {marketName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft mt-0.5 tabular-nums flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>{proximity.distanceKm.toFixed(1)} km</span>
                        <span aria-hidden="true">·</span>
                        {fitsBudget ? (
                          <span className="inline-flex items-center gap-1 text-save font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cabe no orçamento
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-warn font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Passa R$ {(marketTotal - budgetLimit).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <PriceTag value={marketTotal} size="md" isLowest={isFirst} />
                    <p className="text-[12px] font-medium text-ink-muted tabular-nums mt-0.5">
                      {isFirst
                        ? 'Mais barato'
                        : `+R$ ${diffFromBest.toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                </div>

                {/* Mini-barra de proporção */}
                <div className="w-full h-1.5 rounded-pill bg-white/80 overflow-hidden">
                  <div
                    className={`h-full rounded-pill ${
                      isFirst ? 'bg-save' : fitsBudget ? 'bg-ink-soft' : 'bg-warn'
                    }`}
                    style={{ width: `${proportionPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Card de comparação "Compra dividida" */}
      <div className="bg-surface rounded-card shadow-card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[12px] font-medium text-ink-muted">
              Pegando cada item onde está mais barato
            </span>
            <h3 className="text-[15px] font-semibold text-ink mt-0.5">
              Compra dividida otimizada
            </h3>
          </div>
          {totalMaxSavings > 0 && (
            <EconomyBadge
              label={`Economiza R$ ${totalMaxSavings.toFixed(2).replace('.', ',')}`}
            />
          )}
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <PriceTag value={splitOptimizedTotal} size="lg" isLowest={true} />
          <span className="text-[12px] font-medium text-ink-muted tabular-nums">
            vs. R$ {mostExpensiveMarket[1].toFixed(2).replace('.', ',')} no mais caro
          </span>
        </div>
      </div>

      {/* 4. CTAs */}
      <div className="space-y-2.5">
        {onSelectMarketForCart && (
          <PrimaryButton onClick={() => onSelectMarketForCart(cheapestSingleMarket[0])}>
            Levar para o mercado mais barato ({cheapestSingleMarket[0]})
          </PrimaryButton>
        )}

        <SecondaryButton
          onClick={() => setIsShareModalOpen(true)}
          icon={<Share2 className="w-4 h-4" />}
        >
          Compartilhar comparativo
        </SecondaryButton>
      </div>

      <ShareRanchoModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        items={items}
        budgetLimit={budgetLimit}
        cityName={userProfile?.city || 'Passo Fundo'}
        neighborhood={userProfile?.neighborhood || 'Passo Fundo'}
      />
    </div>
  );
};
