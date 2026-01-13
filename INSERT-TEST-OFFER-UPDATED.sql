-- ================================================
-- Script de Teste: Inserir Job Offer
-- ================================================
-- Execute este script no Supabase SQL Editor para criar uma oferta de teste
--
-- IMPORTANTE: Substitua 'SEU-UID-AQUI' pelo seu driver_uid real
-- Para encontrar seu UID, execute: SELECT uid FROM drivers_uk WHERE email = 'seu-email@example.com';
--
-- Data: 2026-01-13
-- ================================================

-- 1. Primeiro, vamos verificar se há jobs disponíveis na tabela jobs_uk
SELECT
    id,
    job_reference,
    collect_address,
    dropoff_address,
    driver_price,
    distance,
    courierid,
    status
FROM jobs_uk
WHERE status = 'pending'
  AND courierid IS NULL
  AND payment_status = 'paid'
LIMIT 5;

-- 2. Inserir oferta de teste usando um job real
-- OPÇÃO A: Usando job existente da tabela jobs_uk
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
)
SELECT
    id as job_id,
    'SEU-UID-AQUI'::uuid as driver_uid,  -- ⚠️ SUBSTITUIR COM SEU UID!
    'waiting' as status,
    NOW() + INTERVAL '10 minutes' as expires_at,
    collect_address,
    collect_latitude,
    collect_longitude,
    collect_time as collect_time_after,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    dropoff_time as dropoff_time_before,
    driver_price as price_driver,
    distance
FROM jobs_uk
WHERE status = 'pending'
  AND courierid IS NULL
  AND payment_status = 'paid'
  AND collect_latitude IS NOT NULL
  AND dropoff_latitude IS NOT NULL
LIMIT 1;

-- ================================================
-- OPÇÃO B: Inserir oferta manualmente com dados específicos
-- ================================================
-- Use esta opção se não houver jobs disponíveis ou para testar com dados específicos

/*
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
    'JOB-ID-AQUI'::uuid,              -- ⚠️ ID de um job real da tabela jobs_uk
    'SEU-UID-AQUI'::uuid,              -- ⚠️ Seu driver UID
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
*/

-- ================================================
-- 3. Verificar se a oferta foi criada
-- ================================================
SELECT
    jo.id,
    jo.job_id,
    jo.driver_uid,
    jo.status,
    jo.collect_address,
    jo.dropoff_address,
    jo.price_driver,
    jo.distance,
    jo.expires_at,
    j.job_reference,
    j.courierid,
    j.status as job_status
FROM job_offers_uk jo
LEFT JOIN jobs_uk j ON jo.job_id = j.id
WHERE jo.driver_uid = 'SEU-UID-AQUI'::uuid  -- ⚠️ SUBSTITUIR COM SEU UID!
  AND jo.status = 'waiting'
ORDER BY jo.created_at DESC
LIMIT 1;

-- ================================================
-- 4. Limpar ofertas de teste antigas (OPCIONAL)
-- ================================================
-- Descomente as linhas abaixo se quiser limpar ofertas antigas

/*
DELETE FROM job_offers_uk
WHERE driver_uid = 'SEU-UID-AQUI'::uuid  -- ⚠️ SUBSTITUIR COM SEU UID!
  AND status IN ('rejected', 'expired', 'accepted')
  AND created_at < NOW() - INTERVAL '1 day';
*/

-- ================================================
-- 5. Query útil: Ver histórico de ofertas
-- ================================================
SELECT
    id,
    job_id,
    status,
    price_driver,
    distance,
    created_at,
    expires_at
FROM job_offers_uk
WHERE driver_uid = 'SEU-UID-AQUI'::uuid  -- ⚠️ SUBSTITUIR COM SEU UID!
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
--
-- 1. Este script usa campos da tabela jobs_uk como mostrado no CSV:
--    - collect_address, collect_latitude, collect_longitude
--    - dropoff_address, dropoff_latitude, dropoff_longitude
--    - driver_price (preço para o motorista)
--    - distance (distância total)
--    - courierid (UUID do motorista quando aceito)
--
-- 2. O campo 'driver_price' da tabela jobs_uk corresponde a
--    'price_driver' na tabela job_offers_uk
--
-- 3. Quando o motorista aceita a oferta:
--    - job_offers_uk.status = 'accepted'
--    - jobs_uk.courierid = driver_uid
--    - jobs_uk.status = 'accepted'
--    - jobs_uk.assigned_at = NOW()
--
-- 4. Quando o motorista rejeita a oferta:
--    - job_offers_uk.status = 'rejected'
--    - jobs_uk NÃO é alterado
--
-- ================================================
