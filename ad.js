// The Prism banner rises in as it comes into view, then one app screen fades into the next.
// It pauses while the pointer is over it and while the tab is hidden.
(function(){
  var ad = document.querySelector('.ad'); if(!ad) return;
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var shots = Array.prototype.slice.call(ad.querySelectorAll('.ad-shots > li')), cur = 0, timer = null, hover = false;
  function show(i){ cur = i; shots.forEach(function(li, k){ li.classList.toggle('on', k === i) }) }
  if(shots.length) show(0);
  function start(){ if(still || timer || shots.length < 2) return; timer = setInterval(function(){ if(!hover && !document.hidden) show((cur + 1) % shots.length) }, 3600) }
  ad.addEventListener('pointerenter', function(){ hover = true }); ad.addEventListener('pointerleave', function(){ hover = false });
  function check(){ if(ad.classList.contains('in')) return; if(ad.getBoundingClientRect().top < innerHeight * 0.92){ ad.classList.add('in'); start() } }
  if(still){ ad.classList.add('in'); return }
  addEventListener('scroll', check, {passive:true}); addEventListener('resize', check); check();
})();

// The departures board: one line turns over through markets, goods, dry and cold.
// The app screen follows it: the warehouse card's name and the Place rows match the board.
(function(){
  var board = document.querySelector('.ad-board'); if(!board) return;
  var ad = board.closest('.ad') || board.parentNode; if(!ad.closest('.ad')) ad.classList.add('in');
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var ROLL = [
    ['Frozen seafood','Atlanta','Frozen'], ['Craft beverages','Dallas','Dry'], ['Fresh produce','the Inland Empire','Cold'],
    ['Electronics','Phoenix','Dry'], ['Dairy','Chicago','Cold'], ['Furniture','Charlotte','Dry'],
    ['Medicine','Memphis','Cold'], ['Ice cream','Columbus','Frozen'], ['Apparel','the Lehigh Valley','Dry'],
    ['Auto parts','Detroit','Dry'], ['Hot sauce','Houston','Dry'], ['Plant-based meals','Salt Lake City','Frozen']
  ];
  var win = board.querySelector('.ab-win'), tag = board.querySelector('.ab-t'), i = 0, hover = false;
  function place(m){ return m.replace(/^the /,'').replace(/^./, function(c){ return c.toUpperCase() }) }
  function paint(r){
    ad.querySelectorAll('[data-roll="title"]').forEach(function(e){ e.textContent = r[2] + ' space · ' + place(r[1]) });
    ad.querySelectorAll('[data-roll="place"]').forEach(function(e){ e.textContent = place(r[1]) });
  }
  function turn(){
    i = (i + 1) % ROLL.length; var r = ROLL[i];
    var next = document.createElement('span'); next.className = 'ab-line in';
    next.innerHTML = '<b class="ab-what">' + r[0] + '</b> in <b class="ab-where">' + r[1] + '</b>';
    var cur = win.querySelector('.ab-line:not(.out)'); if(cur) cur.classList.add('out');
    win.appendChild(next); void next.offsetWidth; next.classList.remove('in');
    setTimeout(function(){ if(cur && cur.parentNode) cur.parentNode.removeChild(cur) }, 600);
    tag.classList.add('flip'); setTimeout(function(){ tag.textContent = r[2]; tag.dataset.t = r[2].toLowerCase(); tag.classList.remove('flip') }, 180);
    paint(r);
  }
  tag.dataset.t = 'frozen'; paint(ROLL[0]);
  ad.addEventListener('pointerenter', function(){ hover = true }); ad.addEventListener('pointerleave', function(){ hover = false });
  if(!still) setInterval(function(){ if(!hover && !document.hidden && ad.classList.contains('in')) turn() }, 2400);
})();
