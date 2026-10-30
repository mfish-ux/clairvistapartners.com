// Capture, for the admin dashboard (Mel, 30 October: "All forms should be collected in some sort of easy database").
// Every form on the site ends by opening a written email to prism@. Just before it opens, this saves a copy:
// what was sent, from which page, and the ?from= tag. It also counts page views and button presses.
// No cookies, no visitor ID, no IP address stored. The company comes from what the visitor wrote or the link's tag.
// Until the database keys are filled in, it saves to this browser only, so the preview can be tested end to end.
(function(){
  var SUPABASE_URL = 'https://oilvzabkaoiliabefwrh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_tFw1kzlY87RsUElfZPNZlA_UoRKk3nr';  // publishable key: safe in a web page; the database only lets it add rows
  window.CVP_DB = {url:SUPABASE_URL, key:SUPABASE_KEY};
  var live = !!(SUPABASE_URL && SUPABASE_KEY);
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
    save('submissions', {page:page, kind:cut(subject.split(':')[0], 80), subject:cut(subject, 300), body:cut(body, 6000),
      email:cut(email, 200), name:cut(field(body, ['Name','Ask for']), 120), company:cut(company, 160), from_tag:cut(from, 80), referrer:cut(ref, 120)});
    if(!window.__cvpNoNav) location.href = url;
  };

  if(page === 'admin') return;
  // page views and button presses, by page and channel only
  save('events', {type:'view', name:page, page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960});
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-goatcounter-click],a[href^="mailto:"]'); if(!el) return;
    var n = el.getAttribute('data-goatcounter-click') || 'email-link';
    save('events', {type:'click', name:cut(n, 120), page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960});
  }, true);
})();
