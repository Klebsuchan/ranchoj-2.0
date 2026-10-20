import React from 'react';
import {
  BudgetProfile,
  UserProfile,
  PromotionItem,
  ShoppingListItem,
  BudgetAnalysis,
  RanchoHistoryEntry,
} from '../types';
import { CheckCircle2, AlertTriangle, Scissors } from 'lucide-react';
import { DailyTipsCarousel } from './DailyTipsCarousel';
import { StatPill } from './ui/StatPill';
import { ProgressBar } from './ui/ProgressBar';
import { SectionTitle } from './ui/SectionTitle';
import { ToggleChip } from './ui/ToggleChip';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { SkeletonList } from './ui/SkeletonList';

interface BudgetStepViewProps {
  profile: BudgetProfile;
  onUpdateProfile: (updated: Partial<BudgetProfile>) => void;
  totalRancho: number;
  onNextStep: () => void;
  onOpenAdvisor: () => void;
  isAnalyzingAdvisor?: boolean;
  userProfile?: UserProfile;
  promotions?: PromotionItem[];
  onApplyRanchoPronto?: (items: ShoppingListItem[], budget: number, optionTitle: string) => void;
  onOpenMap?: () => void;
  shoppingList?: ShoppingListItem[];
  history?: RanchoHistoryEntry[];
  analysis?: BudgetAnalysis | null;
  onApplyCuts?: (itemNamesToRemove: string[]) => void;
}

const SALARY_PRESETS = [1518, 2200, 3000, 4200, 6000];

export const BudgetStepView: React.FC<BudgetStepViewProps> = ({
  profile,
  onUpdateProfile,
  totalRancho,
  onNextStep,
  onOpenAdvisor,
  isAnalyzingAdvisor = false,
  userProfile,
  shoppingList = [],
  history = [],
  analysis,
  onApplyCuts,
}) => {
  const numPersons = profile.familyMembers || (profile.householdType === 'casal' ? 2 : 1);
  const teto = profile.ranchoBudget || 450;
  const salario = profile.monthlyIncome || 1800;
  const balance = teto - totalRancho;

  const setPersons = (count: number) => {
    onUpdateProfile({
      familyMembers: count,
      householdType: count === 1 ? 'solo' : 'casal',
    });
  };

  const applySalaryPercent = (pct: number) => {
    if (salario > 0) {
      const calculated = Math.round((salario * pct) / 100);
      onUpdateProfile({ ranchoBudget: calculated });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Resumo do mês no topo: StatPills + ProgressBar grande */}
      <div className="bg-surface rounded-card shadow-card p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          <StatPill
            label="Gasto atual"
            value={`R$ ${totalRancho.toFixed(0)}`}
            tone={totalRancho > teto ? 'danger' : 'default'}
          />
          <StatPill label="Teto do mês" value={`R$ ${teto.toFixed(0)}`} tone="brand" />
          <StatPill
            label={balance >= 0 ? 'Disponível' : 'Acima do teto'}
            value={`R$ ${Math.abs(balance).toFixed(0)}`}
            tone={balance >= 0 ? 'save' : 'danger'}
          />
        </div>

        <ProgressBar current={totalRancho} limit={teto} />
      </div>

      {/* 2. Formulário do BudgetProfile em campos grandes rounded-field bg-field */}
      <section className="bg-surface rounded-card shadow-card p-4 space-y-4">
        <SectionTitle
          title="Seu orçamento mensal"
          subtitle="Defina quanto você pode gastar no supermercado sem apertar o mês"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Renda mensal (R$)
            </label>
            <input
              type="number"
              step="50"
              value={salario}
              onChange={(e) =>
                onUpdateProfile({ monthlyIncome: Math.max(0, Number(e.target.value)) })
              }
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-bold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Teto do rancho (R$)
            </label>
            <input
              type="number"
              step="10"
              value={teto}
              onChange={(e) =>
                onUpdateProfile({ ranchoBudget: Math.max(50, Number(e.target.value)) })
              }
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-bold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
        </div>

        {/* Sugestões de renda e percentual */}
        <div className="space-y-2">
          <span className="block text-[12px] font-medium text-ink-muted">
            Faixa de renda rápida
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {SALARY_PRESETS.map((val) => (
              <ToggleChip
                key={val}
                label={`R$ ${val}`}
                active={salario === val}
                onToggle={() => onUpdateProfile({ monthlyIncome: val })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[12px] font-medium text-ink-muted">
            Calcular teto pela renda
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[15, 20, 25].map((pct) => {
              const targetVal = Math.round((salario * pct) / 100);
              return (
                <ToggleChip
                  key={pct}
                  label={`${pct}% (R$ ${targetVal})`}
                  active={teto === targetVal}
                  onToggle={() => applySalaryPercent(pct)}
                  className="justify-center"
                />
              );
            })}
          </div>
        </div>

        {/* Composição da casa e ciclo */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-ink-muted">
              Pessoas na casa
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <ToggleChip
                  key={n}
                  label={`${n}p`}
                  active={numPersons === n}
                  onToggle={() => setPersons(n)}
                  className="flex-1 justify-center px-2"
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-ink-muted">
              Ciclo de compra
            </span>
            <div className="flex items-center gap-1.5">
              <ToggleChip
                label="15d"
                active={profile.cycleDays === 15}
                onToggle={() => onUpdateProfile({ cycleDays: 15 })}
                className="flex-1 justify-center"
              />
              <ToggleChip
                label="30d"
                active={profile.cycleDays === 30}
                onToggle={() => onUpdateProfile({ cycleDays: 30 })}
                className="flex-1 justify-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Consultor Financeiro: Resultado em DOIS blocos claros (save-soft e warn-soft) */}
      <section className="bg-surface rounded-card shadow-card p-4 space-y-4">
        <SectionTitle
          title="Consultor do seu rancho"
          subtitle="Descubra o que dá pra levar agora e o que vale cortar caso o orçamento aperte"
        />

        <SecondaryButton
          onClick={onOpenAdvisor}
          disabled={isAnalyzingAdvisor}
        >
          {isAnalyzingAdvisor
            ? 'Analisando sua lista...'
            : `Avaliar minha lista atual (${shoppingList.length} ${
                shoppingList.length === 1 ? 'item' : 'itens'
              })`}
        </SecondaryButton>

        {isAnalyzingAdvisor && <SkeletonList count={2} />}

        {analysis && !isAnalyzingAdvisor && (
          <div className="space-y-3 pt-1">
            {/* Bloco 1: Dá pra levar (save-soft) */}
            <div className="bg-save-soft rounded-card p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-save shrink-0" />
                <h3 className="text-[15px] font-bold text-ink">
                  Dá pra levar ({analysis.canBuyItems.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.canBuyItems.map((it, idx) => (
                  <span
                    key={`inline-can-${idx}`}
                    className="bg-surface text-ink text-[12px] font-semibold px-3 py-1.5 rounded-pill tabular-nums"
                  >
                    {it.name} · R$ {Number(it.cost || 0).toFixed(2).replace('.', ',')}
                  </span>
                ))}
              </div>
            </div>

            {/* Bloco 2: Melhor deixar pra próxima (warn-soft) */}
            <div className="bg-warn-soft rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
                  <h3 className="text-[15px] font-bold text-ink">
                    Melhor deixar pra próxima ({analysis.cannotBuyItems.length})
                  </h3>
                </div>
              </div>

              {analysis.cannotBuyItems.length === 0 ? (
                <p className="text-[13px] text-ink-soft">
                  Nenhum item supérfluo encontrado na sua lista atual.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.cannotBuyItems.map((it, idx) => (
                      <span
                        key={`inline-cannot-${idx}`}
                        className="bg-surface text-ink text-[12px] font-semibold px-3 py-1.5 rounded-pill tabular-nums"
                      >
                        {it.name} · R$ {Number(it.cost || 0).toFixed(2).replace('.', ',')}
                      </span>
                    ))}
                  </div>
                  {onApplyCuts && (
                    <button
                      type="button"
                      onClick={() =>
                        onApplyCuts(analysis.cannotBuyItems.map((i) => i.name))
                      }
                      className="min-h-[44px] px-4 rounded-pill bg-brand text-white text-[13px] font-bold flex items-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      <Scissors className="w-4 h-4" />
                      <span>Cortar estes itens da lista</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Dicas diárias como cards horizontais roláveis */}
      {userProfile && (
        <DailyTipsCarousel
          shoppingList={shoppingList}
          history={history}
          profile={profile}
          userProfile={userProfile}
          currentTotal={totalRancho}
        />
      )}

      <PrimaryButton onClick={onNextStep}>Ir para ofertas de hoje</PrimaryButton>
    </div>
  );
};
