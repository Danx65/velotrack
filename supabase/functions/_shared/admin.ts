import { createClient } from 'jsr:@supabase/supabase-js@2';

export async function isAdmin(jwt?: string | null): Promise<boolean> {
  if (!jwt) return false;
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false },
      }
    );

    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return false;

    const { data: profile } = await client
      .from('users')
      .select('role, active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) return false;
    return (
      profile.active === true &&
      (profile.role === 'admin' || profile.role === 'administrador')
    );
  } catch {
    return false;
  }
}