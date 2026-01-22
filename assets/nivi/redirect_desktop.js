(function(){
  try{
    var ua = navigator.userAgent || "";
    var isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    var mqFine = window.matchMedia ? window.matchMedia("(pointer:fine)").matches : false;
    var mqHover = window.matchMedia ? window.matchMedia("(hover:hover)").matches : false;
    var wide = Math.max(window.innerWidth || 0, window.innerHeight || 0) >= 900;

    // "PC" ≈ pantalla amplia + hover real, y NO mobile UA
    var isDesktop = (!isMobileUA && wide && mqHover) || (!isMobileUA && wide && mqFine && mqHover);

    if(isDesktop){
      var target = "healing.html";
      if(!location.pathname.endsWith("/" + target) && !location.pathname.endsWith(target)){
        location.replace(target);
      }
    }
  }catch(e){}
})();
