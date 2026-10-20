import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  PASSO_FUNDO_NEIGHBORHOODS,
  KNOWN_BRAZILIAN_CITIES,
  reverseGeocodeLocation,
  searchBrazilLocation,
} from '../utils/passoFundoLocations';
import { MapPin, LocateFixed, LogOut, User, Search } from 'lucide-react';
import {
  clearGoogleSession,
  loginWithFirebaseGoogle,
  cleanAvatarUrl,
} from '../utils/googleAuth';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { ToggleChip } from './ui/ToggleChip';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(() =>
    profile.name === 'Braian Camargo' ? '' : profile.name || ''
  );
  const [email, setEmail] = useState(() =>
    profile.email === 'braian.kleber.camargo@gmail.com' ? '' : profile.email || ''
  );
  const [neighborhood, setNeighborhood] = useState<string>(profile.neighborhood || 'Centro');
  const [cityName, setCityName] = useState<string>(profile.city || 'Passo Fundo');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lng: number } | undefined>(
    profile.coordinates
  );
  const [radiusKm, setRadiusKm] = useState<number>(profile.radiusKm || 5);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Busca nacional de qualquer bairro ou cidade do Brasil
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingBrazil, setIsSearchingBrazil] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { label: string; city: string; neighborhood: string; lat: number; lng: number }[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name === 'Braian Camargo' ? '' : profile.name || '');
      setEmail(profile.email === 'braian.kleber.camargo@gmail.com' ? '' : profile.email || '');
      setNeighborhood(profile.neighborhood || 'Centro');
      setCityName(profile.city || 'Passo Fundo');
      setCustomCoords(profile.coordinates);
      setRadiusKm(profile.radiusKm || 5);
      setLocationStatus(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithFirebaseGoogle();
      if (user) {
        setName(user.name);
        setEmail(user.email);
        onUpdateProfile({
          ...profile,
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: cleanAvatarUrl(user.photoUrl),
          isConnectedWithGoogle: true,
          connectedAt: user.signedInAt,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    await clearGoogleSession();
    setName('');
    setEmail('');
    onUpdateProfile({
      ...profile,
      name: '',
      email: '',
      avatarUrl: undefined,
      isConnectedWithGoogle: false,
    });
  };

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('GPS não suportado neste navegador.');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Obtendo sua posição exata pelo GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocodeLocation(latitude, longitude);
          const nextCity = geo.city || 'Passo Fundo';
          const nextNeighborhood = geo.neighborhood || 'Centro';
          setCityName(nextCity);
          setNeighborhood(nextNeighborhood);
          setCustomCoords({ lat: latitude, lng: longitude });
          onUpdateProfile({
            ...profile,
            city: nextCity,
            neighborhood: nextNeighborhood,
            coordinates: { lat: latitude, lng: longitude },
            locationMode: 'gps',
          });
          setLocationStatus(`Localizado via GPS: ${nextNeighborhood}, ${nextCity}`);
        } catch {
          setLocationStatus('GPS obtido com sucesso.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationStatus('Permissão de GPS negada ou indisponível. Escolha seu bairro ou cidade abaixo.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleBrazilSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearchingBrazil(true);
    try {
      const result = await searchBrazilLocation(searchQuery.trim());
      if (result) {
        setSearchResults([
          {
            label: `${result.neighborhood} · ${result.city} (${result.state})`,
            city: result.city,
            neighborhood: result.neighborhood,
            lat: result.lat,
            lng: result.lng,
          },
        ]);
      } else {
        setSearchResults([]);
      }
    } finally {
      setIsSearchingBrazil(false);
    }
  };

  const handleSelectSearchResult = (res: {
    label: string;
    city: string;
    neighborhood: string;
    lat: number;
    lng: number;
  }) => {
    setCityName(res.city);
    setNeighborhood(res.neighborhood);
    setCustomCoords({ lat: res.lat, lng: res.lng });
    setSearchResults([]);
    setSearchQuery('');
    setLocationStatus(`Selecionado: ${res.neighborhood} · ${res.city}`);
  };

  const handleSave = () => {
    const nhObj = PASSO_FUNDO_NEIGHBORHOODS.find((n) => n.neighborhood === neighborhood);
    const cityObj = KNOWN_BRAZILIAN_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.trim().toLowerCase()
    );

    const coords =
      cityName.toLowerCase().includes('passo fundo') && nhObj
        ? { lat: nhObj.lat, lng: nhObj.lng }
        : customCoords
        ? customCoords
        : cityObj
        ? { lat: cityObj.lat, lng: cityObj.lng }
        : profile.coordinates || { lat: -28.2628, lng: -52.4083 };

    onUpdateProfile({
      ...profile,
      name: name.trim(),
      email: email.trim(),
      city: cityName.trim() || 'Passo Fundo',
      neighborhood: neighborhood.trim() || 'Centro',
      radiusKm,
      coordinates: coords,
    });
    onClose();
  };

  const isPassoFundo = cityName.toLowerCase().includes('passo fundo');
  const orderedNeighborhoods = [...PASSO_FUNDO_NEIGHBORHOODS].sort((a, b) => {
    if (a.neighborhood === 'Centro') return -1;
    if (b.neighborhood === 'Centro') return 1;
    return 0;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Sua localização no Brasil"
      subtitle="Ative seu GPS ou escolha seu bairro/cidade para ver ofertas e mercados perto de você"
      footer={<PrimaryButton onClick={handleSave}>Confirmar localização</PrimaryButton>}
    >
      <div className="space-y-5">
        {/* GPS Rápido em Tempo Real */}
        <div className="bg-field rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ink-muted">Localização ativa</p>
              <p className="text-[15px] font-bold text-ink truncate">
                {neighborhood} · {cityName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={isLocating}
              className="min-h-[44px] px-4 rounded-pill bg-brand text-white text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Localizando...' : 'Usar meu GPS'}</span>
            </button>
          </div>
          {locationStatus && (
            <p className="text-[12px] font-semibold text-save">{locationStatus}</p>
          )}
        </div>

        {/* Busca de qualquer bairro ou cidade do Brasil */}
        <div className="space-y-2">
          <label className="block text-[13px] font-semibold text-ink">
            Buscar qualquer bairro ou cidade do Brasil
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBrazilSearch();
                }
              }}
              placeholder="Ex: Centro Passo Fundo, Moema São Paulo, Porto Alegre..."
              className="flex-1 min-h-[48px] px-3.5 rounded-field bg-field text-ink text-[15px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            <button
              type="button"
              onClick={handleBrazilSearch}
              disabled={isSearchingBrazil}
              className="min-h-[48px] px-4 rounded-field bg-surface shadow-card text-ink text-[13px] font-bold flex items-center gap-1.5 shrink-0 active:scale-[0.98] transition-transform"
            >
              <Search className="w-4 h-4 text-brand" />
              <span>{isSearchingBrazil ? '...' : 'Buscar'}</span>
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-field rounded-card p-2 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((res, idx) => (
                <button
                  key={`${res.lat}-${res.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2.5 rounded-field hover:bg-surface text-[13px] font-semibold text-ink flex items-center gap-2 active:scale-[0.99] transition-transform"
                >
                  <MapPin className="w-4 h-4 text-brand shrink-0" />
                  <span className="truncate">{res.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bairros de Passo Fundo (Centro em 1º lugar) */}
        {isPassoFundo && (
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold text-ink">
              Bairros de Passo Fundo
            </label>
            <div className="flex flex-wrap gap-2">
              {orderedNeighborhoods.map((nh) => (
                <ToggleChip
                  key={nh.neighborhood}
                  label={nh.neighborhood}
                  active={neighborhood === nh.neighborhood}
                  onToggle={() => {
                    setNeighborhood(nh.neighborhood);
                    setCustomCoords({ lat: nh.lat, lng: nh.lng });
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bairro, Cidade e Raio */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Centro"
              className="w-full min-h-[48px] px-3 rounded-field bg-field text-ink text-[15px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Passo Fundo"
              className="w-full min-h-[48px] px-3 rounded-field bg-field text-ink text-[15px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ink-muted mb-1">
              Raio ({radiusKm} km)
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full min-h-[48px] px-2.5 rounded-field bg-field text-ink text-[15px] font-semibold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <option value={2}>Até 2 km</option>
              <option value={3.5}>Até 3,5 km</option>
              <option value={5}>Até 5 km</option>
              <option value={10}>Até 10 km</option>
              <option value={20}>Até 20 km</option>
            </select>
          </div>
        </div>

        {/* Conta Google */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <span className="block text-[14px] font-semibold text-ink">Sua conta</span>
          {profile.isConnectedWithGoogle ? (
            <div className="bg-field rounded-card p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'Usuário'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-save-soft text-save flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-ink truncate">
                    {profile.name || 'Conta conectada'}
                  </p>
                  <p className="text-[12px] font-medium text-ink-muted truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="min-h-[44px] px-3 rounded-pill text-[12px] font-semibold text-danger hover:bg-danger-soft flex items-center gap-1 shrink-0 active:scale-[0.98] transition-transform"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <SecondaryButton onClick={handleGoogleConnect} disabled={isLoggingIn}>
              {isLoggingIn ? 'Conectando...' : 'Entrar com conta Google'}
            </SecondaryButton>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
