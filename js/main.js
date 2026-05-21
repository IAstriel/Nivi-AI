'use strict';

const els = {
  stage: document.getElementById('stage'),
  intro: document.getElementById('introOverlay'),
  dialog: document.getElementById('dialog'),
  dialogText: document.getElementById('dialogText'),
  healing: document.getElementById('healing'),
  gift: document.getElementById('gift'),
  finalTitle: document.getElementById('finalTitle'),
  finalMessage: document.getElementById('finalMessage'),
  tapCounter: document.getElementById('tapCounter'),
  tapCount: document.getElementById('tapCount'),
  tapMessage: document.getElementById('tapMessage'),
  acquiredScreen: document.getElementById('acquiredScreen'),
  acquiredText: document.getElementById('acquiredText'),
  giftBounceSound: document.getElementById('giftBounceSound'),
  cleanTapCounter: document.getElementById('cleanTapCounter'),
  cleanFinalMessage: document.getElementById('cleanFinalMessage'),
  music: document.getElementById('musicAudio'),
  musicBtn: document.getElementById('musicBtn')
};

let started = false;
let currentScene = 0;
let cleanFinalMode = false;
let cleanTapStarted = false;
let cleanRemainingTaps = 1000;
let cleanGiftOpened = false;
let talkFlyTimer = null;
let dilemmaFlyTimer = null;

const typer = {
  typing:false,
  pos:0,
  timer:null,
  text:'',
  speed:42,

  type(text){
    this.typing = true;
    this.pos = 0;
    this.text = String(text || '');
    els.dialogText.textContent = '';

    clearInterval(this.timer);

    this.timer = setInterval(() => {
      if(this.pos >= this.text.length){
        clearInterval(this.timer);
        this.typing = false;
        return;
      }

      els.dialogText.textContent += this.text.charAt(this.pos++);
    }, this.speed);
  },

  skip(){
    if(!this.typing) return;

    clearInterval(this.timer);
    els.dialogText.textContent = this.text;
    this.typing = false;
  }
};

function startExperience(){
  if(started) return;

  started = true;

  els.intro.classList.add('hide');
  els.stage.classList.add('started');
  els.dialog.classList.add('show');

  playMusic();
  applyScene(0);
}

function applyScene(index){
  const scene = scenes[index];
  if(!scene) return;

  setHealing(scene.healing);
  setGift(scene.gift);
  runAction(scene.action);

  typer.type(scene.text);
}

function setHealing(src){
  if(!els.healing) return;

  if(!src){
    els.healing.classList.remove('visible', 'entering');
    els.healing.style.opacity = '0';
    return;
  }

  els.healing.style.opacity = '';
  els.healing.src = src;
  els.healing.classList.add('visible');
}

function setGift(src){
  if(!els.gift) return;

  if(!src){
    clearGiftState();
    els.gift.src = '';
    return;
  }

  els.gift.src = src;
}

function clearHealingAction(){
  stopTalkFlyFrames();
  stopDilemmaFlyFrames();

  els.healing.classList.remove(
    'entering',
    'shy',
    'cough-bounce',
    'talk-fly',
    'move-left-safe',
    'left-thinking',
    'stay-left',
    'stay-left-shake',
    'approach-gift',
    'read-near-gift',
    'return-left',
    'blush-thinking',
    'dilemma-fly',
    'still-left',
    'frustrated-shout',
    'realize',
    'pointing',
    'pout-envy',
    'power-cast'
  );
}

function clearGiftState(){
  if(!els.gift) return;

  els.gift.getAnimations().forEach(animation => animation.cancel());

  els.gift.classList.remove(
    'is-visible',
    'fall',
    'suspended',
    'impact',
    'ground',
    'powered',
    'final-center',
    'final-grow',
    'jelly-bounce'
  );
}

function restartClass(el, className){
  if(!el) return;

  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function stopTalkFlyFrames(){
  if(talkFlyTimer){
    clearInterval(talkFlyTimer);
    talkFlyTimer = null;
  }
}

function startTalkFlyFrames(){
  stopTalkFlyFrames();

  if(!els.healing) return;

  let facingRight = true;
  els.healing.src = STICKERS.healingDerecha || els.healing.src;

  talkFlyTimer = setInterval(() => {
    facingRight = !facingRight;
    els.healing.src = facingRight ? STICKERS.healingDerecha : STICKERS.healingIzquierda;
  }, 2400);
}


function stopDilemmaFlyFrames(){
  if(dilemmaFlyTimer){
    clearInterval(dilemmaFlyTimer);
    dilemmaFlyTimer = null;
  }
}

function startDilemmaFlyFrames(){
  stopDilemmaFlyFrames();
}

function cleanUpdateFinalMessage(){
  if(!els.cleanTapCounter || !els.cleanFinalMessage) return;

  els.cleanTapCounter.textContent = `${cleanRemainingTaps}`;

  let message = `I just hope this little silly thing can put a smile on your face :><br>Thank you for being here, Yuki~ `;

  if(cleanTapStarted){
    message = `I just hope this little silly thing can put a smile on your face :><br>Thank you for being here, Yuki~ `;
    if(cleanRemainingTaps <= 990) message = `Healing is watching very carefully.`;
    if(cleanRemainingTaps <= 980) message = `take patience nhaa~`;
    if(cleanRemainingTaps <= 800) message = `so... mush éc o éc hhhh`;
    if(cleanRemainingTaps <= 750) message = `it's not me... I swear`;
    if(cleanRemainingTaps <= 700) message = `you're really committed, huh...`;
    if(cleanRemainingTaps <= 600) message = `YUKI~ IS GONNA DIE FROM PANIC :>`;
    if(cleanRemainingTaps <= 550) message = `omagaae a kaagi`;
    if(cleanRemainingTaps <= 500) message = `halfway there... don't give up now`;
    if(cleanRemainingTaps <= 300) message = `there is something warm inside?`;
    if(cleanRemainingTaps <= 150) message = `almost there. Healing believes in you`;
    if(cleanRemainingTaps <= 100) message = `only mot cham~ nee?`;
    if(cleanRemainingTaps <= 80) message = `oh really? hhhh`;
    if(cleanRemainingTaps <= 30) message = `it is opening a litto a litto...`;
    if(cleanRemainingTaps <= 10) message = `just a few more`;
    if(cleanRemainingTaps <= 9) message = `yuki yuki wait`;
    if(cleanRemainingTaps <= 8) message = `I’M NOT READY AAAAA 💔`;
    if(cleanRemainingTaps <= 7) message = `THE GIFT IS GONNA OPEN—!`;
    if(cleanRemainingTaps <= 6) message = `DON’T PRESS THE LAST TAP!! NHA`;
    if(cleanRemainingTaps <= 5) message = `YUKI~ DEFINITELY DIDN’T CRY MAKING THIS…`;
    if(cleanRemainingTaps <= 4) message = `IT’S TOTALLY EMPTY I PROMISE ❄`;
    if(cleanRemainingTaps <= 3) message = `I SWEAR THERE’S NOTHING INSIDE 😭`;
    if(cleanRemainingTaps <= 2) message = `wait wait waito`;
    if(cleanRemainingTaps <= 1) message = `...okay maybe there’s a little something inside`;
    
  }

  els.cleanFinalMessage.innerHTML = message;
}

function cleanEnterFinalMode(){
  cleanFinalMode = true;
  cleanTapStarted = false;
  cleanRemainingTaps = 1000;
  cleanGiftOpened = false;

  document.body.classList.add('clean-final');
  document.body.classList.remove('clean-counter-started');

  if(els.dialog){
    els.dialog.classList.add('final-hide');
  }

  cleanUpdateFinalMessage();
}

function cleanTypeFinalText(target){
  const lines = [
    'ITEM ACQUIRED',
    '[ 1000 NiVi Coins ]'
  ];

  target.innerHTML = '';

  let lineIndex = 0;
  let charIndex = 0;

  function typeLine(){
    if(lineIndex >= lines.length) return;

    const line = document.createElement('div');

    if(lineIndex === 1){
      line.className = 'memory-line';
    }

    target.appendChild(line);

    const timer = setInterval(() => {
      line.textContent += lines[lineIndex][charIndex];
      charIndex++;

      if(charIndex >= lines[lineIndex].length){
        clearInterval(timer);

        lineIndex++;
        charIndex = 0;

        setTimeout(typeLine, 180);
      }
    }, 55);
  }

  typeLine();
}
function cleanOpenFinalGift(){
  if(cleanGiftOpened) return;

  cleanGiftOpened = true;

  const flash = document.createElement('div');
  flash.className = 'clean-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 950);

  const screen = document.createElement('div');
  screen.className = 'clean-acquired-screen';

  const text = document.createElement('div');
  text.className = 'clean-acquired-text';

  const signature = document.createElement('div');
  signature.className = 'clean-acquired-signature';
  signature.textContent = 'ニーバーリースー！';

  screen.appendChild(text);
  screen.appendChild(signature);

  document.body.classList.add('clean-opened');
  document.body.appendChild(screen);

  setTimeout(() => {
    cleanTypeFinalText(text);
  }, 420);
}

function cleanBounceFinalGift(){
  if(!cleanFinalMode || cleanGiftOpened || !els.gift) return;

  if(!cleanTapStarted){
    cleanTapStarted = true;
    document.body.classList.add('clean-counter-started');
  }

  cleanRemainingTaps = Math.max(0, cleanRemainingTaps - 1);

  restartClass(els.gift, 'clean-jelly');

  if(els.giftBounceSound){
    try{
      els.giftBounceSound.currentTime = 0;
      els.giftBounceSound.volume = 0.45;
      els.giftBounceSound.play();
    }catch(error){}
  }

  cleanUpdateFinalMessage();

  if(cleanRemainingTaps <= 0){
    cleanOpenFinalGift();
  }
}


function runAction(action){
  clearHealingAction();
  els.stage.classList.remove('impact-shake');

  switch(action){
    case 'entrance':
      restartClass(els.healing, 'entering');
      break;

    case 'shy':
      els.healing.classList.add('shy');
      break;

    case 'coughBounce':
      restartClass(els.healing, 'cough-bounce');
      break;

    case 'talkFly':
      startTalkFlyFrames();
      els.healing.classList.add('talk-fly');
      break;

    case 'moveLeftSafe':
      restartClass(els.healing, 'move-left-safe');
      break;

    case 'leftThinking':
      els.healing.classList.add('left-thinking');
      break;

    case 'giftFall':
      els.healing.classList.add('stay-left');

      if(els.gift){
        clearGiftState();
        els.gift.src = STICKERS.regaloMeteoro;
        els.gift.classList.add('is-visible');
        restartClass(els.gift, 'fall');
      }
      break;

    case 'giftSuspended':
      els.healing.classList.add('stay-left');

      if(els.gift){
        clearGiftState();
        els.gift.src = STICKERS.regaloMeteoro;
        els.gift.classList.add('is-visible', 'suspended');
      }
      break;

    case 'giftImpact':
      els.healing.classList.add('stay-left-shake');

      if(els.gift){
        clearGiftState();
        els.gift.src = STICKERS.regaloImpacto;
        els.gift.classList.add('is-visible');
        restartClass(els.gift, 'impact');
      }

      restartClass(els.stage, 'impact-shake');
      break;

    case 'giftGround':
      els.healing.classList.add('stay-left');

      if(els.gift){
        clearGiftState();
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      break;

    case 'approachGift':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      restartClass(els.healing, 'approach-gift');
      break;

    case 'readNearGift':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      els.healing.classList.add('read-near-gift');
      break;

    case 'returnLeft':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      restartClass(els.healing, 'return-left');
      break;

    case 'blushThinking':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      els.healing.classList.add('blush-thinking');
      break;

    case 'dilemmaFly':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      els.healing.classList.add('dilemma-fly');
      break;

    case 'stillLeft':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      els.healing.classList.add('still-left');
      break;

    case 'frustratedShout':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      restartClass(els.healing, 'frustrated-shout');
      break;

    case 'realize':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      restartClass(els.healing, 'realize');
      break;

    case 'pointing':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      restartClass(els.healing, 'pointing');
      break;

    case 'poutEnvy':
      if(els.gift){
        els.gift.src = STICKERS.regalo;
        els.gift.classList.add('is-visible', 'ground');
      }
      els.healing.classList.add('pout-envy');
      break;

    case 'powerCast':
      if(els.gift){
        els.gift.src = STICKERS.regaloAura || STICKERS.regalo;
        els.gift.classList.add('is-visible', 'powered');
      }
      els.healing.classList.add('power-cast');
      break;

    case 'finalGiftCenter':
      els.stage.classList.remove('final-focus');
      if(els.gift){
        els.gift.src = STICKERS.regaloAura || STICKERS.regalo;
        els.gift.classList.add('is-visible');
        restartClass(els.gift, 'final-center');
      }
      els.healing.classList.add('power-cast');
      break;

    case 'finalGiftGrow':
      els.stage.classList.add('final-focus');

      if(els.gift){
        els.gift.src = STICKERS.regaloAura;
        els.gift.classList.add('is-visible');
        restartClass(els.gift, 'final-grow');
      }

      cleanEnterFinalMode();
      break;

    default:
      break;
  }
}

function nextScene(){
  if(typer.typing){
    typer.skip();
    return;
  }

  if(currentScene >= scenes.length - 1) return;

  currentScene++;
  applyScene(currentScene);
}

function playMusic(){
  if(!els.music || !els.musicBtn) return;
  if(!els.music.paused) return;

  els.music.volume = 0.18;

  els.music.play().then(() => {
    els.musicBtn.classList.add('playing');
    els.musicBtn.setAttribute('aria-pressed', 'true');
  }).catch(() => {});
}

function toggleMusic(event){
  if(event) event.stopPropagation();

  if(!els.music || !els.musicBtn) return;

  if(els.music.paused){
    playMusic();
  }else{
    els.music.pause();
    els.musicBtn.classList.remove('playing');
    els.musicBtn.setAttribute('aria-pressed', 'false');
  }
}

window.addEventListener('load', () => {
  els.dialogText.textContent = '';
});

document.addEventListener('pointerdown', (event) => {
  if(event.target.closest('#musicBtn')) return;

  if(!started){
    startExperience();
    return;
  }

  if(cleanFinalMode){
    cleanBounceFinalGift();
    return;
  }

  nextScene();
}, { passive:true });

document.addEventListener('keydown', (event) => {
  if(event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();

  if(!started){
    startExperience();
    return;
  }

  if(cleanFinalMode){
    cleanBounceFinalGift();
    return;
  }

  nextScene();
});

els.musicBtn.addEventListener('pointerdown', (event) => event.stopPropagation());
els.musicBtn.addEventListener('click', toggleMusic);

