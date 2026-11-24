// Starts a Stripe Checkout session for Lost2Med Pro and returns its URL.
import { ACTIVE_STATUSES, adminClient, corsHeaders, env, getUser, json, safeReturnUrl, stripeClient } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const plan = body.plan === "monthly" ? "monthly" : "yearly";
    const price = plan === "monthly" ? env("STRIPE_PRICE_MONTHLY") : env("STRIPE_PRICE_YEARLY");
    const returnUrl = safeReturnUrl(body.returnUrl);

    const db = adminClient();
    const stripe = stripeClient();

    const { data: existing, error: readErr } = await db
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (existing && ACTIVE_STATUSES.includes(existing.status)) {
      return json({ error: "You already have Pro. Use Manage subscription to change plans." }, 409);
    }

    let customerId = existing?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await db.from("subscriptions").insert({ user_id: user.id, stripe_customer_id: customerId, status: "none" });
      if (error) {
        // Another request created the row first; use that customer instead.
        const { data: again } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
        if (!again) throw error;
        await stripe.customers.del(customerId).catch(() => {});
        customerId = again.stripe_customer_id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: returnUrl + "?checkout=success",
      cancel_url: returnUrl + "?checkout=cancel",
      ...(Deno.env.get("STRIPE_AUTOMATIC_TAX") === "true"
        ? { automatic_tax: { enabled: true }, customer_update: { address: "auto" as const } }
        : {}),
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("create-checkout failed", err);
    return json({ error: "Couldn't start checkout. Please try again." }, 500);
  }
});
