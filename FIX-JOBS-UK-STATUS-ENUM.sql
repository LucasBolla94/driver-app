-- =====================================================
-- CORRIGIR ENUM STATUS DA TABELA jobs_uk
-- =====================================================

-- 1. Verificar estrutura da coluna status
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

-- 2. Ver valores do ENUM atual
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'job_offers_status'
ORDER BY e.enumsortorder;

-- 3. SOLUÇÃO: Converter coluna de ENUM para TEXT com CHECK constraint
-- Isso é mais flexível que ENUM

BEGIN;

-- Remover constraint antigo se existir
ALTER TABLE jobs_uk
DROP CONSTRAINT IF EXISTS jobs_uk_status_check;

-- Converter coluna de ENUM para TEXT
ALTER TABLE jobs_uk
ALTER COLUMN status TYPE TEXT;

-- Adicionar CHECK constraint com todos os valores possíveis
ALTER TABLE jobs_uk
ADD CONSTRAINT jobs_uk_status_check
CHECK (status IN ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'));

COMMIT;

-- 4. Verificar se funcionou
SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'jobs_uk'
  AND column_name = 'status';

-- 5. Ver constraint criado
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'jobs_uk'
  AND con.conname LIKE '%status%';

-- 6. Testar UPDATE com 'assigned'
UPDATE jobs_uk
SET status = 'assigned'
WHERE id = (
    SELECT id FROM jobs_uk WHERE status = 'pending' LIMIT 1
)
RETURNING id, status;

-- Se funcionou, voltar para pending
UPDATE jobs_uk
SET status = 'pending'
WHERE status = 'assigned'
  AND courierid IS NULL;
