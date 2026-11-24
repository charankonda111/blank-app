import { useState } from "react";
import { C, Card, Btn, Tag, TArea, Spinner, MOOD_EMOJI } from "../core.jsx";
import { fmtDate, todayISO } from "../lib/calc.js";
import { useAI } from "../lib/ai.js";

const MOOD_LABELS = ["Terrible", "Bad", "Okay", "Good", "Great"];
const STRESS_LABELS = ["None", "Mild", "Moderate", "High", "Overwhelming"];

// Defined at module level. It used to be declared inside WellnessTab, so React saw a
// brand-new component type on every render and remounted the <input>, which broke
// dragging the slider.
function Slider({ label, val, setVal, min, max, display }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>{label}</span>
        <span style={{ fontSize: 13, color: C.blue, fontWeight: 700 }}>{display}</span>
      </div>
      <input type="range" aria-label={label} min={min} max={max} value={val} onChange={(e) => setVal(Number(e.target.value))} style={{ width: "100%", accentColor: C.blue, cursor: "pointer" }} />
    </div>
  );
}

function WellnessTab(props) {
  const { state, update } = props;
  const history = state.wellness || [];
  const today = todayISO();
  const todays = history.find((h) => h.day === today);

  const [mood, setMood] = useState(todays ? todays.mood : 3);
  const [sleep, setSleep] = useState(todays ? todays.sleep : 7);
  const [appetite, setAppetite] = useState(todays ? todays.appetite : 3);
  const [stress, setStress] = useState(todays ? todays.stress : 3);
  const [note, setNote] = useState(todays ? todays.note || "" : "");
  const [flash, setFlash] = useState(false);
  const ai = useAI(props);

  function saveCheckin() {
    const entry = { day: today, mood, sleep, appetite, stress, note };
    // One check-in per day: saving again replaces today's entry instead of adding a duplicate.
    update((s) => {
      const rest = (s.wellness || []).filter((h) => h.day !== today);
      return Object.assign({}, s, { wellness: [entry].concat(rest).slice(0, 365) });
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }

  function getReflection() {
    if (!ai.canUse()) return;
    ai.run({ kind: "wellness", checkin: { mood, sleep, appetite, stress, note } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15, color: C.text }}>
          Today's Check-In {todays && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>· saved</span>}
        </p>
        <Slider label="Mood" val={mood} setVal={setMood} min={1} max={5} display={MOOD_EMOJI[mood - 1] + " " + MOOD_LABELS[mood - 1]} />
        <Slider label="Sleep" val={sleep} setVal={setSleep} min={3} max={12} display={sleep + "h"} />
        <Slider label="Appetite" val={appetite} setVal={setAppetite} min={1} max={5} display={appetite + "/5"} />
        <Slider label="Stress" val={stress} setVal={setStress} min={1} max={5} display={STRESS_LABELS[stress - 1]} />
        <TArea value={note} onChange={setNote} maxLength={2000} placeholder="Any thoughts today? (optional)" rows={2} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn style={{ flex: 1 }} onClick={saveCheckin}>{flash ? "Saved!" : todays ? "Update Check-In" : "Save Check-In"}</Btn>
          <Btn style={{ flex: 1 }} variant="ghost" onClick={getReflection} disabled={ai.loading}>
            {ai.loading ? "Thinking..." : "AI Reflection"}
            {!props.isPro && <span style={{ marginLeft: 6 }}><Tag color={C.purple}>Pro</Tag></span>}
          </Btn>
        </div>
      </Card>

      {ai.loading && <Card><Spinner /></Card>}
      {ai.error && !ai.loading && (
        <Card><p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{ai.error}</p></Card>
      )}
      {ai.text && !ai.loading && (
        <Card style={{ background: C.purpleBg, border: "1px solid " + C.purple + "28" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: C.purple }}>Reflection</p>
          <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{ai.text}</p>
          <p style={{ margin: "10px 0 0", fontSize: 10, color: C.muted }}>
            Not medical advice. If you're struggling, talk to someone you trust or call or text 988 (Suicide Crisis Helpline, Canada).
          </p>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 18px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>Recent History</p>
        </div>
        {history.length === 0 && <p style={{ margin: 0, padding: "22px 18px", fontSize: 13, color: C.muted, textAlign: "center" }}>No check-ins yet</p>}
        {history.slice(0, 10).map((h, i, arr) => (
          <div key={(h.day || h.date || "") + ":" + i} style={{ display: "flex", alignItems: "center", padding: "11px 18px", borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
            <span style={{ fontSize: 18, marginRight: 10 }}>{MOOD_EMOJI[h.mood - 1]}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.text }}>{h.day ? (h.day === today ? "Today" : fmtDate(h.day)) : h.date}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.sub }}>{h.sleep}h sleep — Stress: {STRESS_LABELS[h.stress - 1]}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default WellnessTab;
