// The two of them, one owner. Every script that moves her or him asks this file, so nothing fights over what they are
// doing (Mel, 2 November, the plan for the first screen: "The two characters do one coherent thing, written down in
// one place"). Load it before life.js, pair.js and buddy.js.
//
// Each character has:
// - one beat at a time in the drawing (a nod or a settle): a new beat replaces the one playing, and only its own timer
//   ends it; a hop (the little swivel on the stool) plays alongside
// - noticed: lifted with its label showing while anything notices it (a button, a half of the line); it drops only when
//   the last one lets go
// - held: carried by the pointer; no beats and no breathing while held
// - picked: shaded darker, the other paler (Mel, 30 October)
// The pair can glance (the other one turns) and meet (face to face, a small heart).
(function(){
  var DRAWING = {nod:350, settle:700}, still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var playing = new WeakMap(), hops = new WeakMap(), noticers = new WeakMap(), parting = new WeakMap();
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  function fig(x){ return typeof x === 'string' ? document.querySelector('.s-fig.' + x) : x }
  function pairOf(f){ return f && f.parentNode && f.parentNode.classList && f.parentNode.classList.contains('s-figs') ? f.parentNode : null }

  var cast = {
    // a nod or a settle in the drawing; 'flying' rides along with a settle when they spring back from a drop
    beat: function(x, kind, flying){
      var f = fig(x); if(!f || f.classList.contains('held')) return;
      var p = playing.get(f); if(p){ clearTimeout(p.t); f.classList.remove(p.kind, 'flying') }
      void f.offsetWidth; f.classList.add(kind); if(flying) f.classList.add('flying');
      playing.set(f, {kind:kind, t:setTimeout(function(){ f.classList.remove(kind, 'flying'); playing.delete(f) }, DRAWING[kind])});
    },
    hop: function(x){
      var f = fig(x); if(!f || f.classList.contains('held')) return;
      clearTimeout(hops.get(f)); f.classList.add('hop');
      hops.set(f, setTimeout(function(){ f.classList.remove('hop') }, 140));
    },
    // busy: held or in the middle of a beat, so idle life (a weight shift) waits
    busy: function(x){ var f = fig(x); return !f || f.classList.contains('held') || playing.has(f) },
    notice: function(x, on, by){
      var f = fig(x); if(!f) return;
      var s = noticers.get(f); if(!s){ s = {}; noticers.set(f, s) }
      if(on) s[by] = 1; else delete s[by];
      f.classList.toggle('perk', Object.keys(s).length > 0);
    },
    quiet: function(x){ var f = fig(x); if(!f) return; noticers.delete(f); f.classList.remove('perk') },
    hold: function(x, on){
      var f = fig(x); if(!f) return;
      if(on){ var p = playing.get(f); if(p){ clearTimeout(p.t); f.classList.remove(p.kind, 'flying'); playing.delete(f) } }
      f.classList.toggle('held', !!on);
    },
    pick: function(x){
      var f = fig(x), p = pairOf(f); if(!p) return;
      Array.prototype.forEach.call(p.children, function(c){ if(c.classList.contains('s-fig')) c.classList.toggle('picked', c === f) });
      p.classList.add('has-pick');
    },
    unpick: function(p){
      if(!p) return; p.classList.remove('has-pick');
      Array.prototype.forEach.call(p.children, function(c){ c.classList.remove('picked') });
    },
    glance: function(p, on){ if(p) p.classList.toggle('glance', !!on) },
    // face to face, a hop each, both phones light, the heart. With `stay` they keep facing; otherwise they turn back
    // after a few seconds, unless the phone's story is at its own match
    meet: function(p, stay){
      if(!p) return; cast.heart(p);
      var her = p.querySelector('.s-fig.her'), him = p.querySelector('.s-fig.him');
      if(!p.classList.contains('met')){ cast.hop(her); cast.hop(him) }
      p.classList.add('glance', 'met');
      setTimeout(function(){ if(window.cvpPhonePulse){ cvpPhonePulse('her'); cvpPhonePulse('him') } }, 300);
      clearTimeout(parting.get(p));
      if(!stay) parting.set(p, setTimeout(function(){
        var hero = document.getElementById('hero'); if(hero && hero.dataset.scene === 'match') return;
        cast.part(p);
      }, 5000));
    },
    part: function(p){
      if(!p) return; clearTimeout(parting.get(p));
      if(p.classList.contains('met')){ cast.hop(p.querySelector('.s-fig.her')); cast.hop(p.querySelector('.s-fig.him')) }
      p.classList.remove('met', 'glance');
    },
    heart: function(p){
      if(!p || p.querySelector('.pair-heart')) return;
      var h = document.createElement('span'); h.className = 'pair-heart'; h.setAttribute('aria-hidden', 'true');
      h.innerHTML = '<svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.4-5.5-7.2A3 3 0 0 1 8 5a3 3 0 0 1 5.5 1.8C13.5 10.6 8 14 8 14z" fill="#0047FF"/></svg>';
      p.appendChild(h);
    },
    // a character that leads to its own page: its label, tap or Enter to go, carry it anywhere and let go
    link: function(o, countAs){
      if(!o || o.dataset.cast) return; o.dataset.cast = 'link';
      var from = new URLSearchParams(location.search).get('from');
      o.setAttribute('role', 'link'); o.tabIndex = 0; o.setAttribute('aria-label', o.dataset.say + '. Go to that page.');
      o.classList.add('alive');
      var tip = document.createElement('span'); tip.className = 'side-tag'; tip.setAttribute('aria-hidden', 'true');
      tip.innerHTML = o.dataset.say + ' <i>→</i>'; o.appendChild(tip);
      var d = null;
      function go(){ cast.pick(o); setTimeout(function(){ count(countAs + o.dataset.go.replace(/^\//, '').replace('.html', '')); location.href = o.dataset.go + (from ? '?from=' + encodeURIComponent(from) : '') }, 220) }
      o.addEventListener('pointerdown', function(e){ if(e.button !== 0) return; e.preventDefault(); d = {x:e.clientX, y:e.clientY, far:0, t:Date.now()}; o.setPointerCapture(e.pointerId); cast.hold(o, true) });
      o.addEventListener('pointermove', function(e){ if(d && window.cvpCarry) cvpCarry(o, d, e) });
      o.addEventListener('pointerup', function(){ if(!d) return; var info = d; d = null; cast.hold(o, false); if(info.far > 24 && window.cvpDrop) cvpDrop(o, info); else { o.style.transform = ''; go() } });
      o.addEventListener('pointercancel', function(){ d = null; cast.hold(o, false); o.style.transform = '' });
      o.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go() } });
    },
    still: still
  };
  window.cvpCast = cast;
  window.cvpPick = cast.pick;
})();
