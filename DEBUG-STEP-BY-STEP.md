# Debug Passo a Passo - Job Offers

## Situação Atual
- ✅ Tabela `job_offers_uk` existe
- ✅ Job criado com `driver_uid` correto
- ✅ Status = 'waiting'
- ❌ Container não aparece no app

## Console atual mostra:
```
📡 Setting up realtime subscription for job_offers_uk
🔍 Filter: driver_uid=eq.4e805168-e0da-4e3e-a22c-ff15fd9d0290
```

## O que está FALTANDO:
Quando você insere um job, deveria aparecer:
```
📨 Realtime INSERT received: {...}
```

**Se isso NÃO aparece = Realtime não está funcionando**

## Verificações:

### 1. Verificar se Realtime está habilitado
Execute no SQL Editor:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'job_offers_uk';
```

**Resultado esperado:**
```
schemaname | tablename
-----------+---------------
public     | job_offers_uk
```

**Se retornar VAZIO**, execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE job_offers_uk;
```

### 2. Verificar no Dashboard
1. Vá em **Database > Replication**
2. Procure `job_offers_uk` na lista
3. A checkbox deve estar MARCADA
4. Se não estiver, marque e clique em **Save**

### 3. Verificar o job existente
Execute no SQL Editor:
```sql
SELECT
    id,
    job_id,
    driver_uid,
    status,
    created_at,
    expires_at
FROM job_offers_uk
WHERE driver_uid = '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid
ORDER BY created_at DESC
LIMIT 5;
```

**O que verificar:**
- ✅ driver_uid = '4e805168-e0da-4e3e-a22c-ff15fd9d0290'
- ✅ status = 'waiting'
- ✅ expires_at está no FUTURO (não expirou)

### 4. Deletar job antigo e criar novo
Os jobs antigos criados ANTES do app estar escutando não vão disparar notificação.

Execute:
```sql
-- Deletar jobs antigos
DELETE FROM job_offers_uk
WHERE driver_uid = '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid;

-- Criar novo job (COM O APP RODANDO!)
INSERT INTO job_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid,
    'waiting',
    NOW() + INTERVAL '10 minutes'
);
```

### 5. Se AINDA não funcionar - Verificar RLS
Execute:
```sql
-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'job_offers_uk';
```

**Deve retornar pelo menos:**
- "Drivers can view their own offers" | SELECT | {authenticated}

**Se NÃO retornar**, execute:
```sql
-- Criar política SELECT
CREATE POLICY "Drivers can view their own offers"
ON job_offers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);
```

## Teste Final

**COM O APP RODANDO E NA TELA DO MAPA:**

1. Abra o SQL Editor do Supabase
2. Execute:
```sql
INSERT INTO job_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid,
    'waiting',
    NOW() + INTERVAL '10 minutes'
);
```
3. Aguarde 2-3 segundos
4. Verifique o console do Expo

**O que DEVE aparecer:**
```
📨 Realtime INSERT received: { eventType: 'INSERT', ... }
🔍 Payload new: { id: '...', job_id: '...', driver_uid: '...', status: 'waiting', ... }
🔍 Offer status: waiting
🔍 Offer driver_uid: 4e805168-e0da-4e3e-a22c-ff15fd9d0290
🔍 Current user.id: 4e805168-e0da-4e3e-a22c-ff15fd9d0290
✅ Status is waiting, processing offer...
🔔 New job offer received: <offer-id>
🔍 Fetching job details...
🔍 Job details: {...}
✅ Setting current offer: {...}
🔔 Starting vibration...
⏰ Starting 45-second timer...
```

**Se aparecer tudo isso MAS o container não aparecer:**
= Problema no componente JobNotification (não no Realtime)

**Se NÃO aparecer "📨 Realtime INSERT received":**
= Realtime não está configurado corretamente
