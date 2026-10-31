// Small signs of life for the two of them, on every page they appear. They react to the world;
// they never stare at the visitor. Off for reduced motion, paused while the tab is hidden.
// - each breathes on its own slow rhythm, never in step with the other
// - now and then one shifts its weight on the stool
// - near the pointer they lean a degree or two toward it, slowly, like half-noticing someone walk up
// - their phone lights up when something happens to them
// The two of them keep their places, her on the left and him on the right (Mel, 30 October). Whoever the
// visitor clicks or drags is picked: shaded darker, the other one paler (Mel, 30 October).
window.cvpPick = function(fig){
  var p = fig && fig.parentNode; if(!p) return;
  Array.prototype.forEach.call(p.children, function(c){ if(c.classList.contains('s-fig')) c.classList.toggle('picked', c === fig) });
  p.classList.add('has-pick');
};
// Drag one and let go: they spring back to their own stool, picked, and the leaflet opens for their side.
window.cvpDrop = function(fig){
  var party = fig.classList.contains('him') ? 'I have space' : fig.classList.contains('her') ? 'I have stuff' : '';
  cvpPick(fig);
  fig.classList.add('settle'); fig.style.transform = '';
  setTimeout(function(){ fig.classList.remove('settle') }, 700);
  try{ window.goatcounter && goatcounter.count({path:'figure-dragged-' + (party === 'I have space' ? 'space' : 'stuff'), title:'figure dragged', event:true}) }catch(e){}
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  setTimeout(function(){ if(window.cvpLeaflet) cvpLeaflet(fig, party) }, still ? 60 : 420);
  return true;
};
(function(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var figs = Array.prototype.slice.call(document.querySelectorAll('.s-fig'));
  if(!figs.length) return;
  // where each phone is in the drawing, as a share of the unflipped picture
  var PHONE = {her:[0.66, 0.34], him:[0.62, 0.40]};

  figs.forEach(function(f, i){
    var img = f.querySelector('img'); if(!img) return;
    f.style.setProperty('--breath', (4.1 + Math.random() * 1.3).toFixed(2) + 's');
    f.style.setProperty('--breath-delay', (-Math.random() * 4).toFixed(2) + 's');
    f.classList.add('lives');
    var glow = document.createElement('span'); glow.className = 'phone-glow'; glow.setAttribute('aria-hidden','true'); f.appendChild(glow);
  });

  function flipped(img){ var s = getComputedStyle(img).scale; return s && s.trim().indexOf('-1') === 0 }
  function place(f){
    var img = f.querySelector('img'), glow = f.querySelector('.phone-glow'); if(!img || !glow) return;
    var p = PHONE[f.classList.contains('her') ? 'her' : 'him'];
    var x = flipped(img) ? 1 - p[0] : p[0];
    glow.style.left = (img.offsetLeft + img.offsetWidth * x) + 'px';
    glow.style.top = (img.offsetTop + img.offsetHeight * p[1]) + 'px';
  }
  function pulse(f){
    if(!f || document.hidden) return; place(f);
    var g = f.querySelector('.phone-glow'); g.classList.remove('on'); void g.offsetWidth; g.classList.add('on');
  }
  window.cvpPhonePulse = function(which){ figs.forEach(function(f){ if(f.classList.contains(which)) pulse(f) }) };

  // weight shifts, at random, one at a time
  (function shift(){
    setTimeout(function(){
      if(!document.hidden){
        var f = figs[Math.floor(Math.random() * figs.length)], img = f && f.querySelector('img');
        if(img && !f.classList.contains('held')){ img.classList.remove('shift'); void img.offsetWidth; img.classList.add('shift') }
      }
      shift();
    }, 7000 + Math.random() * 7000);
  })();

  // a slow lean toward the pointer when it comes near
  var raf = null, px = -1e4, py = -1e4;
  addEventListener('pointermove', function(e){ px = e.clientX; py = e.clientY; if(!raf) raf = requestAnimationFrame(lean) }, {passive:true});
  function lean(){
    raf = null;
    figs.forEach(function(f){
      var img = f.querySelector('img'); if(!img || f.classList.contains('held')) return;
      var r = f.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;  // the still figure, not the tilting drawing
      var dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy), reach = 240;
      var a = d < reach ? (dx / reach) * 2.2 * (1 - d / reach * 0.5) : 0;
      if(flipped(img)) a = -a;
      img.style.setProperty('--lean', a.toFixed(2) + 'deg');
    });
  }

  // when something happens to them, their phone lights up
  var hero = document.getElementById('hero');
  if(hero && 'MutationObserver' in window){
    var last = '';
    new MutationObserver(function(){
      var s = hero.dataset.scene; if(s === last) return; last = s;
      if(s === 'her') pulse(figs.filter(function(f){ return f.classList.contains('her') })[0]);
      if(s === 'his') pulse(figs.filter(function(f){ return f.classList.contains('him') })[0]);
      if(s === 'match') figs.forEach(pulse);
    }).observe(hero, {attributes:true, attributeFilter:['data-scene']});
  }
  var other = document.querySelector('.s-fig.other');
  document.addEventListener('input', function(e){ if(e.target.classList && e.target.classList.contains('ck-in') && e.target.value.trim().length === 1) pulse(other) });
  document.addEventListener('cvp-sent', function(){ figs.forEach(pulse) });
})();
