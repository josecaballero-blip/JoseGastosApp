// script de prueba de base de datos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Las claves de Supabase que encontramos previamente
const SUPABASE_URL = 'https://ayglatwzquqzrbulwslq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2xhdHd6cXVxenJidWx3c2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzcyMTQsImV4cCI6MjA5NDExMzIxNH0.6lqNNJZwPkpOPx2Fuy1j8yITWQAdfrQexMi8fZaafUg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('--- INICIANDO PRUEBA DE BASE DE DATOS ---');
  
  const testEmail = `test_${Date.now()}@josegastos.com`;
  const testPassword = 'Password123!';
  
  console.log(`1. Creando usuario de prueba: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Usuario Premium Test'
      }
    }
  });

  if (authError) {
    console.error('❌ Error creando usuario:', authError.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log(`✅ Usuario creado en Auth (ID: ${userId})`);

  // Esperar un segundo para que el trigger de BD se ejecute
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('2. Verificando perfil en public.users y plan premium...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('❌ Error obteniendo perfil:', profileError.message);
    return;
  }
  
  console.log(`✅ Perfil encontrado! Plan: ${profile.plan}`);
  if (profile.plan !== 'pro') {
    console.warn('⚠️ El plan no es "pro". El trigger podría no estar funcionando.');
  }

  console.log('3. Creando categoría de prueba...');
  const { data: category, error: catError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'Comida Test',
      icon: 'food',
      color_hex: 'FF0000'
    })
    .select()
    .single();

  if (catError) {
    console.error('❌ Error creando categoría:', catError.message);
    return;
  }
  console.log(`✅ Categoría insertada: ${category.name}`);

  console.log('4. Creando gasto de prueba usando RLS...');
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: category.id,
      amount: 15000,
      amount_base: 15000,
      description: 'Hamburguesa de prueba'
    })
    .select()
    .single();

  if (expError) {
    console.error('❌ Error insertando gasto:', expError.message);
    return;
  }
  console.log(`✅ Gasto insertado exitosamente: $${expense.amount} - ${expense.description}`);
  
  console.log('--- PRUEBA COMPLETADA CON ÉXITO ---');
}

testDatabase();
