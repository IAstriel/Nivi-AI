// ui.js — capa UI (render, burbujas, typing, autosize)
export function $(id){ return document.getElementById(id); }

// ===== Typewriter ligero (estilo Hollow) =====
// - Un solo setInterval
// - Escribe con textContent (sin spans / innerHTML)
export function createTypewriter(el, { speed = 50 } = {}){
  const tw = {
    typing:false,
    pos:0,
    speed,
    timer:null,
    current:"",
    type(str){
      this.typing = true;
      this.pos = 0;
      this.current = String(str ?? "");
      el.textContent = "";
      clearInterval(this.timer);
      const s = this.current;
      this.timer = setInterval(() => {
        if(this.pos >= s.length){
          clearInterval(this.timer);
          this.typing = false;
          return;
        }
        el.textContent += s.charAt(this.pos++);
      }, this.speed);
    },
    skip(){
      if(!this.typing) return;
      clearInterval(this.timer);
      el.textContent = this.current;
      this.typing = false;
    },
    stop(){
      clearInterval(this.timer);
      this.typing = false;
    }
  };
  return tw;
}

// ===== Intro: renglones permanentes (slots) + tipeo encima =====
export function createIntroSlots(container, slots = 4){
  container.innerHTML = "";
  const els = [];
  for(let i=0;i<slots;i++){
    const slot = document.createElement("div");
    slot.className = "introSlot";

    const text = document.createElement("div");
    text.className = "introText";
    text.textContent = "";

    slot.appendChild(text);
    container.appendChild(slot);
    els.push(text);
  }
  return els;
}

// Escribe líneas una por una (cada línea en un slot). Devuelve un controller.
export function typeIntroLines(container, lines, {
  slots = 4,
  speed = 50,
  gapMs = 140,
} = {}){
  const textEls = createIntroSlots(container, slots);
  const safeLines = (Array.isArray(lines) ? lines : [])
    .map(s => String(s ?? "").trim())
    .filter(Boolean)
    .slice(0, slots);

  // limpia
  for(const el of textEls) el.textContent = "";

  let idx = 0;
  let tw = null;
  let cancelled = false;
  let gapTimer = null;

  function fillAll(){
    for(let i=0;i<safeLines.length;i++) textEls[i].textContent = safeLines[i];
  }

  function stopAll(){
    cancelled = true;
    if(tw) tw.stop();
    if(gapTimer) clearTimeout(gapTimer);
  }

  function next(){
    if(cancelled) return;
    if(idx >= safeLines.length) return;
    const el = textEls[idx];
    tw = createTypewriter(el, { speed });
    tw.type(safeLines[idx]);

    const myTw = tw;
    // esperar fin del tipeo
    const poll = () => {
      if(cancelled) return;
      if(myTw.typing){
        requestAnimationFrame(poll);
        return;
      }
      idx++;
      gapTimer = setTimeout(next, gapMs);
    };
    requestAnimationFrame(poll);
  }

  next();

  return {
    get typing(){ return !!tw && tw.typing; },
    skipCurrent(){ if(tw) tw.skip(); },
    skipAll(){ stopAll(); fillAll(); },
    stop(){ stopAll(); },
  };
}

export function scrollToBottom(chatArea){
  chatArea.scrollTop = chatArea.scrollHeight;
}

export function makeBubble(role, text){
  const row = document.createElement("div");
  row.className = "bubbleRow " + role;

  const b = document.createElement("div");
  b.className = "bubble " + role;
  b.textContent = text;

  row.appendChild(b);
  return row;
}

export function makeTyping(){
  const row = document.createElement("div");
  row.className = "bubbleRow healing";

  const box = document.createElement("div");
  box.className = "typing";
  box.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

  row.appendChild(box);
  return row;
}

// Auto-grow textarea (hasta 3 líneas por CSS)
export function wireAutosize(textarea){
  function autosize(){
    textarea.style.height = "auto";
    const maxH = parseFloat(getComputedStyle(textarea).maxHeight);
    const next = Math.min(textarea.scrollHeight, maxH);
    textarea.style.height = next + "px";
    textarea.classList.toggle("scrollable", textarea.scrollHeight > maxH);
  }
  textarea.addEventListener("input", autosize);
  window.addEventListener("load", autosize);
  return autosize;
}
