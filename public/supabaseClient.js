const SUPABASE_URL = ''
const SUPABASE_ANON_KEY = ''
// window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    persistSession: true,
    autoRefreshToken: true
  })