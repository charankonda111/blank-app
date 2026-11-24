import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, cloudEnabled } from "./supabase.js";
import { LEGACY_KEY, blankState, cacheKey, hasData, normalizeState, readCache, removeCache, writeCache } from "./state.js";

// ── Auth ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(cloudEnabled);
  const [recovery, setRecovery] = useState(false); // user opened a password-reset link

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user: session ? session.user : null, loading, recovery, clearRecovery: () => setRecovery(false) };
}

// ── App data (local cache + cloud sync) ──────────────────────────────────────
// status: "local" | "loading" | "saved" | "saving" | "offline"
export function useAppData(user) {
  const uid = user ? user.id : null;
  const key = cacheKey(uid);
  const [data, setData] = useState(() => readCache(key) || blankState());
  const [status, setStatus] = useState(cloudEnabled ? "loading" : "local");
  const pending = useRef(null); // latest unsaved state
  const timer = useRef(null);
  const lastSynced = useRef(null); // updated_at of the cloud row we last saw/wrote

  const push = useCallback(async () => {
    if (!supabase || !uid || !pending.current) return;
    const snapshot = pending.current;
    setStatus("saving");
    const updated_at = new Date().toISOString();
    const { error } = await supabase.from("user_data").upsert({ user_id: uid, data: snapshot, updated_at });
    if (error) {
      setStatus("offline");
      return;
    }
    lastSynced.current = updated_at;
    if (pending.current === snapshot) pending.current = null;
    setStatus(pending.current ? "saving" : "saved");
  }, [uid]);

  // Load when the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    pending.current = null;
    if (!cloudEnabled) {
      setData(readCache(LEGACY_KEY) || blankState());
      setStatus("local");
      return;
    }
    if (!uid) return;
    setData(readCache(key) || blankState());
    setStatus("loading");
    (async () => {
      const { data: row, error } = await supabase.from("user_data").select("data, updated_at").eq("user_id", uid).maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("offline");
        return;
      }
      if (row) {
        const s = normalizeState(row.data);
        lastSynced.current = row.updated_at;
        setData(s);
        writeCache(key, s);
        setStatus("saved");
      } else {
        // First sign-in: bring over anything saved by the old no-login version on this device.
        const legacy = readCache(LEGACY_KEY);
        const initial = hasData(legacy) ? legacy : readCache(key) || blankState();
        setData(initial);
        writeCache(key, initial);
        pending.current = initial;
        await push();
        if (!cancelled && hasData(legacy)) removeCache(LEGACY_KEY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, key, push]);

  // Pick up changes made on another device when the app comes back into focus.
  useEffect(() => {
    if (!supabase || !uid) return;
    async function refresh() {
      if (document.visibilityState !== "visible" || pending.current) return;
      const { data: row } = await supabase.from("user_data").select("data, updated_at").eq("user_id", uid).maybeSingle();
      if (row && row.updated_at && row.updated_at !== lastSynced.current && !pending.current) {
        const s = normalizeState(row.data);
        lastSynced.current = row.updated_at;
        setData(s);
        writeCache(key, s);
      }
    }
    function flush() {
      if (document.visibilityState === "hidden" && pending.current) {
        clearTimeout(timer.current);
        push();
      }
    }
    function online() {
      if (pending.current) push();
    }
    document.addEventListener("visibilitychange", refresh);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("online", online);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("online", online);
    };
  }, [uid, key, push]);

  const update = useCallback(
    (fn) => {
      setData((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        writeCache(key, next);
        if (cloudEnabled && uid) {
          pending.current = next;
          setStatus("saving");
          clearTimeout(timer.current);
          timer.current = setTimeout(push, 800);
        }
        return next;
      });
    },
    [key, uid, push]
  );

  return { data, update, status };
}

// ── Subscription ─────────────────────────────────────────────────────────────
export function useSubscription(user) {
  const uid = user ? user.id : null;
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(Boolean(uid));

  const refresh = useCallback(async () => {
    if (!supabase || !uid) {
      setSub(null);
      setLoading(false);
      return null;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, plan, current_period_end, cancel_at_period_end")
      .eq("user_id", uid)
      .maybeSingle();
    setSub(data || null);
    setLoading(false);
    return data;
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = Boolean(sub && (sub.status === "active" || sub.status === "trialing"));
  return { sub, isPro, loading, refresh };
}
