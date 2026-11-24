import { useState } from "react";
import { C, Logo, TInput, Btn } from "./core.jsx";
import { supabase } from "./lib/supabase.js";

const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_AUTH === "true";

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ margin: "0 auto 14px", display: "flex", justifyContent: "center" }}>
          <Logo size={64} />
        </div>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 23, color: C.text, letterSpacing: "-0.02em" }}>Lost2Med</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>Your premed journey, tracked</p>
      </div>
      <div style={{ width: "100%" }}>{children}</div>
      <p style={{ margin: "32px 0 0", fontSize: 11, color: C.muted }}>Built by Charan Konda</p>
    </div>
  );
}

function Message({ kind, children }) {
  if (!children) return null;
  const col = kind === "error" ? C.red : C.green;
  return (
    <p role={kind === "error" ? "alert" : "status"} style={{ margin: "0 0 12px", fontSize: 12, color: col, background: (kind === "error" ? C.redBg : C.greenBg), borderRadius: 10, padding: "9px 12px", lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const redirectTo = window.location.origin + window.location.pathname;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) return setError("Enter your email.");
    if (mode !== "forgot" && password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        if (!data.session) setInfo("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
        setInfo("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setError(error.message);
  }

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const sub = mode === "signin" ? "Sign in to sync your progress across devices" : mode === "signup" ? "Free forever. Upgrade to Pro any time." : "We'll email you a link to set a new password";

  return (
    <Shell>
      <form onSubmit={submit} noValidate>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 20, color: C.text }}>{title}</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: C.sub }}>{sub}</p>
        <Message kind="error">{error}</Message>
        <Message kind="info">{info}</Message>
        <label style={labelStyle}>Email</label>
        <TInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" style={{ marginBottom: 12 }} />
        {mode !== "forgot" && (
          <>
            <label style={labelStyle}>Password</label>
            <TInput type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} style={{ marginBottom: 14 }} />
          </>
        )}
        <Btn full type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Btn>
      </form>

      {GOOGLE_ENABLED && mode !== "forgot" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <Btn full variant="ghost" onClick={google}>Continue with Google</Btn>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 12 }}>
        {mode === "signin" ? (
          <>
            <LinkBtn onClick={() => switchTo("signup")}>Create an account</LinkBtn>
            <LinkBtn onClick={() => switchTo("forgot")}>Forgot password?</LinkBtn>
          </>
        ) : (
          <LinkBtn onClick={() => switchTo("signin")}>← Back to sign in</LinkBtn>
        )}
      </div>
    </Shell>
  );

  function switchTo(m) {
    setMode(m);
    setError("");
    setInfo("");
  }
}

export function NewPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  }

  return (
    <Shell>
      <form onSubmit={submit} noValidate>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 20, color: C.text }}>Set a new password</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: C.sub }}>Choose a password you haven't used before.</p>
        <Message kind="error">{error}</Message>
        <TInput type="password" value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" style={{ marginBottom: 14 }} />
        <Btn full type="submit" disabled={busy}>{busy ? "Saving…" : "Save password"}</Btn>
      </form>
    </Shell>
  );
}

function LinkBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "none", border: "none", padding: 0, color: C.blue, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      {children}
    </button>
  );
}

const labelStyle = { display: "block", margin: "0 0 5px 2px", fontSize: 11, fontWeight: 700, color: C.sub };
