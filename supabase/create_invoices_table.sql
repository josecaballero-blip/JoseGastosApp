-- ========================================================================================
-- CREAR TABLA DE FACTURAS / RECIBOS DIGITALES
-- ========================================================================================

-- Tabla para guardar las facturas con foto
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  image_url TEXT NOT NULL,
  invoice_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permisos RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus facturas"
ON invoices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus facturas"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios borran sus facturas"
ON invoices FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- NOTA: Copia todo esto y pégalo en el "SQL Editor" de Supabase y dale RUN.
-- Esto crea la tabla donde se guardan las facturas con su foto.
