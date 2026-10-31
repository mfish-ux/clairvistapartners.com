// The two of them on the landing page: back to back under the two buttons, both in full ink.
// Hover shows who they are. Click picks them (shaded darker) and goes to that side's page, where their bubble
// opens (the page transition carries them across); drag and let go picks them and opens the leaflet for their side. They follow the story on the phone, quietly:
// a nod on each one's turn, face to face with a small heart at the match, back to back for the next market.
(function(){
  var pair = document.querySelector('.home-figs, .pair-figs'); if(!pair) return;
  var from = new URLSearchParams(location.search).get('from');
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  var heart = document.createElement('span'); heart.className = 'pair-heart'; heart.setAttribute('aria-hidden','true');
  heart.innerHTML = '<svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.4-5.5-7.2A3 3 0 0 1 8 5a3 3 0 0 1 5.5 1.8C13.5 10.6 8 14 8 14z" fill="#0047FF"/></svg>';
  pair.appendChild(heart);

  pair.querySelectorAll('.s-fig').forEach(function(o){
    o.setAttribute('role','link'); o.tabIndex = 0; o.setAttribute('aria-label', o.dataset.say + '. Go to that page.');
    o.classList.add('alive');
    var tip = document.createElement('span'); tip.className = 'side-tag'; tip.setAttribute('aria-hidden','true');
    tip.innerHTML = o.dataset.say + ' <i>→</i>'; o.appendChild(tip);
    var d = null;
    function go(){ if(window.cvpPick) cvpPick(o); setTimeout(function(){ count('home-figure-to-' + o.dataset.go.replace('.html','')); location.href = o.dataset.go + (from ? '?from=' + encodeURIComponent(from) : '') }, 220) }
    o.addEventListener('pointerdown', function(e){ if(e.button !== 0) return; e.preventDefault(); d = {x:e.clientX, y:e.clientY, far:0, t:Date.now()}; o.setPointerCapture(e.pointerId); o.classList.add('held') });
    o.addEventListener('pointermove', function(e){ if(d && window.cvpCarry) cvpCarry(o, d, e) });
    o.addEventListener('pointerup', function(){ if(!d) return; var info = d; d = null; o.classList.remove('held'); if(info.far > 24 && window.cvpDrop) cvpDrop(o, info); else { o.style.transform = ''; go() } });
    o.addEventListener('pointercancel', function(){ d = null; o.classList.remove('held'); o.style.transform = '' });
    o.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go() } });
  });

  // follow the story on the phone
  var hero = document.getElementById('hero'), her = pair.querySelector('.her'), him = pair.querySelector('.him');
  function nod(el){ if(!el) return; el.classList.remove('nod'); void el.offsetWidth; el.classList.add('nod') }
  // a turn on the stool is a quick swivel with a little hop (Mel, 31 Oct, round 2: "the match done properly")
  function hop(el){ if(!el) return; el.classList.add('hop'); setTimeout(function(){ el.classList.remove('hop') }, 140) }
  var last = '';
  function sync(){
    var s = hero ? hero.dataset.scene : ''; if(s === last) return; last = s;
    if(s === 'her') { if(pair.classList.contains('met')){ hop(her); hop(him) } pair.classList.remove('met', 'glance'); nod(her) }
    if(s === 'his') nod(him);
    if(s === 'talk') { pair.classList.add('glance'); nod(her); setTimeout(function(){ nod(him) }, 600);
      // he looks over at her for a moment, and back to his phone
      if(him && pair.classList.contains('home-figs')){ setTimeout(function(){ hop(him); him.classList.add('peek') }, 900);
        setTimeout(function(){ hop(him); him.classList.remove('peek') }, 2100) } }
    if(s === 'match'){ hop(her); hop(him); pair.classList.add('glance', 'met') }
  }
  if(hero && 'MutationObserver' in window) new MutationObserver(sync).observe(hero, {attributes:true, attributeFilter:['data-scene']});
  // the first scene is set before anyone can see it; their first visible beat is the entrance below
  last = hero ? hero.dataset.scene : '';

  // Mel, 31 Oct ("make sure mobile animation works the same as desktop"): the first time the two of them come into view,
  // they settle onto their stools, her phone lights and she nods, on a phone as on a laptop. On touch screens, where
  // nothing hovers, who is who shows once, both at the same time.
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches, touch = matchMedia('(hover: none)').matches;
  if(!still && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      if(!es.some(function(e){ return e.isIntersecting })) return;
      io.disconnect();
      [her, him].forEach(function(f, i){ if(!f) return;
        setTimeout(function(){ f.classList.add('settle'); setTimeout(function(){ f.classList.remove('settle') }, 700) }, 700 + i * 160) });
      setTimeout(function(){ if(window.cvpPhonePulse) cvpPhonePulse('her'); setTimeout(function(){ nod(her) }, 250) }, 1500);
      if(touch && pair.classList.contains('home-figs')) setTimeout(function(){ pair.classList.add('tell'); setTimeout(function(){ pair.classList.remove('tell') }, 2600) }, 900);
    }, {threshold: .6});
    io.observe(pair);
  }

  // Mel, 31 Oct: "when user hovers over have stuff or have space on the landing page, the characters should respond
  // intelligently in line with how they behave". The one a button speaks for perks up: a small lift, their phone lights,
  // a nod, and their label shows. The other one carries on as before. Keyboard focus does the same; on a touch screen the
  // tap that opens the page does it for a moment.
  document.querySelectorAll('.hero .words .way').forEach(function(btn){
    var href = btn.getAttribute('href') || '', who = /companies/.test(href) ? her : /warehouses/.test(href) ? him : null;
    if(!who) return;
    var which = who === her ? 'her' : 'him', nodT = null;
    function on(){
      if(who.classList.contains('perk')) return;
      who.classList.add('perk');
      if(window.cvpPhonePulse) cvpPhonePulse(which);
      clearTimeout(nodT); nodT = setTimeout(function(){ nod(who) }, 220);
    }
    function off(){ clearTimeout(nodT); who.classList.remove('perk') }
    btn.addEventListener('mouseenter', on); btn.addEventListener('mouseleave', off);
    btn.addEventListener('focus', function(){ if(btn.matches(':focus-visible')) on() }); btn.addEventListener('blur', off);
    btn.addEventListener('touchstart', on, {passive:true});
  });
  // coming back to the page with the browser's Back button finds them at rest
  addEventListener('pageshow', function(){ [her, him].forEach(function(f){ if(f) f.classList.remove('perk') }) });
})();
