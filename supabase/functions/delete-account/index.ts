// Permanently deletes the signed-in user: cancels any Stripe subscription, then deletes
// the auth user (user_data, subscriptions and ai_usage rows cascade).
import { adminClient, corsHeaders, getUser, json, stripeClient } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in again." }, 401);
    const db = adminClient();

    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.stripe_subscription_id && !["canceled", "incomplete_expired"].includes(sub.status)) {
      await stripeClient().subscriptions.cancel(sub.stripe_subscription_id);
    }

    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json({ deleted: true });
  } catch (err) {
    console.error("delete-account failed", err);
    return json({ error: "Couldn't delete your account. Please try again or contact support." }, 500);
  }
});
