export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Sin las variables de entorno la app abre en modo diseño, sin login. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
