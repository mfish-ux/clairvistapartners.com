// The slow way in: "Let's start with an easy call" opens a small leaflet on the page.
// Two choices: write to us here, or call us. Nothing opens until the visitor picks one.
(function(){
  // Mel is getting a number. Until then the call side says so plainly.
  var PHONE = '';            // e.g. '+16175550100'
  var PHONE_SHOWN = '';      // e.g. '(617) 555-0100'
  // A form service (for example Formspree) receives the note on the site. Until it is set,
  // sending hands the written note to the visitor's own email, already filled in.
  var FORM_ENDPOINT = '';
  var TO = 'prism@clairvistapartners.com';
  var from = new URLSearchParams(location.search).get('from');
  var page = (location.pathname.split('/').pop() || 'home').replace('.html','') || 'home';
  function count(name){ try{ window.goatcounter && goatcounter.count({path:name, title:name, event:true}) }catch(e){} }

  var lf = document.createElement('div');
  lf.className = 'leaflet'; lf.id = 'leaflet'; lf.setAttribute('role','dialog'); lf.setAttribute('aria-modal','false');
  lf.setAttribute('aria-labelledby','lf-h'); lf.hidden = true;
  lf.innerHTML =
    '<button class="lf-x" type="button" aria-label="Close">&times;</button>'+
    '<p class="lf-k">A quick chat</p>'+
    '<h2 id="lf-h">No profile. <b>No pressure.</b></h2>'+
    // until the number exists the card offers writing only; the Call us tab returns by itself once PHONE is set (Mel, 31 October)
    (PHONE ? '<p class="lf-sub">Tell us a little, or just call. Either way, a real person picks up.</p>'+
    '<div class="lf-tabs" role="tablist">'+
      '<button type="button" role="tab" aria-selected="true" data-t="write">Write to us</button>'+
      '<button type="button" role="tab" aria-selected="false" data-t="call">Call us</button>'+
    '</div>' : '<p class="lf-sub">Tell us a little. A real person reads it.</p>')+
    '<form class="lf-pane" data-p="write" novalidate>'+
      '<div class="lf-side"><button type="button" aria-pressed="false" data-s="I have stuff">I have stuff</button><button type="button" aria-pressed="false" data-s="I have space">I have space</button></div>'+
      '<input name="name" placeholder="Your name" autocomplete="name" aria-label="Your name">'+
      '<input name="reach" placeholder="Email or phone" autocomplete="email" aria-label="Email or phone">'+
      '<textarea name="note" rows="2" placeholder="What\'s on your mind? One line is plenty." aria-label="Your note"></textarea>'+
      '<button class="way primary lf-send" type="submit">Send</button>'+
      '<p class="lf-err" aria-live="polite"></p>'+
    '</form>'+
    (PHONE ? '<div class="lf-pane" data-p="call" hidden>'+
      '<a class="lf-num" href="tel:'+PHONE+'" data-goatcounter-click="easy-call-dial-'+page+'">'+PHONE_SHOWN+'</a><p class="lf-small">Weekdays. If we miss you, we call back the same day.</p>'+
    '</div>' : '')+
    '<div class="lf-done" hidden><p class="lf-k">Got it</p><h2>A real person reads it.</h2><p class="lf-sub">Talk soon. <a class="lf-copy" href="#" data-goatcounter-click="easy-call-copy-email">Also send from my email</a></p></div>';

  var open = null, side = '';
  // who it is for: a character the visitor dragged speaks for that side (Mel, 30 October:
  // "Whoever they drag is the party the element is for"); the buttons open it for anyone
  var FOR = {'I have space':'For warehouses with space', 'I have stuff':'For companies with stuff'};
  function forSide(s){
    lf.querySelector('.lf-k').textContent = FOR[s] || 'A quick chat';
    if(s){ side = s; lf.querySelectorAll('.lf-side button').forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.s === s) }) }
  }
  window.cvpLeaflet = function(anchor, s){ if(open) hide(); forSide(s); show(anchor); count('easy-call-open-drag-' + (s === 'I have space' ? 'space' : 'stuff') + '-' + page) };
  var veil = document.createElement('div'); veil.className = 'lf-veil'; veil.hidden = true;
  function show(btn){
    if(!lf.parentNode){ document.body.appendChild(veil); document.body.appendChild(lf) }
    // on a phone the card rises from the bottom over a veil, within thumb reach (Mel, 31 Oct, round 2)
    if(matchMedia('(max-width:600px)').matches){
      lf.classList.add('sheet'); lf.style.left = lf.style.top = lf.style.width = '';
      lf.hidden = false; veil.hidden = false; document.body.style.overflow = 'hidden';
      void lf.offsetWidth; lf.classList.add('on');
      open = btn; btn.setAttribute('aria-expanded','true');
      // the heading takes focus, so no focus ring lands under the thumb
      var hd = lf.querySelector('h2'); hd.setAttribute('tabindex', '-1'); hd.focus({preventScroll:true});
      count('easy-call-open-'+page);
      return;
    }
    lf.classList.remove('sheet');
    var r = btn.getBoundingClientRect(), w = Math.min(380, innerWidth - 32);
    lf.style.width = w+'px';
    lf.hidden = false;
    var left = Math.max(16, Math.min(r.left + scrollX, scrollX + innerWidth - w - 16));
    var top = r.bottom + scrollY + 12;
    if (r.bottom + lf.offsetHeight + 24 > innerHeight && r.top - lf.offsetHeight - 12 > 0) top = r.top + scrollY - lf.offsetHeight - 12;
    lf.style.left = left+'px'; lf.style.top = top+'px';
    void lf.offsetWidth; lf.classList.add('on');
    open = btn; btn.setAttribute('aria-expanded','true');
    // no tabs until the number exists; the side already chosen, if any, takes focus
    (lf.querySelector('[aria-selected="true"]') || lf.querySelector('.lf-side [aria-pressed="true"]') || lf.querySelector('.lf-side button')).focus();
    count('easy-call-open-'+page);
  }
  function hide(){
    if(!open) return; lf.classList.remove('on'); lf.hidden = true; veil.hidden = true; document.body.style.overflow = '';
    open.setAttribute('aria-expanded','false'); open.focus(); open = null;
  }
  document.querySelectorAll('.slow button, [data-leaflet]').forEach(function(b){
    b.setAttribute('aria-controls','leaflet'); b.setAttribute('aria-expanded','false');
    b.addEventListener('click', function(e){ e.stopPropagation(); if(open) return hide(); forSide(''); show(b) });
  });
  lf.addEventListener('click', function(e){ e.stopPropagation() });
  document.addEventListener('click', function(){ hide() });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') hide() });
  lf.querySelector('.lf-x').addEventListener('click', hide);

  lf.querySelectorAll('[role=tab]').forEach(function(t){
    t.addEventListener('click', function(){
      lf.querySelectorAll('[role=tab]').forEach(function(x){ x.setAttribute('aria-selected', x === t) });
      lf.querySelectorAll('.lf-pane').forEach(function(p){ p.hidden = p.dataset.p !== t.dataset.t });
      count('easy-call-tab-'+t.dataset.t+'-'+page);
    });
  });
  lf.querySelectorAll('.lf-side button').forEach(function(b){
    b.addEventListener('click', function(){
      side = b.dataset.s;
      lf.querySelectorAll('.lf-side button').forEach(function(x){ x.setAttribute('aria-pressed', x === b) });
    });
  });
  var form = lf.querySelector('form');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var f = form.elements, err = lf.querySelector('.lf-err');
    if(!f.reach.value.trim()){ err.textContent = 'Leave an email or a phone number so we can reach you.'; f.reach.focus(); return }
    err.textContent = '';
    var data = { name:f.name.value.trim(), reach:f.reach.value.trim(), note:f.note.value.trim(), side:side, page:page, from:from||'' };
    count('easy-call-sent-'+page);
    function done(){ form.hidden = true; var tabs = lf.querySelector('.lf-tabs'); if(tabs) tabs.hidden = true;
      lf.querySelectorAll('.lf-pane').forEach(function(p){ p.hidden = true }); lf.querySelector('.lf-done').hidden = false }
    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify(data)})
        .then(function(r){ if(!r.ok) throw 0; done() })
        .catch(function(){ err.textContent = 'That did not go through. Try again, or write to '+TO+'.' });
    } else {
      var subj = 'A quick chat' + (data.side ? ', '+data.side : '');
      var body = 'Hello,\n\n' + (data.note || 'I would like a quick chat.') + '\n\n' + (data.name ? data.name+'\n' : '') + data.reach + '\n';
      var url = 'mailto:'+TO+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
      // the site's own Send does the sending; the visitor's email app is an optional copy (Mel, 31 October)
      var go = form.querySelector('.lf-send'); go.disabled = true;
      (window.cvpSend ? cvpSend(url) : Promise.resolve(false)).then(function(ok){
        go.disabled = false;
        if(!ok){ err.innerHTML = 'That did not go through. Try again, or <a href="'+url+'">send it from your email</a>.'; return }
        lf.querySelector('.lf-copy').href = url; done();
      });
    }
  });
})();
