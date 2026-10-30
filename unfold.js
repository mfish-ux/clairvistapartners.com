// When a folded row opens, the page makes room: it glides so the opened part is in view,
// clear of the sticky footer. If it is taller than the screen, its top comes into view.
// Also: the early list in the Prism row.
(function(){
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var FOOT = 64, TOP = 24;
  document.querySelectorAll('details').forEach(function(d){
    d.addEventListener('toggle', function(){
      if(!d.open) return;
      setTimeout(function(){
        var box = d.closest('.p-fold') || d, r = box.getBoundingClientRect(), room = innerHeight - FOOT - TOP;
        var target = null;
        if(r.height > room || r.top < TOP) target = scrollY + r.top - TOP;
        else if(r.bottom > innerHeight - FOOT) target = scrollY + r.bottom - (innerHeight - FOOT);
        if(target !== null) scrollTo({top: target, behavior: still ? 'auto' : 'smooth'});
      }, still ? 0 : 440);
    });
  });

  // the early list
  var MAIL = 'prism@clairvistapartners.com';
  var sd = document.body.dataset.side, side = sd === 'space' ? 'I have space' : sd === 'stuff' ? 'I have stuff' : 'How it works page';
  var from = new URLSearchParams(location.search).get('from');
  document.querySelectorAll('.early').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var em = f.querySelector('input'), v = em.value.trim(), msg = f.querySelector('.early-msg');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ msg.textContent = 'Add an email address so we can tell you the day it opens.'; em.focus(); return }
      try{ window.goatcounter && goatcounter.count({path:'early-list-' + (sd || 'site'), title:'early list', event:true}) }catch(_){}
      var body = 'Hello,\n\nPut me on the early list for Prism.\n\n' + v + '\n' + side + '\n';
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Early list: ' + side + (from ? ' (' + from + ')' : '')) + '&body=' + encodeURIComponent(body);
      f.classList.add('done');
      msg.innerHTML = '<b>You’re on the list.</b> Press send in your email and we’ll tell you the day it opens.';
    });
  });
})();
