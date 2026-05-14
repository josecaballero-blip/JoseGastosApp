-- ========================================================================================
-- ACTUALIZAR TABLA DE FACTURAS — Agregar campos para datos extraídos por OCR
-- ========================================================================================
-- NOTA: Corre este SQL DESPUÉS de haber creado la tabla invoices (create_invoices_table.sql)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nit TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'food';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS raw_text TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;

-- Listo! Ahora las facturas guardan todos los datos extraídos automáticamente.
