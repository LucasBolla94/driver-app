-- =====================================================
-- DEBUG: Investigar estrutura da tabela jobs_uk
-- =====================================================

-- 1. Verificar tipo da coluna status em jobs_uk
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs_uk'
  AND column_name = 'status';

-- 2. Verificar se existe algum ENUM relacionado à jobs_uk
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%job%status%'
ORDER BY t.typname, e.enumsortorder;

-- 3. Verificar constraints na tabela jobs_uk
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'jobs_uk';

-- 4. Verificar views que possam estar afetando jobs_uk
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE viewname LIKE '%job%'
  OR definition LIKE '%jobs_uk%';

-- 5. Teste simples: buscar jobs sem filtro de status
SELECT
    id,
    status,
    courierid,
    assigned_at
FROM jobs_uk
WHERE courierid = auth.uid()
LIMIT 5;

-- 6. Verificar quais valores de status existem atualmente
SELECT DISTINCT status
FROM jobs_uk
ORDER BY status;
