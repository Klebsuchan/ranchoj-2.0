import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  UserProfile,
  SupermarketStore,
  PassoFundoNeighborhood,
  SupermarketName,
  StoreCategoryType,
} from '../types';
import {
  PASSO_FUNDO_NEIGHBORHOODS,
  getAllPassoFundoStores,
  saveCustomStoreToStorage,
  removeCustomStoreFromStorage,
  calculateDistanceKm,
  fetchNearbySupermarketsFromOSM,
} from '../utils/passoFundoLocations';
import {
  MapPin,
  Navigation,
  Store,
  ExternalLink,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { ToggleChip } from './ui/ToggleChip';
import { SectionTitle } from './ui/SectionTitle';
import { SecondaryButton } from './ui/SecondaryButton';
import { PrimaryButton } from './ui/PrimaryButton';
import { BottomSheet } from './ui/BottomSheet';

interface PassoFundoMapProps {
  userProfile: UserProfile;
  onUpdateNeighborhood: (neighborhood: PassoFundoNeighborhood) => void;
  onSelectSupermarketFilter?: (market: SupermarketName | 'all' | 'nearby') => void;
  selectedMarketFilter?: SupermarketName | 'all' | 'nearby';
}

const STORE_TYPE_LABEL: Record<StoreCategoryType, string> = {
  atacarejo: 'Atacarejo',
  rede: 'Hiper / Rede',
  bairro: 'Mercado de bairro',
  independente: 'Independente',
};

export const PassoFundoMap: React.FC<PassoFundoMapProps> = ({
  userProfile,
  onSelectSupermarketFilter,
  selectedMarketFilter = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [storesList, setStoresList] = useState<SupermarketStore[]>(() =>
    getAllPassoFundoStores()
  );
  const [selectedStoreId, setSelectedStoreId] = useState<string>('zaffari-centro');
  const [onlyNearbyFiltered, setOnlyNearbyFiltered] = useState<boolean>(
    selectedMarketFilter === 'nearby'
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'zaffari' | 'bairro' | 'rede_atacarejo' | 'independente'
  >('all');

  // Rastreamento GPS ao vivo
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isTrackingGps, setIsTrackingGps] = useState<boolean>(false);

  // Sheet para cadastrar mercado local
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreNeighborhood, setNewStoreNeighborhood] = useState<string>(
    userProfile.neighborhood || 'Centro'
  );
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreType, setNewStoreType] = useState<StoreCategoryType>('bairro');
  const [newStorePromo, setNewStorePromo] = useState('');
  const [formError, setFormError] = useState('');

  const userLat = liveCoords?.lat ?? userProfile.coordinates?.lat ?? -28.2628;
  const userLng = liveCoords?.lng ?? userProfile.coordinates?.lng ?? -52.4083;

  // Carrega mercados reais via OpenStreetMap Overpass para qualquer bairro/cidade do Brasil
  useEffect(() => {
    let active = true;
    const isPF = (userProfile.city || 'Passo Fundo').toLowerCase().includes('passo fundo');
    const basePF = getAllPassoFundoStores();

    fetchNearbySupermarketsFromOSM(
      userLat,
      userLng,
      userProfile.city || 'Passo Fundo',
      userProfile.neighborhood || 'Centro',
      Math.max(5, (userProfile.radiusKm || 5) * 1.5)
    ).then((osmStores) => {
      if (!active) return;
      if (isPF) {
        const merged = [...basePF];
        osmStores.forEach((osm) => {
          const duplicate = merged.some(
            (m) =>
              calculateDistanceKm(m.lat, m.lng, osm.lat, osm.lng) < 0.25 ||
              m.name.toLowerCase() === osm.name.toLowerCase()
          );
          if (!duplicate) merged.push(osm);
        });
        setStoresList(merged);
      } else if (osmStores.length > 0) {
        setStoresList(osmStores);
      } else {
        setStoresList(basePF);
      }
    });

    return () => {
      active = false;
    };
  }, [userLat, userLng, userProfile.city, userProfile.neighborhood, userProfile.radiusKm]);

  // Toggle GPS live tracking
  const handleToggleLiveGps = () => {
    if (isTrackingGps) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      setIsTrackingGps(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setIsTrackingGps(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setIsTrackingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const storesWithDistance = storesList
    .map((store) => {
      const dist = calculateDistanceKm(userLat, userLng, store.lat, store.lng);
      const etaMinutes = Math.max(2, Math.round((dist / 25) * 60));
      return {
        ...store,
        distanceKm: dist,
        etaMinutes,
        isNearby: dist <= (userProfile.radiusKm || 5),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestStore = storesWithDistance[0];

  const visibleStores = storesWithDistance.filter((store) => {
    if (categoryFilter === 'zaffari') {
      return (
        store.chain.toLowerCase().includes('zaffari') ||
        store.chain.toLowerCase().includes('bourbon')
      );
    }
    if (onlyNearbyFiltered && !store.isNearby) return false;
    if (categoryFilter === 'bairro') return store.storeType === 'bairro';
    if (categoryFilter === 'rede_atacarejo') {
      return store.storeType === 'atacarejo' || store.storeType === 'rede';
    }
    if (categoryFilter === 'independente') return store.storeType === 'independente';
    return true;
  });

  // Inicializa e atualiza mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const group = markersGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    // Marcador do usuário
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `<div style="width:16px;height:16px;border-radius:9999px;background:#ea1d2c;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup(`Você (${userProfile.neighborhood || 'Passo Fundo'})`)
      .addTo(group);

    // Marcadores dos mercados visíveis
    visibleStores.forEach((st) => {
      const isSelected = st.id === selectedStoreId;
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `<div style="padding:4px 8px;border-radius:9999px;background:${
          isSelected ? '#ea1d2c' : '#263238'
        };color:#ffffff;font-weight:700;font-size:11px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);border:2px solid #ffffff;">${
          st.chain
        }</div>`,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });

      const marker = L.marker([st.lat, st.lng], { icon: storeIcon }).addTo(group);
      marker.on('click', () => {
        setSelectedStoreId(st.id);
      });
    });
  }, [userLat, userLng, visibleStores, selectedStoreId, userProfile.neighborhood]);

  const handleSelectStoreCard = (store: SupermarketStore) => {
    setSelectedStoreId(store.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([store.lat, store.lng], 15, { animate: true });
    }
  };

  const handleCreateCustomStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreAddress.trim()) {
      setFormError('Preencha o nome e o endereço do mercado.');
      return;
    }

    const nhCoord = PASSO_FUNDO_NEIGHBORHOODS.find(
      (n) => n.neighborhood === newStoreNeighborhood
    );
    const lat = (nhCoord?.lat ?? userLat) + (Math.random() - 0.5) * 0.006;
    const lng = (nhCoord?.lng ?? userLng) + (Math.random() - 0.5) * 0.006;

    const created = saveCustomStoreToStorage({
      name: newStoreName.trim(),
      chain: newStoreName.trim(),
      neighborhood: newStoreNeighborhood,
      address: newStoreAddress.trim(),
      lat,
      lng,
      openHours: '08:00 às 20:00',
      highlightPromo: newStorePromo.trim() || 'Ofertas locais do bairro',
      storeType: newStoreType,
    });
    setStoresList(getAllPassoFundoStores());
    setSelectedStoreId(created.id);
    setNewStoreName('');
    setNewStoreAddress('');
    setNewStorePromo('');
    setFormError('');
    setIsAddStoreOpen(false);
  };

  const handleDeleteCustomStore = (id: string) => {
    removeCustomStoreFromStorage(id);
    setStoresList(getAllPassoFundoStores());
  };

  return (
    <div className="space-y-5">
      {/* Pill fixa de rastreamento GPS quando ativo ou resumo de proximidade */}
      <div className="flex items-center justify-between gap-2 bg-surface rounded-pill shadow-card px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className={`w-4 h-4 shrink-0 ${isTrackingGps ? 'text-save' : 'text-brand'}`} />
          <span className="text-[12px] font-semibold text-ink truncate tabular-nums">
            {nearestStore
              ? `Você está a ${nearestStore.distanceKm.toFixed(1)} km de ${nearestStore.name}`
              : `Região: ${userProfile.neighborhood || 'Passo Fundo'}`}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleLiveGps}
          className={`min-h-[36px] px-3 rounded-pill text-[12px] font-bold whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform ${
            isTrackingGps ? 'bg-save-soft text-save' : 'bg-field text-ink'
          }`}
        >
          {isTrackingGps ? 'GPS ativo' : 'Ativar GPS'}
        </button>
      </div>

      {/* 1. Mapa Leaflet ocupando ~55% da altura útil */}
      <div className="relative w-full h-[52dvh] min-h-[300px] max-h-[420px] rounded-card overflow-hidden shadow-card bg-field z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* 2. Filtros ToggleChip por tipo de loja */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
        <ToggleChip
          label="Todos"
          active={categoryFilter === 'all' && !onlyNearbyFiltered}
          onToggle={() => {
            setCategoryFilter('all');
            setOnlyNearbyFiltered(false);
          }}
          count={storesWithDistance.length}
        />
        <ToggleChip
          label="Perto de mim"
          active={onlyNearbyFiltered}
          onToggle={() => setOnlyNearbyFiltered(!onlyNearbyFiltered)}
        />
        <ToggleChip
          label="Atacarejos e Redes"
          active={categoryFilter === 'rede_atacarejo'}
          onToggle={() =>
            setCategoryFilter(categoryFilter === 'rede_atacarejo' ? 'all' : 'rede_atacarejo')
          }
        />
        <ToggleChip
          label="Mercados de bairro"
          active={categoryFilter === 'bairro'}
          onToggle={() => setCategoryFilter(categoryFilter === 'bairro' ? 'all' : 'bairro')}
        />
        <ToggleChip
          label="Zaffari e Bourbon"
          active={categoryFilter === 'zaffari'}
          onToggle={() => setCategoryFilter(categoryFilter === 'zaffari' ? 'all' : 'zaffari')}
        />
        <ToggleChip
          label="Independentes"
          active={categoryFilter === 'independente'}
          onToggle={() =>
            setCategoryFilter(categoryFilter === 'independente' ? 'all' : 'independente')
          }
        />
      </div>

      {/* 3. Lista de mercados em cards compactos ordenados por distância */}
      <section className="space-y-3">
        <SectionTitle
          title="Mercados na sua região"
          subtitle="Ordenados do mais próximo ao mais distante"
        />

        <div className="space-y-3">
          {visibleStores.map((store) => {
            const isSelected = store.id === selectedStoreId;
            const typeLabel = store.storeType
              ? STORE_TYPE_LABEL[store.storeType]
              : 'Supermercado';

            return (
              <div
                key={store.id}
                onClick={() => handleSelectStoreCard(store)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectStoreCard(store);
                  }
                }}
                className={`rounded-card p-4 space-y-3 transition cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-surface border-2 border-brand shadow-float'
                    : 'bg-surface shadow-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[12px] font-medium text-ink-muted">
                      {typeLabel} · {store.neighborhood}
                    </span>
                    <h3 className="text-[15px] font-semibold text-ink mt-0.5 truncate">
                      {store.name}
                    </h3>
                    <p className="text-[12px] font-medium text-ink-soft truncate mt-0.5">
                      {store.address}
                    </p>
                  </div>

                  <div className="text-right shrink-0 tabular-nums">
                    <span className="text-[15px] font-bold text-ink block">
                      {store.distanceKm.toFixed(1)} km
                    </span>
                    <span className="text-[12px] font-medium text-ink-muted inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {store.etaMinutes} min
                    </span>
                  </div>
                </div>

                {store.highlightPromo && (
                  <p className="text-[13px] font-medium text-save bg-save-soft rounded-field px-3 py-2">
                    {store.highlightPromo}
                  </p>
                )}

                <div
                  className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    {onSelectSupermarketFilter && (
                      <button
                        type="button"
                        onClick={() => onSelectSupermarketFilter(store.chain)}
                        className="min-h-[44px] px-3.5 rounded-pill bg-brand text-white text-[12px] font-bold flex items-center gap-1.5 active:scale-[0.98] transition-transform"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ver ofertas</span>
                      </button>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 rounded-pill bg-field text-ink text-[12px] font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Traçar rota</span>
                    </a>
                  </div>

                  {store.isUserAdded && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomStore(store.id)}
                      aria-label={`Remover ${store.name}`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Botão "Cadastrar mercado local" como SecondaryButton no fim da lista */}
      <SecondaryButton
        onClick={() => setIsAddStoreOpen(true)}
        icon={<Plus className="w-5 h-5" />}
      >
        Cadastrar mercado local
      </SecondaryButton>

      {/* BottomSheet de cadastro de mercado */}
      <BottomSheet
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        title="Cadastrar mercado local"
        subtitle="Adicione o mercadinho do seu bairro para comparar distâncias e ofertas"
        footer={
          <PrimaryButton onClick={handleCreateCustomStore}>
            Salvar mercado no mapa
          </PrimaryButton>
        }
      >
        <form onSubmit={handleCreateCustomStore} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Nome do mercado
            </label>
            <input
              type="text"
              value={newStoreName}
              onChange={(e) => {
                setNewStoreName(e.target.value);
                setFormError('');
              }}
              placeholder="Ex.: Mercado São João"
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">
                Bairro
              </label>
              <select
                value={newStoreNeighborhood}
                onChange={(e) => setNewStoreNeighborhood(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {PASSO_FUNDO_NEIGHBORHOODS.map((nh) => (
                  <option key={nh.neighborhood} value={nh.neighborhood}>
                    {nh.neighborhood}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink-muted mb-1">
                Tipo
              </label>
              <select
                value={newStoreType}
                onChange={(e) => setNewStoreType(e.target.value as StoreCategoryType)}
                className="w-full min-h-[48px] px-3 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <option value="bairro">Mercado de bairro</option>
                <option value="independente">Independente</option>
                <option value="atacarejo">Atacarejo</option>
                <option value="rede">Rede</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Endereço ou rua
            </label>
            <input
              type="text"
              value={newStoreAddress}
              onChange={(e) => {
                setNewStoreAddress(e.target.value);
                setFormError('');
              }}
              placeholder="Ex.: Rua Uruguai, 450"
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Destaque ou promoção (opcional)
            </label>
            <input
              type="text"
              value={newStorePromo}
              onChange={(e) => setNewStorePromo(e.target.value)}
              placeholder="Ex.: Padaria e açougue com oferta na quarta"
              className="w-full min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          {formError && (
            <p className="text-[12px] font-medium text-danger">{formError}</p>
          )}
        </form>
      </BottomSheet>
    </div>
  );
};
