// The end of the page: the same four ways as the bubble at the top, laid out on the page.
// The words box is open by default; the checklist folds away underneath and opens when the visitor
// picks it, or by itself once their words fill it in. One intake, two doors, one checklist.
(function(){
  var panel = document.querySelector('.intake'); if(!panel) return;
  var side = document.body.dataset.side || 'stuff';
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  var ta = panel.querySelector('.in-words textarea'), list = panel.querySelector('.in-list'), file = panel.querySelector('.in-file'), filed = panel.querySelector('.in-filed');
  var C = window.cvpCopy || {};
  function pick(k){ panel.querySelectorAll('.b-way').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.way === k) }) }
  panel.querySelectorAll('.b-way').forEach(function(b){ b.onclick = function(){
    var k = b.dataset.way; pick(k); count('intake-way-' + k + '-' + side);
    if(k === 'list'){ list.open = true; var f = list.querySelector('.ck-in'); if(f) f.focus({preventScroll:true}); list.scrollIntoView({behavior: still ? 'auto' : 'smooth', block:'start'}); return }
    if(k === 'words'){ ta.rows = 3; if(C.ph) ta.placeholder = C.ph.replace(/&#10;/g, String.fromCharCode(10)); ta.focus() }
    if(k === 'paste'){ ta.rows = 7; if(C.phPaste) ta.placeholder = C.phPaste; ta.focus() }
    if(k === 'upload' && file) file.click();
  } });
  if(file) file.onchange = function(){
    var f = file.files && file.files[0]; if(!f) return; count('intake-upload-' + side);
    if(/^text\/|\.(txt|csv|eml|md|rtf)$/i.test(f.type + ' ' + f.name) && f.size < 400000){
      var r = new FileReader();
      r.onload = function(){ ta.value = (ta.value ? ta.value + '\n\n' : '') + String(r.result).slice(0, 6000); filed.textContent = 'Read ' + f.name + '. Press Fill my checklist when ready.'; ta.focus() };
      r.readAsText(f);
    } else { window.cvpAttach = f.name; filed.textContent = 'Got ' + f.name + '. It can’t be read here, so attach it when your email opens. Add a line about what you need, then press Fill my checklist.' }
  };
  panel.querySelector('.in-words').onsubmit = function(e){
    e.preventDefault();
    var t = ta.value.trim(); if(!t){ ta.focus(); return }
    var got = window.cvpRead ? window.cvpRead(t) : {}, n = 0;
    Object.keys(got).forEach(function(k){ if(!got[k]) return; var f = list.querySelector('.ck-in[name="' + k + '"]'); if(f && !f.value.trim()){ f.value = got[k]; f.dispatchEvent(new Event('input', {bubbles:true})); n++ } });
    count('intake-filled-' + side + '-' + n);
    filed.textContent = n ? 'Got it. ' + n + (n === 1 ? ' answer is' : ' answers are') + ' on your checklist below. Check them, then send it.' : 'We didn’t catch the details. Try how much, where and when, or fill in the checklist below.';
    list.open = true;
    setTimeout(function(){ list.scrollIntoView({behavior: still ? 'auto' : 'smooth', block:'start'}) }, 60);
  };
  // the folded checklist says how far along it is
  var sumN = list.querySelector('.in-n');
  function tally(){ var n = 0, all = list.querySelectorAll('.ck-in'); all.forEach(function(f){ if(f.value.trim()) n++ }); sumN.textContent = n ? n + ' of ' + all.length + ' ready' : all.length + ' quick answers' }
  document.addEventListener('input', function(e){ if(e.target.classList && e.target.classList.contains('ck-in')) tally() });
  setTimeout(tally, 30);
  // filled from the bubble at the top: open it
  document.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('.buddy [data-fill]')) setTimeout(function(){ tally(); list.open = true }, 30) });
})();
