import React, { useState, useEffect, useMemo } from 'react';
import {
  BudgetProfile,
  PromotionItem,
  ShoppingListItem,
  SupermarketName,
  BudgetAnalysis,
  RanchoHistoryEntry,
  UserProfile,
  PassoFundoNeighborhood,
} from './types';
import { PromotionsTable } from './components/PromotionsTable';
import { MarketComparisonSummary } from './components/MarketComparisonSummary';
import { SingleMarketShoppingMode } from './components/SingleMarketShoppingMode';
import { ShareRanchoModal } from './components/ShareRanchoModal';
import { BudgetAdvisorModal } from './components/BudgetAdvisorModal';
import { RanchoHistoryChart } from './components/RanchoHistoryChart';
import { PassoFundoMap } from './components/PassoFundoMap';
import { UserProfileModal } from './components/UserProfileModal';
import { BudgetStepView } from './components/BudgetStepView';
import { RanchoProntoSelector } from './components/RanchoProntoSelector';
import { initFirebaseAuthListener, cleanAvatarUrl } from './utils/googleAuth';
import {
  PASSO_FUNDO_NEIGHBORHOODS,
  getAllPassoFundoStores,
  reverseGeocodeLocation,
} from './utils/passoFundoLocations';
import { ProductSubstitute } from './utils/productSubstitutes';
import { getDefaultPromotionsCatalogue } from './utils/catalogueData';
import { filterAndNormalizeActivePromotions } from './utils/productImages';
import { decodeRanchoFromUrl, fetchShortRancho } from './utils/shareRancho';
import { generateRanchoPdf } from './utils/generateRanchoPdf';
import { updateDynamicSeo } from './utils/seoManager';
import { Layers } from 'lucide-react';
import { AppHeader } from './components/ui/AppHeader';
import { BottomNav, MainTabId } from './components/ui/BottomNav';
import { PageScaffold } from './components/ui/PageScaffold';
import { Toast } from './components/ui/Toast';
import { BottomSheet } from './components/ui/BottomSheet';
import { PrimaryButton } from './components/ui/PrimaryButton';
import { SecondaryButton } from './components/ui/SecondaryButton';
import { EmptyState } from './components/ui/EmptyState';

const DEFAULT_PROFILE: BudgetProfile = {
  householdType: 'solo',
  monthlyIncome: 1800,
  ranchoBudget: 450,
  cycleDays: 30,
};

const INITIAL_HISTORY: RanchoHistoryEntry[] = [
  {
    id: 'hist-1',
    monthYear: 'Mai/2026',
    date: '2026-05-28',
    totalSpent: 420.5,
    budgetLimit: 450.0,
    itemCount: 16,
    householdType: 'solo',
    stokCenterTotal: 420.5,
    atacadaoTotal: 435.2,
    zaffariTotal: 478.9,
    bourbonTotal: 495.0,
    savingsAchieved: 74.5,
    notes: 'Rancho focado no Stok Center (feira e cesta básica)',
  },
  {
    id: 'hist-2',
    monthYear: 'Jun/2026',
    date: '2026-06-25',
    totalSpent: 445.8,
    budgetLimit: 450.0,
    itemCount: 18,
    householdType: 'solo',
    stokCenterTotal: 445.8,
    atacadaoTotal: 452.0,
    zaffariTotal: 512.4,
    bourbonTotal: 530.0,
    savingsAchieved: 84.2,
    notes: 'Quase no limite, cortou refrigerante e doces supérfluos',
  },
  {
    id: 'hist-3',
    monthYear: 'Jul/2026',
    date: '2026-07-27',
    totalSpent: 398.2,
    budgetLimit: 450.0,
    itemCount: 15,
    householdType: 'solo',
    stokCenterTotal: 398.2,
    atacadaoTotal: 410.5,
    zaffariTotal: 460.0,
    bourbonTotal: 482.3,
    savingsAchieved: 84.1,
    notes: 'Aproveitou feirão de ovos e frango do Atacadão e Stok',
  },
  {
    id: 'hist-4',
    monthYear: 'Ago/2026',
    date: '2026-08-26',
    totalSpent: 438.9,
    budgetLimit: 450.0,
    itemCount: 17,
    householdType: 'solo',
    stokCenterTotal: 438.9,
    atacadaoTotal: 446.7,
    zaffariTotal: 504.1,
    bourbonTotal: 525.6,
    savingsAchieved: 86.7,
    notes: 'Compras divididas entre Stok e Atacadão Passo Fundo',
  },
  {
    id: 'hist-5',
    monthYear: 'Set/2026',
    date: '2026-09-20',
    totalSpent: 412.3,
    budgetLimit: 450.0,
    itemCount: 16,
    householdType: 'solo',
    stokCenterTotal: 412.3,
    atacadaoTotal: 425.0,
    zaffariTotal: 479.5,
    bourbonTotal: 498.9,
    savingsAchieved: 86.6,
    notes: 'Rancho econômico de setembro dentro do teto',
  },
];

export default function App() {
  // 1. Profile State with LocalStorage
  const [profile, setProfile] = useState<BudgetProfile>(() => {
    try {
      const saved = localStorage.getItem('pf_rancho_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PROFILE;
  });

  // 2. Shopping List State with LocalStorage
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
      const saved = localStorage.getItem('pf_rancho_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 3. History State with LocalStorage
  const [history, setHistory] = useState<RanchoHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('pf_rancho_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HISTORY;
  });

  // 4. User Profile & Geolocation State with Google Sync (padrão Centro · Passo Fundo + GPS Brasil)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedGoogle = localStorage.getItem('ranchoja_google_user');
      if (savedGoogle) {
        const gu = JSON.parse(savedGoogle);
        if (gu.email === 'braian.kleber.camargo@gmail.com' || gu.name === 'Braian Camargo') {
          localStorage.removeItem('ranchoja_google_user');
        } else {
          return {
            id: gu.id,
            name: gu.name,
            email: gu.email,
            avatarUrl: cleanAvatarUrl(gu.photoUrl),
            isConnectedWithGoogle: true,
            connectedAt: gu.signedInAt,
            neighborhood: 'Centro',
            city: 'Passo Fundo',
            coordinates: { lat: -28.2628, lng: -52.4083 },
            locationMode: 'gps',
            radiusKm: 5,
          };
        }
      }
      const saved = localStorage.getItem('pf_rancho_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.email === 'braian.kleber.camargo@gmail.com' ||
          parsed.name === 'Braian Camargo'
        ) {
          parsed.name = '';
          parsed.email = '';
          parsed.isConnectedWithGoogle = false;
          parsed.avatarUrl = undefined;
        }
        // Migrate old hardcoded Boqueirão default to Centro if not explicitly chosen
        if (
          parsed.neighborhood === 'Boqueirão' &&
          parsed.coordinates?.lat === -28.2685 &&
          parsed.coordinates?.lng === -52.431
        ) {
          parsed.neighborhood = 'Centro';
          parsed.coordinates = { lat: -28.2628, lng: -52.4083 };
        }
        localStorage.setItem('pf_rancho_user_profile', JSON.stringify(parsed));
        parsed.avatarUrl = cleanAvatarUrl(parsed.avatarUrl);
        return parsed;
      }
    } catch {}
    return {
      id: 'user-default',
      name: '',
      email: '',
      isConnectedWithGoogle: false,
      neighborhood: 'Centro',
      city: 'Passo Fundo',
      coordinates: { lat: -28.2628, lng: -52.4083 },
      locationMode: 'gps',
      connectedAt: 'Hoje',
      radiusKm: 5,
    };
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const handleQuickGpsDetect = (silent = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) showToast('GPS não disponível neste dispositivo.', 'warning');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocodeLocation(latitude, longitude);
          const nextCity = geo.city || 'Passo Fundo';
          const nextNeighborhood = geo.neighborhood || 'Centro';
          setUserProfile((prev) => ({
            ...prev,
            city: nextCity,
            neighborhood: nextNeighborhood,
            coordinates: { lat: latitude, lng: longitude },
            locationMode: 'gps',
          }));
          if (!silent) {
            showToast(`Localização atualizada: ${nextNeighborhood} · ${nextCity}`, 'success');
          }
        } catch {
          // keep current
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => {
        setIsLocatingGps(false);
        if (!silent) {
          setIsProfileModalOpen(true);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Auto-detect real user GPS location on mount
  useEffect(() => {
    handleQuickGpsDetect(true);
  }, []);

  // Sync Google Auth and Firebase Auth changes
  useEffect(() => {
    const unsubscribeFirebase = initFirebaseAuthListener((user) => {
      if (user) {
        setUserProfile((prev) => ({
          ...prev,
          id: user.id,
          isConnectedWithGoogle: true,
          name: user.name,
          email: user.email,
          avatarUrl: cleanAvatarUrl(user.photoUrl),
          connectedAt: user.signedInAt,
        }));
      } else {
        setUserProfile((prev) => ({
          ...prev,
          isConnectedWithGoogle: false,
          avatarUrl: undefined,
        }));
      }
    });

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const user = customEvent.detail;
      if (user) {
        setUserProfile((prev) => ({
          ...prev,
          id: user.id || prev.id,
          isConnectedWithGoogle: true,
          name: user.name,
          email: user.email,
          avatarUrl: cleanAvatarUrl(user.photoUrl),
          connectedAt: user.signedInAt,
        }));
      } else {
        setUserProfile((prev) => ({
          ...prev,
          isConnectedWithGoogle: false,
          avatarUrl: undefined,
        }));
      }
    };

    window.addEventListener('ranchoja_auth_change', handleAuthChange);
    return () => {
      unsubscribeFirebase();
      window.removeEventListener('ranchoja_auth_change', handleAuthChange);
    };
  }, []);

  // 5. Promotions Data State
  const [promotions, setPromotions] = useState<PromotionItem[]>(() =>
    getDefaultPromotionsCatalogue()
  );
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([
    { title: 'Stok Center Passo Fundo (Boqueirão/Petrópolis)', uri: 'https://stokcenter.com.br' },
    { title: 'Supermercado Boqueirão (Passo Fundo)', uri: 'https://supermercadoboqueirao.com.br' },
    { title: 'Atacadão Passo Fundo (BR-285)', uri: 'https://atacadao.com.br' },
    { title: 'Bourbon & Zaffari Passo Fundo', uri: 'https://zaffari.com.br' },
  ]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Preços atualizados');
  const [activeTab, setActiveTab] = useState<MainTabId>('promocoes');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('all');
  const [cartMarketMode, setCartMarketMode] = useState<'best' | string>('best');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');

  // 6. Budget Advisor State
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isAnalyzingBudget, setIsAnalyzingBudget] = useState(false);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);

  // 7. Shared Link Import & Modal State
  const [previousSavedList, setPreviousSavedList] = useState<ShoppingListItem[] | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // In-app Toast & Confirmation State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'info' | 'warning' | 'success';
  } | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const showToast = (text: string, type: 'info' | 'warning' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 2500);
  };

  // Apply pre-built basic rancho based on user chosen budget
  const handleApplyRanchoPronto = (
    items: ShoppingListItem[],
    budget: number,
    optionTitle: string
  ) => {
    setProfile((prev) => ({ ...prev, ranchoBudget: budget }));
    setShoppingList(items);
    const total = items.reduce(
      (acc, it) => acc + (it.totalPrice || it.unitPrice * it.quantity),
      0
    );
    showToast(
      `${optionTitle}: ${items.length} itens (R$ ${total.toFixed(2).replace('.', ',')})`,
      'success'
    );
    setActiveTab('carrinho');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Read short code (?r=...), full base64 (?share_rancho=...), search (?q=...), or tab (?tab=...) from URL query parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const processIncomingShareLink = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const querySearch = urlParams.get('q');
        const tabParam = urlParams.get('tab') as MainTabId | null;

        if (querySearch && querySearch.trim()) {
          setHeaderSearchQuery(querySearch.trim());
          setActiveTab('promocoes');
        } else if (
          tabParam &&
          ['promocoes', 'rancho', 'comparador', 'carrinho', 'mapa', 'orcamento', 'historico'].includes(
            tabParam
          )
        ) {
          setActiveTab(tabParam);
        }

        const shortCode = urlParams.get('r');
        const shareCode = urlParams.get('share_rancho');

        if (!shortCode && !shareCode) return;

        let decodedItems: ShoppingListItem[] | null = null;
        let decodedBudget: number | undefined;
        let decodedHousehold: 'solo' | 'casal' | undefined;

        if (shortCode) {
          const shortData = await fetchShortRancho(shortCode);
          if (shortData && Array.isArray(shortData.items) && shortData.items.length > 0) {
            decodedItems = shortData.items;
            decodedBudget = shortData.budget;
            decodedHousehold = shortData.household;
            if (shortData.cityName) {
              setUserProfile((prev) => ({ ...prev, city: shortData.cityName }));
            }
          }
        }

        if (!decodedItems && shareCode) {
          const decoded = decodeRanchoFromUrl(shareCode);
          if (decoded && decoded.items.length > 0) {
            decodedItems = decoded.items;
            decodedBudget = decoded.budget;
            decodedHousehold = decoded.household;
          }
        }

        if (decodedItems && decodedItems.length > 0) {
          const currentSaved = localStorage.getItem('pf_rancho_items');
          if (currentSaved) {
            try {
              const parsed = JSON.parse(currentSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPreviousSavedList(parsed);
              }
            } catch {}
          }

          setShoppingList(decodedItems);
          if (decodedBudget && decodedBudget > 0) {
            setProfile((p) => ({ ...p, ranchoBudget: decodedBudget! }));
          }
          if (decodedHousehold) {
            setProfile((p) => ({ ...p, householdType: decodedHousehold! }));
          }

          const total = decodedItems.reduce(
            (acc, i) => acc + (i.totalPrice || i.unitPrice * i.quantity || 0),
            0
          );
          showToast(
            `Lista recebida: ${decodedItems.length} itens (R$ ${total
              .toFixed(2)
              .replace('.', ',')})`,
            'info'
          );
          setActiveTab('carrinho');

          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (e) {
        console.error('Erro ao ler lista do rancho na URL:', e);
      }
    };

    processIncomingShareLink();
  }, []);

  // Dynamically update SEO title, meta description, OpenGraph tags, and JSON-LD structured data
  useEffect(() => {
    updateDynamicSeo({
      activeTab,
      city: userProfile.city || 'Passo Fundo',
      neighborhood: userProfile.neighborhood || 'Centro',
      searchQuery: headerSearchQuery,
      promotions,
    });
  }, [activeTab, userProfile.city, userProfile.neighborhood, headerSearchQuery, promotions]);

  const handleRestorePreviousList = () => {
    if (previousSavedList) {
      setShoppingList(previousSavedList);
      setPreviousSavedList(null);
      showToast('Sua lista anterior foi restaurada.', 'info');
    }
  };

  // Sync user profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pf_rancho_user_profile', JSON.stringify(userProfile));
    } catch {}
  }, [userProfile]);

  // Sync profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pf_rancho_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Sync shopping list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pf_rancho_items', JSON.stringify(shoppingList));
    } catch {}
  }, [shoppingList]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pf_rancho_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Fetch promotions on initial load or when city/neighborhood changes
  const loadPromotions = async (
    forceRefresh = false,
    cityOverride?: string,
    neighborhoodOverride?: string
  ) => {
    setIsLoadingPromotions(true);
    try {
      const city = cityOverride || userProfile.city || 'Passo Fundo';
      const neighborhood = neighborhoodOverride || userProfile.neighborhood || 'Centro';
      const params = new URLSearchParams();
      if (forceRefresh) params.set('refresh', 'true');
      params.set('city', city);
      params.set('neighborhood', neighborhood);
      const url = `/api/promotions?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao carregar dados de promoções.');
      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const liveItems: PromotionItem[] = data.items;
        const defaultCat = getDefaultPromotionsCatalogue(city);

        // Merge live items with the complete supermarket catalogue so NO product is ever excluded
        const mergedMap = new Map<string, PromotionItem>();

        // 1. Seed with full complete catalogue (120+ items across all aisles and brands)
        for (const baseItem of defaultCat) {
          mergedMap.set(baseItem.id, baseItem);
        }

        // 2. Overlay live deals without losing any catalogue items
        for (const liveItem of liveItems) {
          // Keep verified Stock Center R$ 2,19 sabonete and Monster R$ 7,99 intact
          if (/sabonete/i.test(liveItem.name)) {
            const fallbackSab = defaultCat.find((i) => i.id === 'pf-sabonete-barra-90g');
            if (fallbackSab) {
              mergedMap.set(fallbackSab.id, fallbackSab);
              continue;
            }
          }
          if (/monster/i.test(liveItem.name)) {
            const fallbackMonster = defaultCat.find((i) => i.id === 'pf-energetico-monster-473ml');
            if (fallbackMonster) {
              mergedMap.set(fallbackMonster.id, fallbackMonster);
              continue;
            }
          }
          if (/omo/i.test(liveItem.name) && /4\s*kg/i.test(liveItem.name)) {
            const fallbackOmo = defaultCat.find((i) => i.id === 'pf-sabao-omo-4kg');
            if (fallbackOmo) {
              mergedMap.set(fallbackOmo.id, fallbackOmo);
              continue;
            }
          }

          if (mergedMap.has(liveItem.id)) {
            mergedMap.set(liveItem.id, liveItem);
          } else {
            mergedMap.set(liveItem.id, liveItem);
          }
        }

        const finalItems = Array.from(mergedMap.values());
        setPromotions(filterAndNormalizeActivePromotions(finalItems));
        setLastUpdated(data.updatedAt || new Date().toLocaleTimeString('pt-BR'));
        setSources(data.sources || []);
        return;
      }
      throw new Error('Nenhum dado retornado');
    } catch {
      const fallbackList = filterAndNormalizeActivePromotions(
        getDefaultPromotionsCatalogue(userProfile.city)
      );
      setPromotions((prev) =>
        prev && prev.length > 0 ? filterAndNormalizeActivePromotions(prev) : fallbackList
      );
      setLastUpdated('Hoje');
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  useEffect(() => {
    loadPromotions(false, userProfile.city, userProfile.neighborhood);
  }, [userProfile.city, userProfile.neighborhood]);

  const allAvailableMarketNames = useMemo(() => {
    const stores = getAllPassoFundoStores();
    const set = new Set<string>();
    stores.forEach((s) => set.add(s.chain));
    promotions.forEach((p) => {
      p.prices.forEach((pr) => set.add(pr.supermarket));
    });
    return Array.from(set);
  }, [promotions]);

  const totalRancho = useMemo(() => {
    return shoppingList.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [shoppingList]);

  const handleAddToRancho = (promoItem: PromotionItem, supermarket?: SupermarketName) => {
    setShoppingList((prev) => {
      const existing = prev.find((p) => p.name.toLowerCase() === promoItem.name.toLowerCase());

      const pricesMap: Partial<Record<SupermarketName, number>> = {};
      promoItem.prices.forEach((p) => {
        pricesMap[p.supermarket] = p.price;
      });

      const effectivePrice =
        supermarket && pricesMap[supermarket] !== undefined
          ? pricesMap[supermarket]!
          : promoItem.lowestPrice;

      if (existing) {
        return prev.map((item) => {
          if (item.id === existing.id) {
            const newQty = item.quantity + 1;
            return {
              ...item,
              quantity: newQty,
              totalPrice: Number((item.unitPrice * newQty).toFixed(2)),
            };
          }
          return item;
        });
      }

      const newItem: ShoppingListItem = {
        id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: promoItem.name,
        category: promoItem.category,
        quantity: 1,
        unit: promoItem.unit,
        brand: promoItem.brand,
        prices: pricesMap,
        selectedMarket: supermarket || 'best',
        unitPrice: effectivePrice,
        totalPrice: effectivePrice * 1,
        isEssential: promoItem.isEssential,
        priority: promoItem.isEssential ? 'essencial' : 'superfluo',
        isBought: false,
      };

      return [newItem, ...prev];
    });
    showToast(`${promoItem.name.split('(')[0].trim()} adicionado ao carrinho`, 'success');
  };

  const handleCustomProductAdd = (promoItem: PromotionItem, supermarket?: SupermarketName) => {
    setPromotions((prev) => {
      const exists = prev.some((p) => p.name.toLowerCase() === promoItem.name.toLowerCase());
      if (exists) return prev;
      return [promoItem, ...prev];
    });
    handleAddToRancho(promoItem, supermarket);
  };

  const handleAddCustomShoppingItem = (customItem: ShoppingListItem) => {
    setShoppingList((prev) => [customItem, ...prev]);
    showToast(`${customItem.name} adicionado à lista`, 'success');
  };

  const handleAddSubstituteToRancho = (
    sub: ProductSubstitute,
    replaceOriginalName?: string
  ) => {
    setShoppingList((prev) => {
      let filtered = prev;
      if (replaceOriginalName) {
        const cleanName = replaceOriginalName.toLowerCase().split('(')[0].trim();
        const hasExisting = prev.some((item) => item.name.toLowerCase().includes(cleanName));
        if (hasExisting) {
          filtered = prev.filter((item) => !item.name.toLowerCase().includes(cleanName));
        }
      }

      const newItem: ShoppingListItem = {
        id: `shop-sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: sub.substituteName,
        category: (sub.category as any) || 'cesta_basica',
        quantity: 1,
        unit: sub.substituteUnit,
        brand: sub.substituteBrand,
        prices: {
          [sub.market]: sub.estimatedPrice,
        },
        selectedMarket: sub.market,
        unitPrice: sub.estimatedPrice,
        totalPrice: sub.estimatedPrice,
        isEssential: true,
        priority: 'essencial',
        isBought: false,
      };

      return [newItem, ...filtered];
    });
    showToast(`${sub.substituteName} adicionado à lista`, 'success');
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            totalPrice: Number((item.unitPrice * newQty).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleSetQuantity = (id: string, qty: number) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, qty);
          return {
            ...item,
            quantity: newQty,
            totalPrice: Number((item.unitPrice * newQty).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleChangeMarket = (id: string, market: 'best' | SupermarketName) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let price = item.unitPrice;
          if (market === 'best') {
            const vals = Object.values(item.prices).filter(
              (v) => typeof v === 'number' && v > 0
            ) as number[];
            price = vals.length > 0 ? Math.min(...vals) : item.unitPrice;
          } else if (item.prices[market]) {
            price = item.prices[market] as number;
          }

          return {
            ...item,
            selectedMarket: market,
            unitPrice: price,
            totalPrice: Number((price * item.quantity).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleBought = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isBought: !item.isBought } : item))
    );
  };

  const handleClearList = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearList = () => {
    setShoppingList([]);
    setIsClearConfirmOpen(false);
    showToast('Lista de compras limpa.', 'info');
  };

  // Run Budget Advisor
  const runBudgetAdvisor = async () => {
    if (shoppingList.length === 0) {
      showToast('Adicione pelo menos 1 item ao carrinho para avaliar seu orçamento.', 'warning');
      return;
    }

    setIsAdvisorOpen(true);
    setIsAnalyzingBudget(true);

    try {
      const res = await fetch('/api/budget-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            ...profile,
            familyMembers: profile.familyMembers || (profile.householdType === 'casal' ? 2 : 1),
          },
          city: userProfile.city || 'Passo Fundo',
          items: shoppingList.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            isEssential: i.isEssential,
            selectedMarket: i.selectedMarket,
          })),
        }),
      });

      if (!res.ok) throw new Error('Falha ao rodar consultor financeiro.');
      const data = await res.json();
      setBudgetAnalysis({
        status: data.status,
        ranchoBudget: profile.ranchoBudget,
        totalCost: totalRancho,
        remainingBalance: profile.ranchoBudget - totalRancho,
        percentageUsed: Math.min(Math.round((totalRancho / profile.ranchoBudget) * 100), 100),
        canBuyCount: data.canBuyItems?.length || 0,
        cannotBuyCount: data.cannotBuyItems?.length || 0,
        canBuyItems: data.canBuyItems || [],
        cannotBuyItems: data.cannotBuyItems || [],
        recommendations: data.recommendations || [],
        projectedDays: profile.cycleDays,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingBudget(false);
    }
  };

  const handleApplyCuts = (itemNamesToRemove: string[]) => {
    setShoppingList((prev) =>
      prev.filter(
        (item) =>
          !itemNamesToRemove.some((name) =>
            item.name.toLowerCase().includes(name.toLowerCase())
          )
      )
    );
    showToast('Itens não prioritários removidos da lista.', 'success');
  };

  const handleSaveCurrentRancho = (monthYear: string, notes?: string) => {
    let stok = 0;
    let atacadao = 0;
    let zaffari = 0;
    let bourbon = 0;

    shoppingList.forEach((item) => {
      const p = item.prices || {};
      stok += (p['Stock Center'] || item.unitPrice) * item.quantity;
      atacadao += (p['Atacadão'] || item.unitPrice) * item.quantity;
      zaffari += (p['Zaffari'] || item.unitPrice) * item.quantity;
      bourbon += (p['Bourbon'] || item.unitPrice) * item.quantity;
    });

    const maxCost = Math.max(stok, atacadao, zaffari, bourbon, totalRancho);
    const savings = Math.max(0, maxCost - totalRancho);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    setHistory((prev) => {
      const existingIdx = prev.findIndex(
        (h) => h.monthYear.toLowerCase() === monthYear.toLowerCase()
      );
      const newEntry: RanchoHistoryEntry = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `hist-${Date.now()}`,
        monthYear,
        date: dateStr,
        totalSpent: Number(totalRancho.toFixed(2)),
        budgetLimit: profile.ranchoBudget,
        itemCount: shoppingList.length,
        householdType: profile.householdType,
        stokCenterTotal: Number(stok.toFixed(2)),
        atacadaoTotal: Number(atacadao.toFixed(2)),
        zaffariTotal: Number(zaffari.toFixed(2)),
        bourbonTotal: Number(bourbon.toFixed(2)),
        savingsAchieved: Number(savings.toFixed(2)),
        notes: notes || undefined,
      };

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newEntry;
        return updated;
      }
      return [...prev, newEntry];
    });
    showToast(`Compra de ${monthYear} salva no histórico.`, 'success');
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    showToast('Registro removido do histórico.', 'info');
  };

  const handleExportPdf = () => {
    if (shoppingList.length === 0) {
      showToast('Sua lista está vazia! Adicione itens antes de exportar o PDF.', 'warning');
      return;
    }
    generateRanchoPdf({
      items: shoppingList,
      budgetLimit: profile.ranchoBudget,
      householdType: profile.householdType,
      neighborhood: userProfile.neighborhood,
      cityName: userProfile.city || 'Passo Fundo',
    });
    showToast('PDF da lista baixado.', 'success');
  };

  const searchPlaceholderByTab: Record<MainTabId, string> = {
    promocoes: 'Buscar arroz, leite, frango ou mercado...',
    rancho: 'Buscar item nas ofertas...',
    comparador: 'Buscar produto...',
    carrinho: 'Buscar item na sua lista...',
    mapa: 'Buscar produto ou mercado...',
    orcamento: 'Buscar oferta...',
    historico: 'Buscar oferta...',
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-dvh bg-canvas text-ink relative flex flex-col">
      {/* Header Sticky Global */}
      <AppHeader
        locationLabel={`${userProfile.neighborhood || 'Centro'} · ${userProfile.city || 'Passo Fundo'}`}
        onOpenLocation={() => setIsProfileModalOpen(true)}
        onQuickGps={() => handleQuickGpsDetect(false)}
        isLocatingGps={isLocatingGps}
        onLogoClick={() => {
          setActiveTab('promocoes');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchValue={headerSearchQuery}
        onSearchChange={(val) => {
          setHeaderSearchQuery(val);
          if (activeTab !== 'promocoes' && val.trim().length > 0) {
            setActiveTab('promocoes');
          }
        }}
        searchPlaceholder={searchPlaceholderByTab[activeTab]}
        showSearch={activeTab === 'promocoes'}
        activeTab={activeTab}
        onSelectSecondaryTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        userAvatarUrl={userProfile.avatarUrl}
        isUserConnected={userProfile.isConnectedWithGoogle}
      />

      {/* Conteúdo da aba ativa dentro do PageScaffold */}
      <main className="flex-1 w-full">
        {/* 5.1 OFERTAS */}
        {activeTab === 'promocoes' && (
          <PageScaffold>
            <PromotionsTable
              items={promotions}
              isLoading={isLoadingPromotions}
              onRefresh={() => loadPromotions(true)}
              lastUpdated={lastUpdated}
              shoppingList={shoppingList}
              onAddToRancho={handleAddToRancho}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onAddSubstituteToRancho={handleAddSubstituteToRancho}
              onAddCustomProduct={handleCustomProductAdd}
              sources={sources}
              userProfile={userProfile}
              initialMarketFilter={selectedMarketFilter}
              externalSearchQuery={headerSearchQuery}
              onExternalSearchChange={setHeaderSearchQuery}
            />
          </PageScaffold>
        )}

        {/* 5.2 RANCHO (Gerador em 3 passos) */}
        {activeTab === 'rancho' && (
          <PageScaffold>
            <RanchoProntoSelector
              userProfile={userProfile}
              promotions={promotions}
              initialBudget={profile.ranchoBudget}
              onApplyRancho={(items, budget, optionTitle) => {
                handleApplyRanchoPronto(items, budget, optionTitle);
              }}
              onNavigateToCart={() => {
                setActiveTab('carrinho');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenMap={() => setActiveTab('mapa')}
            />
          </PageScaffold>
        )}

        {/* 5.3 COMPARAR */}
        {activeTab === 'comparador' && (
          <PageScaffold>
            {shoppingList.length === 0 ? (
              <EmptyState
                icon={<Layers className="w-8 h-8" />}
                title="Sua lista está vazia"
                description="Adicione produtos nas ofertas de hoje ou monte um rancho pronto em 3 passos para comparar o total em cada mercado."
                actionLabel="Montar rancho pronto"
                onAction={() => {
                  setActiveTab('rancho');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                secondaryActionLabel="Ver ofertas de hoje"
                onSecondaryAction={() => {
                  setActiveTab('promocoes');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ) : (
              <MarketComparisonSummary
                items={shoppingList}
                budgetLimit={profile.ranchoBudget}
                userProfile={userProfile}
                onSelectMarketForCart={(market) => {
                  setCartMarketMode(market);
                  setActiveTab('carrinho');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </PageScaffold>
        )}

        {/* 5.4 CARRINHO / NO MERCADO */}
        {activeTab === 'carrinho' && (
          <PageScaffold
            title="Seu carrinho"
            subtitle={
              shoppingList.length > 0
                ? `${shoppingList.length} ${
                    shoppingList.length === 1 ? 'item na lista' : 'itens na lista'
                  }`
                : undefined
            }
          >
            <SingleMarketShoppingMode
              promotions={promotions}
              shoppingList={shoppingList}
              onAddToRancho={handleAddToRancho}
              onAddCustomShoppingItem={handleAddCustomShoppingItem}
              onUpdateQuantity={handleUpdateQuantity}
              onSetQuantity={handleSetQuantity}
              onRemoveItem={handleRemoveItem}
              onToggleBought={handleToggleBought}
              onChangeMarket={handleChangeMarket}
              onClearList={handleClearList}
              budgetLimit={profile.ranchoBudget}
              monthlyIncome={profile.monthlyIncome}
              familyMembers={
                profile.familyMembers || (profile.householdType === 'casal' ? 2 : 1)
              }
              cityName={userProfile.city || 'Passo Fundo'}
              availableMarkets={allAvailableMarketNames}
              initialMarketMode={cartMarketMode}
              previousSavedListCount={previousSavedList?.length || 0}
              onRestorePreviousList={handleRestorePreviousList}
              onSaveToHistory={() => {
                handleSaveCurrentRancho(
                  new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                );
                setActiveTab('historico');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSwitchToComparator={() => setActiveTab('comparador')}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onExportPdf={handleExportPdf}
              onNavigateToOffers={() => {
                setActiveTab('promocoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </PageScaffold>
        )}

        {/* 5.5 MERCADOS (Mapa) */}
        {activeTab === 'mapa' && (
          <PageScaffold>
            <PassoFundoMap
              userProfile={userProfile}
              onUpdateNeighborhood={(neighborhood: PassoFundoNeighborhood) => {
                const nh = PASSO_FUNDO_NEIGHBORHOODS.find(
                  (n) => n.neighborhood === neighborhood
                );
                setUserProfile((prev) => ({
                  ...prev,
                  neighborhood,
                  coordinates: nh ? { lat: nh.lat, lng: nh.lng } : prev.coordinates,
                }));
              }}
              onSelectSupermarketFilter={(market) => {
                setSelectedMarketFilter(market);
                setActiveTab('promocoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </PageScaffold>
        )}

        {/* 5.6 ORÇAMENTO + CONSULTOR */}
        {activeTab === 'orcamento' && (
          <PageScaffold>
            <BudgetStepView
              profile={profile}
              onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              totalRancho={totalRancho}
              onNextStep={() => {
                setActiveTab('promocoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAdvisor={runBudgetAdvisor}
              isAnalyzingAdvisor={isAnalyzingBudget}
              userProfile={userProfile}
              promotions={promotions}
              onApplyRanchoPronto={handleApplyRanchoPronto}
              onOpenMap={() => {
                setActiveTab('mapa');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              shoppingList={shoppingList}
              history={history}
              analysis={budgetAnalysis}
              onApplyCuts={handleApplyCuts}
            />
          </PageScaffold>
        )}

        {/* 5.7 HISTÓRICO */}
        {activeTab === 'historico' && (
          <PageScaffold>
            <RanchoHistoryChart
              history={history}
              onSaveCurrentRancho={handleSaveCurrentRancho}
              onDeleteEntry={handleDeleteHistoryEntry}
              currentRanchoTotal={totalRancho}
              currentBudgetLimit={profile.ranchoBudget}
              currentItemsCount={shoppingList.length}
            />
          </PageScaffold>
        )}
      </main>

      {/* Navegação Inferior Fixa de 5 Slots */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={shoppingList.length}
      />

      {/* Sheets Globais */}
      <BudgetAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        analysis={budgetAnalysis}
        isLoading={isAnalyzingBudget}
        onApplyCuts={handleApplyCuts}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={(updated: UserProfile) => setUserProfile(updated)}
      />

      <ShareRanchoModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        items={shoppingList}
        budgetLimit={profile.ranchoBudget}
        householdType={profile.householdType}
        neighborhood={userProfile.neighborhood || userProfile.city || 'Passo Fundo - RS'}
        cityName={userProfile.city || 'Passo Fundo'}
      />

      {/* Confirmação de Limpeza da Lista em BottomSheet */}
      <BottomSheet
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Limpar toda a lista?"
        subtitle="Todos os itens do seu carrinho atual serão removidos."
        footer={
          <div className="space-y-2">
            <PrimaryButton onClick={handleConfirmClearList}>
              Sim, limpar lista
            </PrimaryButton>
            <SecondaryButton onClick={() => setIsClearConfirmOpen(false)}>
              Cancelar
            </SecondaryButton>
          </div>
        }
      >
        <p className="text-[14px] text-ink-soft">
          Você poderá adicionar novos produtos a qualquer momento nas ofertas de hoje ou gerar outro rancho pronto.
        </p>
      </BottomSheet>

      {/* Toast Não-Bloqueante */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
