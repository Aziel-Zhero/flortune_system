import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function unavailable() {
  return NextResponse.json({ error: 'Serviço de compartilhamento indisponível.' }, { status: 503 });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!supabaseAdmin) return unavailable();

  const [owned, received] = await Promise.all([
    supabaseAdmin.from('sharing_modules').select('*, module_shares(*)').eq('owner_id', user.id).order('updated_at', { ascending: false }),
    supabaseAdmin.from('module_shares').select('*, sharing_modules(*)').eq('recipient_id', user.id).order('created_at', { ascending: false }),
  ]);
  if (owned.error || received.error) return NextResponse.json({ error: owned.error?.message || received.error?.message }, { status: 500 });

  const ownerIds = [...new Set((received.data || []).map((share: any) => share.sharing_modules?.owner_id).filter(Boolean))];
  const { data: owners } = ownerIds.length
    ? await supabaseAdmin.from('profiles').select('id, display_name, full_name, email').in('id', ownerIds)
    : { data: [] as any[] };
  const ownerNames = Object.fromEntries((owners || []).map((owner: any) => [owner.id, owner.display_name || owner.full_name || owner.email]));
  return NextResponse.json({ owned: owned.data || [], received: received.data || [], ownerNames });
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!supabaseAdmin) return unavailable();
  const body = await request.json();

  if (body.action === 'create') {
    const name = String(body.name || '').trim();
    const sections = Array.isArray(body.sections) ? body.sections : [];
    if (name.length < 3 || !sections.length) return NextResponse.json({ error: 'Dados do módulo inválidos.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('sharing_modules').insert({ owner_id: user.id, name, sections }).select('*, module_shares(*)').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ module: data });
  }

  if (body.action === 'invite') {
    const email = String(body.email || '').trim().toLowerCase();
    const permission = body.permission === 'edit' ? 'edit' : 'view';
    const { data: module } = await supabaseAdmin.from('sharing_modules').select('*').eq('id', body.moduleId).eq('owner_id', user.id).single();
    if (!module) return NextResponse.json({ error: 'Módulo não encontrado.' }, { status: 404 });
    const { data: recipient } = await supabaseAdmin.from('profiles').select('id, email').ilike('email', email).single();
    if (!recipient) return NextResponse.json({ error: 'Não encontramos uma conta para este e-mail.' }, { status: 404 });
    if (recipient.id === user.id) return NextResponse.json({ error: 'Você não pode convidar a própria conta.' }, { status: 400 });
    const { data: share, error } = await supabaseAdmin.from('module_shares').upsert({ module_id: module.id, recipient_id: recipient.id, permission, status: 'pending' }, { onConflict: 'module_id,recipient_id' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from('user_notifications').insert({ user_id: recipient.id, title: 'Convite recebido', description: `Você recebeu um convite para o módulo "${module.name}".`, icon: 'Users', color: 'primary' });
    return NextResponse.json({ share, recipientEmail: recipient.email });
  }

  const { data: share } = await supabaseAdmin.from('module_shares').select('*, sharing_modules(name, owner_id)').eq('id', body.shareId).eq('recipient_id', user.id).single();
  if (!share) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 });
  if (body.action === 'accept') {
    const { error } = await supabaseAdmin.from('module_shares').update({ status: 'accepted' }).eq('id', share.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from('user_notifications').insert({ user_id: share.sharing_modules.owner_id, title: 'Convite aceito', description: `O convite para o módulo "${share.sharing_modules.name}" foi aceito.`, icon: 'Users', color: 'blue' });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'leave') {
    const { error } = await supabaseAdmin.from('module_shares').delete().eq('id', share.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
