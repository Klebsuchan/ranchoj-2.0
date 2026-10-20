import React, { useState, useEffect } from 'react';
import { PromotionItem, PriceAlert } from '../types';
import { Trash2, Store } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { ToggleChip } from './ui/ToggleChip';
import { PriceTag } from './ui/PriceTag';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PromotionItem | null;
  existingAlert?: PriceAlert;
  onSaveAlert: (item: PromotionItem, targetPrice: number) => void;
  onRemoveAlert: (itemId: string) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  item,
  existingAlert,
  onSaveAlert,
  onRemoveAlert,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      if (existingAlert) {
        setTargetPrice(existingAlert.targetPrice.toFixed(2));
      } else {
        const def = (item.lowestPrice * 0.9).toFixed(2);
        setTargetPrice(def);
      }
      setError(null);
    }
  }, [item, existingAlert]);

  if (!isOpen || !item) return null;

  const currentPrice = item.lowestPrice;

  const applyDiscount = (percent: number) => {
    const calculated = (currentPrice * (1 - percent / 100)).toFixed(2);
    setTargetPrice(calculated);
    setError(null);
  };

  const handleSave = () => {
    const parsed = parseFloat(targetPrice.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Informe um valor em R$ válido maior que zero.');
      return;
    }
    if (parsed > currentPrice * 1.5) {
      setError(`O valor não pode ser muito maior que o preço atual (R$ ${currentPrice.toFixed(2)}).`);
      return;
    }
    onSaveAlert(item, parsed);
    onClose();
  };

  const handleRemove = () => {
    onRemoveAlert(item.id);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Alerta de preço"
      subtitle="Avise quando este produto atingir o valor que você quer pagar"
      footer={
        <div className="space-y-2">
          <PrimaryButton onClick={handleSave}>Salvar meta de preço</PrimaryButton>
          {existingAlert && (
            <SecondaryButton
              onClick={handleRemove}
              icon={<Trash2 className="w-4 h-4 text-danger" />}
            >
              Remover alerta atual
            </SecondaryButton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-field rounded-card p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-[15px] font-semibold text-ink truncate">{item.name}</h4>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft mt-0.5">
              <Store className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>Menor hoje no {item.cheapestMarket}</span>
            </div>
          </div>
          <PriceTag value={currentPrice} size="md" isLowest={true} />
        </div>

        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-ink">
            Qual o preço máximo que você quer pagar (R$)?
          </label>
          <input
            type="number"
            step="0.01"
            value={targetPrice}
            onChange={(e) => {
              setTargetPrice(e.target.value);
              setError(null);
            }}
            className="w-full min-h-[52px] px-4 rounded-field bg-field text-ink text-[22px] font-extrabold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />

          <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
            {[5, 10, 15, 20].map((pct) => {
              const val = (currentPrice * (1 - pct / 100)).toFixed(2);
              return (
                <ToggleChip
                  key={pct}
                  label={`−${pct}% (R$ ${val.replace('.', ',')})`}
                  active={targetPrice === val}
                  onToggle={() => applyDiscount(pct)}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-[12px] font-medium text-danger pt-1">{error}</p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
