# Migração do Sistema de Status Online

## 📋 Resumo

O sistema de status online foi migrado de uma tabela separada `drivers_online` para colunas diretamente na tabela `drivers_uk`.

## 🗂️ Nova Estrutura da Tabela `drivers_uk`

### Colunas Adicionadas:

1. **`online_status`** (TEXT)
   - Valores: `'online'` ou `'offline'`
   - Default: `'offline'`
   - Indica se o motorista está online ou offline

2. **`online_latitude`** (DOUBLE PRECISION)
   - Latitude atual do motorista quando online
   - NULL quando offline

3. **`online_longitude`** (DOUBLE PRECISION)
   - Longitude atual do motorista quando online
   - NULL quando offline

4. **`last_online_update`** (TIMESTAMP WITH TIME ZONE)
   - Timestamp da última atualização de localização
   - Atualizado automaticamente

## 🔧 SQL de Migração

Execute o arquivo [add-online-columns.sql](add-online-columns.sql) no Supabase SQL Editor:

```sql
-- Adicionar colunas
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline'
CHECK (online_status IN ('online', 'offline'));

ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_latitude DOUBLE PRECISION;

ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_longitude DOUBLE PRECISION;

ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS last_online_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_drivers_uk_online_status
ON drivers_uk(online_status)
WHERE online_status = 'online';

-- Definir todos drivers como offline inicialmente
UPDATE drivers_uk
SET online_status = 'offline'
WHERE online_status IS NULL;
```

## 📝 Mudanças no Código

### Arquivos Modificados:

#### 1. [app/(tabs)/index.tsx](app/(tabs)/index.tsx)

**Buscar dados do motorista:**
```typescript
// ANTES
.select('first_name, last_name, points, profile_url')

// DEPOIS
.select('first_name, last_name, points, profile_url, online_status')
```

**Verificar status online:**
```typescript
// ANTES - Verificava tabela drivers_online
const { data: onlineData } = await supabase
  .from('drivers_online')
  .select('status')
  .eq('userId', user.id)

// DEPOIS - Verifica coluna online_status
const isCurrentlyOnline = driverData.online_status === 'online';
setIsOnline(isCurrentlyOnline);
```

**Ir online:**
```typescript
// ANTES - Insert/Update em drivers_online
await supabase.from('drivers_online').upsert({
  userId: user.id,
  latitude: lat,
  longitude: lng,
  status: true,
  lastUpdated: new Date().toISOString(),
})

// DEPOIS - Update em drivers_uk
await supabase.from('drivers_uk').update({
  online_status: 'online',
  online_latitude: lat,
  online_longitude: lng,
  last_online_update: new Date().toISOString(),
}).eq('uid', user.id)
```

**Ir offline:**
```typescript
// ANTES - Update em drivers_online
await supabase.from('drivers_online').update({ status: false })

// DEPOIS - Update em drivers_uk
await supabase.from('drivers_uk').update({
  online_status: 'offline',
  online_latitude: null,
  online_longitude: null,
  last_online_update: new Date().toISOString(),
}).eq('uid', user.id)
```

#### 2. [app/(tabs)/map-online.tsx](app/(tabs)/map-online.tsx)

**Atualizar localização:**
```typescript
// ANTES
await supabase.from('drivers_online').upsert({
  userId: user.id,
  latitude,
  longitude,
  status: true,
  lastUpdated: new Date().toISOString(),
})

// DEPOIS
await supabase.from('drivers_uk').update({
  online_status: 'online',
  online_latitude: latitude,
  online_longitude: longitude,
  last_online_update: new Date().toISOString(),
}).eq('uid', user.id)
```

**Verificar status:**
```typescript
// ANTES
const { data } = await supabase
  .from('drivers_online')
  .select('status')
  .eq('userId', user.id)

// DEPOIS
const { data } = await supabase
  .from('drivers_uk')
  .select('online_status')
  .eq('uid', user.id)
```

## ✅ Benefícios da Mudança

1. **Menos tabelas** - Dados centralizados em `drivers_uk`
2. **Menos queries** - Não precisa fazer JOIN entre tabelas
3. **Melhor performance** - Índice criado para `online_status = 'online'`
4. **Dados consistentes** - Tudo relacionado ao driver em um só lugar
5. **Mais fácil de manter** - Menos complexidade no código

## 🔍 Queries Úteis

### Ver drivers online:
```sql
SELECT
  uid,
  first_name,
  last_name,
  online_status,
  online_latitude,
  online_longitude,
  last_online_update
FROM drivers_uk
WHERE online_status = 'online'
ORDER BY last_online_update DESC;
```

### Contar drivers online:
```sql
SELECT COUNT(*) as total_online
FROM drivers_uk
WHERE online_status = 'online';
```

### Ver último update de cada driver:
```sql
SELECT
  uid,
  first_name,
  last_name,
  online_status,
  last_online_update,
  CASE
    WHEN last_online_update > NOW() - INTERVAL '5 minutes' THEN 'Active'
    WHEN last_online_update > NOW() - INTERVAL '1 hour' THEN 'Recent'
    ELSE 'Stale'
  END as activity_status
FROM drivers_uk
ORDER BY last_online_update DESC;
```

## 🗑️ Limpeza (Opcional)

Após confirmar que tudo está funcionando, você pode remover a tabela antiga:

```sql
-- CUIDADO: Só faça isso depois de testar tudo!
-- DROP TABLE IF EXISTS drivers_online;
```

## 📊 Fluxo de Status

1. **Usuário vai ONLINE:**
   - `online_status` → `'online'`
   - `online_latitude` → latitude atual
   - `online_longitude` → longitude atual
   - `last_online_update` → timestamp atual

2. **Localização é atualizada (a cada 10s):**
   - `online_latitude` → nova latitude
   - `online_longitude` → nova longitude
   - `last_online_update` → timestamp atual

3. **Usuário vai OFFLINE:**
   - `online_status` → `'offline'`
   - `online_latitude` → `NULL`
   - `online_longitude` → `NULL`
   - `last_online_update` → timestamp atual

## 🔒 Políticas RLS (se necessário)

As políticas RLS existentes já cobrem essas colunas, pois permitem UPDATE na tabela `drivers_uk` para o próprio usuário.

## ✨ Próximos Passos

1. Execute o SQL em [add-online-columns.sql](add-online-columns.sql)
2. Teste o app indo online/offline
3. Verifique os logs do console
4. Confirme que a localização está sendo atualizada
5. (Opcional) Remova a tabela `drivers_online` antiga
