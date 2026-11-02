// The two of them on the landing page, the 404, How it works and Partnerships: side by side on their stools.
// Hover shows who they are, a tap goes to that side's page, and either one can be carried anywhere (life.js). They
// follow the story on the phone, quietly: a nod on each one's turn, face to face with a small heart at the match, back
// for the next market. Every change to them goes through cast.js, which owns their state (Mel, 2 November).
(function(){
  var pair = document.querySelector('.home-figs, .pair-figs'), cast = window.cvpCast; if(!pair || !cast) return;
  cast.heart(pair);
  pair.querySelectorAll('.s-fig').forEach(function(o){ cast.link(o, 'home-figure-to-') });
  var hero = document.getElementById('hero'), her = pair.querySelector('.her'), him = pair.querySelector('.him');
  function pulse(which, ms){ setTimeout(function(){ if(window.cvpPhonePulse) cvpPhonePulse(which) }, ms || 0) }

  // follow the story on the phone: this is the one place that answers a scene for the two of them, phones included
  var last = '', later = [];
  function sync(){
    var s = hero ? hero.dataset.scene : ''; if(s === last) return; last = s;
    later.forEach(clearTimeout); later = []; if(him) him.classList.remove('peek');
    if(s === 'her'){ cast.part(pair); cast.beat(her, 'nod'); pulse('her', 300) }
    if(s === 'his'){ cast.beat(him, 'nod'); pulse('him') }
    if(s === 'talk'){
      cast.glance(pair, true); cast.beat(her, 'nod'); later.push(setTimeout(function(){ cast.beat(him, 'nod') }, 600));
      // a turn on the stool is a quick swivel with a little hop (Mel, 31 Oct, round 2: "the match done properly"):
      // he looks over at her for a moment, and back to his phone
      if(him && pair.classList.contains('home-figs')){
        later.push(setTimeout(function(){ cast.hop(him); him.classList.add('peek') }, 900));
        later.push(setTimeout(function(){ cast.hop(him); him.classList.remove('peek') }, 2100));
      }
    }
    if(s === 'match') cast.meet(pair, true);
  }
  if(hero && 'MutationObserver' in window) new MutationObserver(sync).observe(hero, {attributes:true, attributeFilter:['data-scene']});
  // the first scene is set before anyone can see it; their first visible beat is the entrance below
  last = hero ? hero.dataset.scene : '';

  // The first time the two of them come into view they settle onto their stools, her phone lights and she nods, on a
  // phone as on a laptop (Mel, 31 Oct); on touch screens, where nothing hovers, who is who shows once. It watches her,
  // not the pair: on laptops the pair has no box of its own, so until 2 November the entrance never played there. On the
  // landing page it waits for the line's three bands, so the first screen moves in one order: the logo line, the
  // bands, then the two of them.
  var touch = matchMedia('(hover: none)').matches, wait = document.querySelector('.cap.dia') ? 2300 : 700;
  if(!cast.still && her && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      if(!es.some(function(e){ return e.isIntersecting })) return;
      io.disconnect();
      [her, him].forEach(function(f, i){ if(f) setTimeout(function(){ cast.beat(f, 'settle') }, wait + i * 160) });
      pulse('her', wait + 800); setTimeout(function(){ cast.beat(her, 'nod') }, wait + 1050);
      if(touch && pair.classList.contains('home-figs')) setTimeout(function(){ pair.classList.add('tell'); setTimeout(function(){ pair.classList.remove('tell') }, 2600) }, wait + 200);
    }, {threshold: .6});
    io.observe(her);
  }

  // Mel, 31 Oct: "when user hovers over have stuff or have space on the landing page, the characters should respond
  // intelligently in line with how they behave". The one a button speaks for perks up: a small lift, their phone lights,
  // a nod, and their label shows; the other one carries on. Keyboard focus does the same; on a touch screen the tap that
  // opens the page does it for a moment. Each half of the line wakes its own one the same way, without the nod (2 Nov).
  function wake(el, who, by, nods){
    if(!el || !who) return;
    var which = who === her ? 'her' : 'him', t = null;
    function on(){ var was = who.classList.contains('perk'); cast.notice(who, true, by); if(was) return; pulse(which); if(nods){ clearTimeout(t); t = setTimeout(function(){ cast.beat(who, 'nod') }, 220) } }
    function off(){ clearTimeout(t); cast.notice(who, false, by) }
    el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off);
    el.addEventListener('focus', function(){ if(el.matches(':focus-visible')) on() }); el.addEventListener('blur', off);
    el.addEventListener('touchstart', function(){ on(); if(!nods) setTimeout(off, 1400) }, {passive:true});
  }
  document.querySelectorAll('.hero .words .way').forEach(function(btn){
    var href = btn.getAttribute('href') || '';
    wake(btn, /companies/.test(href) ? her : /warehouses/.test(href) ? him : null, 'button', true);
  });
  wake(document.querySelector('.cap.dia .d1'), her, 'line', false);
  wake(document.querySelector('.cap.dia .d2'), him, 'line', false);
  // coming back to the page with the browser's Back button finds them at rest
  addEventListener('pageshow', function(){ cast.quiet(her); cast.quiet(him) });
})();
