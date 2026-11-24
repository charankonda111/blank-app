import { useState } from "react";
import { C, Card, Btn, Tag, TInput, TArea, Spinner } from "../core.jsx";
import { fmtDate } from "../lib/calc.js";
import { useAI } from "../lib/ai.js";

const TYPES = [
  ["volunteering", "Volunteering"],
  ["employment", "Employment"],
  ["research", "Research"],
  ["extracurricular", "Extracurricular"],
];

function JournalTab(props) {
  const { state, update } = props;
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("volunteering");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const ai = useAI(props);

  const entries = state.entries || [];
  const TYPE_COLORS = { volunteering: C.blue, employment: C.green, research: C.purple, extracurricular: C.amber };

  function resetForm() {
    setType("volunteering");
    setTitle("");
    setDate("");
    setDesc("");
    setTags("");
  }

  function addEntry() {
    if (!title.trim()) return;
    const entry = {
      id: Date.now(),
      type,
      title: title.trim(),
      date,
      desc: desc.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    update((s) => Object.assign({}, s, { entries: (s.entries || []).concat([entry]) }));
    resetForm();
    setAdding(false);
  }

  function removeEntry(e) {
    if (!window.confirm('Delete "' + e.title + '"?')) return;
    update((s) => Object.assign({}, s, { entries: (s.entries || []).filter((x) => x.id !== e.id) }));
  }

  function openAI(entry) {
    if (!ai.canUse()) return;
    setModal(entry);
    setCopied(false);
    ai.run({ kind: "journal", entry: { title: entry.title, type: entry.type, date: entry.date, desc: entry.desc, tags: entry.tags } });
  }

  function closeModal() {
    setModal(null);
    ai.reset();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(ai.text);
      setCopied(true);
    } catch (e) {
      /* clipboard blocked */
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.text }}>
            {entries.length} Experience{entries.length !== 1 ? "s" : ""}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.sub }}>Log experiences, then turn them into interview answers</p>
        </div>
        <Btn small variant={adding ? "muted" : "ghost"} onClick={() => { setAdding((a) => !a); resetForm(); }}>
          {adding ? "Cancel" : "+ Add"}
        </Btn>
      </div>

      {adding && (
        <Card>
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: C.text }}>New Experience</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <select aria-label="Experience type" value={type} onChange={(e) => setType(e.target.value)} style={{ flex: 1, minWidth: 0, border: "none", borderRadius: 10, padding: "9px 10px", fontSize: 13, background: C.hi, fontFamily: "inherit", color: C.text, outline: "none" }}>
                {TYPES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <TInput value={date} onChange={setDate} type="date" aria-label="Date" style={{ flex: 1, minWidth: 0, colorScheme: "dark" }} />
            </div>
            <TInput value={title} onChange={setTitle} placeholder="Title / Organization" />
            <TArea value={desc} onChange={setDesc} maxLength={3000} placeholder="What did you do? What did you learn?" />
            <TInput value={tags} onChange={setTags} placeholder="Tags: empathy, leadership..." />
            <Btn full variant="success" onClick={addEntry} disabled={!title.trim()}>Save Entry</Btn>
          </div>
        </Card>
      )}

      {entries.map((e) => {
        const tc = TYPE_COLORS[e.type] || C.blue;
        return (
          <div key={e.id} style={{ background: C.surface, borderRadius: 16, padding: "16px 18px", position: "relative" }}>
            <button aria-label={"Delete " + e.title} onClick={() => removeEntry(e)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, lineHeight: 1, padding: "2px 6px" }}>×</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, paddingRight: 24 }}>
              <Tag color={tc}>{e.type}</Tag>
              {e.date && <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(e.date)}</span>}
            </div>
            <p style={{ margin: "6px 0 4px", fontWeight: 700, fontSize: 14, color: C.text }}>{e.title}</p>
            {e.desc && <p style={{ margin: "0 0 10px", fontSize: 12, color: C.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.desc}</p>}
            {e.tags && e.tags.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                {e.tags.map((t) => <Tag key={t} color={C.sub}>{t}</Tag>)}
              </div>
            )}
            <button onClick={() => openAI(e)} style={{ width: "100%", textAlign: "left", background: C.blueBg, borderRadius: 8, padding: "8px 12px", border: "1px solid " + C.blue + "22", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>✨ AI interview summary</span>
              {!props.isPro && <Tag color={C.purple}>Pro</Tag>}
            </button>
          </div>
        );
      })}

      {entries.length === 0 && !adding && (
        <Card style={{ textAlign: "center", padding: "28px 20px" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: C.mid }}>No experiences yet</p>
          <p style={{ margin: 0, fontSize: 12, color: C.sub }}>Add your volunteering, research, and employment</p>
        </Card>
      )}

      {modal && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div role="dialog" aria-modal="true" aria-label="AI Interview Summary" onClick={(ev) => ev.stopPropagation()} style={{ background: C.surface, borderRadius: 20, padding: 24, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text }}>AI Interview Summary</p>
              <button aria-label="Close" onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: C.sub, fontWeight: 600 }}>{modal.title}</p>
            {ai.loading && <Spinner />}
            {ai.error && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red, lineHeight: 1.6 }}>{ai.error}</p>}
            {ai.text && !ai.loading && (
              <>
                <div style={{ background: C.blueBg, borderRadius: 12, padding: "14px 16px", border: "1px solid " + C.blue + "28" }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{ai.text}</p>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Btn small variant="ghost" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</Btn>
                  <Btn small variant="ghost" onClick={() => openAI(modal)}>Regenerate</Btn>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 10, color: C.muted }}>AI-generated. Edit it so it sounds like you and only says what really happened.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JournalTab;
