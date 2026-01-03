# Driver App - Roadmap & Development Progress

## 📱 Visão Geral do Projeto
Aplicativo mobile híbrido (iOS/Android) para motoristas, desenvolvido com Expo e React Native, similar ao Uber Driver.

---

## ✅ Concluído

### 1. Configuração Inicial do Projeto
- [x] Projeto Expo configurado com TypeScript
- [x] Expo Router implementado para navegação
- [x] Configuração de permissões de localização (foreground + background)
- [x] Google Maps integrado (iOS e Android)
- [x] Fonte Poppins configurada em todo o app
- [x] Safe areas configuradas para dispositivos modernos

**Arquivos:**
- `app.json` - Configurações do Expo, permissões, plugins
- `package.json` - Dependências do projeto

---

### 2. Autenticação - Tela de Login
**Arquivo:** `app/login.tsx`

**Features Implementadas:**
- [x] Logo grande e centralizado (960x342px)
- [x] Campos de input para email e password
- [x] Botão de login com estilo arredondado
- [x] Link "Forgot password? Click here" com navegação
- [x] Design minimalista com fundo branco
- [x] KeyboardAvoidingView para iOS/Android
- [x] Navegação para tela principal após login

**Navegação:**
- Login bem-sucedido → `/(tabs)` (tela principal)
- Forgot password → `/recover-password`

---

### 3. Recuperação de Senha
**Arquivo:** `app/recover-password.tsx`

**Features Implementadas:**
- [x] Design consistente com tela de login
- [x] Logo grande mantida
- [x] Campo único para email
- [x] Botão "Recover Password"
- [x] Mesma identidade visual da tela de login

---

### 4. Navegação Principal
**Arquivo:** `app/_layout.tsx`

**Configuração:**
- [x] Stack Navigator configurado
- [x] Rota inicial: `login`
- [x] Headers desabilitados em todas as telas
- [x] Rotas configuradas: login, recover-password, (tabs), modal

**Arquivo:** `app/(tabs)/_layout.tsx`

**Configuração:**
- [x] Tab Navigator com barra oculta (custom bottom nav)
- [x] Tabs: index, explore

---

### 5. Tela Principal - Estado OFFLINE
**Arquivo:** `app/(tabs)/index.tsx`

**Features Implementadas:**

#### 5.1 Header do Perfil
- [x] Avatar circular (80x80px) com ícone de pessoa
- [x] Nome do motorista: "Jhon Steven"
- [x] Sistema de avaliação: 5 estrelas douradas
- [x] Pontuação: "1250 points / jobs"
- [x] Espaçamento otimizado do topo (70px top, 30px bottom)

#### 5.2 Status Badge
- [x] Badge "OFFLINE" em formato pill
- [x] Borda preta quando offline
- [x] Borda verde quando online
- [x] Centralizado horizontalmente
- [x] Espaçamento de 30px do perfil e do mapa

#### 5.3 Mapa Estático
- [x] Google Maps integrado
- [x] Localização do usuário rastreada (always permission)
- [x] Mapa travado (sem zoom, sem rotação, sem scroll)
- [x] Marker customizado na posição do usuário
- [x] Altura: 38% da tela
- [x] Border radius: 20px
- [x] Sombras e elevação para profundidade

#### 5.4 Swipe to Go Online
- [x] Largura: 85% da tela
- [x] Altura: 70px
- [x] Botão circular preto (56x56px) com ícone de setas
- [x] Texto dinâmico: "OFFLINE" → "ONLINE"
- [x] Background verde progressivo durante o swipe
- [x] Threshold: 75% para completar
- [x] Animação suave (200ms timing)
- [x] Snap back se soltar antes de 75%
- [x] Completa automaticamente se passar de 75%
- [x] PanResponder para gestos

**Comportamento do Swipe:**
```
Drag < 75% → Volta para início (fica OFFLINE)
Drag ≥ 75% → Completa animação (vai para ONLINE)
```

#### 5.5 Bottom Navigation
- [x] Fixo na parte inferior (absolute positioning)
- [x] 4 itens: MAP, JOBS, BOARD, PROFILE
- [x] Item ativo: MAP (fundo cinza claro, texto preto)
- [x] Itens inativos: cinza médio
- [x] Sem scroll na tela (contentWrapper ao invés de ScrollView)
- [x] Padding bottom: 100px no conteúdo para não sobrepor

**Espaçamentos:**
- Margens laterais: 20px
- Profile → Status: 30px
- Status → Mapa: 30px
- Mapa → Swipe: 30px
- Swipe → Bottom Nav: 16px

---

### 6. Tela Principal - Estado ONLINE
**Arquivo:** `app/(tabs)/map-online.tsx`

**Features Implementadas:**

#### 6.1 Top Bar
- [x] Badge "ONLINE" (branco com borda verde)
- [x] Posicionado à esquerda
- [x] Switch de status à direita (verde quando ON)
- [x] Ao desligar switch → volta para tela OFFLINE
- [x] Position absolute no topo (top: 60px)
- [x] Z-index: 10 para ficar acima do mapa

#### 6.2 Mapa Full Screen Customizado
- [x] Ocupa toda a tela (do topo ao bottom nav)
- [x] Estilo vetorial customizado:
  - Ruas principais: laranja escuro (#FF9800)
  - Ruas secundárias: laranja claro (#FFB74D)
  - Quadras/prédios: cinza claro (#E0E0E0, #EEEEEE)
  - Áreas verdes: verde claro (#C8E6C9)
  - Água: azul claro (#B3E5FC)
- [x] Sem labels ou textos visíveis
- [x] Zoom e scroll habilitados
- [x] Rotação habilitada

#### 6.3 Pin do Motorista
- [x] Círculo preto (40x40px)
- [x] Ponto interno amarelo (16x16px)
- [x] Centralizado na posição do usuário
- [x] Sem sombras exageradas
- [x] Design minimalista

#### 6.4 Bottom Navigation
- [x] Fundo cinza claro (#F5F5F5)
- [x] 4 itens: MAP, JOBS, BOARD, PROFILE
- [x] Item ativo: PROFILE (texto preto)
- [x] Itens inativos: cinza médio (#666666)
- [x] Mesmo estilo da tela offline

**Transição entre Estados:**
```
OFFLINE → ONLINE: Swipe completo (≥75%)
ONLINE → OFFLINE: Toggle do switch
```

---

## 🎨 Design System

### Cores
- **Primária:** `#000000` (Preto)
- **Secundária:** `#00C853` (Verde - Online)
- **Background:** `#FFFFFF` (Branco)
- **Cinza Claro:** `#F0F0F0`, `#F5F5F5`, `#E5E5E5`
- **Cinza Médio:** `#666666`, `#999999`
- **Texto:** `#000000`, `#333333`
- **Estrelas:** `#FFD700` (Dourado)
- **Mapa - Ruas:** `#FF9800`, `#FFB74D` (Laranja)
- **Mapa - Verde:** `#C8E6C9`
- **Mapa - Água:** `#B3E5FC`
- **Pin Motorista:** `#FFD700` (Amarelo)

### Tipografia
- **Fonte:** Poppins (em todo o app)
- **Tamanhos:**
  - Título: 18px (peso 600)
  - Botões: 15-16px (peso 700)
  - Labels: 10-13px (peso 600)
  - Texto pequeno: 11px

### Espaçamentos
- **Margens laterais:** 20px
- **Padding vertical:** 20-30px entre seções
- **Border radius:**
  - Botões: 26-35px (totalmente arredondados)
  - Cards: 20px
  - Badges: 20-24px

### Componentes

#### Avatar
- Tamanho: 80x80px
- Border radius: 40px
- Background: #E5E5E5
- Ícone: 44px

#### Badges
- Altura: variável
- Padding horizontal: 20-28px
- Padding vertical: 8-10px
- Border width: 1.5-2px

#### Swipe Button
- Tamanho: 56x56px
- Border radius: 28px
- Background: #000000
- Ícone: 28px

#### Bottom Navigation
- Altura total: ~60px (12px top + 24px bottom + 24px ícone)
- Ícones: 24px
- Labels: 10px

---

## 📂 Estrutura de Arquivos

```
driver-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Layout das tabs (barra oculta)
│   │   ├── index.tsx             # Tela principal (OFFLINE/ONLINE switch)
│   │   ├── map-online.tsx        # Tela de mapa quando ONLINE
│   │   └── explore.tsx           # (Existente, não usado)
│   ├── _layout.tsx               # Layout raiz (Stack Navigator)
│   ├── login.tsx                 # Tela de login
│   ├── recover-password.tsx      # Tela de recuperação de senha
│   └── modal.tsx                 # (Existente, não usado)
├── assets/
│   └── images/
│       └── logo.png              # Logo do app (960x342px)
├── app.json                      # Configurações Expo
├── package.json                  # Dependências
└── ROADMAP.md                    # Este arquivo
```

---

## 🔧 Configurações Técnicas

### Permissões (app.json)

#### iOS (infoPlist)
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`

#### Android (permissions)
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`

### Plugins
- `expo-router`
- `expo-splash-screen`
- `expo-font`
- `expo-location` (com background habilitado)

### Experiments
- `typedRoutes: true`
- `reactCompiler: true`

---

## 🚀 Funcionalidades Principais

### Localização
- ✅ Permissão foreground (quando app está em uso)
- ✅ Permissão background (sempre - para tracking)
- ✅ Fallback para localização padrão (NYC) se permissão negada
- ✅ Watch position (atualiza a cada 5s ou 10m de distância)
- ✅ Accuracy: High

### Navegação
- ✅ Stack Navigator (login → tabs)
- ✅ Tab Navigator (custom bottom nav)
- ✅ Transição entre estados OFFLINE/ONLINE
- ✅ Headers desabilitados em todas as telas

### Animações
- ✅ Swipe to online (PanResponder + Animated)
- ✅ Fade in/out de textos OFFLINE/ONLINE
- ✅ Background verde progressivo
- ✅ Timing animation (200ms)

---

## 📋 Próximos Passos (To-Do)

### Alta Prioridade
- [ ] Implementar tela JOBS (lista de trabalhos disponíveis)
- [ ] Implementar tela BOARD (quadro de atividades)
- [ ] Implementar tela PROFILE (perfil do motorista)
- [ ] Adicionar API key real do Google Maps no app.json
- [ ] Implementar lógica de autenticação real (API backend)
- [ ] Adicionar validação de formulários (login/recover)

### Média Prioridade
- [ ] Sistema de notificações para novos jobs
- [ ] Chat/mensagens com clientes
- [ ] Histórico de corridas
- [ ] Earnings/ganhos do motorista
- [ ] Sistema de rating/avaliações
- [ ] Modo escuro (dark mode)

### Baixa Prioridade
- [ ] Onboarding para novos usuários
- [ ] Tutorial do swipe
- [ ] Animações de transição entre telas
- [ ] Splash screen customizada
- [ ] Deep linking
- [ ] Push notifications

---

## 🐛 Problemas Resolvidos

### 1. Swipe parando no meio
**Problema:** Swipe travava em ~50% do caminho
**Solução:** Ajuste do threshold e uso de Math.max/Math.min no PanResponder

### 2. Permissões de localização iOS
**Problema:** Erro de NSLocation*UsageDescription
**Solução:** Adicionadas todas as 3 chaves no infoPlist

### 3. Scroll indesejado na tela principal
**Problema:** Tela rolava verticalmente
**Solução:** Substituído ScrollView por View com paddingBottom fixo

### 4. Bottom navigation não fixo
**Problema:** Menu subia com o conteúdo
**Solução:** Position absolute + paddingBottom no contentWrapper

### 5. Animação do swipe muito "pulada"
**Problema:** Spring animation muito bouncy
**Solução:** Mudado para Animated.timing com duration 200ms

---

## 📊 Métricas do Projeto

- **Telas implementadas:** 4 (login, recover, offline, online)
- **Componentes customizados:** 6 (avatar, badge, swipe, marker, navigation, switch)
- **Linhas de código (aprox.):** ~1200
- **Dependências principais:** expo, react-native, expo-router, expo-location, react-native-maps
- **Plataformas suportadas:** iOS, Android
- **Status:** MVP funcional ✅

---

## 🔄 Fluxo de Navegação Atual

```
App Start
   ↓
Login Screen
   ↓ (login success)
Tabs Layout (index)
   ↓
Offline Screen (profile, map, swipe)
   ↓ (swipe ≥ 75%)
Online Screen (full map, switch)
   ↓ (toggle switch)
Offline Screen (volta ao início)
```

---

## 💡 Decisões Técnicas

### Por que Expo?
- Setup rápido e fácil
- Gerenciamento de permissões simplificado
- Hot reload
- Build nativa facilitada

### Por que Expo Router?
- File-based routing
- Type-safe navigation
- Suporte a deep linking nativo
- Melhor DX que React Navigation puro

### Por que PanResponder?
- Controle fino sobre gestos
- Animações customizadas
- Melhor performance que libs third-party

### Por que Google Maps?
- Customização avançada (customMapStyle)
- Melhor performance
- Dados mais atualizados

---

## 📝 Notas de Desenvolvimento

### Assets Necessários
- ✅ Logo (960x342px) - `assets/images/logo.png`
- ⏳ Ícones do app (iOS/Android)
- ⏳ Splash screen customizada
- ⏳ Imagens para onboarding

### Variáveis de Ambiente
- ⏳ `GOOGLE_MAPS_API_KEY` (atualmente placeholder)
- ⏳ `API_BASE_URL` (backend)
- ⏳ `AUTH_TOKEN_KEY` (storage)

### Testes
- ⏳ Unit tests
- ⏳ Integration tests
- ⏳ E2E tests
- ⏳ Testes em dispositivos físicos (iOS/Android)

---

## 👥 Informações do Projeto

**Desenvolvedor:** Lucas
**Início:** Janeiro 2026
**Status:** Em Desenvolvimento
**Versão Atual:** 1.0.0 (MVP)

---

**Última atualização:** 03/01/2026
