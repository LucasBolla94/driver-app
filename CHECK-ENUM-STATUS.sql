-- =====================================================
-- VERIFICAR ESTRUTURA DO ENUM job_offers_status
-- =====================================================

-- 1. Verificar se existe um ENUM type
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- 2. Verificar a estrutura da coluna status
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job_offers_uk'
  AND column_name = 'status';

-- 3. Verificar constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'job_offers_uk';

-- 4. Se existe ENUM, alterar a coluna para usar TEXT com CHECK constraint
-- APENAS EXECUTE SE NECESSÁRIO:

/*
-- Dropar o constraint ou enum se existir
ALTER TABLE job_offers_uk
DROP CONSTRAINT IF EXISTS job_offers_uk_status_check;

-- Se a coluna usar ENUM, converter para TEXT
ALTER TABLE job_offers_uk
ALTER COLUMN status TYPE TEXT;

-- Adicionar CHECK constraint
ALTER TABLE job_offers_uk
ADD CONSTRAINT job_offers_uk_status_check
CHECK (status IN ('waiting', 'accepted', 'rejected', 'expired'));

-- Verificar se funcionou
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'job_offers_uk'
  AND column_name = 'status';
*/
