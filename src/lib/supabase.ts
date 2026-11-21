import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client singleton.
 *
 * Uses the project's Vite-prefixed env vars which are safe to expose to the
 * browser (anon key only — never the service role key). All RLS policies on
 * the `complaints` table permit the `anon` role, so this client can read and
 * write complaint tickets directly.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error at module load instead of a cryptic 401 later.
  throw new Error(
    "CivicLens: missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/** Name of the Supabase table that stores complaint tickets. */
export const COMPLAINTS_TABLE = "complaints";

/** Name of the Supabase Storage bucket for complaint photos (created lazily by uploads). */
export const COMPLAINTS_BUCKET = "complaint-photos";
