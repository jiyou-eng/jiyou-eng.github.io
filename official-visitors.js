/* Daily anonymous browser count for JIYOU's official domain only. */
(() => {
  'use strict';
  if (location.protocol !== 'https:' || !['www.jiyoueng.com', 'jiyoueng.com'].includes(location.hostname)) return;
  if (navigator.webdriver || /bot|crawler|spider|headless|slurp|preview/i.test(navigator.userAgent)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  function collect() {
    if (document.visibilityState !== 'visible') return;
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part = name => parts.find(p => p.type === name).value;
    const day = `${part('year')}-${part('month')}-${part('day')}`;
    const key = 'jiyou:daily-visitor:v1';
    try {
      let item = JSON.parse(localStorage.getItem(key) || 'null');
      if (!item || item.day !== day) {
        item = {day, visitor:crypto.randomUUID(), sent:false};
        localStorage.setItem(key, JSON.stringify(item));
      }
      if (item.sent) return;
      fetch('https://jiyoueng-internal-portal.vercel.app/website/collect/', {
        method:'POST', credentials:'omit', referrerPolicy:'no-referrer', keepalive:true,
        headers:{'Content-Type':'text/plain'}, body:JSON.stringify({day, visitor:item.visitor})
      }).then(response => {
        if (response.ok) {
          const current = JSON.parse(localStorage.getItem(key) || 'null');
          if (current && current.day === day && current.visitor === item.visitor) {
            current.sent = true; localStorage.setItem(key, JSON.stringify(current));
          }
        }
      }).catch(() => {});
    } catch (_) { /* Storage blocked: do not guess a visitor identity. */ }
  }
  collect();
  document.addEventListener('visibilitychange', collect);
})();
