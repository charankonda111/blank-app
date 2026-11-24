import { ptsFromPct } from "../core.jsx";

// Parse "YYYY-MM-DD" as a LOCAL date. `new Date("2026-10-01")` is parsed as UTC
// midnight, which shows as Sep 30 everywhere in Canada.
export function parseDate(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(iso);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

// Whole days from today (local) until the date. Negative = in the past.
export function daysUntil(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  return Math.round((d - startOfToday()) / 86400000);
}

export function fmtDate(iso) {
  const d = parseDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function calcGPA(courses, uid) {
  const tc = courses.reduce((s, c) => s + c.credits, 0);
  if (!tc) return null;
  return courses.reduce((s, c) => s + ptsFromPct(c.pct, uid) * c.credits, 0) / tc;
}

export function calcPct(courses) {
  const tc = courses.reduce((s, c) => s + c.credits, 0);
  if (!tc) return null;
  return courses.reduce((s, c) => s + c.pct * c.credits, 0) / tc;
}
