# Guia de Correção de Crashes - Job Offers

## 🔧 O Que Foi Corrigido

O app estava crashando ao aceitar ou rejeitar job offers. Implementamos as seguintes correções:

### 1. **Error Handling Robusto** ✅

Todas as funções agora têm error handling completo para prevenir crashes:

- `acceptOffer()` em `hooks/useJobOffers.ts`
- `rejectOffer()` em `hooks/useJobOffers.ts`
- `handleAccept()` em `components/JobNotification.tsx`
- `handleReject()` em `components/JobNotification.tsx`
- `handleAcceptJob()` em `app/(tabs)/map-online.tsx`
- `handleRejectJob()` em `app/(tabs)/map-online.tsx`

### 2. **Logs Detalhados** 🔍

Adicionamos logs extensivos em cada passo para identificar exatamente onde ocorrem problemas:

```
========================================
✅ ACCEPT OFFER STARTED
Offer ID: xxx
Job ID: xxx
========================================
Step 1: Getting authenticated user...
Step 2: Updating job_offers_uk to status=accepted...
Step 3: Updating jobs_uk - assigning to driver...
Step 4: Stopping vibration and timers...
Step 5: Clearing current offer...
========================================
✅ JOB OFFER ACCEPTED SUCCESSFULLY
========================================
```

### 3. **Fallback Mechanisms** 🛡️

Mesmo se algo falhar (vibração, som, animação), a função principal sempre executa:

- Se vibração falhar → continua
- Se som falhar → continua
- Se animação falhar → chama callback diretamente
- Se database update falhar → retorna `false` mas não crasha

## 📊 Estrutura de Dados

### Tabela: `job_offers_uk`

Campos essenciais:
```typescript
{
  id: string;
  job_id: string;
  driver_uid: string;
  status: 'waiting' | 'accepted' | 'rejected' | 'expired';
  collect_address: string;
  collect_latitude: number;
  collect_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  price_driver: number;
  distance: string;
}
```

### Tabela: `jobs_uk`

Campos atualizados no accept:
```typescript
{
  id: string;
  courierid: string | null;  // UUID do motorista
  status: string;             // 'accepted', 'pending', etc
  assigned_at: string;        // Timestamp ISO
}
```

## 🧪 Como Testar

### 1. Inserir Oferta de Teste

Execute no Supabase SQL Editor:

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
    price_driver,
    distance
) VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    'SEU-UID-AQUI'::uuid,
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
    12.50,
    '10.5 km'
);
```

### 2. Verificar Logs Esperados

**Ao clicar em ACCEPT:**

```
========================================
✅ JobNotification - Accept button pressed
========================================
Step 1: Stopping sound...
✅ Sound stopped
Step 2: Canceling vibration...
✅ Vibration canceled
Step 3: Starting animation...
Step 4: Animation complete, calling onAccept...
✅ onAccept called successfully
========================================
📱 MAP-ONLINE: handleAcceptJob called
========================================
Current offer ID: xxx
Current job ID: xxx
========================================
✅ ACCEPT OFFER STARTED
========================================
Step 1: Getting authenticated user...
✅ User authenticated: xxx
Step 2: Updating job_offers_uk to status=accepted...
✅ Offer updated: [...]
Step 3: Updating jobs_uk - assigning to driver...
✅ Job updated: [...]
Step 4: Stopping vibration and timers...
✅ Vibration stopped
✅ Timer cleared
Step 5: Clearing current offer...
✅ Current offer cleared
========================================
✅ JOB OFFER ACCEPTED SUCCESSFULLY
========================================
```

**Ao clicar em REJECT:**

```
========================================
❌ JobNotification - Reject button pressed
========================================
Step 1: Stopping sound...
✅ Sound stopped
Step 2: Canceling vibration...
✅ Vibration canceled
Step 3: Starting animation...
Step 4: Animation complete, calling onReject...
✅ onReject called successfully
========================================
📱 MAP-ONLINE: handleRejectJob called
========================================
Current offer ID: xxx
========================================
🚫 REJECT OFFER STARTED
========================================
Step 1: Getting authenticated user...
✅ User authenticated: xxx
Step 2: Updating job_offers_uk to status=rejected...
✅ Offer updated to rejected: [...]
Step 3: Stopping vibration and timers...
✅ Vibration stopped
✅ Timer cleared
Step 4: Clearing current offer...
✅ Current offer cleared
========================================
🚫 JOB OFFER REJECTED SUCCESSFULLY
========================================
```

## 🚨 Como Identificar Problemas

### Se Ainda Houver Crash

1. **Verifique os Logs**: Os logs detalhados mostrarão exatamente em qual passo o erro ocorreu
2. **Procure por**:
   - `❌ CRITICAL ERROR` - indica onde o erro aconteceu
   - `Error type`, `Error message`, `Error stack` - detalhes do erro
   - Qual "Step" foi o último antes do erro

### Erros Comuns e Soluções

#### Erro: "User not authenticated"
**Solução**: Usuário não está logado. Faça login novamente.

#### Erro: No rows returned
**Solução**:
- Verifique se o `offer_id` existe em `job_offers_uk`
- Verifique se o `job_id` existe em `jobs_uk`
- Verifique se o `driver_uid` corresponde ao usuário logado

#### Erro: RLS policy violation
**Solução**: Verifique as políticas RLS no Supabase:
```sql
-- Permitir drivers atualizarem suas ofertas
CREATE POLICY "Drivers can update their own offers"
ON job_offers_uk
FOR UPDATE
USING (auth.uid() = driver_uid);

-- Permitir aceitar jobs não assignados
CREATE POLICY "Drivers can accept unassigned jobs"
ON jobs_uk
FOR UPDATE
USING (courierid IS NULL);
```

## ✅ Checklist de Verificação

Após as correções, verifique:

- [ ] App não crasha ao aceitar oferta
- [ ] App não crasha ao rejeitar oferta
- [ ] Status em `job_offers_uk` é atualizado corretamente
- [ ] Campo `courierid` em `jobs_uk` é preenchido no accept
- [ ] Campo `assigned_at` em `jobs_uk` é preenchido no accept
- [ ] Vibração para após accept/reject
- [ ] Som para após accept/reject
- [ ] Notificação desaparece após accept/reject
- [ ] Logs aparecem corretamente no console

## 🎯 Próximos Passos

Se o crash persistir após estas correções:

1. **Capture os logs completos** - copie TODOS os logs do console
2. **Identifique o Step exato** onde falha
3. **Verifique o erro específico** nas mensagens de erro
4. **Teste as queries no Supabase** diretamente para verificar permissões

## 📝 Notas Técnicas

### Por que estava crashando?

Possíveis causas identificadas:

1. **Falta de error handling** - Erros não tratados causavam crash do app
2. **Player de áudio** - Tentar pausar player já liberado
3. **Vibration API** - Erros ao cancelar vibração
4. **Database errors** - Problemas de permissão RLS
5. **Null checks** - Falta de verificação de valores nulos

### O que fizemos?

1. ✅ Try-catch em TODAS as operações
2. ✅ Verificações de null/undefined
3. ✅ Fallback callbacks garantem execução
4. ✅ Logs detalhados para debugging
5. ✅ Nunca lançar erros não tratados
6. ✅ Sempre retornar true/false em vez de throw

---

**Data**: 2026-01-13
**Versão**: 1.0
**Status**: ✅ Correções Implementadas
