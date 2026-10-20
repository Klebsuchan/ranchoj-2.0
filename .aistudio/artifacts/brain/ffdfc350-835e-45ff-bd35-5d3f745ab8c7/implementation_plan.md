# RanchoJá 2.0 — Plano de Redesign Visual Completo (Padrão iFood Mobile-First)

Transformação visual completa da interface do **RanchoJá** para uma experiência mobile-first absoluta (`max-w-md mx-auto`), limpa, calorosa e centrada em um foco por tela, preservando 100% da lógica de negócio, estados, chaves de `localStorage` e rotas do servidor.

## User Review & Critical Decisions

> [!IMPORTANT]
> Assim que você clicar em **Proceed**, executarei todas as **Fases 1 a 12** de ponta a ponta (fundação `@theme`, biblioteca de 22 componentes `ui/`, shell do app, redesign das 7 telas, polimento anti-"cara de IA" e validação de build).

- **Ritmo de Execução Confirmado**: Executar todas as Fases 1 a 12 completas de uma só vez.
- **Acesso às Abas Secundárias Confirmado**: Ícones discretos (`IconButton` 44×44 com `aria-label`) para **Orçamento** e **Histórico** diretamente na linha superior do `AppHeader`, ao lado do seletor de localização (`LocationPill`) e do botão de perfil/conta Google.
- **Contrato de Preservação**: Nenhuma função, cálculo, tipo em `src/types.ts`, chave de `localStorage` ou rota em `server.ts` será alterada.

---

## 1. Overview & Core Concept

- **What It Does**: Mantém todos os recursos do comparador de supermercados e gestor de rancho (busca e catálogo em tempo real, preço por kg/L, comparador de embalagens, substitutos econômicos, alertas de preço, leitura por voz, gerador Rancho Pronto em 3 passos, comparador multi-mercado, modo gôndola com PDF/WhatsApp/link curto, mapa Leaflet com GPS ao vivo, consultor financeiro IA e histórico Recharts), vestindo-os com um Design System de consumo diário inspirado no iFood, Mercado Pago e Nubank.
- **Target Audience / Persona**: Pessoas de 15 a 90 anos realizando compras de supermercado pelo celular, exigindo leitura imediata de preços, toques amplos (≥ 44px) e zero jargão técnico.
- **Key Value**: Reduzir a carga cognitiva em todas as 7 rotas, substituindo tabelas densas e múltiplos banners por cards com sombra suave, tipografia tabular rigorosa e fluxos guiados por `BottomSheet`s.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Ofertas (`promocoes`)**: `AppHeader` fixo com busca contextual → barra horizontal `CategoryChips` + `ToggleChip`s de filtro rápido (Essenciais, Abaixo de R$ 10, Promoções, Favoritos, Perto de mim) → carrossel horizontal *"Menores preços de hoje"* (cards de 240px) → feed vertical de `ProductCard`s com preço principal em destaque (`PriceTag`), preço concorrente riscado, `EconomyBadge`, preço por kg/L e ações rápidas (adicionar ao carrinho, ouvir oferta por voz, abrir `BottomSheet` de detalhes com comparador de embalagem, substitutos e alerta de preço).
  2. **Rancho (`rancho`)**: Fluxo guiado com `StepperDots` e uma decisão por passo:
     - *Passo 1*: Escolha do perfil (Solo, Casal, Família) em 3 cards táteis (`min-h-[72px]`).
     - *Passo 2*: Definição do orçamento em input amplo (`text-[24px] font-extrabold tabular-nums`), chips de valores sugeridos e `ToggleChip` de ciclo (15 ou 30 dias).
     - *Passo 3*: 3 estratégias do gerador (*Máxima Economia*, *Mais Próximo de Você*, *Combo Inteligente Dividido*) em cards verticais com `PriceTag`, `EconomyBadge`, resumo de itens, abertura de `BottomSheet` para ajuste fino de quantidades e `PrimaryButton` fixo *"Enviar ao carrinho"*.
  3. **Comparar (`comparador`)**: Resumo do total atual + orçamento com `ProgressBar` → ranking de mercados em cards verticais numerados (1º lugar destacado com `border-save bg-save-soft`), diferença em R$ para o mais barato, indicador visual claro de quando cabe ou passa do teto → card *"Compra dividida"* com economia máxima → CTA *"Levar para o mercado mais barato"*.
  4. **Carrinho / No Mercado (`carrinho`)**: `ToggleChip` no topo alternando entre *Melhor preço por item* e *Mercado único* → itens agrupados por categoria (`ProductCategory`) com `SectionTitle` → linhas `ListItemCheckbox` (`min-h-[56px]`, item marcado aplica `opacity-60` e texto riscado) → barra rápida de adição de item avulso → barra inferior fixa acima da navegação com total comprado/geral em `tabular-nums` e botões para Exportar PDF, Compartilhar (`BottomSheet`) e Restaurar lista anterior.
  5. **Mercados (`mapa`)**: Mapa Leaflet com cantos `rounded-card` ocupando ~55% da altura útil + pill flutuante de distância GPS ao vivo → filtros `ToggleChip` por categoria de loja → lista de mercados ordenada por distância Haversine em km e tempo estimado → `SecondaryButton` *"Cadastrar mercado local"* abrindo formulário em `BottomSheet`.
  6. **Orçamento + Consultor (`orcamento`)**: Topo com 3 `StatPill`s (Gasto atual, Teto, Saldo/Economia) + `ProgressBar` → formulário limpo do `BudgetProfile` em blocos `bg-field rounded-field` → Consultor Financeiro exibindo resultado em dois blocos visuais (*"Dá pra levar"* em `bg-save-soft` e *"Melhor deixar pra próxima"* em `bg-warn-soft` com corte em 1 toque) → carrossel horizontal de dicas do dia.
  7. **Histórico (`historico`)**: Gráfico Recharts de evolução mensal com linha única suave (`stroke: var(--color-brand)`) → comparativo por rede em barras horizontais → cards mensais individuais com total gasto vs. teto, economia e formulário rápido para registrar o mês atual.

- **Visual Identity & Theme**:
  - **Tokens `@theme` (Tailwind v4)**:
    - Superfícies: `--color-canvas: #f8f9fa`, `--color-surface: #ffffff`, `--color-field: #f1f3f5`.
    - Texto: `--color-ink: #263238`, `--color-ink-soft: #546e7a`, `--color-ink-muted: #90a4ae`.
    - Semântica e Marca: `--color-brand: #ea1d2c`, `--color-brand-hover: #c81b25`, `--color-brand-soft: #fdecee`, `--color-save: #00a86b`, `--color-save-soft: #e6f6ee`, `--color-warn: #f5a623`, `--color-warn-soft: #fef4e3`, `--color-danger: #e5484d`, `--color-danger-soft: #fdeaea`.
    - Geometria e Elevação: `--radius-card: 1.25rem`, `--radius-field: 1rem`, `--radius-pill: 9999px`, `--shadow-card: 0 2px 8px rgba(0,0,0,0.05)`, `--shadow-float: 0 8px 24px rgba(0,0,0,0.10)`, `--shadow-nav: 0 -1px 0 rgba(0,0,0,0.04)`.
  - **Tipografia**: Fonte única `Plus Jakarta Sans` (400 a 800) com escala fechada (`22px` números de destaque, `17px` título de seção, `15px` nome de produto, `14px` corpo, `12px` metadado, `11px` tab label) e `tabular-nums` obrigatório em todos os valores monetários.
  - **Disciplina Anti-"Cara de IA"**: Zero emojis na interface, zero gradientes decorativos, zero spinners centrais (uso exclusivo de `SkeletonCard` / `SkeletonList`), zero jargão técnico exposto e copy direta de varejo brasileiro.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Coluna Única Mobile-First Absoluta (`max-w-md mx-auto`)**
  - *Chosen Approach*: Tanto no celular quanto no desktop, o app é renderizado em uma coluna central de 448px (`max-w-md mx-auto`) sobre o fundo `bg-canvas`, com `AppHeader` sticky no topo e `BottomNav` fixa na base.
  - *Why*: Garante fidelidade 100% ao padrão de aplicativo nativo de delivery/varejo e ergonomia de polegar consistente sem quebras de layout.
- **Decision 2: Substituição de Modais Centrais e Tabelas por `BottomSheet`s e `ProductCard`s**
  - *Chosen Approach*: Os detalhes avançados de cada produto (comparador de embalagens, explorador de substitutos, alerta de preço) e os diálogos de compartilhamento, perfil e confirmação de exclusão passam a abrir em `BottomSheet` deslizante na base da tela.
  - *Why*: Mantém o feed principal limpo (1 foco por tela) enquanto preserva 100% das ferramentas analíticas a um toque do polegar.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     App.tsx (State & Persistence Core)                     │
│  profile | shoppingList | promotions | userProfile | history | activeTab   │
└──────┬──────────────────────────────┬───────────────────────────────┬──────┘
       │                              │                               │
       ▼                              ▼                               ▼
┌────────────────────┐   ┌──────────────────────────┐   ┌────────────────────┐
│   App Shell (ui/)  │   │  7 Route Views (Domain)  │   │ BottomSheets (ui/) │
│  • AppHeader       │   │  • Ofertas (Feed+Carous) │   │  • PackageCompare  │
│  • SearchBar       │   │  • Rancho (3-Step Wizard)│   │  • Substitutes     │
│  • PageScaffold    │   │  • Comparar (Rank Cards) │   │  • PriceAlerts     │
│  • BottomNav       │   │  • Carrinho (Gôndola)    │   │  • ShareRancho     │
│  • Toast           │   │  • Mercados (Map+Cards)  │   │  • UserProfile     │
│                    │   │  • Orçamento (Advisor)   │   │  • ClearConfirm    │
│                    │   │  • Histórico (Recharts)  │   │                    │
└────────────────────┘   └────────────┬─────────────┘   └────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               Primitive Design System Library (src/components/ui/)         │
│  CategoryChips | SectionTitle | ProductCard | PriceTag | EconomyBadge      │
│  PrimaryButton | SecondaryButton | IconButton | ToggleChip | ProgressBar   │
│  ListItemCheckbox | StatPill | StepperDots | SkeletonCard/List | EmptyState│
└────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

- **`AppHeader` & `BottomNav`**: Controlam `activeTab` (`promocoes`, `rancho`, `comparador`, `carrinho`, `mapa`, mais os atalhos de topo para `orcamento` e `historico`), abrem o `UserProfileModal` ao tocar no `LocationPill` ou no botão Google Auth, e sincronizam a busca global com a aba ativa.
- **Feed de Ofertas (`PromotionsTable`)**: Filtra `promotions` por categoria, busca textual e chips rápidos; renderiza `SkeletonList` quando `isLoading === true` e `EmptyState` com reset de filtros quando a busca não retorna itens; aciona `onAddToRancho`, `onUpdateQuantity`, síntese de voz (`window.speechSynthesis`) e abre os `BottomSheet`s de embalagem, substitutos e alertas.
- **Wizard de Rancho (`RanchoProntoSelector`)**: Navega pelos passos `1 → 2 → 3` via `StepperDots`, recalcula em tempo real as 3 opções de `generateRanchoProntoOptions`, permite editar quantidades ou excluir itens no `BottomSheet` de detalhes e dispara `onApplyRancho` levando o usuário ao carrinho.
- **Comparador (`MarketComparisonSummary`)**: Calcula o total da `shoppingList` em cada rede + compra dividida, exibe `ProgressBar` contra `budgetLimit` e aplica o mercado mais barato com 1 clique navegando para `carrinho`.
- **Modo Gôndola (`SingleMarketShoppingMode`)**: Agrupa `shoppingList` por `ProductCategory`, alterna `isBought` via `ListItemCheckbox`, adiciona itens avulsos ou do catálogo, exporta PDF via `generateRanchoPdf` e abre o `ShareRanchoModal` em `BottomSheet`.
