-- =====================================================
-- FIX v3: LUMIADS — Host Subscription Tiers Patch
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. Si la columna se llegó a crear a medias como ENUM, la pasamos a TEXT
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='pantallas' AND column_name='plan_host' AND data_type='USER-DEFINED'
    ) THEN
        ALTER TABLE public.pantallas ALTER COLUMN plan_host TYPE TEXT USING plan_host::text;
    END IF;
END $$;

-- 2. Añadir las columnas como TEXT (sin usar ENUM)
ALTER TABLE public.pantallas
ADD COLUMN IF NOT EXISTS plan_host TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS precio_plan_host DECIMAL(10,2) DEFAULT 0.00;

-- 3. Asegurar que las pantallas Gold sean Privadas automáticamente
CREATE OR REPLACE FUNCTION public.enforce_gold_privacy()
RETURNS trigger AS $$
BEGIN
  IF NEW.plan_host = 'gold' THEN
    NEW.es_publica := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_gold_privacy ON public.pantallas;
CREATE TRIGGER trg_enforce_gold_privacy
BEFORE INSERT OR UPDATE ON public.pantallas
FOR EACH ROW
EXECUTE FUNCTION public.enforce_gold_privacy();

-- 4. Asegurar que la billetera para anunciantes exista en perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS saldo_billetera DECIMAL(10,2) DEFAULT 0.00;

-- 5. Actualización de Políticas (RLS) para Pantallas
-- (Usamos la tabla 'hosts' para verificar el dueño de la pantalla)
DROP POLICY IF EXISTS "Acceso hibrido marketplace" ON public.pantallas;
CREATE POLICY "Acceso hibrido marketplace" ON public.pantallas
FOR SELECT USING (
  es_publica = true 
  OR id IN (
    SELECT pantalla_id FROM public.hosts WHERE perfil_id = auth.uid()
  )
  OR organizacion_id IN (
    SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid()
  )
);
