import { useState, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const FREE_LIMIT = 3;
const STORAGE_KEY = "captionlab_usage";

// ── API key is stored safely in Vercel Environment Variables (never in code)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── Paste your Google Sheet webhook URL here (instructions in README.md)
const GOOGLE_SHEET_WEBHOOK = "";

// ─── DATA ──────────────────────────────────────────────────────────────────
const TOPICS = [
  "Fitness & Wellness",
  "Food & Recipes",
  "Travel",
  "Fashion & Beauty",
  "Business & Motivation",
  "Custom…",
];
const STYLES = [
  { label: "Fun",         emoji: "🎉" },
  { label: "Motivational",emoji: "🔥" },
  { label: "Elegant",     emoji: "✨" },
];
const MODES     = ["Caption", "Video Script"];
const PLATFORMS = ["Instagram", "TikTok", "LinkedIn"];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getUsage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { count: 0, unlocked: false }; }
  catch { return { count: 0, unlocked: false }; }
}
function saveUsage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function buildPrompt(mode, topic, style, platform) {
  const base = `You are a viral ${platform} content expert.`;
  if (mode === "Caption") {
    return `${base} Write 5 scroll-stopping ${platform} captions for the topic: "${topic}".
Style: ${style}
Rules:
- Each caption must be short, punchy, and platform-native for ${platform}
- Add 5 highly relevant hashtags after each caption
- Number them 1–5
- Separate each with a blank line
- Output ONLY the captions, no intro text`;
  }
  return `${base} Write a 30–60 second ${platform} video script for the topic: "${topic}".
Style: ${style}
Rules:
- Line 1: A POWERFUL hook that stops the scroll instantly
- Then numbered steps the creator reads on camera
- Keep every line punchy — zero filler
- Final line: strong CTA tailored to ${platform}
- Output ONLY the script, no intro text`;
}

async function saveEmailToSheet(email) {
  if (!GOOGLE_SHEET_WEBHOOK) return;
  try {
    await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, date: new Date().toISOString() }),
    });
  } catch {}
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
function Pill({ label, active, onClick, accent = "#a855f7" }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 15px", borderRadius: "30px",
      border: `1.5px solid ${active ? accent : "rgba(255,255,255,0.1)"}`,
      background: active ? `${accent}22` : "transparent",
      color: active ? accent : "#777",
      cursor: "pointer", fontSize: "13px",
      fontFamily: "inherit", fontWeight: 600,
      transition: "all 0.18s", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{
      padding: small ? "4px 10px" : "6px 14px",
      borderRadius: "20px",
      border: "1.5px solid rgba(255,255,255,0.13)",
      background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
      color: copied ? "#34d399" : "#888",
      cursor: "pointer", fontSize: small ? "11px" : "12px",
      fontFamily: "inherit", fontWeight: 600,
      transition: "all 0.2s", flexShrink: 0,
    }}>{copied ? "✓ Copied" : "Copy"}</button>
  );
}

function UsageMeter({ count, unlocked }) {
  if (unlocked) return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#34d399", fontWeight:600 }}>
      <span>●</span> Pro — Unlimited
    </div>
  );
  const color = count >= FREE_LIMIT ? "#f87171" : count === 2 ? "#fb923c" : "#34d399";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
      <div style={{ width:"80px", height:"4px", borderRadius:"4px", background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
        <div style={{ width:`${Math.min((count/FREE_LIMIT)*100,100)}%`, height:"100%", background:color, borderRadius:"4px", transition:"width 0.4s" }} />
      </div>
      <span style={{ fontSize:"12px", color, fontWeight:600 }}>{count}/{FREE_LIMIT} free</span>
    </div>
  );
}

function PaywallModal({ onUnlock, onClose }) {
  const [email, setEmail]   = useState("");
  const [done,  setDone]    = useState(false);
  const [error, setError]   = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    setError("");
    await saveEmailToSheet(email);
    setDone(true);
    setTimeout(() => { onUnlock(); onClose(); }, 1400);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
      backdropFilter:"blur(8px)",
    }}>
      <div style={{
        width:"100%", maxWidth:"420px", background:"#13111a",
        border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px",
        padding:"36px", boxShadow:"0 24px 80px rgba(0,0,0,0.6)",
        animation:"fadeUp 0.3s ease both",
      }}>
        {done ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"52px", marginBottom:"14px" }}>🎉</div>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"38px", margin:"0 0 8px", color:"#fff" }}>YOU'RE IN!</h2>
            <p style={{ color:"#888", fontSize:"14px" }}>Unlocking unlimited access…</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:"40px", marginBottom:"12px", textAlign:"center" }}>🔒</div>
            <h2 style={{
              fontFamily:"'Bebas Neue',sans-serif", fontSize:"34px",
              textAlign:"center", margin:"0 0 8px",
              background:"linear-gradient(135deg,#ff5078,#a855f7)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>FREE LIMIT REACHED</h2>
            <p style={{ color:"#888", fontSize:"14px", textAlign:"center", marginBottom:"24px", lineHeight:1.65 }}>
              You've used your {FREE_LIMIT} free generations.<br />
              Enter your email to unlock <strong style={{ color:"#fff" }}>unlimited access</strong> — free during beta.
            </p>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{
                width:"100%", padding:"13px 16px", borderRadius:"12px",
                boxSizing:"border-box",
                background:"rgba(255,255,255,0.06)",
                border:`1.5px solid ${error ? "#f87171" : "rgba(255,255,255,0.12)"}`,
                color:"#f0eee8", fontSize:"14px", fontFamily:"inherit",
                outline:"none", marginBottom:"8px",
              }}
            />
            {error && <p style={{ color:"#f87171", fontSize:"12px", marginBottom:"8px" }}>{error}</p>}
            <button onClick={submit} style={{
              width:"100%", padding:"14px", borderRadius:"12px", border:"none",
              background:"linear-gradient(135deg,#ff5078,#a855f7)",
              color:"#fff", fontSize:"15px", fontWeight:700,
              fontFamily:"inherit", cursor:"pointer",
              boxShadow:"0 4px 24px rgba(255,80,120,0.35)", marginBottom:"10px",
            }}>Unlock Unlimited Access →</button>
            <button onClick={onClose} style={{
              width:"100%", padding:"10px", borderRadius:"12px",
              border:"1.5px solid rgba(255,255,255,0.08)",
              background:"transparent", color:"#555",
              fontSize:"13px", fontFamily:"inherit", cursor:"pointer",
            }}>Maybe later</button>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onRestore }) {
  if (!history.length) return null;
  return (
    <div style={{ width:"100%", maxWidth:"560px", marginTop:"16px" }}>
      <p style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#333", marginBottom:"10px" }}>
        Recent Generations
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {history.slice(0,4).map((h, i) => (
          <button key={i} onClick={() => onRestore(h)} style={{
            display:"flex", alignItems:"center", gap:"12px",
            padding:"10px 14px",
            background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:"12px", cursor:"pointer",
            textAlign:"left", width:"100%",
            color:"#888", fontSize:"13px",
            fontFamily:"inherit", transition:"all 0.15s",
          }}>
            <span style={{ fontSize:"16px" }}>{h.mode === "Caption" ? "📝" : "🎬"}</span>
            <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <strong style={{ color:"#aaa" }}>{h.topic}</strong> · {h.style} · {h.platform}
            </span>
            <span style={{ fontSize:"11px", color:"#444" }}>restore</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [mode,        setMode]        = useState("Caption");
  const [topic,       setTopic]       = useState("Fitness & Wellness");
  const [customTopic, setCustomTopic] = useState("");
  const [style,       setStyle]       = useState("Fun");
  const [platform,    setPlatform]    = useState("Instagram");
  const [result,      setResult]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [usage,       setUsage]       = useState(getUsage);
  const [showPaywall, setShowPaywall] = useState(false);
  const [history,     setHistory]     = useState([]);
  const resultRef = useRef(null);

  const finalTopic = topic === "Custom…" ? customTopic.trim() : topic;
  const atLimit    = !usage.unlocked && usage.count >= FREE_LIMIT;

  const generate = async () => {
    if (!finalTopic) return;
    if (atLimit) { setShowPaywall(true); return; }

    setLoading(true);
    setResult("");
    setError("");

    const newUsage = { ...usage, count: usage.count + 1 };
    setUsage(newUsage);
    saveUsage(newUsage);

    try {
      const prompt = buildPrompt(mode, finalTopic, style, platform);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response");
      setResult(text);
      setHistory(prev => [{ mode, topic: finalTopic, style, platform, result: text }, ...prev].slice(0, 8));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch {
      setError("Something went wrong. Please check your API key in App.js and try again.");
      setUsage(usage);
      saveUsage(usage);
    }
    setLoading(false);
  };

  const unlock = () => {
    const u = { ...usage, unlocked: true };
    setUsage(u);
    saveUsage(u);
  };

  const captions = mode === "Caption" && result
    ? result.trim().split(/\n{2,}/).filter(Boolean)
    : [];

  return (
    <div style={{
      minHeight:"100vh", background:"#0c0b12",
      fontFamily:"'DM Sans',sans-serif", color:"#f0eee8",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"0 16px 80px", position:"relative", overflowX:"hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position:"fixed", top:"-150px", left:"-100px", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(255,80,120,0.12) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-100px", right:"-80px", width:"420px", height:"420px", borderRadius:"50%", background:"radial-gradient(circle,rgba(100,80,255,0.12) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      {/* Header */}
      <div style={{ zIndex:1, textAlign:"center", marginTop:"52px", marginBottom:"32px", animation:"fadeUp 0.6s ease both" }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          background:"rgba(255,80,120,0.12)", border:"1px solid rgba(255,80,120,0.25)",
          borderRadius:"30px", padding:"5px 14px", fontSize:"11px",
          fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
          marginBottom:"20px", color:"#ff7090",
        }}>
          <span style={{ display:"inline-block", width:"6px", height:"6px", borderRadius:"50%", background:"#ff5078", animation:"pulse 2s infinite" }} />
          AI Creator Studio
        </div>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(48px,9vw,82px)", lineHeight:0.95, margin:0 }}>
          <span style={{ background:"linear-gradient(135deg,#fff 30%,#c4b5fd)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>CAPTION &</span><br />
          <span style={{ background:"linear-gradient(135deg,#ff5078,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>SCRIPT LAB</span>
        </h1>
        <p style={{ color:"#6b6875", fontSize:"15px", marginTop:"14px", lineHeight:1.6 }}>
          Stop staring at a blank screen.<br />Generate scroll-stopping content in seconds.
        </p>
      </div>

      {/* Main Card */}
      <div style={{ zIndex:1, width:"100%", maxWidth:"560px", animation:"fadeUp 0.6s 0.1s ease both" }}>
        <div style={{
          background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:"24px", padding:"28px", backdropFilter:"blur(16px)",
        }}>
          {/* Top bar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"22px" }}>
            <UsageMeter count={usage.count} unlocked={usage.unlocked} />
            <div style={{ display:"flex", gap:"6px" }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={{
                  padding:"5px 12px", borderRadius:"20px", fontSize:"12px",
                  fontWeight:600, fontFamily:"inherit",
                  border:`1.5px solid ${platform===p ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`,
                  background: platform===p ? "rgba(168,85,247,0.15)" : "transparent",
                  color: platform===p ? "#c084fc" : "#555",
                  cursor:"pointer", transition:"all 0.15s",
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div style={{ display:"flex", background:"rgba(0,0,0,0.25)", borderRadius:"14px", padding:"4px", marginBottom:"24px" }}>
            {MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:"11px", borderRadius:"11px", border:"none",
                cursor:"pointer", fontSize:"14px", fontWeight:700, fontFamily:"inherit",
                background: mode===m ? "linear-gradient(135deg,#ff5078,#a855f7)" : "transparent",
                color: mode===m ? "#fff" : "#555",
                boxShadow: mode===m ? "0 2px 12px rgba(255,80,120,0.3)" : "none",
                transition:"all 0.2s",
              }}>
                {m === "Caption" ? "📝 Caption" : "🎬 Video Script"}
              </button>
            ))}
          </div>

          {/* Topic */}
          <label style={{ fontSize:"10px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#444", display:"block", marginBottom:"10px" }}>Topic</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", marginBottom: topic==="Custom…" ? "10px" : "22px" }}>
            {TOPICS.map(t => <Pill key={t} label={t} active={topic===t} onClick={() => setTopic(t)} />)}
          </div>
          {topic === "Custom…" && (
            <input
              value={customTopic} onChange={e => setCustomTopic(e.target.value)}
              placeholder="e.g. Morning routine for busy moms…"
              style={{
                width:"100%", background:"rgba(255,255,255,0.05)",
                border:`1.5px solid ${customTopic ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:"12px", padding:"12px 16px", color:"#f0eee8",
                fontSize:"14px", fontFamily:"inherit", outline:"none",
                marginBottom:"22px", boxSizing:"border-box", transition:"border 0.2s",
              }}
            />
          )}

          {/* Style */}
          <label style={{ fontSize:"10px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#444", display:"block", marginBottom:"10px" }}>Style</label>
          <div style={{ display:"flex", gap:"8px", marginBottom:"24px" }}>
            {STYLES.map(s => (
              <button key={s.label} onClick={() => setStyle(s.label)} style={{
                flex:1, padding:"11px 6px", borderRadius:"12px",
                fontFamily:"inherit", fontWeight:600,
                border:`1.5px solid ${style===s.label ? "rgba(255,80,120,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: style===s.label ? "rgba(255,80,120,0.12)" : "transparent",
                color: style===s.label ? "#ff7090" : "#555",
                cursor:"pointer", fontSize:"13px", transition:"all 0.15s", textAlign:"center",
              }}>{s.emoji} {s.label}</button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            className="gen-btn"
            onClick={generate}
            disabled={loading || (topic === "Custom…" && !customTopic.trim())}
            style={{
              width:"100%", padding:"16px", borderRadius:"14px", border:"none",
              cursor: loading ? "wait" : "pointer",
              background: loading
                ? "rgba(255,255,255,0.07)"
                : atLimit
                  ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                  : "linear-gradient(135deg,#ff5078,#a855f7)",
              color:"#fff", fontSize:"16px", fontWeight:700, fontFamily:"inherit",
              boxShadow: loading ? "none" : "0 4px 24px rgba(255,80,120,0.3)",
              transition:"all 0.2s",
            }}
          >
            {loading
              ? <span style={{ animation:"pulse 1s infinite", display:"inline-block" }}>✦ Generating…</span>
              : atLimit ? "🔒 Unlock Unlimited Access"
              : `✦ Generate ${mode}`}
          </button>

          {atLimit && !usage.unlocked && (
            <p style={{ textAlign:"center", fontSize:"12px", color:"#555", marginTop:"10px", marginBottom:0 }}>
              3/3 free uses done · Enter email to continue free
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          zIndex:1, width:"100%", maxWidth:"560px", marginTop:"16px",
          padding:"14px 18px",
          background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)",
          borderRadius:"12px", color:"#f87171", fontSize:"14px",
        }}>⚠️ {error}</div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} style={{ zIndex:1, width:"100%", maxWidth:"560px", marginTop:"20px", animation:"fadeUp 0.5s ease both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#444" }}>
              {mode === "Caption" ? `${captions.length} Captions · ${platform}` : `Video Script · ${platform}`}
            </span>
            <div style={{ display:"flex", gap:"8px" }}>
              <CopyBtn text={result} />
              <button onClick={generate} disabled={loading} style={{
                padding:"6px 14px", borderRadius:"20px",
                border:"1.5px solid rgba(255,80,120,0.3)",
                background:"rgba(255,80,120,0.08)", color:"#ff7090",
                cursor:"pointer", fontSize:"12px", fontFamily:"inherit", fontWeight:600,
              }}>↻ Regenerate</button>
            </div>
          </div>

          {mode === "Caption" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {captions.map((cap, i) => (
                <div key={i} className="caption-card" style={{
                  background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:"16px", padding:"16px 18px", transition:"all 0.2s",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
                    <p style={{ margin:0, fontSize:"14px", lineHeight:1.7, color:"#e0dbd8", flex:1, whiteSpace:"pre-wrap" }}>{cap}</p>
                    <CopyBtn text={cap} small />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"16px", padding:"22px",
            }}>
              <pre style={{ margin:0, whiteSpace:"pre-wrap", fontSize:"14px", lineHeight:1.85, color:"#e0dbd8", fontFamily:"inherit" }}>
                {result}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div style={{ zIndex:1 }}>
        <HistoryPanel history={history} onRestore={(h) => {
          setMode(h.mode); setTopic(h.topic);
          setStyle(h.style); setPlatform(h.platform);
          setResult(h.result);
        }} />
      </div>

      <p style={{ zIndex:1, marginTop:"48px", color:"#2a2835", fontSize:"12px", letterSpacing:"1px" }}>
        CAPTION & SCRIPT LAB · Powered by Claude AI
      </p>

      {showPaywall && <PaywallModal onUnlock={unlock} onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
