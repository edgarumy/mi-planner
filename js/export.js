/* Construcción del reporte de Excel */
'use strict';

const Export = (() => {
  function rango(o) {
    const h = U.hoy();
    if (o.periodo === 'semana') { const i = U.lunesDe(h); return [i, U.addDias(i, 6)]; }
    if (o.periodo === 'mes') { const d = U.parse(h); return [h.slice(0, 8) + '01', U.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))]; }
    if (o.periodo === 'personalizado') return [o.desde || '0000-01-01', o.hasta || '9999-12-31'];
    return null;
  }
  const dentro = (f, r) => f && f >= r[0] && f <= r[1];
  function enPeriodo(t, r) {
    if (!r) return true;
    return dentro(t.fecha, r) || dentro(U.dateOfTs(t.creada), r) || dentro(U.dateOfTs(t.completada), r) || dentro(U.dateOfTs(t.actualizada), r)
      || t.bitacora.some(b => dentro(U.dateOfTs(b.ts), r)) || (t.espera && dentro(t.espera.seguimiento, r));
  }
  const fmtTs = ts => ts ? `${U.dateOfTs(ts)} ${U.hora(ts)}` : '';
  const prio = p => ({ alta: 'Alta', media: 'Media', baja: 'Baja' }[p] || '');

  function construir(base, o) {
    const r = rango(o);
    const ts = base.filter(t => enPeriodo(t, r)).sort((a, b) => (Model.proyecto(a.proyectoId)?.nombre || '\uffff').localeCompare(Model.proyecto(b.proyectoId)?.nombre || '\uffff') || ESTADOS.findIndex(x => x[0] === a.estado) - ESTADOS.findIndex(x => x[0] === b.estado) || (a.fecha || '9').localeCompare(b.fecha || '9'));
    const hojas = [];
    const txtPeriodo = r ? `${U.fCorta(r[0])} ${r[0].slice(0, 4)} – ${U.fCorta(r[1])} ${r[1].slice(0, 4)}` : 'Todo';

    if (o.resumen) {
      const f = [];
      f.push([{ v: 'Reporte de actividades', s: 2 }]);
      f.push(['Generado', `${U.hoy()} ${U.hora()}`]);
      f.push(['Periodo', txtPeriodo]);
      f.push(['Alcance', o.alcance === 'vista' ? 'Filtros actuales de la cuadrícula' : 'Todas las tareas']);
      f.push(['Tareas incluidas', ts.length]);
      f.push([]);
      f.push([{ v: 'Por estado', s: 3 }]);
      f.push(['Estado', 'Tareas'].map(v => ({ v, s: 1 })));
      for (const [k, l] of ESTADOS) f.push([l, ts.filter(t => t.estado === k).length]);
      f.push([]);
      const compl = ts.filter(t => t.estado === 'hecho' && (!r || dentro(U.dateOfTs(t.completada), r)));
      f.push([{ v: 'Completadas en el periodo', s: 3 }, compl.length]);
      f.push([]);
      f.push([{ v: 'Por proyecto', s: 3 }]);
      f.push(['Proyecto', ...ESTADOS.map(x => x[1]), 'Total', 'Completadas en el periodo'].map(v => ({ v, s: 1 })));
      const ps = [...new Set(ts.map(t => t.proyectoId || ''))];
      for (const pid of ps) {
        const sub = ts.filter(t => (t.proyectoId || '') === pid);
        f.push([Model.proyecto(pid)?.nombre || 'Sin proyecto', ...ESTADOS.map(([k]) => sub.filter(t => t.estado === k).length), sub.length, compl.filter(t => (t.proyectoId || '') === pid).length]);
      }
      hojas.push({ nombre: 'Resumen', filas: f, anchos: [30, 12, 12, 12, 12, 12, 12, 10, 24] });
    }

    const enc = ['ID', 'Tarea', 'Proyecto', 'Estado', 'Prioridad', 'Fecha límite', 'Creada', 'Completada', 'En espera de', 'Seguimiento', 'Subtareas', 'Etiquetas', o.bitacora ? 'Notas en bitácora' : 'Última nota', 'Fecha última nota', 'Descripción', 'Recurrente'];
    const fila = t => {
      const n = Model.ultimaNota(t);
      return [t.id, t.titulo, Model.proyecto(t.proyectoId)?.nombre || '', EST[t.estado], prio(t.prioridad), t.fecha || '', fmtTs(t.creada), fmtTs(t.completada),
        t.espera?.persona || '', t.espera?.seguimiento || '', t.subtareas.length ? `${t.subtareas.filter(s => s.hecha).length}/${t.subtareas.length}` : '', t.etiquetas.join(', '),
        o.bitacora ? t.bitacora.filter(b => b.tipo === 'nota').length : (n ? n.texto : ''), n ? fmtTs(n.ts) : '', t.descripcion || '', t.recurrenteId ? 'Sí' : ''];
    };
    const anchos = [9, 48, 20, 12, 10, 12, 16, 16, 18, 12, 10, 18, 50, 16, 50, 10];
    if (o.porProyecto) {
      const ps = [...new Set(ts.map(t => t.proyectoId || ''))];
      for (const pid of ps) hojas.push({ nombre: Model.proyecto(pid)?.nombre || 'Sin proyecto', filas: [enc, ...ts.filter(t => (t.proyectoId || '') === pid).map(fila)], anchos, encabezado: 0 });
    } else hojas.push({ nombre: 'Tareas', filas: [enc, ...ts.map(fila)], anchos, encabezado: 0 });

    if (o.subtareas) {
      const f = [['ID', 'Tarea', 'Proyecto', 'Subtarea', 'Hecha']];
      for (const t of ts) for (const s of t.subtareas) f.push([t.id, t.titulo, Model.proyecto(t.proyectoId)?.nombre || '', s.texto, s.hecha ? 'Sí' : 'No']);
      hojas.push({ nombre: 'Subtareas', filas: f, anchos: [9, 40, 20, 50, 8], encabezado: 0 });
    }
    if (o.bitacora) {
      const f = [['ID', 'Tarea', 'Proyecto', 'Fecha', 'Hora', 'Tipo', 'Texto']];
      for (const t of ts) for (const b of t.bitacora) { if (r && !dentro(U.dateOfTs(b.ts), r)) continue; f.push([t.id, t.titulo, Model.proyecto(t.proyectoId)?.nombre || '', U.dateOfTs(b.ts), U.hora(b.ts), b.tipo === 'nota' ? 'Nota' : 'Sistema', b.texto]); }
      hojas.push({ nombre: 'Bitácora', filas: f, anchos: [9, 40, 20, 12, 8, 10, 80], encabezado: 0 });
    }
    return { blob: XLSX.libro(hojas), n: ts.length };
  }
  return { construir };
})();
