# Sistema Completo de Ofertas de Jobs

## ✅ Funcionalidades Implementadas

### 1. Realtime Notifications System
- ✅ Hook `useJobOffers` escuta a tabela `job_offers_uk`
- ✅ Filtra por `driver_uid` do usuário logado
- ✅ Mostra apenas ofertas com `status='waiting'`
- ✅ Vibração automática quando oferta chega
- ✅ Timer de 45 segundos para auto-rejeição

### 2. Verificação de Ofertas Existentes
- ✅ Ao abrir o app, verifica se há ofertas pendentes
- ✅ Se houver oferta com `status='waiting'` não expirada, mostra automaticamente
- ✅ Polling a cada 30 segundos para verificar novas ofertas

### 3. Redirecionamento Automático
- ✅ Quando oferta chega, usuário é redirecionado para a aba "Map"
- ✅ Notificação aparece sobre o mapa
- ✅ Ofertas só aparecem quando o driver está online

### 4. Visualização no Mapa
- ✅ Marcador verde: ponto de coleta
- ✅ Marcador vermelho: ponto de entrega
- ✅ Linha azul: rota calculada entre os pontos
- ✅ Mapa ajusta automaticamente para mostrar ambos os pontos
- ✅ Integração com Google Maps Directions API

### 5. Aceitação de Job
Quando o driver aceita:
- ✅ `job_offers_uk.status` = 'accepted'
- ✅ `jobs_uk.courierid` = user.id
- ✅ `jobs_uk.status` = 'accepted'
- ✅ `jobs_uk.assigned_at` = timestamp atual
- ✅ Job aparece na aba "Jobs"

### 6. Rejeição de Job
Quando o driver rejeita:
- ✅ `job_offers_uk.status` = 'rejected'
- ✅ Notificação desaparece
- ✅ Vibração para

### 7. Tela de Jobs
- ✅ Mostra apenas jobs onde `courierid = user.id` AND `status = 'accepted'`
- ✅ Ordena por `assigned_at` (mais recente primeiro)
- ✅ Exibe detalhes completos do job

## 📁 Arquivos Principais

### Hooks
- **[hooks/useJobOffers.ts](hooks/useJobOffers.ts)** - Hook principal de gerenciamento de ofertas

### Telas
- **[app/(tabs)/map-online.tsx](app/(tabs)/map-online.tsx)** - Tela do mapa com notificações e rota
- **[components/JobsScreen.tsx](components/JobsScreen.tsx)** - Tela de jobs aceitos

### Configuração
- **[config/maps.ts](config/maps.ts)** - Configuração da Google Maps API
- **[SETUP-GOOGLE-MAPS.md](SETUP-GOOGLE-MAPS.md)** - Guia de configuração

### SQL
- **[CREATE-job-offers-uk-CORRECT.sql](CREATE-job-offers-uk-CORRECT.sql)** - Criação da tabela com índices
- **[ENABLE-REALTIME.sql](ENABLE-REALTIME.sql)** - Habilitar Realtime
- **[INSERT-TEST-OFFER.sql](INSERT-TEST-OFFER.sql)** - Script de teste

## 🔧 Configuração Necessária

### 1. Google Maps API Key

Você precisa adicionar sua chave da Google Maps API:

1. Crie um arquivo `.env` na raiz do projeto:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

2. Ou edite `config/maps.ts`:
```typescript
export const GOOGLE_MAPS_API_KEY = 'SUA_CHAVE_AQUI';
```

Veja [SETUP-GOOGLE-MAPS.md](SETUP-GOOGLE-MAPS.md) para instruções detalhadas.

### 2. Supabase Realtime

Execute no Supabase SQL Editor:

```sql
-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE job_offers_uk;
```

E no Dashboard:
- Database > Replication
- Marque `job_offers_uk`
- Clique em Save

## 🧪 Como Testar

### Teste 1: Inserir Oferta Manualmente

```sql
INSERT INTO job_offers_uk (
    job_id,
    driver_uid,
    status,
    expires_at,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_time_after,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_time_before,
    price_driver
) VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid, -- Substitua pelo seu UID
    'waiting',
    NOW() + INTERVAL '10 minutes',
    '103 Middleton St, Glasgow G51 1SQ, UK',
    55.8529372,
    -4.2990195,
    'ASAP (Next 60 min)',
    '17 Bruce St, Clydebank G81 1TT, UK',
    55.9002114,
    -4.4063518,
    '15:00',
    12.50
);
```

### Teste 2: Verificar Logs

Você deve ver no console:

```
📡 Setting up realtime subscription for job_offers_uk
✅ Successfully subscribed to job_offers_uk channel!
⏰ Setting up 30-second polling...

🚨🚨🚨 REALTIME EVENT DETECTED! 🚨🚨🚨
📨 Realtime INSERT received: {...}
✅ Status is waiting, processing offer...
🔔 New job offer received: <id>
✅ Setting current offer with all details
🔔 Starting vibration...
⏰ Starting 45-second timer...
🗺️ Calculating route...
✅ Route calculated successfully
```

### Teste 3: Verificar Mapa

Quando oferta chega:
- ✅ App muda automaticamente para aba "Map"
- ✅ Marcador verde (coleta) aparece
- ✅ Marcador vermelho (entrega) aparece
- ✅ Linha azul conectando os pontos
- ✅ Mapa ajusta para mostrar ambos

### Teste 4: Aceitar Job

1. Clique em "Accept" na notificação
2. Verifique no banco:
```sql
SELECT courierid, status, assigned_at FROM jobs_uk WHERE id = 'job-id';
```
3. Vá para aba "Jobs" - o job deve aparecer

## 📊 Fluxo Completo

```
1. Backend/Admin cria oferta
   ↓
2. INSERT em job_offers_uk
   driver_uid: <driver-id>
   status: 'waiting'
   ↓
3. Realtime detecta INSERT
   ↓
4. Hook verifica: driver_uid matches? status='waiting'?
   ↓
5. App redireciona para "Map"
   ↓
6. Mostra marcadores + rota no mapa
   ↓
7. Notificação aparece + vibração
   ↓
8. Driver decide:

   ACCEPT:                    REJECT:
   - job_offers_uk.status     - job_offers_uk.status
     = 'accepted'               = 'rejected'
   - jobs_uk.courierid        - Notificação some
     = driver.id
   - jobs_uk.status
     = 'accepted'
   - jobs_uk.assigned_at
     = NOW()
   - Aparece em "Jobs"
```

## 🔍 Troubleshooting

### Notificação não aparece
1. Verifique se Realtime está habilitado
2. Verifique logs: `📡 Successfully subscribed`
3. Confirme que `status='waiting'` e `driver_uid` correto

### Rota não aparece
1. Adicione Google Maps API Key
2. Habilite Directions API
3. Verifique coordenadas válidas

### Jobs não aparecem na aba "Jobs"
1. Confirme que `status='accepted'` em `jobs_uk`
2. Confirme que `courierid` = user.id

## ✨ Recursos Extras

- 🔔 Vibração a cada 2 segundos
- ⏰ Auto-rejeição após 45 segundos
- 🔄 Polling a cada 30 segundos
- 📍 Ajuste automático do mapa
- 🗺️ Cálculo de rota em tempo real

Sistema 100% funcional! 🎉
