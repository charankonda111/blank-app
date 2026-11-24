import { useState } from "react";
import { callFunction, cloudEnabled } from "./supabase.js";

// Shared logic for the Pro-only AI features. The request goes to our own
// `ai` Edge Function, which checks the subscription and holds the Anthropic key —
// the browser never talks to api.anthropic.com directly.
export function useAI({ isPro, onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function canUse() {
    if (!cloudEnabled) {
      setError("AI features need a Lost2Med account.");
      return true; // let the caller show the message
    }
    if (!isPro) {
      onUpgrade("AI features are part of Lost2Med Pro.");
      return false;
    }
    return true;
  }

  async function run(body) {
    setText("");
    setError("");
    if (!cloudEnabled) {
      setError("AI features need a Lost2Med account.");
      return;
    }
    setLoading(true);
    try {
      const data = await callFunction("ai", body);
      setText(data.text || "");
    } catch (e) {
      if (e.status === 402) onUpgrade("Your Pro subscription isn't active.");
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText("");
    setError("");
    setLoading(false);
  }

  return { loading, text, error, run, reset, canUse };
}
