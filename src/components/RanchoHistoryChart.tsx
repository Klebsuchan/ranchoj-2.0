import React, { useState, useMemo } from 'react';
import { RanchoHistoryEntry } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { Trash2, Plus } from 'lucide-react';
import { StatPill } from './ui/StatPill';
import { SectionTitle } from './ui/SectionTitle';
import { PriceTag } from './ui/PriceTag';
import { EconomyBadge } from './ui/EconomyBadge';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { BottomSheet } from './ui/BottomSheet';

interface RanchoHistoryChartProps {
  history: RanchoHistoryEntry[];
  onSaveCurrentRancho: (monthYear: string, notes?: string) => void;
  onDeleteEntry: (id: string) => void;
  currentRanchoTotal: number;
  currentBudgetLimit: number;
  currentItemsCount: number;
}

export const RanchoHistoryChart: React.FC<RanchoHistoryChartProps> = ({
  history,
  onSaveCurrentRancho,
  onDeleteEntry,
  currentRanchoTotal,
  currentBudgetLimit,
  currentItemsCount,
}) => {
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const now = new Date();
    return `${months[now.getMonth()]}/${now.getFullYear()}`;
  });
  const [notes, setNotes] = useState('');

  const avgSpent =
    history.length > 0
      ? history.reduce((acc, h) => acc + h.totalSpent, 0) / history.length
      : 0;

  const totalSavedAcrossMonths = history.reduce(
    (acc, h) => acc + (h.savingsAchieved || 0),
    0
  );

  // Dados para o gráfico de barras horizontais por rede (média histórica)
  const marketAverageData = useMemo(() => {
    if (history.length === 0) return [];
    let stok = 0;
    let atacadao = 0;
    let zaffari = 0;
    let bourbon = 0;
    let count = 0;

    history.forEach((h) => {
      if (h.stokCenterTotal) {
        stok += h.stokCenterTotal;
        atacadao += h.atacadaoTotal || h.stokCenterTotal * 1.03;
        zaffari += h.zaffariTotal || h.stokCenterTotal * 1.14;
        bourbon += h.bourbonTotal || h.stokCenterTotal * 1.18;
        count += 1;
      }
    });

    if (count === 0) return [];
    return [
      { market: 'Stock Center', total: Math.round(stok / count) },
      { market: 'Atacadão', total: Math.round(atacadao / count) },
      { market: 'Zaffari', total: Math.round(zaffari / count) },
      { market: 'Bourbon', total: Math.round(bourbon / count) },
    ];
  }, [history]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth.trim()) return;
    onSaveCurrentRancho(selectedMonth.trim(), notes.trim());
    setNotes('');
    setIsSaveSheetOpen(false);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: RanchoHistoryEntry }[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ink text-white p-3 rounded-field shadow-float text-[12px] space-y-1 tabular-nums">
          <p className="font-bold">{label}</p>
          <p>Gasto: R$ {data.totalSpent.toFixed(2).replace('.', ',')}</p>
          <p className="text-white/75">
            Teto: R$ {data.budgetLimit.toFixed(2).replace('.', ',')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Resumo superior */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill
          label="Média por mês"
          value={`R$ ${avgSpent.toFixed(2).replace('.', ',')}`}
        />
        <StatPill
          label="Economia acumulada"
          value={`R$ ${totalSavedAcrossMonths.toFixed(2).replace('.', ',')}`}
          tone="save"
        />
      </div>

      {/* 1. Gráfico Recharts de evolução mensal: linha única suave */}
      <section className="bg-surface rounded-card shadow-card p-4 space-y-3">
        <SectionTitle
          title="Evolução mensal"
          subtitle="Seu gasto mês a mês no supermercado"
        />

        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="monthYear"
                tick={{ fontSize: 11, fill: '#546e7a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#546e7a' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="totalSpent"
                stroke="var(--color-brand)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-brand)', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. Comparativo por rede como barras horizontais */}
      {marketAverageData.length > 0 && (
        <section className="bg-surface rounded-card shadow-card p-4 space-y-3">
          <SectionTitle
            title="Custo médio por rede"
            subtitle="Quanto sua cesta média custou em cada supermercado"
          />

          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={marketAverageData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#546e7a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="market"
                  width={90}
                  tick={{ fontSize: 12, fill: '#263238', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-brand)"
                  radius={[0, 8, 8, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 3. Lista de meses em cards individuais */}
      <section className="space-y-3">
        <SectionTitle
          title="Meses registrados"
          subtitle={`${history.length} compras salvas`}
          actionLabel="Salvar compra atual"
          onAction={() => setIsSaveSheetOpen(true)}
        />

        <div className="space-y-3">
          {[...history].reverse().map((entry) => {
            const fitsBudget = entry.totalSpent <= entry.budgetLimit;
            return (
              <div
                key={entry.id}
                className="bg-surface rounded-card shadow-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">
                      {entry.monthYear}
                    </h3>
                    <p className="text-[12px] font-medium text-ink-muted tabular-nums mt-0.5">
                      {entry.itemCount} itens · Teto R${' '}
                      {entry.budgetLimit.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <PriceTag
                      value={entry.totalSpent}
                      size="md"
                      isLowest={fitsBudget}
                    />
                    {entry.savingsAchieved && entry.savingsAchieved > 0 && (
                      <div>
                        <EconomyBadge
                          label={`Economizou R$ ${entry.savingsAchieved
                            .toFixed(0)}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {entry.notes && (
                  <p className="text-[13px] text-ink-soft pt-1 border-t border-slate-100">
                    {entry.notes}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    aria-label={`Excluir registro de ${entry.monthYear}`}
                    className="min-h-[44px] px-3 rounded-pill text-[12px] font-semibold text-ink-muted hover:text-danger flex items-center gap-1 active:scale-[0.98] transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SecondaryButton
        onClick={() => setIsSaveSheetOpen(true)}
        icon={<Plus className="w-4 h-4" />}
      >
        Registrar carrinho atual no histórico (R${' '}
        {currentRanchoTotal.toFixed(2).replace('.', ',')})
      </SecondaryButton>

      {/* BottomSheet para salvar compra atual */}
      <BottomSheet
        isOpen={isSaveSheetOpen}
        onClose={() => setIsSaveSheetOpen(false)}
        title="Salvar compra no histórico"
        subtitle={`${currentItemsCount} itens · Total R$ ${currentRanchoTotal
          .toFixed(2)
          .replace('.', ',')} (Teto R$ ${currentBudgetLimit.toFixed(2).replace('.', ',')})`}
        footer={
          <PrimaryButton onClick={handleSave}>Salvar mês no histórico</PrimaryButton>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Mês e ano de referência
            </label>
            <input
              type="text"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              placeholder="Ex.: Out/2026"
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Feira comprada no Stok Center"
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
