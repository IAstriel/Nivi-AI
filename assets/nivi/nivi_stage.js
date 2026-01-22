(async () => {
    "use strict";

    const bgm = new Audio();
    bgm.src = "assets/audio/bgm/music.mp3";
    bgm.loop = true;
    bgm.volume = 0.0;

    
    // Exponer para integración (pausar al entrar al evento)
    window.__NIVI_BGM = bgm;
let audioUnlocked = false;
    let wakingUp = false;
    let awakened = false; // historia pausada


// --- Music button wiring (does NOT trigger wakeUp) ---
const musicBtn = document.getElementById("musicBtn");
function syncMusicBtn(){
  const on = !bgm.paused && !bgm.muted;
  musicBtn.classList.toggle("isOn", on);
  musicBtn.setAttribute("aria-pressed", String(on));
}

musicBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation(); // avoid triggering wakeUp on window
  if (!audioUnlocked){
    audioUnlocked = true;
  }

  if (bgm.paused || bgm.muted){
    bgm.muted = false;
    bgm.play().catch(()=>{});
  } else {
    bgm.pause();
  }
  syncMusicBtn();
}, { passive: false });

bgm.addEventListener?.("play", syncMusicBtn);
bgm.addEventListener?.("pause", syncMusicBtn);
bgm.addEventListener?.("volumechange", syncMusicBtn);

syncMusicBtn();


  /* PIXI APP SETUP */
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const app = new PIXI.Application({
      view: document.getElementById("stage"),
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: DPR,
      resizeTo: window,
      powerPreference: "high-performance"
    });

    // Exponer app/canvas para integración
    window.__NIVI_APP = app;
    window.__NIVI_STAGE = document.getElementById('stage');


    /* CAPAS / ORDEN (IMPORTANTE PAPE)
       1) rectLayer (fondo)     
       2) model
       3) nightOverlay (velo)
       4) starLayer              
       5) zzzLayer               
       6) uiLayer   */

    const rectLayer = new PIXI.Container();
    const starLayer = new PIXI.Container();
    const zzzLayer  = new PIXI.Container();
    const uiLayer   = new PIXI.Container();
    const nightOverlay = new PIXI.Graphics();

        const curtain = new PIXI.Graphics(); // cortina/umbral
    const curtainTextA = new PIXI.Text("", {
      fontFamily: "Inter",
      fontWeight: "300",
      fontSize: 18,
      fill: 0x0B0F1A,
      letterSpacing: 1,
      dropShadow: true,
      dropShadowColor: 0xAFCBFF,
      dropShadowBlur: 4,
      dropShadowAlpha: 0.18,
      dropShadowDistance: 0,
      padding: 18
    });
    curtainTextA.anchor.set(0.5);
    const curtainTextB = new PIXI.Text("", {
      fontFamily: "Inter",
      fontWeight: "300",
      fontSize: 20,
      fill: 0x0B0F1A,
      letterSpacing: 1,
      dropShadow: true,
      dropShadowColor: 0xAFCBFF,
      dropShadowBlur: 4,
      dropShadowAlpha: 0.18,
      dropShadowDistance: 0,
      padding: 18
    });
    curtainTextB.anchor.set(0.5);

    const wakeHint = new PIXI.Text("281 streak~", {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 12,
      fill: 0x3A4157,
      letterSpacing: 2,
      dropShadow: true,
      dropShadowColor: 0xAFCBFF,
      dropShadowBlur: 2,
      dropShadowAlpha: 0.12,
      dropShadowDistance: 0,
      padding: 14
    });
    wakeHint.anchor.set(0.5);
    wakeHint.alpha = 0;

app.stage.addChild(rectLayer);

    /*  MODELO  */
    const model = await PIXI.live2d.Live2DModel.from(
      "assets/models/nivi/nivi.model3.json"
    );
    model.anchor.set(0.5, 1);

    /* HELPERS (Live2D params) */
    function core(){ return model.internalModel.coreModel; }
    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
    function setParam(id, v){ core().setParameterValueById(id, clamp(v, -30, 30)); }

    app.stage.addChild(model);
    app.stage.addChild(nightOverlay);
    app.stage.addChild(starLayer);
    app.stage.addChild(zzzLayer);
    app.stage.addChild(uiLayer);
    app.stage.addChild(curtain);
    app.stage.addChild(curtainTextA);
    app.stage.addChild(curtainTextB);
    app.stage.addChild(wakeHint);


    /* UI (poster) */
    // Título
    const titleText = new PIXI.Text("Nivi?", {
      fontFamily: "Inter",
      fontWeight: "700",
      fontSize: 44,         
      fill: 0xEAF1FF,
      align: "center",
      letterSpacing: 1,
      padding: 14,
      dropShadow: true,
      dropShadowColor: 0xAFCBFF,
      dropShadowBlur: 6,
      dropShadowAngle: Math.PI / 2,
      dropShadowDistance: 0,
      dropShadowAlpha: 0.35
    });
    titleText.anchor.set(0.5);

    // Subtítulo
    const subText = new PIXI.Text("COMING SOON", {
      fontFamily: "Inter",
      fontWeight: "500",
      fontSize: 14,  
      fill: 0xAFC2E8, 
      align: "center",
      letterSpacing: 4
    });
    subText.anchor.set(0.5);

    // Texto narrativo
    const dateText = new PIXI.Text("…", {
      fontFamily: "Inter",
      fontWeight: "300",
      fontSize: 14,           
      fill: 0xAFC2E8,
      align: "center",
      letterSpacing: 2,
      dropShadow: true,
      dropShadowColor: 0xAFCBFF,
      dropShadowBlur: 3,
      dropShadowAngle: Math.PI / 2,
      dropShadowDistance: 0,
      dropShadowAlpha: 0.18
    });
    dateText.anchor.set(0.5);

    // Initializing...
    const initText = new PIXI.Text("Initializing", {
      fontFamily: "Inter",
      fontWeight: "300",
      fontSize: 12,           
      fill: 0xAFC2E8,
      align: "center",
      letterSpacing: 1
    });
    initText.anchor.set(0.5);

    // detalle pequeñito
    const availText = new PIXI.Text("ニーバーリースー！", {
      fontFamily: "Inter",
      fontWeight: "500",
      fontSize: 14,           
      fill: 0xAEA69C,
      dropShadow: true,
      dropShadowColor: 0xF2EFEA,
      dropShadowBlur: 2.5,
      dropShadowAngle: Math.PI / 2,
      dropShadowDistance: 0,
      dropShadowAlpha: 0.18
    });
    availText.anchor.set(0.5);

    // Línea fina separadora
    const rule = new PIXI.Graphics();

    uiLayer.addChild(titleText, subText, rule, dateText, initText, availText);
    uiLayer.alpha = 0.95;

    /* frases aleatorias + ... */
    const TECH_LINES = [
        "Listening", "Learning", "Feeling",
	      "Breathing", "Waiting", "Remembering",
	      "Dreaming", "Becoming"
    ];

    let initBase = "Initializing";
    let dots = 0;
    let dotsTimer = 0;
    const DOTS_INTERVAL = 0.45;

    let lastIndex = -1;
    let tapCooldown = 0;

    function pickRandomIndex(len, avoid){
      if (len <= 1) return 0;
      let i = Math.floor(Math.random() * len);
      if (i === avoid) i = (i + 1) % len;
      return i;
    }

    function applyRandomText(){
      const i = pickRandomIndex(TECH_LINES.length, lastIndex);
      lastIndex = i;
      initBase = TECH_LINES[i];
      dotsTimer = DOTS_INTERVAL; //refresco inmediato
    }

    function updateInitializingDots(dt){
      dotsTimer += dt;
      if (dotsTimer >= DOTS_INTERVAL){
        dotsTimer = 0;
        dots = (dots + 1) % 4; // 0..3
      }
      initText.text = initBase + ".".repeat(dots);
    }

    // Estado inicial aleatorio
    applyRandomText();

    // Tap/click para cambiar frase
    app.view.addEventListener("pointerdown", () => {
      if (tapCooldown > 0) return;
      tapCooldown = 0.18;
      applyRandomText();
    }, { passive: true });

    /* Glow suave del título */
    let titleGlowT = Math.random() * Math.PI * 2;

    function updateTitleGlow(dt){
      titleGlowT += dt * 2.8;
      const glowPulse = 0.5 + Math.sin(titleGlowT) * 0.5;
      titleText.style.dropShadowAlpha = 0.40 + glowPulse * 0.50;
      titleText.style.dropShadowBlur  = 6 + glowPulse * 5;
    }

    /* Layout de UI */
    function layoutPresentation(){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      const topY = h * 0.10;

      titleText.x = w * 0.5;
      titleText.y = topY;

      subText.x = w * 0.5;
      subText.y = topY + 42;

      rule.clear();
      rule.lineStyle(1, 0xAFC2E8, 0.25);
      const lineW = Math.min(260, w * 0.55);
      rule.moveTo(w * 0.5 - lineW/2, subText.y + 18);
      rule.lineTo(w * 0.5 + lineW/2, subText.y + 18);

      dateText.x = w * 0.5;
      dateText.y = subText.y + 38;

      const bottomY = h * 0.86;
      initText.x = w * 0.5;
      initText.y = bottomY;

      availText.x = w * 0.5;
      availText.y = bottomY + 22;

      uiLayer.alpha = 0.95;
    }


    /* HISTORIA — gota por gota
       Un texto por vez. Primero */
    const HM_BASE = "…";
    const STORY = [
      "01110101", // u
      "01101011", // k
      "01101110", // n
      "01101111", // o
      "01110111", // w
      "01101001", // i
      "01110011", // s
      "01110100", // t
      "01101001", // i
      "01101100", // l
      "01101100", // l
      "01101100", // l
      "01101111", // o
      "01110110", // v
      "01100101", // e
      "01110101",  // u
      "❄🐾~"
    ];

    // Intervalo entre gotas
    let nextDropIn = 5 + Math.random() * 2;

    // Respiración compartida del texto
    let textBreathT = Math.random() * Math.PI * 2;
    const TEXT_BREATH_PERIOD = 2.0;      // segundos por ciclo
    const TEXT_BREATH_ALPHA_AMP = 0.35;  // parpadeo

    // Crossfade state
    let shownText = HM_BASE;
    let nextText = null;

    let xState = "idle"; 
    let xT = 0;

    const X = {
      fadeOut: 0.70, // desaparecer
      fadeIn: 0.70   // aparecer
    };



    const PROMISE_ALPHA = 0.96;
    let storyDone = false;
    let storyIndex = 0;

    function scheduleNextDrop(){
      nextDropIn = 8 + Math.random() * 2;
    }

    function startDrop(){
      if (storyDone) return;

      const finalLine = STORY[STORY.length - 1];

      if (storyIndex >= STORY.length){
        storyDone = true;
        shownText = finalLine;

        xState = "final";
        xT = 0;
        nextText = null;

        dateText.text  = shownText;
        dateText.alpha = PROMISE_ALPHA;


        nextDropIn = Number.POSITIVE_INFINITY;
        return;
      }

      nextText = STORY[storyIndex];
      storyIndex++;

      // prepara crossfade
      dateText.text = shownText;
      dateText.alpha = 0.95;


      xState = "fadeOut";
      xT = 0;
    }

    function applySharedTextBreath(dt){
      textBreathT += dt * (Math.PI * 2 / TEXT_BREATH_PERIOD);
      const b = 0.5 + Math.sin(textBreathT) * 0.5; // 0..1
      const a = 1.0 - TEXT_BREATH_ALPHA_AMP/2 + b * TEXT_BREATH_ALPHA_AMP;

      // sombra o glow respirando suave
      const shA = 0.12 + b * 0.18;
      const shB = 2.0 + b * 2.4;

      dateText.style.dropShadowAlpha = shA;
      dateText.style.dropShadowBlur  = shB;

      return a;
    }

    function updateStory(dt){
      const breathA = applySharedTextBreath(dt);

      // 1) nos quedamos en
      if (storyDone || xState === "final"){
        dateText.text  = shownText;
        dateText.alpha = PROMISE_ALPHA * breathA;
        return;
      }

      // 2) Estado normal
      if (xState === "idle"){
        dateText.text  = shownText;
        dateText.alpha = (shownText === HM_BASE) ? 1.0 : 0.95 * breathA;

        nextDropIn -= dt;
        if (nextDropIn <= 0){
          scheduleNextDrop();
          startDrop();
        }
        return;
      }

      // el texto se apaga
      if (xState === "fadeOut"){
        xT += dt;
        const t = Math.min(1, xT / X.fadeOut);
        const e = t * t * (3 - 2 * t);
        const FADE_FLOOR = 0.95; 
        dateText.alpha = (FADE_FLOOR + (1 - FADE_FLOOR) * (1 - e)) * breathA;

        if (t >= 1){

          shownText = nextText ?? shownText;
          nextText = null;

          dateText.text  = shownText;
          dateText.alpha = 0;

          if (shownText === STORY[STORY.length - 1]){
            storyDone   = true;
            xState      = "final";
            nextDropIn  = Infinity;
            return;
          }

          xState = "fadeIn";
          xT = 0;
        }
        return;
      }

      if (xState === "fadeIn"){
        xT += dt;
        const t = Math.min(1, xT / X.fadeIn);
        const e = t * t * (3 - 2 * t);

        dateText.alpha = e * 0.95 * breathA;

        if (t >= 1){
          xState = "idle";
          xT = 0;
        }
        return;
      }
    }

    // estado inicial del texto
    shownText = HM_BASE;
    dateText.text = HM_BASE;
    dateText.alpha = 1.0;


    /* FONDO
       - Ambiente matrix(masomenos)
       - 3 capas con velocidades distintas */
    
       function randRange(min, max){
  return min + Math.random() * (max - min);
}

    const rectLayers = [];
    const rectConfig = [
      { count: 8,  speed: 0.040, wMin: 120, wMax: 200, hMin: 4, hMax: 8, alpha: 0.015 },
      { count: 12, speed: 0.070, wMin: 60,  wMax: 120, hMin: 4, hMax: 8, alpha: 0.025 },
      { count: 16, speed: 0.100, wMin: 30,  wMax: 60,  hMin: 3, hMax: 6, alpha: 0.035 }
    ];

    function makeRect(conf, w, h){
      const g = new PIXI.Graphics();
      const rw = randRange(conf.wMin, conf.wMax);
      const rh = randRange(conf.hMin, conf.hMax);

      g.beginFill(0xAAC8FF, conf.alpha);
      g.drawRect(0, 0, rw, rh);
      g.endFill();

      g.x = Math.random() * w;
      g.y = Math.random() * h;

      rectLayer.addChild(g);
      return { g, rw, rh, vx: conf.speed * (Math.random() < 0.5 ? -1 : 1) };
    }

    function buildRects(){
      rectLayer.removeChildren();
      rectLayers.length = 0;

      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      rectConfig.forEach(conf => {
        const arr = [];
        for (let i = 0; i < conf.count; i++){
          arr.push(makeRect(conf, w, h));
        }
        rectLayers.push(arr);
      });
    }

    function updateRects(dt){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      for (let li = 0; li < rectLayers.length; li++){
        const arr = rectLayers[li];
        for (let i = 0; i < arr.length; i++){
          const r = arr[i];
          r.g.x += r.vx;

          if (r.vx > 0 && r.g.x > w + 40){
            r.g.x = -r.rw - 40;
            r.g.y = Math.random() * h;
          } else if (r.vx < 0 && r.g.x < -r.rw - 40){
            r.g.x = w + 40;
            r.g.y = Math.random() * h;
          }
        }
      }
    }


    /* Zzz kho kho */
    const zzzs = [];
    const Z_SEQUENCE = [
      { size: 1.2, delay: 0.0, grow: true  },
      { size: 0.8, delay: 0.9, grow: false },
      { size: 0.4, delay: 2.0, grow: false }
    ];

    function spawnZzzCycle(){
      const baseX = model.x;
      const baseY = model.y - model.height + 20;

      for (let i = 0; i < Z_SEQUENCE.length; i++){
        const seq = Z_SEQUENCE[i];

        const z = new PIXI.Text("Z", {
          fontFamily: "Comic Neue",
          fontSize: 18 * seq.size, 
          fill: 0xD6DEFF
        });
        z.anchor.set(0.5);
        z.alpha = 0;
        z.x = baseX;
        z.y = baseY;

        if (seq.grow) z.scale.set(0.4);

        zzzLayer.addChild(z);

        zzzs.push({
          z,
          life: -seq.delay,
          lifeMax: 4.2,
          rise: 18 + Math.random() * 6,
          drift: 6 + Math.random() * 4,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.6 + Math.random() * 0.3,
          grow: seq.grow
        });
      }
    }

    let zzzTimer = 0;
    let nextZzz = 3.2;

    function updateZzz(dt){
      zzzTimer += dt;
      if (zzzTimer > nextZzz){
        spawnZzzCycle();
        zzzTimer = 0;
        nextZzz = 3.0 + Math.random() * 0.8;
      }

      // Update existing
      for (let i = zzzs.length - 1; i >= 0; i--){
        const p = zzzs[i];
        p.life += dt;
        if (p.life < 0) continue;

        const t = p.life / p.lifeMax;

        if (t < 0.25) p.z.alpha = t / 0.25;
        else if (t > 0.85) p.z.alpha = (1 - t) / 0.15;
        else p.z.alpha = 1;

        if (p.grow && t < 0.35){
          const sc = 0.4 + (t / 0.35) * 0.6;
          p.z.scale.set(sc);
        }

        p.z.y -= p.rise * dt;
        p.swayPhase += dt * p.swaySpeed;
        p.z.x += Math.sin(p.swayPhase) * p.drift * dt;

        if (t >= 1){
          zzzLayer.removeChild(p.z);
          p.z.destroy();
          zzzs.splice(i, 1);
        }
      }
    }


    /* ESTRELLAS */
    const stars = [];
    const STAR_COUNT = 150;      // densidad 
    const STAR_V = 0.30;         // velocidad 
    const STAR_DRIFT_MIN = 4.0;
    const STAR_DRIFT_MAX = 10.0;

    function makeStar(w, h){
      const g = new PIXI.Graphics();
      starLayer.addChild(g);
      return {
        g,
        x: Math.random() * w,
        y: Math.random() * h,
        r: randRange(0.3, 2.0),
        baseAlpha: randRange(0.18, 0.40),
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: randRange(0.25, 0.60),
        vx: (Math.random() - 0.8) * STAR_V,
        vy: (Math.random() - 0.8) * STAR_V,
        driftT: randRange(STAR_DRIFT_MIN, STAR_DRIFT_MAX)
      };
    }

    function drawStar(s, alpha){
      s.g.clear();
      s.g.beginFill(0xFFFFFF, alpha);
      s.g.drawCircle(0, 0, s.r);
      s.g.endFill();
      s.g.x = s.x;
      s.g.y = s.y;
    }

    function buildStars(){
      starLayer.removeChildren();
      stars.length = 0;

      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      for (let i = 0; i < STAR_COUNT; i++){
        stars.push(makeStar(w, h));
      }
    }

    function updateStars(dt){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      for (let i = 0; i < stars.length; i++){
        const s = stars[i];

        s.phase += s.pulseSpeed * dt;
        const pulse = 0.5 + Math.sin(s.phase) * 0.5;
        const alpha = s.baseAlpha + pulse * 0.25;

        s.driftT -= dt;
        if (s.driftT <= 0){
          s.vx = (Math.random() - 0.8) * STAR_V;
          s.vy = (Math.random() - 0.8) * STAR_V;
          s.driftT = randRange(STAR_DRIFT_MIN, STAR_DRIFT_MAX);
        }

        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -10) s.x = w + 10;
        if (s.x >  w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10;
        if (s.y >  h + 10) s.y = -10;

        drawStar(s, alpha);
      }
    }

    /* ===== SECRETO: estrellas grandes (toque -> explosión -> número) ===== */
    const secretFX = {
      enabled: false,
      count: 0,
      target: 28,
      timer: 0,
      active: null,
      parts: [],
      nums: []
    };

    function armSecretTimer(){
      secretFX.timer = randRange(2, 4); // místico, no forzado
    }

    function removeBigStar(){
      if (!secretFX.active) return;
      const g = secretFX.active.g;
      starLayer.removeChild(g);
      g.destroy();
      secretFX.active = null;
    }

    function spawnTinyNumber(x, y, n){
      const t = new PIXI.Text(String(n), {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: 11,
        fill: 0xEAF1FF,
        letterSpacing: 1,
        dropShadow: true,
        dropShadowColor: 0xAFCBFF,
        dropShadowBlur: 2,
        dropShadowAlpha: 0.10,
        dropShadowDistance: 0,
        padding: 6
      });
      t.anchor.set(0.5);
      t.x = x;
      t.y = y;
      t.alpha = 0;

      // vida corta + sube apenas
      secretFX.nums.push({
        t,
        life: 1.65,
        lifeMax: 1.65,
        vy: -10 - Math.random() * 6
      });

      starLayer.addChild(t);
    }

    function explodeBigStar(x, y){
      const n = 16; // micro fuegos (polvo de estrella)
      for (let i = 0; i < n; i++){
        const p = new PIXI.Graphics();
        p.blendMode = PIXI.BLEND_MODES.ADD;

        // mezcla: blanco brillante, a veces rosado pastel
        const usePink = (Math.random() < 0.40);
        p.beginFill(usePink ? 0xFFB6D9 : 0xFFFFFF, usePink ? 0.45 : 0.35);
        p.drawCircle(0, 0, randRange(0.9, 2.0));
        p.endFill();
        p.x = x; p.y = y;

        const a = (i / n) * Math.PI * 2;
        const sp = randRange(0.35, 1.10);
        secretFX.parts.push({
          g: p,
          life: randRange(0.9, 1.55),
          lifeMax: 1.55,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp
        });

        starLayer.addChild(p);
      }
    }

    function showWhisperAt(x, y){
      const el = document.createElement("div");
      el.className = "whisper";
      el.textContent = "Veintiocho.\nAhora sí… shh.";

      // inclinación base + leve “inestabilidad”
      const rot = randRange(-11, -6);
      el.style.setProperty("--rot", rot + "deg");

      // posición con un offset mínimo para que no sea perfecto
      el.style.setProperty("--x", (x + randRange(-10, 8)) + "px");
      el.style.setProperty("--y", (y + randRange(-8, 10)) + "px");

      // si por alguna razón aún estás en cortina clara
      if (curtainAlpha > 0.5) el.classList.add("lightMode");

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5200);
    }

    // === Secreto: forma del icono (elige uno) ===
    // Cambia este valor por: "🐾"  "❄"  "☁"  "🌸"
    const SECRET_ICON = "🌸";

    function iconToShape(ch){
      switch(ch){
        case "🐾": return "paw";
        case "❄": return "snow";
        case "☁": return "cloud";
        case "🌸": return "flower";
        default:   return "star";
      }
    }

    function drawStarShape(g, R){
      const pts = [];
      const spikes = 5;
      const step = Math.PI / spikes;
      let ang = -Math.PI / 2;
      const outerR = R;
      const innerR = R * 0.50;
      for (let i = 0; i < spikes * 2; i++){
        const rr = (i % 2 === 0) ? outerR : innerR;
        pts.push(Math.cos(ang) * rr, Math.sin(ang) * rr);
        ang += step;
      }
      g.drawPolygon(pts);
    }

    function drawPawShape(g, R){
      // pad + 4 dedos
      const toeR = R * 0.38;
      const padR = R * 0.55;
      g.drawCircle(-R * 0.55, -R * 0.65, toeR);
      g.drawCircle(-R * 0.18, -R * 0.85, toeR);
      g.drawCircle( R * 0.18, -R * 0.85, toeR);
      g.drawCircle( R * 0.55, -R * 0.65, toeR);
      g.drawCircle(0, 0, padR);
    }

    function drawCloudShape(g, R){
      // nube simple (3 bultos + base)
      g.drawCircle(-R * 0.55, 0, R * 0.55);
      g.drawCircle(0, -R * 0.25, R * 0.75);
      g.drawCircle(R * 0.60, 0, R * 0.50);
      g.drawRoundedRect(-R * 1.05, -R * 0.10, R * 2.10, R * 0.95, R * 0.45);
    }

    function drawFlowerShape(g, R){
      // flor tipo sakura (5 pétalos)
      const petalR = R * 0.55;
      for (let i = 0; i < 5; i++){
        const a = -Math.PI/2 + i * (Math.PI * 2 / 5);
        g.drawCircle(Math.cos(a) * R * 0.70, Math.sin(a) * R * 0.70, petalR);
      }
      g.drawCircle(0, 0, R * 0.30);
    }

    function drawSnowShapeLines(g, R, w){
      // copo de nieve: 6 brazos + ramitas
      g.lineStyle(w, 0xFFFFFF, 1.0, 0.5);
      const arms = 6;
      for (let i = 0; i < arms; i++){
        const a = i * (Math.PI * 2 / arms);
        const x1 = Math.cos(a) * R;
        const y1 = Math.sin(a) * R;
        g.moveTo(0, 0);
        g.lineTo(x1, y1);

        const bx = Math.cos(a) * R * 0.65;
        const by = Math.sin(a) * R * 0.65;
        const a1 = a + Math.PI / 6;
        const a2 = a - Math.PI / 6;
        g.moveTo(bx, by);
        g.lineTo(bx + Math.cos(a1) * R * 0.22, by + Math.sin(a1) * R * 0.22);
        g.moveTo(bx, by);
        g.lineTo(bx + Math.cos(a2) * R * 0.22, by + Math.sin(a2) * R * 0.22);
      }
    }

    function buildSecretIcon(r){
      // En vez de “glow” circular grande, usamos: halo MUY pegado + núcleo nítido.
      const shape = iconToShape(SECRET_ICON);

      const cont = new PIXI.Container();
      const halo = new PIXI.Graphics();
      const core = new PIXI.Graphics();

      const PINK_CORE = 0xFFB3D9;
      const PINK_HALO = 0xFFD6EB;

      // halo: aditivo pero apretado (para que no se vea ese borde difuso)
      halo.blendMode = PIXI.BLEND_MODES.ADD;
      halo.alpha = 0.10;

      // core: normal (bordes más limpios)
      core.blendMode = PIXI.BLEND_MODES.NORMAL;
      core.alpha = 1.0;

      // tamaños
      const R = r * 1.20; // mismo tamano que las estrellas

      // dibujar halo (misma forma, un poquito más grande)
      if (shape === "snow"){
        // para líneas: hacemos el halo con líneas más gruesas
        drawSnowShapeLines(halo, R, Math.max(2.0, r * 0.55));
        halo.tint = PINK_HALO;
        halo.scale.set(1.04);
      } else {
        halo.beginFill(PINK_HALO, 1.0);
        if (shape === "paw")      drawPawShape(halo, R);
        else if (shape === "cloud")   drawCloudShape(halo, R);
        else if (shape === "flower")  drawFlowerShape(halo, R);
        else                          drawStarShape(halo, R);
        halo.endFill();
        halo.scale.set(1.06);
      }

      // dibujar núcleo (relleno + contorno finito)
      if (shape === "snow"){
        drawSnowShapeLines(core, R, Math.max(1.2, r * 0.34));
        core.tint = PINK_CORE;
      } else {
        const outlineW = Math.max(1.0, r * 0.24);
        core.lineStyle(outlineW, 0xFFFFFF, 0.30, 0.5);
        core.beginFill(PINK_CORE, 0.98);
        if (shape === "paw")      drawPawShape(core, R);
        else if (shape === "cloud")   drawCloudShape(core, R);
        else if (shape === "flower")  drawFlowerShape(core, R);
        else                          drawStarShape(core, R);
        core.endFill();
      }

      // hotspot blanco pequeño (solo un puntito, sin aureola)
      const hot = new PIXI.Graphics();
      hot.blendMode = PIXI.BLEND_MODES.ADD;
      hot.beginFill(0xFFFFFF, 0.40);
      hot.drawCircle(-R * 0.10, -R * 0.14, Math.max(0.7, r * 0.18));
      hot.endFill();

      cont.addChild(halo, core, hot);

      // radio para hitArea (generoso para móvil)
      const hitR = R * 1.05 + 18;
      return { cont, hitR };
    }

    function spawnBigStar(){
      // partícula rara rosada (ahora icono) que flota como las estrellas del fondo
      if (secretFX.active || secretFX.count >= secretFX.target) return;

      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      const r = randRange(1.5, 2.2);

      const built = buildSecretIcon(r);
      const g = built.cont;

      const margin = 18;
      g.x = randRange(margin, w - margin);
      g.y = randRange(margin + 52, h - margin);

      g.alpha = 1.0;
      g.interactive = true;
      g.buttonMode = false;
      g.hitArea = new PIXI.Circle(0, 0, built.hitR);

      const obj = {
        g,
        r,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: randRange(0.35, 0.70),
        rotSpeed: randRange(-0.40, 0.40),
        vx: (Math.random() - 0.8) * STAR_V,
        vy: (Math.random() - 0.8) * STAR_V,
        driftT: randRange(STAR_DRIFT_MIN, STAR_DRIFT_MAX)
      };

      g.on("pointerdown", (e) => {
        e.stopPropagation?.();

        // contar primero (para que el #28 sea corte inmediato)
        secretFX.count++;

        // En el toque 28: salto inmediato al evento (sin explosión ni numerito)
        if (secretFX.count >= secretFX.target){
          removeBigStar();
          secretFX.enabled = false;
          enterBurstEvent();
          return;
        }

        // Toques 1-27: mantiene el feedback normal
        explodeBigStar(g.x, g.y);
        spawnTinyNumber(g.x, g.y, secretFX.count);

        removeBigStar();
        armSecretTimer();
      });

      starLayer.addChild(g);
      secretFX.active = obj;
    }

    // armar al inicio (pero solo se habilita cuando despiertas)
    armSecretTimer();

    /* VELO NOCHE */
    function drawNightOverlay(){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      nightOverlay.clear();
      nightOverlay.beginFill(0x020611, 0.30);
      nightOverlay.drawRect(0, 0, w, h);
      nightOverlay.endFill();
    }

    
    /* DESPERTAR primer toque */
    function wakeUp(){
      if (typeState !== TYPE.done) return;
      if (wakingUp) return;
      wakingUp = true;

      window.removeEventListener("pointerdown", wakeUp);
      awakened = true;

      // Audio unlock
      if (!audioUnlocked){
        audioUnlocked = true;
        bgm.play().then(() => {
        }).catch(()=>{});
      }

      // fade de cortina 
      curtainFadeFrom = curtainAlpha;
      curtainFadeT = 0;
      curtainFading = true;
      curtainTarget = 0.0; 
      curtainTextTarget = 0.0; 
    }

    window.addEventListener("pointerdown", wakeUp, { passive: true });
/* CORTINA / UMBRAL */
    let curtainAlpha = 1.0; 
    let curtainTarget = 1.0;
    let curtainTextFade = 1.0; 
    let curtainTextTarget = 1.0;
    const CURTAIN_TEXT_FADE_SPEED = 6.0; 
    let curtainFadeT = 0;
    let curtainFadeFrom = 1.0;
    let curtainFading = false;
    const CURTAIN_FADE_DUR = 1.4; 
    // texto de cortina
    let curtainTextT = Math.random() * Math.PI * 2;
    let wakeHintT = 0;
    const CURTAIN_TEXT_PERIOD = 3.0;
    const CURTAIN_TEXT_AMP = 0.10

    
    /* MOTOR DE ESCRITURA */

    const LINE_A = "the desire to simply";
    const LINE_B_FAIL = "not e";
    const LINE_B_FINAL = "exist :)";

    const TYPE = {
      writeA: "writeA",
      writeB_fail: "writeB_fail",
      pause_after_fail: "pause_after_fail",
      eraseB: "eraseB",
      writeB_final: "writeB_final",
      done: "done"
    };

    let typeState = TYPE.writeA;
    let typeTimer = 0;
    let pauseTimer = 0;

    // Velocidad humana
    const BASE_TYPE_SPEED = 0.12; // segundos por carac
    const ERASE_SPEED = 0.075;
    const FAIL_PAUSE = 0.42;

    function humanDelay(base){
      return Math.max(0.01, base + (Math.random() - 0.5) * base * 0.6);
    }

    let nextCharDelay = humanDelay(BASE_TYPE_SPEED);

    // Inicializa el texto de la cortina
    (function initCurtainFixedText(){
      curtainTextA.text = "";
      curtainTextB.text = "";
      typeState = TYPE.writeA;
      typeTimer = 0;
      pauseTimer = 0;
      nextCharDelay = humanDelay(BASE_TYPE_SPEED);
    })();

    function updateTypewriter(dt){
      if (typeState === TYPE.done) return;

      typeTimer += dt;

      if (typeState === TYPE.writeA){
        if (typeTimer >= nextCharDelay){
          typeTimer = 0;
          nextCharDelay = humanDelay(BASE_TYPE_SPEED);
          const i = curtainTextA.text.length;
          if (i < LINE_A.length){
            curtainTextA.text += LINE_A[i];
          } else {
            typeState = TYPE.writeB_fail;
            nextCharDelay = humanDelay(BASE_TYPE_SPEED);
          }
        }
        return;
      }

      if (typeState === TYPE.writeB_fail){
        if (typeTimer >= nextCharDelay){
          typeTimer = 0;
          nextCharDelay = humanDelay(BASE_TYPE_SPEED);
          const i = curtainTextB.text.length;
          if (i < LINE_B_FAIL.length){
            curtainTextB.text += LINE_B_FAIL[i];
          } else {
            typeState = TYPE.pause_after_fail;
            pauseTimer = 0;
          }
        }
        return;
      }

      if (typeState === TYPE.pause_after_fail){
        pauseTimer += dt;
        if (pauseTimer >= FAIL_PAUSE){
          typeState = TYPE.eraseB;
          typeTimer = 0;
        }
        return;
      }

      if (typeState === TYPE.eraseB){
        if (typeTimer >= ERASE_SPEED){
          typeTimer = 0;
          if (curtainTextB.text.length > 0){
            curtainTextB.text = curtainTextB.text.slice(0, -1);
          } else {
            typeState = TYPE.writeB_final;
            nextCharDelay = humanDelay(BASE_TYPE_SPEED * 1.10);
          }
        }
        return;
      }

      if (typeState === TYPE.writeB_final){
        if (typeTimer >= nextCharDelay){
          typeTimer = 0;
          nextCharDelay = humanDelay(BASE_TYPE_SPEED * 1.10);
          const i = curtainTextB.text.length;
          if (i < LINE_B_FINAL.length){
            curtainTextB.text += LINE_B_FINAL[i];
          } else {
            typeState = TYPE.done;
          }
        }
        return;
      }
    }
function drawCurtain(){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      if (curtainAlpha <= 0.02){
        curtainAlpha = 0;
	curtain.visible = false;
        return;
      }
      curtain.visible = true;
      curtain.clear();

      // base 
      curtain.beginFill(0xF5F9FF, curtainAlpha);
      curtain.drawRect(0, 0, w, h);
      curtain.endFill();

      // velo
      const r = Math.max(w, h) * 0.75;
      curtain.beginFill(0xF5F9FF, Math.min(1, curtainAlpha) * 0.30);
      curtain.drawCircle(w * 0.4, h * 0.6, r);
      curtain.endFill();

      // verso centrado
      const cx = w * 0.5;
      const cy = h * 0.45;
      curtainTextA.position.set(cx, cy);
      curtainTextB.position.set(cx, cy + 28);
      wakeHint.position.set(cx, cy + 72);
    }

      // respira suave

    function updateCurtainText(dt){
      curtainTextT += dt * (Math.PI * 2 / CURTAIN_TEXT_PERIOD);
      const b = 0.5 + Math.sin(curtainTextT) * 0.5;
      const a = 0.50 + b * CURTAIN_TEXT_AMP; 

      //curtainTextFade se apaga al despertar
      const k = Math.max(0, Math.min(1, curtainAlpha));
      const f = Math.max(0, Math.min(1, curtainTextFade));
      const kk = (k < 0.03) ? 0 : k; 
      curtainTextA.alpha = a * kk * f;
      curtainTextB.alpha = a * kk * f;
      const vis = (curtainTextA.alpha > 0.01);
      curtainTextA.visible = vis;
      curtainTextB.visible = vis;

      // Hint
      const ready = (typeState === TYPE.done) && !wakingUp;
      const hintTarget = ready ? 0.65 : 0.0;
      // transición suave del hint
      wakeHint.alpha += (hintTarget - wakeHint.alpha) * 6.0 * dt;
      if (wakeHint.alpha < 0.01) wakeHint.alpha = 0;
      wakeHint.visible = wakeHint.alpha > 0;
      wakeHint.alpha *= f;
    }


    /* LAYOUT/RESPONSIVE */
    function layout(){
      const w = app.renderer.width / DPR;
      const h = app.renderer.height / DPR;

      // Valores(movil)
      const yFactor = 1.35;
      const baseFactor = 0.22;

      model.position.set(w / 2, h / yFactor);

      const base = Math.min(w / 1080, h / 1920);
      model.scale.set(base * baseFactor);

      // Evita modelo ancho
      const maxWidth = w * 0.88;
      const b = model.getBounds();
      if (b.width > maxWidth){
        model.scale.set(model.scale.x * (maxWidth / b.width));
      }

      drawNightOverlay();
      buildRects();
      buildStars();
      layoutPresentation();
      drawCurtain();
    }

    window.addEventListener("resize", layout, { passive: true });
    layout();


    /* RESPIRACION DEL MODELO (ParamRes) */
    let breath = { value: 30, target: 30, speed: 0.035 };

    function pickTarget(){
      return Math.random() < 0.85
        ? (-18 - Math.random() * 4)     // -18..-22
        : (-24 - Math.random() * 1.5);  // -24..-25.5
    }

    let phase = "down";
    let nextSwitch = 0;

    function updateModelBreath(dt){
      nextSwitch -= dt;
      if (nextSwitch <= 0){
        if (phase === "down"){
          breath.target = pickTarget();
          breath.speed  = 0.045 + Math.random() * 0.015;
          phase = "up";
          nextSwitch = 0.9 + Math.random() * 0.4;
        } else {
          breath.target = 30;
          breath.speed  = 0.03 + Math.random() * 0.01;
          phase = "down";
          nextSwitch = 0.8 + Math.random() * 0.4;
        }
      }

      breath.value += (breath.target - breath.value) * breath.speed;
      setParam("ParamRes", breath.value);
    }

    /* LOOP  */
    app.ticker.add((delta) => {
      let dt = (delta / 60);
    dt = Math.min(dt, 1/30);

      // Music icon theme: intro (light curtain) uses the same ink color as the letters,
      // then switches to the dark-scene color after the curtain fades.
      musicBtn.classList.toggle("lightMode", curtainAlpha > 0.9);


      // Cortina(texto)
      updateCurtainText(dt);
      updateTypewriter(dt);     
      if (curtainFading){
        curtainFadeT += dt;
        const t = Math.min(1, curtainFadeT / CURTAIN_FADE_DUR);
        const s = t * t * (3 - 2 * t);
        curtainAlpha = curtainFadeFrom * (1 - s);
        if (t >= 1){
          curtainAlpha = 0;
          curtainFading = false;
        }
      }

      // Fade del verso
      if (curtainTextFade !== curtainTextTarget){
        curtainTextFade += (curtainTextTarget - curtainTextFade) * CURTAIN_TEXT_FADE_SPEED * dt;
        if (Math.abs(curtainTextFade - curtainTextTarget) < 0.005) curtainTextFade = curtainTextTarget;
      }

      if (audioUnlocked && bgm.volume < 0.5){
        bgm.volume = Math.min(0.5, bgm.volume + dt * 0.05);
      }

      // Redibujar cortina cada frame(para que el fade sea visible)
      drawCurtain();

      // Modelo(ParamRes)
      updateModelBreath(dt);

      // Fondo(rects)
      updateRects(dt);

      // Estrellas
      updateStars(dt);

      // Secreto: estrellas grandes (solo después de despertar + cortina fuera)
      secretFX.enabled = awakened && curtainAlpha <= 0.02;

      if (secretFX.enabled){
        secretFX.timer -= dt;

        if (!secretFX.active && secretFX.timer <= 0){
          spawnBigStar();
          // mientras haya una activa, pausamos el timer
          secretFX.timer = 9999;
        }

        // actualizar partícula secreta (pulso + deriva)
        if (secretFX.active){
          const s = secretFX.active;

          const w = app.renderer.width / DPR;
          const h = app.renderer.height / DPR;

          s.phase += s.pulseSpeed * dt;
          const pulse = 0.5 + Math.sin(s.phase) * 0.5; // 0..1

          // aparición + respiración mínima (fantasma)
          // brillo estable + micro pulso de escala (más 2D y más visible)
          s.g.alpha = 0.92;
          const sc = 0.94 + pulse * 0.10; // 0.94..1.04
          s.g.scale.set(sc);
          s.g.rotation += (s.rotSpeed || 0) * dt;


          // flotar como las estrellas del fondo
          s.driftT -= dt;
          if (s.driftT <= 0){
            s.vx = (Math.random() - 0.8) * STAR_V;
            s.vy = (Math.random() - 0.8) * STAR_V;
            s.driftT = randRange(STAR_DRIFT_MIN, STAR_DRIFT_MAX);
          }

          s.g.x += s.vx * 60 * dt;
          s.g.y += s.vy * 60 * dt;

          if (s.g.x < -10) s.g.x = w + 10;
          if (s.g.x >  w + 10) s.g.x = -10;
          if (s.g.y < -10) s.g.y = h + 10;
          if (s.g.y >  h + 10) s.g.y = -10;
        }

        // partículas
        for (let i = secretFX.parts.length - 1; i >= 0; i--){
          const p = secretFX.parts[i];
          p.life -= dt;
          p.g.x += p.vx * 60 * dt;
          p.g.y += p.vy * 60 * dt;
          p.g.alpha = Math.max(0, (p.life / p.lifeMax) * 0.65);

          if (p.life <= 0){
            starLayer.removeChild(p.g);
            p.g.destroy();
            secretFX.parts.splice(i, 1);
          }
        }

        // numeritos
        for (let i = secretFX.nums.length - 1; i >= 0; i--){
          const n = secretFX.nums[i];
          n.life -= dt;

          const t = 1 - Math.max(0, n.life / n.lifeMax);
          // fade in rápido y fade out suave
          const a = (t < 0.20) ? (t / 0.20) : (t > 0.85 ? (1 - t) / 0.15 : 1);
          n.t.alpha = a * 0.55;

          n.t.y += n.vy * dt;

          if (n.life <= 0){
            starLayer.removeChild(n.t);
            n.t.destroy();
            secretFX.nums.splice(i, 1);
          }
        }
      }

      // Zzz
      updateZzz(dt);

      // Balbuceo 
      if (awakened) updateStory(dt);

      // UI
      updateTitleGlow(dt);
      tapCooldown = Math.max(0, tapCooldown - dt);
      updateInitializingDots(dt);
      // Respira "tap to awaken" (sutil, secundario)
      if (typeState === TYPE.done && !wakingUp && wakeHint.visible){
        wakeHintT += dt * (Math.PI * 2 / 1.6); // periodo 
        const wb = 0.5 + Math.sin(wakeHintT) * 0.5;
        wakeHint.alpha = 0.45 + wb * 0.28;
        if (wakeHint.style && wakeHint.style.dropShadow){
          wakeHint.style.dropShadowBlur = 1.8 + wb * 1.6; 
        }
      }
    });

  })();
  
/* ===== Integración: Nivi -> Burst Event ===== */
function enterBurstEvent(){
  // ocultar UI (música)
  const m = document.getElementById("musicBtn");
  if (m) m.style.display = "none";

  // pausar música de Nivi al entrar al evento
  const __bgm = window.__NIVI_BGM;
  try{
    __bgm?.pause();
    if(__bgm){ __bgm.currentTime = 0; __bgm.muted = true; }
  }catch(_){ }

  // detener Pixi / Nivi
  const __app = window.__NIVI_APP;
  try{ __app?.ticker?.stop(); }catch(_){}
  const stage = document.getElementById("stage");
  if (stage) stage.style.display = "none";

  // limpiar whispers si quedaron
  document.querySelectorAll(".whisper").forEach(el => el.remove());

  // arrancar evento (debe ser dentro de un gesto)
  if (window.BurstEvent && typeof window.BurstEvent.start === "function"){
    window.BurstEvent.start();
  } else {
    console.warn("BurstEvent no está listo.");
  }
}

// --- Optional DEV shortcut: Burst button wiring (safe if button is absent)
(() => {
  const btn = document.getElementById("burstBtn");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    try { enterBurstEvent(); } catch (err) { console.warn("[NIVI] enterBurstEvent failed:", err); }
  }, { passive: false });
})();

