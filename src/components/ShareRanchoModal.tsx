import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingListItem } from '../types';
import { Copy, Check, MessageCircle, Link2, FileDown } from 'lucide-react';
import {
  formatRanchoForSharing,
  encodeRanchoToUrl,
  copyTextToClipboard,
  createShortShareLink,
} from '../utils/shareRancho';
import { generateRanchoPdf } from '../utils/generateRanchoPdf';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { ToggleChip } from './ui/ToggleChip';

interface ShareRanchoModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingListItem[];
  budgetLimit?: number;
  householdType?: 'solo' | 'casal';
  neighborhood?: string;
  cityName?: string;
}

export const ShareRanchoModal: React.FC<ShareRanchoModalProps> = ({
  isOpen,
  onClose,
  items,
  budgetLimit = 450,
  householdType = 'solo',
  neighborhood = 'Passo Fundo - RS',
  cityName = 'Passo Fundo',
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [includePrices, setIncludePrices] = useState(true);
  const [includeStores, setIncludeStores] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);
  const [includeOnlyPending, setIncludeOnlyPending] = useState(false);
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);

  const fallbackShareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const shareCode = encodeRanchoToUrl(items, budgetLimit, householdType);
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?share_rancho=${shareCode}`;
  }, [items, budgetLimit, householdType]);

  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    let isMounted = true;
    setIsGeneratingShortUrl(true);

    createShortShareLink(items, budgetLimit, householdType, cityName || neighborhood)
      .then((res) => {
        if (isMounted) {
          setShortUrl(res.shortUrl);
          setIsGeneratingShortUrl(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setShortUrl(fallbackShareUrl);
          setIsGeneratingShortUrl(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, items, budgetLimit, householdType, cityName, neighborhood, fallbackShareUrl]);

  const activeShareUrl = shortUrl || fallbackShareUrl;

  const formattedText = useMemo(() => {
    return formatRanchoForSharing({
      items,
      budgetLimit,
      householdType,
      neighborhood: cityName || neighborhood,
      includePrices,
      includeStores,
      includeOnlyPending,
      shareUrl: includeLink ? activeShareUrl : undefined,
    });
  }, [
    items,
    budgetLimit,
    householdType,
    cityName,
    neighborhood,
    includePrices,
    includeStores,
    includeOnlyPending,
    includeLink,
    activeShareUrl,
  ]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    const ok = await copyTextToClipboard(formattedText);
    if (ok) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(activeShareUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleExportPdf = () => {
    generateRanchoPdf({
      items,
      budgetLimit,
      householdType,
      neighborhood,
      cityName,
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Compartilhar lista"
      subtitle={`${items.length} ${items.length === 1 ? 'item' : 'itens'} prontos para enviar`}
      footer={
        <div className="space-y-2">
          <PrimaryButton
            onClick={handleCopyText}
            icon={copiedText ? <Check className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          >
            {copiedText ? 'Lista copiada para colar no WhatsApp' : 'Copiar lista para WhatsApp'}
          </PrimaryButton>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton
              onClick={handleCopyLink}
              icon={copiedLink ? <Check className="w-4 h-4 text-save" /> : <Link2 className="w-4 h-4" />}
            >
              {copiedLink ? 'Link copiado' : 'Copiar link'}
            </SecondaryButton>
            <SecondaryButton
              onClick={handleExportPdf}
              icon={<FileDown className="w-4 h-4" />}
            >
              Baixar PDF
            </SecondaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Link curto */}
        <div className="bg-field rounded-card p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-ink-muted">
              Link para abrir a lista em outro celular
            </span>
            {isGeneratingShortUrl && (
              <span className="text-[11px] font-medium text-ink-muted">Gerando link...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={activeShareUrl}
              className="flex-1 min-h-[44px] px-3 rounded-field bg-surface text-ink text-[13px] font-medium truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[44px] px-4 rounded-pill bg-ink text-white text-[13px] font-semibold shrink-0 active:scale-[0.98] transition-transform flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Opções */}
        <div className="space-y-2">
          <span className="text-[12px] font-medium text-ink-muted">Incluir no resumo</span>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              label="Preços"
              active={includePrices}
              onToggle={() => setIncludePrices(!includePrices)}
            />
            <ToggleChip
              label="Mercados"
              active={includeStores}
              onToggle={() => setIncludeStores(!includeStores)}
            />
            <ToggleChip
              label="Link clicável"
              active={includeLink}
              onToggle={() => setIncludeLink(!includeLink)}
            />
            <ToggleChip
              label="Só pendentes"
              active={includeOnlyPending}
              onToggle={() => setIncludeOnlyPending(!includeOnlyPending)}
            />
          </div>
        </div>

        {/* Prévia */}
        <div className="space-y-1.5">
          <span className="text-[12px] font-medium text-ink-muted">Prévia da mensagem</span>
          <pre className="bg-field rounded-card p-3.5 text-[12px] font-sans text-ink-soft whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
            {formattedText}
          </pre>
        </div>
      </div>
    </BottomSheet>
  );
};
