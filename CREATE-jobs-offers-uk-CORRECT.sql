-- =====================================================
-- CRIAR TABELA jobs_offers_uk COM ÍNDICES CORRETOS
-- =====================================================

-- 1. CRIAR TABELA (se não existir)
CREATE TABLE IF NOT EXISTS jobs_offers_uk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs_uk(id) ON DELETE CASCADE,
  driver_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Constraint para garantir status válido
  CONSTRAINT jobs_offers_uk_status_check
  CHECK (status IN ('waiting', 'accepted', 'rejected', 'expired'))
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE

-- Índice principal: busca rápida por driver_uid + status
CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_driver_waiting
ON jobs_offers_uk(driver_uid, status)
WHERE status = 'waiting';

-- Índice para busca por job_id
CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_job_id
ON jobs_offers_uk(job_id);

-- Índice para busca por expires_at (para cron job expirar ofertas)
CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_expires_at
ON jobs_offers_uk(expires_at)
WHERE status = 'waiting';

-- Índice composto para queries complexas
CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_driver_job
ON jobs_offers_uk(driver_uid, job_id, status);

-- 3. HABILITAR ROW LEVEL SECURITY
ALTER TABLE jobs_offers_uk ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Drivers can view their own offers" ON jobs_offers_uk;
DROP POLICY IF EXISTS "Drivers can update their own offers" ON jobs_offers_uk;
DROP POLICY IF EXISTS "Service role full access" ON jobs_offers_uk;

-- 5. CRIAR POLÍTICAS RLS CORRETAS

-- Drivers podem ver APENAS suas próprias ofertas
CREATE POLICY "Drivers can view their own offers"
ON jobs_offers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);

-- Drivers podem atualizar APENAS suas próprias ofertas
CREATE POLICY "Drivers can update their own offers"
ON jobs_offers_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_uid)
WITH CHECK (auth.uid() = driver_uid);

-- Service role tem acesso total (para backend)
CREATE POLICY "Service role full access"
ON jobs_offers_uk
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE jobs_offers_uk;

-- 7. ADICIONAR COMENTÁRIOS
COMMENT ON TABLE jobs_offers_uk IS 'Tabela de ofertas de jobs para drivers';
COMMENT ON COLUMN jobs_offers_uk.driver_uid IS 'UID do driver que recebeu a oferta';
COMMENT ON COLUMN jobs_offers_uk.status IS 'Status da oferta: waiting, accepted, rejected, expired';
COMMENT ON COLUMN jobs_offers_uk.job_id IS 'ID do job da tabela jobs_uk';
COMMENT ON COLUMN jobs_offers_uk.expires_at IS 'Data/hora de expiração da oferta';

-- =====================================================
-- VERIFICAÇÕES
-- =====================================================

-- Verificar estrutura da tabela
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs_offers_uk'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jobs_offers_uk'
ORDER BY indexname;

-- Verificar políticas RLS
SELECT
    policyname,
    cmd,
    roles,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'jobs_offers_uk'
ORDER BY policyname;

-- Verificar se Realtime está habilitado
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'jobs_offers_uk';

-- ✅ Deve retornar: public | jobs_offers_uk

-- =====================================================
-- TESTE DE INSERÇÃO
-- =====================================================

-- Pegar UID do driver logado
SELECT auth.uid() as my_uid;

-- Pegar um job válido
SELECT id, ref, amount FROM jobs_uk WHERE status = 'pending' LIMIT 1;

-- Inserir oferta de teste (SUBSTITUA os valores)
/*
INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    'COLE-JOB-ID-AQUI'::uuid,
    'COLE-SEU-UID-AQUI'::uuid,
    'waiting',
    NOW() + INTERVAL '45 seconds'
);
*/

-- Ver ofertas do driver logado
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
FROM jobs_offers_uk o
JOIN jobs_uk j ON o.job_id = j.id
WHERE o.driver_uid = auth.uid()
ORDER BY o.created_at DESC;

-- =====================================================
-- FUNÇÃO PARA EXPIRAR OFERTAS ANTIGAS (OPCIONAL)
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs_offers_uk
  SET status = 'expired'
  WHERE status = 'waiting'
    AND expires_at < NOW();
END;
$$;

-- Para rodar via cron (requer extensão pg_cron):
-- SELECT cron.schedule('expire-offers', '* * * * *', 'SELECT expire_old_offers()');
