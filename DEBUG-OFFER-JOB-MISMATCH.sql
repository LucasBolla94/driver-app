-- =====================================================
-- DEBUG: Investigar por que job_id não existe
-- =====================================================

-- 1. Ver todas as ofertas recentes com seus job_ids
SELECT
    id as offer_id,
    job_id,
    driver_uid,
    status,
    created_at,
    expires_at
FROM job_offers_uk
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver todos os jobs recentes
SELECT
    id as job_id,
    job_reference,
    courierid,
    status,
    created_at
FROM jobs_uk
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar se existe um job com o ID da oferta problemática
-- SUBSTITUA 'b7833974-884a-41c5-a89d-d5b1c6eb34b5' pelo job_id que apareceu no erro
SELECT *
FROM jobs_uk
WHERE id = 'b7833974-884a-41c5-a89d-d5b1c6eb34b5';

-- 4. LEFT JOIN para ver ofertas sem jobs correspondentes
SELECT
    o.id as offer_id,
    o.job_id,
    o.status as offer_status,
    j.id as actual_job_id,
    j.job_reference,
    j.status as job_status,
    CASE
        WHEN j.id IS NULL THEN '❌ JOB NÃO EXISTE'
        ELSE '✅ JOB EXISTE'
    END as job_exists
FROM job_offers_uk o
LEFT JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = auth.uid()
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. Verificar todos os campos da tabela job_offers_uk
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'job_offers_uk'
ORDER BY ordinal_position;

-- 6. Verificar se job_id é realmente UUID ou se tem outro formato
SELECT
    job_id,
    pg_typeof(job_id) as job_id_type
FROM job_offers_uk
LIMIT 5;
