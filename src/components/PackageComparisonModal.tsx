import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { compareTwoPackages, PackageComparisonResult } from '../utils/unitPriceCalculator';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { ToggleChip } from './ui/ToggleChip';

interface PackageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  initialAmountA?: number;
  initialUnitA?: 'kg' | 'g' | 'L' | 'ml' | 'un';
  initialPriceA?: number;
}

export const PackageComparisonModal: React.FC<PackageComparisonModalProps> = ({
  isOpen,
  onClose,
  initialProductName = 'Arroz Branco',
  initialAmountA = 5,
  initialUnitA = 'kg',
  initialPriceA = 24.9,
}) => {
  const [productName, setProductName] = useState(initialProductName);
  const [amountA, setAmountA] = useState<number>(initialAmountA);
  const [unitA, setUnitA] = useState<'kg' | 'g' | 'L' | 'ml' | 'un'>(initialUnitA);
  const [priceA, setPriceA] = useState<number>(initialPriceA);

  const [amountB, setAmountB] = useState<number>(1);
  const [unitB, setUnitB] = useState<'kg' | 'g' | 'L' | 'ml' | 'un'>('kg');
  const [priceB, setPriceB] = useState<number>(6.29);

  useEffect(() => {
    if (isOpen) {
      setProductName(initialProductName);
      setAmountA(initialAmountA);
      setUnitA(initialUnitA);
      setPriceA(initialPriceA);
    }
  }, [isOpen, initialProductName, initialAmountA, initialUnitA, initialPriceA]);

  if (!isOpen) return null;

  const result: PackageComparisonResult = compareTwoPackages(
    amountA,
    unitA,
    priceA,
    amountB,
    unitB,
    priceB
  );

  const presets: {
    name: string;
    amtA: number;
    uA: 'kg' | 'g' | 'L' | 'ml' | 'un';
    pA: number;
    amtB: number;
    uB: 'kg' | 'g' | 'L' | 'ml' | 'un';
    pB: number;
  }[] = [
    { name: 'Arroz (5kg vs 1kg)', amtA: 5, uA: 'kg', pA: 24.9, amtB: 1, uB: 'kg', pB: 6.29 },
    { name: 'Sabão em Pó (4kg vs 1kg)', amtA: 4, uA: 'kg', pA: 49.9, amtB: 1, uB: 'kg', pB: 14.5 },
    { name: 'Ovos (30 un vs 12 un)', amtA: 30, uA: 'un', pA: 16.9, amtB: 12, uB: 'un', pB: 9.49 },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Comparador de Embalagens"
      subtitle="Descubra qual tamanho tem o menor preço real por quilo, litro ou unidade"
      footer={<PrimaryButton onClick={onClose}>Concluir</PrimaryButton>}
    >
      <div className="space-y-4">
        {/* Presets rápidos */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {presets.map((p) => (
            <ToggleChip
              key={p.name}
              label={p.name}
              active={productName === p.name}
              onToggle={() => {
                setProductName(p.name);
                setAmountA(p.amtA);
                setUnitA(p.uA);
                setPriceA(p.pA);
                setAmountB(p.amtB);
                setUnitB(p.uB);
                setPriceB(p.pB);
              }}
            />
          ))}
        </div>

        {/* Embalagem A */}
        <div className="bg-field rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-ink">Embalagem A</span>
            {result.cheaperOption === 'A' && (
              <span className="bg-save-soft text-save text-[11px] font-bold px-2.5 py-0.5 rounded-pill">
                Mais barata
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Qtd/Peso</label>
              <input
                type="number"
                step="any"
                value={amountA}
                onChange={(e) => setAmountA(Math.max(0.01, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Medida</label>
              <select
                value={unitA}
                onChange={(e) => setUnitA(e.target.value as 'kg' | 'g' | 'L' | 'ml' | 'un')}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="un">un</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={priceA}
                onChange={(e) => setPriceA(Math.max(0.01, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>
          </div>
          <p className="text-[12px] font-medium text-ink-soft tabular-nums">
            Custo real:{' '}
            <strong className="text-ink">
              R$ {result.pricePerUnitA.toFixed(2).replace('.', ',')} / {result.standardUnit}
            </strong>
          </p>
        </div>

        {/* Embalagem B */}
        <div className="bg-field rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-ink">Embalagem B</span>
            {result.cheaperOption === 'B' && (
              <span className="bg-save-soft text-save text-[11px] font-bold px-2.5 py-0.5 rounded-pill">
                Mais barata
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Qtd/Peso</label>
              <input
                type="number"
                step="any"
                value={amountB}
                onChange={(e) => setAmountB(Math.max(0.01, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Medida</label>
              <select
                value={unitB}
                onChange={(e) => setUnitB(e.target.value as 'kg' | 'g' | 'L' | 'ml' | 'un')}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="un">un</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={priceB}
                onChange={(e) => setPriceB(Math.max(0.01, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-field bg-surface text-ink font-semibold text-[16px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>
          </div>
          <p className="text-[12px] font-medium text-ink-soft tabular-nums">
            Custo real:{' '}
            <strong className="text-ink">
              R$ {result.pricePerUnitB.toFixed(2).replace('.', ',')} / {result.standardUnit}
            </strong>
          </p>
        </div>

        {/* Resultado */}
        <div className="rounded-card p-4 flex items-start gap-3 bg-save-soft text-ink">
          <CheckCircle2 className="w-5 h-5 text-save shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[15px] font-semibold text-ink">
              {result.cheaperOption === 'EQUAL'
                ? 'As duas embalagens têm o mesmo custo proporcional'
                : `A Embalagem ${result.cheaperOption} economiza ${result.savingsPercent}%`}
            </p>
            <p className="text-[14px] text-ink-soft leading-snug">{result.recommendation}</p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
