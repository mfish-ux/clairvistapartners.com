// Partnerships: pick a seat, press the button, and it opens your own email to us with the seat written in.
// Nothing is stored. Counted by channel, never by person.
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
    var NL = String.fromCharCode(10);
    var body = 'Hello,' + NL + NL + picks.join(', ') + NL + NL;
    count('reach-send-' + kind);
    location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(label + ': ' + picks.join(', ') + (from ? ' (' + from + ')' : '')) + '&body=' + encodeURIComponent(body);
    msg.innerHTML = '<b>Your note is started.</b> Add a line or two in your email, press send, and we will get back to you.';
  });
})();
