-- =====================================================
-- SQL QUERIES OTIMIZADAS PARA TELA "JOBS" DO APP
-- =====================================================
-- Este arquivo contém queries e índices para exibir
-- jobs aceitos/atribuídos ao driver
-- =====================================================

-- =====================================================
-- 1. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice principal: buscar jobs do driver por status
CREATE INDEX IF NOT EXISTS idx_jobs_uk_courierid_status
ON jobs_uk(courierid, status)
WHERE courierid IS NOT NULL;

-- Índice para ordenação por data de atribuição
CREATE INDEX IF NOT EXISTS idx_jobs_uk_assigned_at
ON jobs_uk(assigned_at DESC)
WHERE assigned_at IS NOT NULL;

-- Índice composto para query completa (driver + status + data)
CREATE INDEX IF NOT EXISTS idx_jobs_uk_driver_status_assigned
ON jobs_uk(courierid, status, assigned_at DESC)
WHERE courierid IS NOT NULL AND assigned_at IS NOT NULL;

-- Índice para buscar job por ID rapidamente
CREATE INDEX IF NOT EXISTS idx_jobs_uk_id
ON jobs_uk(id);

-- =====================================================
-- 2. QUERY PRINCIPAL: JOBS ACEITOS DO DRIVER
-- =====================================================
-- Esta é a query que o app deve usar na tela "Jobs"

SELECT
    j.id,
    j.job_reference,
    j.status,
    j.courierid,
    j.assigned_at,
    j.created_at,
    j.updated_at,

    -- Endereços e coordenadas de coleta
    j.collect_address,
    j.collect_latitude,
    j.collect_longitude,
    j.collect_date,
    j.collect_time,
    j.collect_name,
    j.collect_phone,

    -- Endereços e coordenadas de entrega
    j.dropoff_address,
    j.dropoff_latitude,
    j.dropoff_longitude,
    j.dropoff_date,
    j.dropoff_time,
    j.dropoff_name,
    j.dropoff_phone,

    -- Detalhes do job
    j.vehicle_type,
    j.package_size,
    j.distance,
    j.duration,
    j.driver_price,
    j.total_price,
    j.payment_status,

    -- Status de conclusão
    j.completed_at,
    j.cancelled_at,
    j.cancellation_reason,

    -- Fotos e assinaturas
    j.collect_photo_url,
    j.dropoff_photo_url,
    j.dropoff_sign_url,
    j.dropoff_code,

    -- Coordenadas do courier no dropoff
    j.dropoff_courier_latitude,
    j.dropoff_courier_longitude,

    -- Verificação de idade (se aplicável)
    j.age_restricted,
    j.dropoff_age_verification,

    -- Timestamps de coleta e entrega
    j.collect_timestamp,
    j.dropoff_timestamp,

    -- Notas
    j.notes

FROM jobs_uk j

WHERE
    j.courierid = auth.uid()  -- Jobs do driver logado
    AND j.status IN ('assigned', 'accepted')  -- Status aceitos/atribuídos

ORDER BY
    j.assigned_at DESC  -- Mais recentes primeiro

LIMIT 50;  -- Limitar para performance

-- =====================================================
-- 3. QUERY: JOBS EM PROGRESSO (Para "Active Jobs")
-- =====================================================

SELECT
    j.id,
    j.job_reference,
    j.status,
    j.collect_address,
    j.dropoff_address,
    j.collect_time,
    j.dropoff_time,
    j.driver_price,
    j.distance,
    j.assigned_at

FROM jobs_uk j

WHERE
    j.courierid = auth.uid()
    AND j.status = 'assigned'  -- Apenas jobs atribuídos mas não concluídos
    AND j.completed_at IS NULL
    AND j.cancelled_at IS NULL

ORDER BY
    j.assigned_at ASC  -- Mais antigos primeiro (prioridade)

LIMIT 10;

-- =====================================================
-- 4. QUERY: JOBS CONCLUÍDOS (Para "Completed Jobs")
-- =====================================================

SELECT
    j.id,
    j.job_reference,
    j.status,
    j.collect_address,
    j.dropoff_address,
    j.driver_price,
    j.distance,
    j.assigned_at,
    j.completed_at,
    j.payment_status

FROM jobs_uk j

WHERE
    j.courierid = auth.uid()
    AND j.completed_at IS NOT NULL  -- Jobs concluídos

ORDER BY
    j.completed_at DESC  -- Mais recentes primeiro

LIMIT 50;

-- =====================================================
-- 5. QUERY: ESTATÍSTICAS DO DRIVER
-- =====================================================

SELECT
    COUNT(*) FILTER (WHERE status = 'assigned' AND completed_at IS NULL) as active_jobs,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_jobs,
    COUNT(*) FILTER (WHERE cancelled_at IS NOT NULL) as cancelled_jobs,
    SUM(driver_price) FILTER (WHERE completed_at IS NOT NULL AND payment_status = 'paid') as total_earnings,
    SUM(driver_price) FILTER (WHERE status = 'assigned' AND completed_at IS NULL) as pending_earnings

FROM jobs_uk

WHERE courierid = auth.uid();

-- =====================================================
-- 6. QUERY: DETALHES DE UM JOB ESPECÍFICO
-- =====================================================

SELECT
    j.*,

    -- Informações da oferta relacionada
    jo.id as offer_id,
    jo.created_at as offer_created_at,
    jo.expires_at as offer_expires_at,
    jo.status as offer_status

FROM jobs_uk j

LEFT JOIN job_offers_uk jo
    ON jo.job_id = j.id
    AND jo.driver_uid = auth.uid()
    AND jo.status = 'accepted'

WHERE
    j.id = '<JOB_ID_AQUI>'::uuid
    AND j.courierid = auth.uid();

-- =====================================================
-- 7. QUERY: JOBS ORDENADOS POR SEQUÊNCIA DE COLETA
-- =====================================================
-- Útil para mostrar jobs na ordem de coleta mais próxima

SELECT
    j.id,
    j.job_reference,
    j.collect_address,
    j.dropoff_address,
    j.collect_time,
    j.dropoff_time,
    j.driver_price,
    j.distance,
    j.collect_latitude,
    j.collect_longitude,

    -- Calcular distância do motorista até ponto de coleta (requer localização atual)
    -- Você pode adicionar isso no app usando getCurrentPosition

FROM jobs_uk j

WHERE
    j.courierid = auth.uid()
    AND j.status = 'assigned'
    AND j.completed_at IS NULL
    AND j.cancelled_at IS NULL

ORDER BY
    j.collect_time ASC,  -- Por horário de coleta
    j.collect_date ASC   -- Depois por data

LIMIT 20;

-- =====================================================
-- 8. VERIFICAR ÍNDICES CRIADOS
-- =====================================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jobs_uk'
  AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- 9. ANALISAR PERFORMANCE DA QUERY
-- =====================================================
-- Use EXPLAIN ANALYZE para verificar se os índices estão sendo usados

EXPLAIN ANALYZE
SELECT
    j.id,
    j.job_reference,
    j.status,
    j.collect_address,
    j.dropoff_address,
    j.driver_price
FROM jobs_uk j
WHERE
    j.courierid = auth.uid()
    AND j.status = 'assigned'
ORDER BY j.assigned_at DESC
LIMIT 50;

-- =====================================================
-- 10. QUERY PARA O COMPONENTE JobsScreen.tsx
-- =====================================================
-- Esta é a query exata que deve ser usada no componente React Native

/*
Exemplo de uso no código TypeScript:

const { data: jobs, error } = await supabase
  .from('jobs_uk')
  .select(`
    id,
    job_reference,
    status,
    courierid,
    assigned_at,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_time,
    collect_name,
    collect_phone,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_time,
    dropoff_name,
    dropoff_phone,
    vehicle_type,
    package_size,
    distance,
    driver_price,
    payment_status,
    completed_at,
    collect_timestamp,
    dropoff_timestamp
  `)
  .eq('courierid', user.id)
  .in('status', ['assigned', 'accepted'])
  .is('completed_at', null)
  .is('cancelled_at', null)
  .order('assigned_at', { ascending: false })
  .limit(50);
*/

-- =====================================================
-- 11. RLS POLICIES NECESSÁRIAS
-- =====================================================

-- Garantir que drivers só vejam seus próprios jobs
CREATE POLICY IF NOT EXISTS "Drivers can view their own jobs"
ON jobs_uk
FOR SELECT
TO authenticated
USING (auth.uid() = courierid);

-- Drivers podem atualizar alguns campos dos seus jobs
CREATE POLICY IF NOT EXISTS "Drivers can update their job status"
ON jobs_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = courierid)
WITH CHECK (auth.uid() = courierid);

-- =====================================================
-- 12. EXEMPLO DE UPDATE QUANDO ACEITA OFERTA
-- =====================================================

/*
-- Quando o driver aceita uma oferta:

BEGIN;

-- 1. Atualizar job_offers_uk
UPDATE job_offers_uk
SET status = 'accepted'
WHERE id = '<OFFER_ID>'
  AND driver_uid = auth.uid();

-- 2. Atualizar jobs_uk
UPDATE jobs_uk
SET
    courierid = auth.uid(),
    status = 'assigned',
    assigned_at = NOW()
WHERE id = '<JOB_ID>'
  AND courierid IS NULL;  -- Optimistic locking

COMMIT;
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
CAMPOS IMPORTANTES DA TABELA jobs_uk:

- courierid: UUID do driver (NULL se não atribuído)
- status: 'pending', 'assigned', 'accepted', 'completed', 'cancelled'
- assigned_at: Timestamp de quando foi atribuído
- driver_price: Valor que o driver receberá
- distance: Distância total do job
- collect_* : Dados de coleta
- dropoff_* : Dados de entrega
- completed_at: Timestamp de conclusão
- cancelled_at: Timestamp de cancelamento

FLUXO DE STATUS:
1. pending → Job criado, aguardando atribuição
2. assigned → Driver aceitou, mas ainda não iniciou
3. completed → Job concluído com sucesso
4. cancelled → Job cancelado

ÍNDICES CRIADOS:
✅ idx_jobs_uk_courierid_status - Para filtrar por driver e status
✅ idx_jobs_uk_assigned_at - Para ordenar por data
✅ idx_jobs_uk_driver_status_assigned - Índice composto completo
✅ idx_jobs_uk_id - Para buscar por ID

PERFORMANCE:
- Com os índices, queries devem retornar em < 10ms
- LIMIT 50 garante que não carregue dados demais
- RLS policies garantem segurança

*/
