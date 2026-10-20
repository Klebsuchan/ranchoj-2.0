import React from 'react';
import { Store, Zap, Layers, ShoppingCart, MapPin } from 'lucide-react';

export type MainTabId = 'promocoes' | 'rancho' | 'comparador' | 'carrinho' | 'mapa' | 'orcamento' | 'historico';

export interface BottomNavProps {
  activeTab: MainTabId;
  onSelectTab: (tab: MainTabId) => void;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount = 0,
}) => {
  const tabs: { id: MainTabId; label: string; icon: React.ReactNode; buttonId: string }[] = [
    {
      id: 'promocoes',
      label: 'Ofertas',
      icon: <Store className="w-[22px] h-[22px]" />,
      buttonId: 'mobile-nav-promocoes',
    },
    {
      id: 'rancho',
      label: 'Rancho',
      icon: <Zap className="w-[22px] h-[22px]" />,
      buttonId: 'mobile-nav-rancho',
    },
    {
      id: 'comparador',
      label: 'Comparar',
      icon: <Layers className="w-[22px] h-[22px]" />,
      buttonId: 'mobile-nav-comparador',
    },
    {
      id: 'carrinho',
      label: 'Carrinho',
      icon: <ShoppingCart className="w-[22px] h-[22px]" />,
      buttonId: 'mobile-nav-carrinho',
    },
    {
      id: 'mapa',
      label: 'Mercados',
      icon: <MapPin className="w-[22px] h-[22px]" />,
      buttonId: 'mobile-nav-mapa',
    },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface shadow-nav pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={tab.buttonId}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[60px] relative flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                isActive ? 'text-brand font-bold' : 'text-ink-muted font-medium hover:text-ink-soft'
              }`}
            >
              {/* Indicador de 4px no topo quando ativo */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-pill bg-brand" />
              )}

              <div className="relative">
                {tab.icon}
                {tab.id === 'carrinho' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-brand text-white text-[10px] font-bold tabular-nums min-w-[18px] h-[18px] px-1 rounded-pill flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>

              <span className="text-[11px] whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
