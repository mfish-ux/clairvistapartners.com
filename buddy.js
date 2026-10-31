// The character beside the headline comes alive when touched: pick her up, let go, and she turns to you.
// A speech bubble grows from her: say what you need in your own words, or tap a starter.
// She reads it with simple rules on the page (no server, nothing sent), says what she heard,
// and offers to put it on the checklist below, or to send it.
(function(){
  var fig = document.querySelector('.s-fig.me') || document.querySelector('.s-fig'), top = document.querySelector('.s-top');
  if(!fig || !top) return;
  var side = document.body.dataset.side || 'stuff';
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  function esc(s){ return String(s||'').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }

  var COPY = side === 'space' ? {
      hi: "Showing off your building shouldn't be hard.", ask: "Pick whichever is easiest.",
      ways: ["Fill in the six facts", "Describe it", "Paste a listing", "Upload a spec sheet"],
      close: "We&rsquo;ll take it from there.",
      fine: 'The finding and the introductions are on us. The walkthrough is your stage.',
      upload: true,
      ph: "Space · Doors · Height · Where · When&#10;e.g. 120k sq ft, 12 doors, 32 ft, near the interstate, January", phPaste: "Paste the listing or email here...",
      starts: ["120,000 square feet, 32 foot clear, near I-78", "Half the building is free from January", "Cold storage, 12 dock doors, gated"],
      who: "him"
    } : {
      hi: "Getting your stuff into a warehouse shouldn't be hard.", ask: "Pick whichever is easiest.",
      ways: ["Fill in the checklist", "Say it in your own words", "Paste an email", "Upload a file"],
      close: "We&rsquo;ll take it from there.",
      fine: 'The finding, the introductions and the walkthrough are on us. Signing the lease is still all you.',
      upload: true,
      ph: "What · How much · Where · When&#10;e.g. 900 pallets of hot sauce, Chicago, by March", phPaste: "Paste the email here...",
      starts: ["Cold storage near Chicago by spring", "Space for 900 pallets for the holidays", "We just landed a big retailer"],
      who: "her"
    };

  // ---- what she can pick out of plain words ----
  var MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec';
  function cap(s){ return s.replace(/\s+/g,' ').trim().replace(/^./, function(c){ return c.toUpperCase() }) }
  function grab(t, re, f){ var m = t.match(re); return m ? (f ? f(m) : m[0]) : '' }
  function readStuff(t){
    var l = t.toLowerCase(), out = {};
    // what it is: "pallets of hot sauce", "cases of olive oil"; temperature only if they say it
    var what = grab(t, /\b(?:pallets?|cases?|boxes|cartons|skids|containers?|units?)\s+of\s+((?:[a-z][\w'-]*)(?:\s+(?!near\b|in\b|by\b|from\b|for\b|at\b|around\b|and\b)[a-z][\w'-]*){0,2})/i, function(m){ return cap(m[1]) });
    var temp = /frozen|freezer/.test(l) ? 'Frozen' : /cold|refrigerat|chill/.test(l) ? 'Cold' : '';
    out.store = [what, temp && what ? temp.toLowerCase() : temp].filter(Boolean).join(', ');
    // how much: the number and its unit, nothing after it
    out.much = grab(t, /(\d[\d,.]*\s*(k\b)?\s*(pallets?|pallet positions|square feet|sq\.? ?ft|sf|cases|boxes|cartons|skids|containers)\b)/i, function(m){ return m[1].replace(/\s+/g,' ').trim() });
    out.when = grab(l, new RegExp('\\b(by|from|starting|before|in|for)\\s+(the\\s+)?((' + MONTHS + ')(\\s+\\d{1,2})?|spring|summer|fall|autumn|winter|the holidays|holidays|next month|next quarter|q[1-4]|\\d+\\s+(weeks?|months?))', 'i'), function(m){ return cap(m[0]).replace(new RegExp('\\b(' + MONTHS + ')\\b', 'g'), function(x){ return x.charAt(0).toUpperCase() + x.slice(1) }) })
             || (/holiday/.test(l) ? 'For the holidays' : /\bnext (month|week|quarter)\b/.test(l) ? cap(l.match(/\bnext (month|week|quarter)\b/)[0]) : /asap|right away|urgent/.test(l) ? 'As soon as possible' : '');
    out.where = grab(t, /\b(?:near|in|around|outside|close to)\s+((?:[A-Z][\w.'-]*\s?){1,3}(?:,\s?[A-Z]{2})?)/, function(m){ return m[1].trim() });
    if(out.where && new RegExp('^(' + MONTHS + '|spring|summer|fall|winter)', 'i').test(out.where)) out.where = '';
    out.moves = grab(t, /(\d[\d,]*\s*(orders?|trucks?|shipments?|containers?)[^,.;]*)/i, function(m){ return cap(m[1]) });
    var extra = (l.match(/labell?ing|returns|pick and pack|packing|kitting|cross.?dock/g) || []);
    out.else = extra.length ? cap(Array.from(new Set(extra)).join(', ')) : '';
    return out;
  }
  function readSpace(t){
    var l = t.toLowerCase(), out = {};
    out.doors = grab(l, /(\d+)\s*(dock\s*)?doors?/, function(m){ return m[1] + ' dock doors' });
    out.height = grab(l, /(\d{2})\s*(foot|feet|ft|')\s*(clear|ceilings?|high)?/, function(m){ return m[1] + ' feet clear' });
    out.highway = grab(t, /\b(?:near|off|by|close to|minutes? (?:to|from))\s+((?:I|Interstate|Route|US|Hwy)[\s-]?\d+|the (?:highway|interstate))/i, function(m){ return 'Near ' + m[1] })
                  || grab(t, /\b(I-\d+)\b/, function(m){ return 'Near ' + m[1] });
    out.court = /truck court|trailer|yard/.test(l) ? cap(grab(t, /[^,.;]*(truck court|trailer|yard)[^,.;]*/i)) : '';
    out.lights = /led|esfr|sprinkler/.test(l) ? cap(grab(t, /[^,.;]*(led|esfr|sprinkler)[^,.;]*/i)) : '';
    out.security = /gated|fenced|guard|camera|secure/.test(l) ? cap((l.match(/gated|fenced|guarded|guard|cameras?|secure/g) || []).join(', ')) : '';
    return out;
  }
  var LABELS = {store:'What you store', much:'How much', when:'When', where:'Where', moves:'How it moves', else:'What else',
                doors:'Dock doors', court:'Truck court', height:'Clear height', lights:'Lights and sprinklers', highway:'Highway access', security:'Security'};
  // the same reading, for the panel at the end of the page (intake.js)
  window.cvpRead = function(t){ return side === 'space' ? readSpace(t) : readStuff(t) };
  window.cvpCopy = COPY;

  // ---- the character ----
  fig.setAttribute('role','button'); fig.tabIndex = 0;
  fig.setAttribute('aria-label', side === 'space' ? 'Tell us about your building' : 'Tell us what you need');
  fig.setAttribute('aria-haspopup','dialog'); fig.setAttribute('aria-expanded','false');
  fig.classList.add('alive');
  // the same tag as the other one: who they are, above their head on hover
  var myTag = document.createElement('span'); myTag.className = 'side-tag'; myTag.setAttribute('aria-hidden','true');
  myTag.textContent = side === 'space' ? 'I have space' : 'I have stuff'; fig.appendChild(myTag);

  var bub = document.createElement('div'); bub.className = 'buddy'; bub.setAttribute('role','dialog'); bub.setAttribute('aria-label', COPY.hi + ' ' + COPY.ask); bub.hidden = true;
  top.appendChild(bub);
  var open = false;

  function render(){
    var IC = [
      '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="5" width="18" height="23" rx="2.5" fill="none" stroke="#0A0B10" stroke-width="2"/><path d="M11 12l2 2 3.5-3.5M11 19l2 2 3.5-3.5" fill="none" stroke="#0047FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 13h3M19 20h3" stroke="#0A0B10" stroke-width="2" stroke-linecap="round"/></svg>',
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 8.5A3.5 3.5 0 0 1 9.5 5h13A3.5 3.5 0 0 1 26 8.5v9a3.5 3.5 0 0 1-3.5 3.5H14l-6 5v-5.2A3.5 3.5 0 0 1 6 17.5z" fill="none" stroke="#0A0B10" stroke-width="2" stroke-linejoin="round"/><path d="M11 11.5h10M11 15.5h6" stroke="#0047FF" stroke-width="2" stroke-linecap="round"/></svg>',
      '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="8" width="22" height="16" rx="2.5" fill="none" stroke="#0A0B10" stroke-width="2"/><path d="M6 9.5l10 7.5 10-7.5" fill="none" stroke="#0047FF" stroke-width="2" stroke-linejoin="round"/></svg>',
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h10l6 6v15.5A1.5 1.5 0 0 1 23.5 28h-14A1.5 1.5 0 0 1 8 26.5V6.5A1.5 1.5 0 0 1 9 5z" fill="none" stroke="#0A0B10" stroke-width="2" stroke-linejoin="round"/><path d="M16 23v-9M12.5 17.5L16 14l3.5 3.5" fill="none" stroke="#0047FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'];
    var KEYS = ['list','words','paste','upload'];
    bub.innerHTML = '<button class="lf-x" type="button" aria-label="Close">&times;</button>' +
      '<p class="b-say">' + COPY.hi + ' <b>' + COPY.ask + '</b></p>' +
      '<div class="b-ways">' + COPY.ways.map(function(w, i){ return '<button type="button" class="b-way" data-way="' + KEYS[i] + '">' + IC[i] + '<span>' + w + '</span></button>' }).join('') + '</div>' +
      '<p class="b-close"><b>Or tell us in your own words.</b></p>' +
      '<form class="b-form" novalidate><textarea rows="3" name="t" placeholder="' + COPY.ph + '" aria-label="' + COPY.ask + '"></textarea>' +
      (COPY.upload ? '<input type="file" class="b-file" accept=".txt,.csv,.eml,.md,.rtf,.pdf,.doc,.docx,text/*" hidden><p class="b-filed" aria-live="polite"></p>' : '') +
      '<div class="b-go"><span class="b-help">We sort your words into the checklist. <b>A fuller one gets you to a walkthrough faster.</b></span><button class="way primary in-btn" type="submit">Fill my checklist <i>→</i></button></div></form>';
    bub.querySelector('.lf-x').onclick = close;
    var ta = bub.querySelector('textarea');
    bub.querySelectorAll('.b-start').forEach(function(b){ b.onclick = function(){ ta.value = b.textContent; ta.focus(); count('buddy-starter-' + side) } });
    var file = bub.querySelector('.b-file'), filed = bub.querySelector('.b-filed');
    function pick(k){ bub.querySelectorAll('.b-way').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.way === k) }) }
    bub.querySelectorAll('.b-way').forEach(function(b){ b.onclick = function(){
      var k = b.dataset.way; count('buddy-way-' + k + '-' + side);
      if(k === 'list'){ close(); var g = document.querySelector('.s-guide'); if(g) g.scrollIntoView({behavior: still ? 'auto' : 'smooth', block:'start'}); return }
      pick(k);
      if(k === 'words'){ ta.placeholder = COPY.ph.replace(/&#10;/g, String.fromCharCode(10)); ta.focus() }
      if(k === 'paste'){ ta.placeholder = COPY.phPaste; ta.rows = 6; ta.focus() }
      if(k === 'upload' && file) file.click();
    } });
    if(file){
      file.onchange = function(){
        var f = file.files && file.files[0]; if(!f) return;
        count('buddy-upload-' + side);
        if(/^text\/|\.(txt|csv|eml|md|rtf)$/i.test(f.type + ' ' + f.name) && f.size < 400000){
          var r = new FileReader();
          r.onload = function(){ ta.value = (ta.value ? ta.value + '\n\n' : '') + String(r.result).slice(0, 6000); filed.textContent = 'Read ' + f.name + '. Here it is; press Fill my checklist when ready.'; ta.focus() };
          r.readAsText(f);
        } else {
          window.cvpAttach = f.name;
          filed.textContent = 'Got ' + f.name + '. It can’t be read here, so attach it when your email opens. Add a line about what you need, then press Fill my checklist.';
        }
      };
    }
    bub.querySelector('form').onsubmit = function(e){ e.preventDefault(); if(!ta.value.trim()){ ta.focus(); return } heard(ta.value) };
  }
  function heard(text){
    var got = side === 'space' ? readSpace(text) : readStuff(text);
    var keys = Object.keys(got).filter(function(k){ return got[k] });
    count('buddy-told-' + side + '-' + keys.length);
    var rows = keys.map(function(k){ return '<li><span>' + LABELS[k] + '</span>' + esc(got[k]) + '</li>' }).join('');
    bub.innerHTML = '<button class="lf-x" type="button" aria-label="Close">&times;</button>' +
      (keys.length
        ? '<p class="b-say">' + 'Got it. <b>Here\'s what we got.</b></p><div class="pf-mine"><ul class="mrows">' + rows + '</ul></div>' +
          '<p class="b-note">' + (keys.length < 6 ? 'The checklist below has the rest. Fill in what you like.' : 'That covers the whole checklist.') + '</p>'
        : '<p class="b-say">Hm. <b>I didn\'t catch the details.</b></p><p class="b-note">Try the place, how much, and when. Or put it on the checklist and we\'ll sort it out on a call.</p>') +
      '<div class="b-acts"><button class="way primary" type="button" data-fill>Put it on my checklist</button><button class="way" type="button" data-again>Say it another way</button></div>';
    bub.querySelector('.lf-x').onclick = close;
    bub.querySelector('[data-again]').onclick = function(){ render(); bub.querySelector('textarea').value = text; bub.querySelector('textarea').focus() };
    bub.querySelector('[data-fill]').onclick = function(){
      keys.forEach(function(k){ var f = document.querySelector('.ck-in[name="' + k + '"]'); if(f && !f.value.trim()){ f.value = got[k]; f.dispatchEvent(new Event('input')) } });
      var note = document.querySelector('.ck-in[name="else"]');
      count('buddy-filled-' + side);
      close();
      var g = document.querySelector('.s-guide'); if(g) g.scrollIntoView({behavior: still ? 'auto' : 'smooth', block:'start'});
    };
  }
  function show(){
    if(open) return; open = true; render(); bub.hidden = false;
    fig.setAttribute('aria-expanded','true'); fig.classList.add('talking');
    requestAnimationFrame(function(){ bub.classList.add('on') }); setTimeout(function(){ bub.classList.add('on') }, 30);
    setTimeout(function(){ var t = bub.querySelector('textarea'); if(t) t.focus({preventScroll:true}) }, still ? 0 : 380);
    count('buddy-open-' + side);
  }
  function close(){
    if(!open) return; open = false; bub.classList.remove('on'); fig.classList.remove('talking');
    fig.setAttribute('aria-expanded','false');
    setTimeout(function(){ if(!open) bub.hidden = true }, still ? 0 : 260); fig.focus({preventScroll:true});
  }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && open) close() });
  document.addEventListener('pointerdown', function(e){ if(open && !bub.contains(e.target) && !fig.contains(e.target)) close() });

  // ---- pick her up, let go, she settles and turns to you ----
  var drag = null;
  fig.addEventListener('pointerdown', function(e){
    if(e.button !== 0) return; e.preventDefault();
    drag = {x:e.clientX, y:e.clientY, moved:false}; fig.setPointerCapture(e.pointerId); fig.classList.add('held');
  });
  fig.addEventListener('pointermove', function(e){
    if(!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if(Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    drag.far = Math.max(drag.far || 0, Math.abs(dx) + Math.abs(dy));
    // she follows, with some reluctance, and tilts the way she is pulled
    var k = 0.55, rx = Math.max(-140, Math.min(140, dx * k)), ry = Math.max(-80, Math.min(80, dy * k));
    fig.style.transform = 'translate(' + rx + 'px,' + ry + 'px) rotate(' + Math.max(-12, Math.min(12, dx / 14)) + 'deg)';
  });
  function letGo(){
    if(!drag) return; var moved = drag.moved, far = drag.far || 0; drag = null;
    fig.classList.remove('held');
    if(window.cvpPick) cvpPick(fig);
    if(far > 24 && window.cvpDrop){ cvpDrop(fig); count('buddy-dragged-' + side); return }
    fig.classList.add('settle'); fig.style.transform = '';
    setTimeout(function(){ fig.classList.remove('settle') }, 700);
    if(moved) count('buddy-dragged-' + side);
    setTimeout(show, moved && !still ? 420 : 0);
  }
  fig.addEventListener('pointerup', letGo); fig.addEventListener('pointercancel', letGo);
  fig.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if(window.cvpPick) cvpPick(fig); open ? close() : show() } });

  // the other one, back to back with her: pick him up or click him, and go meet him on his own page
  document.querySelectorAll('.s-fig.other').forEach(function(o){
    o.setAttribute('role','link'); o.tabIndex = 0; o.setAttribute('aria-label', o.dataset.say + '. Go to that page.');
    o.classList.add('alive');
    var tip = document.createElement('span'); tip.className = 'side-tag'; tip.setAttribute('aria-hidden','true'); tip.innerHTML = o.dataset.say + ' <i>→</i>'; o.appendChild(tip);
    var d = null;
    // no fade, no pause: the page swaps underneath while the two of them stay put (view transitions in site.css)
    function go(){ if(window.cvpPick) cvpPick(o); setTimeout(function(){ count('buddy-switch-to-' + o.dataset.go.replace('.html','')); location.href = o.dataset.go + (from2 ? '?from=' + encodeURIComponent(from2) : '') }, 220) }
    o.addEventListener('pointerdown', function(e){ if(e.button !== 0) return; e.preventDefault(); d = {x:e.clientX, y:e.clientY, far:0}; o.setPointerCapture(e.pointerId); o.classList.add('held') });
    o.addEventListener('pointermove', function(e){ if(!d) return; var dx = e.clientX - d.x, dy = e.clientY - d.y; d.far = Math.max(d.far, Math.abs(dx) + Math.abs(dy)); o.style.transform = 'translate(' + Math.max(-140, Math.min(140, dx * .55)) + 'px,' + Math.max(-80, Math.min(80, dy * .55)) + 'px) rotate(' + Math.max(-12, Math.min(12, dx / 14)) + 'deg)' });
    function up(){ if(!d) return; var far = d.far; d = null; o.classList.remove('held'); if(far > 24 && window.cvpDrop) cvpDrop(o); else { o.style.transform = ''; go() } }
    o.addEventListener('pointerup', up); o.addEventListener('pointercancel', function(){ d = null; o.classList.remove('held'); o.style.transform = '' });
    o.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go() } });
  });
  var from2 = new URLSearchParams(location.search).get('from');
  // arriving from the other one: your own character turns to you, gently
  // the bubble opens only when the visitor clicks or drags the character on this page; tidy any old ?talk=1 from the address
  if(new URLSearchParams(location.search).has('talk')){ var u = new URL(location.href); u.searchParams.delete('talk'); history.replaceState(null, '', u) }
})();

// The two of them are the progress, quietly. They start back to back. As the checklist fills,
// the other one warms up; at three answers he turns to face her; when it is sent, she turns too
// and a small heart appears between them, once. While the visitor types, their own one nods.
(function(){
  var pair = document.querySelector('.s-figs'); if(!pair) return;
  var me = pair.querySelector('.s-fig.me'), other = pair.querySelector('.s-fig.other');
  var heart = document.createElement('span'); heart.className = 'pair-heart'; heart.setAttribute('aria-hidden','true');
  heart.innerHTML = '<svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.4-5.5-7.2A3 3 0 0 1 8 5a3 3 0 0 1 5.5 1.8C13.5 10.6 8 14 8 14z" fill="#0047FF"/></svg>';
  pair.appendChild(heart);
  function filled(){ var n = 0; document.querySelectorAll('.ck-in').forEach(function(f){ if(f.value.trim()) n++ }); return n }
  function update(){
    var n = filled();
    pair.style.setProperty('--warm', Math.min(1, 0.5 + n * 0.09));
    pair.classList.toggle('glance', n >= 3);
  }
  document.addEventListener('input', function(e){
    if(e.target.classList && e.target.classList.contains('ck-in')) update();
    if(e.target.closest && e.target.closest('.buddy') && me){ me.classList.remove('nod'); void me.offsetWidth; me.classList.add('nod') }
  });
  document.addEventListener('cvp-sent', function(){ update(); pair.classList.add('glance', 'met') });
  // the checklist may have been filled before (saved answers) or by the bubble
  setTimeout(update, 50); document.addEventListener('click', function(){ setTimeout(update, 60) });
})();
