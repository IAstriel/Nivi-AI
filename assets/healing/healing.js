// mind.js — capa Mind (orquesta todo) + usa ui/scene/ai
import { $, makeBubble, makeTyping, scrollToBottom, wireAutosize, typeIntroLines } from "./ui.js";
import { startSnow, createMusicController } from "./scene.js";
import { createAIClient } from "./ai.js";


/* --- Greeting intent (one per session) --- */
function hsRandPick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function hsGetGreetingIntentOnce(){
  // Cambié la key para que los nuevos estados/rareza apliquen sin que te quede cacheado el viejo saludo
  const key = "hs_greet_state_v2";
  const saved = sessionStorage.getItem(key);
  if(saved) return saved;

  // Estados de saludo (interpretados por el Worker)
  // Sistema de rareza: repetimos estados para darles más probabilidad.
  // Comunes: happy/romantic/flirty/curious
  // Especial: poetic
  // Raros: sad/broken/jealous_nivi/jealous_venus
  const pool = [
    // comunes (x5)
    "hs_greet_happy","hs_greet_happy","hs_greet_happy","hs_greet_happy","hs_greet_happy",
    "hs_greet_romantic","hs_greet_romantic","hs_greet_romantic","hs_greet_romantic",
    "hs_greet_flirty","hs_greet_flirty","hs_greet_flirty",
    "hs_greet_curious","hs_greet_curious",

    // especial (x2)
    "hs_greet_poetic","hs_greet_poetic",

    // raros (x1)
    "hs_greet_sad","hs_greet_sad",
    "hs_greet_broken","hs_greet_broken",
    "hs_greet_jealous_nivi",
    "hs_greet_jealous_venus"
  ];

  const picked = hsRandPick(pool);
  sessionStorage.setItem(key, picked);
  return picked;
}
/* --- end greeting intent helpers --- */

// ========= Config rápida =========
const USE_REAL_AI = true;
const AI_DEBUG    = true;
const AI_ENDPOINT = "https://yukibou-whisper.bangboxs7.workers.dev/api/chat";

const MUSIC_TRACKS = [
  { id:"m1", src:"assets/audio/bgm/m1.mp3", label:"Música 1" },
  { id:"m2", src:"assets/audio/bgm/m2.mp3", label:"Música 2" },
  { id:"m3", src:"assets/audio/bgm/m3.mp3", label:"Música 3" },
];

const SECRET_CODE = "281";
const SECRET_TARGET_HTML = "secret/index.html";

// ========= DOM =========
const enterBtn   = $("enterBtn");
const introLayer = $("introLayer");
const chatLayer  = $("chatLayer");

const chatArea   = $("chatArea");
const sendBtn    = $("sendBtn");
const ta         = $("msgInput");

const paperMusicBtn = $("paperMusicBtn");
const paperLockBtn  = $("paperLockBtn");

let introTyper = null;

// ========= Scene =========
startSnow($("snowCanvas"));
const music = createMusicController(paperMusicBtn, MUSIC_TRACKS);

// ========= UI =========
const autosize = wireAutosize(ta);


// ========= Stickers (intro) =========
// Elige 1 sticker por sesión leyendo assets/data/stickers/stickers.json
// Si falla, usa el fallback (assets/images/healing_station.png).
async function initIntroSticker(){
  const img = document.getElementById("introSticker");
  if(!img) return;

  // fallback inmediato (por si tarda el fetch)
  const FALLBACK_SRC = img.getAttribute("src") || "assets/images/healing_station.png";

  function setSrcSafe(src){ img.src = src; }

  // carga con validación (onload/onerror)
  function preload(src){
    return new Promise((resolve, reject)=>{
      const im = new Image();
      im.onload = ()=>resolve(src);
      im.onerror = ()=>reject(new Error("image failed: " + src));
      im.src = src;
    });
  }

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function weightedPick(items, defaultWeight=1){
    const pool = items.map(it => Math.max(0, Number(it.weight ?? defaultWeight) || defaultWeight));
    const total = pool.reduce((a,b)=>a+b, 0);
    if(total <= 0) return items[0];
    let r = Math.random() * total;
    for(let i=0;i<items.length;i++){
      r -= pool[i];
      if(r <= 0) return items[i];
    }
    return items[items.length-1];
  }

  try{
    const res = await fetch("assets/data/stickers/stickers.json", { cache: "no-cache" });
    if(!res.ok) throw new Error("stickers.json not found: " + res.status);
    const cfg = await res.json();

    const basePath = (cfg.basePath || "assets/images/stickers/").toString();
    const fallback = (cfg.fallback && cfg.fallback.src) ? cfg.fallback.src : FALLBACK_SRC;

    const enabled = Array.isArray(cfg.stickers) ? cfg.stickers.filter(s => s && s.enabled !== false) : [];
    if(enabled.length === 0){
      setSrcSafe(fallback);
      console.warn("[Healing] stickers.json sin stickers enabled; usando fallback.");
      return;
    }

    // 1 por carga (igual que frases)
    const first = weightedPick(enabled, cfg.selection?.defaultWeight ?? 1);
    const rest = enabled.filter(s => s !== first);
    const candidates = [first, ...shuffle(rest)];

    const maxAttempts = Number(cfg.rules?.maxAttemptsBeforeFallback ?? 8);
    let attempts = 0;
    let finalSrc = null;

    function resolveSrc(stk){
      const s = (stk.src || "").toString();
      if(!s) return null;
      if(/^https?:\/\//i.test(s) || s.startsWith("/") || s.startsWith("assets/")) return s;
      return basePath + s;
    }

    for(const stk of candidates){
      if(attempts >= maxAttempts) break;
      attempts++;
      const src = resolveSrc(stk);
      if(!src) continue;
      try{
        await preload(src);
        finalSrc = src;
        break;
      }catch(e){
        // sigue intentando
      }
    }

    setSrcSafe(finalSrc || fallback);

    if(!finalSrc){
      console.warn("[Healing] Sticker fallback usado: revisa rutas/404 en Network.");
    }
  }catch(e){
    setSrcSafe(FALLBACK_SRC);
    console.warn("[Healing] initIntroSticker falló:", e);
  }
}

// ========= Intro -> Chat =========
enterBtn?.addEventListener("click", () => {
  // si el intro aún está tipeando, lo cerramos limpio
  if(introTyper) introTyper.stop();
  introLayer.style.opacity = "0";
  introLayer.style.transform = "scale(0.97)";
  introLayer.style.pointerEvents = "none";
  introLayer.setAttribute("aria-hidden","true");

  setTimeout(() => {
    chatLayer.style.opacity = "1";
    chatLayer.style.pointerEvents = "auto";
    chatLayer.setAttribute("aria-hidden", "false");

    bootMessage();
    scrollToBottom(chatArea);
    ta.focus();
  }, 750);
});

// Enter envía, Shift+Enter nueva línea
ta?.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

// ========= Intro dinámico =========
async function loadIntroVerse(){
  const container = document.querySelector(".introLines");
  if(!container) return;

  try{
    const res = await fetch("assets/data/verses/intro.json", { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if(!Array.isArray(data) || data.length === 0) return;

    const items = data.map((v, i) => {
      if(typeof v === "string") return { id: "s_" + i, text: v, weight: 1, tag: "suave" };
      if(v && typeof v === "object"){
        const text = String(v.text ?? "");
        const weight = Number(v.weight ?? 1);
        const tag = String(v.tag ?? "suave");
        const id = String(v.id ?? ("o_" + i));
        return { id, text, weight: isFinite(weight) && weight > 0 ? weight : 1, tag };
      }
      return { id: "x_" + i, text: "", weight: 1, tag: "suave" };
    }).filter(it => it.text.trim().length > 0);

    if(items.length === 0) return;

    const lastId = localStorage.getItem("nivalis_intro_last_id") || "";

    function weightedPick(excludeId){
      let total = 0;
      for(const it of items){
        if(items.length > 1 && it.id === excludeId) continue;
        total += it.weight;
      }
      let r = Math.random() * total;
      for(const it of items){
        if(items.length > 1 && it.id === excludeId) continue;
        r -= it.weight;
        if(r <= 0) return it;
      }
      return items[items.length - 1];
    }

    let chosen = weightedPick(lastId);
    if(items.length > 1 && chosen.id === lastId) chosen = weightedPick(lastId);

    localStorage.setItem("nivalis_intro_last_id", chosen.id);
    renderIntroFromVerse(String(chosen.text));
  }catch(err){
    console.error("No se pudo cargar intro.json:", err);
  }
}

function renderIntroFromVerse(verse){
  const container = document.querySelector(".introLines");
  if(!container) return;

  const lines = verse.split("\n").map(s => s.trim()).filter(Boolean);

  // Sistema tipo Hollow: slots permanentes + tipeo con setInterval
  if(introTyper) introTyper.stop();
  introTyper = typeIntroLines(container, lines, {
    slots: 4,
    speed: 50,
    gapMs: 140,
  });
}


window.addEventListener("load", loadIntroVerse);
window.addEventListener("load", ()=>{
  // Focus inicial para que Enter/Espacio funcionen “nativo” también
  if(chatLayer?.getAttribute("aria-hidden") !== "false"){
    try{ enterBtn?.focus(); }catch{}
  }
});

// Atajos globales: Enter / Espacio => “entrar” mientras estás en el intro
document.addEventListener("keydown", (e)=>{
  // No interferir con inputs
  const t = e.target;
  const tag = (t && t.tagName) ? t.tagName.toLowerCase() : "";
  if(tag === "textarea" || tag === "input" || tag === "select") return;
  if(e.altKey || e.ctrlKey || e.metaKey) return;

  const introActive = (chatLayer?.getAttribute("aria-hidden") !== "false")
    && (introLayer && introLayer.style.pointerEvents !== "none");

  if(!introActive) return;

  if(e.key === "Enter" || e.code === "Space" || e.key === " "){
    e.preventDefault(); // evita scroll por Space
    enterBtn?.click();
  }
}, { passive:false });


// Click en el papel: si está escribiendo, salta (como Hollow)
introLayer?.addEventListener("click", (e)=>{
  // no interferir con el botón
  if(e.target === enterBtn) return;
  if(introTyper && introTyper.typing) introTyper.skipAll();
});

// ========= Chat =========
let isBusy = false;
function setBusy(v){
  isBusy = v;
  sendBtn.style.opacity = v ? "0.5" : "1";
  sendBtn.style.pointerEvents = v ? "none" : "auto";
}

let booted = false;
function bootMessage(){
  if(booted) return;
  booted = true;

  if(USE_REAL_AI){
    hsBootHelloAI().catch(()=>{
      hsSay("Estoy despierto… 🌷");
      hsSay("Escribe cuando quieras.");
    });
  }else{
    hsSay("Estoy despierto… 🌷");
    hsSay("Escribe cuando quieras.");
  }
}

function hsSay(text){
  chatArea.appendChild(makeBubble("healing", text));
  scrollToBottom(chatArea);
}

function hsTyping(){
  const row = makeTyping();
  chatArea.appendChild(row);
  scrollToBottom(chatArea);
  return row;
}

// ========= Secreto 281 =========
let unlockRequested = false;
let secretUnlocked = (localStorage.getItem("nivalis_secret_unlocked") === "1");

function normalizeSecretInput(s){
  return (s || "").toString().trim().toLowerCase().replace(/\\s+/g, "");
}

function openSecret(){ window.location.href = SECRET_TARGET_HTML; }

function unlockSecret(){
  secretUnlocked = true;
  unlockRequested = false;
  localStorage.setItem("nivalis_secret_unlocked", "1");
}

function onSecretTrigger(){
  if(secretUnlocked){ openSecret(); return; }

  // "Oficial": que la IA sea quien diga que aún no está desbloqueado.
  if(USE_REAL_AI){
    hsLockTeaseAI().catch(()=>{
      // Fallback silencioso si el backend no responde.
      hsSay("…shh. Aún no.");
    });
  }else{
    hsSay("…shh. Aún no.");
  }

  // Marcamos que el usuario ya mostró intención, para que luego pueda intentar el código escribiéndolo.
  unlockRequested = true;
}

paperLockBtn?.addEventListener("click", onSecretTrigger);
paperLockBtn?.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" || e.key === " "){
    e.preventDefault();
    onSecretTrigger();
  }
});

async function handleSecretAttempt(userText){
  // Devuelve true si "consume" el mensaje (p.ej. acierto del código) y NO debe pasar por hsReply.
  if(!unlockRequested || secretUnlocked) return false;

  const attempt = normalizeSecretInput(userText);

  // Clasificamos el intento para que la IA juegue con el usuario (sin revelar el código).
  let outcome = "wrong";
  if(attempt.length === 0) outcome = "empty";
  else if(attempt.length <= 2) outcome = "short";
  else if(attempt === SECRET_CODE) outcome = "success";
  else outcome = "wrong";

  if(outcome === "success"){
    if(USE_REAL_AI){
      await hsSecretTeaseAI({ attempt, outcome });
    }else{
      hsSay("Desbloqueaste el secreto… guao.");
      const t2 = hsTyping();
      await new Promise(r=>setTimeout(r, 520));
      t2.remove();
      hsSay("Ahora… toca el punto otra vez.");
    }
    unlockSecret();
    return true; // evita que hsReply responda a "281" como chat normal
  }

  // Fallos: mantenemos unlockRequested=true para bloquear hsReplyAI (ya existe ese comportamiento).
  if(USE_REAL_AI){
    await hsSecretTeaseAI({ attempt, outcome });
  }else{
    if(outcome === "empty") hsSay("No… así no. Escríbelo.");
    else if(outcome === "short") hsSay("Muy corto… son tres dígitos.");
    else hsSay("Casi… siente el orden.");
  }
  return false;
}

// ========= IA =========
const ai = createAIClient({ endpoint: AI_ENDPOINT, debug: AI_DEBUG });// ========= IA: respuesta especial cuando tocan el candado (secreto aún bloqueado) =========
async function hsLockTeaseAI(){
  const typingRow = hsTyping();
  const row = makeBubble("healing", "");
  const bubble = row.firstChild;

  let shown = false;
  function showBubbleOnce(){
    if(shown) return;
    shown = true;
    typingRow.remove();
    chatArea.appendChild(row);
    scrollToBottom(chatArea);
  }

  // Mensaje "invisible" (no se muestra como burbuja del usuario) para guiar a la IA.
    const now = new Date();

await ai.replyStreaming({
    message: "[LOCK]",
    
    meta: { intent: "lock", mode: "lock" },onTypingDone: () => showBubbleOnce(),
    onDelta: (d) => { showBubbleOnce(); bubble.textContent += d; scrollToBottom(chatArea); },
    onFinal: (text) => { showBubbleOnce(); bubble.textContent = text || "…"; scrollToBottom(chatArea); }
  });
}

// ========= IA de bienvenida (cuando entras al chat) =========
async function hsBootHelloAI(){
  const typingRow = hsTyping();
  const row = makeBubble("healing", "");
  const bubble = row.firstChild;

  let shown = false;
  function showBubbleOnce(){
    if(shown) return;
    shown = true;
    typingRow.remove();
    chatArea.appendChild(row);
    scrollToBottom(chatArea);
  }

    const now = new Date();
  const greetIntent = hsGetGreetingIntentOnce();

await ai.replyStreaming({
    message: "[BOOT]",
    
    meta: { intent: greetIntent, mode: "boot" },onTypingDone: () => showBubbleOnce(),
    onDelta: (d) => { showBubbleOnce(); bubble.textContent += d; scrollToBottom(chatArea); },
    onFinal: (text) => { showBubbleOnce(); bubble.textContent = (text && text.trim()) ? text : "…"; scrollToBottom(chatArea); }
  });
}

// ========= IA especial cuando intentan el código (secreto) =========
// Usa IA para responder con variación y juego, sin revelar el código.
// Devuelve el texto final (por si quieres log/telemetría en el futuro).
async function hsSecretTeaseAI({ attempt, outcome }){
  const typingRow = hsTyping();
  const row = makeBubble("healing", "");
  const bubble = row.firstChild;

  let shown = false;
  function showBubbleOnce(){
    if(shown) return;
    shown = true;
    typingRow.remove();
    chatArea.appendChild(row);
    scrollToBottom(chatArea);
  }

    const now = new Date();
  const msg = (attempt && String(attempt).trim().length) ? String(attempt) : "[CODE]";

try{
    await ai.replyStreaming({
      message: msg,
      
    meta: { intent: "code_attempt", mode: (outcome === "success" ? "secret_success" : "secret_fail") },onTypingDone: () => showBubbleOnce(),
      onDelta: (d) => { showBubbleOnce(); bubble.textContent += d; scrollToBottom(chatArea); },
      onFinal: (text) => { showBubbleOnce(); bubble.textContent = (text || "…"); scrollToBottom(chatArea); }
    });
    return bubble.textContent;
  }catch(e){
    console.error(e);
    // Fallback mínimo, consistente con el tono.
    showBubbleOnce();
    bubble.textContent = (outcome === "success") ? "…bien. Ahora toca el punto otra vez." : "…shh. Aún no.";
    scrollToBottom(chatArea);
    return bubble.textContent;
  }
}



async function hsReplyMock(userText){
  // Si el usuario está en flujo de desbloqueo, no respondas por chat normal
  if (unlockRequested && !secretUnlocked) return;

  const t = (userText || "").trim();
  const lt = t.toLowerCase();

  // Fallback mínimo (solo si la IA no responde / error de red).
  // Sin personalidad: 1 frase corta y neutra.
  const fallback_min = "…";
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  let reply = pick(([fallback_min]));
  if(lt.includes("?") || t.startsWith("por que") || t.startsWith("porque") || t.startsWith("como")){
    reply = pick(([fallback_min]));
  }
  if(lt.includes("gracias") || lt.includes("te quiero") || lt.includes("me duele") || lt.includes("miedo")){
    reply = pick(([fallback_min]));
  }

  const row = hsTyping();
  await new Promise(r=>setTimeout(r, 650));
  row.remove();

  hsSay(reply);

  if(userText.length > 70){
    const row2 = hsTyping();
    await new Promise(r=>setTimeout(r, 520));
    row2.remove();
    hsSay("Sigue… estoy contigo.");
  }
}

async function hsReplyAI(userText){
  if(unlockRequested && !secretUnlocked) return;

  const typingRow = hsTyping();

  const row = makeBubble("healing", "");
  const bubble = row.firstChild;

  let shown = false;
  function showBubbleOnce(){
    if(shown) return;
    shown = true;
    typingRow.remove();
    chatArea.appendChild(row);
    scrollToBottom(chatArea);
  }

const trimmed = (userText || "").trim();
const isOnlyNumbers = /^\d+$/.test(trimmed);
const intent = isOnlyNumbers ? "num_only" : "chat";
const mode = "chat";

  await ai.replyStreaming({
    message: trimmed,
    
    meta: { intent, mode },onTypingDone: () => showBubbleOnce(),
    onDelta: (d) => { showBubbleOnce(); bubble.textContent += d; scrollToBottom(chatArea); },
    onFinal: (text) => { showBubbleOnce(); bubble.textContent = text; scrollToBottom(chatArea); }
  });
}

async function hsReply(userText){
  if(!USE_REAL_AI){
    await hsReplyMock(userText);
    return;
  }
  try{
    await hsReplyAI(userText);
  }catch(e){
    console.error(e);
    await hsReplyMock(userText);
  }
}

// ========= envío =========
sendBtn?.addEventListener("click", sendMessage);

async function sendMessage(){
  if(isBusy) return;
  const userText = ta.value.trim();
  if(!userText) return;

  chatArea.appendChild(makeBubble("user", userText));
  ta.value = "";
  autosize();
  scrollToBottom(chatArea);

  setBusy(true);
  try{
    const consumed = await handleSecretAttempt(userText);
    if(!consumed){
      await hsReply(userText);
    }
  }finally{
    setBusy(false);
  }
}

// ========= Reset oculto (pruebas) =========
(function(){
  const hole = paperLockBtn;
  if(!hole) return;

  let pressTimer = null;

  function resetAll(){
    localStorage.removeItem("nivalis_secret_unlocked");
    localStorage.removeItem("nivalis_music_index");
    try{ music.pause(); }catch{}
    console.warn("[RESET] Estado limpiado (solo pruebas)");
    const t = hsTyping();
    setTimeout(()=>{
      t.remove();
      hsSay("shhh…");
    }, 420);
  }

  hole.addEventListener("pointerdown", ()=>{ pressTimer = setTimeout(resetAll, 1600); });
  hole.addEventListener("pointerup", ()=>{ if(pressTimer) clearTimeout(pressTimer); pressTimer=null; });
  hole.addEventListener("pointerleave", ()=>{ if(pressTimer) clearTimeout(pressTimer); pressTimer=null; });
})();

initIntroSticker();
