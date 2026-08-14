import { createClient } from 'jsr:@supabase/supabase-js@2';

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

  let payload: { nome?: string; email?: string; password?: string; telefone?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON inválido no corpo da requisição.' }, 400);
  }

  const nome = (payload.nome || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';
  const telefone = (payload.telefone || '').trim();

  if (!nome || !email || !password) {
    return json({ error: 'Nome, e-mail e senha são obrigatórios.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'E-mail inválido.' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, 400);
  }

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'tecnico', nome },
  });

  if (createError) {
    const isDuplicate =
      createError.message?.toLowerCase().includes('already') ||
      createError.message?.toLowerCase().includes('exist') ||
      createError.status === 422;
    return json({ error: isDuplicate ? 'Já existe uma conta com este e-mail.' : createError.message }, 400);
  }

  if (!userData?.user) {
    return json({ error: 'Usuário não foi criado.' }, 500);
  }

  const { error: insertError } = await supabase.from('users').upsert(
    {
      id: userData.user.id,
      nome,
      telefone,
      email,
      role: 'tecnico',
      active: true,
    },
    { onConflict: 'id' }
  );

  if (insertError) {
    await supabase.auth.admin.deleteUser(userData.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true, user: { id: userData.user.id, email, nome } });
});