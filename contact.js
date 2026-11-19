// The booking link and the phone number, in one place.
// A blank BOOKING_URL keeps Book 20 minutes off the page.
(function(){
  var c = window.CVP_CONTACT = {
    BOOKING_URL: '',
    PHONE: '+18577634111',
    PHONE_SHOWN: '(857) 763-4111'
  };
  c.bookingHref = function(){
    var raw = String(c.BOOKING_URL || '').trim();
    if(!raw) return '';
    try {
      var u = new URL(raw);
      if(u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch(e){ return '' }
  };
  c.phoneHref = function(){
    var raw = String(c.PHONE || '').trim();
    if(!raw) return '';
    var n = raw.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    return /\d{3,}/.test(n) ? n : '';
  };
})();
