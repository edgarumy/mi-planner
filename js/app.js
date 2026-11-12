/* Controlador: estado de la interfaz, navegación, acciones, arrastrar y soltar, atajos */
'use strict';

const App = (() => {
  const VISTAS = ['midia', 'planear', 'bandeja', 'grid', 'tablero', 'cal', 'espera', 'parking', 'recurrentes', 'proyectos'];
  const UI = {
    vista: 'midia', diaAgrupar: false, movil: [], pop: null, popQ: '', proyectos: new Set(), addCol: null,
    grid: { estados: new Set(['bandeja', 'porhacer', 'encurso', 'espera']), sort: { k: 'fecha', dir: 1 }, q: '', periodo: 'todo', desde: U.addDias(U.hoy(), -30), hasta: U.hoy(), soloEstancadas: false },
    cal: { estados: new Set(['porhacer', 'encurso', 'espera']), ref: U.hoy(), modo: 'mes' },
    tablero: { agrupar: 'estado', parkingAbierto: false, colMovil: 'porhacer' },
    tareaId: null, modal: null
  };
  const $ = s => document.querySelector(s);
  const TOUCH = matchMedia('(hover: none)').matches;
  let iniciado = false;

  /* ---------- Render ---------- */
  let pendienteRender = false;
  function R() { if (pendienteRender) return; pendienteRender = true; setTimeout(() => { pendienteRender = false; render(); }, 0); }
  function render() {
    if (!Model.datos) return;
    const act = document.activeElement; const fid = act && act.id; const sel = fid && 'selectionStart' in act ? [act.selectionStart, act.selectionEnd] : null;
    const scrolls = [...document.querySelectorAll('[data-keep-scroll], .overlay, .board-scroll, .pop .scroll')].map(el => [keyOf(el), el.scrollTop, el.scrollLeft]);
    const vistas = { midia: V.miDia, planear: V.planear, bandeja: V.bandeja, grid: V.grid, tablero: V.tablero, cal: V.calendario, espera: V.espera, parking: V.parking, recurrentes: V.recurrentes, proyectos: V.proyectos };
    let main = vistas[UI.vista](UI);
    if (UI.vista === 'midia' && !Model.datos.tareas.length && !Model.datos.proyectos.length) main += bienvenidaVacia();
    $('#app').innerHTML = `<div class="app"><header class="topbar"><button class="iconbtn" data-a="menu" aria-label="Menú">${ic('menu')}</button><b>Mi Planner</b><button class="iconbtn" data-a="buscar" aria-label="Buscar" style="margin-left:auto">${ic('search')}</button></header>
      <div class="side-backdrop" data-a="menu"></div>${V.sidebar(UI)}<main class="main" id="main">${main}</main>
      <button class="fab" data-a="fab" aria-label="Captura rápida">${ic('plus', 's20')}</button></div>`;
    let m = '';
    const t = UI.tareaId && Model.get(UI.tareaId);
    if (UI.tareaId && !t) UI.tareaId = null;
    if (t) m += `<div class="overlay" data-ov="detalle">${MV.detalle(t)}</div>`;
    if (UI.modal) m += `<div class="overlay" data-ov="modal">${modalHtml()}</div>`;
    $('#modals').innerHTML = m;
    document.body.style.overflow = m ? 'hidden' : '';
    for (const [k, top, left] of scrolls) { const el = findByKey(k); if (el) { el.scrollTop = top; el.scrollLeft = left; } }
    if (fid) { const el = document.getElementById(fid); if (el) { el.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in el) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* tipo sin selección */ } } }
    if (UI.focus) { const el = document.getElementById(UI.focus); UI.focus = null; if (el) el.focus(); }
    if (UI.addCol) abrirAddCol(UI.addCol);
    if (TOUCH) document.querySelectorAll('[draggable]').forEach(x => x.removeAttribute('draggable'));
    document.querySelector('.app')?.classList.toggle('menu-open', !!UI.menu);
  }
  const keyOf = el => el.dataset.ov ? 'ov:' + el.dataset.ov : el.classList.contains('board-scroll') ? 'board' : el.classList.contains('scroll') ? 'pop' : el.dataset.keepScroll;
  const findByKey = k => k?.startsWith('ov:') ? document.querySelector(`.overlay[data-ov="${k.slice(3)}"]`) : k === 'board' ? $('.board-scroll') : k === 'pop' ? $('.pop .scroll') : null;
  function modalHtml() {
    const m = UI.modal;
    if (m.tipo === 'captura') return MV.captura(m);
    if (m.tipo === 'buscar') return MV.buscar(m);
    if (m.tipo === 'rec') return MV.recurrente(m);
    if (m.tipo === 'espera') return MV.espera(m);
    if (m.tipo === 'export') return MV.exportar(m, V.filtrarGrid(UI).length, Model.todas().length);
    return '';
  }
  function bienvenidaVacia() {
    return `<div class="card" style="max-width:640px"><h2>¿Primera vez?</h2><p class="muted" style="margin:0">Tu carpeta está lista y vacía. Empieza escribiendo una tarea arriba, o carga datos de ejemplo para explorar la app (los puedes borrar después).</p>
      <div><button class="btn" data-a="cargarEjemplo">Cargar datos de ejemplo</button></div></div>`;
  }
  function actualizarGuardado() { const el = $('#save-status'); if (el) el.innerHTML = V.estadoGuardado(); }

  /* ---------- Avisos ---------- */
  function toast(msg, deshacer) {
    const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${U.esc(msg)}</span>`;
    if (deshacer) { const b = document.createElement('button'); b.textContent = 'Deshacer'; b.onclick = () => { deshacer(); el.remove(); R(); }; el.appendChild(b); }
    box.appendChild(el); setTimeout(() => el.remove(), 5000);
  }

  /* ---------- Utilidades de acciones ---------- */
  const T = id => Model.get(id);
  function agregarAlDia(id, urgente) {
    if (Model.agregarDia(id, { urgente })) return true;
    if (confirm(`Ya tienes ${Model.datos.config.maxPrioridades} prioridades en tu día. ¿Agregarla de todos modos?`)) return Model.agregarDia(id, { forzar: true });
    return false;
  }
  function completarConPregunta(t) {
    const abiertas = t.subtareas.filter(s => !s.hecha).length;
    let cerrar = false;
    if (abiertas) cerrar = confirm(`La tarea tiene ${abiertas} ${abiertas === 1 ? 'subtarea abierta' : 'subtareas abiertas'}.\n\nAceptar: marcarlas también como hechas.\nCancelar: completar la tarea y dejarlas como están.`);
    Model.completar(t, { cerrarSubtareas: cerrar });
  }
  function irA(v) { if (location.hash !== '#/' + v) location.hash = '#/' + v; else R(); }
  function syncRec() {
    const r = UI.modal?.r; if (!r) return;
    document.querySelectorAll('[data-rk]').forEach(el => {
      const k = el.dataset.rk;
      if (el.type === 'radio') { if (el.checked) r[k] = el.value; }
      else if (el.type === 'checkbox') r[k] = el.checked;
      else if (k === 'subtareas') r[k] = el.value.split('\n').map(s => s.trim()).filter(Boolean);
      else if (k === 'diaMes') r[k] = Math.max(1, Math.min(31, +el.value || 1));
      else r[k] = el.value || (k === 'proyectoId' || k === 'prioridad' ? null : '');
    });
  }
  function abrirAddCol(key) {
    const w = document.querySelector(`[data-addwrap="${CSS.escape(key)}"]`); if (!w) { UI.addCol = null; return; }
    w.innerHTML = `<label class="sr" for="add-col">Nueva tarea</label><div style="display:flex;gap:6px"><input id="add-col" class="add-inp" data-enter="crearEnColumna" enterkeyhint="done" data-v="${U.esc(key)}" placeholder="Título de la tarea" autocomplete="off"><button class="btn pri sm" data-a="enviarCampo" data-for="add-col">Agregar</button></div>`;
    const i = w.querySelector('input'); i.focus();
    i.addEventListener('blur', () => setTimeout(() => { if (!document.activeElement?.closest?.(`[data-addwrap="${CSS.escape(key)}"]`) && UI.addCol === key && !i.value) { UI.addCol = null; R(); } }, 250));
  }
  async function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  /* ---------- Acciones (clic en [data-a]) ---------- */
  const A = {
    abrir: d => { UI.tareaId = d.id; R(); },
    menu: () => { UI.menu = !UI.menu; R(); },
    enviarCampo: d => { const el = document.getElementById(d.for); if (el?.dataset.enter) E[el.dataset.enter]?.(el.dataset, el); },
    filtros: () => { UI.filtrosAbiertos = !UI.filtrosAbiertos; R(); },
    colMovil: d => { UI.tablero.colMovil = d.v; R(); },
    fab: () => { UI.modal = { tipo: 'captura', destino: UI.vista === 'midia' ? 'midia' : 'bandeja' }; UI.focus = 'cap-modal'; R(); },
    cerrarModal: () => { if (UI.modal) UI.modal = null; else UI.tareaId = null; R(); },
    toggleHecho: d => {
      const t = T(d.id); if (!t) return;
      if (t.estado === 'hecho') { Model.reabrir(t); toast('Tarea reabierta'); }
      else { Model.completar(t); toast('Completada: ' + t.titulo, () => Model.reabrir(t)); }
      R();
    },
    quitarDia: d => { Model.quitarDia(d.id); R(); },
    diaAgrupar: d => { UI.diaAgrupar = d.v === '1'; R(); },
    urgencia: () => { UI.modal = { tipo: 'captura', urgente: true, destino: 'midia' }; UI.focus = 'cap-modal'; R(); },
    nueva: () => { UI.modal = { tipo: 'captura', destino: 'porhacer' }; UI.focus = 'cap-modal'; R(); },
    capDestino: d => { UI.modal.destino = d.v; UI.focus = 'cap-modal'; R(); },
    capturaModal: () => {
      const i = $('#cap-modal'); const v = i?.value.trim(); if (!v) { i?.focus(); return; }
      const m = UI.modal;
      const res = m.urgente ? Model.desdeCaptura(v, { miDia: true, urgente: true }) : Model.desdeCaptura(v, { estado: m.destino === 'bandeja' ? 'bandeja' : 'porhacer', miDia: m.destino === 'midia' });
      if (res?.recurrente) toast('Recurrente creada: ' + res.recurrente.titulo);
      else if (res) toast(m.urgente ? 'Urgencia agregada a Mi día' : (m.destino === 'bandeja' && res.tarea.estado === 'bandeja' ? 'Capturada en la Bandeja' : 'Tarea creada'));
      UI.modal = null; R();
    },
    importarMovil: async () => { const n = await Model.importarMovil(); UI.movil = []; toast(`${n} ${n === 1 ? 'nota pasó' : 'notas pasaron'} a la Bandeja`); R(); },
    verEstancadas: () => { UI.grid.soloEstancadas = true; UI.grid.estados = new Set(['porhacer', 'encurso', 'espera']); irA('grid'); },
    cargarEjemplo: () => { Model.cargarEjemplo(); toast('Datos de ejemplo cargados'); R(); },

    abrirFecha: (d, el) => { const i = el.parentElement.querySelector('input[type=date]'); try { i.showPicker(); } catch (e) { i.classList.remove('sr'); i.focus(); } },
    planHoy: d => { if (agregarAlDia(d.id)) toast('Agregada a Mi día'); R(); },
    planSoltar: d => { Model.decidir(d.id); R(); },
    planParking: d => { const t = T(d.id); Model.cambiarEstado(t, 'parking'); Model.decidir(d.id); toast('Enviada al Parking Lot'); R(); },
    saltarHoy: d => { const t = T(d.id); if (t) Model.saltarHoy(t); toast('Recurrente saltada por hoy'); R(); },
    posponerSeg: d => { const t = T(d.id); if (!t?.espera) return; const base = t.espera.seguimiento && t.espera.seguimiento > U.hoy() ? t.espera.seguimiento : U.hoy();
      const nueva = U.addDias(base, 2); Model.actualizar(t, { espera: Object.assign({}, t.espera, { seguimiento: nueva }) }, `Seguimiento pospuesto al ${U.fCorta(nueva)}.`); Model.decidir(t.id); R(); },
    yaRespondieron: d => { const t = T(d.id); if (!t) return; Model.cambiarEstado(t, 'encurso'); toast('Movida a En curso'); R(); },
    planListo: () => { Model.marcarPlaneado(); irA('midia'); },

    clasificar: d => { const t = T(d.id); if (!t) return;
      if (d.v === 'midia') agregarAlDia(t.id); else Model.cambiarEstado(t, d.v);
      toast(d.v === 'midia' ? 'Agregada a Mi día' : d.v === 'parking' ? 'Enviada al Parking Lot' : 'Movida a Por hacer'); R(); },
    eliminar: d => { const t = T(d.id); if (!t) return; if (!confirm(`¿Eliminar la tarea "${t.titulo}"? Esta acción borra también su bitácora.`)) return;
      const enDia = Model.enDia(t.id); Model.eliminar(t); if (UI.tareaId === t.id) UI.tareaId = null;
      toast('Tarea eliminada', () => { Model.datos.tareas.push(t); if (enDia) Model.datos.plan.items.push(t.id); Model.cambio(); }); R(); },

    toggleEstado: d => { const s = d.scope === 'cal' ? UI.cal.estados : UI.grid.estados; s.has(d.v) ? s.delete(d.v) : s.add(d.v); R(); },
    estadosTodos: d => { const s = d.scope === 'cal' ? UI.cal.estados : UI.grid.estados; ESTADOS.forEach(([k]) => s.add(k)); R(); },
    estadosNinguno: d => { (d.scope === 'cal' ? UI.cal.estados : UI.grid.estados).clear(); R(); },
    popProyectos: () => { UI.pop = UI.pop === 'proy' ? null : 'proy'; UI.popQ = ''; if (UI.pop) UI.focus = 'pop-q'; R(); },
    toggleProy: d => { UI.proyectos.has(d.id) ? UI.proyectos.delete(d.id) : UI.proyectos.add(d.id); R(); },
    quitarProy: d => { UI.proyectos.delete(d.id); R(); },
    quitarFiltros: () => { UI.proyectos.clear(); UI.pop = null; R(); },
    cerrarPop: () => { UI.pop = null; R(); },
    filtrarProyecto: d => { UI.proyectos = new Set([d.id]); UI.pop = null; irA(['grid', 'tablero', 'cal'].includes(UI.vista) ? UI.vista : 'tablero'); },
    sort: d => { const s = UI.grid.sort; if (s.k === d.v) s.dir *= -1; else { s.k = d.v; s.dir = 1; } R(); },
    quitarEstancadas: () => { UI.grid.soloEstancadas = false; R(); },
    verCompletadas: () => { UI.grid.estados = new Set(['hecho']); UI.grid.periodo = 'todo'; UI.grid.sort = { k: 'completada', dir: -1 }; irA('grid'); },

    exportar: () => { UI.modal = { tipo: 'export', o: { alcance: 'vista', periodo: 'mes', desde: U.addDias(U.hoy(), -30), hasta: U.hoy(), resumen: true, subtareas: true, bitacora: false, porProyecto: false } }; R(); },
    xSet: d => { UI.modal.o[d.k] = d.v; R(); },
    xToggle: d => { UI.modal.o[d.k] = !UI.modal.o[d.k]; R(); },
    xDescargar: async () => {
      const o = UI.modal.o; const base = o.alcance === 'vista' ? V.filtrarGrid(UI) : Model.todas();
      const { blob, n } = Export.construir(base, o);
      const nombre = `actividades_${U.hoy()}_${U.hora().replace(':', '')}.xlsx`;
      await descargar(blob, nombre);
      try { await Model.guardarExportacion(nombre, blob); } catch (e) { console.warn(e); }
      UI.modal = null; toast(`Excel generado con ${n} tareas: ${nombre}`); R();
    },

    agrupar: d => { UI.tablero.agrupar = d.v; UI.tablero.colMovil = d.v === 'estado' ? 'porhacer' : (Model.datos.proyectos.find(p => !p.archivado)?.id || 'none'); R(); },
    parking: d => { UI.tablero.parkingAbierto = d.v === '1'; R(); },
    agregarEnColumna: d => { UI.addCol = d.v; abrirAddCol(d.v); },

    calMover: d => { const c = UI.cal; const n = +d.v;
      if (c.modo === 'semana') c.ref = U.addDias(c.ref, 7 * n); else { const r = U.parse(c.ref); c.ref = U.iso(new Date(r.getFullYear(), r.getMonth() + n, 1)); } R(); },
    calHoy: () => { UI.cal.ref = U.hoy(); R(); },
    calModo: d => { UI.cal.modo = d.v; R(); },
    calSemana: d => { UI.cal.ref = d.v; UI.cal.modo = 'semana'; R(); },

    parkingRevisado: () => { Model.datos.config.parkingRevisado = U.hoy(); Model.cambio(); toast('Parking Lot marcado como revisado'); R(); },
    proyParking: d => { const p = Model.proyecto(d.id); Model.actualizarProyecto(p, { parking: d.v === '1' }); R(); },
    proyFijar: d => { const p = Model.proyecto(d.id); Model.actualizarProyecto(p, { fijado: !p.fijado }); R(); },
    proyColor: d => { const p = Model.proyecto(d.id); Model.actualizarProyecto(p, { color: d.v }); R(); },
    proyEliminar: d => { const p = Model.proyecto(d.id); if (p && confirm(`¿Eliminar el proyecto "${p.nombre}"? Sus tareas se conservan, quedan sin proyecto.`)) { Model.eliminarProyecto(p); UI.proyectos.delete(p.id); R(); } },

    editarRec: d => { const orig = d.id ? Model.recurrente(d.id) : null;
      const r = orig ? U.clone(orig) : { titulo: '', proyectoId: null, prioridad: null, frecuencia: 'habiles', dias: [1, 2, 3, 4, 5], diaMes: +U.hoy().slice(8), hora: '', autoMiDia: true, modo: 'reemplazar', subtareas: [], historial: [] };
      UI.modal = { tipo: 'rec', r, nuevo: !orig, id: orig?.id }; if (!orig) UI.focus = 'r-titulo'; R(); },
    hacerRecurrente: d => { const t = T(d.id);
      UI.modal = { tipo: 'rec', nuevo: true, desdeTarea: t.id, r: { titulo: t.titulo, proyectoId: t.proyectoId, prioridad: t.prioridad, frecuencia: 'habiles', dias: [1, 2, 3, 4, 5], diaMes: +U.hoy().slice(8), hora: '', autoMiDia: true, modo: 'reemplazar', subtareas: t.subtareas.map(s => s.texto), historial: [] } }; R(); },
    recFreq: d => { syncRec(); UI.modal.r.frecuencia = d.v; R(); },
    recDia: d => { syncRec(); const r = UI.modal.r, n = +d.v; r.dias = r.dias.includes(n) ? r.dias.filter(x => x !== n) : [...r.dias, n]; R(); },
    recGuardar: () => {
      syncRec(); const m = UI.modal, r = m.r;
      if (!r.titulo.trim()) { toast('Ponle un título a la recurrente'); UI.focus = 'r-titulo'; R(); return; }
      if (r.frecuencia === 'semanal' && !r.dias.length) { toast('Elige al menos un día de la semana'); return; }
      const campos = { titulo: r.titulo.trim(), proyectoId: r.proyectoId || null, prioridad: r.prioridad || null, frecuencia: r.frecuencia, dias: r.dias, diaMes: r.diaMes, hora: r.hora, autoMiDia: r.autoMiDia, modo: r.modo, subtareas: r.subtareas };
      if (m.nuevo && m.desdeTarea) { Model.hacerRecurrente(T(m.desdeTarea), campos); toast('La tarea ahora es recurrente'); }
      else if (m.nuevo) { Model.crearRecurrente(campos); toast('Recurrente creada'); }
      else { Model.actualizarRecurrente(Model.recurrente(m.id), campos); toast('Recurrente actualizada'); }
      UI.modal = null; R();
    },
    recEliminar: () => { const r = Model.recurrente(UI.modal.id); if (r && confirm(`¿Eliminar la recurrente "${r.titulo}"? Las tareas ya creadas se conservan.`)) { Model.eliminarRecurrente(r); UI.modal = null; R(); } },
    pausarRec: d => { const r = Model.recurrente(d.id); Model.actualizarRecurrente(r, { activa: !r.activa }); toast(r.activa ? 'Recurrente reanudada' : 'Recurrente en pausa'); R(); },

    buscar: () => { UI.modal = { tipo: 'buscar', q: '', sel: 0 }; UI.focus = 'q-buscar'; R(); },
    abrirBusqueda: d => { UI.modal = null; UI.tareaId = d.id; R(); },
    cambiarCarpeta: async () => { try { const b = await Storage.elegirCarpeta(); await abrirCon(b); toast('Carpeta abierta: ' + b.nombre); } catch (e) { if (e.name !== 'AbortError') toast('No se pudo abrir la carpeta: ' + e.message); } },

    /* Detalle */
    dMiDia: d => { const t = T(d.id); if (Model.enDia(t.id)) Model.quitarDia(t.id); else agregarAlDia(t.id); R(); },
    dEstado: d => { const t = T(d.id); if (!t || t.estado === d.v) return; if (d.v === 'hecho') completarConPregunta(t); else Model.cambiarEstado(t, d.v); if (d.v === 'espera') UI.focus = 'd-persona'; R(); },
    dSubToggle: d => { Model.toggleSub(T(d.id), d.v); R(); },
    dSubQuitar: d => { Model.quitarSub(T(d.id), d.v); R(); },
    dNota: d => { const i = $('#d-nota'); const v = i?.value.trim(); if (!v) return; Model.agregarNota(T(d.id), v); i.value = ''; UI.focus = 'd-nota'; R(); },
    dNotaQuitar: d => { if (confirm('¿Eliminar esta nota de la bitácora?')) { Model.quitarNota(T(d.id), d.v); R(); } },
    dAbrirAdj: async d => { const t = T(d.id); const a = t.adjuntos.find(x => x.id === d.v); const b = a && await Model.leerAdjunto(a);
      if (!b) { toast('No se encontró el archivo en la carpeta'); return; }
      const url = URL.createObjectURL(b); const w = window.open(url, '_blank'); if (!w) await descargar(b, a.nombre); setTimeout(() => URL.revokeObjectURL(url), 60000); },
    dQuitarAdj: async d => { if (!confirm('¿Eliminar este adjunto? También se borra de la carpeta.')) return; await Model.quitarAdjunto(T(d.id), d.v); R(); },
    dQuitarEnlace: d => { const t = T(d.id); Model.actualizar(t, { enlaces: t.enlaces.filter((_, i) => i !== +d.v) }); R(); },

    /* En espera (al soltar en la columna) */
    esperaOk: () => { const m = UI.modal; const t = T(m.id);
      const espera = { persona: $('#w-persona').value.trim(), motivo: $('#w-motivo').value.trim(), seguimiento: $('#w-seg').value || null };
      Model.cambiarEstado(t, 'espera', { espera }); if (m.orden) Model.moverEnColumna(t, 'estado', null, m.orden.antesDe, m.orden.ids); UI.modal = null; R(); },
    esperaOmitir: () => { const m = UI.modal; const t = T(m.id); Model.cambiarEstado(t, 'espera'); if (m.orden) Model.moverEnColumna(t, 'estado', null, m.orden.antesDe, m.orden.ids); UI.modal = null; R(); }
  };

  /* ---------- Cambios en campos ([data-ch], al salir del campo) ---------- */
  const C = {
    reprogramar: (d, el) => { const t = T(d.id); if (!el.value) return; Model.actualizar(t, { fecha: el.value }, `Reprogramada al ${U.fCorta(el.value)}.`); Model.decidir(t.id); toast('Reprogramada al ' + U.fDia(el.value)); R(); },
    setProyecto: (d, el) => { Model.actualizar(T(d.id), { proyectoId: el.value || null }); R(); },
    setSeguimiento: (d, el) => { const t = T(d.id); Model.actualizar(t, { espera: Object.assign({}, t.espera, { seguimiento: el.value || null }) }); R(); },
    gridPeriodo: (d, el) => { UI.grid.periodo = el.value; R(); },
    gridRango: (d, el) => { UI.grid[d.k] = el.value; R(); },
    gridSort: (d, el) => { UI.grid.sort = { k: el.value, dir: el.value === 'actualizada' || el.value === 'completada' ? -1 : 1 }; R(); },
    xFecha: (d, el) => { UI.modal.o[d.k] = el.value; },
    proyNombre: (d, el) => { const v = el.value.trim(); if (v) Model.actualizarProyecto(Model.proyecto(d.id), { nombre: v }); R(); },
    dTitulo: (d, el) => { const t = T(d.id); const v = el.value.trim(); if (v && v !== t.titulo) Model.actualizar(t, { titulo: v }, `Título cambiado (antes: "${t.titulo}").`); R(); },
    dDesc: (d, el) => { const t = T(d.id); if (el.value !== t.descripcion) Model.actualizar(t, { descripcion: el.value }); },
    dEspera: (d, el) => { const t = T(d.id); const e = Object.assign({}, t.espera || {}); e[d.k] = el.value || (d.k === 'seguimiento' ? null : ''); Model.actualizar(t, { espera: e }, d.k === 'seguimiento' && el.value ? `Seguimiento: ${U.fCorta(el.value)}.` : null); R(); },
    dSubTexto: (d, el) => { const v = el.value.trim(); if (v) Model.editarSub(T(d.id), d.v, v); else { Model.quitarSub(T(d.id), d.v); R(); } },
    dProyecto: (d, el) => { const t = T(d.id); const de = Model.proyecto(t.proyectoId)?.nombre || 'Sin proyecto'; const a = Model.proyecto(el.value)?.nombre || 'Sin proyecto'; Model.actualizar(t, { proyectoId: el.value || null }, `Proyecto: ${de} → ${a}.`); R(); },
    dPrio: (d, el) => { Model.actualizar(T(d.id), { prioridad: el.value || null }); R(); },
    dFecha: (d, el) => { const t = T(d.id); Model.actualizar(t, { fecha: el.value || null }, el.value ? `Fecha límite: ${U.fCorta(el.value)}.` : 'Fecha límite eliminada.'); R(); },
    dSubSalir: (d, el) => { const v = el.value.trim(); if (!v) return; Model.agregarSub(T(d.id), v); el.value = ''; toast('Subtarea agregada'); R(); },
    dTags: (d, el) => { Model.actualizar(T(d.id), { etiquetas: el.value.split(/[,;]+/).map(s => s.trim().replace(/^[#+]/, '')).filter(Boolean) }); R(); },
    dAdjuntar: async (d, el) => { const t = T(d.id); const fs = [...el.files]; for (const f of fs) { try { await Model.agregarAdjunto(t, f); } catch (e) { toast('No se pudo guardar ' + f.name + ': ' + e.message); } } if (fs.length) toast(fs.length === 1 ? 'Archivo agregado' : `${fs.length} archivos agregados`); R(); }
  };
  /* ---------- Enter en campos ([data-enter]) ---------- */
  const E = {
    capturaDia: (d, el) => { const v = el.value.trim(); if (!v) return; const res = Model.desdeCaptura(v, { miDia: true }); el.value = '';
      if (res?.recurrente) toast('Recurrente creada: ' + res.recurrente.titulo); else if (Model.prioridadesUsadas() > Model.datos.config.maxPrioridades) toast('Pasaste tus ' + Model.datos.config.maxPrioridades + ' prioridades del día'); UI.focus = 'cap-dia'; R(); },
    capturaBandeja: (d, el) => { const v = el.value.trim(); if (!v) return; const res = Model.desdeCaptura(v, { estado: 'bandeja' }); el.value = ''; if (res?.tarea && res.tarea.estado !== 'bandeja') toast('Tenía proyecto o fecha: quedó en Por hacer'); UI.focus = 'cap-bandeja'; R(); },
    capturaParking: (d, el) => { const v = el.value.trim(); if (!v) return; Model.desdeCaptura(v, { estado: 'parking', origen: 'Estacionada en el Parking Lot.' }); el.value = ''; UI.focus = 'cap-park'; R(); },
    capturaModal: () => A.capturaModal(),
    nuevoProyecto: (d, el) => { const v = el.value.trim(); if (!v) return; Model.crearProyecto(v); el.value = ''; UI.focus = 'cap-proy'; R(); },
    crearEnColumna: (d, el) => {
      const v = el.value.trim(); if (!v) return; const key = d.v;
      let res;
      if (UI.tablero.agrupar === 'estado') {
        res = Model.desdeCaptura(v, { estado: key === 'hecho' ? 'porhacer' : key });
        const t = res?.tarea;
        if (t && key === 'hecho') Model.completar(t);
        if (t && key === 'espera' && !t.espera) Model.actualizar(t, { espera: { persona: '', motivo: '', desde: U.hoy(), seguimiento: U.addDias(U.hoy(), 2) } });
      } else res = Model.desdeCaptura(v, { estado: 'porhacer', proyectoId: key === 'none' ? null : key });
      UI.addCol = key; R();
    },
    dSubAgregar: (d, el) => { const v = el.value.trim(); if (!v) return; Model.agregarSub(T(d.id), v); el.value = ''; UI.focus = 'd-sub'; R(); },
    dEnlace: (d, el) => { let v = el.value.trim(); if (!v) return; if (!/^[a-z]+:\/\//i.test(v)) v = 'https://' + v; const t = T(d.id);
      let titulo = v; try { const u = new URL(v); titulo = u.hostname + (u.pathname.length > 1 ? u.pathname.slice(0, 40) : ''); } catch (e) { /* url libre */ }
      Model.actualizar(t, { enlaces: [...t.enlaces, { titulo, url: v }] }, `Enlace agregado: ${v}`); UI.focus = 'd-link'; R(); },
    esperaOk: () => A.esperaOk()
  };
  /* ---------- Escritura en vivo ([data-input]) ---------- */
  const I = {
    gridQ: (d, el) => { UI.grid.q = el.value; R(); },
    popQ: (d, el) => { UI.popQ = el.value; const l = $('#pop-list'); if (l) l.innerHTML = V.popLista(UI); },
    buscarQ: (d, el) => { UI.modal.q = el.value; UI.modal.sel = 0; $('#resultados').innerHTML = MV.resultados(el.value, 0); }
  };

  /* ---------- Arrastrar y soltar ---------- */
  let DRAG = null; const LINEA = document.createElement('div'); LINEA.className = 'drop-line';
  function limpiarDrag() { LINEA.remove(); document.querySelectorAll('.over').forEach(x => x.classList.remove('over')); document.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging')); }
  function posicionar(contenedor, sel, y) {
    const items = [...contenedor.querySelectorAll(sel)].filter(x => x.dataset.id !== DRAG.id);
    let antes = null;
    for (const it of items) { const r = it.getBoundingClientRect(); if (y < r.top + r.height / 2) { antes = it; break; } }
    if (antes) contenedor.insertBefore(LINEA, antes); else if (items.length) items[items.length - 1].after(LINEA); else contenedor.appendChild(LINEA);
    return antes ? antes.dataset.id : null;
  }
  function autoScroll(x, y) {
    const sc = document.querySelector('.board-scroll');
    if (DRAG?.tipo === 'card' && sc) { const r = sc.getBoundingClientRect(); if (x > r.right - 70) sc.scrollLeft += 18; else if (x < r.left + 70) sc.scrollLeft -= 18; }
    if (DRAG?.touch) {
      const ov = [...document.querySelectorAll('.overlay')].pop();
      const dy = y < 80 ? -14 : (y > innerHeight - 80 ? 14 : 0);
      if (dy) { if (ov) ov.scrollTop += dy; else window.scrollBy(0, dy); }
    }
  }
  /* Devuelve true si el punto (x, y) es un lugar válido para soltar lo que se arrastra */
  function sobre(x, y, target) {
    if (!DRAG || !target) return false;
    autoScroll(x, y);
    if (DRAG.tipo === 'dia') { const c = target.closest('#lista-dia, #plan-list'); if (!c) return false; DRAG.antes = posicionar(c, '[data-drag="dia"]', y); return true; }
    if (DRAG.tipo === 'sub') { const c = target.closest('#subs'); if (!c) return false; DRAG.antes = posicionar(c, '[data-drag="sub"]', y); return true; }
    if (DRAG.tipo === 'card') {
      const col = target.closest('[data-col]'); if (!col) return false;
      document.querySelectorAll('.bcol.over, .pcol.over').forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over');
      if (col.classList.contains('bcol')) DRAG.antes = posicionar(col, '.kcard', y); else { LINEA.remove(); DRAG.antes = null; }
      DRAG.col = col.dataset.col; return true;
    }
    if (DRAG.tipo === 'ev') {
      const cell = target.closest('[data-fecha]'); if (!cell) return false;
      document.querySelectorAll('.cell.over').forEach(x => x !== cell && x.classList.remove('over')); cell.classList.add('over'); DRAG.fecha = cell.dataset.fecha; return true;
    }
    return false;
  }
  function soltar() {
    if (!DRAG) return;
    const d = DRAG; limpiarDrag(); DRAG = null;
    if (d.tipo === 'dia' && d.antes !== undefined) { Model.moverDia(d.id, d.antes); R(); }
    else if (d.tipo === 'sub' && d.antes !== undefined && UI.tareaId) { Model.moverSub(T(UI.tareaId), d.id, d.antes); R(); }
    else if (d.tipo === 'card' && d.col) soltarTarjeta(d);
    else if (d.tipo === 'ev' && d.fecha) {
      const t = T(d.id); if (!t) return;
      if (d.kind === 'seg' && t.espera) { if (t.espera.seguimiento !== d.fecha) Model.actualizar(t, { espera: Object.assign({}, t.espera, { seguimiento: d.fecha }) }, `Seguimiento movido al ${U.fCorta(d.fecha)}.`); }
      else if (t.estado !== 'hecho' && t.fecha !== d.fecha) Model.actualizar(t, { fecha: d.fecha }, `Fecha: ${t.fecha ? U.fCorta(t.fecha) : 'sin fecha'} → ${U.fCorta(d.fecha)}.`);
      R();
    }
  }
  function initDnD() {
    /* Mouse: arrastrar y soltar nativo del navegador */
    document.addEventListener('dragstart', ev => {
      const el = ev.target.closest?.('[data-drag]'); if (!el) return;
      DRAG = { tipo: el.dataset.drag, id: el.dataset.id, kind: el.dataset.kind, antes: undefined };
      ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', el.dataset.id);
      setTimeout(() => el.classList.add('dragging'), 0);
    });
    document.addEventListener('dragend', () => { limpiarDrag(); DRAG = null; });
    document.addEventListener('dragover', ev => { if (DRAG && sobre(ev.clientX, ev.clientY, ev.target)) ev.preventDefault(); });
    document.addEventListener('drop', ev => { if (!DRAG) return; ev.preventDefault(); soltar(); });

    /* Dedo: mantener presionado ~0.35 s y arrastrar */
    let TD = null, fantasma = null, suprimirClick = false;
    const cancelar = () => { if (TD) clearTimeout(TD.timer); TD = null; };
    document.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'touch' || !TOUCH) return;
      const el = ev.target.closest('[data-drag]'); if (!el || ev.target.closest('input, textarea, select')) return;
      TD = { el, x0: ev.clientX, y0: ev.clientY, activo: false };
      TD.timer = setTimeout(() => {
        if (!TD) return;
        TD.activo = true;
        DRAG = { tipo: el.dataset.drag, id: el.dataset.id, kind: el.dataset.kind, antes: undefined, touch: true };
        const r = el.getBoundingClientRect();
        fantasma = el.cloneNode(true); fantasma.className += ' fantasma';
        Object.assign(fantasma.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', zIndex: 200, pointerEvents: 'none', margin: 0 });
        TD.dx = TD.x0 - r.left; TD.dy = TD.y0 - r.top;
        document.body.appendChild(fantasma); el.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(15);
      }, 350);
    });
    document.addEventListener('pointermove', ev => {
      if (!TD || ev.pointerType !== 'touch') return;
      if (!TD.activo) { if (Math.hypot(ev.clientX - TD.x0, ev.clientY - TD.y0) > 10) cancelar(); return; }
      fantasma.style.left = (ev.clientX - TD.dx) + 'px'; fantasma.style.top = (ev.clientY - TD.dy) + 'px';
      sobre(ev.clientX, ev.clientY, document.elementFromPoint(ev.clientX, ev.clientY));
    });
    const fin = ev => {
      if (!TD) return;
      const activo = TD.activo; cancelar();
      if (fantasma) { fantasma.remove(); fantasma = null; }
      if (activo) { suprimirClick = true; setTimeout(() => { suprimirClick = false; }, 120); if (ev.type === 'pointerup') soltar(); else { limpiarDrag(); DRAG = null; } }
    };
    document.addEventListener('pointerup', fin);
    document.addEventListener('pointercancel', fin);
    document.addEventListener('touchmove', ev => { if (TD?.activo) ev.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', ev => { if (TD || ev.target.closest?.('[data-drag]') && TOUCH) ev.preventDefault(); });
    document.addEventListener('click', ev => { if (suprimirClick) { ev.stopPropagation(); ev.preventDefault(); suprimirClick = false; } }, true);
  }
  function soltarTarjeta(d) {
    const t = T(d.id); if (!t) return;
    const colEl = document.querySelector(`section[data-col="${CSS.escape(d.col)}"]`);
    const ids = colEl ? [...colEl.querySelectorAll('.kcard')].map(x => x.dataset.id) : [];
    if (UI.tablero.agrupar === 'proyecto') { Model.moverEnColumna(t, 'proyectoId', d.col === 'none' ? null : d.col, d.antes, ids); R(); return; }
    const destino = d.col;
    if (destino !== t.estado) {
      if (destino === 'espera') { UI.modal = { tipo: 'espera', id: t.id, orden: { antesDe: d.antes, ids } }; UI.focus = 'w-persona'; R(); return; }
      if (destino === 'hecho') completarConPregunta(t); else Model.cambiarEstado(t, destino);
      toast(`${t.titulo} → ${EST[destino]}`);
    }
    Model.moverEnColumna(t, 'estado', null, d.antes, ids); R();
  }

  /* ---------- Eventos globales ---------- */
  function initEventos() {
    document.addEventListener('click', ev => {
      if (UI.pop && !ev.target.closest('.pop-wrap')) { UI.pop = null; R(); }
      const ov = ev.target.classList?.contains('overlay') ? ev.target : null;
      if (ov) { if (ov.dataset.ov === 'modal') UI.modal = null; else UI.tareaId = null; R(); return; }
      const el = ev.target.closest('[data-a]'); if (!el) return;
      const fn = A[el.dataset.a]; if (!fn) return;
      if (el.type !== 'checkbox' && el.type !== 'radio') ev.preventDefault();
      fn(el.dataset, el, ev);
    });
    document.addEventListener('change', ev => { const el = ev.target.closest('[data-ch]'); if (el && C[el.dataset.ch]) C[el.dataset.ch](el.dataset, el); });
    document.addEventListener('input', ev => { const el = ev.target.closest('[data-input]'); if (el && I[el.dataset.input]) I[el.dataset.input](el.dataset, el); });
    document.addEventListener('keydown', ev => {
      const el = ev.target; const enCampo = el.matches?.('input, textarea, select, [contenteditable]');
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); A.buscar(); return; }
      if (ev.key === 'Escape') {
        if (el.id === 'add-col') { UI.addCol = null; R(); return; }
        if (UI.pop) { UI.pop = null; R(); return; }
        if (UI.modal) { UI.modal = null; R(); return; }
        if (UI.tareaId) { if (enCampo) el.blur(); UI.tareaId = null; R(); return; }
      }
      if (UI.modal?.tipo === 'buscar' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(ev.key)) {
        const rs = [...document.querySelectorAll('#resultados .res')]; if (!rs.length) return; ev.preventDefault();
        if (ev.key === 'Enter') { rs[UI.modal.sel]?.click(); return; }
        UI.modal.sel = Math.max(0, Math.min(rs.length - 1, UI.modal.sel + (ev.key === 'ArrowDown' ? 1 : -1)));
        rs.forEach((r, i) => r.classList.toggle('sel', i === UI.modal.sel)); rs[UI.modal.sel].scrollIntoView({ block: 'nearest' }); return;
      }
      if ((ev.key === 'Enter' || ev.keyCode === 13) && !ev.shiftKey && el.matches?.('input[data-enter]')) { ev.preventDefault(); E[el.dataset.enter]?.(el.dataset, el); return; }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && el.matches?.('textarea[data-ctrlenter]')) { ev.preventDefault(); A[el.dataset.ctrlenter]?.(el.dataset, el); return; }
      if (!enCampo && !UI.modal && !ev.ctrlKey && !ev.metaKey && !ev.altKey && (ev.key === 'n' || ev.key === 'N') && Model.datos) {
        ev.preventDefault(); UI.modal = { tipo: 'captura', destino: UI.vista === 'midia' ? 'midia' : 'bandeja' }; UI.focus = 'cap-modal'; R();
      }
    });
    window.addEventListener('hashchange', ruta);
    matchMedia('(max-width: 640px)').addEventListener('change', () => R());
    window.addEventListener('focus', () => { revisarDia(); revisarMovil(); });
    setInterval(() => { revisarDia(); actualizarGuardado(); }, 30000);
    setInterval(revisarMovil, 120000);
  }
  function ruta() {
    const v = (location.hash.match(/^#\/(\w+)/) || [])[1];
    UI.vista = VISTAS.includes(v) ? v : 'midia'; UI.pop = null; UI.addCol = null; UI.menu = false; R();
    window.scrollTo(0, 0);
  }
  function revisarDia() { if (!Model.datos) return; if (Model.asegurarDia()) { Model.generarRecurrentes(); UI.cal.ref = U.hoy(); R(); } }
  async function revisarMovil() {
    if (!Model.datos) return;
    try { const l = await Model.leerMovil(); if (l.join('\n') !== UI.movil.join('\n')) { UI.movil = l; R(); } } catch (e) { console.warn(e); }
  }

  /* ---------- Arranque ---------- */
  async function abrirCon(backend) {
    await Model.cargar(backend);
    Model.onCambio = tipo => { if (tipo === 'guardado') actualizarGuardado(); };
    if (!iniciado) { initEventos(); initDnD(); iniciado = true; }
    UI.movil = await Model.leerMovil().catch(() => []);
    ruta();
  }
  function pantalla(html) { $('#app').innerHTML = `<div class="welcome">${html}</div>`; }
  function registrarPWA() {
    if (!/^https?:$/.test(location.protocol)) return;
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
  }
  async function iniciar() {
    registrarPWA();
    if (new URLSearchParams(location.search).has('prueba')) { await abrirCon(Storage.memBackend('prueba (memoria)')); return; }
    if (!Storage.SOPORTADO) {
      pantalla(`<h1>Abre Mi Planner en Edge o Chrome</h1><p>Esta app guarda todo en una carpeta de tu computadora y para eso necesita <b>Microsoft Edge</b> o <b>Google Chrome</b> (versión reciente). Este navegador no lo permite.</p>`);
      return;
    }
    const st = await Storage.permisoGuardado(false).catch(() => ({ estado: 'ninguna' }));
    if (st.estado === 'ok') { await abrirCon(st.backend); return; }
    const elegir = async () => { try { const b = await Storage.elegirCarpeta(); await abrirCon(b); } catch (e) { if (e.name !== 'AbortError') alert('No se pudo abrir la carpeta: ' + e.message); } };
    if (st.estado === 'pedir') {
      pantalla(`<h1>Mi Planner</h1><p>Da clic para abrir tu carpeta de datos <b>${U.esc(st.nombre)}</b>. El navegador pide confirmar el permiso en cada sesión; es un solo clic.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" id="b-abrir">${ic('folder', 's16')}Abrir ${U.esc(st.nombre)}</button><button class="btn" id="b-otra">Elegir otra carpeta</button></div>`);
      $('#b-abrir').onclick = async () => { const r = await Storage.permisoGuardado(true); if (r.estado === 'ok') await abrirCon(r.backend); };
      $('#b-otra').onclick = elegir;
      return;
    }
    pantalla(`<h1>Bienvenido a Mi Planner</h1><p>Tus tareas se guardan en archivos dentro de una carpeta de tu computadora. <b>Nada se guarda en el navegador</b> ni sale a internet.</p>
      <ol><li>Da clic en <b>Elegir carpeta</b>.</li><li>En la laptop, elige la carpeta <b>datos</b> que viene junto a index.html. En tableta o celular, crea y elige una carpeta como <b>Documentos/MiPlanner</b>.</li><li>Acepta el permiso para editar archivos que pide el navegador.</li></ol>
      <p class="muted small" style="margin:0">Si eliges la carpeta de la app (donde está index.html), se usará automáticamente la subcarpeta <b>datos</b>.</p>
      <div><button class="btn pri" id="b-elegir">${ic('folder', 's16')}Elegir carpeta</button></div>`);
    $('#b-elegir').onclick = elegir;
  }

  return { iniciar, UI, render, R, A, toast, abrirCon };
})();

window.addEventListener('DOMContentLoaded', () => App.iniciar());
