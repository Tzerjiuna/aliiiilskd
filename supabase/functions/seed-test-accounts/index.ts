// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno?.env?.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const testAccounts = [
      { email: 'admin1@islamicboo.com', password: 'Admin@123456', full_name: 'Ahmad Faris', role: 'admin' },
      { email: 'admin2@islamicboo.com', password: 'Admin@123456', full_name: 'Siti Rahimah', role: 'admin' },
      { email: 'user1@islamicboo.com', password: 'User@123456', full_name: 'Muhammad Hafiz', role: 'user' },
      { email: 'user2@islamicboo.com', password: 'User@123456', full_name: 'Nurul Izzah', role: 'user' },
      { email: 'user3@islamicboo.com', password: 'User@123456', full_name: 'Khairul Anwar', role: 'user' },
    ];

    const results = [];

    for (const account of testAccounts) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin?.auth?.admin?.listUsers();
      const exists = existingUsers?.users?.find(u => u?.email === account?.email);

      if (exists) {
        // Update password to ensure it's correct
        const { error: updateErr } = await supabaseAdmin?.auth?.admin?.updateUserById(exists?.id, {
          password: account?.password,
          email_confirm: true,
        });
        results?.push({ email: account?.email, status: updateErr ? 'update_failed' : 'updated', error: updateErr?.message });
      } else {
        // Create new user
        const { data: newUser, error: createErr } = await supabaseAdmin?.auth?.admin?.createUser({
          email: account?.email,
          password: account?.password,
          email_confirm: true,
          user_metadata: { full_name: account?.full_name, role: account?.role },
        });

        if (!createErr && newUser?.user) {
          // Upsert user_profiles
          await supabaseAdmin?.from('user_profiles')?.upsert({
            id: newUser?.user?.id,
            email: account?.email,
            full_name: account?.full_name,
            role: account?.role,
            wallet_balance: account?.role === 'user' ? 500.00 : 0,
          }, { onConflict: 'id' });
        }

        results?.push({ email: account?.email, status: createErr ? 'failed' : 'created', error: createErr?.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
