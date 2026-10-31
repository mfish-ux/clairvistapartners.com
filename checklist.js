// The checklist is an optional first message. Each item takes a short answer; its box ticks as it fills.
// Its own send, at its end, counts along and sends it: a small card asks who to call, then the visitor's own
// email opens with the checklist written out (or the form service, once FORM_ENDPOINT is set).
(function(){
  var FORM_ENDPOINT = '';
  var MAIL = 'prism@clairvistapartners.com';
  var page = document.body.dataset.side || 'stuff';
  var KEY = 'cvp-checklist-' + page;
  var from = new URLSearchParams(location.search).get('from');
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  function esc(s){ return String(s||'').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }

  var fields = Array.prototype.slice.call(document.querySelectorAll('.ck-in'));
  var box = document.querySelector('.ck-send'), guide = document.querySelector('.s-guide'), prism = document.querySelector('.s-prism');
  if(!fields.length || !box) return;
  var saved = {}; try{ saved = JSON.parse(localStorage.getItem(KEY) || '{}') }catch(e){}
  fields.forEach(function(f){ if(saved[f.name]) f.value = saved[f.name] });
  var label = box.querySelector('.ck-n'), sendBtn = box.querySelector('[data-send-list]');
  var started = false;
  var WORD = ['None','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
  // the meter: one segment per answer, filling as they go
  var meterEl = box.querySelector('.ck-meter'), meter = [];
  if(meterEl){ meterEl.innerHTML = fields.map(function(){ return '<i></i>' }).join(''); meter = Array.prototype.slice.call(meterEl.children) }
  function update(){
    var n = 0, st = {};
    fields.forEach(function(f){
      var on = f.value.trim() !== ''; if(on) n++; st[f.name] = f.value;
      var li = f.closest('li'); if(li) li.classList.toggle('done', on);
    });
    try{ localStorage.setItem(KEY, JSON.stringify(st)) }catch(e){}
    label.innerHTML = n === 0 ? '<b>Every answer here is one less question on the call.</b>'
      : n === fields.length ? '<b>All ' + WORD[n].toLowerCase() + '.</b> We can go straight to the walkthrough.'
      : '<b>' + WORD[n] + ' fewer question' + (n > 1 ? 's' : '') + ' on the call.</b> ' + (fields.length - n) + ' to go.';
    meter.forEach(function(m, i){ m.classList.toggle('on', i < n) });
    box.classList.toggle('has', n > 0);
    if(n > 0 && !started){ started = true; count('checklist-started-' + page) }
    return n;
  }
  fields.forEach(function(f){ f.addEventListener('input', update) });

  // Prism slides in as the second column once the checklist comes into view, then shows one app screen at a time
  var shots = prism ? Array.prototype.slice.call(prism.querySelectorAll('.pstrip > li')) : [], cur = 0, timer = null;
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(shots.length){
    var dots = document.createElement('div'); dots.className = 'p-dots';
    dots.innerHTML = shots.map(function(_, i){ return '<button type="button" aria-label="App screen ' + (i+1) + '"></button>' }).join('');
    prism.querySelector('.pstrip').after(dots);
    function show(i){ cur = i; shots.forEach(function(li, k){ li.classList.toggle('on', k === i) }); dots.querySelectorAll('button').forEach(function(b, k){ if(k === i) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current') }) }
    dots.querySelectorAll('button').forEach(function(b, k){ b.onclick = function(){ clearInterval(timer); timer = null; show(k) } });
    show(0);
  }
  function check(){
    if(prism && !prism.classList.contains('in') && guide.getBoundingClientRect().top < innerHeight * 0.75){
      prism.classList.add('in');
      if(shots.length > 1 && !still && !timer) timer = setInterval(function(){ show((cur + 1) % shots.length) }, 3800);
    }
  }
  addEventListener('scroll', check, {passive:true}); addEventListener('resize', check);
  update(); check();

  // send: who should we call, then it goes
  var veil = document.createElement('div'); veil.className = 'pf-veil'; veil.hidden = true;
  var card = document.createElement('div'); card.className = 'pf'; card.setAttribute('role','dialog'); card.setAttribute('aria-modal','true'); card.setAttribute('aria-label','Send your checklist');
  veil.appendChild(card);
  function close(){ veil.hidden = true; document.body.style.overflow = ''; sendBtn.focus() }
  veil.addEventListener('click', function(e){ if(e.target === veil) close() });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !veil.hidden) close() });
  function listText(){
    return fields.map(function(f){ return f.dataset.label + ': ' + (f.value.trim() || '(not sure yet)') }).join('\n');
  }
  function openSend(){
    if(!veil.parentNode) document.body.appendChild(veil);
    var n = update();
    var rows = fields.filter(function(f){ return f.value.trim() }).map(function(f){ return '<li><span>' + esc(f.dataset.short || f.dataset.label) + '</span>' + esc(f.value.trim()) + '</li>' }).join('');
    card.innerHTML = '<button class="lf-x" type="button" aria-label="Close">&times;</button>' +
      '<p class="lf-k">' + (n ? n + ' of ' + fields.length + ' ready' : 'Your checklist') + '</p>' +
      '<h2 tabindex="-1">Almost there. <b>Who should we call?</b></h2>' +
      (rows ? '<div class="pf-mine"><ul class="mrows">' + rows + '</ul></div>' : '<p class="lf-sub">Blank is fine. We will fill it in together on the call.</p>') +
      '<form class="pf-form" novalidate><input name="name" placeholder="Your name" autocomplete="name" aria-label="Your name">' +
      '<input name="company" placeholder="Company" autocomplete="organization" aria-label="Company">' +
      '<input name="reach" placeholder="Email or phone" autocomplete="email" aria-label="Email or phone">' +
      '<button class="way primary" type="submit">Send my checklist</button><p class="lf-err" aria-live="polite"></p></form>';
    veil.hidden = false; document.body.style.overflow = 'hidden';
    card.querySelector('.lf-x').onclick = close;
    card.querySelector('input').focus();
    card.querySelector('form').onsubmit = function(e){
      e.preventDefault(); var f = e.target.elements, err = card.querySelector('.lf-err');
      if(!f.reach.value.trim()){ err.textContent = 'Leave an email or a phone number so we can reach you.'; f.reach.focus(); return }
      var who = [f.name.value.trim(), f.company.value.trim(), f.reach.value.trim()].filter(Boolean).join('\n');
      var subject = page === 'space' ? 'Checklist: I have space' : 'Checklist: I have stuff';
      var body = 'Hello,\n\nHere is my checklist. Let us talk.\n\n' + listText() + '\n\n' + who + '\n';
      if(window.cvpAttach) body += '\nI am attaching ' + window.cvpAttach + ' with our requirements.\n';
      count('checklist-sent-' + page);
      var url = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      function done(){ document.dispatchEvent(new CustomEvent('cvp-sent')); card.innerHTML = '<button class="lf-x" type="button" aria-label="Close">&times;</button><p class="lf-k">Got it</p><h2 tabindex="-1">A real person reads it.</h2><p class="lf-sub">We read every checklist and call back ourselves. <a href="' + url + '" data-goatcounter-click="checklist-copy-email">Also send from my email</a></p>'; card.querySelector('.lf-x').onclick = close }
      if(FORM_ENDPOINT){
        fetch(FORM_ENDPOINT, {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify({subject:subject, checklist:listText(), name:f.name.value, company:f.company.value, reach:f.reach.value, page:page, from:from||''})})
          .then(function(r){ if(!r.ok) throw 0; done() }).catch(function(){ err.textContent = 'That did not go through. Try again, or write to ' + MAIL + '.' });
      } else {
        // the site's own Send does the sending; the visitor's email app is an optional copy (Mel, 31 October)
        var go = card.querySelector('[type=submit]'); if(go) go.disabled = true;
        (window.cvpSend ? cvpSend(url) : Promise.resolve(false)).then(function(ok){
          if(go) go.disabled = false;
          if(ok) done(); else err.innerHTML = 'That did not go through. Try again, or <a href="' + url + '">send it from your email</a>.';
        });
      }
    };
  }
  sendBtn.addEventListener('click', openSend);
})();
