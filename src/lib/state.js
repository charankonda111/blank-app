// App data shape + local cache. The same object is synced to Supabase when signed in.

export const LEGACY_KEY = "lost2med_v5"; // key used by the original single-file app

export function blankState() {
  return {
    userName: "",
    userYear: "",
    university: "usask",
    currentYear: "Year 1",
    courses: { "Year 1": [], "Year 2": [], "Year 3": [], "Year 4": [] },
    exams: {},
    entries: [],
    wellness: [],
  };
}

// Fill in missing fields and repair data saved by older versions.
export function normalizeState(raw) {
  const s = Object.assign(blankState(), raw || {});
  s.courses = Object.assign(blankState().courses, s.courses || {});
  s.exams = s.exams || {};
  s.entries = Array.isArray(s.entries) ? s.entries : [];
  s.wellness = (Array.isArray(s.wellness) ? s.wellness : []).map((w) =>
    // Old check-ins stored "Nov 3" with no year; keep them but mark as legacy.
    w.day ? w : Object.assign({}, w, { day: null })
  );
  return s;
}

export function hasData(s) {
  if (!s) return false;
  if (s.userName && s.userName.trim()) return true;
  const courses = Object.values(s.courses || {}).some((a) => a && a.length);
  return courses || (s.entries || []).length > 0 || (s.wellness || []).length > 0 || Object.keys(s.exams || {}).length > 0;
}

export function cacheKey(userId) {
  return userId ? LEGACY_KEY + ":" + userId : LEGACY_KEY;
}

export function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
}

export function writeCache(key, s) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch (e) {
    /* storage full or blocked */
  }
}

export function removeCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
