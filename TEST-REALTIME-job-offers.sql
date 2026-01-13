-- =====================================================
-- TESTE COMPLETO DE REALTIME - job_offers_uk
-- =====================================================

-- PASSO 1: Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'job_offers_uk'
) as tabela_existe;

-- PASSO 2: Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'job_offers_uk'
ORDER BY ordinal_position;

-- PASSO 3: Verificar se Realtime está habilitado
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'job_offers_uk';
-- ✅ Deve retornar: public | job_offers_uk
-- ❌ Se retornar vazio, execute: ALTER PUBLICATION supabase_realtime ADD TABLE job_offers_uk;

-- PASSO 4: Verificar RLS policies
SELECT policyname, cmd, roles, qual::text as using_clause
FROM pg_policies
WHERE tablename = 'job_offers_uk';

-- PASSO 5: Pegar seu UID
SELECT auth.uid() as meu_uid;
-- ⚠️ COPIE este UID: 4e805168-e0da-4e3e-a22c-ff15fd9d0290

-- PASSO 6: Verificar se existe job disponível
SELECT id, ref, amount, status
FROM jobs_uk
WHERE status = 'pending'
LIMIT 1;
-- ⚠️ COPIE o id do job

-- PASSO 7: Verificar ofertas existentes
SELECT * FROM job_offers_uk ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- TESTE DE INSERÇÃO MANUAL
-- =====================================================

-- ⚠️ SUBSTITUA os valores antes de executar:
INSERT INTO job_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    'COLE-JOB-ID-AQUI'::uuid,
    '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid,
    'waiting',
    NOW() + INTERVAL '5 minutes'
);

-- =====================================================
-- TESTE AUTOMÁTICO (Execute este bloco completo)
-- =====================================================

DO $$
DECLARE
    v_driver_uid uuid := '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid;
    v_job_id uuid;
    v_offer_id uuid;
BEGIN
    -- Verificar se o driver existe
    IF NOT EXISTS (SELECT 1 FROM drivers_uk WHERE uid = v_driver_uid) THEN
        RAISE EXCEPTION 'Driver não encontrado na tabela drivers_uk';
    END IF;

    -- Pegar um job pendente
    SELECT id INTO v_job_id
    FROM jobs_uk
    WHERE status = 'pending'
    LIMIT 1;

    IF v_job_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum job pendente encontrado. Crie um job primeiro.';
    END IF;

    RAISE NOTICE '✅ Driver UID: %', v_driver_uid;
    RAISE NOTICE '✅ Job ID: %', v_job_id;

    -- Inserir oferta
    INSERT INTO job_offers_uk (job_id, driver_uid, status, expires_at)
    VALUES (v_job_id, v_driver_uid, 'waiting', NOW() + INTERVAL '5 minutes')
    RETURNING id INTO v_offer_id;

    RAISE NOTICE '🎉 OFERTA CRIADA COM SUCESSO!';
    RAISE NOTICE 'Offer ID: %', v_offer_id;
    RAISE NOTICE '';
    RAISE NOTICE '👀 AGORA VERIFIQUE NO APP SE APARECEU A NOTIFICAÇÃO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Se NÃO aparecer no console do app:';
    RAISE NOTICE '  📨 Realtime INSERT received';
    RAISE NOTICE 'Então o problema é no Realtime ou RLS';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO: %', SQLERRM;
        RAISE;
END $$;

-- =====================================================
-- VERIFICAR SE A OFERTA FOI CRIADA
-- =====================================================

SELECT
    o.id,
    o.job_id,
    o.driver_uid,
    o.status,
    o.created_at,
    o.expires_at,
    j.ref,
    j.amount,
    j.collect_address,
    j.dropoff_address
FROM job_offers_uk o
JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = '4e805168-e0da-4e3e-a22c-ff15fd9d0290'::uuid
ORDER BY o.created_at DESC
LIMIT 1;

-- =====================================================
-- DIAGNÓSTICO: O QUE VERIFICAR NO APP
-- =====================================================

/*
NO CONSOLE DO EXPO, VOCÊ DEVE VER:

1. ✅ Setup do Realtime:
   📡 Setting up realtime subscription for job_offers_uk
   🔍 Filter: driver_uid=eq.4e805168-e0da-4e3e-a22c-ff15fd9d0290

2. ✅ Quando inserir a oferta, deve aparecer:
   📨 Realtime INSERT received: {...}
   🔍 Payload new: {...}
   🔍 Offer status: waiting
   ✅ Status is waiting, processing offer...
   🔔 New job offer received: ...
   🔍 Fetching job details...
   ✅ Setting current offer: {...}

SE NÃO APARECER "📨 Realtime INSERT received":
- ❌ Realtime não está habilitado no Supabase Dashboard
- ❌ RLS está bloqueando
- ❌ driver_uid não está correto

SE APARECER "📨 Realtime INSERT" MAS NÃO "✅ Status is waiting":
- ❌ Status está diferente de 'waiting'
- ❌ Verifique o valor do status no INSERT

SE APARECER TUDO MAS NÃO APARECE NA TELA:
- ❌ Problema no componente JobNotification
- ❌ currentOffer não está sendo renderizado
*/
