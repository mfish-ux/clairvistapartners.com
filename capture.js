// Capture, for the admin dashboard (Mel, 30 October: "All forms should be collected in some sort of easy database").
// Every form on the site ends by opening a written email to prism@. Just before it opens, this saves a copy:
// what was sent, from which page, and the ?from= tag. It also counts page views and button presses.
// No cookies, no visitor ID, no IP address stored. The company comes from what the visitor wrote or the link's tag.
// Until the database keys are filled in, it saves to this browser only, so the preview can be tested end to end.
(function(){
  var SUPABASE_URL = 'https://oilvzabkaoiliabefwrh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_tFw1kzlY87RsUElfZPNZlA_UoRKk3nr';  // publishable key: safe in a web page; the database only lets it add rows
  // the local preview never writes to the real database; it keeps its rows in this browser only
  var preview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var live = !!(SUPABASE_URL && SUPABASE_KEY) && !preview;
  window.CVP_DB = live ? {url:SUPABASE_URL, key:SUPABASE_KEY} : {url:'', key:''};
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';
  var q = new URLSearchParams(location.search), from = q.get('from') || '';
  var ref = ''; try{ var r = document.referrer && new URL(document.referrer); if(r && r.host !== location.host) ref = r.host.replace(/^www\./,'') }catch(e){}
  var FREE = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|mac|aol|proton|protonmail|msn|comcast|verizon|att)\./i;

  function save(table, row){
    row.created_at = new Date().toISOString();
    if(live){
      try{ fetch(SUPABASE_URL + '/rest/v1/' + table, {method:'POST', keepalive:true,
        headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body: JSON.stringify(row)}) }catch(e){}
    } else {
      try{ var k = 'cvp-local-' + table, a = JSON.parse(localStorage.getItem(k) || '[]'); a.push(row); localStorage.setItem(k, JSON.stringify(a.slice(-2000))) }catch(e){}
    }
  }
  function cut(s, n){ s = String(s || ''); return s.length > n ? s.slice(0, n) : s }
  // Where the visitor is: city, state and country only, looked up once per visit (the address itself is never kept).
  var geo = null; try{ geo = JSON.parse(sessionStorage.getItem('cvp-geo') || 'null') }catch(e){}
  var geoReady = geo ? Promise.resolve(geo) : new Promise(function(res){
    var done = false, fin = function(g){ if(done) return; done = true; geo = g || {}; try{ sessionStorage.setItem('cvp-geo', JSON.stringify(geo)) }catch(e){} res(geo) };
    setTimeout(function(){ fin(null) }, 1500);
    try{ fetch('https://get.geojs.io/v1/ip/geo.json').then(function(r){ return r.json() }).then(function(d){ fin({city:cut(d.city,80), region:cut(d.region,80), country:cut(d.country_code,4)}) }).catch(function(){ fin(null) }) }catch(e){ fin(null) }
  });
  function place(row){ if(geo){ row.city = geo.city || null; row.region = geo.region || null; row.country = geo.country || null } return row }
  // Been here before, on this device: a yes or no, no ID
  var returning = false; try{ returning = !!localStorage.getItem('cvp-seen'); localStorage.setItem('cvp-seen', '1') }catch(e){}

  // read what the visitor wrote out of the email the site prepared
  function parse(url){
    var out = {subject:'', body:''};
    try{ var qs = url.split('?')[1] || ''; qs.split('&').forEach(function(p){ var i = p.indexOf('='); if(i < 0) return;
      var k = p.slice(0, i).toLowerCase(), v = decodeURIComponent(p.slice(i + 1).replace(/\+/g,' ')); if(k === 'subject' || k === 'body') out[k] = v }) }catch(e){}
    return out;
  }
  function field(body, names){
    for(var i = 0; i < names.length; i++){ var m = body.match(new RegExp('^\\s*' + names[i] + '\\s*:\\s*(.+)$', 'im')); if(m) return m[1].trim() }
    return '';
  }
  window.cvpMail = function(url){
    var m = parse(url), body = m.body, subject = m.subject;
    var email = (body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0];
    if(/clairvistapartners\.com$/i.test(email)) email = '';
    var company = field(body, ['Company','Business','Brand']);
    if(!company && email){ var d = email.split('@')[1]; if(d && !FREE.test(d)) company = d.replace(/\.(com|co|net|org|io|us|biz)(\.[a-z]{2})?$/i,'') }
    save('submissions', place({page:page, kind:cut(subject.split(':')[0], 80), subject:cut(subject, 300), body:cut(body, 6000),
      email:cut(email, 200), name:cut(field(body, ['Name','Ask for']), 120), company:cut(company, 160), from_tag:cut(from, 80), referrer:cut(ref, 120)}));
    if(!window.__cvpNoNav) location.href = url;
  };

  if(page === 'admin') return;
  // page views and button presses, by page and channel only
  geoReady.then(function(){ save('events', place({type:'view', name:page, page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960, repeat_visit: returning})) });
  // the profile questions, step by step (called by the home page)
  window.cvpStep = function(name){ save('events', place({type:'step', name:cut(name, 120), page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960, repeat_visit: returning})) };
  // time on the page while it is in view, and how far down it was scrolled, sent once when the visitor leaves
  var shown = 0, since = document.hidden ? 0 : Date.now(), deepest = 0, sent = false;
  function depth(){ var h = document.documentElement.scrollHeight - innerHeight; deepest = Math.max(deepest, h > 0 ? Math.round(scrollY / h * 100) : 100) }
  addEventListener('scroll', depth, {passive:true}); depth();
  document.addEventListener('visibilitychange', function(){ if(document.hidden){ if(since){ shown += Date.now() - since; since = 0 } leave() } else { since = Date.now(); sent = false } });
  addEventListener('pagehide', leave);
  function leave(){ if(sent) return; if(since){ shown += Date.now() - since; since = Date.now() } var secs = Math.min(86400, Math.round(shown / 1000)); if(secs < 1) return; sent = true;
    save('events', place({type:'engage', name:page, page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960, repeat_visit: returning, secs: secs, depth: Math.min(100, deepest)})); shown = 0 }
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-goatcounter-click],a[href^="mailto:"]'); if(!el) return;
    var n = el.getAttribute('data-goatcounter-click') || 'email-link';
    save('events', place({type:'click', name:cut(n, 120), page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960, repeat_visit: returning}));
  }, true);
})();
