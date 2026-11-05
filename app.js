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
const S = { chatId: null, mode: "general", chats: [], docs: [], busy: false, session: null, rec: null, recOn: false, pollT: null, img: null };
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
  $("#hdrTitle").textContent = v === "chat" ? (currentChat()?.title || "Suresh AI") : v === "know" ? "నా ఫైళ్లు" : "సెట్టింగ్స్";
  if (v === "know") loadDocs();
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
function newChat() { S.chatId = null; renderWelcome(); showView("chat"); $("#inp").focus(); }
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
function decorateAssistant(b, content, sources) {
  b.innerHTML = md(content);
  if (sources && sources.length) { const s = document.createElement("div"); s.className = "src"; s.textContent = "మూలం: " + sources.map((x) => x.name).join(", "); b.appendChild(s); }
  const a = document.createElement("div"); a.className = "acts";
  const sp = document.createElement("button"); sp.innerHTML = ICON.speaker + "వినండి"; sp.onclick = () => speak(content, true);
  const cp = document.createElement("button"); cp.innerHTML = ICON.copy + "కాపీ"; cp.onclick = () => { navigator.clipboard?.writeText(content); toast("కాపీ అయింది"); };
  a.append(sp, cp); b.appendChild(a);
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
      body: JSON.stringify({ chat_id: chatId, message: text, mode: S.mode, language: cfg.lang, image: img || undefined }),
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
      const out = await res.json().catch(() => ({}));
      throw new Error(out.error || "సర్వర్ లోపం (" + res.status + ")");
    }
    // జవాబు అక్షరాలు వస్తున్నకొద్దీ చూపిస్తాం (streaming)
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", acc = "", srcs = null, err = "", bub = null, lastPaint = 0;
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
        if (o.error) err = o.error;
        if (o.done) srcs = o.sources;
      }
    }
    if (!acc) { t.remove(); throw new Error(err || "జవాబు రాలేదు, మళ్ళీ ప్రయత్నించండి"); }
    decorateAssistant(bub, acc, srcs);
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

// ---------- wiring ----------
$("#btnMenu").onclick = openDrawer;
$("#drBack").onclick = closeDrawer;
$("#btnNew").onclick = newChat;
$("#dNew").onclick = newChat;
$("#dChat").onclick = () => showView("chat");
$("#dKnow").onclick = () => showView("know");
$("#dSet").onclick = () => { renderSettings(); showView("set"); };

let booted = false;
async function boot() {
  if (booted && S.chats.length) return; booted = true;
  await loadChats();
  if (!S.chatId) renderWelcome();
  updateModeBtn();
}
applyTheme(); renderSettings(); updateModeBtn(); renderWelcome();
speechSynthesis?.getVoices();
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
