/* Utilidades generales: fechas, texto, ids, captura rápida */
'use strict';

const U = (() => {
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  let _hoyOverride = null; // solo para pruebas
  const hoy = () => _hoyOverride || iso(new Date());
  const ahora = () => new Date().toISOString();
  const hora = (ts) => { const d = ts ? new Date(ts) : new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDias = (a, b) => Math.round((parse(b) - parse(a)) / 86400000); // b - a
  const diaSemana = s => parse(s).getDay(); // 0 dom
  const lunesDe = s => { const w = diaSemana(s); return addDias(s, w === 0 ? -6 : 1 - w); };
  const fCorta = s => { if (!s) return ''; const d = parse(s); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
  const fDia = s => { if (!s) return ''; const d = parse(s); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
  const fLarga = s => { const d = parse(s); const t = `${DIAS_L[d.getDay()]} ${d.getDate()} de ${MESES_L[d.getMonth()]}`; return t[0].toUpperCase() + t.slice(1); };
  const fRelativa = s => {
    if (!s) return 'Sin fecha';
    const n = diffDias(hoy(), s);
    if (n === 0) return 'Hoy';
    if (n === 1) return 'Mañana';
    if (n === -1) return 'Ayer';
    if (n > 1 && n < 7) { const t = DIAS[diaSemana(s)]; return t[0].toUpperCase() + t.slice(1) + ' ' + parse(s).getDate(); }
    return fCorta(s);
  };
  const fTs = ts => { if (!ts) return ''; const d = new Date(ts); const s = iso(d); return (s === hoy() ? 'Hoy' : fCorta(s)) + ' · ' + hora(ts); };
  const dateOfTs = ts => ts ? iso(new Date(ts)) : null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '');
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clone = o => JSON.parse(JSON.stringify(o));
  const linkify = s => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  /* ---------- Captura rápida ----------
     #proyecto  !alta|!media|!baja  @hoy|@mañana|@viernes|@15/11|@2026-11-15  >persona  *diario|*habiles|*semanal|*mensual */
  function fechaToken(t) {
    const x = norm(t);
    const h = hoy();
    if (x === 'hoy') return h;
    if (x === 'manana') return addDias(h, 1);
    if (x === 'pasado' || x === 'pasadomanana') return addDias(h, 2);
    if (x === 'semana' || x === 'proximasemana') return addDias(lunesDe(h), 7);
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const cortos = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    let idx = dias.indexOf(x); if (idx < 0) idx = cortos.indexOf(x);
    if (idx >= 0) { const w = diaSemana(h); let n = (idx - w + 7) % 7; if (n === 0) n = 7; return addDias(h, n); }
    let m = x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
    m = x.match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/);
    if (m) {
      let y = m[3] ? +m[3] : +h.slice(0, 4); if (y < 100) y += 2000;
      let s = `${y}-${pad(+m[2])}-${pad(+m[1])}`;
      if (!m[3] && s < h) s = `${y + 1}-${pad(+m[2])}-${pad(+m[1])}`;
      return s;
    }
    m = x.match(/^(\d{1,2})$/);
    if (m) {
      const d = +m[1]; const hd = parse(h);
      let c = new Date(hd.getFullYear(), hd.getMonth(), d);
      if (iso(c) < h) c = new Date(hd.getFullYear(), hd.getMonth() + 1, d);
      return iso(c);
    }
    return null;
  }

  function parseCaptura(texto) {
    const r = { titulo: '', proyecto: null, prioridad: null, fecha: null, persona: null, recurrencia: null, etiquetas: [] };
    const restantes = [];
    const tokens = texto.trim().split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.length > 1 && t[0] === '#') { r.proyecto = t.slice(1).replace(/_/g, ' '); continue; }
      if (t.length > 1 && t[0] === '!') {
        const p = norm(t.slice(1));
        if (['alta', 'a', 'urgente'].includes(p)) { r.prioridad = 'alta'; continue; }
        if (['media', 'm'].includes(p)) { r.prioridad = 'media'; continue; }
        if (['baja', 'b'].includes(p)) { r.prioridad = 'baja'; continue; }
      }
      if (t.length > 1 && t[0] === '@') { const f = fechaToken(t.slice(1)); if (f) { r.fecha = f; continue; } }
      if (t.length > 1 && t[0] === '>') { r.persona = t.slice(1).replace(/_/g, ' '); continue; }
      if (t.length > 1 && t[0] === '*') {
        const p = norm(t.slice(1));
        const map = { diario: 'diaria', diaria: 'diaria', habiles: 'habiles', habil: 'habiles', semanal: 'semanal', mensual: 'mensual' };
        if (map[p]) { r.recurrencia = map[p]; continue; }
      }
      if (t.length > 1 && t[0] === '+') { r.etiquetas.push(t.slice(1)); continue; }
      restantes.push(t);
    }
    r.titulo = restantes.join(' ').trim();
    return r;
  }

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  return { MESES, MESES_L, DIAS, DIAS_L, pad, iso, parse, hoy, ahora, hora, addDias, diffDias, diaSemana, lunesDe,
    fCorta, fDia, fLarga, fRelativa, fTs, dateOfTs, esc, norm, slug, uid, clone, linkify, parseCaptura, fechaToken, debounce,
    _setHoy: v => { _hoyOverride = v; } };
})();
