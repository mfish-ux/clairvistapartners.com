// The simple footer line, on every page: once the visitor scrolls, "Clairvista Partners is open." and Let's chat.
// It is the one place the ask lives; it opens the chat card (slow.js).
(function(){
  // the phone menu scrolls sideways: start it with the current page's link in view (Mel, 31 Oct)
  var cur = document.querySelector('.nav [aria-current="page"]'), nav = cur && cur.parentNode;
  if(nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft += cur.getBoundingClientRect().left - nav.getBoundingClientRect().left - 16;
  var page = (location.pathname.split('/').pop() || 'home').replace('.html','') || 'home';
  var bar = document.createElement('div');
  bar.className = 'stick'; bar.id = 'stick'; bar.setAttribute('aria-hidden','true');
  bar.innerHTML = '<div class="stick-in"><p>Clairvista Partners is open.</p>' +
    '<button class="stick-chat" type="button" data-leaflet tabindex="-1" data-goatcounter-click="open-easy-call-' + page + '-footer">Let\'s chat</button></div>';
  document.body.appendChild(bar);
  // it shows once the page's own "Let's chat" has scrolled away, and steps aside when the real footer is in view
  var cta = document.querySelector('.t-cta'), foot = document.querySelector('footer'), phone = document.querySelector('.hero .device');
  function check(){
    var past = cta ? cta.getBoundingClientRect().bottom < 0 : scrollY > Math.min(innerHeight * 0.6, 480);
    var end = foot ? foot.getBoundingClientRect().top < innerHeight - 8 : false;
    // it steps aside while the landing page's phone is on screen, so it never covers the phone's own Say hello (Mel, 31 Oct)
    var pr = phone && phone.getBoundingClientRect(), onPhone = pr ? pr.bottom > 0 && pr.top < innerHeight : false;
    var on = past && !end && !onPhone;
    bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    bar.querySelector('button').tabIndex = on ? 0 : -1;
  }
  addEventListener('scroll', check, {passive:true}); addEventListener('resize', check); check();
})();
