import { PromotionItem } from '../types';
import { MainTabId } from '../components/ui/BottomNav';

export const SEO_CANONICAL_SLUG = 'ranchoja-ofertas-supermercado';
export const SEO_DEFAULT_DOMAIN = `https://${SEO_CANONICAL_SLUG}.vercel.app`;

interface SeoUpdateParams {
  activeTab: MainTabId;
  city: string;
  neighborhood?: string;
  searchQuery?: string;
  promotions?: PromotionItem[];
}

const TAB_SEO_CONFIG: Record<
  MainTabId,
  (region: string) => { title: string; description: string }
> = {
  promocoes: (region) => ({
    title: `Ofertas de Supermercado Hoje em ${region} | RanchoJá – Encartes e Preços`,
    description: `Veja as promoções do dia e encartes semanais de supermercados em ${region}. Compare preços reais hoje e economize até 30% na sua lista de rancho.`,
  }),
  rancho: (region) => ({
    title: `Montar Rancho Pronto do Mês em ${region} | RanchoJá`,
    description: `Gere sua lista de compras do mês em 3 passos com os menores preços verificados nos supermercados de ${region}.`,
  }),
  comparador: (region) => ({
    title: `Comparador de Preços de Supermercados em ${region} | RanchoJá`,
    description: `Descubra qual é o supermercado mais barato hoje em ${region} para comprar sua lista completa ou dividir entre mercados.`,
  }),
  carrinho: (region) => ({
    title: `Sua Lista de Compras e Carrinho Inteligente (${region}) | RanchoJá`,
    description: `Acompanhe os itens do seu rancho no mercado em ${region}, marque o que já pegou e controle seu orçamento em tempo real.`,
  }),
  mapa: (region) => ({
    title: `Supermercados e Atacarejos Perto de Você em ${region} | RanchoJá`,
    description: `Mapa interativo com localização por GPS dos supermercados, atacarejos e mercados de bairro mais próximos em ${region}.`,
  }),
  orcamento: (region) => ({
    title: `Planejador de Orçamento Mensal de Supermercado | RanchoJá (${region})`,
    description: `Defina sua meta de gastos com mercado em ${region} e receba recomendações inteligentes para não estourar o orçamento.`,
  }),
  historico: (region) => ({
    title: `Histórico de Gastos e Economia no Supermercado | RanchoJá`,
    description: `Acompanhe sua economia mensal nas compras de supermercado em ${region} e compare seus gastos mês a mês.`,
  }),
};

function setMetaContent(selector: string, content: string) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(selector);
  if (el) {
    el.setAttribute('content', content);
  }
}

export function updateDynamicSeo({
  activeTab,
  city,
  neighborhood,
  searchQuery,
  promotions = [],
}: SeoUpdateParams) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const cleanCity = (city || 'Passo Fundo').trim();
  const cleanNeighborhood = (neighborhood || 'Centro').trim();
  const regionLabel = cleanNeighborhood ? `${cleanNeighborhood}, ${cleanCity}` : cleanCity;

  const baseConfig = TAB_SEO_CONFIG[activeTab]
    ? TAB_SEO_CONFIG[activeTab](regionLabel)
    : TAB_SEO_CONFIG.promocoes(regionLabel);

  const finalTitle =
    searchQuery && searchQuery.trim().length > 0
      ? `Preço de ${searchQuery.trim()} Hoje em ${cleanCity} | RanchoJá Supermercados`
      : baseConfig.title;

  const finalDescription = baseConfig.description;
  const currentOrigin =
    window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : SEO_DEFAULT_DOMAIN;
  const canonicalUrl = `${currentOrigin}${window.location.pathname}`;

  document.title = finalTitle;

  setMetaContent('meta[name="description"]', finalDescription);
  setMetaContent('meta[property="og:title"]', finalTitle);
  setMetaContent('meta[property="og:description"]', finalDescription);
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[name="twitter:title"]', finalTitle);
  setMetaContent('meta[name="twitter:description"]', finalDescription);
  setMetaContent('meta[name="twitter:url"]', canonicalUrl);

  const canonicalEl = document.getElementById('canonical-link');
  if (canonicalEl) {
    canonicalEl.setAttribute('href', canonicalUrl);
  }

  // Update dynamic OfferCatalog / ItemList in JSON-LD so search engines index top daily offers
  const topHighlights = promotions.slice(0, 6);
  if (topHighlights.length > 0) {
    const ldEl = document.getElementById('schema-json-ld');
    if (ldEl) {
      const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'RanchoJá – Ofertas de Supermercado Hoje e Lista de Rancho',
            alternateName: ['RanchoJá', 'Rancho Já Comparador de Supermercados'],
            url: canonicalUrl,
            image: `${currentOrigin}/og-banner.svg`,
            applicationCategory: 'ShoppingApplication',
            operatingSystem: 'All',
            inLanguage: 'pt-BR',
            description: finalDescription,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'BRL',
            },
            areaServed: {
              '@type': 'Place',
              name: `${regionLabel}, Brasil`,
            },
          },
          {
            '@type': 'ItemList',
            name: `Promoções de Supermercado em Destaque Hoje – ${regionLabel}`,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            numberOfItems: topHighlights.length,
            itemListElement: topHighlights.map((item, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              item: {
                '@type': 'Product',
                name: item.name,
                brand: item.brand ? { '@type': 'Brand', name: item.brand } : undefined,
                offers: {
                  '@type': 'AggregateOffer',
                  lowPrice: item.lowestPrice.toFixed(2),
                  highPrice: item.highestPrice.toFixed(2),
                  priceCurrency: 'BRL',
                  offerCount: item.prices.length,
                  seller: {
                    '@type': 'GroceryStore',
                    name: item.cheapestMarket,
                  },
                },
              },
            })),
          },
        ],
      };
      ldEl.textContent = JSON.stringify(structuredData);
    }
  }
}
