-- =====================================================
-- VERIFICAR E HABILITAR REALTIME
-- =====================================================

-- 1. Verificar se Realtime está habilitado
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'job_offers_uk';

-- Resultado esperado:
-- schemaname | tablename
-- -----------+---------------
-- public     | job_offers_uk

-- Se retornar VAZIO, execute o comando abaixo:

-- 2. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE job_offers_uk;

-- 3. Verificar novamente
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'job_offers_uk';

-- Agora deve retornar a tabela

-- 4. Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'job_offers_uk';

-- rowsecurity deve ser 't' (true)

-- 5. Verificar políticas
SELECT
    policyname,
    cmd,
    roles::text,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'job_offers_uk';

-- Deve mostrar as políticas de SELECT e UPDATE para authenticated
