import React, { useState } from 'react';
import { PromotionItem } from '../types';
import { Plus, Store, Check } from 'lucide-react';
import { generateOrEstimateProduct } from '../utils/catalogueData';
import { SearchBar } from './ui/SearchBar';
import { PriceTag } from './ui/PriceTag';
import { SkeletonCard } from './ui/SkeletonCard';
import { ToggleChip } from './ui/ToggleChip';

interface ProductSearchAddProps {
  onAddCustomProduct: (item: PromotionItem) => void;
  cityName?: string;
}

const QUICK_SUGGESTIONS = [
  'Doritos',
  'Salgadinho',
  'Pizza Calabresa',
  'Bolacha Recheada',
  'Coca-Cola 2L',
  'Guaraná Fruki',
  'Arroz Parboilizado',
  'Feijão Preto',
  'Energético Monster',
];

export const ProductSearchAdd: React.FC<ProductSearchAddProps> = ({
  onAddCustomProduct,
  cityName,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<PromotionItem | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const executeSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    setIsSearching(true);
    setResult(null);
    setJustAdded(false);

    try {
      const res = await fetch('/api/search-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: term,
          city: cityName || 'Passo Fundo',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setResult(data.item);
          return;
        }
      }
      throw new Error('Busca local');
    } catch {
      const item = generateOrEstimateProduct(term, cityName || 'Passo Fundo');
      setResult(item);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = () => {
    if (result) {
      onAddCustomProduct(result);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  return (
    <div className="bg-surface rounded-card shadow-card p-4 space-y-3">
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold text-ink">
          Não achou na lista? Consulte outro produto
        </h3>
        <p className="text-[12px] font-medium text-ink-muted">
          Compare preços em {cityName || 'Passo Fundo'} e adicione direto ao seu rancho
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => executeSearch(query)}
            placeholder="Ex.: Azeite, Fralda, Queijo..."
          />
        </div>
        <button
          type="button"
          onClick={() => executeSearch(query)}
          disabled={isSearching || !query.trim()}
          className="min-h-[48px] px-4 rounded-pill bg-brand hover:bg-brand-hover text-white text-[14px] font-bold whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform disabled:opacity-45"
        >
          Buscar
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {QUICK_SUGGESTIONS.map((s) => (
          <ToggleChip
            key={s}
            label={s}
            active={query === s}
            onToggle={() => {
              setQuery(s);
              executeSearch(s);
            }}
          />
        ))}
      </div>

      {isSearching && <SkeletonCard heightClass="h-24" />}

      {result && !isSearching && (
        <div className="bg-field rounded-card p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink truncate">{result.name}</p>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft mt-0.5">
              <Store className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="truncate">Mais barato no {result.cheapestMarket}</span>
            </div>
            <div className="mt-1">
              <PriceTag value={result.lowestPrice} size="md" isLowest={true} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`min-h-[44px] px-4 rounded-pill text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-[0.98] transition-transform ${
              justAdded ? 'bg-save text-white' : 'bg-brand text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionado</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
