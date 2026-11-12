/* Modelo de datos y reglas de negocio */
'use strict';

const ESTADOS = [
  ['bandeja', 'Bandeja'], ['porhacer', 'Por hacer'], ['encurso', 'En curso'],
  ['espera', 'En espera'], ['hecho', 'Hecho'], ['parking', 'Parking Lot']
];
const EST = Object.fromEntries(ESTADOS);
const PRIORIDADES = [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']];
const COLORES = ['#2E5BBA', '#0F766E', '#6D4AA8', '#B45309', '#9F1D5A', '#3E7C2F', '#B42318', '#1D6F99', '#7A5C00', '#5B5F6B'];
const ARCHIVO_DATOS = 'planner.json';
const ARCHIVO_MOVIL = 'bandeja-movil.txt';
const CABECERA_MOVIL = '// Escribe una tarea o idea por línea. Mi Planner las pasará a tu Bandeja al abrirse.\n// Puedes usar: #proyecto  !alta  @viernes  >persona\n';

const Model = (() => {
  let B = null;           // backend de almacenamiento
  let D = null;           // datos principales (planner.json)
  let ARCH = {};          // { '2026': [tareas] }
  const archSucio = new Set();
  let ultimoGuardado = null, errorGuardado = null, guardando = false, pendiente = false;
  let onCambio = () => {};

  function nuevo() {
    return {
      version: 1,
      seq: { T: 0, R: 0, P: 0 },
      config: { espacio: 'Trabajo', maxPrioridades: 10, diasEstancada: 15, diasHechoTablero: 7, diasArchivo: 90, parkingRevisado: U.hoy() },
      proyectos: [], tareas: [], recurrentes: [],
      plan: { fecha: U.hoy(), items: [], decididos: [], planeadoA: null },
      planAnterior: null
    };
  }
  function migrar(d) {
    const n = nuevo();
    d.config = Object.assign(n.config, d.config || {});
    for (const k of ['proyectos', 'tareas', 'recurrentes']) d[k] = d[k] || [];
    d.seq = Object.assign(n.seq, d.seq || {});
    d.plan = Object.assign(n.plan, d.plan || {});
    for (const t of d.tareas) normTarea(t);
    return d;
  }
  function normTarea(t) {
    t.subtareas = t.subtareas || []; t.bitacora = t.bitacora || []; t.adjuntos = t.adjuntos || [];
    t.enlaces = t.enlaces || []; t.etiquetas = t.etiquetas || [];
    if (t.orden == null) t.orden = Date.parse(t.creada || 0) || 0;
    return t;
  }

  /* ---------- Carga y guardado ---------- */
  async function cargar(backend) {
    B = backend; ARCH = {};
    const txt = await B.readText(ARCHIVO_DATOS);
    D = txt ? migrar(JSON.parse(txt)) : nuevo();
    for (const f of await B.list('archivo')) {
      const m = f.name.match(/^(\d{4})\.json$/);
      if (m && f.kind === 'file') { const a = JSON.parse(await B.readText('archivo/' + f.name) || '{"tareas":[]}'); ARCH[m[1]] = (a.tareas || []).map(normTarea); }
    }
    archivar();
    asegurarDia();
    generarRecurrentes();
    await guardarAhora();
  }

  async function guardarAhora() {
    if (!B || !D) return;
    if (guardando) { pendiente = true; return; }
    guardando = true;
    try {
      await respaldoDiario();
      await B.write(ARCHIVO_DATOS, JSON.stringify(D, null, 1));
      for (const y of [...archSucio]) {
        await B.write(`archivo/${y}.json`, JSON.stringify({ version: 1, tareas: ARCH[y] || [] }, null, 1));
        archSucio.delete(y);
      }
      ultimoGuardado = Date.now(); errorGuardado = null;
    } catch (e) { console.error(e); errorGuardado = e.message || String(e); }
    guardando = false;
    onCambio('guardado');
    if (pendiente) { pendiente = false; guardarAhora(); }
  }
  const guardarDiferido = U.debounce(guardarAhora, 400);
  function cambio() { guardarDiferido(); onCambio('datos'); }

  async function respaldoDiario() {
    const f = U.hoy();
    if (D._respaldo === f) return;
    const actual = await B.readText(ARCHIVO_DATOS);
    if (actual) await B.write(`respaldos/planner-${f}.json`, actual);
    D._respaldo = f;
    const lista = (await B.list('respaldos')).map(x => x.name).filter(n => /^planner-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
    for (const n of lista.slice(0, Math.max(0, lista.length - 14))) await B.remove('respaldos/' + n);
  }

  function archivar() {
    const limite = U.addDias(U.hoy(), -D.config.diasArchivo);
    const quedan = [];
    for (const t of D.tareas) {
      const c = U.dateOfTs(t.completada);
      if (t.estado === 'hecho' && c && c < limite && !D.plan.items.includes(t.id)) {
        const y = c.slice(0, 4); (ARCH[y] = ARCH[y] || []).push(t); archSucio.add(y);
      } else quedan.push(t);
    }
    D.tareas = quedan;
  }
  function desarchivar(t) {
    for (const y in ARCH) {
      const i = ARCH[y].indexOf(t);
      if (i >= 0) { ARCH[y].splice(i, 1); archSucio.add(y); D.tareas.push(t); return; }
    }
  }

  /* ---------- Consultas ---------- */
  const tareas = () => D.tareas;
  const archivadas = () => Object.values(ARCH).flat();
  const todas = () => D.tareas.concat(archivadas());
  const get = id => D.tareas.find(t => t.id === id) || archivadas().find(t => t.id === id) || null;
  const esArchivada = t => !D.tareas.includes(t);
  const proyecto = id => D.proyectos.find(p => p.id === id) || null;
  const recurrente = id => D.recurrentes.find(r => r.id === id) || null;
  const activa = t => !['hecho', 'parking'].includes(t.estado);
  const vencida = t => activa(t) && t.estado !== 'bandeja' && t.fecha && t.fecha < U.hoy();
  const ultimaNota = t => [...t.bitacora].reverse().find(b => b.tipo === 'nota') || null;
  function estancadas() {
    const lim = U.addDias(U.hoy(), -D.config.diasEstancada);
    return D.tareas.filter(t => ['porhacer', 'encurso', 'espera'].includes(t.estado) && !t.recurrenteId && U.dateOfTs(t.actualizada) < lim);
  }

  /* ---------- Tareas ---------- */
  function siguienteId(tipo) { D.seq[tipo] = (D.seq[tipo] || 0) + 1; return `${tipo}-${String(D.seq[tipo]).padStart(4, '0')}`; }
  function log(t, texto, tipo = 'sistema', extra) {
    t.bitacora.push(Object.assign({ id: U.uid(), ts: U.ahora(), texto, tipo }, extra || {}));
  }
  function tocar(t) { if (esArchivada(t)) desarchivar(t); t.actualizada = U.ahora(); }

  function crearTarea(p, origen) {
    const t = normTarea({
      id: siguienteId('T'), titulo: p.titulo || 'Sin título', descripcion: p.descripcion || '',
      proyectoId: p.proyectoId || null, estado: p.estado || 'porhacer', prioridad: p.prioridad || null,
      fecha: p.fecha || null, etiquetas: p.etiquetas || [], subtareas: (p.subtareas || []).map(s => ({ id: U.uid(), texto: s, hecha: false })),
      bitacora: [], adjuntos: [], enlaces: [], espera: null,
      creada: U.ahora(), actualizada: U.ahora(), completada: null, orden: Date.now() + Math.random(),
      recurrenteId: p.recurrenteId || null, instanciaFecha: p.instanciaFecha || null, urgente: !!p.urgente
    });
    if (p.persona) { t.estado = 'espera'; t.espera = { persona: p.persona, motivo: '', desde: U.hoy(), seguimiento: U.addDias(U.hoy(), 2) }; }
    log(t, origen || 'Tarea creada.');
    D.tareas.push(t);
    cambio();
    return t;
  }

  function desdeCaptura(texto, opciones = {}) {
    const c = U.parseCaptura(texto);
    if (!c.titulo) return null;
    const proyectoId = c.proyecto ? proyectoPorNombre(c.proyecto).id : (opciones.proyectoId || null);
    if (c.recurrencia) {
      const r = crearRecurrente({ titulo: c.titulo, proyectoId, prioridad: c.prioridad, frecuencia: c.recurrencia, dias: [1, 2, 3, 4, 5], diaMes: +U.hoy().slice(8) });
      return { recurrente: r };
    }
    let estado = opciones.estado || 'porhacer';
    if (estado === 'bandeja' && (c.proyecto || c.fecha || c.prioridad)) estado = 'porhacer';
    const t = crearTarea({ titulo: c.titulo, proyectoId, prioridad: c.prioridad, fecha: c.fecha, persona: c.persona, etiquetas: c.etiquetas, estado, urgente: opciones.urgente },
      opciones.origen || (estado === 'bandeja' ? 'Capturada en la Bandeja.' : 'Tarea creada.'));
    if (opciones.miDia) agregarDia(t.id, { forzar: true });
    return { tarea: t };
  }

  function actualizar(t, cambios, texto) {
    tocar(t); Object.assign(t, cambios); if (texto) log(t, texto); cambio();
  }

  function cambiarEstado(t, estado, extra = {}) {
    if (t.estado === estado && !extra.espera) return;
    tocar(t);
    const antes = t.estado;
    let texto = `Estado: ${EST[antes]} → ${EST[estado]}`;
    if (antes === 'espera' && estado !== 'espera') {
      if (t.espera?.persona) texto += ` (respondió ${t.espera.persona})`;
      t.espera = null;
    }
    if (estado === 'espera') {
      t.espera = Object.assign({ persona: '', motivo: '', desde: U.hoy(), seguimiento: U.addDias(U.hoy(), 2) }, t.espera || {}, extra.espera || {});
      if (t.espera.persona) texto += ` (${t.espera.persona})`;
      if (t.espera.seguimiento) texto += `. Seguimiento: ${U.fCorta(t.espera.seguimiento)}`;
    }
    if (estado === 'hecho') {
      t.completada = U.ahora();
      if (extra.cerrarSubtareas) t.subtareas.forEach(s => { s.hecha = true; });
      if (t.recurrenteId) histRec(t, 'ok');
    } else if (antes === 'hecho') {
      t.completada = null;
      if (t.recurrenteId) quitarHistRec(t);
    }
    if (estado === 'parking') quitarDia(t.id, true);
    t.estado = estado;
    log(t, texto + '.');
    cambio();
  }
  const completar = (t, extra) => cambiarEstado(t, 'hecho', extra);
  const reabrir = t => cambiarEstado(t, 'porhacer');

  function eliminar(t) {
    D.tareas = D.tareas.filter(x => x !== t);
    for (const y in ARCH) { const i = ARCH[y].indexOf(t); if (i >= 0) { ARCH[y].splice(i, 1); archSucio.add(y); } }
    D.plan.items = D.plan.items.filter(id => id !== t.id);
    cambio();
  }

  function moverEnColumna(t, campo, valor, antesDeId, columnaIds) {
    // reordena dentro de una columna del tablero; columnaIds es el orden actual visible (sin t)
    const ids = columnaIds.filter(id => id !== t.id);
    const pos = antesDeId ? ids.indexOf(antesDeId) : ids.length;
    ids.splice(pos < 0 ? ids.length : pos, 0, t.id);
    ids.forEach((id, i) => { const x = get(id); if (x) x.orden = i + 1; });
    if (campo === 'proyectoId' && t.proyectoId !== valor) {
      const de = proyecto(t.proyectoId)?.nombre || 'Sin proyecto', a = proyecto(valor)?.nombre || 'Sin proyecto';
      tocar(t); t.proyectoId = valor; log(t, `Proyecto: ${de} → ${a}.`);
    }
    cambio();
  }

  /* ---------- Subtareas, bitácora, enlaces ---------- */
  function agregarSub(t, texto) { tocar(t); t.subtareas.push({ id: U.uid(), texto, hecha: false }); cambio(); }
  function toggleSub(t, sid) { const s = t.subtareas.find(x => x.id === sid); if (!s) return; tocar(t); s.hecha = !s.hecha; cambio(); }
  function editarSub(t, sid, texto) { const s = t.subtareas.find(x => x.id === sid); if (!s || s.texto === texto) return; tocar(t); s.texto = texto; cambio(); }
  function quitarSub(t, sid) { tocar(t); t.subtareas = t.subtareas.filter(x => x.id !== sid); cambio(); }
  function moverSub(t, sid, antesDe) {
    const s = t.subtareas.find(x => x.id === sid); if (!s) return;
    const resto = t.subtareas.filter(x => x !== s); let i = antesDe ? resto.findIndex(x => x.id === antesDe) : resto.length; if (i < 0) i = resto.length;
    resto.splice(i, 0, s); tocar(t); t.subtareas = resto; cambio();
  }
  function agregarNota(t, texto) { tocar(t); log(t, texto, 'nota'); cambio(); }
  function quitarNota(t, nid) { tocar(t); t.bitacora = t.bitacora.filter(b => b.id !== nid); cambio(); }

  /* ---------- Adjuntos ---------- */
  function nombreSeguro(n) { return n.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120); }
  async function agregarAdjunto(t, file) {
    let nombre = nombreSeguro(file.name);
    const existentes = new Set(t.adjuntos.map(a => a.nombre));
    if (existentes.has(nombre)) { const p = nombre.lastIndexOf('.'); const base = p > 0 ? nombre.slice(0, p) : nombre, ext = p > 0 ? nombre.slice(p) : ''; let i = 2; while (existentes.has(`${base} (${i})${ext}`)) i++; nombre = `${base} (${i})${ext}`; }
    const ruta = `adjuntos/${t.id}/${nombre}`;
    await B.write(ruta, file);
    tocar(t); t.adjuntos.push({ id: U.uid(), nombre, ruta, ts: U.ahora(), tam: file.size });
    log(t, `Adjunto agregado: ${nombre}.`);
    cambio();
  }
  async function leerAdjunto(a) { return await B.readBlob(a.ruta); }
  async function quitarAdjunto(t, aid) {
    const a = t.adjuntos.find(x => x.id === aid); if (!a) return;
    await B.remove(a.ruta); tocar(t); t.adjuntos = t.adjuntos.filter(x => x !== a); log(t, `Adjunto eliminado: ${a.nombre}.`); cambio();
  }

  /* ---------- Proyectos ---------- */
  function crearProyecto(nombre, extra = {}) {
    const p = Object.assign({ id: siguienteId('P'), nombre, color: COLORES[D.proyectos.length % COLORES.length], fijado: D.proyectos.filter(x => x.fijado).length < 6, parking: false, archivado: false, creado: U.ahora() }, extra);
    D.proyectos.push(p); cambio(); return p;
  }
  function proyectoPorNombre(n) {
    const s = U.slug(n);
    const p = D.proyectos.find(x => U.slug(x.nombre) === s) || D.proyectos.find(x => U.slug(x.nombre).startsWith(s));
    return p || crearProyecto(n.charAt(0).toUpperCase() + n.slice(1));
  }
  function actualizarProyecto(p, cambios) { Object.assign(p, cambios); cambio(); }
  function eliminarProyecto(p) {
    for (const t of todas()) if (t.proyectoId === p.id) t.proyectoId = null;
    for (const r of D.recurrentes) if (r.proyectoId === p.id) r.proyectoId = null;
    D.proyectos = D.proyectos.filter(x => x !== p); Object.keys(ARCH).forEach(y => archSucio.add(y)); cambio();
  }

  /* ---------- Mi día / plan ---------- */
  function asegurarDia() {
    const h = U.hoy();
    if (D.plan.fecha !== h) {
      D.planAnterior = { fecha: D.plan.fecha, items: D.plan.items.slice() };
      D.plan = { fecha: h, items: [], decididos: [], planeadoA: null };
      cambio();
      return true;
    }
    return false;
  }
  const enDia = id => D.plan.items.includes(id);
  const prioridadesUsadas = () => D.plan.items.map(get).filter(t => t && !t.urgente).length;
  function agregarDia(id, { forzar = false, urgente = false } = {}) {
    if (enDia(id)) return true;
    if (!forzar && !urgente && prioridadesUsadas() >= D.config.maxPrioridades) return false;
    D.plan.items.push(id);
    const t = get(id);
    if (t) { if (urgente) t.urgente = true; if (t.estado === 'bandeja' || t.estado === 'parking') { tocar(t); log(t, `Estado: ${EST[t.estado]} → Por hacer.`); t.estado = 'porhacer'; } }
    cambio(); return true;
  }
  function quitarDia(id, silencioso) {
    D.plan.items = D.plan.items.filter(x => x !== id);
    const t = get(id); if (t) t.urgente = false;
    if (!silencioso) cambio();
  }
  function moverDia(id, antesDe) {
    const it = D.plan.items.filter(x => x !== id); let i = antesDe ? it.indexOf(antesDe) : it.length; if (i < 0) i = it.length;
    it.splice(i, 0, id); D.plan.items = it; cambio();
  }
  function decidir(id) { if (!D.plan.decididos.includes(id)) D.plan.decididos.push(id); cambio(); }
  function marcarPlaneado() { D.plan.planeadoA = U.hora(); cambio(); }

  function pendientesAyer() {
    const ant = D.planAnterior?.items || [];
    return ant.map(get).filter(t => t && activa(t) && !enDia(t.id) && !D.plan.decididos.includes(t.id) && !t.recurrenteId);
  }
  function venceHoyOAntes() {
    const h = U.hoy(); const ya = new Set(pendientesAyer().map(t => t.id));
    return D.tareas.filter(t => activa(t) && t.estado !== 'espera' && t.estado !== 'bandeja' && t.fecha && t.fecha <= h && !enDia(t.id) && !D.plan.decididos.includes(t.id) && !ya.has(t.id));
  }
  function seguimientosHoy() {
    const h = U.hoy();
    return D.tareas.filter(t => t.estado === 'espera' && t.espera?.seguimiento && t.espera.seguimiento <= h && !enDia(t.id) && !D.plan.decididos.includes(t.id));
  }

  /* ---------- Recurrentes ---------- */
  function ultimoDiaMes(f) { const d = U.parse(f); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function ocurre(r, f) {
    if (r.desde && f < r.desde) return false;
    const w = U.diaSemana(f);
    switch (r.frecuencia) {
      case 'diaria': return true;
      case 'habiles': return w >= 1 && w <= 5;
      case 'semanal': return (r.dias || []).includes(w);
      case 'mensual': return +f.slice(8) === Math.min(r.diaMes || 1, ultimoDiaMes(f));
      default: return false;
    }
  }
  function freqTexto(r) {
    const n = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    switch (r.frecuencia) {
      case 'diaria': return 'Todos los días';
      case 'habiles': return 'Días hábiles (L–V)';
      case 'semanal': return 'Cada semana: ' + ([...(r.dias || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => n[d]).join(', ') || 'sin días');
      case 'mensual': return `Cada mes, día ${r.diaMes || 1}`;
    }
    return '';
  }
  function proximaFecha(r) { let f = U.hoy(); if (r.ultimaGenerada === f) f = U.addDias(f, 1); for (let i = 0; i < 400; i++, f = U.addDias(f, 1)) if (ocurre(r, f)) return f; return null; }
  function crearRecurrente(p) {
    const r = Object.assign({ id: siguienteId('R'), titulo: 'Nueva recurrente', proyectoId: null, prioridad: null, frecuencia: 'habiles', dias: [1, 2, 3, 4, 5], diaMes: 1,
      hora: '', autoMiDia: true, modo: 'reemplazar', subtareas: [], activa: true, creada: U.ahora(), desde: U.hoy(), ultimaGenerada: null, historial: [] }, p);
    D.recurrentes.push(r); generarRecurrentes(); cambio(); return r;
  }
  function actualizarRecurrente(r, cambios) { Object.assign(r, cambios); generarRecurrentes(); cambio(); }
  function eliminarRecurrente(r) { D.recurrentes = D.recurrentes.filter(x => x !== r); for (const t of D.tareas) if (t.recurrenteId === r.id) t.recurrenteId = null; cambio(); }
  function histRec(t, estado) {
    const r = recurrente(t.recurrenteId); if (!r) return;
    r.historial = r.historial.filter(h => h.fecha !== t.instanciaFecha);
    r.historial.push({ fecha: t.instanciaFecha || U.hoy(), estado, hora: U.hora() });
    r.historial.sort((a, b) => a.fecha < b.fecha ? -1 : 1); r.historial = r.historial.slice(-60);
  }
  function quitarHistRec(t) { const r = recurrente(t.recurrenteId); if (r) r.historial = r.historial.filter(h => h.fecha !== t.instanciaFecha); }
  function instancias(r) { return D.tareas.filter(t => t.recurrenteId === r.id); }
  function generarRecurrentes() {
    const f = U.hoy(); let hubo = false;
    for (const r of D.recurrentes) {
      if (!r.activa || r.ultimaGenerada === f || !ocurre(r, f)) continue;
      if (r.modo === 'reemplazar') {
        for (const t of instancias(r).filter(t => activa(t))) {
          histRec(t, 'saltada'); D.tareas = D.tareas.filter(x => x !== t); D.plan.items = D.plan.items.filter(id => id !== t.id);
        }
      }
      const t = crearTarea({ titulo: r.titulo, proyectoId: r.proyectoId, prioridad: r.prioridad, fecha: f, subtareas: r.subtareas, recurrenteId: r.id, instanciaFecha: f },
        'Creada automáticamente por la recurrente ' + r.id + '.');
      if (r.autoMiDia) agregarDia(t.id, { forzar: true });
      r.ultimaGenerada = f; hubo = true;
    }
    if (hubo) cambio();
  }
  function saltarHoy(t) {
    histRec(t, 'saltada'); D.tareas = D.tareas.filter(x => x !== t); D.plan.items = D.plan.items.filter(id => id !== t.id); cambio();
  }
  function hacerRecurrente(t, p) {
    const r = crearRecurrente(Object.assign({ titulo: t.titulo, proyectoId: t.proyectoId, prioridad: t.prioridad, subtareas: t.subtareas.map(s => s.texto), ultimaGenerada: U.hoy() }, p));
    tocar(t); t.recurrenteId = r.id; t.instanciaFecha = U.hoy(); log(t, `Convertida en recurrente (${r.id}).`); cambio(); return r;
  }

  /* ---------- Bandeja del celular ---------- */
  async function leerMovil() {
    const txt = await B.readText(ARCHIVO_MOVIL);
    if (txt == null) { await B.write(ARCHIVO_MOVIL, CABECERA_MOVIL); return []; }
    return txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  }
  async function importarMovil() {
    const lineas = await leerMovil(); let n = 0;
    for (const l of lineas) { if (desdeCaptura(l, { estado: 'bandeja', origen: 'Capturada desde el celular (bandeja-movil.txt).' })) n++; }
    await B.write(ARCHIVO_MOVIL, CABECERA_MOVIL);
    return n;
  }

  /* ---------- Exportaciones ---------- */
  async function guardarExportacion(nombre, blob) { await B.write('exportaciones/' + nombre, blob); }

  /* ---------- Datos de ejemplo ---------- */
  function cargarEjemplo() {
    const h = U.hoy(), d = n => U.addDias(h, n);
    const P = [crearProyecto('OAuth OFC', { color: '#2E5BBA' }), crearProyecto('Blue Yonder', { color: '#0F766E' }), crearProyecto('DataStage cloud', { color: '#6D4AA8' }), crearProyecto('Dblinks', { color: '#B45309' })];
    const mk = (titulo, pi, estado, extra = {}) => { const t = crearTarea(Object.assign({ titulo, proyectoId: P[pi]?.id, estado }, extra), 'Tarea de ejemplo.'); return t; };
    const a = mk('Configurar client credentials OAuth para OFC', 0, 'espera', { prioridad: 'alta', fecha: d(17), persona: 'Seguridad TI', subtareas: ['Registrar la aplicación confidencial', 'Recibir el client secret de Seguridad TI', 'Definir los scopes con el equipo de OFC', 'Probar la conexión en TST', 'Documentar en la wiki'] });
    a.espera.seguimiento = h; a.espera.desde = d(-5); a.espera.motivo = 'Entregar el client secret';
    a.subtareas[0].hecha = true; a.subtareas[2].hecha = true;
    agregarNota(a, 'Mandé la solicitud formal del client secret por correo.');
    const b = mk('Validar client credentials OAuth en OIC (TST)', 0, 'encurso', { prioridad: 'alta', fecha: h, subtareas: ['Crear conexión', 'Probar token', 'Ejecutar integración de prueba'] });
    b.subtareas[0].hecha = true;
    mk('Enviar matriz de dblinks al equipo de DBA', 3, 'porhacer', { prioridad: 'alta', fecha: d(-1) });
    mk('Revisar respuestas del RFI de integraciones', 1, 'porhacer', { fecha: h });
    mk('Matriz de integraciones para proveedores', 1, 'encurso', { fecha: d(3) });
    mk('Actualizar sizing en el caso de negocio', 2, 'porhacer', { fecha: h, prioridad: 'media' });
    mk('Comité del caso de negocio DataStage', 2, 'porhacer', { fecha: d(6), prioridad: 'alta' });
    const w = mk('Confirmar ventana de pruebas', 1, 'espera', { persona: 'Proveedor' }); w.espera.seguimiento = d(2);
    const e = mk('Enviar minuta de la sesión de arquitectura', 1, 'porhacer'); completar(e);
    mk('Pedir a Seguridad el inventario de cuentas de servicio', 0, 'bandeja');
    mk('Idea: dashboard de errores OIC', null, 'parking');
    crearRecurrente({ titulo: 'Revisión de OIC', proyectoId: P[0].id, frecuencia: 'habiles', hora: '09:00', subtareas: ['Revisar instancias con error', 'Revisar agentes de conectividad', 'Revisar programaciones detenidas'] });
    for (const t of D.tareas) if (t.fecha === h && !enDia(t.id)) agregarDia(t.id);
    cambio();
  }

  return {
    get datos() { return D; }, get backend() { return B; }, get estadoGuardado() { return { ultimoGuardado, errorGuardado, guardando }; },
    set onCambio(fn) { onCambio = fn; },
    cargar, guardarAhora, cambio, tareas, archivadas, todas, get, esArchivada, proyecto, recurrente, activa, vencida, ultimaNota, estancadas,
    crearTarea, desdeCaptura, actualizar, cambiarEstado, completar, reabrir, eliminar, moverEnColumna,
    agregarSub, toggleSub, editarSub, quitarSub, moverSub, agregarNota, quitarNota,
    agregarAdjunto, leerAdjunto, quitarAdjunto,
    crearProyecto, proyectoPorNombre, actualizarProyecto, eliminarProyecto,
    asegurarDia, enDia, prioridadesUsadas, agregarDia, quitarDia, moverDia, decidir, marcarPlaneado, pendientesAyer, venceHoyOAntes, seguimientosHoy,
    ocurre, freqTexto, proximaFecha, crearRecurrente, actualizarRecurrente, eliminarRecurrente, generarRecurrentes, saltarHoy, hacerRecurrente, instancias,
    leerMovil, importarMovil, guardarExportacion, cargarEjemplo, log, tocar
  };
})();
