-- =====================================================
-- TESTE DE OFERTA DE JOB
-- =====================================================

-- PASSO 1: Pegar o UID do driver logado
SELECT auth.uid() as my_driver_uid;
-- ⚠️ COPIE o resultado acima

-- PASSO 2: Verificar se existe na tabela drivers_uk
SELECT uid, first_name, last_name FROM drivers_uk WHERE uid = auth.uid();
-- ✅ Deve retornar seus dados

-- PASSO 3: Pegar um job_id válido
SELECT id, ref, amount, collect_address, dropoff_address
FROM jobs_uk
WHERE status = 'pending'
LIMIT 1;
-- ⚠️ COPIE o id do job

-- PASSO 4: Verificar se a tabela jobs_offers_uk existe
SELECT COUNT(*) FROM jobs_offers_uk;
-- ✅ Deve retornar um número (pode ser 0)

-- PASSO 5: Inserir oferta de teste
-- ⚠️ SUBSTITUA os valores abaixo pelos copiados acima

INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    'COLE-O-JOB-ID-AQUI'::uuid,          -- do PASSO 3
    'COLE-O-DRIVER-UID-AQUI'::uuid,      -- do PASSO 1
    'pending',
    NOW() + INTERVAL '5 minutes'  -- 5 minutos para testar com calma
);

-- PASSO 6: Verificar se a oferta foi criada
SELECT
    o.id,
    o.job_id,
    o.driver_uid,
    o.status,
    o.created_at,
    o.expires_at,
    j.ref as job_ref,
    j.amount
FROM jobs_offers_uk o
JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = auth.uid()
ORDER BY o.created_at DESC
LIMIT 1;

-- =====================================================
-- SE NÃO FUNCIONAR, EXECUTE ESTES TESTES
-- =====================================================

-- TESTE 1: Verificar se Realtime está habilitado
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'jobs_offers_uk';

-- Resultado esperado:
-- public | jobs_offers_uk

-- Se retornar vazio, execute:
-- ALTER PUBLICATION supabase_realtime ADD TABLE jobs_offers_uk;


-- TESTE 2: Verificar RLS
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'jobs_offers_uk';

-- Deve ter pelo menos:
-- "Drivers can view their own offers" | SELECT | {authenticated}
-- "Drivers can update their own offers" | UPDATE | {authenticated}


-- TESTE 3: Testar se consegue ver a oferta
SELECT * FROM jobs_offers_uk WHERE driver_uid = auth.uid();

-- Se retornar vazio mas você acabou de inserir:
-- ❌ RLS está bloqueando


-- =====================================================
-- SCRIPT AUTOMÁTICO (COPIA E COLA)
-- =====================================================

DO $$
DECLARE
    v_driver_uid uuid;
    v_job_id uuid;
    v_offer_id uuid;
BEGIN
    -- Pegar driver UID
    v_driver_uid := auth.uid();

    IF v_driver_uid IS NULL THEN
        RAISE EXCEPTION 'Você não está logado! Faça login no app primeiro.';
    END IF;

    RAISE NOTICE 'Driver UID: %', v_driver_uid;

    -- Pegar um job pendente
    SELECT id INTO v_job_id
    FROM jobs_uk
    WHERE status = 'pending'
    LIMIT 1;

    IF v_job_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum job pendente encontrado. Crie um job primeiro.';
    END IF;

    RAISE NOTICE 'Job ID: %', v_job_id;

    -- Inserir oferta
    INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
    VALUES (v_job_id, v_driver_uid, 'pending', NOW() + INTERVAL '5 minutes')
    RETURNING id INTO v_offer_id;

    RAISE NOTICE '✅ Oferta criada com sucesso!';
    RAISE NOTICE 'Offer ID: %', v_offer_id;
    RAISE NOTICE 'Agora vá para o app e veja se a notificação apareceu!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro: %', SQLERRM;
        RAISE;
END $$;
