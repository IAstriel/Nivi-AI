export function startSnow(canvas){
  if(!canvas) return;

  const ctx = canvas.getContext("2d", { alpha:true });

  const DPR_CAP = 1.5;

  const DENSITY_PER_MPX = 620;
  const MAX_PARTS = 650;
  const MIN_PARTS = 260;

  const SPR = 96;
  const PETAL_RATIO = 0.26;

  const WIND_FREQ = 0.00085;
  const WIND_AMP  = 9.0;

  const SPEED_MUL = 1.30;

  let W = 1, H = 1, dpr = 1;
  let parts = [];
  let lastT = performance.now();
  let enabled = true;

  function rand(min,max){ return min + Math.random()*(max-min); }

  const snowSprite = document.createElement("canvas");
  snowSprite.width = snowSprite.height = SPR;
  const sctx = snowSprite.getContext("2d");

  const petalSprite = document.createElement("canvas");
  petalSprite.width = petalSprite.height = SPR;
  const pctx = petalSprite.getContext("2d");

  function buildSprites(){
    const cx = SPR/2, cy = SPR/2;

    sctx.clearRect(0,0,SPR,SPR);
    sctx.save();
    sctx.translate(cx, cy);

    const g = sctx.createRadialGradient(0,0,0,0,0,SPR*0.33);
    g.addColorStop(0, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    sctx.fillStyle = g;
    sctx.beginPath();
    sctx.arc(0,0,SPR*0.33,0,Math.PI*2);
    sctx.fill();

    sctx.strokeStyle = "rgba(20,30,40,0.22)";
    sctx.lineWidth = 2.2;
    sctx.lineCap = "round";
    sctx.lineJoin = "round";

    sctx.fillStyle = "rgba(255,255,255,0.95)";
    const arm = 12;
    const arm2 = 8.5;

    for(let k=0;k<6;k++){
      sctx.rotate(Math.PI/3);
      sctx.beginPath();
      sctx.moveTo(-arm, 0);
      sctx.lineTo(arm, 0);
      sctx.stroke();
    }

    sctx.fillStyle = "rgba(255,255,255,0.98)";
    sctx.strokeStyle = "rgba(20,30,40,0.18)";
    sctx.lineWidth = 1.6;
    sctx.beginPath();
    sctx.arc(0,0,4.2,0,Math.PI*2);
    sctx.fill();
    sctx.stroke();

    sctx.fillStyle = "rgba(255,255,255,0.92)";
    for(let k=0;k<6;k++){
      const ang = k*(Math.PI/3);
      const x = Math.cos(ang)*arm2;
      const y = Math.sin(ang)*arm2;
      sctx.beginPath();
      sctx.arc(x,y,1.7,0,Math.PI*2);
      sctx.fill();
    }

    sctx.restore();

    pctx.clearRect(0,0,SPR,SPR);
    pctx.save();
    pctx.translate(cx, cy);
    pctx.rotate(-0.35);

    pctx.globalAlpha = 0.12;
    pctx.fillStyle = "rgba(120,30,55,0.55)";
    pctx.beginPath();
    pctx.ellipse(2, 8, 14, 6, 0.2, 0, Math.PI*2);
    pctx.fill();

    pctx.globalAlpha = 1;
    pctx.fillStyle = "rgba(247,198,208,0.95)";
    pctx.strokeStyle = "rgba(185,70,110,0.45)";
    pctx.lineWidth = 2.0;

    pctx.beginPath();
    pctx.moveTo(0, -18);
    pctx.quadraticCurveTo(16, -8, 10, 8);
    pctx.quadraticCurveTo(6, 20, 0, 22);
    pctx.quadraticCurveTo(-6, 20, -10, 8);
    pctx.quadraticCurveTo(-16, -8, 0, -18);
    pctx.closePath();
    pctx.fill();
    pctx.stroke();

    pctx.fillStyle = "rgba(255,255,255,0.30)";
    pctx.beginPath();
    pctx.ellipse(6, -6, 5.5, 2.4, 0.4, 0, Math.PI*2);
    pctx.fill();

    pctx.restore();
  }

  function makePart(spawnAnywhere=true){
    const isPetal = Math.random() < PETAL_RATIO;

    let w, h, a, vy, vx, rotV, wob, twk;
    if(!isPetal){
      w = h = 5.0 + Math.random()*7.5;
      a = 0.55 + Math.random()*0.35;
      vy = (14.5 + Math.random()*20.0) * SPEED_MUL;
      vx = (-10 + Math.random()*20);
      rotV = (-0.8 + Math.random()*1.6);
      wob = 1.8 + Math.random()*2.8;
      twk = 0.7 + Math.random()*1.0;
    }else{
      w = 9.0 + Math.random()*13.0;
      h = w * (0.46 + Math.random()*0.20);
      a = 0.70 + Math.random()*0.28;
      vy = (12.0 + Math.random()*17.0) * SPEED_MUL;
      vx = (-10 + Math.random()*20) * 1.05;
      rotV = (-2.6 + Math.random()*5.2);
      wob = 2.2 + Math.random()*3.8;
      twk = 0.6 + Math.random()*0.9;
    }

    return {
      isPetal,
      x: rand(0, W),
      y: spawnAnywhere ? rand(0, H) : -rand(0, H*0.25),
      w, h,
      a,
      vy, vx,
      angle: rand(0, Math.PI*2),
      rot: rand(0, Math.PI*2),
      rotV,
      wob,
      twk,
      seed: rand(0, 1000)
    };
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    W = Math.max(1, Math.floor(window.innerWidth));
    H = Math.max(1, Math.floor(window.innerHeight));

    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const mpx = (W*H) / 1_000_000;
    const target = Math.max(MIN_PARTS, Math.min(MAX_PARTS, Math.round(mpx * DENSITY_PER_MPX)));

    if(parts.length < target){
      while(parts.length < target) parts.push(makePart(true));
    }else if(parts.length > target){
      parts.length = target;
    }
  }

  function step(now){
    if(!enabled) return;

    const dt = Math.min(0.033, (now - lastT)/1000);
    lastT = now;

    ctx.clearRect(0,0,W,H);

    const wind = Math.sin(now*WIND_FREQ) * WIND_AMP;

    for(let i=0;i<parts.length;i++){
      const p = parts[i];

      p.angle += dt * (0.85 + (p.isPetal ? 1.45 : 1.05));
      p.y += p.vy * dt;
      p.x += (p.vx + wind + Math.sin(p.angle)*p.wob) * dt;
      p.rot += p.rotV * dt;

      if(p.x < -32) p.x = W + 32;
      if(p.x > W + 32) p.x = -32;

      if(p.y > H + 44){
        parts[i] = makePart(false);
        continue;
      }

      const tw = 0.94 + 0.10 * Math.sin(now*0.0020*p.twk + p.seed);
      ctx.globalAlpha = Math.min(1, p.a * tw);

      const spr = p.isPetal ? petalSprite : snowSprite;

      ctx.save();
      ctx.translate(p.x, p.y);

      if(p.isPetal){
        ctx.rotate(p.rot + Math.sin(p.angle*1.55)*0.35);
      }else{
        ctx.rotate(p.rot*0.45);
      }

      ctx.drawImage(spr, -p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  document.addEventListener("visibilitychange", ()=>{
    enabled = !document.hidden;
    if(enabled){
      lastT = performance.now();
      requestAnimationFrame(step);
    }
  });

  window.addEventListener("resize", resize, { passive:true });

  buildSprites();
  resize();
  requestAnimationFrame(step);
}

export function createMusicController(buttonEl, tracks){
  let musicIndex = Math.max(0, Math.min(tracks.length-1, parseInt(localStorage.getItem("hs_music_index")||"0",10) || 0));
  let musicOn = false;

  const audio = new Audio(tracks[musicIndex].src);
  audio.loop = true;
  audio.volume = 0.23;

  function setBtnState(){
    if(!buttonEl) return;
    buttonEl.style.opacity = musicOn ? "0.9" : "";
    buttonEl.setAttribute("aria-pressed", String(!!musicOn));
    buttonEl.setAttribute("title", `${tracks[musicIndex].label} (clic: play/pause · Shift+clic: Next · right click: Previous)`);
    buttonEl.classList.toggle("isOn", musicOn);
  }

  function loadTrack(idx){
    musicIndex = (idx + tracks.length) % tracks.length;
    localStorage.setItem("hs_music_index", String(musicIndex));
    audio.src = tracks[musicIndex].src;
    audio.load();
    setBtnState();
  }

  async function togglePlay(){
    try{
      if(!musicOn){
        await audio.play();
        musicOn = true;
      }else{
        audio.pause();
        musicOn = false;
      }
    }catch{
      musicOn = false;
    }
    setBtnState();
  }

  async function nextTrack(){
    const wasOn = musicOn;
    loadTrack(musicIndex + 1);
    if(wasOn){
      try{ await audio.play(); musicOn = true; }catch{ musicOn = false; }
    }
    setBtnState();
  }

  async function prevTrack(){
    const wasOn = musicOn;
    loadTrack(musicIndex - 1);
    if(wasOn){
      try{ await audio.play(); musicOn = true; }catch{ musicOn = false; }
    }
    setBtnState();
  }

  buttonEl?.addEventListener("click", async (e)=>{
    if(e.shiftKey) await nextTrack();
    else await togglePlay();
  });
  buttonEl?.addEventListener("contextmenu", async (e)=>{
    e.preventDefault();
    await prevTrack();
  });

  loadTrack(musicIndex);
  setBtnState();

  return {
    audio,
    get on(){ return musicOn; },
    get index(){ return musicIndex; },
    togglePlay,
    nextTrack,
    prevTrack,
    loadTrack,
    pause(){ try{ audio.pause(); }catch{} musicOn=false; setBtnState(); },
  };
}
