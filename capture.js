// Capture, for the site dashboard. Every form on the site saves what the visitor sends (cvpSend); the visitor's own
// email app opens only if they ask for a copy (Mel, 31 October: the site's own Send does the sending). It also records visits and how the site works, the way proven privacy-first tools do
// (Plausible, Fathom, GA4's base fields), checked against them on 31 October 2026 (Mel: "I am concerned that we are
// improperly doing things and overlooking standard and proven baseline methodologies").
//
// What it records, all from the browser itself: page, visit (a random ID that ends after 30 minutes idle), landing
// page, source (the ?from= tag, UTM tags, the referring site and its type), device, browser, system, screen size,
// language, time zone, local day and hour, approximate city, the company behind a company network (internet
// providers and cloud networks are dropped), the answers a visitor taps in the profile, time in view, scroll depth,
// load speed and problems. Never: typed text that was not sent, a lasting visitor ID, fingerprinting, cookies of
// our own. Decline keeps counting the visit but drops location, network company and the device's "seen before" date.
(function(){
  var SUPABASE_URL = 'https://oilvzabkaoiliabefwrh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_tFw1kzlY87RsUElfZPNZlA_UoRKk3nr';  // publishable key: the database only lets it add rows
  var CLARITY_ID = 'z6bzag7hip';                                                    // Microsoft Clarity project ID; loads only after Accept
  var preview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var live = !!(SUPABASE_URL && SUPABASE_KEY) && !preview;
  window.CVP_DB = live ? {url:SUPABASE_URL, key:SUPABASE_KEY} : {url:'', key:''};
  window.CVP_CLARITY = CLARITY_ID;
  // a page can name itself (404.html does, since GitHub Pages serves it at whatever missing address was asked for)
  var page = window.CVP_PAGE || (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';
  if(page === 'admin') return;   // the dashboard itself is never counted and never touches the visit flags

  function get(s, k){ try{ return s.getItem(k) }catch(e){ return null } }
  function put(s, k, v){ try{ s.setItem(k, v) }catch(e){} }
  function del(s, k){ try{ s.removeItem(k) }catch(e){} }
  function cut(s, n){ s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s }
  function rid(){ var a = new Uint8Array(9); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function(b){ return ('0' + b.toString(16)).slice(-2) }).join('') }

  // ---- who is not counted: bots and link previews, and devices the dashboard marked as the team's own
  var ua = navigator.userAgent || '';
  var bot = navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|whatsapp|slackbot|discord|telegram|bingpreview|vercel|uptime|monitor|python|curl|wget|httpclient|scrapy|phantom|puppeteer|playwright/i.test(ua);
  var team = get(localStorage, 'cvp-team') === '1';
  var choice = get(localStorage, 'cvp-consent');              // 'yes', 'no' or nothing yet
  var full = choice !== 'no';                                  // location, network company and device memory, unless declined
  var skip = bot || team || window.__cvpSkip;

  // resolves true once the row is stored (or deliberately not stored: bots and the team's own devices), false if it failed
  function save(table, row){
    if(skip) return Promise.resolve(true);
    row.created_at = new Date().toISOString();                 // the database replaces this with its own clock
    if(live){
      try{ return fetch(SUPABASE_URL + '/rest/v1/' + table, {method:'POST', keepalive:true,
        headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body: JSON.stringify(row)}).then(function(r){ return r.ok }, function(){ return false }) }catch(e){ return Promise.resolve(false) }
    }
    try{ var k = 'cvp-local-' + table, a = JSON.parse(localStorage.getItem(k) || '[]'); a.push(row); localStorage.setItem(k, JSON.stringify(a.slice(-2000))) }catch(e){}
    return Promise.resolve(true);
  }

  // ---- the visitor's own clock: day boundaries at their midnight, not UTC's
  var d0 = new Date(), pad = function(n){ return ('0' + n).slice(-2) };
  var today = d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate());
  var tz = ''; try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' }catch(e){}

  // ---- the visit: a random ID that lasts until 30 minutes without activity. Accepted or not decided yet: kept on the
  // device so two tabs are one visit. Declined: kept in the tab only, so it ends when the tab closes.
  var store = full ? localStorage : sessionStorage, now = Date.now();
  var last = +get(store, 'cvp-last') || 0, visitId = get(store, 'cvp-visit'), visitStart = !visitId || now - last > 30 * 60000;
  if(visitStart){ visitId = rid(); put(store, 'cvp-visit', visitId) }
  put(store, 'cvp-last', String(now));
  function touch(){ put(store, 'cvp-last', String(Date.now())) }

  // ---- once a day per device, and the date it was last here (accepted only; declined visitors count once per tab)
  var newToday, returning = false, prevDay = null;
  if(full){
    var seen = get(localStorage, 'cvp-seen'); newToday = seen !== today; returning = !!seen && seen !== today;
    if(newToday && /^\d{4}-\d{2}-\d{2}$/.test(seen || '')) prevDay = seen;
    put(localStorage, 'cvp-seen', today);
  } else { newToday = !get(sessionStorage, 'cvp-tab-seen'); put(sessionStorage, 'cvp-tab-seen', '1') }

  // ---- the source of the visit, fixed at its first page and carried to every page after it
  var q = new URLSearchParams(location.search), src = null;
  try{ src = JSON.parse(get(sessionStorage, 'cvp-src') || 'null') }catch(e){}
  var ref = '', inRef = ''; try{ var r = document.referrer && new URL(document.referrer); if(r){ if(r.host !== location.host) ref = r.host.replace(/^www\./,''); else inRef = r.pathname } }catch(e){}
  function refType(host, medium){
    if(/email|newsletter/i.test(medium || '')) return 'Email';
    if(/social/i.test(medium || '')) return 'Social';
    if(/cpc|paid|ppc|display/i.test(medium || '')) return 'Paid';
    if(!host) return medium ? 'Other' : 'Direct or email';
    if(/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex|startpage)\./i.test(host) && !/mail\./i.test(host)) return 'Search';
    if(/linkedin|lnkd\.in|facebook|fb\.|instagram|twitter|(^|\.)x\.com|t\.co$|reddit|youtube|tiktok|threads|pinterest/i.test(host)) return 'Social';
    if(/mail\.|outlook\.|proton|superhuman|hey\.com/i.test(host)) return 'Email';
    if(/chatgpt|openai|perplexity|claude\.ai|gemini|copilot/i.test(host)) return 'AI assistant';
    return 'Other site';
  }
  var hasTags = q.get('from') || q.get('utm_source') || q.get('utm_campaign');
  if(visitStart || !src || hasTags){
    src = {from: cut(q.get('from'), 80), utm_source: cut(q.get('utm_source'), 80), utm_medium: cut(q.get('utm_medium'), 80),
      utm_campaign: cut(q.get('utm_campaign'), 120), utm_content: cut(q.get('utm_content'), 80), utm_term: cut(q.get('utm_term'), 80),
      referrer: cut(ref, 120), ref_type: refType(ref, q.get('utm_medium')), landing: page};
    if(!visitStart && !hasTags && src.ref_type === 'Direct or email' && inRef) src.ref_type = 'Inside the site';
    put(sessionStorage, 'cvp-src', JSON.stringify(src));
  }

  // ---- the device, from the browser's own description of itself
  var device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'Tablet'
    : /Mobi|iPhone|iPod|Android/i.test(ua) ? 'Phone' : 'Desktop';
  var browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Other';
  var os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
    : /CrOS/.test(ua) ? 'ChromeOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';

  // ---- where, and the company behind a company network: one lookup per visit (accepted or undecided only).
  // Internet providers and mobile carriers name no company, so they are dropped; cloud and VPN networks are marked.
  var ISP = /comcast|xfinity|verizon|at&t|at ?& ?t|\batt\b|charter|spectrum|cox |cox communications|centurylink|lumen|frontier|optimum|altice|cablevision|t-mobile|tmobile|sprint|cellco|mediacom|windstream|rcn|astound|wideopenwest|\bwow\b|google fiber|starlink|space exploration|rogers|bell canada|telus|shaw|videotron|vodafone|british telecom|\bbt\b|sky uk|orange|telekom|telefonica|movistar|claro|telmex|cable communications|cablevision|broadband|wireless|telecommunications|telecom|mobility|cellular|internet service|fiber|fibre|hughes|viasat|earthlink|consolidated communications|tds telecom|brightspeed|ziply|metronet|google llc/i;
  var CLOUD = /amazon|aws|google cloud|microsoft|azure|digitalocean|linode|akamai|cloudflare|ovh|hetzner|oracle|fastly|zscaler|netskope|apple inc|icloud|private relay|choopa|vultr|leaseweb|m247|datacamp|ipxo|contabo|scaleway|alibaba|tencent|hostinger|godaddy|rackspace|nordvpn|expressvpn|mullvad|proton ag|cdn77/i;
  function company(org){ org = String(org || '').trim(); if(!org || ISP.test(org)) return null; if(CLOUD.test(org)) return 'cloud:' + cut(org, 100); return cut(org, 120) }
  var geo = null; try{ geo = JSON.parse(get(sessionStorage, 'cvp-geo') || 'null') }catch(e){}
  if(geo && !visitStart && !('org' in geo)) geo = null;
  var geoReady = (geo || !full || skip) ? Promise.resolve(geo) : new Promise(function(res){
    var done = false, fin = function(g){ if(done) return; done = true; geo = g || {}; put(sessionStorage, 'cvp-geo', JSON.stringify(geo)); res(geo) };
    setTimeout(function(){ fin(null) }, 1500);
    try{ fetch('https://get.geojs.io/v1/ip/geo.json').then(function(r){ return r.json() }).then(function(d){
      fin({city:cut(d.city,80), region:cut(d.region,80), country:cut(d.country_code,4), org:company(d.organization_name)}) }).catch(function(){ fin(null) }) }catch(e){ fin(null) }
  });

  var viewId = rid();
  function base(type, name){
    var row = {type:type, name:cut(name, 120), page:page, visit_id:visitId, view_id:viewId, from_tag:src.from, referrer:src.referrer, ref_type:src.ref_type,
      utm_source:src.utm_source, utm_medium:src.utm_medium, utm_campaign:src.utm_campaign, utm_content:src.utm_content, utm_term:src.utm_term, landing:src.landing,
      device:device, browser:browser, os:os, screen:screen.width ? screen.width + 'x' + screen.height : null, lang:cut(navigator.language, 20), tz:cut(tz, 60),
      local_day:today, local_hour:new Date().getHours(), weekday:new Date().getDay(), wide: innerWidth >= 960};
    if(full){ row.repeat_visit = returning; if(geo){ row.city = geo.city || null; row.region = geo.region || null; row.country = geo.country || null; row.net_org = geo.org || null } }
    for(var k in row) if(row[k] === '') row[k] = null;
    return row;
  }

  // ---- read what the visitor sent out of the email the site prepared
  var FREE = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|mac|aol|proton|protonmail|msn|comcast|verizon|att)\./i;
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
  function submission(url){
    var m = parse(url), body = m.body, subject = m.subject;
    var email = (body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0];
    if(/clairvistapartners\.com$/i.test(email)) email = '';
    var co = field(body, ['Company','Business','Brand']);
    if(!co && email){ var dm = email.split('@')[1]; if(dm && !FREE.test(dm)) co = dm.replace(/\.(com|co|net|org|io|us|biz)(\.[a-z]{2})?$/i,'') }
    var row = {page:page, kind:cut(subject.split(':')[0], 80), subject:cut(subject, 300), body:cut(body, 6000), email:cut(email, 200),
      name:cut(field(body, ['Name','Ask for']), 120), company:cut(co, 160), from_tag:src.from, referrer:src.referrer, utm_source:src.utm_source, utm_campaign:src.utm_campaign, visit_id:visitId};
    if(full && geo){ row.city = geo.city || null; row.region = geo.region || null; row.country = geo.country || null; row.net_org = geo.org || null }
    return row;
  }
  window.cvpMail = function(url){
    save('submissions', submission(url)); touch();
    if(!window.__cvpNoNav) location.href = url;
  };
  // the site's own Send: stores the message and tells the page whether it arrived; no email app opens
  window.cvpSend = function(url){
    var p = save('submissions', submission(url)); touch();
    return p;
  };

  // ---- the view: once per page load, never for a reload
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  var reload = nav.type === 'reload';
  geoReady.then(function(){
    if(reload) return;
    var row = base('view', page); row.visit_start = visitStart; row.new_today = newToday; if(newToday && prevDay) row.prev_day = prevDay;
    if(page === '404') row.detail = cut(location.pathname + (inRef ? ' from ' + inRef : ref ? ' from ' + ref : ''), 300);
    save('events', row);
  });

  // ---- the profile: each step once per page, and each tapped answer (never typed text)
  var stepsDone = {}, answered = {};
  // a named moment that is not a button press, with a short note; stored as a click so the database needs no change
  // (Mel, 31 October: where people drag the two characters)
  window.cvpTrack = function(name, detail){ var row = base('click', name); if(detail) row.detail = cut(detail, 300); save('events', row); touch() };
  window.cvpStep = function(name){ if(stepsDone[name]) return; stepsDone[name] = 1; save('events', base('step', name)); touch() };
  window.cvpAnswer = function(question, value){ var k = question + '=' + value; if(answered[k]) return; answered[k] = 1;
    var row = base('answer', question); row.answer = cut(value, 120); save('events', row); touch() };

  // ---- button presses (a double click counts once)
  var lastClick = {n:'', t:0};
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('[data-goatcounter-click],a[href^="mailto:"]');
    if(el){ var n = el.getAttribute('data-goatcounter-click') || 'email-link'; var t = Date.now();
      if(!(n === lastClick.n && t - lastClick.t < 800)) save('events', base('click', n)); lastClick = {n:n, t:t}; touch() }
    rage(e);
  }, true);

  // ---- site health: three fast clicks on one spot that is not meant for fast tapping, errors, broken files, speed
  var clicks = [], raged = 0, FAST_OK = '#gallery, .zone, .arrow, .pass, .chip, .eye, .heart, button.btn, .b-way, input, textarea, select, [data-fast-ok]';
  function label(el){ if(!el || !el.tagName) return ''; var t = (el.getAttribute('aria-label') || el.alt || el.textContent || '').trim().replace(/\s+/g,' ').slice(0, 40);
    return el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + (t ? ' "' + t + '"' : '') }
  function rage(e){
    if(e.target.closest && e.target.closest(FAST_OK)) return;
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

  // ---- time in view and scroll depth. Sent each time the page is hidden (the only signal phones reliably give),
  // always as the running total for this page view; the dashboard keeps the largest per page view.
  var shown = 0, since = document.hidden ? 0 : Date.now(), deepest = 0, lastSent = -1;
  function depth(){ var h = document.documentElement.scrollHeight - innerHeight; deepest = Math.max(deepest, h > 0 ? Math.round(scrollY / h * 100) : 100) }
  addEventListener('scroll', depth, {passive:true}); depth();
  function flush(){
    if(since){ shown += Date.now() - since; since = document.hidden ? 0 : Date.now() }
    var secs = Math.min(86400, Math.round(shown / 1000)); if(secs < 1 || secs === lastSent) return; lastSent = secs;
    var row = base('engage', page); row.secs = secs; row.depth = Math.min(100, deepest);
    var ms = lcp || Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0); if(ms > 0 && ms < 600000) row.ms = ms;
    save('events', row); touch();
  }
  document.addEventListener('visibilitychange', function(){ if(document.hidden) flush(); else since = Date.now() });
  addEventListener('pagehide', flush);

  // ---- Microsoft Clarity: recordings and heatmaps, only after Accept, tagged so a recording can be found by prospect
  function clarity(){
    if(!CLARITY_ID || !live || skip || get(localStorage, 'cvp-consent') === 'no' || window.clarity) return;
    (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}; t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y) })(window, document, 'clarity', 'script', CLARITY_ID);
    if(src.from) clarity('set', 'from', src.from);
    if(src.utm_campaign) clarity('set', 'campaign', src.utm_campaign);
    clarity('set', 'source', src.ref_type); clarity('set', 'landing', src.landing);
    geoReady.then(function(){ if(geo && geo.org && geo.org.indexOf('cloud:') !== 0) clarity('set', 'company', geo.org) });
  }
  clarity();

  // ---- the notice (Mel, 31 October: "way too in your face ... make this as subtle as possible while remaining legal"):
  // one small line at the foot of the first page, gone on OK or on a second page; turning analytics off lives on the privacy page
  window.cvpOptOut = function(){ put(localStorage, 'cvp-consent', 'no'); ['cvp-seen','cvp-last','cvp-visit'].forEach(function(k){ del(localStorage, k) }); del(sessionStorage, 'cvp-geo') };
  window.cvpOptIn = function(){ put(localStorage, 'cvp-consent', 'yes') };
  if(choice || bot) return;
  put(localStorage, 'cvp-consent', 'seen');
  function notice(){
    var css = document.createElement('style');
    css.textContent = '.cvp-note{position:fixed;left:12px;bottom:12px;z-index:80;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);padding:7px 8px 7px 12px;border:1px solid #E5E7EB;border-radius:999px;background:rgba(255,255,255,.96);font:400 12px/1.3 Outfit,system-ui,sans-serif;color:#5B5F66;box-shadow:0 2px 10px rgba(10,11,16,.06);transition:opacity .3s ease}'
      + '.cvp-note a{color:#5B5F66;text-decoration:underline;text-underline-offset:2px}.cvp-note button{border:0;border-radius:999px;background:#F3F4F6;color:#0A0B10;padding:4px 10px;font:600 12px/1.2 Outfit,system-ui,sans-serif;cursor:pointer}'
      + '.cvp-note a:focus-visible,.cvp-note button:focus-visible{outline:2px solid #0047FF;outline-offset:2px}';
    document.head.appendChild(css);
    var box = document.createElement('div'); box.className = 'cvp-note'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Cookie notice');
    box.innerHTML = '<span>We use cookies for analytics. <a href="privacy.html">Privacy</a></span><button type="button">OK</button>';
    document.body.appendChild(box);
    box.querySelector('button').onclick = function(){ put(localStorage, 'cvp-consent', 'yes'); box.style.opacity = '0'; setTimeout(function(){ box.remove() }, 300) };
  }
  if(document.body) notice(); else document.addEventListener('DOMContentLoaded', notice);
})();
