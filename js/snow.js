'use strict';

(function snow(){
  const cvs = document.getElementById('snowCanvas');
  if(!cvs) return;

  const ctx = cvs.getContext('2d');

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  let flakes = [];

  const SPR = 32;

  const snowSprite = document.createElement('canvas');
  snowSprite.width = snowSprite.height = SPR;

  const sctx = snowSprite.getContext('2d');
  const gS = sctx.createRadialGradient(SPR/2, SPR/2, 0, SPR/2, SPR/2, SPR/2);

  gS.addColorStop(0, 'rgba(255,255,255,.95)');
  gS.addColorStop(1, 'rgba(255,255,255,0)');

  sctx.fillStyle = gS;
  sctx.beginPath();
  sctx.arc(SPR/2, SPR/2, SPR/2, 0, Math.PI * 2);
  sctx.fill();

  const petalSprite = document.createElement('canvas');
  petalSprite.width = petalSprite.height = SPR;

  const pctx = petalSprite.getContext('2d');
  const gP = pctx.createRadialGradient(SPR/2, SPR/2, 0, SPR/2, SPR/2, SPR/2);

  gP.addColorStop(0, 'rgba(247,198,208,.95)');
  gP.addColorStop(1, 'rgba(225,124,161,0)');

  pctx.fillStyle = gP;
  pctx.beginPath();
  pctx.ellipse(SPR/2, SPR/2, SPR/2.5, SPR/3.8, -0.35, 0, Math.PI * 2);
  pctx.fill();

  function resize(){
    W = innerWidth;
    H = innerHeight;
    dpr = Math.max(1, devicePixelRatio || 1);

    cvs.width = Math.floor(W * dpr);
    cvs.height = Math.floor(H * dpr);
    cvs.style.width = W + 'px';
    cvs.style.height = H + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    init();
  }

  function newFlake(y = Math.random() * H, kind){
    const isPetal = kind ? kind === 'petal' : Math.random() < 0.30;

    if(isPetal){
      const w = 4 + Math.random() * 10;
      const h = w * (0.55 + Math.random() * 0.35);

      return {
        kind:'petal',
        x:Math.random() * W,
        y,
        w,
        h,
        vy:0.8 + Math.random() * 1.2,
        sway:0.6 + Math.random() * 1.4,
        angle:Math.random() * Math.PI * 2,
        rot:Math.random() * Math.PI * 2,
        spin:(Math.random() < .5 ? 1 : -1) * (0.01 + Math.random() * 0.03)
      };
    }

    const big = Math.random() < 0.12;

    return {
      kind:'snow',
      x:Math.random() * W,
      y,
      r: big ? 2.2 + Math.random() * 1.6 : 1.0 + Math.random() * 1.4,
      vy: big ? 0.6 + Math.random() * 0.8 : 1.0 + Math.random() * 1.4,
      sway:0.4 + Math.random() * 1.2,
      angle:Math.random() * Math.PI * 2
    };
  }

  function init(){
    const area = W * H;
    const count = Math.max(120, Math.min(480, Math.round(area * 0.00062)));

    flakes = Array.from({ length:count }, () => newFlake(Math.random() * H));
  }

  let wind = 0;
  let target = 0;

  function updateWind(){
    if(Math.random() < 0.006){
      target = (Math.random() * 2 - 1) * 0.35;
    }

    wind += (target - wind) * 0.01;
  }

  function step(){
    updateWind();
    ctx.clearRect(0, 0, W, H);

    for(let i = 0; i < flakes.length; i++){
      const f = flakes[i];

      if(f.kind === 'petal'){
        f.angle += 0.02 * f.sway;
        f.rot += f.spin;
        f.x += Math.sin(f.angle) * (0.6 + f.sway * 0.2) + wind * 0.8;
        f.y += f.vy * (0.85 + 0.3 * Math.sin(f.angle + f.rot * 0.5));

        if(f.x < -8) f.x = W + 8;
        if(f.x > W + 8) f.x = -8;

        if(f.y > H + 8){
          flakes[i] = newFlake(-8, 'petal');
          continue;
        }

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot + Math.sin(f.angle * 1.7) * 0.4);
        ctx.globalAlpha = 0.95;
        ctx.drawImage(petalSprite, -f.w/2, -f.h/2, f.w, f.h);
        ctx.restore();
      }else{
        f.angle += 0.01 * f.sway;
        f.x += Math.sin(f.angle) * 0.3 + wind;
        f.y += f.vy;

        if(f.x < -6) f.x = W + 6;
        if(f.x > W + 6) f.x = -6;

        if(f.y > H + 6){
          flakes[i] = newFlake(-6, 'snow');
          continue;
        }

        const size = f.r * 2;

        ctx.globalAlpha = 0.85;
        ctx.drawImage(snowSprite, f.x - f.r, f.y - f.r, size, size);
      }
    }

    requestAnimationFrame(step);
  }

  addEventListener('resize', resize);

  resize();
  requestAnimationFrame(step);
})();
