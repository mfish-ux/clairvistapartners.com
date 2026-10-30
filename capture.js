// Capture, for the admin dashboard (Mel, 30 October: "All forms should be collected in some sort of easy database").
// Every form on the site ends by opening a written email to prism@. Just before it opens, this saves a copy.
// It also counts visits, page views, button presses, the profile steps, time and scroll, and how well the site works.
// Honest counting (Mel, 30 October: "make sure you arent counting duplicate visitors"):
//   - a visitor is counted once a day per device (new_today), a visit once per 30 minutes of activity (visit_start);
//   - reloads, bots, the local preview and the team's own devices are not counted.
// No cookies and no visitor ID. Location is kept only as city, state and country. "No thanks" on the notice turns
// off the location lookup and the device flags; the visit is then counted without them.
(function(){
  var SUPABASE_URL = 'https://oilvzabkaoiliabefwrh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_tFw1kzlY87RsUElfZPNZlA_UoRKk3nr';  // publishable key: safe in a web page; the database only lets it add rows
  var preview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var live = !!(SUPABASE_URL && SUPABASE_KEY) && !preview;
  window.CVP_DB = live ? {url:SUPABASE_URL, key:SUPABASE_KEY} : {url:'', key:''};
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';
  if(page === 'admin') return;   // the dashboard itself is never counted and never touches the visit flags
  var q = new URLSearchParams(location.search), from = q.get('from') || '';
  var ref = '', inRef = ''; try{ var r = document.referrer && new URL(document.referrer); if(r){ if(r.host !== location.host) ref = r.host.replace(/^www\./,''); else inRef = r.pathname } }catch(e){}
  var FREE = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|mac|aol|proton|protonmail|msn|comcast|verizon|att)\./i;
  function get(s, k){ try{ return s.getItem(k) }catch(e){ return null } }
  function put(s, k, v){ try{ s.setItem(k, v) }catch(e){} }

  // who is not counted: bots and link previews, and devices marked by the dashboard as the team's own
  var ua = navigator.userAgent || '';
  var bot = navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|whatsapp|slackbot|discord|telegram|bingpreview|vercel|uptime|monitor/i.test(ua);
  var team = get(localStorage, 'cvp-team') === '1';
  var choice = get(localStorage, 'cvp-consent');              // 'yes', 'no' or nothing yet
  var full = choice !== 'no';                                  // location and device flags, unless declined
  var skip = bot || team || window.__cvpSkip;

  function save(table, row){
    if(skip) return;
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

  // Where the visitor is: city, state and country only, looked up once per visit (the address itself is never kept)
  var geo = null; try{ geo = JSON.parse(get(sessionStorage, 'cvp-geo') || 'null') }catch(e){}
  var geoReady = (geo || !full || skip) ? Promise.resolve(geo) : new Promise(function(res){
    var done = false, fin = function(g){ if(done) return; done = true; geo = g || {}; put(sessionStorage, 'cvp-geo', JSON.stringify(geo)); res(geo) };
    setTimeout(function(){ fin(null) }, 1500);
    try{ fetch('https://get.geojs.io/v1/ip/geo.json').then(function(r){ return r.json() }).then(function(d){ fin({city:cut(d.city,80), region:cut(d.region,80), country:cut(d.country_code,4)}) }).catch(function(){ fin(null) }) }catch(e){ fin(null) }
  });

  // once a day per device, once per visit (30 minutes without activity starts a new one), and been here before
  var today = new Date().toISOString().slice(0, 10), now = Date.now();
  var newToday = true, visitStart = true, returning = false;
  if(full){
    var seen = get(localStorage, 'cvp-seen'); returning = !!seen && seen !== today; newToday = seen !== today; put(localStorage, 'cvp-seen', today);
    var last = +get(localStorage, 'cvp-last') || 0; visitStart = now - last > 30 * 60000; put(localStorage, 'cvp-last', String(now));
  }
  function base(type, name){
    var row = {type:type, name:cut(name, 120), page:page, from_tag:cut(from, 80), referrer:cut(ref, 120), wide: innerWidth >= 960};
    if(full){ row.repeat_visit = returning; if(geo){ row.city = geo.city || null; row.region = geo.region || null; row.country = geo.country || null } }
    return row;
  }
  function touch(){ if(full) put(localStorage, 'cvp-last', String(Date.now())) }

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
    var row = {page:page, kind:cut(subject.split(':')[0], 80), subject:cut(subject, 300), body:cut(body, 6000),
      email:cut(email, 200), name:cut(field(body, ['Name','Ask for']), 120), company:cut(company, 160), from_tag:cut(from, 80), referrer:cut(ref, 120)};
    if(full && geo){ row.city = geo.city || null; row.region = geo.region || null; row.country = geo.country || null }
    save('submissions', row); touch();
    if(!window.__cvpNoNav) location.href = url;
  };


  // ---- the view: once per page load, never for a reload or a back-button return from the cache
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  var reload = nav.type === 'reload';
  geoReady.then(function(){
    if(reload) return;
    var row = base('view', page); row.visit_start = visitStart; row.new_today = newToday;
    if(page === '404') row.detail = cut(location.pathname + (inRef ? ' from ' + inRef : ref ? ' from ' + ref : ''), 300);
    save('events', row);
  });

  // ---- the profile questions, step by step (called by the home page); each step once per page load
  var stepsDone = {};
  window.cvpStep = function(name){ if(stepsDone[name]) return; stepsDone[name] = 1; save('events', base('step', name)); touch() };

  // ---- button presses (a double click counts once)
  var lastClick = {n:'', t:0};
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-goatcounter-click],a[href^="mailto:"]');
    if(el){ var n = el.getAttribute('data-goatcounter-click') || 'email-link'; var t = Date.now();
      if(!(n === lastClick.n && t - lastClick.t < 800)) save('events', base('click', n)); lastClick = {n:n, t:t}; touch() }
    rage(e);
  }, true);

  // ---- site health: frustrated repeat clicks on one spot (3 within a second), errors, broken files, speed
  var clicks = [], raged = 0;
  function label(el){ if(!el || !el.tagName) return ''; var t = (el.getAttribute('aria-label') || el.alt || el.textContent || '').trim().replace(/\s+/g,' ').slice(0, 40);
    return el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + (t ? ' "' + t + '"' : '') }
  function rage(e){
    var t = Date.now(); clicks = clicks.filter(function(c){ return t - c.t < 1000 }); clicks.push({t:t, x:e.clientX, y:e.clientY});
    var near = clicks.filter(function(c){ return Math.abs(c.x - e.clientX) < 30 && Math.abs(c.y - e.clientY) < 30 });
    if(near.length >= 3 && raged < 3){ raged++; clicks = []; var row = base('rage', 'repeat-clicks'); row.detail = cut(label(e.target), 300); save('events', row) }
  }
  var errs = 0;
  function oops(text){ if(errs >= 5) return; errs++; var row = base('error', 'error'); row.detail = cut(text, 300); save('events', row) }
  addEventListener('error', function(e){
    var t = e.target;
    if(t && t !== window && (t.tagName === 'IMG' || t.tagName === 'SCRIPT' || t.tagName === 'LINK')) oops('Broken file: ' + (t.currentSrc || t.src || t.href || '').replace(location.origin, ''));
    else if(e.message) oops('Script error: ' + e.message + (e.filename ? ' (' + e.filename.replace(location.origin, '') + ':' + e.lineno + ')' : ''));
  }, true);
  addEventListener('unhandledrejection', function(e){ oops('Script error: ' + ((e.reason && (e.reason.message || e.reason)) || 'a promise failed')) });
  var lcp = 0; try{ new PerformanceObserver(function(l){ var es = l.getEntries(); if(es.length) lcp = Math.round(es[es.length - 1].startTime) }).observe({type:'largest-contentful-paint', buffered:true}) }catch(e){}

  // ---- time in view and scroll depth, sent once when the visitor leaves, with the page's load speed
  var shown = 0, since = document.hidden ? 0 : Date.now(), deepest = 0, sent = false;
  function depth(){ var h = document.documentElement.scrollHeight - innerHeight; deepest = Math.max(deepest, h > 0 ? Math.round(scrollY / h * 100) : 100) }
  addEventListener('scroll', depth, {passive:true}); depth();
  document.addEventListener('visibilitychange', function(){ if(document.hidden){ if(since){ shown += Date.now() - since; since = 0 } leave() } else { since = Date.now(); sent = false } });
  addEventListener('pagehide', leave);
  function leave(){ if(sent) return; if(since){ shown += Date.now() - since; since = Date.now() } var secs = Math.min(86400, Math.round(shown / 1000)); if(secs < 1) return; sent = true;
    var row = base('engage', page); row.secs = secs; row.depth = Math.min(100, deepest);
    var ms = lcp || Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0); if(ms > 0 && ms < 600000) row.ms = ms;
    save('events', row); shown = 0; touch() }

  // ---- the notice (Mel, 30 October: "a notification ... like a normal thing that pops up on sites")
  if(choice || bot) return;
  function notice(){
    var css = document.createElement('style');
    css.textContent = '.cvp-note{position:fixed;left:16px;bottom:16px;z-index:80;max-width:380px;padding:16px 16px 14px;border:1.5px solid #0A0B10;border-radius:16px;background:#fff;box-shadow:5px 5px 0 #0047FF;font:400 14px/1.45 Outfit,system-ui,sans-serif;color:#0A0B10}'
      + '.cvp-note p{margin:0}.cvp-note b{font-weight:700}.cvp-note .row{display:flex;gap:8px;margin-top:12px}'
      + '.cvp-note button{border:0;border-radius:999px;padding:9px 16px;font:700 13.5px/1 Outfit,system-ui,sans-serif;cursor:pointer}'
      + '.cvp-note .ok{background:#0A0B10;color:#fff}.cvp-note .no{background:#fff;color:#0A0B10;border:1.5px solid #E5E7EB}'
      + '.cvp-note button:focus-visible{outline:2px solid #0047FF;outline-offset:2px}'
      + '@media (max-width:520px){.cvp-note{left:16px;right:16px;max-width:none}}';
    document.head.appendChild(css);
    var box = document.createElement('div'); box.className = 'cvp-note'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'How this site counts visits');
    box.innerHTML = '<p><b>We count visits</b> and note the city they come from, so we can make this site better. No ads, nothing sold, and we never keep your internet address.</p>'
      + '<div class="row"><button type="button" class="ok">OK</button><button type="button" class="no">No thanks</button></div>';
    document.body.appendChild(box);
    box.querySelector('.ok').onclick = function(){ put(localStorage, 'cvp-consent', 'yes'); box.remove() };
    box.querySelector('.no').onclick = function(){ put(localStorage, 'cvp-consent', 'no');
      ['cvp-seen','cvp-last'].forEach(function(k){ try{ localStorage.removeItem(k) }catch(e){} }); try{ sessionStorage.removeItem('cvp-geo') }catch(e){}
      full = false; geo = null; box.remove() };
  }
  if(document.body) notice(); else document.addEventListener('DOMContentLoaded', notice);
})();
