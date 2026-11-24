import { useEffect, useState } from "react";
import { C, Btn, Tag, TInput } from "./core.jsx";
import { supabase, callFunction, cloudEnabled } from "./lib/supabase.js";

export const PRICES = {
  monthly: { label: "Monthly", price: import.meta.env.VITE_PRICE_MONTHLY_LABEL || "$4.99", per: "/month" },
  yearly: { label: "Yearly", price: import.meta.env.VITE_PRICE_YEARLY_LABEL || "$39.99", per: "/year", note: "Save 33%" },
};

const PRO_FEATURES = [
  ["✨", "AI interview summaries", "Turn any journal entry into an interview-ready answer"],
  ["🌿", "AI wellness reflections", "A supportive note based on your daily check-in"],
  ["💙", "Support an independent app", "Help keep Lost2Med growing"],
];

function Sheet({ onClose, title, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "22px 22px 0 0", padding: "20px 20px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 17, color: C.text }}>{title}</h2>
          <button aria-label="Close" onClick={onClose} style={{ background: C.hi, border: "none", borderRadius: 99, width: 30, height: 30, color: C.sub, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UpgradeSheet({ onClose, reason }) {
  const [plan, setPlan] = useState("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const { url } = await callFunction("create-checkout", { plan, returnUrl: window.location.origin + window.location.pathname });
      window.location.assign(url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title="Lost2Med Pro">
      {reason && <p style={{ margin: "0 0 14px", fontSize: 13, color: C.sub }}>{reason}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {PRO_FEATURES.map(([icon, t, d]) => (
          <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>{t}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.sub }}>{d}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {Object.entries(PRICES).map(([id, p]) => {
          const on = plan === id;
          return (
            <button key={id} onClick={() => setPlan(id)} aria-pressed={on} style={{ flex: 1, textAlign: "left", background: on ? C.blueBg : C.hi, border: "1.5px solid " + (on ? C.blue : "transparent"), borderRadius: 16, padding: "12px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: on ? C.blue : C.sub }}>{p.label}</span>
                {p.note && <Tag color={C.green}>{p.note}</Tag>}
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{p.price}</span>
              <span style={{ fontSize: 12, color: C.sub }}> CAD{p.per}</span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" style={{ margin: "0 0 10px", fontSize: 12, color: C.red }}>{error}</p>}
      <Btn full onClick={checkout} disabled={busy || !cloudEnabled}>{busy ? "Opening checkout…" : "Continue to secure checkout"}</Btn>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
        Payments handled by Stripe. Renews automatically. Cancel any time from Account → Manage subscription.
      </p>
    </Sheet>
  );
}

export function AccountSheet({ onClose, user, subscription, onUpgrade, onSignOut, syncStatus }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const { sub, isPro } = subscription;

  async function manage() {
    setBusy("portal");
    setError("");
    try {
      const { url } = await callFunction("customer-portal", { returnUrl: window.location.origin + window.location.pathname });
      window.location.assign(url);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }

  async function deleteAccount() {
    setBusy("delete");
    setError("");
    try {
      await callFunction("delete-account", {});
      await supabase.auth.signOut();
      onSignOut();
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }

  const renew = sub && sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : null;
  const syncLabel = { local: "This device only", loading: "Loading…", saved: "Synced to cloud", saving: "Saving…", offline: "Offline — will sync when back online" }[syncStatus] || "";

  return (
    <Sheet onClose={onClose} title="Account">
      {!cloudEnabled ? (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          Cloud accounts aren't configured for this copy of the app, so your data is saved in this browser only.
        </p>
      ) : (
        <>
          <Row label="Signed in as" value={user && user.email} />
          <Row label="Sync" value={syncLabel} />
          <Row
            label="Plan"
            value={
              isPro ? (
                <span>
                  <Tag color={C.green}>Pro</Tag>{" "}
                  <span style={{ fontSize: 11, color: C.sub }}>{sub.plan === "yearly" ? "Yearly" : "Monthly"}{renew ? (sub.cancel_at_period_end ? " · ends " : " · renews ") + renew : ""}</span>
                </span>
              ) : (
                <Tag color={C.sub}>Free</Tag>
              )
            }
          />
          {sub && sub.status === "past_due" && <p style={{ margin: "4px 0 10px", fontSize: 12, color: C.amber }}>Your last payment failed. Update your card in Manage subscription to keep Pro.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {!isPro && <Btn full onClick={onUpgrade}>Upgrade to Pro</Btn>}
            {sub && sub.status !== "none" && <Btn full variant="ghost" onClick={manage} disabled={busy === "portal"}>{busy === "portal" ? "Opening…" : "Manage subscription"}</Btn>}
            <Btn full variant="ghost" onClick={async () => { await supabase.auth.signOut(); onSignOut(); }}>Sign out</Btn>
          </div>
          {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: 12, color: C.red }}>{error}</p>}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid " + C.border }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", padding: 0, color: C.red, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Delete account and all data
              </button>
            ) : (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: C.mid, lineHeight: 1.5 }}>
                  This permanently deletes your account and everything you've saved, and cancels any subscription. Type <b>DELETE</b> to confirm.
                </p>
                <TInput value={deleteText} onChange={setDeleteText} placeholder="DELETE" aria-label="Type DELETE to confirm" style={{ marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small variant="muted" onClick={() => { setConfirmDelete(false); setDeleteText(""); }}>Cancel</Btn>
                  <Btn small style={{ background: C.red }} disabled={deleteText !== "DELETE" || busy === "delete"} onClick={deleteAccount}>{busy === "delete" ? "Deleting…" : "Delete forever"}</Btn>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + C.border }}>
      <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}
