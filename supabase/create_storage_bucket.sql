-- ========================================================================================
-- CREAR BUCKET PARA FACTURAS Y RECIBOS EN SUPABASE STORAGE
-- ========================================================================================

-- 1. Insertamos un nuevo "Bucket" público llamado 'receipts'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitimos a los usuarios autenticados subir fotos a la carpeta 'receipts'
CREATE POLICY "Usuarios pueden subir fotos de recibos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'receipts' );

-- 3. Permitimos que cualquier persona (o la app) pueda ver/descargar las fotos
CREATE POLICY "Cualquiera puede ver los recibos" 
ON storage.objects FOR SELECT 
TO public 
USING ( bucket_id = 'receipts' );

-- 4. Permitimos a los usuarios borrar sus propias fotos (opcional pero recomendado)
CREATE POLICY "Usuarios pueden borrar o actualizar fotos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'receipts' );

-- NOTA: Copia todo este texto y pégalo en el "SQL Editor" de Supabase y dale al botón "RUN" o "Correr".
