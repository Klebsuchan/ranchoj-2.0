import React from 'react';
import { MapPin, Wallet, BarChart3, User, LocateFixed } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { IconButton } from './IconButton';
import { RanchoJaLogo } from '../RanchoJaLogo';

export interface AppHeaderProps {
  locationLabel: string;
  onOpenLocation: () => void;
  onQuickGps?: () => void;
  isLocatingGps?: boolean;
  onLogoClick?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  activeTab?: string;
  onSelectSecondaryTab?: (tab: 'orcamento' | 'historico') => void;
  userAvatarUrl?: string;
  isUserConnected?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  locationLabel,
  onOpenLocation,
  onQuickGps,
  isLocatingGps = false,
  onLogoClick,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Buscar produto no rancho...',
  showSearch = true,
  activeTab,
  onSelectSecondaryTab,
  userAvatarUrl,
  isUserConnected = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur px-3 pt-[calc(env(safe-area-inset-top,0px)+6px)] pb-2 space-y-1.5 border-b border-slate-200/60">
      {/* Linha 1: Logo Oficial RanchoJá + LocationPill (Bairro/Cidade + GPS) + Atalhos Orçamento/Histórico/Perfil */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-1.5 min-w-0 shrink-0 text-left focus:outline-none active:scale-[0.98] transition-transform"
          aria-label="Início RanchoJá"
        >
          <RanchoJaLogo size="sm" showText={true} />
        </button>

        <div className="flex items-center gap-1 min-w-0">
          {/* LocationPill compacto com botão de GPS 1-toque */}
          <div className="flex items-center bg-surface shadow-card rounded-pill h-8 pl-2 pr-0.5 max-w-[148px] sm:max-w-[175px]">
            <button
              id="btn-abrir-perfil-usuario"
              type="button"
              onClick={onOpenLocation}
              className="flex items-center gap-1 text-[11px] font-semibold text-ink min-w-0 py-0.5 pr-1 active:scale-[0.98] transition-transform focus:outline-none"
              aria-label={`Localização atual: ${locationLabel}. Toque para alterar`}
            >
              <MapPin className="w-3 h-3 text-brand shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </button>
            {onQuickGps && (
              <button
                type="button"
                onClick={onQuickGps}
                disabled={isLocatingGps}
                title="Detectar minha localização atual por GPS"
                aria-label="Detectar minha localização atual por GPS"
                className="w-6 h-6 rounded-full bg-field hover:bg-brand-soft text-brand flex items-center justify-center shrink-0 active:scale-[0.95] transition-transform disabled:opacity-50"
              >
                <LocateFixed className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {onSelectSecondaryTab && (
            <>
              <button
                id="btn-header-orcamento"
                type="button"
                aria-label="Planejamento de orçamento e consultor"
                onClick={() => onSelectSecondaryTab('orcamento')}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === 'orcamento'
                    ? 'bg-brand text-white'
                    : 'bg-surface shadow-card text-ink-soft hover:text-ink'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </button>
              <button
                id="btn-header-historico"
                type="button"
                aria-label="Histórico mensal de compras"
                onClick={() => onSelectSecondaryTab('historico')}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === 'historico'
                    ? 'bg-brand text-white'
                    : 'bg-surface shadow-card text-ink-soft hover:text-ink'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenLocation}
            aria-label="Abrir perfil e conta Google"
            className="w-8 h-8 rounded-full bg-surface shadow-card flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform focus:outline-none overflow-hidden"
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="Foto do perfil"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={`w-4 h-4 ${isUserConnected ? 'text-save' : 'text-ink-soft'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Linha 2: SearchBar contextual compacta */}
      {showSearch && onSearchChange && (
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
          placeholder={searchPlaceholder}
        />
      )}
    </header>
  );
};
