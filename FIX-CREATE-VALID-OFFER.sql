-- =====================================================
-- CRIAR OFERTA VÁLIDA COM JOB REAL
-- =====================================================
-- Execute este script passo a passo no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Obter seu driver UID
SELECT auth.uid() as my_driver_uid;
-- COPIE O UID RETORNADO E USE NOS PRÓXIMOS PASSOS

-- =====================================================
-- PASSO 2: Ver jobs disponíveis
-- =====================================================
SELECT
    id as job_id,
    job_reference,
    status,
    courierid,
    collect_address,
    dropoff_address,
    driver_price,
    distance
FROM jobs_uk
WHERE status = 'pending'
  AND courierid IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- PASSO 3: Limpar ofertas antigas/inválidas (OPCIONAL)
-- =====================================================
-- Execute isso se quiser limpar todas as ofertas antigas
DELETE FROM job_offers_uk
WHERE driver_uid = auth.uid()
  AND status IN ('waiting', 'reject', 'expired');

-- =====================================================
-- PASSO 4: Criar oferta válida usando um job REAL
-- =====================================================
-- Esta query cria uma oferta usando um job que EXISTE
-- na tabela jobs_uk

INSERT INTO job_offers_uk (
    job_id,
    driver_uid,
    status,
    expires_at,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_date_after,
    collect_time_after,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_date_before,
    dropoff_time_before,
    price_driver,
    distance
)
SELECT
    j.id as job_id,                    -- ✅ ID do job REAL
    auth.uid() as driver_uid,           -- ✅ Seu UID
    'waiting' as status,
    NOW() + INTERVAL '10 minutes' as expires_at,
    j.collect_address,
    j.collect_latitude,
    j.collect_longitude,
    j.collect_date as collect_date_after,
    j.collect_time as collect_time_after,
    j.dropoff_address,
    j.dropoff_latitude,
    j.dropoff_longitude,
    j.dropoff_date as dropoff_date_before,
    j.dropoff_time as dropoff_time_before,
    j.driver_price as price_driver,
    j.distance
FROM jobs_uk j
WHERE j.status = 'pending'
  AND j.courierid IS NULL
  AND j.collect_latitude IS NOT NULL
  AND j.dropoff_latitude IS NOT NULL
ORDER BY j.created_at DESC
LIMIT 1;

-- =====================================================
-- PASSO 5: Verificar se a oferta foi criada corretamente
-- =====================================================
SELECT
    o.id as offer_id,
    o.job_id,
    o.status as offer_status,
    o.price_driver,
    o.distance,
    o.collect_address,
    o.dropoff_address,
    o.expires_at,
    j.id as actual_job_id,
    j.job_reference,
    j.status as job_status,
    j.courierid,
    CASE
        WHEN j.id IS NULL THEN '❌ JOB NÃO EXISTE'
        WHEN j.id = o.job_id THEN '✅ JOB EXISTE E CORRESPONDE'
        ELSE '⚠️ JOB IDs NÃO BATEM'
    END as validation
FROM job_offers_uk o
LEFT JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = auth.uid()
  AND o.status = 'waiting'
ORDER BY o.created_at DESC
LIMIT 1;

-- =====================================================
-- PASSO 6: Se não houver jobs disponíveis, crie um job de teste
-- =====================================================
-- APENAS execute se não houver jobs pending na tabela jobs_uk

/*
INSERT INTO jobs_uk (
    job_reference,
    status,
    courierid,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_time,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_time,
    driver_price,
    total_price,
    distance,
    package_size,
    payment_status
) VALUES (
    'TEST-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    'pending',
    NULL,
    '103 Middleton St, Glasgow G51 1SQ, UK',
    55.8529372,
    -4.2990195,
    'ASAP',
    '17 Bruce St, Clydebank G81 1TT, UK',
    55.9002114,
    -4.4063518,
    '15:00',
    12.50,
    15.00,
    '10.5 km',
    'Medium',
    'paid'
) RETURNING id, job_reference, status;

-- Depois execute o PASSO 4 novamente para criar a oferta
*/

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Ver todas as ofertas e se têm jobs válidos
SELECT
    o.id,
    o.job_id,
    o.status,
    j.job_reference,
    CASE
        WHEN j.id IS NULL THEN '❌ INVÁLIDO'
        ELSE '✅ VÁLIDO'
    END as status_validacao
FROM job_offers_uk o
LEFT JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = auth.uid()
ORDER BY o.created_at DESC
LIMIT 10;
