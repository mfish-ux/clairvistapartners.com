// The two of them on the landing page: back to back under the two buttons, both in full ink.
// Hover shows who they are; click or drag-and-let-go goes to that side's page, where their bubble opens
// (the page transition carries them across). They follow the story on the phone, quietly:
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
    function go(){ count('home-figure-to-' + o.dataset.go.replace('.html','')); location.href = o.dataset.go + (from ? '?from=' + encodeURIComponent(from) : '') }
    o.addEventListener('pointerdown', function(e){ if(e.button !== 0) return; e.preventDefault(); d = {x:e.clientX, y:e.clientY, far:0}; o.setPointerCapture(e.pointerId); o.classList.add('held') });
    o.addEventListener('pointermove', function(e){ if(!d) return; var dx = e.clientX - d.x, dy = e.clientY - d.y; d.far = Math.max(d.far, Math.abs(dx) + Math.abs(dy)); o.style.transform = 'translate(' + Math.max(-140, Math.min(140, dx * .55)) + 'px,' + Math.max(-80, Math.min(80, dy * .55)) + 'px) rotate(' + Math.max(-12, Math.min(12, dx / 14)) + 'deg)' });
    o.addEventListener('pointerup', function(){ if(!d) return; var far = d.far; d = null; o.classList.remove('held'); if(far > 24 && window.cvpSwap) cvpSwap(o); else { o.style.transform = ''; go() } });
    o.addEventListener('pointercancel', function(){ d = null; o.classList.remove('held'); o.style.transform = '' });
    o.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go() } });
  });

  // follow the story on the phone
  var hero = document.getElementById('hero'), her = pair.querySelector('.her'), him = pair.querySelector('.him');
  function nod(el){ if(!el) return; el.classList.remove('nod'); void el.offsetWidth; el.classList.add('nod') }
  var last = '';
  function sync(){
    var s = hero ? hero.dataset.scene : ''; if(s === last) return; last = s;
    if(s === 'her') { pair.classList.remove('met', 'glance'); nod(her) }
    if(s === 'his') nod(him);
    if(s === 'talk') { pair.classList.add('glance'); nod(her); setTimeout(function(){ nod(him) }, 600) }
    if(s === 'match') pair.classList.add('glance', 'met');
  }
  if(hero && 'MutationObserver' in window) new MutationObserver(sync).observe(hero, {attributes:true, attributeFilter:['data-scene']});
  sync();
})();
