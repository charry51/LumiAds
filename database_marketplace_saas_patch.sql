-- =====================================================
-- LUMIADS — Marketplace & SaaS Architecture Patch
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. Nuevos roles basados en booleanos en la tabla perfiles
-- Esto permite que un mismo usuario pueda tener múltiples roles simultáneamente
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS es_anunciante BOOLEAN DEFAULT TRUE, -- Por defecto todos pueden comprar
ADD COLUMN IF NOT EXISTS es_host BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS es_operador BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS saldo_billetera DECIMAL(10,2) DEFAULT 0.00;

-- 2. Sistema de Suscripciones SaaS (Enum)
DO $$ BEGIN
    CREATE TYPE suscripcion_saas_enum AS ENUM ('ninguna', 'privada_pura', 'hibrida_reducida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Actualización de Pantallas (Precios Base y SaaS)
ALTER TABLE public.pantallas
ADD COLUMN IF NOT EXISTS precio_base_impacto DECIMAL(10,2) DEFAULT 0.05, -- Lo que pide el Host por impacto
ADD COLUMN IF NOT EXISTS comision_markup_porcentaje DECIMAL(5,2) DEFAULT 30.00, -- Comisión que se suma encima (ej. 30%)
ADD COLUMN IF NOT EXISTS suscripcion_saas_activa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipo_suscripcion_saas suscripcion_saas_enum DEFAULT 'ninguna';

-- 4. Actualización de Políticas (RLS) para el nuevo esquema
-- Un Operador puede ver sus pantallas privadas, los demás solo ven las públicas
DROP POLICY IF EXISTS "Acceso hibrido marketplace" ON public.pantallas;

CREATE POLICY "Acceso hibrido marketplace" ON public.pantallas
FOR SELECT USING (
  es_publica = true 
  OR organizacion_id IN (
    SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid()
  )
);
