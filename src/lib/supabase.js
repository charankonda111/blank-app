import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When the env vars are missing the app runs in "local mode": no login, data stays
// in this browser only, and Pro features are unavailable. Handy for development.
export const cloudEnabled = Boolean(url && anonKey);

export const supabase = cloudEnabled
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// Call one of our Supabase Edge Functions. Returns the parsed JSON body or throws an
// Error whose message is safe to show to the user.
export async function callFunction(name, body) {
  if (!supabase) throw new Error("Cloud features are not configured.");
  const { data, error } = await supabase.functions.invoke(name, { body: body || {} });
  if (error) {
    let message = "Something went wrong. Please try again.";
    try {
      const payload = await error.context.json();
      if (payload && payload.error) message = payload.error;
    } catch (e) {
      /* body was not JSON */
    }
    const err = new Error(message);
    err.status = error.context && error.context.status;
    throw err;
  }
  return data;
}
