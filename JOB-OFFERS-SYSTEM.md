# Sistema de Ofertas de Jobs em Tempo Real

## 📋 Visão Geral

O sistema permite que drivers recebam ofertas de jobs em tempo real, com notificações visuais, sonoras e vibratórias, e tenham 45 segundos para aceitar ou rejeitar.

## 🔄 Fluxo Completo

### 1. Backend envia oferta
```sql
INSERT INTO job_offers (job_id, driver_uid, status, expires_at)
VALUES ('job-123', 'driver-uid', 'pending', NOW() + INTERVAL '45 seconds');
```

### 2. App recebe via Realtime
- Listener detecta INSERT na tabela `job_offers`
- Filtra apenas ofertas para o driver logado (`driver_uid = auth.uid()`)

### 3. Notificação Dispara
✅ **Visual**: JobNotification aparece na tela
✅ **Vibração**: Padrão de vibração a cada 2 segundos
✅ **Timer**: Countdown de 45 segundos inicia

### 4. Driver Responde

#### Aceitou ✅
```typescript
// App faz:
await acceptOffer(offerId, jobId);

// Que executa:
1. UPDATE job_offers SET status='accepted' WHERE id=offerId
2. UPDATE jobs_uk SET courierid=driver_uid, status='assigned'
   WHERE id=job_id AND courierid IS NULL
```

**Importante**: O `courierid IS NULL` garante que apenas 1 driver pegue o job (optimistic locking)

#### Recusou ❌
```typescript
// App faz:
await rejectOffer(offerId);

// Que executa:
UPDATE job_offers SET status='rejected' WHERE id=offerId
```

### 5. Auto-Rejeição ⏰
Se 45 segundos passarem sem resposta:
```typescript
// Timer automático executa:
await rejectOffer(offerId);
```

### 6. Expiração por Cron (backup)
Se o cron marcar como expirado:
```sql
UPDATE job_offers SET status='expired'
WHERE expires_at < NOW() AND status='pending';
```

O app detecta via realtime UPDATE e fecha a notificação.

## 🗂️ Estrutura da Tabela job_offers

```sql
CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs_uk(id),
  driver_uid UUID NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índice para busca rápida
CREATE INDEX idx_job_offers_driver_status
ON job_offers(driver_uid, status)
WHERE status = 'pending';
```

## 📡 Configuração do Realtime

### Habilitar Realtime no Supabase:
1. Vá em **Database > Replication**
2. Marque a tabela `job_offers`
3. Clique em **Save**

### Políticas RLS:
```sql
-- Driver pode ver suas próprias ofertas
CREATE POLICY "Drivers can view their own offers"
ON job_offers
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);

-- Driver pode atualizar suas próprias ofertas
CREATE POLICY "Drivers can update their own offers"
ON job_offers
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_uid)
WITH CHECK (auth.uid() = driver_uid);
```

## 🔧 Arquivo Criado

### [hooks/useJobOffers.ts](hooks/useJobOffers.ts)

**Principais Funções:**

1. **`useJobOffers()`** - Hook principal
   - Retorna: `{ currentOffer, loading, acceptOffer, rejectOffer }`

2. **`acceptOffer(offerId, jobId)`** - Aceita a oferta
   - Atualiza `job_offers.status = 'accepted'`
   - Atualiza `jobs_uk.courierid` e `status = 'assigned'`
   - Para vibração e timer

3. **`rejectOffer(offerId)`** - Rejeita a oferta
   - Atualiza `job_offers.status = 'rejected'`
   - Para vibração e timer

4. **Realtime Listener**
   - INSERT: Nova oferta → dispara notificação
   - UPDATE: Oferta expirada → limpa tela

## 💡 Uso no Componente

### [app/(tabs)/map-online.tsx](app/(tabs)/map-online.tsx)

```typescript
import { useJobOffers } from '../../hooks/useJobOffers';

export default function MapOnlineScreen() {
  const { currentOffer, loading, acceptOffer, rejectOffer } = useJobOffers();

  const handleAcceptJob = async () => {
    if (!currentOffer) return;
    const success = await acceptOffer(currentOffer.id, currentOffer.job_id);
    if (success) {
      console.log('Job accepted!');
      // Navigate to job details
    }
  };

  const handleRejectJob = async () => {
    if (!currentOffer) return;
    await rejectOffer(currentOffer.id);
  };

  return (
    <>
      {/* Map View */}
      <MapView ... />

      {/* Job Notification */}
      {currentOffer && currentOffer.job && (
        <JobNotification
          pickupAddress={currentOffer.job.collect_address}
          deliveryAddress={currentOffer.job.dropoff_address}
          amount={currentOffer.job.amount}
          distance={currentOffer.job.distance}
          onAccept={handleAcceptJob}
          onReject={handleRejectJob}
        />
      )}
    </>
  );
}
```

## 🎯 Características

✅ **Realtime** - Notificações instantâneas via Supabase Realtime
✅ **Vibração** - Padrão de vibração a cada 2 segundos
✅ **Auto-Rejeição** - Timer de 45 segundos automático
✅ **Optimistic Locking** - Apenas 1 driver pega o job
✅ **Cleanup** - Para vibração e timer ao desmontar
✅ **App State** - Mantém vibração mesmo em background
✅ **Type-Safe** - TypeScript com interfaces completas

## 🔍 Debug

### Ver ofertas pendentes:
```sql
SELECT
  o.id,
  o.job_id,
  o.driver_uid,
  o.status,
  o.expires_at,
  j.ref,
  j.amount
FROM job_offers o
JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = 'your-driver-uid'
  AND o.status = 'pending'
ORDER BY o.created_at DESC;
```

### Logs do Console:
- `🔔 New job offer received` - Oferta recebida
- `📨 Realtime INSERT received` - Evento INSERT detectado
- `✅ Job offer accepted successfully` - Aceito com sucesso
- `❌ Job offer rejected` - Rejeitado
- `⏰ Auto-rejecting offer after 45 seconds` - Auto-rejeição

## 🚀 Próximos Passos

1. ✅ Sistema de ofertas funcionando
2. ✅ Notificações em tempo real
3. ✅ Vibração e timer
4. 🔄 Push notifications quando app minimizado (opcional)
5. 🔄 Som de notificação customizado (adicionar arquivo MP3)

## 📝 Notas Importantes

- O hook já está integrado no `map-online.tsx`
- Só escuta ofertas quando driver está online
- Cleanup automático ao desmontar componente
- Suporta múltiplas ofertas (apenas mostra a mais recente)
- Timer e vibração param automaticamente ao aceitar/rejeitar
