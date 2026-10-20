import React from 'react';
import { BudgetAnalysis } from '../types';
import { CheckCircle2, AlertTriangle, Scissors } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { SkeletonList } from './ui/SkeletonList';
import { ProgressBar } from './ui/ProgressBar';

interface BudgetAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: BudgetAnalysis | null;
  isLoading: boolean;
  onApplyCuts: (itemNamesToRemove: string[]) => void;
}

export const BudgetAdvisorModal: React.FC<BudgetAdvisorModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onApplyCuts,
}) => {
  if (!isOpen) return null;

  const handleCutAll = () => {
    if (!analysis || !analysis.cannotBuyItems) return;
    const names = analysis.cannotBuyItems.map((i) => i.name);
    onApplyCuts(names);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Consultor de orçamento"
      subtitle="Veja o que cabe no seu teto deste mês e o que vale deixar para depois"
      footer={
        analysis && analysis.cannotBuyItems.length > 0 ? (
          <div className="space-y-2">
            <PrimaryButton
              onClick={handleCutAll}
              icon={<Scissors className="w-4 h-4" />}
            >
              Retirar {analysis.cannotBuyItems.length}{' '}
              {analysis.cannotBuyItems.length === 1 ? 'item não prioritário' : 'itens não prioritários'}
            </PrimaryButton>
            <SecondaryButton onClick={onClose}>Manter lista como está</SecondaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={onClose}>Entendi</PrimaryButton>
        )
      }
    >
      {isLoading ? (
        <SkeletonList count={3} />
      ) : !analysis ? (
        <p className="text-[14px] text-ink-soft text-center py-8">
          Adicione itens à sua lista para analisar seu orçamento.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Barra de uso do orçamento */}
          <div className="bg-field rounded-card p-4 space-y-2">
            <ProgressBar current={analysis.totalCost} limit={analysis.ranchoBudget} />
          </div>

          {/* Bloco 1: Dá pra levar (save-soft) */}
          <div className="bg-save-soft rounded-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-save shrink-0" />
                <h3 className="text-[15px] font-bold text-ink">
                  Dá pra levar ({analysis.canBuyItems.length})
                </h3>
              </div>
              <span className="text-[12px] font-semibold text-save">Prioridade do mês</span>
            </div>

            {analysis.canBuyItems.length === 0 ? (
              <p className="text-[13px] text-ink-soft">Nenhum item essencial listado.</p>
            ) : (
              <div className="space-y-2">
                {analysis.canBuyItems.map((item, idx) => (
                  <div
                    key={`can-${idx}`}
                    className="bg-surface rounded-field p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{item.name}</p>
                      <p className="text-[12px] text-ink-soft truncate">{item.reason}</p>
                    </div>
                    <span className="text-[14px] font-bold text-ink tabular-nums shrink-0">
                      R$ {Number(item.cost || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                Tudo certo! Sua lista só tem itens que cabem no orçamento.
              </p>
            ) : (
              <div className="space-y-2">
                {analysis.cannotBuyItems.map((item, idx) => (
                  <div
                    key={`cannot-${idx}`}
                    className="bg-surface rounded-field p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-semibold text-ink truncate">{item.name}</p>
                      <span className="text-[14px] font-bold text-danger tabular-nums shrink-0">
                        R$ {Number(item.cost || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-soft">{item.reason}</p>
                    {item.substitute && (
                      <p className="text-[12px] font-semibold text-save">
                        Sugestão: {item.substitute}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
