(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const mobileMode = window.matchMedia("(max-width: 700px)");

  function updateNavigation() {
  if (!nav) return;

  const pages = {
    about: "about.html",
    solutions: "solutions.html",
    bn1000: "bn1000.html",
    process: "process.html",
    passport: "passport.html",
    contact: "contact.html"
  };

  nav.querySelectorAll("a[data-anchor]").forEach(link => {
    const anchor = link.dataset.anchor;
    if (pages[anchor]) {
      link.href = `./${pages[anchor]}`;
    }
  });
}

  updateNavigation();
  if (mobileMode.addEventListener) mobileMode.addEventListener("change", updateNavigation);
  else if (mobileMode.addListener) mobileMode.addListener(updateNavigation);

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
;(function(){
  function ready(f){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f()}
  ready(function(){
    var KEY='hsMusicOff',POS='hsMusicPos',home=document.body.classList.contains('home-page');

    if(home){
      document.addEventListener('click',function(e){
        var l=e.target.closest&&e.target.closest('a[href^="#"]');if(!l)return;
        var id=l.getAttribute('href').slice(1);if(!id)return;
        var t=document.getElementById(id);
        if(t&&t.getClientRects().length>0)return;
        var map={about:'./about.html',solutions:'./solutions.html',bn1000:'./bn1000.html',process:'./process.html',passport:'./passport.html',contact:'./contact.html'};
        if(map[id]){e.preventDefault();location.href=map[id]}
      });
    }

    var ha=document.getElementById('hs-audio');
    if(ha){
      function save(){try{if(!ha.paused)sessionStorage.setItem(POS,ha.currentTime)}catch(e){}}
      setInterval(save,500);window.addEventListener('pagehide',save);
      return;
    }
    if(home)return;

    var st=document.createElement('style');
    st.textContent='#hs-music{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:48px;height:48px;border-radius:50%;border:2px solid #fff;background:#2b8fc0;color:#fff;font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}#hs-music:focus-visible{outline:3px solid #3fa7d6;outline-offset:3px}';
    document.head.appendChild(st);
    var b=document.createElement('button');b.id='hs-music';b.type='button';b.textContent='♪';b.setAttribute('aria-label','播放背景音樂');b.setAttribute('aria-pressed','false');
    var a=document.createElement('audio');a.src='/music.mp3';a.loop=true;a.preload='auto';a.volume=.4;
    document.body.appendChild(b);document.body.appendChild(a);

    var off=false,armed=false;
    try{off=sessionStorage.getItem(KEY)==='1'}catch(e){}
    function ui(on){b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'停止背景音樂':'播放背景音樂');b.textContent=on?'■':'♪'}
    a.addEventListener('playing',function(){ui(true)});
    a.addEventListener('pause',function(){ui(false)});
    function save(){try{if(!a.paused)sessionStorage.setItem(POS,a.currentTime)}catch(e){}}
    setInterval(save,500);window.addEventListener('pagehide',save);
    function arm(){
      if(armed)return;armed=true;
      var evs=['pointerdown','keydown','touchend'];
      function go(e){
        if(e&&e.target&&b.contains(e.target))return;
        evs.forEach(function(n){document.removeEventListener(n,go,true)});armed=false;
        if(!off&&a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){})}
      }
      evs.forEach(function(n){document.addEventListener(n,go,true)});
    }
    function start(){
      if(off)return;
      var p=a.play();if(p&&p.catch)p.catch(arm);
    }
    function resume(){
      var pos=0;try{pos=parseFloat(sessionStorage.getItem(POS))||0}catch(e){}
      if(pos>0&&a.duration&&pos<a.duration-1)a.currentTime=pos;
      start();
    }
    if(a.readyState>=1)resume();else a.addEventListener('loadedmetadata',resume,{once:true});
    b.addEventListener('click',function(){
      if(a.paused){off=false;try{sessionStorage.removeItem(KEY)}catch(e){}var p=a.play();if(p&&p.catch)p.catch(function(){})}
      else{a.pause();off=true;try{sessionStorage.setItem(KEY,'1')}catch(e){}}
    });
    document.addEventListener('visibilitychange',function(){if(document.hidden&&!a.paused)a.pause()});
  });
})();
