# Debug - Realtime não está funcionando

## Checklist de Verificação

### 1. ✅ Realtime está habilitado no Supabase?

**Passo 1:** Vá para o Supabase Dashboard
- Database > Replication
- A tabela `jobs_offers_uk` está marcada?
- Se NÃO, marque e clique em Save

**Passo 2:** Execute no SQL Editor:
```sql
-- Verificar se a tabela está na publicação do realtime
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'jobs_offers_uk';
```

**Resultado esperado:**
```
schemaname | tablename
-----------+-----------------
public     | jobs_offers_uk
```

Se retornar vazio, execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE jobs_offers_uk;
```

### 2. ✅ RLS Policies estão corretas?

Execute no SQL Editor:
```sql
-- Verificar políticas RLS
SELECT
    policyname,
    cmd,
    roles,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'jobs_offers_uk';
```

**Resultado esperado:** Deve ter pelo menos:
- "Drivers can view their own offers" (SELECT)
- "Drivers can update their own offers" (UPDATE)

Se não tiver, execute:
```sql
-- Habilitar RLS
ALTER TABLE jobs_offers_uk ENABLE ROW LEVEL SECURITY;

-- Criar política SELECT
CREATE POLICY "Drivers can view their own offers"
ON jobs_offers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);

-- Criar política UPDATE
CREATE POLICY "Drivers can update their own offers"
ON jobs_offers_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_uid)
WITH CHECK (auth.uid() = driver_uid);
```

### 3. ✅ Driver está online?

O hook `useJobOffers()` só funciona quando o driver está na tela **map-online**.

**Verifique:**
- O driver deslizou o swipe para ficar online?
- A tela mudou para o mapa com botão "YOU'RE ONLINE"?

### 4. ✅ driver_uid está correto?

Execute no SQL Editor:
```sql
-- Pegar o UID do driver logado
SELECT auth.uid();
```

Copie esse UID e use no INSERT da oferta:
```sql
INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    'cole-um-job-id-valido-aqui'::uuid,
    'COLE-O-UID-DO-DRIVER-AQUI'::uuid,  -- ⚠️ IMPORTANTE: Use o UID exato
    'pending',
    NOW() + INTERVAL '45 seconds'
);
```

### 5. ✅ job_id é válido?

```sql
-- Pegar um job_id válido
SELECT id, ref, amount FROM jobs_uk WHERE status = 'pending' LIMIT 1;
```

Use esse `id` no INSERT acima.

### 6. ✅ Verificar logs do console

No terminal do Expo, você deve ver:
```
📡 Setting up realtime subscription for jobs_offers_uk
```

Se NÃO aparecer, o componente não está montado ou há erro.

Quando inserir a oferta, deve aparecer:
```
📨 Realtime INSERT received: { ... }
🔔 New job offer received: offer-id
```

### 7. ✅ Testar conexão Realtime

Execute este teste no console do navegador (DevTools):
```javascript
// No app, adicione este log temporário no useEffect
console.log('🔍 User ID:', user.id);
console.log('🔍 Channel:', channel);
```

## Script de Teste Completo

Execute este script SQL para testar tudo:

```sql
-- 1. Verificar se o driver existe
SELECT uid, first_name, last_name FROM drivers_uk WHERE uid = auth.uid();

-- 2. Verificar jobs disponíveis
SELECT id, ref, amount, status FROM jobs_uk WHERE status = 'pending' LIMIT 5;

-- 3. Inserir oferta de teste (substitua os valores)
DO $$
DECLARE
    v_driver_uid uuid := auth.uid();
    v_job_id uuid := (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1);
BEGIN
    IF v_driver_uid IS NULL THEN
        RAISE EXCEPTION 'Nenhum usuário logado!';
    END IF;

    IF v_job_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum job pendente encontrado!';
    END IF;

    INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
    VALUES (v_job_id, v_driver_uid, 'pending', NOW() + INTERVAL '45 seconds');

    RAISE NOTICE 'Oferta criada com sucesso! Driver: %, Job: %', v_driver_uid, v_job_id;
END $$;

-- 4. Verificar se a oferta foi criada
SELECT * FROM jobs_offers_uk ORDER BY created_at DESC LIMIT 1;
```

## Logs Esperados

### No Console do App:
```
📡 Setting up realtime subscription for jobs_offers_uk
📨 Realtime INSERT received: {
  new: {
    id: "...",
    job_id: "...",
    driver_uid: "...",
    status: "pending",
    ...
  }
}
🔔 New job offer received: offer-id
```

### Se não aparecer nada:
- ❌ Realtime não está habilitado
- ❌ RLS está bloqueando
- ❌ driver_uid não bate com auth.uid()
- ❌ Component não está montado (driver offline)

## Comando de Debug no Hook

Adicione logs temporários no useJobOffers.ts:

```typescript
// No início do useEffect
useEffect(() => {
  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    console.log('🔍 DEBUG - User:', user);
    console.log('🔍 DEBUG - User ID:', user?.id);

    if (!user) {
      console.error('❌ No user found!');
      return;
    }

    console.log('📡 Setting up realtime subscription for jobs_offers_uk');
    console.log('🔍 Filter:', `driver_uid=eq.${user.id}`);

    // ... resto do código
  };

  setupRealtimeSubscription();
}, []);
```

## Solução Rápida

Se nada funcionar, tente este teste direto:

1. **Abra o app e vá online**
2. **No terminal do Expo, procure por:**
   - `📡 Setting up realtime subscription`
   - Se aparecer: ✅ Hook está rodando
   - Se NÃO aparecer: ❌ Component não está montado

3. **Execute no SQL:**
```sql
-- Use SEU UID (pegue com SELECT auth.uid())
INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    (SELECT id FROM jobs_uk LIMIT 1),
    'SEU-UID-AQUI'::uuid,
    'pending',
    NOW() + INTERVAL '1 hour'  -- Tempo longo para debug
);
```

4. **Aguarde 2-3 segundos**
5. **Verifique se apareceu no console:**
   - `📨 Realtime INSERT received`

Se aparecer no console mas não na tela:
- ✅ Realtime funciona
- ❌ Problema na renderização do JobNotification

Se NÃO aparecer no console:
- ❌ Realtime não está configurado
- ❌ RLS está bloqueando
