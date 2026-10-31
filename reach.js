// Partnerships: pick a seat, leave an email, press the button. The site sends it (Mel, 31 October: the site's own Send
// does the sending); the visitor's email app is an optional copy. Counted by channel, never by person.
(function(){
  var box = document.querySelector('.reach'); if(!box) return;
  var MAIL = 'prism@clairvistapartners.com';
  var kind = box.dataset.reach, label = 'Partnership conversation';
  var from = new URLSearchParams(location.search).get('from');
  var picks = [];
  function count(n){ try{ window.goatcounter && goatcounter.count({path:n, title:n, event:true}) }catch(e){} }
  box.querySelectorAll('.r-ways .b-way').forEach(function(b){
    b.addEventListener('click', function(){
      var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', on);
      var p = b.dataset.pick; picks = picks.filter(function(x){ return x !== p }); if(on) picks.push(p);
      if(on) count('reach-pick-' + kind + '-' + p.toLowerCase().replace(/[^a-z]+/g, '-'));
      box.querySelector('.r-msg').textContent = '';
    });
  });
  box.querySelector('.r-form').addEventListener('submit', function(e){
    e.preventDefault();
    var msg = box.querySelector('.r-msg');
    if(!picks.length){ msg.textContent = 'Pick a seat first, so we know where to start.'; return }
    var em = box.querySelector('.r-mail'), v = em ? em.value.trim() : '';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ msg.textContent = 'Leave your email so we can write back.'; if(em) em.focus(); return }
    var NL = String.fromCharCode(10);
    var body = 'Hello,' + NL + NL + picks.join(', ') + NL + NL + v + NL;
    count('reach-send-' + kind);
    var url = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(label + ': ' + picks.join(', ')) + '&body=' + encodeURIComponent(body);
    var go = box.querySelector('.r-go .way'); if(go) go.disabled = true;
    (window.cvpSend ? cvpSend(url) : Promise.resolve(false)).then(function(ok){
      if(go) go.disabled = false;
      msg.innerHTML = ok ? '<b>Got it. A real person reads it.</b> We will write back soon. <a href="' + url + '" data-goatcounter-click="reach-copy-email">Also send from my email</a>'
        : 'That did not go through. Try again, or <a href="' + url + '">send it from your email</a>.';
    });
  });
})();
