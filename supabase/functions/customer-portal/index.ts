// Opens the Stripe Customer Portal (change plan, update card, cancel, invoices).
import { adminClient, corsHeaders, getUser, json, safeReturnUrl, stripeClient } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in again." }, 401);
    const body = await req.json().catch(() => ({}));

    const { data: sub } = await adminClient()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!sub) return json({ error: "No subscription found for this account." }, 404);

    const session = await stripeClient().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: safeReturnUrl(body.returnUrl),
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("customer-portal failed", err);
    return json({ error: "Couldn't open billing. Please try again." }, 500);
  }
});
