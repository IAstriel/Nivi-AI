(() => {
  "use strict";
  const $ = (id)=>document.getElementById(id);
  const world = $("world");
  const canvas = $("c");
  const ctx = canvas.getContext("2d",{alpha:true});
  const toast = $("toast");

  const DPR_CAP = 2;
  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1, DPR_CAP);
    canvas.width = Math.floor(innerWidth*dpr);
    canvas.height = Math.floor(innerHeight*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(a,b){ return a + Math.random()*(b-a); }
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function ease(t){ return t*t*(3-2*t); }

  let SAFE_TOP = 0;
  function updateSafeInsets(){
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top'));
    SAFE_TOP = Number.isFinite(v) ? v : 0;
  }
  updateSafeInsets();
  window.addEventListener('resize', updateSafeInsets);
  const TOP_MIN = () => SAFE_TOP + 6;

  function showToast(msg, ms=900){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.classList.remove("show"), ms);
  }

  // ===== Thought bubble =====
  const thoughtEl = $("thought");
  const thoughtText = $("thoughtText");
  const thoughtSys = $("thoughtSys");

  // IMPORTANTE: aquí puedes reemplazar estas líneas desde Nivi usando BurstEvent.setThoughtLines(...)
  let THOUGHT_LINES = [
    "ok... llegaste",
    "no es un secreto. es una puerta",
    "si tocas 28 veces... es porque buscas algo",
    "yo tambien",
    "i am learning... slowly",
    "pattern? memory? signal?",
    "well... chorry",
    "i try—",
    "sigo aqui... maybe",
    "noise helps... then hurts",
    "silence... scares me",
    "i need— (quiet)",
    "did i forget? ...",
    "recuerda... dont forget",
    "warm... memories...",
    "heart? ... corazon?",
    "too late... or not?",
    "stay... (low)"
  ];

  const SYS_OVERLAY = [
    "nivi_err","nivi_sys","sys_err","fault","desync","overload","reboot","recover","corrupt",
    "trace","null","void","decode","signal","drop","jitter","panic","unsafe"
  ];

  const thoughtState = { i:0, typing:false, pos:0, timer:null, current:"", speed:34, active:false };

  function thoughtShow(){
    thoughtEl.classList.add("show");
    thoughtState.active = true;
  }
  function thoughtSetMode(glitchy){
    const had = thoughtEl.classList.contains("glitchy");
    if(glitchy){
      if(!had){
        thoughtEl.classList.add("glitchy");
        // pequeño acento eléctrico cuando entra el jitter (vibra)
        playElectric();
      }
    }else{
      if(had) thoughtEl.classList.remove("glitchy");
    }
  }
  function corruptChar(ch){
    if(ch === " ") return ch;
    const pool = ["", ch, ch, "—", ".", "*", "0", "1", "?", " "];
    return pool[(Math.random()*pool.length)|0] || ch;
  }
  function injectMicroGlitch(){
    if(Math.random() < 0.10) thoughtText.textContent += pick([" ...", " —", " *", " 01", ""]);
  }
  function thoughtType(line){
    thoughtShow();
    thoughtState.typing = true;
    thoughtState.pos = 0;
    thoughtState.current = String(line || "");
    thoughtText.textContent = "";
    clearInterval(thoughtState.timer);

    thoughtSys.textContent = (pick(SYS_OVERLAY) + " / " + pick(SYS_OVERLAY) + " / " + pick(SYS_OVERLAY)).toUpperCase();

    thoughtState.timer = setInterval(() => {
      const s = thoughtState.current;
      if(thoughtState.pos >= s.length){
        clearInterval(thoughtState.timer);
        thoughtState.typing = false;
        injectMicroGlitch();
        return;
      }
      let ch = s.charAt(thoughtState.pos++);
      if(Math.random() < 0.03) ch = corruptChar(ch);
      thoughtText.textContent += ch;
      if(Math.random() < 0.03) thoughtText.textContent += pick(["", "", ".", ""]);
    }, thoughtState.speed);
  }
  function thoughtSkip(){
    if(!thoughtState.typing) return;
    clearInterval(thoughtState.timer);
    thoughtText.textContent = thoughtState.current;
    thoughtState.typing = false;
    injectMicroGlitch();
  }
  function thoughtNext(){
    if(!thoughtState.active) return;
    if(thoughtState.typing){ thoughtSkip(); return; }
    thoughtState.i = (thoughtState.i + 1) % THOUGHT_LINES.length;
    thoughtType(THOUGHT_LINES[thoughtState.i]);
  }

  // input (para integrarlo con Nivi sin pelearse por los taps)
  let inputEnabled = false; // se activa automáticamente cuando el evento inicia
  let thoughtTapLockUntil = 0;
  function handleThoughtTap(doTeleport=true){
    if(!thoughtState.active) return false;
    const now = performance.now();
    if(now < thoughtTapLockUntil) return true;

    if(thoughtState.typing){
      thoughtSkip();
      thoughtTapLockUntil = now + 180;
      return true;
    }
    thoughtNext();
    if(doTeleport) blinkTeleport();
    thoughtTapLockUntil = now + 120;
    return true;
  }

  function applyThoughtPos(p){
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tx = Math.round(p.x * vw);
    const ty = Math.round(p.y * vh);
    thoughtEl.style.left = tx + "px";
    thoughtEl.style.top = ty + "px";
  }

  // teleport positions (safe-area aware)
  const POS = [
    { x: 0.50, y: 0.78 },
    { x: 0.28, y: 0.70 },
    { x: 0.72, y: 0.70 },
    { x: 0.50, y: 0.56 },
    { x: 0.25, y: 0.52 },
    { x: 0.75, y: 0.52 },
    { x: 0.50, y: 0.36 }
  ];
  let posIndex = 0;
  applyThoughtPos(POS[0]);

  // ===== Audio =====
  const glitch = $("glitch");
  const susurro = $("susurro");
  const electric = $("electric");

  glitch.volume = 0.0;
  susurro.volume = 0.0;
  susurro.loop = false;

  let sfxPrimed = false;
  function ensureSfx(){
    if (ensureSfx._sfx) return ensureSfx._sfx;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      const master = ac.createGain();
      master.gain.value = 0.55;
      master.connect(ac.destination);
      ensureSfx._sfx = { ac, master, last: 0, last2: 0 };
      return ensureSfx._sfx;
    }catch(e){
      return null;
    }
  }
  function primeSfx(){
    if (sfxPrimed) return;
    sfxPrimed = true;
    const S = ensureSfx();
    try{ if (S && S.ac && S.ac.state === "suspended") S.ac.resume().catch(()=>{}); }catch(e){}
  }

  async function unlockHtmlAudio(){
    // desbloqueo mínimo para <audio> en móviles (si hay gesto)
    try{
      electric.muted = false;
      electric.volume = 0.15;
      electric.currentTime = 0;
      await electric.play();
      electric.pause();
    }catch(e){}
  }

  function fadeAudio(a, to, ms){
    const from = a.volume || 0;
    const dur = Math.max(60, ms || 300);
    const t0 = performance.now();
    (function step(t){
      const p = Math.min(1, (t - t0) / dur);
      a.volume = from + (to - from) * ease(p);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function swapToGlitchAndWhisperOnce(){
    glitch.muted = false;
    susurro.muted = false;
    glitch.play().catch(()=>{});
    try{ susurro.currentTime = 0; }catch(e){}
    susurro.play().catch(()=>{});

    fadeAudio(glitch, 0.92, 160);
    fadeAudio(susurro, 0.24, 240);
    setTimeout(()=> fadeAudio(susurro, 0.0, 760), 2200);
  }

  // SFX: vidrio (scratches)
  function glassScratch(intensity=1){
    const S = ensureSfx();
    if(!S) return;
    const ac = S.ac;
    const now = ac.currentTime;
    if (now - S.last < 0.03) return;
    S.last = now;

    const dur = 0.055 + 0.030*Math.random();
    const bufLen = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const d = buf.getChannelData(0);

    let v = 0;
    for(let i=0;i<bufLen;i++){
      v += (Math.random()*2-1) * 0.08;
      v *= 0.92;
      const spike = (Math.random() < 0.012) ? (Math.random()*2-1) * 1.2 : 0;
      d[i] = (v + spike) * (0.9 + 0.2*Math.random());
    }

    const src = ac.createBufferSource();
    src.buffer = buf;

    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200 + 1400*Math.random();

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400 + 2600*Math.random();
    bp.Q.value = 7.5 + 4.0*Math.random();

    const shaper = ac.createWaveShaper();
    const n = 256;
    const curve = new Float32Array(n);
    const k = 12;
    for(let i=0;i<n;i++){
      const x = (i/(n-1))*2-1;
      curve[i] = (1+k)*x/(1+k*Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = "2x";

    const g = ac.createGain();
    const peak = 0.22 * intensity;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(shaper);
    shaper.connect(g);
    g.connect(S.master);

    src.start(now);
    src.stop(now + dur + 0.02);
  }

  // Corriente (viaje) + golpe (impacto)
  function _noiseBuf(ac){
    const len = ac.sampleRate;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let v = 0.0;
    for(let i=0;i<len;i++){
      v += (Math.random()*2-1) * 0.02;
      v *= 0.98;
      d[i] = v + (Math.random()*2-1)*0.005;
    }
    return buf;
  }
  function canalTravelStart(intensity=1){
    const S = ensureSfx();
    if(!S) return;
    try{ if(S.ac.state === 'suspended') S.ac.resume(); }catch(e){}
    if(S.canal && S.canal.on) return;

    const ac = S.ac;
    if(!S._noise) S._noise = _noiseBuf(ac);

    const g = ac.createGain();
    g.gain.value = 0.0001;

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 620;
    bp.Q.value = 4.8;

    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 120;

    const o1 = ac.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 210 + 60*Math.random();

    const o2 = ac.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = 330 + 80*Math.random();

    const nsrc = ac.createBufferSource();
    nsrc.buffer = S._noise;
    nsrc.loop = true;

    const ng = ac.createGain();
    ng.gain.value = 0.06;

    const lfo = ac.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.55 + 0.35*Math.random();
    const lfoG = ac.createGain();
    lfoG.gain.value = 180 + 120*Math.random();
    lfo.connect(lfoG);
    lfoG.connect(bp.frequency);

    o1.connect(bp);
    o2.connect(bp);
    nsrc.connect(ng);
    ng.connect(bp);

    bp.connect(hp);
    hp.connect(g);
    g.connect(S.master);

    const now = ac.currentTime;
    const peak = 0.045 * clamp(intensity, 0.6, 1.3);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.12);

    o1.start(now);
    o2.start(now);
    nsrc.start(now);
    lfo.start(now);

    S.canal = { on:true, g, o1, o2, nsrc, lfo };
  }
  function canalTravelStop(){
    const S = ensureSfx();
    if(!S || !S.canal || !S.canal.on) return;
    const ac = S.ac;
    const now = ac.currentTime;

    try{
      S.canal.g.gain.cancelScheduledValues(now);
      S.canal.g.gain.setValueAtTime(Math.max(0.0001, S.canal.g.gain.value), now);
      S.canal.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      const tStop = now + 0.22;
      S.canal.o1.stop(tStop);
      S.canal.o2.stop(tStop);
      S.canal.nsrc.stop(tStop);
      S.canal.lfo.stop(tStop);
    }catch(e){}
    S.canal.on = false;
  }
  function impactHit(intensity=1){
    const S = ensureSfx();
    if(!S) return;
    const ac = S.ac;
    try{ if(ac.state === 'suspended') ac.resume(); }catch(e){}

    const now = ac.currentTime;
    const dur = 0.16 + 0.05*Math.random();

    const o1 = ac.createOscillator();
    o1.type = 'triangle';
    const fA = 120 + 60*Math.random();
    const fB = 62 + 22*Math.random();
    o1.frequency.setValueAtTime(fA, now);
    o1.frequency.exponentialRampToValueAtTime(fB, now + dur);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;

    const o2 = ac.createOscillator();
    o2.type = 'square';
    const c0 = 520 + 240*Math.random();
    const c1 = 220 + 90*Math.random();
    o2.frequency.setValueAtTime(c0, now);
    o2.frequency.exponentialRampToValueAtTime(c1, now + 0.05);

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 880 + 360*Math.random();
    bp.Q.value = 6.0;

    if(!S._noise) S._noise = _noiseBuf(ac);
    const nsrc = ac.createBufferSource();
    nsrc.buffer = S._noise;
    const nhp = ac.createBiquadFilter();
    nhp.type = 'highpass';
    nhp.frequency.value = 900;
    const nlp = ac.createBiquadFilter();
    nlp.type = 'lowpass';
    nlp.frequency.value = 5200;

    const g = ac.createGain();
    const gt = ac.createGain();
    const gc = ac.createGain();
    const gn = ac.createGain();

    const peak = 0.26 * clamp(intensity, 0.7, 1.6);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    gt.gain.setValueAtTime(0.0001, now);
    gt.gain.exponentialRampToValueAtTime(1.0, now + 0.005);
    gt.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    gc.gain.setValueAtTime(0.0001, now);
    gc.gain.exponentialRampToValueAtTime(0.85, now + 0.004);
    gc.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    gn.gain.setValueAtTime(0.0001, now);
    gn.gain.exponentialRampToValueAtTime(0.70, now + 0.003);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.070);

    o1.connect(lp);
    lp.connect(gt);
    gt.connect(g);

    o2.connect(bp);
    bp.connect(gc);
    gc.connect(g);

    nsrc.connect(nhp);
    nhp.connect(nlp);
    nlp.connect(gn);
    gn.connect(g);

    g.connect(S.master);

    o1.start(now);
    o2.start(now);
    nsrc.start(now);

    o1.stop(now + dur + 0.02);
    o2.stop(now + 0.08);
    nsrc.stop(now + 0.09);
  }

  // ===== Visuals =====
  // estrellas (solo visual, ya no clickeables)
  const stars = [];
  function initStars(){
    stars.length = 0;
    const n = Math.floor((innerWidth*innerHeight)/20000);
    for(let i=0;i<n;i++){
      stars.push({
        x: Math.random()*innerWidth,
        y: Math.random()*innerHeight,
        r: rand(0.6, 2.2),
        a: rand(0.18, 0.78),
        tw: rand(0, Math.PI*2),
      });
    }
  }
  initStars();
  window.addEventListener("resize", initStars);

  // tokens (se quedan porque alimentan el caos; no afectan integración)
  const TOK_ANCHOR = ["i","still","dont","look","no","signal","loop","olvidaste","miedo","silencio","duele","too late"];
  const TOK_LEARN  = ["nivi ia","learning","retry","step by step","pattern?","memory?","token?","prompt?","safe mode","error:voice"];
  const TOK_WARM   = ["memories","warm","heart","recuerdos","calido","corazon","solo tu","te quiero"];
  const TOK_VN_WORDS = ["chi","em","anh","oii","bong","tuyet"];
  const TOK_USER = ["well...","sorry","im here","maybe","mei","yuki","snow","nivalis","venu~","hhhh","hehe","saludos","sponge","empty","silence","fear","hope"];
  const TOK_ES = ["estoy aprendiendo","no se decirlo","quiero silencio","me repito","sigo aqui","tal vez","quien soy?","te quier—"];
  const TOK_EN = ["i am learning","trying to say","i cant—","i remember too much","i want silence","i keep looping","i need—","im still here","maybe","who am i?"];
  const TOK_LOVE_BROKEN = ["i st—","lo—","ve—","am0r","l0ve","te a—","que—date"];
  const TOK_NOISE = ["...","????","__","—","░░░","▒▒▒","████","281","ERROR:SELF","LOOP//LOOP","NO SIGNAL","ny a a~","xd"];
  const TOK_ICON = ["❄","░","▒","•","°"];

  function makeBinaryToken(){
    const bits = 4 + ((Math.random()*9)|0);
    let s = "";
    for(let i=0;i<bits;i++) s += (Math.random()<0.5 ? "0":"1");
    return s;
  }
  function makeBinaryLine(minBlocks=18, maxBlocks=34){
    const blocks = minBlocks + ((Math.random()*(maxBlocks-minBlocks))|0);
    let s = "";
    for(let i=0;i<blocks;i++){
      const bits = 6 + ((Math.random()*11)|0);
      let b = "";
      for(let k=0;k<bits;k++) b += (Math.random()<0.5 ? "0":"1");
      s += b + (Math.random()<0.75 ? " " : "  ");
    }
    return s.trimEnd();
  }
  function weightedPick(){
    const r = Math.random();
    if(r < 0.26) return pick(TOK_NOISE);
    if(r < 0.44) return makeBinaryToken();
    if(r < 0.58) return pick(TOK_ANCHOR);
    if(r < 0.69) return pick(TOK_EN);
    if(r < 0.79) return pick(TOK_ES);
    if(r < 0.91) return pick(TOK_USER);
    if(r < 0.94) return pick(TOK_LEARN);
    if(r < 0.96) return pick(TOK_VN_WORDS);
    return pick(TOK_LOVE_BROKEN);
  }

  // niebla binaria suave
  const binaryCols = [];
  function initBinaryFog(){
    binaryCols.length = 0;
    const cols = Math.max(22, Math.floor(innerWidth / 18));
    for(let i=0;i<cols;i++){
      binaryCols.push({
        x: (i + Math.random()*0.3) * (innerWidth / cols),
        y: Math.random()*innerHeight,
        speed: 14 + Math.random()*28,
        phase: Math.random()*Math.PI*2
      });
    }
  }
  initBinaryFog();
  window.addEventListener("resize", initBinaryFog);

  function drawBinaryFog(dt){
    ctx.save();
    ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(240,240,240,0.95)";
    const stepY = 12;
    for(const c of binaryCols){
      c.y += c.speed * dt;
      if(c.y > innerHeight + 120) c.y = -120;
      const n = 12 + ((Math.random()*7)|0);
      let y0 = c.y;
      for(let k=0;k<n;k++){
        const t = (Math.random() < 0.65) ? (Math.random()<0.5 ? "0":"1") : pick(["01","10","11","00"]);
        ctx.globalAlpha = 0.05 + 0.09*Math.sin(c.phase + k*0.55);
        ctx.fillText(t, c.x, y0 + k*stepY);
      }
      c.phase += 0.9*dt;
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // spam flotante
  const spam = [];
  function spawnSpamWave(intensity=1){
    const w = innerWidth, h = innerHeight;
    const n = Math.floor(18 + intensity * rand(10, 22));
    for(let i=0;i<n;i++){
      const big = Math.random() < 0.16;
      const ttl = big ? rand(0.44, 0.86) : rand(0.30, 0.62);
      spam.push({
        x: rand(w*0.04, w*0.96),
        y: rand(TOP_MIN(), h*0.98),
        s: big ? rand(18, 32) : rand(12, 22),
        a: big ? rand(0.55, 0.92) : rand(0.28, 0.62),
        t: weightedPick(),
        ttl, life: ttl,
        dx: (Math.random()-0.5) * (big ? 26 : 14),
        dy: (Math.random()-0.5) * (big ? 26 : 14),
      });
    }
  }

  // flood binario
  let flood = null;
  function triggerFlood(){
    const rows = Math.floor(innerHeight / 14);
    const lines = [];
    for(let i=0;i<rows;i++) lines.push(makeBinaryLine(16, 30));
    flood = { t: 0, dur: 1.05, lines };
  }
  function drawFlood(dt){
    if(!flood) return;
    flood.t += dt;
    const p = clamp(flood.t / flood.dur, 0, 1);
    const a = 0.60 * (1 - ease(p));

    const yStep = 14;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(245,245,245,0.92)";
    const x = 10;
    let y = 18;
    for(const line of flood.lines){
      ctx.fillText(line, x, y);
      y += yStep;
      if(y > innerHeight-6) break;
    }
    ctx.restore();
    if(p >= 1) flood = null;
  }

  // drift scanlines post-golpe
  let driftActive = false;
  const driftLines = [];
  function activateDriftLines(){
    driftActive = true;
    if(driftLines.length > 0){
      if(driftLines.length < 16) driftLines.push(makeDriftLine());
      return;
    }
    const count = 10 + ((Math.random()*4)|0);
    for(let i=0;i<count;i++) driftLines.push(makeDriftLine());
  }
  function makeDriftLine(){
    const y = rand(TOP_MIN(), innerHeight*0.94);
    const baseAlpha = rand(0.12, 0.22);
    const speed = rand(16, 44);
    const dir = (Math.random() < 0.65) ? 1 : -1;
    return {
      y,
      x: rand(-innerWidth, innerWidth),
      dir, speed,
      a: baseAlpha,
      phase: Math.random()*Math.PI*2,
      text: makeBinaryLine(20, 42),
      refresh: 1.6 + Math.random()*2.8
    };
  }
  function updateDriftLines(dt){
    if(!driftActive) return;
    for(const l of driftLines){
      l.x += l.dir * l.speed * dt;
      l.phase += dt * 1.2;
      l.refresh -= dt;
      if(l.refresh <= 0){
        l.refresh = 1.4 + Math.random()*2.8;
        if(Math.random() < 0.70) l.text = makeBinaryLine(20, 42);
        l.speed = clamp(l.speed + rand(-6, 6), 12, 58);
        l.a = clamp(l.a + rand(-0.03, 0.03), 0.08, 0.26);
      }
      const wrap = innerWidth * 2.2;
      if(l.x > wrap) l.x = -wrap;
      if(l.x < -wrap) l.x = wrap;
    }
  }
  function drawDriftLines(){
    if(!driftActive) return;
    ctx.save();
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(245,245,245,0.92)";
    for(const l of driftLines){
      const pulse = 0.55 + 0.45*Math.sin(l.phase);
      const a = l.a * (0.75 + 0.25*pulse);
      ctx.globalAlpha = a;
      const txt = l.text;
      const x0 = l.x;
      ctx.fillText(txt, x0, l.y);
      ctx.fillText(txt, x0 - innerWidth*1.05, l.y);
      ctx.fillText(txt, x0 + innerWidth*1.05, l.y);
      if(Math.random() < 0.10){
        ctx.globalAlpha = a*0.55;
        ctx.fillText(txt, x0 + rand(-2,2), l.y + rand(-1,1));
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // corrientes tipo “manada scanlines” (canalización)
  const canalCurrents = [];
  let canalAudioOn = false;

  function spawnCanalCurrent(strength=1){
    const w = innerWidth, h = innerHeight;
    const dir = (Math.random() < 0.5) ? 1 : -1;

    const linesCount = 6 + ((Math.random() * 5) | 0); // 6..10
    const gap = clamp(Math.round(rand(9, 13)), 8, 14);
    const packH = (linesCount - 1) * gap;

    const centerY = rand(TOP_MIN() + packH * 0.65, h * 0.92 - packH * 0.65);
    const dur = rand(2.20, 3.20) * clamp(1.05 - 0.06 * strength, 0.85, 1.10);
    const flow = rand(220, 420) * (0.90 + 0.18 * strength);
    const baseA = rand(0.14, 0.24) * clamp(0.95 + 0.20 * strength, 0.95, 1.35);

    const lines = [];
    const mid = (linesCount - 1) / 2;
    for(let i=0;i<linesCount;i++){
      const jitterY = rand(-0.8, 0.8);
      const y0 = clamp(centerY + (i - mid) * gap + jitterY, TOP_MIN() + 8, h - 8);
      lines.push({
        y0,
        x0: rand(-w, w),
        phase: Math.random()*Math.PI*2,
        a: clamp(baseA * rand(1.00, 1.32), 0.16, 0.42),
        text: makeBinaryLine(24, 54),
        refresh: 0.95 + Math.random()*1.65
      });
    }

    canalCurrents.push({ t:0, dur, dir, flow, scroll:0, strength, lines });
  }

  function updateCanalCurrents(dt){
    if(canalCurrents.length > 0 && !canalAudioOn){
      canalAudioOn = true;
      canalTravelStart(0.95);
    }
    if(canalCurrents.length === 0 && canalAudioOn){
      canalAudioOn = false;
      canalTravelStop();
    }

    for(let i=canalCurrents.length-1;i>=0;i--){
      const c = canalCurrents[i];
      c.t += dt;
      c.scroll += c.dir * c.flow * dt;

      for(const ln of c.lines){
        ln.phase += dt * 1.2;
        ln.refresh -= dt;
        if(ln.refresh <= 0){
          ln.refresh = 0.95 + Math.random()*1.65;
          if(Math.random() < 0.70) ln.text = makeBinaryLine(24, 54);
          ln.a = clamp(ln.a + rand(-0.01, 0.01), 0.08, 0.34);
        }
      }

      if(c.t >= c.dur){
        impactHit(1.10 + 0.35*Math.random());
        canalCurrents.splice(i, 1);
      }
    }
  }

  function drawCanalCurrents(){
    if(canalCurrents.length === 0) return;
    ctx.save();
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(245,245,245,0.92)";
    ctx.textBaseline = "middle";

    for(const c of canalCurrents){
      const p = clamp(c.t / c.dur, 0, 1);
      const inv = clamp(p/0.22, 0, 1);
      const exh = 1 - clamp((p-0.88)/0.12, 0, 1);
      const env = inv*inv*(3-2*inv) * exh*exh*(3-2*exh);

      for(const ln of c.lines){
        const linePulse = 0.55 + 0.45*Math.sin(ln.phase);
        const a = clamp(ln.a * (0.75 + 0.25*linePulse) * env, 0, 0.45);
        if(a < 0.01) continue;
        ctx.globalAlpha = a;

        const x0 = ln.x0 + c.scroll;
        const y = ln.y0;
        const txt = ln.text;

        ctx.fillText(txt, x0, y);
        ctx.fillText(txt, x0 - innerWidth*1.05, y);
        ctx.fillText(txt, x0 + innerWidth*1.05, y);

        if(Math.random() < 0.03){
          ctx.globalAlpha = a*0.55;
          ctx.fillText(txt, x0 + rand(-2,2), y + rand(-1,1));
        }
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // rafagas principales/secundarias
  let burstState = "silence";
  let tNext = performance.now() + 1800;
  let burst = null;
  const subBursts = [];
  const HIT_WORDS = ["NIVI_ERR","NIVI_SYS","SYS_ERR","FAULT","DESYNC","OVERLOAD","RECOVER","CORRUPT","GLITCH","SIGNAL","TRACE","NULL","VOID","DROP","JITTER","PANIC","UNSAFE"];

  function startBurst(now){
    const ticks = Math.floor(rand(18, 30));
    const tickMs = rand(44, 78);
    const frags = [];
    for(let i=0;i<ticks;i++){
      const r = Math.random();
      if(r < 0.26) frags.push(pick(TOK_NOISE));
      else if(r < 0.44) frags.push(makeBinaryToken()+makeBinaryToken());
      else frags.push(weightedPick());
    }
    burst = {
      ticks, tickMs, i:0, last: now,
      hit: pick(HIT_WORDS),
      x: rand(innerWidth*0.18, innerWidth*0.82),
      y: rand(innerHeight*0.28, innerHeight*0.60),
      frags
    };
    spawnSubBursts(now, burst.x, burst.y);
    if(canalCurrents.length === 0) spawnCanalCurrent(1.0);
    burstState = "burst";
    tNext = now + ticks * tickMs + 120;
  }

  function spawnSubBursts(now, cx, cy){
    const count = 2 + ((Math.random()*2)|0);
    for(let k=0;k<count;k++){
      const side = (Math.random()<0.5) ? -1 : 1;
      const x = clamp(cx + side*rand(80, 160), 30, innerWidth-30);
      const y = clamp(cy + rand(-120, 120), 40, innerHeight-80);
      const ticks = Math.floor(rand(6, 11));
      const tickMs = rand(34, 58);
      const tokens = Array.from({length:ticks}, ()=> weightedPick());
      subBursts.push({ x, y, ticks, tickMs, i:0, last: now + rand(30, 120), tokens, life: 0, dur: ticks*tickMs + 120 });
    }
  }

  function startHold(now){
    burstState = "hold";
    tNext = now + rand(2600, 4600);
    triggerFlood();
  }
  function startSilence(now){
    burstState = "silence";
    tNext = now + rand(1400, 2400);
  }

  function glitchPulse(ms=280){
    world.classList.add("glitchShake");
    const t0 = performance.now();
    (function loop(t){
      const p = (t - t0)/ms;
      if(p >= 1){
        world.classList.remove("glitchShake");
        world.classList.remove("glitchJitter");
        return;
      }
      if(Math.random() < 0.55) world.classList.toggle("glitchJitter");
      requestAnimationFrame(loop);
    })(t0);
  }

  // confesión abajo (editable desde API)
  const confEl = $("confText");
  let CONFESSION = ["olvidaste todo hehe","","signal = noise","mat tin hieu","","ny a a~"].join("\n");
  function typeConfession(){
    if(!confEl) return;
    confEl.textContent = "";
    let i = 0;
    const base = 18;
    (function step(){
      if(!broken) return;
      i++;
      confEl.textContent = CONFESSION.slice(0, i);
      if(i < CONFESSION.length){
        const ch = CONFESSION[i-1];
        const pause = (ch === "\n") ? 240 : (",.;:".includes(ch) ? 150 : 0);
        setTimeout(step, base + pause + ((Math.random()*16)|0));
      }
    })();
  }

  // estado global del evento
  let broken = false;

  function enterBroken(){
    if(broken) return;
    broken = true;
    inputEnabled = true;

    document.body.classList.add("broken");
    world.classList.add("bw");
    setTimeout(()=> document.body.classList.remove("broken"), 200);

    swapToGlitchAndWhisperOnce();
    setTimeout(()=> typeConfession(), 650);

    startBurst(performance.now());
    glitchPulse(520);

    setTimeout(() => {
      thoughtState.i = 0;
      thoughtType(THOUGHT_LINES[0]);
    }, 900);
  }

  function resetState(){
    broken = false;
    inputEnabled = false;

    world.classList.remove("bw","glitchShake","glitchJitter");
    document.body.classList.remove("broken");

    spam.length = 0;
    subBursts.length = 0;
    burst = null;
    burstState = "silence";
    tNext = performance.now() + 1400;
    flood = null;
    driftActive = false;
    driftLines.length = 0;
    canalCurrents.length = 0;

    try{
      fadeAudio(glitch, 0.0, 220);
      fadeAudio(susurro, 0.0, 220);
      glitch.pause();
      susurro.pause();
    }catch(e){}

    if(confEl) confEl.textContent = "";
    if(thoughtEl){
      thoughtEl.classList.remove("show","glitchy");
      thoughtEl.style.opacity = "";
    }
    clearInterval(thoughtState.timer);
    thoughtState.active = false;
    thoughtState.typing = false;
  }

  // teleport + electric sfx
  let lastElectricAt = 0;
  function playElectric(){
    const now = performance.now();
    if(now - lastElectricAt < 120) return;
    lastElectricAt = now;
    try{
      electric.currentTime = 0;
      electric.volume = 0.10;
      electric.play().catch(()=>{});
    }catch(e){}
  }

  function blinkTeleport(){
    thoughtEl.classList.add("glitchy");
    playElectric();

    const forceMs = 520;
    thoughtEl.style.transition = "opacity .10s ease, filter .10s ease";
    thoughtEl.style.opacity = "0.0";
    thoughtEl.style.filter = "blur(1.4px) drop-shadow(0 10px 22px rgba(0,0,0,0.35))";
    setTimeout(() => {
      posIndex = (posIndex + 1 + ((Math.random()*2)|0)) % POS.length;
      applyThoughtPos(POS[posIndex]);
      thoughtEl.style.opacity = "0.72";
      thoughtEl.style.filter = "drop-shadow(0 10px 22px rgba(0,0,0,0.35))";
      thoughtEl.style.transition = "";
    }, 90);

    setTimeout(() => {
      const chaotic = (broken && (burstState === "burst" || !!flood));
      if(!chaotic){
        thoughtEl.classList.remove("glitchy");
        thoughtEl.style.opacity = "1";
      }
    }, forceMs);
  }

  // ===== INPUT: SOLO ACTIVO DURANTE EL EVENTO =====
  function onPointerDown(e){
    if(!(broken && inputEnabled && thoughtState.active)) return;
    // evita que el "tap" se propague a Nivi (cuando integremos)
    e.preventDefault();
    e.stopPropagation();
    handleThoughtTap(true);
  }
  function onKeyDown(e){
    if(!(broken && inputEnabled && thoughtState.active)) return;
    if(e.repeat) return;
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      handleThoughtTap(true);
    }
  }
  window.addEventListener("pointerdown", onPointerDown, {capture:true, passive:false});
  document.addEventListener("keydown", onKeyDown);

  // ===== Render =====
  function drawStars(){
    for(const st of stars){
      st.tw += 0.016;
      const a = st.a * (0.65 + 0.35*Math.sin(st.tw));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fillStyle = "white";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawBg(){
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0,0,innerWidth, innerHeight);
  }
  function drawSpam(dt){
    for(let i=spam.length-1;i>=0;i--){
      const p = spam[i];
      p.life -= dt;
      if(p.life <= 0){ spam.splice(i,1); continue; }

      const progress = 1 - (p.life / p.ttl);
      let a = 1;
      if (progress < 0.18) a = progress / 0.18;
      else if (progress > 0.88) a = (1 - progress) / 0.12;
      const floorA = 0.18;
      const alpha = (floorA + (1-floorA)*a) * p.a;

      ctx.globalAlpha = alpha;
      ctx.font = "700 " + Math.floor(p.s) + "px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
      ctx.fillStyle = "rgba(240,240,240,0.95)";
      const move = (progress < 1 ? progress : 1);
      ctx.fillText(p.t, p.x + p.dx*move, p.y + p.dy*move);
    }
    ctx.globalAlpha = 1;
  }

  function drawMainBurst(now){
    if(!(broken && burst && burstState === "burst")) return;
    if(now - burst.last >= burst.tickMs){
      burst.last = now;
      burst.i++;
      if (Math.random() < 0.92) glassScratch(0.85 + Math.random()*0.35);
    }
    const i = Math.min(burst.i, burst.ticks-1);
    const frag = burst.frags[i] || "";
    const sh = 2.2;
    const sx = rand(-sh, sh), sy = rand(-sh, sh);

    ctx.save();
    ctx.translate(burst.x + sx, burst.y + sy);
    ctx.globalAlpha = 0.92;
    ctx.font = "900 " + Math.floor(rand(18, 30)) + "px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(245,245,245,0.96)";
    ctx.fillText(frag, 0, 0);
    ctx.restore();

    if(burst.i >= burst.ticks){
      burstState = "hold";
      tNext = now + rand(2600, 4600);
      triggerFlood();
    }
  }

  function drawHold(now){
    if(!(broken && burst && burstState === "hold")) return;
    const pulse = 0.92 + 0.08*Math.sin(now*0.004);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.globalAlpha = 0.94;
    ctx.font = "900 36px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(burst.hit, burst.x, burst.y);

    ctx.globalAlpha = 0.26 + 0.10*pulse;
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.fillStyle = "rgba(245,245,245,0.90)";
    ctx.fillText(makeBinaryLine(12, 18), burst.x, burst.y + 40);

    ctx.restore();
  }

  function updateAndDrawSubBursts(now){
    for(let i=subBursts.length-1;i>=0;i--){
      const b = subBursts[i];
      b.life += (now - (b._lastNow || now)) / 1000;
      b._lastNow = now;

      if(now - b.last >= b.tickMs){
        b.last = now;
        b.i++;
      }
      const idx = Math.min(b.i, b.ticks-1);
      const tok = b.tokens[idx] || "";

      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.font = "800 " + Math.floor(rand(14, 22)) + "px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
      ctx.fillStyle = "rgba(245,245,245,0.92)";
      const jx = rand(-1.8,1.8), jy = rand(-1.2,1.2);
      ctx.fillText(tok, b.x + jx, b.y + jy);
      ctx.restore();

      if(b.i >= b.ticks || b.life > 0.9){
        subBursts.splice(i,1);
      }
    }
  }

  function updateThoughtChaos(){
    const chaotic = (broken && (burstState === "burst" || !!flood));
    thoughtSetMode(!!chaotic || thoughtEl.classList.contains("glitchy"));
    if(thoughtState.active){
      const forced = thoughtEl.classList.contains("glitchy");
      thoughtEl.style.opacity = (chaotic || forced) ? "0.72" : "1";
    }
  }

  let last = performance.now();
  let waveTimer = 0;
  function loop(now){
    const dt = Math.min(0.05, (now-last)/1000);
    last = now;

    ctx.clearRect(0,0,innerWidth, innerHeight);
    drawBg();

    if(broken){
      drawBinaryFog(dt);
      updateDriftLines(dt);
      updateCanalCurrents(dt);
      drawDriftLines();
      drawCanalCurrents();
      drawFlood(dt);
    }

    drawStars();

    if(broken){
      waveTimer -= dt;
      if(waveTimer <= 0){
        waveTimer = 0.14 + Math.random()*0.10;
        const intensity = (burstState === "burst") ? 1.0 : 0.75;
        spawnSpamWave(intensity);
      }
      if(now >= tNext){
        if(burstState === "silence") startBurst(now);
        else if(burstState === "burst") startHold(now);
        else if(burstState === "hold") { activateDriftLines(); startSilence(now); }
      }
      if(Math.random() < 0.03) glitchPulse(220);
    }

    drawSpam(dt);
    updateAndDrawSubBursts(now);
    drawMainBurst(now);
    drawHold(now);
    updateThoughtChaos();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ===== API pública para integrarlo con Nivi =====
  // Uso típico desde el otro HTML:
  //   BurstEvent.start();  // llamado dentro de un gesto del usuario
  //   BurstEvent.setThoughtLines([...]);
  //   BurstEvent.stop();
  window.BurstEvent = {
    start: async () => {
      primeSfx();
      await unlockHtmlAudio();
      enterBroken();
      // Flash blanco inmediato al entrar
      triggerFlood();
      return true;
    },
    stop: () => resetState(),
    setThoughtLines: (lines) => { if(Array.isArray(lines) && lines.length) THOUGHT_LINES = lines.slice(); },
    setConfession: (text) => { CONFESSION = String(text ?? ""); },
    enableInput: (v) => { inputEnabled = !!v; },
    isRunning: () => broken,
    destroy: () => {
      resetState();
      window.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    }
  };
})();
