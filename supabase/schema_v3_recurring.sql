-- ====================================================================
-- JOSE GASTOS - PAGOS RECURRENTES AUTOMÁTICOS (CRON JOBS)
-- ====================================================================

-- 1. Asegurarnos de que la extensión de CRON esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear la tabla de Pagos Fijos / Recurrentes
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_income BOOLEAN DEFAULT false,
    day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
    is_active BOOLEAN DEFAULT true,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Seguridad por Filas (RLS)
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring expenses" 
ON public.recurring_expenses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses" 
ON public.recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" 
ON public.recurring_expenses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" 
ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- 3. Crear la Función Inteligente que procesará los pagos
-- Esta función busca qué pagos tocan "hoy" y los inserta en la tabla de gastos
CREATE OR REPLACE FUNCTION process_recurring_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_day INTEGER;
    max_days_in_month INTEGER;
    rec RECORD;
BEGIN
    -- Obtener el día actual (ej: 1, 15, 30)
    today_day := EXTRACT(DAY FROM CURRENT_DATE);
    
    -- Ver cuántos días tiene el mes actual (por si alguien puso día 31 y estamos en Febrero)
    max_days_in_month := EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day'));

    FOR rec IN 
        SELECT * FROM public.recurring_expenses 
        WHERE is_active = true 
          -- Que no se haya procesado ya el día de hoy
          AND (last_processed_at IS NULL OR DATE(last_processed_at) < CURRENT_DATE)
          -- Que coincida el día. Si el gasto es el 31 y el mes tiene 30, se cobra el 30.
          AND (
             day_of_month = today_day 
             OR (day_of_month > max_days_in_month AND today_day = max_days_in_month)
          )
    LOOP
        -- Insertar el movimiento en la tabla principal de gastos
        INSERT INTO public.expenses (
            user_id, 
            amount, 
            amount_base,
            currency,
            description, 
            category_id, 
            is_income, 
            date
        ) VALUES (
            rec.user_id,
            rec.amount,
            rec.amount,
            'COP',
            rec.description || ' (Automático)',
            rec.category_id,
            rec.is_income,
            NOW()
        );

        -- Marcar como procesado hoy para no cobrarlo dos veces
        UPDATE public.recurring_expenses
        SET last_processed_at = NOW()
        WHERE id = rec.id;
    END LOOP;
END;
$$;

-- 4. Programar el Cron Job para que corra TODOS LOS DÍAS a las 00:05 AM (Hora UTC)
SELECT cron.schedule('process-recurring-expenses-daily', '5 0 * * *', 'SELECT process_recurring_expenses()');
