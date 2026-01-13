-- =====================================================
-- VERIFICAR RLS POLICIES DA TABELA jobs_uk
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'jobs_uk';

-- 2. Ver todas as políticas RLS da tabela jobs_uk
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'jobs_uk'
ORDER BY policyname;

-- 3. Testar se consegue ver o job específico
SELECT
    id,
    job_reference,
    status,
    courierid,
    created_at
FROM jobs_uk
WHERE id = 'b7833974-884a-41c5-a89d-d5b1c6eb34b5';

-- 4. Testar sem filtro para ver todos os jobs
SELECT
    id,
    job_reference,
    status,
    courierid
FROM jobs_uk
ORDER BY created_at DESC
LIMIT 5;

-- 5. Ver quantos jobs existem no total (ignora RLS se você for admin)
SELECT COUNT(*) as total_jobs
FROM jobs_uk;

-- 6. Verificar se o driver tem permissão para ver jobs pending
SELECT
    id,
    job_reference,
    status,
    courierid
FROM jobs_uk
WHERE status = 'pending'
  AND courierid IS NULL
LIMIT 5;

-- =====================================================
-- POSSÍVEL SOLUÇÃO: Se RLS estiver bloqueando
-- =====================================================

-- Se a política RLS estiver impedindo drivers de ver jobs pending,
-- você precisa adicionar uma política que permita:

/*
CREATE POLICY "Drivers can view pending jobs"
ON jobs_uk
FOR SELECT
TO authenticated
USING (
    courierid IS NULL
    OR courierid = auth.uid()
);
*/

-- Ou se já existir uma política restritiva, você pode atualizá-la:

/*
DROP POLICY IF EXISTS "Drivers can view their own jobs" ON jobs_uk;

CREATE POLICY "Drivers can view their own jobs and pending jobs"
ON jobs_uk
FOR SELECT
TO authenticated
USING (
    courierid = auth.uid()
    OR courierid IS NULL
);
*/
