-- =====================================================
-- INSERIR OFERTA DE TESTE - EXECUTE COM O APP RODANDO
-- =====================================================

-- PASSO 1: Deletar ofertas antigas
DELETE FROM job_offers_uk
WHERE driver_uid = '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid;

-- PASSO 2: Verificar se existe job pendente
SELECT id, ref, amount, status
FROM jobs_uk
WHERE status = 'pending'
LIMIT 1;

-- Se não retornar nenhum job, crie um primeiro:
/*
INSERT INTO jobs_uk (
    ref,
    status,
    collect_address,
    collect_postcode,
    collect_city,
    dropoff_address,
    dropoff_postcode,
    dropoff_city,
    amount,
    distance
) VALUES (
    'TEST-' || EXTRACT(EPOCH FROM NOW())::text,
    'pending',
    '123 Test Street',
    'G1 1AA',
    'Glasgow',
    '456 Delivery Road',
    'G2 2BB',
    'Glasgow',
    '25.00',
    '5.2 km'
);
*/

-- PASSO 3: Inserir oferta (EXECUTE ESTE COM APP RODANDO!)
INSERT INTO job_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    (SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1),
    '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid,
    'waiting',
    NOW() + INTERVAL '10 minutes'
);

-- Deve retornar: INSERT 0 1

-- PASSO 4: Verificar se foi criado
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
LIMIT 1;
