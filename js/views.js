/* Vistas: cada función devuelve HTML. Los eventos se manejan en app.js mediante data-a (acciones). */
'use strict';

const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  board: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12l5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  note: '<path d="M4 6h16M4 12h16M4 18h10"/>', clip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  sub: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', down: '<path d="M6 9l6 6 6-6"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>', sort: '<path d="M8 4v16M4 16l4 4 4-4"/>', sortup: '<path d="M8 20V4M4 8l4-4 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', review: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>',
  folders: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 11h18"/>', pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>',
  play: '<path d="M7 5l12 7-12 7z"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', pause: '<path d="M8 5v14M16 5v14"/>', open: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const V = (() => {
  const e = U.esc;
  const M = () => Model;
  const D = () => Model.datos;

  /* ---------- Piezas ---------- */
  function chip(pid) {
    const p = M().proyecto(pid);
    return p ? `<span class="chip" style="--c:${e(p.color)}">${e(p.nombre)}</span>` : '';
  }
  const pill = s => `<span class="pill st-${s}">${EST[s]}</span>`;
  const prioTxt = p => p === 'alta' ? '<span class="badge red">Alta</span>' : (p === 'media' ? '<span class="badge gray">Media</span>' : (p === 'baja' ? '<span class="badge gray">Baja</span>' : ''));
  function metaTarea(t, opts = {}) {
    const out = [];
    if (!opts.sinProyecto) out.push(chip(t.proyectoId));
    if (t.urgente && M().enDia(t.id)) out.push('<span class="badge red">' + ic('bolt', 's14') + 'Urgente</span>');
    if (M().vencida(t)) out.push(`<span class="badge red">Venció ${e(U.fRelativa(t.fecha).toLowerCase())}</span>`);
    if (t.estado === 'espera' && t.espera) {
      const dias = U.diffDias(t.espera.desde || U.hoy(), U.hoy());
      out.push(`<span class="badge amb">${ic('clock', 's14')}En espera${t.espera.persona ? ' · ' + e(t.espera.persona) : ''} · ${dias} ${dias === 1 ? 'día' : 'días'}</span>`);
      if (t.espera.seguimiento && t.espera.seguimiento <= U.hoy()) out.push('<span class="badge amb">Preguntar hoy</span>');
    }
    if (t.recurrenteId) { const r = M().recurrente(t.recurrenteId); out.push(`<span class="m rec">${ic('repeat', 's14')}${e(r ? M().freqTexto(r) : 'Recurrente')}</span>`); }
    if (t.subtareas.length) out.push(`<span class="m">${ic('sub', 's14')}${t.subtareas.filter(s => s.hecha).length}/${t.subtareas.length}</span>`);
    const notas = t.bitacora.filter(b => b.tipo === 'nota').length;
    if (notas) out.push(`<span class="m">${ic('note', 's14')}${notas}</span>`);
    if (t.adjuntos.length) out.push(`<span class="m">${ic('clip', 's14')}${t.adjuntos.length}</span>`);
    if (opts.estado) out.push(pill(t.estado));
    return out.join('');
  }
  function checkBtn(t) {
    const done = t.estado === 'hecho';
    return `<button class="chk ${done ? 'done' : ''}" data-a="toggleHecho" data-id="${t.id}" aria-label="${done ? 'Reabrir' : 'Marcar como completada'}"><span>${done ? ic('check', 's14') : ''}</span></button>`;
  }
  function meter(n, max) {
    let s = ''; for (let i = 0; i < Math.max(max, n); i++) s += `<span class="${i < n ? (i >= max ? 'over' : 'on') : ''}"></span>`;
    return `<div class="meter" aria-hidden="true">${s}</div>`;
  }
  function viewToggle(act) {
    const v = [['grid', 'Cuadrícula', 'table'], ['tablero', 'Tablero', 'board'], ['cal', 'Calendario', 'cal']];
    return `<div class="seg" role="group" aria-label="Vista">${v.map(([k, l, i]) => `<a href="#/${k}" class="${k === act ? 'on' : ''}">${ic(i, 's16')}${l}</a>`).join('')}</div>`;
  }
  function proySelect(val, attrs) {
    const ps = D().proyectos.filter(p => !p.archivado || p.id === val);
    return `<select class="inp" ${attrs}><option value="">Sin proyecto</option>${ps.map(p => `<option value="${p.id}" ${p.id === val ? 'selected' : ''}>${e(p.nombre)}</option>`).join('')}</select>`;
  }

  /* ---------- Barra lateral ---------- */
  function sidebar(UI) {
    const d = D(), ts = d.tareas;
    const n = { midia: d.plan.items.filter(id => { const t = M().get(id); return t && t.estado !== 'hecho'; }).length,
      bandeja: ts.filter(t => t.estado === 'bandeja').length, tareas: ts.filter(t => M().activa(t)).length,
      espera: ts.filter(t => t.estado === 'espera').length, parking: ts.filter(t => t.estado === 'parking').length, rec: d.recurrentes.filter(r => r.activa).length };
    const seg = M().seguimientosHoy().length;
    const it = (k, href, label, icon, cnt, warn, on) => `<a class="nav-item ${on ? 'on' : ''}" href="#/${href}">${ic(icon)}<span>${label}</span>${cnt ? `<span class="cnt ${warn ? 'warn' : ''}">${cnt}</span>` : ''}</a>`;
    const v = UI.vista;
    const fij = d.proyectos.filter(p => p.fijado && !p.archivado);
    return `<nav class="side" aria-label="Navegación principal">
      <div class="brand"><div class="brand-logo">${ic('check', 's16')}</div><b>Mi Planner</b><span class="esp">${e(d.config.espacio)}</span></div>
      <button class="side-search" data-a="buscar">${ic('search', 's16')}<span>Buscar</span><kbd>Ctrl K</kbd></button>
      ${it('midia', 'midia', 'Mi día', 'sun', n.midia, false, v === 'midia' || v === 'planear')}
      ${it('bandeja', 'bandeja', 'Bandeja', 'inbox', n.bandeja, false, v === 'bandeja')}
      ${it('tareas', 'grid', 'Tareas', 'table', n.tareas, false, ['grid', 'tablero', 'cal'].includes(v))}
      ${it('espera', 'espera', 'En espera', 'clock', n.espera, seg > 0, v === 'espera')}
      ${it('parking', 'parking', 'Parking Lot', 'parking', n.parking, false, v === 'parking')}
      ${it('rec', 'recurrentes', 'Recurrentes', 'repeat', n.rec, false, v === 'recurrentes')}
      <div class="side-label">Proyectos fijados</div>
      ${fij.map(p => { const c = ts.filter(t => t.proyectoId === p.id && M().activa(t)).length;
        return `<button class="nav-item side-proj" data-a="filtrarProyecto" data-id="${p.id}"><span class="dot" style="background:${e(p.color)}"></span><span>${e(p.nombre)}</span>${c ? `<span class="cnt">${c}</span>` : ''}</button>`; }).join('') || '<span class="muted small" style="padding:0 10px">Fija proyectos desde Proyectos.</span>'}
      <a class="nav-item ${v === 'proyectos' ? 'on' : ''}" href="#/proyectos">${ic('folders', 's16')}<span>Todos los proyectos (${d.proyectos.filter(p => !p.archivado).length})</span></a>
      <div class="side-foot">
        <div class="row" title="Carpeta de datos">${ic('folder', 's16')}<span>${e(M().backend?.nombre || '')}</span></div>
        <div class="row" id="save-status">${estadoGuardado()}</div>
        <button class="btn link sm" data-a="cambiarCarpeta" style="align-self:flex-start;padding:2px 0">Cambiar carpeta</button>
      </div>
    </nav>`;
  }
  function estadoGuardado() {
    const s = M().estadoGuardado;
    if (s.errorGuardado) return `<span class="err"></span><span>Error al guardar: ${e(s.errorGuardado)}</span>`;
    if (!s.ultimoGuardado) return '<span class="ok"></span><span>Listo</span>';
    const seg = Math.round((Date.now() - s.ultimoGuardado) / 1000);
    return `<span class="ok"></span><span>Guardado ${seg < 5 ? 'ahora' : seg < 60 ? `hace ${seg} s` : `a las ${U.hora(new Date(s.ultimoGuardado).toISOString())}`}</span>`;
  }

  /* ---------- Mi día ---------- */
  function filaDia(t, n) {
    const done = t.estado === 'hecho';
    let right = '';
    if (done) right = `<span>${U.hora(t.completada)}</span>`;
    else { right = prioTxt(t.prioridad); if (t.fecha && !M().vencida(t)) right += `<span>${e(U.fRelativa(t.fecha))}</span>`; }
    return `<div class="trow ${done ? 'done' : ''} ${t.estado === 'espera' ? 'wait' : ''} ${t.urgente ? 'urg' : ''}" draggable="true" data-drag="dia" data-id="${t.id}">
      <span class="grip" title="Arrastra para reordenar">${ic('grip', 's16')}</span><span class="num">${n}</span>${checkBtn(t)}
      <div class="body"><button class="ttl" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button><div class="meta">${metaTarea(t)}</div></div>
      <div class="right">${right}<button class="iconbtn" data-a="quitarDia" data-id="${t.id}" title="Quitar de Mi día" aria-label="Quitar de Mi día">${ic('x', 's16')}</button></div>
    </div>`;
  }
  function miDia(UI) {
    const d = D(), items = d.plan.items.map(id => M().get(id)).filter(Boolean);
    const hechas = items.filter(t => t.estado === 'hecho').length;
    const usadas = M().prioridadesUsadas(), max = d.config.maxPrioridades;
    let lista;
    if (!items.length) lista = `<div class="empty">Tu día está vacío. Escribe arriba, o usa <b>Planear el día</b> para elegir de tus pendientes.</div>`;
    else if (!UI.diaAgrupar) lista = items.map((t, i) => filaDia(t, i + 1)).join('');
    else {
      const g = [['Vencidas', 'var(--red)', items.filter(t => M().vencida(t) && t.estado !== 'espera')],
        ['Hoy', 'var(--ink)', items.filter(t => !M().vencida(t) && !['espera', 'hecho'].includes(t.estado))],
        ['En espera', 'var(--amb)', items.filter(t => t.estado === 'espera')], ['Completadas hoy', 'var(--grn)', items.filter(t => t.estado === 'hecho')]];
      lista = g.filter(x => x[2].length).map(([l, c, ts]) => `<div class="sec-title" style="color:${c};margin-top:8px">${l}<span class="n">${ts.length}</span></div>${ts.map(t => filaDia(t, items.indexOf(t) + 1)).join('')}`).join('');
    }
    const prox = [];
    for (let i = 1; i <= 7; i++) {
      const f = U.addDias(U.hoy(), i);
      const ts = d.tareas.filter(t => M().activa(t) && (t.fecha === f || (t.estado === 'espera' && t.espera?.seguimiento === f)));
      if (ts.length) prox.push(`<div class="r"><b>${e(U.fRelativa(f))}</b><span>${ts.slice(0, 3).map(t => e(t.titulo)).join(' · ')}${ts.length > 3 ? ` (+${ts.length - 3})` : ''}</span></div>`);
    }
    const est = M().estancadas().length;
    const bandeja = d.tareas.filter(t => t.estado === 'bandeja').length;
    const diasPark = U.diffDias(d.config.parkingRevisado || U.hoy(), U.hoy());
    const nPark = d.tareas.filter(t => t.estado === 'parking').length;
    return `
    <div class="head"><div><h1>Mi día</h1><p class="sub">${e(U.fLarga(U.hoy()))}${d.plan.planeadoA ? ` · plan hecho a las ${e(d.plan.planeadoA)}` : ''}</p></div>
      <div class="tools"><a class="btn" href="#/planear">${ic('edit', 's16')}${d.plan.planeadoA ? 'Ajustar plan' : 'Planear el día'}</a>
      <button class="btn danger" data-a="urgencia">${ic('bolt', 's16')}Urgencia</button></div></div>
    <div><label class="sr" for="cap-dia">Agregar tarea a Mi día</label>
      <div class="capture">${ic('plus', 's20')}<input id="cap-dia" data-enter="capturaDia" autocomplete="off" placeholder="Agregar a Mi día…  ej. Revisar token OFC #oauth !alta @viernes"><kbd>Enter</kbd></div>
      <div class="hints hide-cel" style="margin-top:6px"><span><b>#proyecto</b></span><span><b>!alta</b> / !media / !baja</span><span><b>@viernes</b> / @15/11</span><span><b>&gt;persona</b> la deja en espera</span><span><b>*diario</b> / *habiles / *semanal la vuelve recurrente</span><span class="solo-teclado"><b>N</b> captura rápida desde cualquier pantalla</span></div></div>
    ${UI.movil.length ? `<div class="banner movil">${ic('phone', 's20')}<div class="txt"><b>${UI.movil.length} ${UI.movil.length === 1 ? 'nota nueva' : 'notas nuevas'} desde el celular</b><span class="small">${UI.movil.slice(0, 3).map(x => '“' + e(x) + '”').join(' · ')}${UI.movil.length > 3 ? ' …' : ''}</span></div><button class="btn ok sm" data-a="importarMovil">Pasar a Bandeja</button></div>` : ''}
    ${!d.plan.planeadoA ? `<div class="banner plan">${ic('sun', 's20')}<div class="txt"><b>Aún no planeas tu día</b><span class="small hide-cel">Revisa lo que quedó de ayer, lo que vence y tus seguimientos. Toma unos 2 minutos.</span></div><a class="btn pri sm" href="#/planear">Planear el día</a></div>` : ''}
    <div class="cols2"><div class="col-main">
      <div class="list-head"><h2 class="sec-title">Mi lista de hoy</h2><span class="muted small hide-cel">Arrastra para ordenar; las completadas se quedan donde las dejes</span>
        <div class="seg" style="margin-left:auto"><button class="${!UI.diaAgrupar ? 'on' : ''}" data-a="diaAgrupar" data-v="0">Orden manual</button><button class="${UI.diaAgrupar ? 'on' : ''}" data-a="diaAgrupar" data-v="1">Agrupar por estado</button></div></div>
      <div id="lista-dia" style="display:flex;flex-direction:column;gap:8px">${lista}</div>
    </div>
    <aside aria-label="Resumen del día">
      <div class="card"><div style="display:flex;justify-content:space-between"><span class="lab">Prioridades del día</span><b>${usadas} / ${max}</b></div>${meter(usadas, max)}
        <span class="muted small">${usadas >= max ? 'Llegaste al límite. Las urgencias no cuentan.' : `Quedan ${max - usadas} lugares. Las urgencias no cuentan.`}</span></div>
      <div class="card"><span class="lab">Progreso de hoy</span><div><span style="font-size:28px;font-weight:700">${hechas}</span> <span class="muted">de ${items.length} tareas</span></div>
        <div class="bar"><div style="width:${items.length ? Math.round(hechas / items.length * 100) : 0}%"></div></div></div>
      <div class="card"><div style="display:flex;align-items:center;gap:8px;font-weight:600">${ic('cal')}Próximos días</div>
        <div class="mini-list">${prox.join('') || '<span class="muted">Nada programado en los próximos 7 días.</span>'}</div><a href="#/cal" class="small" style="font-weight:600">Ver calendario</a></div>
      ${est ? `<div class="card" style="border-color:var(--ambl)"><div style="display:flex;align-items:center;gap:8px;font-weight:600;color:var(--amb)">${ic('alert')}Necesitan atención</div>
        <span class="small">${est} ${est === 1 ? 'tarea' : 'tareas'} sin movimiento en más de ${d.config.diasEstancada} días.</span><button class="btn link sm" style="align-self:flex-start;padding:0" data-a="verEstancadas">Revisar estancadas</button></div>` : ''}
      ${bandeja ? `<div class="card"><div style="display:flex;align-items:center;gap:8px;font-weight:600">${ic('inbox')}Bandeja</div><span class="small">${bandeja} sin clasificar.</span><a href="#/bandeja" class="small" style="font-weight:600">Clasificar</a></div>` : ''}
      ${nPark && diasPark >= 30 ? `<div class="card"><div style="display:flex;align-items:center;gap:8px;font-weight:600">${ic('parking')}Parking Lot</div><span class="small">Han pasado ${diasPark} días desde la última revisión (${nPark} en espera de arrancar).</span><a href="#/parking" class="small" style="font-weight:600">Revisar</a></div>` : ''}
    </aside></div>`;
  }

  /* ---------- Planear ---------- */
  function drow(t, botones, sub) {
    return `<div class="drow"><div class="info"><button class="ttl" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button><div class="meta">${chip(t.proyectoId)}${sub ? `<span>${sub}</span>` : ''}</div></div><div class="acts">${botones}</div></div>`;
  }
  function paso(n, titulo, sub, cuerpo, hecho) {
    return `<section class="step ${hecho ? 'done' : ''}"><div class="step-h"><span class="step-n">${hecho ? ic('check', 's14') : n}</span><div><h2>${titulo}</h2><span class="muted small">${sub}</span></div></div>${cuerpo}</section>`;
  }
  const reprog = t => `<span class="pop-wrap"><button class="btn sm" data-a="abrirFecha">Reprogramar</button><input type="date" class="sr" data-ch="reprogramar" data-id="${t.id}" aria-label="Nueva fecha para ${e(t.titulo)}"></span>`;
  function planear() {
    const d = D();
    const ayer = M().pendientesAyer();
    const recs = d.plan.items.map(M().get).filter(t => t && t.recurrenteId && t.instanciaFecha === U.hoy() && t.estado !== 'hecho');
    const vence = M().venceHoyOAntes();
    const segs = M().seguimientosHoy();
    const bandeja = d.tareas.filter(t => t.estado === 'bandeja').length;
    const yaListadas = new Set([...ayer, ...vence].map(t => t.id));
    const backlog = d.tareas.filter(t => ['porhacer', 'encurso'].includes(t.estado) && !M().enDia(t.id) && !yaListadas.has(t.id))
      .sort((a, b) => (a.prioridad === 'alta' ? 0 : 1) - (b.prioridad === 'alta' ? 0 : 1) || (a.fecha || '9999').localeCompare(b.fecha || '9999')).slice(0, 12);
    const items = d.plan.items.map(M().get).filter(Boolean);
    const usadas = M().prioridadesUsadas(), max = d.config.maxPrioridades;
    const s1 = paso(1, ayer.length ? `Quedaron ${ayer.length} pendientes de tu último día` : 'Nada pendiente de tu último día', 'Decide cada uno: no se arrastran solos',
      ayer.map(t => drow(t, `<button class="btn pri sm" data-a="planHoy" data-id="${t.id}">Pasar a hoy</button>${reprog(t)}<button class="btn ghost sm" data-a="planSoltar" data-id="${t.id}">Soltar</button><button class="btn ghost sm" data-a="planParking" data-id="${t.id}">Al Parking Lot</button>`,
        `${EST[t.estado]}${t.fecha ? ' · ' + U.fRelativa(t.fecha) : ''}`)).join(''), !ayer.length);
    const s2 = paso(2, 'Recurrentes y vencimientos', 'Las recurrentes de hoy entraron solas; quítalas si hoy no aplican',
      recs.map(t => drow(t, `<span class="badge blue">En mi día</span><button class="btn ghost sm" data-a="saltarHoy" data-id="${t.id}">Saltar hoy</button>`, 'Recurrente · ' + e(M().freqTexto(M().recurrente(t.recurrenteId) || {})))).join('') +
      vence.map(t => drow(t, `<button class="btn pri sm" data-a="planHoy" data-id="${t.id}">Pasar a hoy</button>${reprog(t)}<button class="btn ghost sm" data-a="planSoltar" data-id="${t.id}">Hoy no</button>`,
        t.fecha < U.hoy() ? `<b style="color:var(--red)">Venció ${e(U.fRelativa(t.fecha).toLowerCase())}</b>` : 'Vence hoy')).join('') || '<span class="muted small">Nada vence hoy.</span>', !vence.length);
    const s3 = paso(3, segs.length ? 'En espera: toca preguntar' : 'Sin seguimientos para hoy', 'Llegó la fecha que fijaste para dar seguimiento',
      segs.map(t => drow(t, `<button class="btn pri sm" data-a="planHoy" data-id="${t.id}">Recordar hoy</button><button class="btn sm" data-a="posponerSeg" data-id="${t.id}">Posponer 2 días</button><button class="btn ghost sm" data-a="yaRespondieron" data-id="${t.id}">Ya respondieron</button>`,
        `Esperando a ${e(t.espera?.persona || 'alguien')} desde hace ${U.diffDias(t.espera?.desde || U.hoy(), U.hoy())} días`)).join(''), !segs.length);
    const s4 = paso(4, 'Elige más tareas para hoy', bandeja ? `Tienes ${bandeja} en la Bandeja sin clasificar` : 'De tus pendientes, ordenados por prioridad y fecha',
      (bandeja ? `<div><a class="btn sm" href="#/bandeja">${ic('inbox', 's16')}Clasificar la Bandeja (${bandeja})</a></div>` : '') +
      (backlog.map(t => drow(t, `<button class="btn sm" data-a="planHoy" data-id="${t.id}">${ic('plus', 's16')}Mi día</button>`, `${EST[t.estado]}${t.fecha ? ' · ' + U.fRelativa(t.fecha) : ''}${t.prioridad === 'alta' ? ' · Alta' : ''}`)).join('') || '<span class="muted small">No hay más pendientes.</span>'), false);
    return `<a href="#/midia" class="small" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;text-decoration:none">${ic('back', 's16')}Volver a Mi día</a>
    <div class="head"><div><p class="sub" style="margin:0 0 4px">${e(U.fLarga(U.hoy()))}</p><h1>Planear el día</h1></div>
      <div class="tools"><div class="banner plan" style="padding:9px 12px;max-width:520px">${ic('edit', 's16')}<span class="small">Puedes volver aquí cuando quieras desde <b>Mi día → Ajustar plan</b>. Cada cambio se guarda al momento.</span></div></div></div>
    <div class="cols2"><div class="col-main" style="gap:14px">${s1}${s2}${s3}${s4}</div>
    <aside><div class="card"><h2 style="font-size:17px">Tu día</h2>
      <div style="display:flex;justify-content:space-between" class="small muted"><span>Prioridades</span><b style="color:var(--ink)">${usadas} / ${max}</b></div>${meter(usadas, max)}
      <ol class="plan-list" id="plan-list">${items.map((t, i) => `<li draggable="true" data-drag="dia" data-id="${t.id}"><span class="grip">${ic('grip', 's16')}</span><span class="muted small" style="width:18px">${i + 1}</span><span class="dot" style="background:${e(M().proyecto(t.proyectoId)?.color || '#A3A7B1')}"></span><span class="${t.estado === 'hecho' ? 'ttl done' : ''}" style="min-width:0">${e(t.titulo)}</span><button class="iconbtn x" data-a="quitarDia" data-id="${t.id}" aria-label="Quitar">${ic('x', 's14')}</button></li>`).join('') || '<li class="muted">Aún no eliges tareas.</li>'}</ol>
      <span class="muted small">Arrastra para cambiar el orden. Lo que no elijas sigue en Tareas.</span>
      <button class="btn" style="color:var(--red);border-color:#F0C4BF" data-a="urgencia">${ic('bolt', 's16')}Agregar urgencia</button>
      <button class="btn pri" data-a="planListo">Listo, ver mi día ${ic('arrow', 's16')}</button></div></aside></div>`;
  }

  /* ---------- Bandeja ---------- */
  function bandeja() {
    const ts = D().tareas.filter(t => t.estado === 'bandeja').sort((a, b) => a.creada < b.creada ? 1 : -1);
    return `<div class="head"><div><h1>Bandeja</h1><p class="sub">Lo que capturaste rápido. Clasifícalo cuando tengas un momento.</p></div></div>
    <div><label class="sr" for="cap-bandeja">Capturar en la Bandeja</label><div class="capture">${ic('plus', 's20')}<input id="cap-bandeja" data-enter="capturaBandeja" autocomplete="off" placeholder="Capturar una idea o tarea…"><kbd>Enter</kbd></div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${ts.map(t => `<div class="drow" style="background:var(--card)"><div class="info"><button class="ttl" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button><div class="meta"><span>${e(U.fTs(t.creada))}</span>${t.bitacora[0]?.texto.includes('celular') ? `<span class="m">${ic('phone', 's14')}Del celular</span>` : ''}</div></div>
      <div class="acts" style="min-width:200px">${proySelect(t.proyectoId, `data-ch="setProyecto" data-id="${t.id}" aria-label="Proyecto" style="width:170px"`)}<button class="btn sm" data-a="clasificar" data-id="${t.id}" data-v="porhacer">Por hacer</button><button class="btn pri sm" data-a="clasificar" data-id="${t.id}" data-v="midia">${ic('sun', 's16')}Mi día</button><button class="btn ghost sm" data-a="clasificar" data-id="${t.id}" data-v="parking">Parking</button><button class="iconbtn" data-a="eliminar" data-id="${t.id}" aria-label="Eliminar">${ic('trash', 's16')}</button></div></div>`).join('') || '<div class="empty">La Bandeja está vacía. ✓</div>'}</div>`;
  }

  /* ---------- Filtros compartidos ---------- */
  function filtroEstados(sel, scope) {
    return `<div class="fgroup"><span class="flab">Estados</span>${ESTADOS.map(([k, l]) => {
      const on = sel.has(k); const c = scope === 'grid' ? M().todas().filter(t => t.estado === k).length : D().tareas.filter(t => t.estado === k).length;
      return `<button class="fchip st-${k} ${on ? 'on' : ''}" aria-pressed="${on}" data-a="toggleEstado" data-scope="${scope}" data-v="${k}"><span class="box">${on ? ic('check', 's14') : ''}</span>${l}<span class="c">${c}</span></button>`; }).join('')}
      <span class="vsep"></span><button class="btn link sm" data-a="estadosTodos" data-scope="${scope}">Marcar todos</button><button class="btn link sm" data-a="estadosNinguno" data-scope="${scope}">Desmarcar todos</button></div>`;
  }
  function filtroProyectos(UI) {
    const sel = UI.proyectos;
    const n = sel.size;
    return `<div class="fgroup"><div class="pop-wrap"><button class="btn sm ${n ? 'on' : ''}" data-a="popProyectos" aria-expanded="${UI.pop === 'proy'}">${ic('search', 's16')}Proyectos${n ? ` (${n})` : ': todos'}${ic('down', 's16')}</button>${UI.pop === 'proy' ? popProyectos(UI) : ''}</div>
      ${[...sel].map(id => { const p = M().proyecto(id); return p ? `<span class="pchip" style="--c:${e(p.color)}">${e(p.nombre)}<button data-a="quitarProy" data-id="${p.id}" aria-label="Quitar ${e(p.nombre)} del filtro">${ic('x', 's14')}</button></span>` : ''; }).join('')}
      ${n ? '<button class="btn link sm" data-a="quitarFiltros">Quitar filtros</button>' : ''}</div>`;
  }
  function popProyectos(UI) {
    return `<div class="pop" data-keep="1"><label class="sr" for="pop-q">Buscar proyecto</label><div class="addrow" style="border-style:solid">${ic('search', 's16')}<input id="pop-q" data-input="popQ" placeholder="Buscar entre ${D().proyectos.length} proyectos…" value="${e(UI.popQ)}" autocomplete="off"></div>
      <div class="scroll" id="pop-list">${popLista(UI)}</div>
      <div class="foot"><button class="btn sm" data-a="quitarFiltros">Mostrar todos</button><button class="btn pri sm" data-a="cerrarPop">Listo</button></div></div>`;
  }
  function popLista(UI) {
    const q = U.norm(UI.popQ); const ps = D().proyectos.filter(p => !p.archivado && (!q || U.norm(p.nombre).includes(q)));
    const opt = p => { const on = UI.proyectos.has(p.id); const c = D().tareas.filter(t => t.proyectoId === p.id && M().activa(t)).length;
      return `<button class="opt ${on ? 'on' : ''}" data-a="toggleProy" data-id="${p.id}"><span class="box">${on ? ic('check', 's14') : ''}</span><span class="dot" style="background:${e(p.color)}"></span><span>${e(p.nombre)}</span><span class="n">${c}</span></button>`; };
    const fij = ps.filter(p => p.fijado), otros = ps.filter(p => !p.fijado);
    return (fij.length ? `<div class="glab">Fijados</div>${fij.map(opt).join('')}` : '') + (otros.length ? `<div class="glab">${fij.length ? 'Otros' : 'Proyectos'}</div>${otros.map(opt).join('')}` : '') + (!ps.length ? '<span class="muted small" style="padding:8px">Sin coincidencias.</span>' : '');
  }
  const CEL = () => matchMedia('(max-width: 640px)').matches;
  function botonFiltros(UI, resumen) {
    return `<button class="btn sm btn-filtros ${UI.filtrosAbiertos ? 'on' : ''}" data-a="filtros" aria-expanded="${!!UI.filtrosAbiertos}">${ic('search', 's16')}Filtros${resumen ? ` · ${resumen}` : ''}${ic('down', 's16')}</button>`;
  }
  const resumenFiltros = (UI, est) => [est ? `${est.size}/6 estados` : '', UI.proyectos.size ? `${UI.proyectos.size} proy.` : ''].filter(Boolean).join(' · ');
  const pasaProy = (UI, t) => !UI.proyectos.size || UI.proyectos.has(t.proyectoId || '');

  /* ---------- Cuadrícula ---------- */
  function filtrarGrid(UI) {
    const g = UI.grid; const q = U.norm(g.q);
    const base = g.estados.has('hecho') ? M().todas() : M().tareas();
    const est = g.soloEstancadas ? new Set(M().estancadas().map(t => t.id)) : null;
    let ini = null; const h = U.hoy();
    let fin = null;
    if (g.periodo === 'semana') ini = U.lunesDe(h); else if (g.periodo === 'mes') ini = h.slice(0, 8) + '01'; else if (g.periodo === 'anio') ini = h.slice(0, 4) + '-01-01';
    else if (g.periodo === '90') ini = U.addDias(h, -90); else if (g.periodo === 'rango') { ini = g.desde || null; fin = g.hasta || null; }
    return base.filter(t => g.estados.has(t.estado) && pasaProy(UI, t) && (!est || est.has(t.id))
      && (!q || U.norm(t.titulo + ' ' + t.id + ' ' + (M().proyecto(t.proyectoId)?.nombre || '') + ' ' + t.etiquetas.join(' ')).includes(q))
      && (t.estado !== 'hecho' || ((!ini || (U.dateOfTs(t.completada) || '') >= ini) && (!fin || (U.dateOfTs(t.completada) || '') <= fin))));
  }
  function ordenar(ts, sort) {
    const k = sort.k, dir = sort.dir;
    const val = t => ({ id: t.id, titulo: U.norm(t.titulo), proyecto: U.norm(M().proyecto(t.proyectoId)?.nombre || 'zzz'), estado: ESTADOS.findIndex(x => x[0] === t.estado),
      prioridad: { alta: 0, media: 1, baja: 2 }[t.prioridad] ?? 3, fecha: t.fecha || '9999', sub: t.subtareas.length ? t.subtareas.filter(s => s.hecha).length / t.subtareas.length : -1,
      actualizada: t.actualizada || '', completada: t.completada || '' }[k]);
    return ts.slice().sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
  }
  function grid(UI) {
    const g = UI.grid; const ts = ordenar(filtrarGrid(UI), g.sort);
    const th = (k, l) => `<th class="${g.sort.k === k ? 'sorted' : ''}"><button data-a="sort" data-v="${k}">${l}${g.sort.k === k ? ic(g.sort.dir > 0 ? 'sort' : 'sortup', 's14') : ''}</button></th>`;
    const total = M().todas().length;
    return `<div class="head"><div><h1>Tareas</h1><p class="sub hide-cel">Todas tus tareas en una tabla · clic en un encabezado para ordenar</p></div>
      <div class="tools">${viewToggle('grid')}<div class="pop-wrap"><button class="btn" style="border-color:var(--grn);color:var(--grnd);background:var(--grnt)" data-a="exportar">${ic('download', 's16')}Exportar a Excel</button></div><button class="btn pri hide-cel" data-a="nueva">${ic('plus', 's16')}Nueva tarea</button></div></div>
    ${botonFiltros(UI, resumenFiltros(UI, g.estados))}<div class="filters ${UI.filtrosAbiertos ? 'open' : ''}">${filtroEstados(g.estados, 'grid')}<span class="vsep"></span>${filtroProyectos(UI)}
      ${g.estados.has('hecho') ? `<div class="fgroup hist-hechas"><label class="flab" for="grid-periodo">${ic('check', 's14')} Historial de hechas</label><select id="grid-periodo" class="inp" style="width:auto" data-ch="gridPeriodo">${[['todo', 'Historial completo'], ['semana', 'Cerradas esta semana'], ['mes', 'Cerradas este mes'], ['90', 'Últimos 90 días'], ['anio', 'Cerradas este año'], ['rango', 'Rango de fechas…']].map(([v, l]) => `<option value="${v}" ${g.periodo === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${g.periodo === 'rango' ? `<label class="sr" for="grid-desde">Desde</label><input id="grid-desde" type="date" class="inp" style="width:auto" value="${e(g.desde || '')}" data-ch="gridRango" data-k="desde"><span class="muted small">a</span><label class="sr" for="grid-hasta">Hasta</label><input id="grid-hasta" type="date" class="inp" style="width:auto" value="${e(g.hasta || '')}" data-ch="gridRango" data-k="hasta">` : ''}</div>` : ''}
      <div class="fgroup" style="margin-left:auto"><label class="sr" for="grid-q">Filtrar por texto</label><input id="grid-q" class="inp" style="width:200px" data-input="gridQ" placeholder="Filtrar por texto…" value="${e(g.q)}">
</div>
      ${g.soloEstancadas ? `<span class="pchip" style="--c:#B45309">Solo estancadas<button data-a="quitarEstancadas" aria-label="Quitar filtro de estancadas">${ic('x', 's14')}</button></span>` : ''}</div>
    ${CEL() ? listaGrid(ts, g) : `<div class="tbl-wrap" id="grid-wrap">${tablaGrid(ts, th)}</div>`}
    <span class="muted small" id="grid-count">${ts.length} de ${total} tareas${!g.estados.has('parking') ? ' · Parking Lot oculto por filtro' : ''}</span>`;
  }
  function listaGrid(ts, g) {
    const ops = [['fecha', 'Fecha'], ['prioridad', 'Prioridad'], ['estado', 'Estado'], ['proyecto', 'Proyecto'], ['titulo', 'Título'], ['actualizada', 'Actualizada'], ['completada', 'Completada'], ['id', 'ID']];
    return `<div class="list-head"><label class="small muted" for="grid-sort">Ordenar por</label><select id="grid-sort" class="inp" style="width:auto" data-ch="gridSort">${ops.map(([k, l]) => `<option value="${k}" ${g.sort.k === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="iconbtn" data-a="sort" data-v="${g.sort.k}" aria-label="Invertir orden">${ic(g.sort.dir > 0 ? 'sort' : 'sortup')}</button></div>
    <div class="glist">${ts.map(t => `<div class="gitem"><button class="ttl ${t.estado === 'hecho' ? 'done' : ''}" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button>
      <div class="meta">${pill(t.estado)}${chip(t.proyectoId)}${t.prioridad === 'alta' ? '<span class="prio-alta">Alta</span>' : ''}<span class="${M().vencida(t) ? 'late' : ''}">${t.estado === 'hecho' ? 'Hecha ' + e(U.fCorta(U.dateOfTs(t.completada))) : e(U.fRelativa(t.fecha))}</span>${t.subtareas.length ? `<span class="m">${ic('sub', 's14')}${t.subtareas.filter(x => x.hecha).length}/${t.subtareas.length}</span>` : ''}${M().esArchivada(t) ? '<span class="badge gray">archivada</span>' : ''}</div></div>`).join('') || '<div class="empty">No hay tareas con estos filtros.</div>'}</div>`;
  }
  function tablaGrid(ts, th) {
    if (!ts.length) return '<div class="empty" style="border:0">No hay tareas con estos filtros.</div>';
    return `<table class="tbl"><thead><tr>${th('id', 'ID')}${th('titulo', 'Tarea')}${th('proyecto', 'Proyecto')}${th('estado', 'Estado')}${th('prioridad', 'Prioridad')}${th('fecha', 'Fecha')}${th('sub', 'Subtareas')}<th>Última nota</th>${th('actualizada', 'Actualizada')}</tr></thead><tbody>
      ${ts.map(t => { const n = M().ultimaNota(t); return `<tr><td class="muted small">${t.id}</td><td class="t"><button class="ttl ${t.estado === 'hecho' ? 'done' : ''}" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button>${M().esArchivada(t) ? ' <span class="badge gray">archivada</span>' : ''}</td>
        <td>${chip(t.proyectoId)}</td><td>${pill(t.estado)}${t.estado === 'espera' && t.espera?.persona ? `<div class="small muted" style="margin-top:3px">${e(t.espera.persona)}</div>` : ''}</td><td>${t.prioridad ? `<span class="${t.prioridad === 'alta' ? 'prio-alta' : ''}">${{ alta: 'Alta', media: 'Media', baja: 'Baja' }[t.prioridad]}</span>` : '<span class="muted">—</span>'}</td>
        <td class="${M().vencida(t) ? 'late' : ''}" style="white-space:nowrap">${t.estado === 'hecho' ? `<span class="muted">Hecha ${e(U.fCorta(U.dateOfTs(t.completada)))}</span>` : (t.fecha ? e(U.fRelativa(t.fecha)) : '<span class="muted">Sin fecha</span>')}</td>
        <td class="muted">${t.subtareas.length ? `${t.subtareas.filter(s => s.hecha).length}/${t.subtareas.length}` : '—'}</td><td class="n">${n ? e(n.texto.slice(0, 90)) + (n.texto.length > 90 ? '…' : '') : '—'}</td><td class="muted small" style="white-space:nowrap">${e(U.fCorta(U.dateOfTs(t.actualizada)))}</td></tr>`; }).join('')}</tbody></table>`;
  }

  /* ---------- Tablero ---------- */
  function kcard(t) {
    const w = t.estado === 'espera' && t.espera ? `<div class="wait">${ic('clock', 's14')}${e(t.espera.persona || 'Sin persona')} · ${U.diffDias(t.espera.desde || U.hoy(), U.hoy())} d${t.espera.seguimiento ? ' · seguimiento ' + e(U.fRelativa(t.espera.seguimiento).toLowerCase()) : ''}</div>` : '';
    const meta = [];
    if (t.prioridad === 'alta') meta.push(`<span class="m" style="color:var(--red)">${ic('flag', 's14')}Alta</span>`);
    if (t.estado === 'hecho') meta.push(`<span class="m">${ic('check', 's14')}${e(U.fRelativa(U.dateOfTs(t.completada)))}</span>`);
    else if (t.fecha) meta.push(`<span class="m" ${M().vencida(t) ? 'style="color:var(--red);font-weight:600"' : ''}>${ic('cal', 's14')}${e(U.fRelativa(t.fecha))}</span>`);
    if (t.subtareas.length) meta.push(`<span class="m">${ic('sub', 's14')}${t.subtareas.filter(s => s.hecha).length}/${t.subtareas.length}</span>`);
    const nn = t.bitacora.filter(b => b.tipo === 'nota').length; if (nn) meta.push(`<span class="m">${ic('note', 's14')}${nn}</span>`);
    if (M().enDia(t.id)) meta.push(`<span class="m" style="color:var(--accd)">${ic('sun', 's14')}Mi día</span>`);
    return `<div class="kcard" draggable="true" data-drag="card" data-id="${t.id}">${t.proyectoId ? `<div>${chip(t.proyectoId)}</div>` : ''}<button class="ttl ${t.estado === 'hecho' ? 'done' : ''}" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button>${w}${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}</div>`;
  }
  function columna(key, titulo, ts, extra = '', clase = '', dot = '') {
    return `<section class="bcol ${clase}" data-col="${key}"><div class="bcol-h">${dot}${e(titulo)}<span class="n">${ts.length}</span></div>
      ${ts.map(kcard).join('')}${extra}<div data-addwrap="${key}"><button class="add" data-a="agregarEnColumna" data-v="${key}">${ic('plus', 's16')}Agregar</button></div></section>`;
  }
  function tablero(UI) {
    const tb = UI.tablero; const d = D();
    const ts = d.tareas.filter(t => pasaProy(UI, t)).sort((a, b) => a.orden - b.orden);
    let cols = ''; const tabs = []; const cel = CEL();
    const addCol = (key, titulo, n, html) => { tabs.push({ key, titulo, n }); if (!cel || key === tb.colMovil) cols += html; };
    if (tb.agrupar === 'estado') {
      for (const [k, l] of ESTADOS) {
        if (k === 'parking') continue;
        let lista = ts.filter(t => t.estado === k), extra = '';
        if (k === 'hecho') {
          const lim = U.addDias(U.hoy(), -d.config.diasHechoTablero);
          const todasH = M().todas().filter(t => t.estado === 'hecho' && pasaProy(UI, t));
          lista = lista.filter(t => (U.dateOfTs(t.completada) || '') >= lim).sort((a, b) => (b.completada || '').localeCompare(a.completada || ''));
          extra = `<button class="btn link more" data-a="verCompletadas">Ver todas las completadas (${todasH.length})</button>`;
        }
        addCol(k, l, lista.length, columna(k, k === 'hecho' ? 'Hecho · últimos 7 días' : l, lista, extra, 'st-' + k));
      }
      const park = ts.filter(t => t.estado === 'parking');
      addCol('parking', 'Parking Lot', park.length, (tb.parkingAbierto || cel)
        ? `<section class="bcol pcol open" data-col="parking"><div class="bcol-h">${ic('parking', 's16')}Parking Lot<span class="n">${park.length}</span><button class="btn link sm hide-cel" style="margin-left:auto" data-a="parking" data-v="0">Ocultar</button></div>${park.map(kcard).join('')}</section>`
        : `<section class="pcol" data-col="parking"><div style="display:flex;align-items:center;gap:8px;font-weight:700">${ic('parking')}Parking Lot</div><span class="small">${park.length} ${park.length === 1 ? 'tarea' : 'tareas'}</span><span class="small muted">Ideas y solicitudes sin fecha ni compromiso. No aparecen en Mi día. Suelta aquí una tarjeta para estacionarla.</span><button class="btn sm" data-a="parking" data-v="1">Mostrar</button></section>`);
    } else {
      const act = ts.filter(t => M().activa(t));
      const ps = d.proyectos.filter(p => !p.archivado && (!UI.proyectos.size || UI.proyectos.has(p.id)));
      for (const p of ps) { const l = act.filter(t => t.proyectoId === p.id); addCol(p.id, p.nombre, l.length, columna(p.id, p.nombre, l, '', '', `<span class="dot" style="background:${e(p.color)}"></span>`)); }
      if (!UI.proyectos.size) { const l = act.filter(t => !t.proyectoId); addCol('none', 'Sin proyecto', l.length, columna('none', 'Sin proyecto', l)); }
    }
    return `<div class="head"><div><h1>Tablero</h1><p class="sub">${UI.proyectos.size ? `Filtrado a ${UI.proyectos.size} de ${d.proyectos.length} proyectos` : 'Todas las tareas de todos los proyectos'} · arrastra una tarjeta a otra columna para cambiarle el ${tb.agrupar === 'estado' ? 'estado' : 'proyecto'}</p></div>
      <div class="tools"><span class="muted small hide-cel">Agrupar por</span><div class="seg"><button class="${tb.agrupar === 'estado' ? 'on' : ''}" data-a="agrupar" data-v="estado">Estado</button><button class="${tb.agrupar === 'proyecto' ? 'on' : ''}" data-a="agrupar" data-v="proyecto">Proyecto</button></div>
      ${viewToggle('tablero')}<button class="btn pri hide-cel" data-a="nueva">${ic('plus', 's16')}Nueva tarea</button></div></div>
    ${botonFiltros(UI, resumenFiltros(UI))}<div class="filters ${UI.filtrosAbiertos ? 'open' : ''}">${filtroProyectos(UI)}</div>
    ${cel ? `<div class="tabs" role="tablist" aria-label="Columnas">${tabs.map(x => `<button role="tab" class="tab ${x.key === tb.colMovil ? 'on' : ''} st-${x.key}" data-a="colMovil" data-v="${x.key}" data-col="${x.key}" aria-selected="${x.key === tb.colMovil}">${e(x.titulo)}<span class="n">${x.n}</span></button>`).join('')}</div>
      <p class="muted small" style="margin:0">Mantén presionada una tarjeta y suéltala sobre otra pestaña para moverla.</p>` : ''}
    <div class="board-scroll"><div class="board">${cols || '<div class="empty" style="flex:1">Elige una columna.</div>'}</div></div>`;
  }

  /* ---------- Calendario ---------- */
  function eventosDia(UI, f) {
    const sel = UI.cal.estados; const out = [];
    const base = sel.has('hecho') ? M().todas() : M().tareas();
    for (const t of base) {
      if (!sel.has(t.estado) || !pasaProy(UI, t)) continue;
      if (t.estado === 'hecho') { if (U.dateOfTs(t.completada) === f) out.push({ t, k: 'done' }); continue; }
      if (t.fecha === f) out.push({ t, k: M().vencida(t) ? 'late' : '' });
      if (t.estado === 'espera' && t.espera?.seguimiento === f) out.push({ t, k: 'wait' });
    }
    return out;
  }
  function evHtml({ t, k }) {
    const p = M().proyecto(t.proyectoId);
    const txt = k === 'wait' ? 'Seguimiento: ' + (t.espera?.persona || t.titulo) : t.titulo;
    return `<button class="ev ${k}" style="--c:${e(p?.color || '#8A8F9C')}" draggable="true" data-drag="ev" data-kind="${k === 'wait' ? 'seg' : 'fecha'}" data-id="${t.id}" data-a="abrir" title="${e(t.titulo)}${p ? ' · ' + e(p.nombre) : ''}">${k === 'wait' ? ic('clock', 's14') + ' ' : ''}${e(txt)}</button>`;
  }
  function calendario(UI) {
    const c = UI.cal; const h = U.hoy();
    const ref = U.parse(c.ref);
    let ini, dias, titulo;
    if (c.modo === 'semana') { ini = U.lunesDe(c.ref); dias = 7; const fin = U.addDias(ini, 6); titulo = `${U.fCorta(ini)} – ${U.fCorta(fin)} ${fin.slice(0, 4)}`; }
    else { const p1 = U.iso(new Date(ref.getFullYear(), ref.getMonth(), 1)); ini = U.lunesDe(p1); const ult = U.iso(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)); dias = U.diffDias(ini, U.addDias(U.lunesDe(ult), 6)) + 1;
      titulo = U.MESES_L[ref.getMonth()][0].toUpperCase() + U.MESES_L[ref.getMonth()].slice(1) + ' ' + ref.getFullYear(); }
    const recs = D().recurrentes.filter(r => r.activa && (!UI.proyectos.size || UI.proyectos.has(r.proyectoId || '')));
    const max = c.modo === 'semana' ? 50 : 4;
    let celdas = '';
    for (let i = 0; i < dias; i++) {
      const f = U.addDias(ini, i), w = U.diaSemana(f);
      const otro = c.modo === 'mes' && +f.slice(5, 7) !== ref.getMonth() + 1;
      const evs = eventosDia(UI, f);
      const rs = f >= h ? recs.filter(r => M().ocurre(r, f)) : [];
      celdas += `<div class="cell ${otro ? 'other' : ''} ${w === 0 || w === 6 ? 'we' : ''} ${f === h ? 'today' : ''}" data-fecha="${f}">
        <div class="dn"><span class="d">${+f.slice(8)}</span>${rs.length ? `<span class="rc" title="${e(rs.map(r => r.titulo).join(', '))}">${ic('repeat', 's14')}${rs.length}</span>` : ''}</div>
        ${evs.slice(0, max).map(evHtml).join('')}${evs.length > max ? `<button class="ev more" data-a="calSemana" data-v="${f}">+${evs.length - max} más</button>` : ''}</div>`;
    }
    if (CEL()) {
      const fin = c.modo === 'semana' ? U.addDias(ini, 6) : U.iso(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
      const desde = c.modo === 'semana' ? ini : U.iso(new Date(ref.getFullYear(), ref.getMonth(), 1));
      let ag = '';
      for (let f = desde; f <= fin; f = U.addDias(f, 1)) {
        const evs = eventosDia(UI, f); const rs = f >= h ? recs.filter(r => M().ocurre(r, f)) : [];
        if (!evs.length && f !== h && c.modo === 'mes') continue;
        ag += `<section class="ag-dia ${f === h ? 'today' : ''} ${f < h ? 'pasado' : ''}" data-fecha="${f}"><div class="ag-h"><b>${e(['Hoy', 'Mañana', 'Ayer'].includes(U.fRelativa(f)) ? U.fRelativa(f) + ' · ' + U.fDia(f) : U.fDia(f))}</b>${rs.length ? `<span class="rc" title="${e(rs.map(r => r.titulo).join(', '))}">${ic('repeat', 's14')}${rs.length}</span>` : ''}</div>
          ${evs.map(evHtml).join('') || '<span class="muted small">Sin tareas</span>'}</section>`;
      }
      celdas = `<div class="agenda">${ag || '<div class="empty">Sin tareas con fecha en este mes.</div>'}</div>`;
    }
    const sinFecha = D().tareas.filter(t => !t.fecha && c.estados.has(t.estado) && M().activa(t) && pasaProy(UI, t));
    return `<div class="head"><div style="display:flex;align-items:center;gap:8px"><button class="iconbtn" style="border:1px solid var(--line);background:var(--card)" data-a="calMover" data-v="-1" aria-label="Anterior">${ic('left')}</button><button class="iconbtn" style="border:1px solid var(--line);background:var(--card)" data-a="calMover" data-v="1" aria-label="Siguiente">${ic('right')}</button>
        <h1 style="margin-left:6px">${e(titulo)}</h1><button class="btn sm" data-a="calHoy">Hoy</button></div>
      <div class="tools"><div class="seg"><button class="${c.modo === 'mes' ? 'on' : ''}" data-a="calModo" data-v="mes">Mes</button><button class="${c.modo === 'semana' ? 'on' : ''}" data-a="calModo" data-v="semana">Semana</button></div>${viewToggle('cal')}</div></div>
    ${botonFiltros(UI, resumenFiltros(UI, c.estados))}<div class="filters ${UI.filtrosAbiertos ? 'open' : ''}">${filtroEstados(c.estados, 'cal')}<span class="vsep"></span>${filtroProyectos(UI)}</div>
    <div class="legend hide-cel"><span><span class="sw" style="background:var(--acct);border-left:3px solid var(--acc)"></span>Fecha de la tarea (color del proyecto)</span><span><span class="sw" style="background:var(--ambt)"></span>Seguimiento de En espera</span><span><span class="sw" style="background:var(--redt)"></span>Vencida</span><span><span class="sw" style="background:var(--grnt)"></span>Completada ese día</span><span>${ic('repeat', 's14')} Recurrentes programadas</span><span>Arrastra una tarea a otro día para cambiar su fecha</span></div>
    <div class="cols2"><div class="col-main">${CEL() ? celdas : `<div class="cal-wrap"><div class="cal ${c.modo === 'semana' ? 'week' : ''}">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dh">${x}</div>`).join('')}${celdas}</div></div>`}</div>
    <aside><h2 style="font-size:15px">Sin fecha <span class="muted">${sinFecha.length}</span></h2><span class="muted small">Arrástralas a un día para programarlas, o ábrelas y ponles fecha.</span>
      ${sinFecha.slice(0, 40).map(t => `<div class="nofecha" draggable="true" data-drag="ev" data-kind="fecha" data-id="${t.id}"><span class="grip">${ic('grip', 's16')}</span><span class="chip" style="--c:${e(M().proyecto(t.proyectoId)?.color || '#8A8F9C')};padding:0;background:none"></span><button class="ttl" style="font-size:13px" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button></div>`).join('') || '<span class="muted small">Ninguna.</span>'}</aside></div>`;
  }

  /* ---------- En espera / Parking / Recurrentes / Proyectos ---------- */
  function espera() {
    const ts = D().tareas.filter(t => t.estado === 'espera').sort((a, b) => (a.espera?.seguimiento || '9999').localeCompare(b.espera?.seguimiento || '9999'));
    return `<div class="head"><div><h1>En espera</h1><p class="sub">Tareas activas que dependen de alguien más. Ordenadas por fecha de seguimiento.</p></div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${ts.map(t => { const s = t.espera || {}; const dias = U.diffDias(s.desde || U.hoy(), U.hoy()); const toca = s.seguimiento && s.seguimiento <= U.hoy();
      return `<div class="drow" style="background:var(--card);${toca ? 'border-color:var(--ambl)' : ''}"><div class="info"><button class="ttl" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button><div class="meta">${chip(t.proyectoId)}<span class="badge amb">${ic('clock', 's14')}${e(s.persona || 'Sin persona')} · ${dias} ${dias === 1 ? 'día' : 'días'}</span>${s.motivo ? `<span>${e(s.motivo)}</span>` : ''}${toca ? '<span class="badge amb">Toca preguntar</span>' : ''}</div></div>
      <div class="acts"><label class="small muted" for="seg-${t.id}">Seguimiento</label><input id="seg-${t.id}" type="date" class="inp" style="width:150px" value="${e(s.seguimiento || '')}" data-ch="setSeguimiento" data-id="${t.id}">
      <button class="btn sm" data-a="planHoy" data-id="${t.id}" ${M().enDia(t.id) ? 'disabled' : ''}>${ic('sun', 's16')}${M().enDia(t.id) ? 'En Mi día' : 'Recordar hoy'}</button><button class="btn warn sm" data-a="yaRespondieron" data-id="${t.id}">Ya respondieron</button></div></div>`; }).join('') || '<div class="empty">No estás esperando a nadie. ✓</div>'}</div>`;
  }
  function parking() {
    const d = D(); const ts = d.tareas.filter(t => t.estado === 'parking').sort((a, b) => a.creada < b.creada ? 1 : -1);
    const ps = d.proyectos.filter(p => p.parking && !p.archivado);
    return `<div class="head"><div><h1>Parking Lot</h1><p class="sub">Ideas y solicitudes sin fecha ni compromiso. No aparecen en Mi día ni en alertas. Última revisión: ${e(U.fCorta(d.config.parkingRevisado))} (hace ${U.diffDias(d.config.parkingRevisado, U.hoy())} días).</p></div>
      <div class="tools"><button class="btn" data-a="parkingRevisado">${ic('check', 's16')}Marcar como revisado</button></div></div>
    ${ps.length ? `<div class="card"><h2>Proyectos estacionados</h2><div class="meta">${ps.map(p => `<span class="pchip" style="--c:${e(p.color)}">${e(p.nombre)}<button data-a="proyParking" data-id="${p.id}" data-v="0" title="Reactivar proyecto" aria-label="Reactivar ${e(p.nombre)}">${ic('play', 's14')}</button></span>`).join('')}</div></div>` : ''}
    <div><label class="sr" for="cap-park">Agregar al Parking Lot</label><div class="capture">${ic('plus', 's20')}<input id="cap-park" data-enter="capturaParking" autocomplete="off" placeholder="Estacionar una idea o solicitud…  ej. Dashboard de errores #oic"><kbd>Enter</kbd></div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${ts.map(t => `<div class="drow" style="background:var(--card)"><div class="info"><button class="ttl" data-a="abrir" data-id="${t.id}">${e(t.titulo)}</button><div class="meta">${chip(t.proyectoId)}<span>Estacionada desde ${e(U.fCorta(U.dateOfTs(t.actualizada)))}</span></div></div>
      <div class="acts"><button class="btn sm" data-a="clasificar" data-id="${t.id}" data-v="porhacer">${ic('play', 's16')}Reactivar</button><button class="iconbtn" data-a="eliminar" data-id="${t.id}" aria-label="Eliminar">${ic('trash', 's16')}</button></div></div>`).join('') || '<div class="empty">El Parking Lot está vacío.</div>'}</div>`;
  }
  function histDots(r) {
    const hs = r.historial.slice(-14);
    return `<div class="hist">${hs.map(x => `<span class="${x.estado}" title="${e(U.fDia(x.fecha))}: ${x.estado === 'ok' ? 'completada ' + (x.hora || '') : 'saltada'}">${x.estado === 'ok' ? ic('check', 's14') : ''}</span>`).join('') || '<span class="muted small" style="width:auto">Sin historial todavía</span>'}</div>`;
  }
  function recurrentes() {
    const rs = D().recurrentes;
    return `<div class="head"><div><h1>Recurrentes</h1><p class="sub">Tareas que se crean solas según su frecuencia. No tienes que registrarlas a diario.</p></div><div class="tools"><button class="btn pri" data-a="editarRec">${ic('plus', 's16')}Nueva recurrente</button></div></div>
    <div style="display:flex;flex-direction:column;gap:10px">${rs.map(r => { const ok = r.historial.filter(h => h.estado === 'ok').length, tot = r.historial.length; const prox = M().proximaFecha(r);
      return `<div class="card" style="flex-direction:row;flex-wrap:wrap;align-items:center;gap:16px;${r.activa ? '' : 'opacity:.6'}"><div style="flex:1 1 300px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:15px">${e(r.titulo)}</b>${chip(r.proyectoId)}${r.activa ? '' : '<span class="badge gray">En pausa</span>'}</div>
        <div class="meta"><span class="m rec">${ic('repeat', 's14')}${e(M().freqTexto(r))}${r.hora ? ' · ' + e(r.hora) : ''}</span><span>${r.modo === 'reemplazar' ? 'Si no la completas: se reemplaza' : 'Si no la completas: se acumula'}</span>${r.activa && prox ? `<span>Próxima: ${e(U.fRelativa(prox))}</span>` : ''}${tot ? `<span>${ok} de ${tot} completadas</span>` : ''}</div></div>
        ${histDots(r)}<div class="acts" style="display:flex;gap:6px"><button class="btn sm" data-a="pausarRec" data-id="${r.id}">${ic(r.activa ? 'pause' : 'play', 's16')}${r.activa ? 'Pausar' : 'Reanudar'}</button><button class="btn sm" data-a="editarRec" data-id="${r.id}">${ic('edit', 's16')}Editar</button></div></div>`; }).join('') || '<div class="empty">Aún no tienes recurrentes. Ejemplo: “Revisión de OIC” cada día hábil.</div>'}</div>`;
  }
  function proyectos() {
    const d = D();
    return `<div class="head"><div><h1>Proyectos</h1><p class="sub">Los fijados aparecen en la barra lateral y arriba en los filtros.</p></div></div>
    <div><label class="sr" for="cap-proy">Nuevo proyecto</label><div class="capture">${ic('plus', 's20')}<input id="cap-proy" data-enter="nuevoProyecto" autocomplete="off" placeholder="Nuevo proyecto…"><kbd>Enter</kbd></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Color</th><th>Proyecto</th><th>Activas</th><th>Hechas</th><th>Fijado</th><th>Parking Lot</th><th></th></tr></thead><tbody>
    ${d.proyectos.filter(p => !p.archivado).map(p => { const ts = M().todas().filter(t => t.proyectoId === p.id);
      return `<tr><td><div class="color-sw">${COLORES.map(c => `<button class="${c === p.color ? 'on' : ''}" style="background:${c}" data-a="proyColor" data-id="${p.id}" data-v="${c}" aria-label="Color ${c}"></button>`).join('')}</div></td>
      <td class="t"><input class="inp" value="${e(p.nombre)}" data-ch="proyNombre" data-id="${p.id}" aria-label="Nombre del proyecto"></td><td>${ts.filter(t => M().activa(t)).length}</td><td>${ts.filter(t => t.estado === 'hecho').length}</td>
      <td><button class="btn sm ${p.fijado ? 'on' : ''}" data-a="proyFijar" data-id="${p.id}">${ic('pin', 's16')}${p.fijado ? 'Fijado' : 'Fijar'}</button></td>
      <td><button class="btn sm ${p.parking ? 'on' : ''}" data-a="proyParking" data-id="${p.id}" data-v="${p.parking ? 0 : 1}">${ic('parking', 's16')}${p.parking ? 'Estacionado' : 'Estacionar'}</button></td>
      <td><button class="iconbtn" data-a="proyEliminar" data-id="${p.id}" aria-label="Eliminar proyecto">${ic('trash', 's16')}</button></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">Aún no hay proyectos. Créalos aquí o escribiendo #nombre al capturar una tarea.</td></tr>'}
    </tbody></table></div>`;
  }

  return { chip, pill, prioTxt, metaTarea, checkBtn, sidebar, estadoGuardado, miDia, planear, bandeja, grid, tablero, calendario, espera, parking, recurrentes, proyectos,
    filtrarGrid, ordenar, popLista, tablaGrid, proySelect, histDots };
})();
