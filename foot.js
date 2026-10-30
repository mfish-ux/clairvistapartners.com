// The simple footer line, on every page: once the visitor scrolls, "Clairvista Partners is open." and Let's chat.
// It is the one place the ask lives; it opens the chat card (slow.js).
(function(){
  var page = (location.pathname.split('/').pop() || 'home').replace('.html','') || 'home';
  var bar = document.createElement('div');
  bar.className = 'stick'; bar.id = 'stick'; bar.setAttribute('aria-hidden','true');
  bar.innerHTML = '<div class="stick-in"><p>Clairvista Partners is open.</p>' +
    '<button class="stick-chat" type="button" data-leaflet tabindex="-1" data-goatcounter-click="open-easy-call-' + page + '-footer">Let\'s chat</button></div>';
  document.body.appendChild(bar);
  // it shows once the page's own "Let's chat" has scrolled away, and steps aside when the real footer is in view
  var cta = document.querySelector('.t-cta'), foot = document.querySelector('footer');
  function check(){
    var past = cta ? cta.getBoundingClientRect().bottom < 0 : scrollY > Math.min(innerHeight * 0.6, 480);
    var end = foot ? foot.getBoundingClientRect().top < innerHeight - 8 : false;
    var on = past && !end;
    bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    bar.querySelector('button').tabIndex = on ? 0 : -1;
  }
  addEventListener('scroll', check, {passive:true}); addEventListener('resize', check); check();
})();
