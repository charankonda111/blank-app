import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@23";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

// Service-role client: bypasses row level security. Server-side only.
export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Returns the signed-in user for this request, or null.
export async function getUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function stripeClient(): Stripe {
  return new Stripe(env("STRIPE_SECRET_KEY"), {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const ACTIVE_STATUSES = ["active", "trialing"];

// Only redirect back to our own site (prevents open redirects).
export function safeReturnUrl(requested: unknown): string {
  const site = env("SITE_URL").replace(/\/+$/, "");
  if (typeof requested === "string") {
    try {
      const u = new URL(requested);
      if (u.origin === new URL(site).origin) return u.origin + u.pathname;
    } catch {
      /* fall through */
    }
  }
  return site + "/";
}
