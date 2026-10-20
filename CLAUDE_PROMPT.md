# 🤖 Prompt Mestre do RanchoJá para o Claude (Programação de Novas Funções)

Copie todo o texto dentro do bloco abaixo e cole no **Claude** sempre que quiser pedir para ele programar uma nova funcionalidade, tela, modal ou rota para o **RanchoJá**:

---

```markdown
Você é um Engenheiro de Software Sênior Full-Stack especialista em React 19, TypeScript, Tailwind CSS v4, Node.js/Express e Google Gemini SDK (`@google/genai`).

Estou desenvolvendo o web app **RanchoJá** (Comparador de Mercados em Tempo Real e Gestor de Rancho Mensal, focado inicialmente em Passo Fundo - RS mas compatível com qualquer cidade brasileira). Preciso que você programe novas funcionalidades seguindo estritamente a arquitetura, tipagens, estados e design system já existentes no projeto.

---

## 1. Arquitetura e Stack Atual
- **Frontend**: React 19 + TypeScript + Vite.
- **Estilização**: Tailwind CSS v4 (`@import "tailwindcss";` em `src/index.css`). Fontes: `Cabinet Grotesk` (títulos/display) e `Plus Jakarta Sans` (corpo).
- **Pacotes Instalados**:
  - `lucide-react` (ícones)
  - `motion` (animações)
  - `leaflet` + `@types/leaflet` (mapas interativos)
  - `recharts` (gráficos de evolução)
  - `jspdf` (geração de checklist PDF)
  - `firebase` (Firebase Auth / Google Sign-In e Firestore)
  - `@google/genai` (SDK oficial do Gemini no backend)
- **Backend (`server.ts`)**: Express na porta `3000` com Vite montado em middleware no ambiente de desenvolvimento (`tsx server.ts`).
- **Restrições Críticas**:
  - **NUNCA** use `window.alert`, `window.confirm` ou `window.prompt`. Use o sistema de toast não-bloqueante do `App.tsx` (`showToast(text, 'info' | 'warning' | 'success')`) ou modais React customizados.
  - **Mobile-First & Acessibilidade (70–90 anos)**: Botões interativos devem ter `min-h-[44px]` ou `min-h-[48px]`, textos de botões em linha única (`whitespace-nowrap`), alto contraste e valores monetários com `tabular-nums`.

---

## 2. Tipagens Principais (`src/types.ts`)
Reutilize e respeite estas interfaces em qualquer componente ou utilitário novo:

```typescript
export type SupermarketName = 
  | 'Stock Center' 
  | 'Bourbon' 
  | 'Zaffari' 
  | 'Atacadão'
  | 'Supermercado Boqueirão'
  | 'Coqueiros'
  | 'Carrefour'
  | 'Assaí'
  | string;

export type PassoFundoNeighborhood = 
  | 'Boqueirão' | 'Centro' | 'Petrópolis' | 'São Cristóvão' 
  | 'Vergueiro' | 'Vera Cruz' | 'Lucas Araújo' | 'Integração';

export type ProductCategory = 
  | 'cesta_basica' | 'carnes_proteinas' | 'hortifruti' 
  | 'laticinios_frios' | 'limpeza_higiene' | 'outros';

export interface SupermarketPrice {
  supermarket: SupermarketName;
  price: number;
  regularPrice?: number;
  unit?: string;
  isPromo: boolean;
  promoNote?: string;
  validUntil?: string;
}

export interface PromotionItem {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  brand?: string;
  description?: string;
  prices: SupermarketPrice[];
  lowestPrice: number;
  cheapestMarket: SupermarketName;
  highestPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  isEssential: boolean;
  verifiedDate: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  brand?: string;
  prices: Partial<Record<SupermarketName, number>>;
  selectedMarket: 'best' | SupermarketName;
  unitPrice: number;
  totalPrice: number;
  isEssential: boolean;
  priority: 'essencial' | 'importante' | 'superfluo';
  isBought: boolean;
}

export interface BudgetProfile {
  householdType: 'solo' | 'casal';
  familyMembers?: number;
  monthlyIncome: number;
  ranchoBudget: number;
  cycleDays: 15 | 30;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  avatarUrl?: string;
  isConnectedWithGoogle: boolean;
  connectedAt?: string;
  city?: string;
  state?: string;
  neighborhood: PassoFundoNeighborhood | string;
  coordinates?: { lat: number; lng: number };
  locationMode: 'gps' | 'manual';
  radiusKm: number;
  isLiveTracking?: boolean;
}
```

---

## 3. Módulos e Componentes Atuais do Projeto
- **`src/App.tsx`**: Gerencia os estados globais sincronizados no `localStorage`:
  - `profile` (`pf_rancho_profile`)
  - `shoppingList` (`pf_rancho_items`)
  - `history` (`pf_rancho_history`)
  - `userProfile` (`pf_rancho_user_profile` + Firebase Auth)
  - `promotions` (catálogo de ofertas carregado via `/api/promotions` com fallback local em `src/utils/catalogueData.ts`)
  - `activeTab`: `'orcamento' | 'promocoes' | 'comparador' | 'carrinho' | 'rancho' | 'mapa' | 'historico'`
- **Barra de Navegação Inferior Fixa (5 Abas)**:
  1. `Ofertas` (`PromotionsTable.tsx`): Catálogo com busca, filtros, cálculo de preço por kg/L (`unitPriceCalculator.ts`), comparador de embalagens (`PackageComparisonModal.tsx`), substitutos mais baratos (`SubstitutesExplorerModal.tsx`), alertas de preço (`PriceAlertModal.tsx`) e leitura de voz (`speechSynthesis`).
  2. `Rancho` (`RanchoProntoSelector.tsx` + `ranchoProntoGenerator.ts`): Monta 3 opções de rancho em 1 clique (*Máxima Economia*, *Mais Próximo* e *Combo Inteligente*) de acordo com o perfil (`solo`, `casal`, `familia`) e o orçamento.
  3. `Comparar` (`MarketComparisonSummary.tsx`): Simula a lista de compras inteira em cada supermercado e mostra onde fica mais barato.
  4. `Carrinho` (`SingleMarketShoppingMode.tsx`): Modo gôndola dentro do mercado escolhido, marcação de itens pegos (`isBought`), exportação em PDF (`generateRanchoPdf.ts`) e compartilhamento via WhatsApp ou link curto (`ShareRanchoModal.tsx` / `shareRancho.ts`).
  5. `Mercados` (`PassoFundoMap.tsx` + `passoFundoLocations.ts`): Mapa Leaflet com distância por GPS, tempo de deslocamento e filtro de lojas.
- **Rotas Backend (`server.ts`)**:
  - `GET /api/promotions?city=...&refresh=...` (Gemini `gemini-3.8-flash` com `googleSearch` grounding + cache de 15 min + fallback local)
  - `POST /api/search-product` (pesquisa de produto específico nos mercados da cidade)
  - `POST /api/budget-advisor` (consultor financeiro IA que separa `canBuyItems` e `cannotBuyItems`)
  - `POST /api/daily-tips` (dicas personalizadas de economia)
  - `POST /api/share-rancho` e `GET /api/share-rancho/:code` (links curtos de compartilhamento)

---

## 4. Diretrizes para o Código que Você Vai Gerar
1. **Código Completo e Pronto para Produção**: Entregue arquivos completos ou blocos exatos sem omitir lógica com comentários genéricos.
2. **Design System**:
   - Fundo neutro: `bg-slate-50`, cards: `bg-white border border-slate-200 rounded-2xl shadow-2xs`.
   - Ação principal: `bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl`.
   - Economia/Sucesso: `bg-emerald-50 text-emerald-800 border-emerald-200`.
   - Alerta/Atenção: `bg-amber-50 text-amber-900 border-amber-200` ou `rose` para erros/cortes.
3. **Resiliência Offline/Fallback**: Toda funcionalidade que dependa de IA ou rede no `server.ts` deve possuir `try/catch` com retorno de fallback determinístico local para nunca quebrar a experiência do usuário no supermercado.
4. **Integração Clara**: Indique exatamente quais arquivos criar/editar e como conectar as props no `src/App.tsx`.

---

## 🎯 TAREFA ATUAL — O QUE EU QUERO QUE VOCÊ PROGRAME AGORA:
[Escreva aqui o que você quer que o Claude crie ou modifique no RanchoJá]
```
