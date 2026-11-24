// Receives Stripe webhooks and keeps public.subscriptions in sync.
// Deployed with verify_jwt = false (Stripe can't send a Supabase JWT); the Stripe
// signature check below is what authenticates the request.
import Stripe from "npm:stripe@23";
import { adminClient, env, stripeClient } from "../_shared/util.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function planFor(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === Deno.env.get("STRIPE_PRICE_MONTHLY")) return "monthly";
  if (priceId === Deno.env.get("STRIPE_PRICE_YEARLY")) return "yearly";
  return null;
}

// Newer Stripe API versions moved current_period_end from the subscription to its items.
function periodEnd(sub: Stripe.Subscription): string | null {
  // deno-lint-ignore no-explicit-any
  const s = sub as any;
  const ts = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function saveSubscription(sub: Stripe.Subscription) {
  const db = adminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id;

  // Find the user: by customer id first, then by the metadata we set at checkout.
  const { data: row } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  const userId = row?.user_id ?? sub.metadata?.supabase_user_id;
  if (!userId) {
    console.warn("No user for customer", customerId);
    return;
  }

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      plan: planFor(priceId),
      price_id: priceId ?? null,
      current_period_end: periodEnd(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = stripeClient();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env("STRIPE_WEBHOOK_SECRET"), undefined, cryptoProvider);
  } catch (err) {
    console.error("Bad webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await saveSubscription(await stripe.subscriptions.retrieve(id));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        // Re-fetch so out-of-order events can't overwrite newer state with older state.
        const sub = event.data.object as Stripe.Subscription;
        await saveSubscription(await stripe.subscriptions.retrieve(sub.id));
        break;
      }
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(`Failed to handle ${event.type}`, err);
    return new Response("Webhook handler failed", { status: 500 }); // Stripe will retry
  }
});
