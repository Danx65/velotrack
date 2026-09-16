import { createClient } from 'jsr:@supabase/supabase-js@2';
import { isAdmin } from '../_shared/admin.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  if (!(await isAdmin(req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')))) {
    return json({ error: 'Acesso negado. Apenas administradores.' }, 403);
  }

  let payload: { email?: string; senha?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON inválido no corpo da requisição.' }, 400);
  }

  const email = (payload.email || '').trim().toLowerCase();
  const senha = payload.senha || '';

  if (!email || !senha) {
    return json({ error: 'E-mail e nova senha são obrigatórios.' }, 400);
  }
  if (senha.length < 4) {
    return json({ error: 'A senha deve ter no mínimo 4 caracteres.' }, 400);
  }

  const { data: perfil, error: profileError } = await supabase
    .from('users')
    .select('id, email, nome, role')
    .eq('email', email)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 400);
  if (!perfil) return json({ error: 'Nenhuma conta encontrada para este e-mail.' }, 404);

  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    perfil.id,
    { password: senha, email_confirm: true }
  );

  if (updateError) return json({ error: updateError.message }, 400);
  if (!updatedUser?.user) return json({ error: 'Usuário não foi atualizado.' }, 500);

  const { error: credError } = await supabase.from('credenciais_tecnicos').upsert(
    {
      id: perfil.id,
      email,
      senha,
      criado_em: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (credError) return json({ error: credError.message }, 400);

  return json({
    ok: true,
    user: { id: perfil.id, email, nome: perfil.nome, role: perfil.role },
    credentials: { email, senha },
  });
});