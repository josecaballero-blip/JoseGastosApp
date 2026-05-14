-- ==============================================================================
-- 🚀 JOSE GASTOS - SUPABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Autor: Valeria (Database Architect Senior)
-- DBMS: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para queries geográficas (lat, lng)

-- ==============================================================================
-- 2. DEFINICIÓN DE TABLAS
-- ==============================================================================

-- TABLA: users (Extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    main_currency TEXT DEFAULT 'COP' NOT NULL,
    timezone TEXT DEFAULT 'America/Bogota',
    plan TEXT DEFAULT 'pro' CHECK (plan IN ('free', 'pro', 'family')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL significa que es categoría default global
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name) -- Evitar nombres duplicados por usuario
);

-- TABLA: expenses (Gastos e Ingresos)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'COP' NOT NULL,
    amount_base NUMERIC(15,2) NOT NULL, -- Monto convertido a la moneda principal del usuario
    description TEXT,
    place_name TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    receipt_url TEXT,
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_income BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: goals (Metas de Ahorro)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15,2) DEFAULT 0 CHECK (current_amount >= 0),
    currency TEXT DEFAULT 'COP' NOT NULL,
    deadline TIMESTAMPTZ,
    image_url TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: goal_contributions (Aportes a Metas)
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    note TEXT,
    contributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: budgets (Presupuestos Mensuales)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    current_amount NUMERIC(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'COP' NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, year, month)
);

-- TABLA: exchange_rates (Tipos de cambio)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC(10,6) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    UNIQUE(from_currency, to_currency, date)
);

-- ==============================================================================
-- 3. ÍNDICES (PERFORMANCE)
-- ==============================================================================

-- Índices B-Tree para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_cat_date ON public.expenses (user_id, category_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_income ON public.expenses (user_id, is_income, expense_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets (user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates (from_currency, to_currency, date DESC);

-- Índice GIN para búsqueda full-text rápida en descripciones de gastos
CREATE INDEX IF NOT EXISTS idx_expenses_desc_gin ON public.expenses USING GIN (to_tsvector('spanish', description));

-- Índice espacial PostGIS
-- CREATE INDEX IF NOT EXISTS idx_expenses_location ON public.expenses USING GIST (ST_MakePoint(lng, lat));

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas Users
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.users;
CREATE POLICY "Usuarios ven su propio perfil" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.users;
CREATE POLICY "Usuarios editan su propio perfil" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Políticas Categories
DROP POLICY IF EXISTS "Ver categorias (propias o defaults)" ON public.categories;
CREATE POLICY "Ver categorias (propias o defaults)" ON public.categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Crear categorias propias" ON public.categories;
CREATE POLICY "Crear categorias propias" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Editar categorias propias" ON public.categories;
CREATE POLICY "Editar categorias propias" ON public.categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Borrar categorias propias" ON public.categories;
CREATE POLICY "Borrar categorias propias" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Políticas Expenses
DROP POLICY IF EXISTS "Ver propios gastos" ON public.expenses;
CREATE POLICY "Ver propios gastos" ON public.expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Crear propios gastos" ON public.expenses;
CREATE POLICY "Crear propios gastos" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Editar propios gastos" ON public.expenses;
CREATE POLICY "Editar propios gastos" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Borrar propios gastos" ON public.expenses;
CREATE POLICY "Borrar propios gastos" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas Goals
DROP POLICY IF EXISTS "CRUD Goals" ON public.goals;
CREATE POLICY "CRUD Goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Políticas Contributions
DROP POLICY IF EXISTS "Ver contribuciones propias" ON public.goal_contributions;
CREATE POLICY "Ver contribuciones propias" ON public.goal_contributions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Crear contribuciones" ON public.goal_contributions;
CREATE POLICY "Crear contribuciones" ON public.goal_contributions FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid()));

-- Políticas Budgets
DROP POLICY IF EXISTS "CRUD Budgets" ON public.budgets;
CREATE POLICY "CRUD Budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. FUNCIONES Y TRIGGERS
-- ==============================================================================

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER: Actualizar total de Goal al insertar contribución
CREATE OR REPLACE FUNCTION trigger_update_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.goals 
    SET current_amount = current_amount + NEW.amount,
        is_completed = (current_amount + NEW.amount >= target_amount)
    WHERE id = NEW.goal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contribution_inserted ON public.goal_contributions;
CREATE TRIGGER on_contribution_inserted
AFTER INSERT ON public.goal_contributions
FOR EACH ROW EXECUTE FUNCTION trigger_update_goal_amount();

-- FUNCIÓN: get_monthly_summary (Retorna resumen rápido para Dashboard)
CREATE OR REPLACE FUNCTION get_monthly_summary(p_user_id UUID, p_year INT, p_month INT)
RETURNS TABLE (category_name TEXT, total_amount NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.name, 'Otros') as category_name,
        SUM(e.amount_base) as total_amount
    FROM public.expenses e
    LEFT JOIN public.categories c ON e.category_id = c.id
    WHERE e.user_id = p_user_id 
      AND e.is_income = false
      AND EXTRACT(YEAR FROM e.expense_date) = p_year
      AND EXTRACT(MONTH FROM e.expense_date) = p_month
    GROUP BY c.name
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. SUPABASE REALTIME CONFIGURATION
-- ==============================================================================

-- Habilitar replicación para Realtime de forma segura (evita error 42710)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 7. ESTRATEGIA DE CACHÉ Y REDIS (NOTAS ARQUITECTÓNICAS)
-- ==============================================================================
/*
  Supabase en el cliente usará una capa de caché (AsyncStorage offline).
  En el backend de Node.js (tareas pesadas), el Redis debería configurarse así:

  1. Claves: `stats:monthly:{user_id}:{year}:{month}` -> Almacena el resultado de get_monthly_summary.
  2. TTL: 5 minutos.
  3. Invalidation Policy: Al dispararse un webhook de Supabase `INSERT on expenses`, 
     el worker de Node borrará la clave `stats:monthly:{user_id}:*` para forzar refresco en la siguiente petición.
*/

-- ==============================================================================
-- 8. AUTOCREACIÓN DE PERFILES PREMIUM
-- ==============================================================================
-- Se asegura de que cada vez que alguien se registre en Supabase Auth,
-- se cree su perfil en public.users automáticamente con el plan 'pro'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'pro');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger que escucha cada registro nuevo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
