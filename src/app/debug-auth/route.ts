// src/app/debug-auth/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Variáveis de ambiente faltando',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste 1: Listar usuários
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, hashed_password, display_name')
      .limit(5);

    if (usersError) {
      return NextResponse.json({ error: 'Erro ao buscar usuários: ' + usersError.message }, { status: 500 });
    }

    // Teste 2: Verificar estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      users: users,
      tableStructure: tableInfo ? Object.keys(tableInfo[0] || {}) : 'No data',
      userCount: users?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
