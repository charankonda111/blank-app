import { useEffect, useState } from "react";
import { C, Logo, TABS, UNIVERSITIES } from "./core.jsx";
import Onboarding from "./Onboarding.jsx";
import GPATab from "./tabs/GPATab.jsx";
import MCATTab from "./tabs/MCATTab.jsx";
import SchoolsTab from "./tabs/SchoolsTab.jsx";
import JournalTab from "./tabs/JournalTab.jsx";
import WellnessTab from "./tabs/WellnessTab.jsx";
import { AuthScreen, NewPasswordScreen } from "./Auth.jsx";
import { AccountSheet, UpgradeSheet } from "./Account.jsx";
import { cloudEnabled } from "./lib/supabase.js";
import { useAuth, useAppData, useSubscription } from "./lib/hooks.js";

const TAB_KEY = "lost2med_tab";

function Splash() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ animation: "pulse 1.2s ease-in-out infinite" }}>
        <Logo size={56} />
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.loading) return <Splash />;
  if (cloudEnabled && auth.recovery) return <NewPasswordScreen onDone={auth.clearRecovery} />;
  if (cloudEnabled && !auth.user) return <AuthScreen />;
  return <Main key={auth.user ? auth.user.id : "local"} user={auth.user} />;
}

function Main({ user }) {
  const { data, update, status } = useAppData(user);
  const subscription = useSubscription(user);
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem(TAB_KEY) || "gpa";
    } catch (e) {
      return "gpa";
    }
  });
  const [sheet, setSheet] = useState(null); // null | "account" | {upgrade: reason}
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch (e) {
      /* ignore */
    }
    window.scrollTo(0, 0);
  }, [tab]);

  // Back from Stripe Checkout: the webhook may take a few seconds to record the subscription.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (!result) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (result === "cancel") return;
    setToast("Activating Pro…");
    let tries = 0;
    let stopped = false;
    async function poll() {
      const s = await subscription.refresh();
      if (stopped) return;
      if (s && (s.status === "active" || s.status === "trialing")) {
        setToast("Welcome to Pro! ✨");
        setTimeout(() => setToast(""), 3500);
      } else if (++tries < 15) {
        setTimeout(poll, 2000);
      } else {
        setToast("Payment received — Pro will switch on shortly. Reopen the app if it doesn't.");
        setTimeout(() => setToast(""), 6000);
      }
    }
    poll();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cloudEnabled && status === "loading" && !data.userName) return <Splash />;

  const onboarded = !!(data.userName && data.userName.trim());

  function completeOnboarding(info) {
    const ymap = { "1st Year": "Year 1", "2nd Year": "Year 2", "3rd Year": "Year 3", "4th Year": "Year 4", "5th Year+": "Year 4", "Grad Student": "Year 4" };
    update((s) => Object.assign({}, s, { userName: info.name, userYear: info.year, university: info.university, currentYear: ymap[info.year] || "Year 1" }));
  }

  if (!onboarded) {
    const meta = (user && user.user_metadata) || {};
    return <Onboarding onComplete={completeOnboarding} defaultName={meta.full_name || meta.name || ""} />;
  }

  const uni = UNIVERSITIES.find((u) => u.id === (data.university || "usask")) || UNIVERSITIES.find((u) => u.id === "usask");
  const firstName = (data.userName || "").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const proProps = { isPro: subscription.isPro, onUpgrade: (reason) => setSheet({ upgrade: reason || "" }) };
  const syncDot = { saved: C.green, saving: C.amber, offline: C.red, loading: C.amber, local: C.muted }[status];
  const initial = (firstName[0] || (user && user.email && user.email[0]) || "?").toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',Arial,sans-serif", color: C.text, maxWidth: 480, margin: "0 auto", paddingBottom: 96 }}>
      <header style={{ background: "rgba(22,24,31,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "calc(14px + env(safe-area-inset-top)) 20px 14px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Logo size={38} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: C.text, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {greeting}, {firstName}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.sub }}>
                {data.userYear} · {uni.short}
                {subscription.isPro && <span style={{ color: C.purple, fontWeight: 700 }}> · Pro</span>}
              </p>
            </div>
          </div>
          <button aria-label="Account" onClick={() => setSheet("account")} style={{ position: "relative", flexShrink: 0, width: 36, height: 36, borderRadius: 99, border: "none", background: C.hi, color: C.text, fontFamily: "inherit", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            {initial}
            <span title={status} style={{ position: "absolute", right: 0, bottom: 0, width: 10, height: 10, borderRadius: 99, background: syncDot, border: "2px solid " + C.surface }} />
          </button>
        </div>
      </header>

      {toast && (
        <div role="status" style={{ position: "fixed", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 400, background: C.hi, color: C.text, padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.4)", maxWidth: "calc(100% - 32px)" }}>
          {toast}
        </div>
      )}

      <main style={{ padding: "16px 16px 0" }}>
        {tab === "gpa" && <GPATab state={data} update={update} />}
        {tab === "mcat" && <MCATTab state={data} update={update} />}
        {tab === "schools" && <SchoolsTab state={data} />}
        {tab === "journal" && <JournalTab state={data} update={update} {...proProps} />}
        {tab === "wellness" && <WellnessTab state={data} update={update} {...proProps} />}
      </main>

      <div style={{ padding: "22px 20px 6px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 10, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Logo size={14} /> Lost2Med · Built by Charan Konda
        </p>
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(22,24,31,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} aria-current={active ? "page" : undefined} onClick={() => setTab(t.id)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", padding: "12px 0 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: active ? 20 : 18, transition: "font-size .15s", opacity: active ? 1 : 0.55 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: active ? C.blue : C.muted, fontFamily: "inherit", letterSpacing: "0.02em" }}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {sheet === "account" && (
        <AccountSheet
          onClose={() => setSheet(null)}
          user={user}
          subscription={subscription}
          syncStatus={status}
          onUpgrade={() => setSheet({ upgrade: "" })}
          onSignOut={() => setSheet(null)}
        />
      )}
      {sheet && sheet.upgrade !== undefined && <UpgradeSheet reason={sheet.upgrade} onClose={() => setSheet(null)} />}
    </div>
  );
}
