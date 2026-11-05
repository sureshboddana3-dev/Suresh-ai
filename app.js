"use strict";
// ---------- Config (ఇవి public keys; డేటా RLS తో రక్షితం. NVIDIA key ఇక్కడ లేదు) ----------
const SB_URL = "https://fatirizqjoymzpduocxz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdGlyaXpxam95bXpwZHVvY3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2ODc1MjUsImV4cCI6MjEwOTI2MzUyNX0.HB19wpwmbHs3KdAuQNy50nhDmp79CPBHAe99A81w_LM";

const ICON = {
  speaker: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 010 6"/></svg>',
  copy: '<svg class="ic sm" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/></svg>',
  trash: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  chev: '<svg class="ic" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  check: '<svg class="ic ri" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  doc: '<svg class="ic ri" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
  globe: '<svg class="ic ri" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  msg: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  image: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>',
  book: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h10"/></svg>',
  mail: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/></svg>',
  star: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
  pen: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  lock: '<svg class="ic sm" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
};
const sb = window.supabase.createClient(SB_URL, SB_KEY);
const $ = (s) => document.querySelector(s);
const MODES = {
  general:  { name: "సాధారణ చాట్", short: "సాధారణ", desc: "ఏ ప్రశ్న అయినా అడగండి" },
  study:    { name: "చదువు సహాయం", short: "చదువు", desc: "సులభంగా ఉదాహరణలతో వివరణ" },
  coding:   { name: "కోడింగ్ సహాయం", short: "కోడింగ్", desc: "కోడ్ రాయడం మరియు సరిచేయడం" },
  business: { name: "బిజినెస్ అసిస్టెంట్", short: "బిజినెస్", desc: "సందేశాలు, ప్లాన్లు, చెక్‌లిస్ట్‌లు" },
  docs:     { name: "నా డాక్యుమెంట్లు", short: "డాక్స్", desc: "మీరు అప్‌లోడ్ చేసిన ఫైళ్ల ఆధారంగా జవాబు" },
};
const S = { chatId: null, mode: "general", chats: [], docs: [], busy: false, session: null, rec: null, recOn: false, pollT: null, img: null, web: false, mem: true, set: {}, memories: [], pending: 0 };
let cfg = Object.assign({ lang: "both", voice: false, theme: "system" }, JSON.parse(localStorage.getItem("cfg") || "{}"));
const saveCfg = () => localStorage.setItem("cfg", JSON.stringify(cfg));

// ---------- helpers ----------
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function md(t) {
  const blocks = [];
  t = String(t).replace(/```(\w*)\n?([\s\S]*?)```/g, (m, l, c) => { blocks.push(c); return "\u0000B" + (blocks.length - 1) + "\u0000"; });
  t = esc(t);
  t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
  t = t.replace(/^#{1,4}\s+(.+)$/gm, "<b>$1</b>").replace(/^(\s*)[-*]\s+(.+)$/gm, "$1• $2").replace(/\n/g, "<br>");
  return t.replace(/\u0000B(\d+)\u0000/g, (m, i) => "<pre><code>" + esc(blocks[i].replace(/\n$/, "")) + "</code></pre>");
}
let toastT;
function toast(msg, ms = 2800) { const t = $("#toast"); t.textContent = msg; t.style.display = "block"; clearTimeout(toastT); toastT = setTimeout(() => (t.style.display = "none"), ms); }
function applyTheme() {
  const dark = cfg.theme === "dark" || (cfg.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0F1513" : "#F3F5F4";
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

// ---------- views / drawer / sheet ----------
function showView(v) {
  document.querySelectorAll(".view").forEach((e) => e.classList.remove("on"));
  $("#v-" + v).classList.add("on");
  $("#btnMode").style.display = v === "chat" ? "" : "none";
  $("#btnNew").style.display = v === "chat" ? "" : "none";
  $("#hdrTitle").textContent = v === "chat" ? (currentChat()?.title || "Suresh AI") : v === "know" ? "నా ఫైళ్లు" : v === "mem" ? "నా జ్ఞాపకాలు" : v === "web" ? "లైవ్ వెబ్" : "సెట్టింగ్స్";
  if (v === "know") loadDocs();
  if (v === "mem") loadMem();
  closeDrawer();
}
const openDrawer = () => { renderChatList(); $("#drawer").classList.add("open"); };
const closeDrawer = () => $("#drawer").classList.remove("open");
function openSheet(html) { $("#sheetBox").innerHTML = html; $("#sheet").classList.add("open"); }
const closeSheet = () => $("#sheet").classList.remove("open");
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
const currentChat = () => S.chats.find((c) => c.id === S.chatId);

// ---------- auth ----------
async function authDo(kind) {
  const email = $("#aEmail").value.trim(), password = $("#aPass").value;
  $("#aErr").textContent = "";
  if (!email || password.length < 6) { $("#aErr").textContent = "Email మరియు 6+ అక్షరాల password ఇవ్వండి"; return; }
  const { data, error } = kind === "in" ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
  if (error) { $("#aErr").textContent = error.message; return; }
  if (kind === "up" && !data.session) { $("#aErr").textContent = "ఖాతా తయారైంది. Email confirm చేసి లాగిన్ అవ్వండి."; }
}
$("#aIn").onclick = () => authDo("in");
$("#aUp").onclick = () => authDo("up");
$("#btnOut").onclick = async () => { await sb.auth.signOut(); };
sb.auth.onAuthStateChange((ev, session) => {
  S.session = session;
  if (session) { $("#auth").classList.remove("on"); $("#acctEmail").textContent = session.user.email; if (ev === "SIGNED_IN" || ev === "INITIAL_SESSION") boot(); }
  else { $("#auth").classList.add("on"); S.chats = []; S.chatId = null; }
});

// ---------- chats ----------
async function loadChats() {
  const { data, error } = await sb.from("chats").select("id,title,mode,updated_at").order("updated_at", { ascending: false }).limit(200);
  if (error) { toast("చాట్లు లోడ్ కాలేదు: " + error.message); return; }
  S.chats = data || [];
  renderChatList();
}
function renderChatList() {
  const q = $("#chatSearch").value.trim().toLowerCase();
  const list = S.chats.filter((c) => !q || c.title.toLowerCase().includes(q));
  const box = $("#chatlist");
  box.innerHTML = "";
  if (!list.length) { box.innerHTML = '<div class="muted" style="padding:10px">చాట్లు లేవు</div>'; return; }
  list.forEach((c) => {
    const r = document.createElement("div");
    r.className = "row";
    r.innerHTML = '<span class="grow"><div class="t"></div><div class="s"></div></span><button class="ibtn" aria-label="తొలగించు">' + ICON.trash + '</button>';
    r.querySelector(".t").textContent = c.title;
    r.querySelector(".s").textContent = (MODES[c.mode]?.short || "") + " • " + new Date(c.updated_at).toLocaleDateString("te-IN");
    r.querySelector(".grow").onclick = () => openChat(c.id);
    r.querySelector("button").onclick = (e) => { e.stopPropagation(); deleteChat(c.id); };
    box.appendChild(r);
  });
}
$("#chatSearch").addEventListener("input", renderChatList);
async function openChat(id) {
  const c = S.chats.find((x) => x.id === id);
  S.chatId = id; S.mode = c?.mode || "general"; updateModeBtn();
  const { data, error } = await sb.from("messages").select("role,content,sources,created_at").eq("chat_id", id).order("created_at");
  if (error) { toast("లోడ్ కాలేదు: " + error.message); return; }
  $("#msgs").innerHTML = "";
  (data || []).forEach((m) => addMsg(m.role, m.content, m.sources));
  showView("chat");
  scrollEnd(true);
}
function newChat() { S.chatId = null; S.web = false; syncToggles(); renderWelcome(); showView("chat"); $("#inp").focus(); }
async function deleteChat(id) {
  if (!confirm("ఈ చాట్ తొలగించాలా?")) return;
  const { error } = await sb.from("chats").delete().eq("id", id);
  if (error) { toast("తొలగించలేకపోయాం: " + error.message); return; }
  if (S.chatId === id) newChat();
  await loadChats();
}
function renderWelcome() {
  $("#msgs").innerHTML = '<div class="welcome"><h2>నమస్కారం</h2><p>ఈ రోజు ఏ పనిలో సహాయం చేయాలి?</p><div class="cards"></div></div>';
  const items = [
    { i: ICON.msg, t: "WhatsApp సందేశం", s: "ఏజెంట్లకు ప్రోత్సాహక మెసేజ్", p: "నా BC ఏజెంట్లకు పంపడానికి ఈ నెల టార్గెట్ గురించి ఒక చిన్న ప్రోత్సాహక WhatsApp సందేశం తెలుగులో రాయి" },
    { i: ICON.image, t: "ఫోటో చదివి చెప్పు", s: "ఫారం, రిపోర్ట్, బోర్డు", a: () => $("#imgFile").click() },
    { i: ICON.book, t: "నా ఫైళ్లలో వెతుకు", s: "PDF, DOCX, వెబ్ లింక్", a: () => { S.mode = "docs"; updateModeBtn(); toast("డాక్యుమెంట్ల మోడ్ ఆన్ అయింది. ప్రశ్న రాయండి"); $("#inp").focus(); } },
    { i: ICON.mail, t: "ఇంగ్లీష్ లో రాయి", s: "ఇమెయిల్, లేఖ, దరఖాస్తు", p: "Write a short, polite professional email in English to a bank branch manager asking for a review of pending BC agent accounts." },
    { i: ICON.globe.replace("ic ri", "ic"), t: "తాజా సమాచారం", s: "వెబ్ నుండి, మూలాలతో", a: () => { if (S.set.web_enabled === false) { toast("వెబ్ యాక్సెస్ ఆఫ్ లో ఉంది"); return; } S.web = true; syncToggles(); $("#inp").value = "విశాఖపట్నం లో ఈరోజు వాతావరణం ఎలా ఉంది?"; autosize(); $("#inp").focus(); } },
    { i: ICON.star, t: "నా జ్ఞాపకాలు", s: "నా గురించి గుర్తుంచుకో", a: () => showView("mem") },
  ];
  items.forEach((x) => {
    const b = document.createElement("button"); b.className = "qcard";
    b.innerHTML = '<span class="qi">' + x.i + '</span><b></b><span></span>';
    b.querySelector("b").textContent = x.t; b.lastElementChild.textContent = x.s;
    b.onclick = () => { if (x.a) x.a(); else { $("#inp").value = x.p; autosize(); $("#inp").focus(); } };
    $("#msgs .cards").appendChild(b);
  });
  $("#hdrTitle").textContent = "Suresh AI";
}

// ---------- messages UI ----------
function scrollEnd(force) { const m = $("#msgs"); if (force || m.scrollHeight - m.scrollTop - m.clientHeight < 200) m.scrollTop = m.scrollHeight; }
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return String(u); } };
function fmtTime(iso) { try { return new Date(iso).toLocaleString("te-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }
function freshInfo(w) {
  if (w.stale) return { cls: "old", text: "పాత సమాచారం • " + fmtTime(w.fetched_at) };
  if (w.cached) return { cls: "", text: "కాష్ • " + fmtTime(w.fetched_at) };
  return { cls: "fresh", text: "తాజా • " + fmtTime(w.fetched_at) };
}
const CONF = { high: "నమ్మకం: ఎక్కువ", medium: "నమ్మకం: మధ్యస్థం", low: "నమ్మకం: తక్కువ" };
function decorateAssistant(b, content, sources, extra) {
  extra = extra || {};
  b.innerHTML = md(content);
  const docs = (sources || []).filter((x) => !x.web), web = (sources || []).filter((x) => x.web && /^https:\/\//.test(x.url || ""));
  if (docs.length) { const s = document.createElement("div"); s.className = "src"; s.textContent = "మూలం: " + docs.map((x) => x.name).join(", "); b.appendChild(s); }
  if (web.length) {
    const w = document.createElement("div"); w.className = "wsrcs";
    const h = document.createElement("div"); h.className = "wh"; h.innerHTML = ICON.globe + "<span>వెబ్ మూలాలు</span>"; w.appendChild(h);
    web.forEach((x, i) => {
      const a = document.createElement("a"); a.className = "wsrc"; a.href = x.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      const t = document.createElement("b"); t.textContent = "[" + (i + 1) + "] " + x.name;
      const m = document.createElement("span"); const f = x.fetched_at ? freshInfo(x) : null;
      m.textContent = hostOf(x.url) + (f ? " • " + f.text : "");
      a.append(t, m); w.appendChild(a);
    });
    b.appendChild(w);
  }
  const chips = document.createElement("div"); chips.className = "chips";
  const mems = extra.memories || [];
  if (mems.length) {
    const c = document.createElement("button"); c.className = "cpill"; c.innerHTML = ICON.star.replace('class="ic"', 'class="ic sm"') + mems.length + " జ్ఞాపకాలు వాడాను";
    c.onclick = () => openSheet("<h3>ఈ జవాబుకు వాడిన జ్ఞాపకాలు</h3>" + mems.map((m) => '<div class="row"><span class="grow"><div class="t">' + esc(m.title) + '</div><div class="s">' + esc(CATS[m.category] || "") + "</div></span></div>").join("") + '<button class="btn ghost full" id="sheetMem" style="margin-top:8px">నా జ్ఞాపకాలు తెరువు</button>');
    chips.appendChild(c);
    setTimeout(() => { const g = document.querySelector("#sheetMem"); if (g) g.onclick = () => { closeSheet(); showView("mem"); }; }, 0);
  }
  if (extra.web) {
    const wi = extra.web;
    if (!wi.ok) { const c = document.createElement("span"); c.className = "cpill warn"; c.textContent = "వెబ్ సమాచారం దొరకలేదు" + (wi.error ? " (" + wi.error + ")" : ""); chips.appendChild(c); }
    else if (wi.stale) { const c = document.createElement("span"); c.className = "cpill warn"; c.textContent = "పాత వెబ్ డేటా • " + fmtTime(wi.fetched_at); chips.appendChild(c); }
    else if (wi.cached) { const c = document.createElement("span"); c.className = "cpill"; c.textContent = "కాష్ డేటా • " + fmtTime(wi.fetched_at); chips.appendChild(c); }
  }
  const meta = extra.meta;
  if (meta && meta.confidence && CONF[meta.confidence]) { const c = document.createElement("span"); c.className = "cpill" + (meta.confidence === "low" ? " warn" : ""); c.textContent = CONF[meta.confidence]; chips.appendChild(c); }
  if (chips.children.length) b.appendChild(chips);
  if (meta && meta.limitations) { const l = document.createElement("div"); l.className = "lim"; l.textContent = meta.limitations; b.appendChild(l); }
  const a = document.createElement("div"); a.className = "acts";
  const sp = document.createElement("button"); sp.innerHTML = ICON.speaker + "వినండి"; sp.onclick = () => speak(content, true);
  const cp = document.createElement("button"); cp.innerHTML = ICON.copy + "కాపీ"; cp.onclick = () => { navigator.clipboard?.writeText(content); toast("కాపీ అయింది"); };
  a.append(sp, cp); b.appendChild(a);
  if (meta && meta.followups && meta.followups.length) {
    const f = document.createElement("div"); f.className = "fups";
    meta.followups.forEach((q) => { const x = document.createElement("button"); x.textContent = q; x.onclick = () => { if (S.busy) return; $("#inp").value = q; autosize(); send(); }; f.appendChild(x); });
    b.appendChild(f);
  }
}
function addMsg(role, content, sources, img) {
  document.querySelector("#msgs .welcome")?.remove();
  const d = document.createElement("div"); d.className = "msg " + role;
  const b = document.createElement("div"); b.className = "bub";
  if (role === "assistant") { const av = document.createElement("span"); av.className = "av"; av.textContent = "S"; d.appendChild(av); }
  if (img) { const im = document.createElement("img"); im.className = "pic"; im.src = img; b.appendChild(im); }
  if (role === "user") b.appendChild(document.createTextNode(content)); else decorateAssistant(b, content, sources);
  d.appendChild(b); $("#msgs").appendChild(d); scrollEnd(true);
  return d;
}
function typingEl() {
  const d = document.createElement("div"); d.className = "msg assistant";
  d.innerHTML = '<span class="av">S</span><div class="bub typing"><span></span><span></span><span></span></div>';
  $("#msgs").appendChild(d); scrollEnd(true); return d;
}

// ---------- send ----------
async function ensureChat(firstText) {
  if (S.chatId) return S.chatId;
  const { data, error } = await sb.from("chats").insert({ title: firstText.slice(0, 50) || "New chat", mode: S.mode }).select("id,title,mode,updated_at").single();
  if (error) throw error;
  S.chatId = data.id; S.chats.unshift(data); return data.id;
}
async function send() {
  const inp = $("#inp"), img = S.img;
  const text = inp.value.trim() || (img ? "ఈ చిత్రం గురించి వివరించు" : "");
  if (!text || S.busy) return;
  if (!S.session) { toast("ముందు లాగిన్ అవ్వండి"); return; }
  S.busy = true; $("#btnSend").disabled = true; speechSynthesis?.cancel();
  inp.value = ""; autosize(); clearImg();
  addMsg("user", text, null, img);
  const t = typingEl();
  try {
    const chatId = await ensureChat(text);
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(SB_URL + "/functions/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token, apikey: SB_KEY },
      body: JSON.stringify({ chat_id: chatId, message: text, mode: S.mode, language: cfg.lang, image: img || undefined, use_web: S.web && S.set.web_enabled !== false ? true : undefined, use_memory: S.mem && S.set.memory_enabled !== false ? undefined : false }),
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
      const out = await res.json().catch(() => ({}));
      throw new Error(out.error || "సర్వర్ లోపం (" + res.status + ")");
    }
    // జవాబు అక్షరాలు వస్తున్నకొద్దీ చూపిస్తాం (streaming)
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", acc = "", srcs = null, err = "", bub = null, lastPaint = 0, extra = null;
    const paint = (force) => {
      const now = Date.now();
      if (!force && now - lastPaint < 90) return;
      lastPaint = now; bub.innerHTML = md(acc); scrollEnd(false);
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = block.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        let o; try { o = JSON.parse(line.slice(5).trim()); } catch { continue; }
        if (o.t) {
          if (!bub) { t.remove(); bub = addMsg("assistant", "").querySelector(".bub"); bub.innerHTML = ""; }
          acc += o.t; paint(false);
        }
        if (o.status && !bub) setStat(t, o.status);
        if (o.error) err = o.error;
        if (o.done) { srcs = o.sources; extra = { memories: o.memories, web: o.web, meta: o.meta }; }
      }
    }
    if (!acc) { t.remove(); throw new Error(err || "జవాబు రాలేదు, మళ్ళీ ప్రయత్నించండి"); }
    decorateAssistant(bub, acc, srcs, extra);
    suggestMem(text, acc, bub, chatId);
    if (err) { const n = document.createElement("div"); n.className = "src"; n.textContent = "జవాబు మధ్యలో ఆగిపోయింది"; bub.appendChild(n); }
    scrollEnd(true);
    speak(acc, false);
    loadChats();
    $("#hdrTitle").textContent = currentChat()?.title || "Suresh AI";
  } catch (e) {
    t.remove();
    addMsg("assistant", "సమస్య: " + (e.message || e));
  } finally { S.busy = false; $("#btnSend").disabled = false; }
}
function autosize() { const i = $("#inp"); i.style.height = "auto"; i.style.height = Math.min(i.scrollHeight, 140) + "px"; }
$("#inp").addEventListener("input", autosize);
$("#btnSend").onclick = send;

// ---------- image ----------
function clearImg() { S.img = null; $("#prev").classList.remove("on"); $("#prevImg").removeAttribute("src"); }
function shrinkImage(file, max = 1280, q = 0.8) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("చిత్రం తెరవలేకపోయాం")); };
    im.src = url;
  });
}
$("#btnImg").onclick = () => $("#imgFile").click();
$("#imgFile").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try { S.img = await shrinkImage(f); $("#prevImg").src = S.img; $("#prev").classList.add("on"); toast("చిత్రం సిద్ధం. ప్రశ్న రాసి పంపండి (లేదా నేరుగా ➤ నొక్కండి)", 3500); }
  catch (err) { toast("లోపం: " + err.message); }
};
$("#prevX").onclick = clearImg;

// ---------- modes ----------
function updateModeBtn() { const m = MODES[S.mode]; $("#btnMode").innerHTML = m.short + ICON.chev.replace("ic", "ic sm"); }
$("#btnMode").onclick = () => {
  openSheet("<h3>మోడ్ ఎంచుకోండి</h3>" + Object.entries(MODES).map(([k, m]) => `<div class="row opt${k === S.mode ? " sel" : ""}" data-m="${k}"><span class="grow"><div class="t">${m.name}</div><div class="s">${m.desc}</div></span>${k === S.mode ? ICON.check : ""}</div>`).join(""));
  document.querySelectorAll("#sheetBox [data-m]").forEach((r) => (r.onclick = () => { S.mode = r.dataset.m; updateModeBtn(); closeSheet(); if (S.mode === "docs") toast("మీ ఫైళ్ల ఆధారంగా జవాబు ఇస్తుంది"); }));
};

// ---------- voice ----------
function speak(text, force) {
  if (!("speechSynthesis" in window) || (!cfg.voice && !force)) return;
  speechSynthesis.cancel();
  const clean = String(text).replace(/```[\s\S]*?```/g, " ").replace(/[*#`_>]/g, " ").replace(/\s+/g, " ").slice(0, 1500);
  const te = /[ఀ-౿]/.test(clean);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = te ? "te-IN" : "en-IN";
  const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(te ? "te" : "en"));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function micToggle() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("ఈ browser లో voice input లేదు. Chrome వాడండి."); return; }
  if (S.recOn) { S.rec?.stop(); return; }
  const r = new SR();
  r.lang = cfg.lang === "en" ? "en-IN" : "te-IN"; r.interimResults = true; r.continuous = false;
  let finalT = "";
  r.onstart = () => { S.recOn = true; $("#btnMic").classList.add("rec"); };
  r.onresult = (e) => { let t = ""; for (const x of e.results) t += x[0].transcript; finalT = t; $("#inp").value = t; autosize(); };
  r.onerror = (e) => { toast(e.error === "not-allowed" ? "మైక్ అనుమతి ఇవ్వండి" : "వాయిస్ లోపం: " + e.error); };
  r.onend = () => { S.recOn = false; $("#btnMic").classList.remove("rec"); if (finalT.trim()) send(); };
  S.rec = r; r.start();
}
$("#btnMic").onclick = micToggle;

// ---------- knowledge ----------
const STATUS = { processing: "ప్రాసెస్ అవుతోంది…", ready: "సిద్ధం ✓", failed: "విఫలం" };
async function loadDocs() {
  const { data, error } = await sb.from("documents").select("id,name,type,status,error,created_at").order("created_at", { ascending: false });
  if (error) { toast("ఫైళ్లు లోడ్ కాలేదు: " + error.message); return; }
  S.docs = data || [];
  const box = $("#doclist");
  box.innerHTML = S.docs.length ? "" : '<div class="muted">ఏమీ లేవు</div>';
  S.docs.forEach((d) => {
    const r = document.createElement("div"); r.className = "row";
    r.innerHTML = (d.type === "url" ? ICON.globe : ICON.doc) + '<span class="grow"><div class="t"></div><div class="s"></div></span><span class="st"></span><button class="ibtn" aria-label="తొలగించు">' + ICON.trash + '</button>';
    r.querySelector(".t").textContent = d.name;
    r.querySelector(".s").textContent = d.status === "failed" && d.error ? d.error : new Date(d.created_at).toLocaleDateString("te-IN");
    const st = r.querySelector(".st"); st.textContent = STATUS[d.status] || d.status; st.classList.add(d.status);
    r.querySelector("button").onclick = () => deleteDoc(d.id);
    box.appendChild(r);
  });
  clearTimeout(S.pollT);
  if (S.docs.some((d) => d.status === "processing") && $("#v-know").classList.contains("on")) S.pollT = setTimeout(loadDocs, 4000);
}
async function deleteDoc(id) {
  if (!confirm("ఈ ఫైల్ తొలగించాలా?")) return;
  const { error } = await sb.from("documents").delete().eq("id", id);
  if (error) toast("తొలగించలేకపోయాం: " + error.message); else loadDocs();
}
async function callIngest(body) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(SB_URL + "/functions/v1/ingest", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token, apikey: SB_KEY }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(out.error || "సర్వర్ లోపం (" + res.status + ")");
  return out;
}
async function fileToText(file) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) { const pg = await pdf.getPage(i); const tc = await pg.getTextContent(); out += tc.items.map((x) => x.str).join(" ") + "\n\n"; }
    return out;
  }
  if (n.endsWith(".docx")) return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  return await file.text();
}
$("#btnFile").onclick = () => $("#file").click();
$("#file").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  toast("ఫైల్ చదువుతున్నాం…", 4000);
  try {
    const text = await fileToText(f);
    toast("ప్రాసెస్ అవుతోంది, కొంచెం ఆగండి…", 6000);
    const p = callIngest({ name: f.name, type: f.name.split(".").pop(), text });
    setTimeout(loadDocs, 1500);
    await p; toast("ఫైల్ సిద్ధం ✓"); loadDocs();
  } catch (err) { toast("లోపం: " + err.message, 6000); loadDocs(); }
};
$("#btnUrl").onclick = async () => {
  const url = $("#urlInp").value.trim(); if (!/^https?:\/\//i.test(url)) { toast("సరైన లింక్ ఇవ్వండి (https://…)"); return; }
  toast("లింక్ ప్రాసెస్ అవుతోంది…", 6000);
  try { const p = callIngest({ url }); setTimeout(loadDocs, 1500); await p; $("#urlInp").value = ""; toast("లింక్ సిద్ధం ✓"); loadDocs(); }
  catch (err) { toast("లోపం: " + err.message, 6000); loadDocs(); }
};

// ---------- settings ----------
function renderSettings() {
  $("#setLang").value = cfg.lang; $("#setTheme").value = cfg.theme; $("#setVoice").classList.toggle("on", cfg.voice);
}
$("#setLang").onchange = (e) => { cfg.lang = e.target.value; saveCfg(); };
$("#setTheme").onchange = (e) => { cfg.theme = e.target.value; saveCfg(); applyTheme(); };
$("#setVoice").onclick = () => { cfg.voice = !cfg.voice; saveCfg(); renderSettings(); if (cfg.voice) speak("వాయిస్ రిప్లై ఆన్ అయింది", true); };
$("#btnClear").onclick = async () => {
  if (!confirm("అన్ని చాట్లు మరియు ఫైళ్లు శాశ్వతంగా తొలగిపోతాయి. కొనసాగాలా?")) return;
  const a = await sb.from("chats").delete().not("id", "is", null);
  const b = await sb.from("documents").delete().not("id", "is", null);
  if (a.error || b.error) { toast("లోపం: " + (a.error || b.error).message); return; }
  toast("మీ డేటా తొలగించబడింది"); S.chatId = null; await loadChats(); renderWelcome(); showView("chat");
};

// ---------- Memory Plus + Live Web ----------
const CATS = { preference: "ప్రాధాన్యతలు", interest: "ఆసక్తులు", place: "ప్రదేశాలు", travel: "ప్రయాణం", diet: "ఆహారం", budget: "బడ్జెట్", work: "పని", other: "ఇతర" };
const escA = (x) => esc(x).replace(/"/g, "&quot;");
const catOpts = (sel) => Object.entries(CATS).map(([k, v]) => '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + v + "</option>").join("");
async function callFn(name, body) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(SB_URL + "/functions/v1/" + name, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token, apikey: SB_KEY }, body: JSON.stringify(body || {}) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(out.error || "సర్వర్ లోపం (" + res.status + ")");
  return out;
}
const callMem = (action, body) => callFn("memory", Object.assign({ action }, body || {}));
function setStat(el, s) {
  const b = el && el.querySelector(".bub"); if (!b) return;
  let sp = b.querySelector(".stat"); if (!sp) { sp = document.createElement("span"); sp.className = "stat"; b.appendChild(sp); }
  sp.textContent = s === "web" ? "వెబ్‌లో వెతుకుతున్నాను…" : s === "memory" ? "మీ జ్ఞాపకాలు చూస్తున్నాను…" : "ఆలోచిస్తున్నాను…";
}
function syncToggles() {
  const webOn = S.web && S.set.web_enabled !== false, memOn = S.mem && S.set.memory_enabled !== false;
  $("#tgWeb").classList.toggle("on", webOn); $("#tgWeb").classList.toggle("off", S.set.web_enabled === false); $("#tgWeb").setAttribute("aria-pressed", webOn);
  $("#tgMem").classList.toggle("on", memOn); $("#tgMem").classList.toggle("off", S.set.memory_enabled === false); $("#tgMem").setAttribute("aria-pressed", memOn);
}
$("#tgWeb").onclick = () => {
  if (S.set.web_enabled === false) { toast("వెబ్ యాక్సెస్ ఆఫ్ లో ఉంది. 'నా జ్ఞాపకాలు' పేజీలో ఆన్ చేయండి"); return; }
  S.web = !S.web; syncToggles();
  toast(S.web ? "లైవ్ వెబ్ ఆన్: ప్రతి ప్రశ్నకు తాజా సమాచారం చూస్తుంది" : "లైవ్ వెబ్ ఆఫ్: తాజా సమాచారం అడిగితే మాత్రమే వాడుతుంది");
};
$("#tgMem").onclick = () => {
  if (S.set.memory_enabled === false) { toast("జ్ఞాపకాలు ఆఫ్ లో ఉన్నాయి. 'నా జ్ఞాపకాలు' పేజీలో ఆన్ చేయండి"); return; }
  S.mem = !S.mem; syncToggles(); toast(S.mem ? "జ్ఞాపకాలు ఆన్" : "ఈ సందేశాలకు జ్ఞాపకాలు వాడను");
};
function renderBadge() { const b = $("#memBadge"); b.textContent = S.pending; b.hidden = !S.pending; }
async function refreshPending() {
  try { const { count } = await sb.from("memories").select("id", { count: "exact", head: true }).eq("status", "pending"); S.pending = count || 0; renderBadge(); } catch { /* ignore */ }
}
async function loadSettingsQuiet() { try { S.set = await callMem("settings_get"); syncToggles(); } catch { /* ignore */ } refreshPending(); }

// ---- memory suggestions after a reply (only after the user's own statements; user must accept) ----
const PERSONAL = /(నేను|నా\s|నాకు|నాది|మా\s|మాకు|\bI\b|\bI'm\b|\bmy\b|\bmine\b)/i;
function suggCard(m) {
  const d = document.createElement("div"); d.className = "sugg";
  const p = document.createElement("div"); p.textContent = "గుర్తుంచుకోవాలా? «" + m.title + "»: " + m.value; d.appendChild(p);
  const row = document.createElement("div"); row.className = "two";
  const ok = document.createElement("button"); ok.className = "btn"; ok.textContent = "సరే, గుర్తుంచుకో";
  const no = document.createElement("button"); no.className = "btn ghost"; no.textContent = "వద్దు";
  ok.onclick = async () => { try { await callMem("update", { id: m.id, status: "active" }); d.textContent = "సేవ్ అయింది ✓"; S.pending = Math.max(0, S.pending - 1); renderBadge(); } catch (e) { toast("లోపం: " + e.message); } };
  no.onclick = async () => { try { await callMem("delete", { id: m.id }); d.remove(); S.pending = Math.max(0, S.pending - 1); renderBadge(); } catch (e) { toast("లోపం: " + e.message); } };
  row.append(ok, no); d.appendChild(row); return d;
}
async function suggestMem(userText, reply, bub, chatId) {
  if (!S.mem || S.set.memory_enabled === false || userText.length < 15 || !PERSONAL.test(userText)) return;
  try {
    const out = await callMem("suggest", { user_message: userText, reply: reply.slice(0, 800), chat_id: chatId });
    const list = out.suggestions || []; if (!list.length) return;
    S.pending += list.length; renderBadge();
    list.forEach((m) => bub.appendChild(suggCard(m)));
    scrollEnd(false);
  } catch { /* suggestions are optional */ }
}

// ---- Memory page ----
async function loadMem() {
  try {
    const [l, s] = await Promise.all([callMem("list"), callMem("settings_get")]);
    S.memories = l.memories || []; S.set = s; syncToggles(); renderMem();
  } catch (e) { $("#memPage").innerHTML = '<div class="card"><div class="err">జ్ఞాపకాలు లోడ్ కాలేదు: ' + esc(e.message) + "</div></div>"; }
}
function memRow(m) {
  const r = document.createElement("div"); r.className = "mem" + (m.status === "disabled" ? " off" : "");
  r.innerHTML = '<span class="grow"><div class="t"></div><div class="s"></div></span><button class="sw' + (m.status === "active" ? " on" : "") + '" aria-label="ఆన్ / ఆఫ్"></button><button class="ibtn" aria-label="మార్చు">' + ICON.pen + '</button><button class="ibtn" aria-label="తొలగించు">' + ICON.trash + "</button>";
  r.querySelector(".t").innerHTML = (m.sensitive ? ICON.lock : "") + "<span></span>"; r.querySelector(".t span").textContent = m.title;
  r.querySelector(".s").textContent = m.value || "";
  const [sw, ed, del] = r.querySelectorAll("button");
  sw.onclick = async () => { try { await callMem("update", { id: m.id, status: m.status === "active" ? "disabled" : "active" }); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
  ed.onclick = () => editMem(m);
  del.onclick = async () => { if (!confirm("ఈ జ్ఞాపకం శాశ్వతంగా తొలగించాలా?")) return; try { await callMem("delete", { id: m.id }); toast("తొలగించబడింది"); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
  return r;
}
function renderMem() {
  const set = S.set || {}, all = S.memories || [], page = $("#memPage");
  const pend = all.filter((m) => m.status === "pending"), rest = all.filter((m) => m.status !== "pending");
  S.pending = pend.length; renderBadge();
  page.innerHTML =
    '<div class="card"><h3>ప్రైవసీ మరియు నియంత్రణ</h3>' +
    '<div class="setrow"><span>జ్ఞాపకాలు వాడు<div class="s">నా గురించి గుర్తుంచుకుని జవాబులు మెరుగుపరుస్తుంది</div></span><button class="sw' + (set.memory_enabled !== false ? " on" : "") + '" id="swMem" aria-label="జ్ఞాపకాలు"></button></div>' +
    '<div class="setrow"><span>లైవ్ వెబ్ యాక్సెస్<div class="s">ఈరోజు ' + (set.web_used_today ?? 0) + "/" + (set.web_daily_limit ?? 30) + ' శోధనలు వాడారు</div></span><button class="sw' + (set.web_enabled !== false ? " on" : "") + '" id="swWeb" aria-label="వెబ్ యాక్సెస్"></button></div>' +
    '<p class="privacy">' + ICON.lock + "<span>సున్నితమైన సమాచారం (ఆరోగ్యం, డబ్బు మొదలైనవి) మీ అనుమతితోనే, గుప్తీకరించి సేవ్ అవుతుంది. " + (set.sensitive_consent_at ? "అనుమతి ఇచ్చారు: " + esc(fmtTime(set.sensitive_consent_at)) + ". " : "ఇంకా అనుమతి ఇవ్వలేదు. ") + "మీ అనుమతి లేకుండా ఏదీ ఆటోమేటిక్ గా సేవ్ కాదు.</span></p></div>" +
    '<div id="pendBox"></div>' +
    '<div class="card"><h3>కొత్త జ్ఞాపకం జోడించండి</h3>' +
    '<select class="field" id="mCat">' + catOpts("preference") + "</select>" +
    '<input class="field" id="mTitle" placeholder="శీర్షిక (ఉదా: ఆహార నియమం)" maxlength="120">' +
    '<textarea class="field" id="mVal" rows="2" placeholder="వివరం (ఉదా: నేను శాకాహారిని)" maxlength="2000"></textarea>' +
    '<label class="chk"><input type="checkbox" id="mSens"><span>సున్నితమైన సమాచారం (గుప్తీకరించి సేవ్ చేస్తాం)</span></label>' +
    '<label class="chk consent" id="mConRow" hidden><input type="checkbox" id="mCon"><span>ఈ సమాచారాన్ని గుప్తీకరించి సేవ్ చేయడానికి నా అనుమతి ఇస్తున్నాను. తర్వాత ఎప్పుడైనా తొలగించవచ్చు.</span></label>' +
    '<button class="btn full" id="mAdd">జ్ఞాపకం సేవ్ చేయండి</button></div>' +
    '<div id="memList"></div>' +
    '<div class="card"><h3>నా డేటా</h3><div class="mfoot"><button class="btn ghost" id="mExp">జ్ఞాపకాలు డౌన్‌లోడ్ (JSON)</button><button class="btn ghost" id="mRev">సున్నితమైన వాటి అనుమతి వెనక్కి తీసుకో (అవి తొలగిపోతాయి)</button><button class="btn danger" id="mAll">అన్ని జ్ఞాపకాలు తొలగించు</button></div></div>';
  // pending suggestions
  const pb = $("#pendBox");
  if (pend.length) {
    const c = document.createElement("div"); c.className = "card"; c.innerHTML = "<h3>కొత్త సూచనలు (మీరు ఒప్పుకుంటేనే సేవ్)</h3>";
    pend.forEach((m) => {
      const d = document.createElement("div"); d.className = "pend"; d.innerHTML = '<div><b></b><div class="s"></div></div><div class="two"><button class="btn">సరే</button><button class="btn ghost">వద్దు</button></div>';
      d.querySelector("b").textContent = m.title; d.querySelector(".s").textContent = m.value || "";
      const [ok, no] = d.querySelectorAll("button");
      ok.onclick = async () => { try { await callMem("update", { id: m.id, status: "active" }); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
      no.onclick = async () => { try { await callMem("delete", { id: m.id }); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
      c.appendChild(d);
    });
    pb.appendChild(c);
  }
  // list grouped by category
  const ml = $("#memList");
  if (!rest.length) ml.innerHTML = '<div class="muted" style="padding:6px 4px 12px">ఇంకా జ్ఞాపకాలు లేవు. పైన జోడించండి, లేదా చాట్ లో "నేను శాకాహారిని" అని చెబితే నేను సూచిస్తాను.</div>';
  Object.keys(CATS).forEach((k) => {
    const items = rest.filter((m) => m.category === k); if (!items.length) return;
    const h = document.createElement("div"); h.className = "mhead"; h.textContent = CATS[k]; ml.appendChild(h);
    items.forEach((m) => ml.appendChild(memRow(m)));
  });
  // handlers
  $("#swMem").onclick = async () => { try { await callMem("settings_set", { memory_enabled: set.memory_enabled === false }); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
  $("#swWeb").onclick = async () => { try { await callMem("settings_set", { web_enabled: set.web_enabled === false }); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
  $("#mSens").onchange = (e) => { $("#mConRow").hidden = !e.target.checked; };
  $("#mAdd").onclick = async () => {
    const title = $("#mTitle").value.trim(), value = $("#mVal").value.trim(), sensitive = $("#mSens").checked;
    if (!title) { toast("శీర్షిక రాయండి"); return; }
    if (sensitive && !$("#mCon").checked) { toast("సున్నితమైన సమాచారానికి అనుమతి టిక్ చేయండి"); return; }
    $("#mAdd").disabled = true;
    try { await callMem("create", { category: $("#mCat").value, title, value, sensitive, consent: sensitive }); toast("జ్ఞాపకం సేవ్ అయింది ✓"); loadMem(); }
    catch (e) { toast("లోపం: " + e.message, 5000); $("#mAdd").disabled = false; }
  };
  $("#mExp").onclick = async () => {
    try {
      const out = await callMem("export");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "suresh-ai-memories.json";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { toast("లోపం: " + e.message); }
  };
  $("#mRev").onclick = async () => { if (!confirm("సున్నితమైన జ్ఞాపకాలన్నీ తొలగిపోతాయి, అనుమతి వెనక్కి వెళ్తుంది. కొనసాగాలా?")) return; try { await callMem("settings_set", { revoke_sensitive: true }); toast("అనుమతి వెనక్కి తీసుకున్నాం"); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
  $("#mAll").onclick = async () => { if (!confirm("అన్ని జ్ఞాపకాలు శాశ్వతంగా తొలగిపోతాయి. కొనసాగాలా?")) return; try { await callMem("delete_all"); toast("అన్నీ తొలగించబడ్డాయి"); loadMem(); } catch (e) { toast("లోపం: " + e.message); } };
}
function editMem(m) {
  openSheet('<h3>జ్ఞాపకం మార్చండి</h3><select class="field" id="eCat">' + catOpts(m.category) + '</select><input class="field" id="eTitle" maxlength="120" value="' + escA(m.title) + '"><textarea class="field" id="eVal" rows="3" maxlength="2000">' + esc(m.value || "") + '</textarea><label class="chk"><input type="checkbox" id="eSens"' + (m.sensitive ? " checked" : "") + '><span>సున్నితమైనది (గుప్తీకరిస్తాం)</span></label><label class="chk consent" id="eConRow" hidden><input type="checkbox" id="eCon"><span>గుప్తీకరించి సేవ్ చేయడానికి నా అనుమతి ఇస్తున్నాను</span></label><div class="two"><button class="btn ghost" id="eCancel">రద్దు</button><button class="btn" id="eSave">సేవ్</button></div>');
  const upd = () => { $("#eConRow").hidden = !($("#eSens").checked && !m.sensitive); };
  $("#eSens").onchange = upd; upd();
  $("#eCancel").onclick = closeSheet;
  $("#eSave").onclick = async () => {
    const sensitive = $("#eSens").checked;
    if (sensitive && !m.sensitive && !$("#eCon").checked) { toast("సున్నితమైన సమాచారానికి అనుమతి టిక్ చేయండి"); return; }
    try { await callMem("update", { id: m.id, category: $("#eCat").value, title: $("#eTitle").value.trim(), value: $("#eVal").value.trim(), sensitive, consent: sensitive }); closeSheet(); toast("అప్‌డేట్ అయింది ✓"); loadMem(); }
    catch (e) { toast("లోపం: " + e.message, 5000); }
  };
}

// ---- Live Web page ----
function renderWeb(out, q) {
  const box = $("#wRes"); box.innerHTML = "";
  const f = freshInfo(out);
  const meta = document.createElement("div"); meta.className = "wmeta";
  meta.innerHTML = '<span class="tag ' + f.cls + '"></span><span></span>';
  meta.children[0].textContent = f.text;
  meta.children[1].textContent = out.note ? out.note : (out.stale ? "తాజా సమాచారం తీసుకోలేకపోయాం, పాత ఫలితాలు చూపిస్తున్నాం" : "");
  box.appendChild(meta);
  (out.results || []).forEach((r, i) => {
    if (!/^https:\/\//.test(r.url)) return;
    const a = document.createElement("a"); a.className = "wcard"; a.href = r.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.innerHTML = '<b></b><div class="h"></div><p></p>';
    a.querySelector("b").textContent = "[" + (i + 1) + "] " + r.title;
    a.querySelector(".h").textContent = hostOf(r.url) + (r.published ? " • " + r.published : "") + " • తీసుకున్నది " + fmtTime(out.fetched_at);
    a.querySelector("p").textContent = r.snippet;
    box.appendChild(a);
  });
  const ask = document.createElement("button"); ask.className = "btn full"; ask.textContent = "ఈ విషయం చాట్ లో అడగండి";
  ask.onclick = () => { newChat(); S.web = true; syncToggles(); $("#inp").value = q; autosize(); };
  box.appendChild(ask);
}
async function webGo(fresh) {
  const q = $("#wQ").value.trim(); if (q.length < 2) { toast("ప్రశ్న రాయండి"); return; }
  if (S.set.web_enabled === false) { toast("వెబ్ యాక్సెస్ ఆఫ్ లో ఉంది. 'నా జ్ఞాపకాలు' పేజీలో ఆన్ చేయండి"); return; }
  $("#wRes").innerHTML = '<div class="muted" style="padding:4px">వెతుకుతున్నాం…</div>';
  $("#wGo").disabled = $("#wFresh").disabled = true;
  try { renderWeb(await callFn("web-search", { query: q, fresh: !!fresh }), q); }
  catch (e) { $("#wRes").innerHTML = ""; const d = document.createElement("div"); d.className = "card"; d.innerHTML = '<div class="err"></div><p class="muted" style="margin:0">వెబ్ సమాచారం ఇప్పుడు దొరకలేదు. కొంచెం సేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.</p>'; d.querySelector(".err").textContent = e.message; $("#wRes").appendChild(d); }
  finally { $("#wGo").disabled = $("#wFresh").disabled = false; }
}
$("#wGo").onclick = () => webGo(false);
$("#wFresh").onclick = () => webGo(true);
$("#wQ").addEventListener("keydown", (e) => { if (e.key === "Enter") webGo(false); });

// ---------- wiring ----------
$("#btnMenu").onclick = openDrawer;
$("#drBack").onclick = closeDrawer;
$("#btnNew").onclick = newChat;
$("#dNew").onclick = newChat;
$("#dChat").onclick = () => showView("chat");
$("#dKnow").onclick = () => showView("know");
$("#dMem").onclick = () => showView("mem");
$("#dWeb").onclick = () => showView("web");
$("#dSet").onclick = () => { renderSettings(); showView("set"); };

let booted = false;
async function boot() {
  if (booted && S.chats.length) return; booted = true;
  await loadChats();
  if (!S.chatId) renderWelcome();
  updateModeBtn();
  loadSettingsQuiet();
}
applyTheme(); renderSettings(); updateModeBtn(); renderWelcome();
speechSynthesis?.getVoices();
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
