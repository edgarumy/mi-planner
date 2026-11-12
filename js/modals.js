/* Ventanas: detalle de tarea, captura rápida, búsqueda, recurrente, En espera, exportar */
'use strict';

const MV = (() => {
  const e = U.esc;
  const M = () => Model;

  /* ---------- Detalle de tarea ---------- */
  function detalle(t) {
    const arch = M().esArchivada(t);
    const hecho = t.estado === 'hecho';
    const s = t.espera || {};
    const subsHechas = t.subtareas.filter(x => x.hecha).length;
    const notas = [...t.bitacora].reverse();
    const r = t.recurrenteId ? M().recurrente(t.recurrenteId) : null;
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Detalle de tarea">
      <div class="modal-h dh"><div class="dh-main" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        <div class="meta"><b>${t.id}</b><span>Creada ${e(U.fTs(t.creada))}</span>${hecho ? `<span class="badge grn">Completada ${e(U.fTs(t.completada))}</span>` : ''}${arch ? '<span class="badge gray">Archivada</span>' : ''}</div>
        <label class="sr" for="d-titulo">Título</label><input id="d-titulo" class="title-inp" value="${e(t.titulo)}" data-ch="dTitulo" data-id="${t.id}">
      </div>
      <div class="dh-acts" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${hecho ? '' : `<button class="btn ${M().enDia(t.id) ? 'on' : ''}" data-a="dMiDia" data-id="${t.id}">${ic('sun', 's16')}${M().enDia(t.id) ? 'En Mi día' : 'Agregar a Mi día'}</button>`}
        ${hecho ? `<button class="btn" data-a="toggleHecho" data-id="${t.id}">Reabrir</button>` : `<button class="btn ok" data-a="toggleHecho" data-id="${t.id}">${ic('check', 's16')}Completar</button>`}
        <button class="iconbtn" data-a="eliminar" data-id="${t.id}" title="Eliminar tarea" aria-label="Eliminar tarea">${ic('trash')}</button>
        <button class="iconbtn x" data-a="cerrarModal" aria-label="Cerrar">${ic('x')}</button></div></div>

      <section class="card" aria-label="Estado de la tarea"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><span class="lab" style="text-transform:uppercase;letter-spacing:.06em;font-size:12px">Estado de la tarea</span>
        <div class="statusbar" role="group" aria-label="Estado">${ESTADOS.map(([k, l]) => `<button class="st-${k} ${t.estado === k ? 'on' : ''}" aria-pressed="${t.estado === k}" data-a="dEstado" data-id="${t.id}" data-v="${k}">${l}</button>`).join('')}</div></div>
        ${t.estado === 'espera' ? `<div class="waitbox">${ic('clock', 's20')}
          <div class="f"><label for="d-persona">¿A quién esperas?</label><input id="d-persona" class="inp" value="${e(s.persona || '')}" data-ch="dEspera" data-k="persona" data-id="${t.id}" placeholder="Persona o equipo"></div>
          <div class="f" style="flex-grow:2"><label for="d-motivo">¿Qué esperas?</label><input id="d-motivo" class="inp" value="${e(s.motivo || '')}" data-ch="dEspera" data-k="motivo" data-id="${t.id}" placeholder="Ej. el client secret"></div>
          <div class="f" style="max-width:170px"><label for="d-seg">Volver a preguntar</label><input id="d-seg" type="date" class="inp" value="${e(s.seguimiento || '')}" data-ch="dEspera" data-k="seguimiento" data-id="${t.id}"></div>
          <div style="display:flex;flex-direction:column;gap:4px"><span class="small">Desde ${e(U.fCorta(s.desde || U.hoy()))} (${U.diffDias(s.desde || U.hoy(), U.hoy())} días)</span>
          <div style="display:flex;gap:6px"><button class="btn warn sm" data-a="yaRespondieron" data-id="${t.id}">Ya respondieron</button><button class="btn sm" data-a="posponerSeg" data-id="${t.id}">Posponer 2 días</button></div></div></div>` : ''}
      </section>

      <div class="cols2"><div class="col-main" style="gap:14px">
        <div class="card"><h2>Descripción</h2><label class="sr" for="d-desc">Descripción</label><textarea id="d-desc" class="inp" rows="3" data-ch="dDesc" data-id="${t.id}" placeholder="Contexto, objetivo, enlaces…">${e(t.descripcion)}</textarea></div>
        <div class="card"><div style="display:flex;align-items:center;gap:10px"><h2>Subtareas</h2><span class="muted small">${subsHechas} de ${t.subtareas.length} · sin límite · arrastra para ordenar</span>
          ${t.subtareas.length ? `<div class="bar" style="margin-left:auto;width:140px"><div style="width:${Math.round(subsHechas / t.subtareas.length * 100)}%"></div></div>` : ''}</div>
          <ul class="subs" id="subs">${t.subtareas.map(x => `<li class="${x.hecha ? 'done' : ''}" draggable="true" data-drag="sub" data-id="${x.id}"><span class="grip">${ic('grip', 's16')}</span>
            <button class="sbox" data-a="dSubToggle" data-id="${t.id}" data-v="${x.id}" aria-label="${x.hecha ? 'Desmarcar' : 'Marcar'} subtarea"><span>${x.hecha ? ic('check', 's14') : ''}</span></button>
            <input class="stxt" value="${e(x.texto)}" data-ch="dSubTexto" data-id="${t.id}" data-v="${x.id}" aria-label="Texto de la subtarea">
            <button class="iconbtn del" data-a="dSubQuitar" data-id="${t.id}" data-v="${x.id}" aria-label="Eliminar subtarea">${ic('x', 's14')}</button></li>`).join('')}</ul>
          <div class="addrow">${ic('plus', 's16')}<label class="sr" for="d-sub">Agregar subtarea</label><input id="d-sub" data-enter="dSubAgregar" enterkeyhint="done" data-id="${t.id}" placeholder="Nueva subtarea" autocomplete="off" data-ch="dSubSalir"><button class="btn pri sm btn-enviar sub-btn" data-a="enviarCampo" data-for="d-sub">Agregar</button></div></div>
        <div class="card"><div style="display:flex;align-items:center;gap:10px"><h2>Bitácora</h2><span class="muted small">el hilo de la tarea</span></div>
          <div style="display:flex;gap:8px;align-items:flex-start"><label class="sr" for="d-nota">Nueva nota</label><textarea id="d-nota" class="inp" rows="2" data-ctrlenter="dNota" data-id="${t.id}" placeholder="¿Qué pasó hoy con esta tarea?  (Ctrl+Enter para guardar)"></textarea>
          <button class="btn pri" data-a="dNota" data-id="${t.id}">Guardar</button></div>
          <ol class="timeline">${notas.map(b => `<li class="${b.tipo === 'nota' ? '' : 'sys'}"><div class="rail"><span class="p"></span><span class="l"></span></div><div class="c"><span class="ts">${e(U.fTs(b.ts))}${b.tipo === 'nota' ? `<button class="iconbtn del" style="width:24px;height:24px" data-a="dNotaQuitar" data-id="${t.id}" data-v="${b.id}" aria-label="Eliminar nota">${ic('x', 's14')}</button>` : ''}</span><span class="tx">${U.linkify(b.texto)}</span></div></li>`).join('')}</ol></div>
      </div>
      <aside>
        <div class="card"><h2>Detalles</h2><div class="props">
          <div class="p"><label class="lbl" for="d-proy">Proyecto</label>${V.proySelect(t.proyectoId, `id="d-proy" data-ch="dProyecto" data-id="${t.id}"`)}</div>
          <div class="p"><label class="lbl" for="d-prio">Prioridad</label><select id="d-prio" class="inp" data-ch="dPrio" data-id="${t.id}"><option value="">Sin prioridad</option>${PRIORIDADES.map(([k, l]) => `<option value="${k}" ${t.prioridad === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="p"><label class="lbl" for="d-fecha">Fecha límite</label><input id="d-fecha" type="date" class="inp" value="${e(t.fecha || '')}" data-ch="dFecha" data-id="${t.id}"></div>
          <div class="p"><label class="lbl" for="d-tags">Etiquetas</label><input id="d-tags" class="inp" value="${e(t.etiquetas.join(', '))}" data-ch="dTags" data-id="${t.id}" placeholder="separadas por coma"></div>
          <div class="p"><span class="lbl">Repetir</span>${r ? `<span class="m rec" style="display:flex;gap:6px;align-items:center;color:var(--accd);font-weight:600">${ic('repeat', 's14')}${e(M().freqTexto(r))}</span><button class="btn link sm" style="align-self:flex-start;padding:0" data-a="editarRec" data-id="${r.id}">Editar recurrencia</button>`
            : `<span class="muted small">No se repite</span><button class="btn link sm" style="align-self:flex-start;padding:0" data-a="hacerRecurrente" data-id="${t.id}">Hacerla recurrente</button>`}</div>
        </div></div>
        <div class="card"><h2>Adjuntos y enlaces</h2>
          ${t.adjuntos.map(a => `<div class="att">${ic('clip', 's16')}<span class="nm" title="${e(a.nombre)}">${e(a.nombre)}</span><button class="iconbtn" data-a="dAbrirAdj" data-id="${t.id}" data-v="${a.id}" title="Abrir" aria-label="Abrir ${e(a.nombre)}">${ic('open', 's16')}</button><button class="iconbtn" data-a="dQuitarAdj" data-id="${t.id}" data-v="${a.id}" aria-label="Eliminar adjunto">${ic('x', 's14')}</button></div>`).join('')}
          ${t.enlaces.map((l, i) => `<div class="att">${ic('link', 's16')}<a class="nm" href="${e(l.url)}" target="_blank" rel="noopener">${e(l.titulo || l.url)}</a><button class="iconbtn" data-a="dQuitarEnlace" data-id="${t.id}" data-v="${i}" aria-label="Quitar enlace">${ic('x', 's14')}</button></div>`).join('')}
          <label class="btn sm" style="align-self:flex-start;border-style:dashed">${ic('plus', 's16')}Agregar archivo<input type="file" multiple data-ch="dAdjuntar" data-id="${t.id}" class="sr"></label>
          <div class="addrow">${ic('link', 's16')}<label class="sr" for="d-link">Agregar enlace</label><input id="d-link" data-enter="dEnlace" enterkeyhint="done" data-id="${t.id}" placeholder="Pega una dirección web" autocomplete="off"><button class="btn pri sm btn-enviar" data-a="enviarCampo" data-for="d-link">Agregar</button></div>
          <span class="muted small">Los archivos se copian a ${e(M().backend?.nombre || '')}\\adjuntos\\${t.id}\\</span></div>
      </aside></div></div>`;
  }

  /* ---------- Captura rápida (N) ---------- */
  function captura(m) {
    return `<div class="modal sm" role="dialog" aria-modal="true" aria-label="${m.urgente ? 'Agregar urgencia' : 'Captura rápida'}">
      <div class="modal-h"><h2 style="font-size:18px">${m.urgente ? ic('bolt') + ' Agregar urgencia' : 'Captura rápida'}</h2><button class="iconbtn x" data-a="cerrarModal" aria-label="Cerrar">${ic('x')}</button></div>
      ${m.urgente ? '<p class="muted small" style="margin:0">Entra directo a Mi día, marcada como urgente y sin contar en tus 10 prioridades.</p>' : ''}
      <div class="capture">${ic('plus', 's20')}<label class="sr" for="cap-modal">Tarea</label><input id="cap-modal" data-enter="capturaModal" enterkeyhint="done" autocomplete="off" placeholder="Escribe la tarea…  #proyecto !alta @viernes >persona"></div>
      ${m.urgente ? '' : `<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center"><span class="lab">Enviar a</span><div class="seg">${[['bandeja', 'Bandeja'], ['porhacer', 'Por hacer'], ['midia', 'Mi día']].map(([k, l]) => `<button class="${m.destino === k ? 'on' : ''}" data-a="capDestino" data-v="${k}">${l}</button>`).join('')}</div></div>`}
      <div class="hints"><span><b>#proyecto</b></span><span><b>!alta</b></span><span><b>@viernes</b> / <b>@15/11</b></span><span><b>&gt;persona</b> = en espera</span><span><b>*habiles</b> = recurrente</span></div>
      <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn pri" data-a="capturaModal">Agregar</button></div></div>`;
  }

  /* ---------- Búsqueda ---------- */
  function buscar(m) {
    return `<div class="modal md" role="dialog" aria-modal="true" aria-label="Buscar">
      <div class="search-box">${ic('search', 's20')}<label class="sr" for="q-buscar">Buscar</label><input id="q-buscar" data-input="buscarQ" autocomplete="off" placeholder="Busca en títulos, bitácoras, subtareas y adjuntos — incluye tareas cerradas" value="${e(m.q || '')}"><kbd>Esc</kbd></div>
      <div id="resultados" style="display:flex;flex-direction:column;gap:6px">${resultados(m.q || '', m.sel || 0)}</div></div>`;
  }
  function busca(q) {
    const toks = U.norm(q).split(/\s+/).filter(Boolean); if (!toks.length) return [];
    const out = [];
    for (const t of M().todas()) {
      const campos = [['Título', t.titulo], ['ID', t.id], ['Descripción', t.descripcion], ...t.subtareas.map(s => ['Subtarea', s.texto]), ...t.bitacora.filter(b => b.tipo === 'nota').map(b => ['Bitácora ' + U.fTs(b.ts), b.texto]),
        ...t.adjuntos.map(a => ['Adjunto', a.nombre]), ['Etiquetas', t.etiquetas.join(' ')], ['Proyecto', M().proyecto(t.proyectoId)?.nombre || ''], ['En espera de', t.espera?.persona || '']];
      const todo = U.norm(campos.map(c => c[1]).join(' \n '));
      if (!toks.every(k => todo.includes(k))) continue;
      const enTitulo = toks.every(k => U.norm(t.titulo).includes(k));
      const hit = campos.find(c => c[0] !== 'Título' && c[0] !== 'ID' && toks.some(k => U.norm(c[1]).includes(k)));
      out.push({ t, score: (enTitulo ? 10 : 0) + (M().activa(t) ? 2 : 0) + (t.actualizada || '').localeCompare('') * 0, hit, fecha: t.actualizada || '' });
    }
    return out.sort((a, b) => b.score - a.score || b.fecha.localeCompare(a.fecha)).slice(0, 40);
  }
  function resaltar(txt, q) {
    const toks = U.norm(q).split(/\s+/).filter(Boolean);
    const n = U.norm(txt); let pos = -1, len = 0;
    for (const k of toks) { const i = n.indexOf(k); if (i >= 0) { pos = i; len = k.length; break; } }
    let s = txt, ini = 0;
    if (pos > 60) { ini = pos - 50; s = '…' + txt.slice(ini); pos = pos - ini + 1; }
    if (s.length > 180) s = s.slice(0, 180) + '…';
    if (pos < 0) return e(s);
    return e(s.slice(0, pos)) + '<mark>' + e(s.slice(pos, pos + len)) + '</mark>' + e(s.slice(pos + len));
  }
  function resultados(q, sel) {
    if (!q.trim()) return '<span class="muted small" style="padding:6px">Escribe para buscar. Tip: busca una palabra que recuerdes haber anotado en la bitácora.</span>';
    const rs = busca(q);
    if (!rs.length) return '<span class="muted small" style="padding:6px">Sin resultados.</span>';
    return rs.map((r, i) => `<button class="res ${i === sel ? 'sel' : ''}" data-a="abrirBusqueda" data-id="${r.t.id}"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b class="${r.t.estado === 'hecho' ? 'ttl done' : ''}" style="font-size:14px">${resaltar(r.t.titulo, q)}</b>${V.chip(r.t.proyectoId)}${V.pill(r.t.estado)}${M().esArchivada(r.t) ? '<span class="badge gray">archivada</span>' : ''}<span class="muted small" style="margin-left:auto">${r.t.id}</span></div>
      ${r.hit ? `<span class="snip"><b>${e(r.hit[0])}:</b> ${resaltar(r.hit[1], q)}</span>` : ''}</button>`).join('');
  }

  /* ---------- Recurrente ---------- */
  function recurrente(m) {
    const r = m.r;
    const dias = [[1, 'L'], [2, 'M'], [3, 'X'], [4, 'J'], [5, 'V'], [6, 'S'], [0, 'D']];
    return `<div class="modal md" role="dialog" aria-modal="true" aria-label="Tarea recurrente">
      <div class="modal-h"><h2 style="font-size:20px">${m.nuevo ? 'Nueva recurrente' : 'Editar recurrente'}</h2><button class="iconbtn x" data-a="cerrarModal" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="card">
        <div><label class="lbl" for="r-titulo">Título</label><input id="r-titulo" class="inp" value="${e(r.titulo)}" data-rk="titulo" placeholder="Ej. Revisión de OIC"></div>
        <div class="grid2"><div><label class="lbl" for="r-proy">Proyecto</label>${V.proySelect(r.proyectoId, 'id="r-proy" data-rk="proyectoId"')}</div>
          <div><label class="lbl" for="r-prio">Prioridad</label><select id="r-prio" class="inp" data-rk="prioridad"><option value="">Sin prioridad</option>${PRIORIDADES.map(([k, l]) => `<option value="${k}" ${r.prioridad === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      </div>
      <div class="card"><h2>Cuándo se repite</h2>
        <div class="seg" style="align-self:flex-start">${[['diaria', 'Diaria'], ['habiles', 'Días hábiles'], ['semanal', 'Semanal'], ['mensual', 'Mensual']].map(([k, l]) => `<button class="${r.frecuencia === k ? 'on' : ''}" data-a="recFreq" data-v="${k}">${l}</button>`).join('')}</div>
        ${r.frecuencia === 'semanal' ? `<div class="days">${dias.map(([n, l]) => `<button class="${r.dias.includes(n) ? 'on' : ''}" data-a="recDia" data-v="${n}" aria-pressed="${r.dias.includes(n)}">${l}</button>`).join('')}</div>` : ''}
        ${r.frecuencia === 'mensual' ? `<div style="max-width:200px"><label class="lbl" for="r-diames">Día del mes</label><input id="r-diames" class="inp" type="number" min="1" max="31" value="${r.diaMes}" data-rk="diaMes"></div>` : ''}
        <div class="grid2"><div><label class="lbl" for="r-hora">Hora sugerida (opcional)</label><input id="r-hora" class="inp" type="time" value="${e(r.hora || '')}" data-rk="hora"></div>
          <div><span class="lbl">Mi día</span><label style="display:flex;gap:8px;align-items:center;padding-top:8px"><input type="checkbox" data-rk="autoMiDia" ${r.autoMiDia ? 'checked' : ''}>Agregarla sola a Mi día</label></div></div>
      </div>
      <div class="card"><h2>Si un día no la completas</h2>
        <label style="display:flex;gap:10px;align-items:flex-start"><input type="radio" name="r-modo" value="reemplazar" data-rk="modo" ${r.modo === 'reemplazar' ? 'checked' : ''}><span><b>Se reemplaza con la de hoy</b><br><span class="muted small">Ideal para revisiones diarias: no se te acumulan.</span></span></label>
        <label style="display:flex;gap:10px;align-items:flex-start"><input type="radio" name="r-modo" value="acumular" data-rk="modo" ${r.modo === 'acumular' ? 'checked' : ''}><span><b>Se acumula como pendiente</b><br><span class="muted small">Para cosas que sí deben hacerse cada vez.</span></span></label>
      </div>
      <div class="card"><h2>Subtareas de cada repetición <span class="muted small" style="font-weight:400">· una por línea, se reinician cada vez</span></h2>
        <label class="sr" for="r-subs">Subtareas</label><textarea id="r-subs" class="inp" rows="4" data-rk="subtareas" placeholder="Revisar instancias con error&#10;Revisar agentes de conectividad">${e(r.subtareas.join('\n'))}</textarea></div>
      ${!m.nuevo ? `<div class="card"><h2>Últimas repeticiones</h2>${V.histDots(r)}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">${!m.nuevo ? `<button class="btn ghost" style="color:var(--red)" data-a="recEliminar">${ic('trash', 's16')}Eliminar recurrente</button>` : ''}
        <span style="flex:1"></span><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn pri" data-a="recGuardar">${m.nuevo ? 'Crear recurrente' : 'Guardar cambios'}</button></div></div>`;
  }

  /* ---------- Datos de En espera (al mover a esa columna) ---------- */
  function espera(m) {
    const t = M().get(m.id);
    return `<div class="modal sm" role="dialog" aria-modal="true" aria-label="Mover a En espera">
      <div class="modal-h"><div><h2 style="font-size:18px">Moviste la tarea a En espera</h2><span class="muted small">${e(t?.titulo || '')}</span></div><button class="iconbtn x" data-a="cerrarModal" aria-label="Cerrar">${ic('x')}</button></div>
      <div><label class="lbl" for="w-persona">¿A quién esperas?</label><input id="w-persona" class="inp" placeholder="Persona o equipo" value="${e(t?.espera?.persona || '')}" data-enter="esperaOk" enterkeyhint="done"></div>
      <div><label class="lbl" for="w-motivo">¿Qué esperas? (opcional)</label><input id="w-motivo" class="inp" placeholder="Ej. respuesta del proveedor" value="${e(t?.espera?.motivo || '')}" data-enter="esperaOk" enterkeyhint="done"></div>
      <div><label class="lbl" for="w-seg">Volver a preguntar</label><input id="w-seg" type="date" class="inp" value="${e(t?.espera?.seguimiento || U.addDias(U.hoy(), 2))}"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" data-a="esperaOmitir">Omitir</button><button class="btn warn" data-a="esperaOk">Listo</button></div></div>`;
  }

  /* ---------- Exportar ---------- */
  function exportar(m, nVista, nTodas) {
    const o = m.o;
    const radio = (k, v, l, s) => `<label style="display:flex;gap:10px;align-items:flex-start;padding:4px 0"><input type="radio" name="x-${k}" ${o[k] === v ? 'checked' : ''} data-a="xSet" data-k="${k}" data-v="${v}"><span><b>${l}</b>${s ? `<br><span class="muted small">${s}</span>` : ''}</span></label>`;
    const chk = (k, l, s) => `<label style="display:flex;gap:10px;align-items:flex-start;padding:4px 0"><input type="checkbox" ${o[k] ? 'checked' : ''} data-a="xToggle" data-k="${k}"><span>${l}${s ? `<br><span class="muted small">${s}</span>` : ''}</span></label>`;
    return `<div class="modal sm" role="dialog" aria-modal="true" aria-label="Exportar a Excel">
      <div class="modal-h"><h2 style="font-size:18px">${ic('download')} Exportar a Excel</h2><button class="iconbtn x" data-a="cerrarModal" aria-label="Cerrar">${ic('x')}</button></div>
      <div><span class="lbl">Qué tareas</span>${radio('alcance', 'vista', 'Lo que estoy viendo', `Filtros actuales de la cuadrícula · ${nVista} tareas`)}${radio('alcance', 'todas', 'Todas las tareas', `${nTodas} tareas, incluye Parking Lot y archivadas`)}</div>
      <div><span class="lbl">Periodo (por fecha, creación, actividad o cierre)</span><div class="seg">${[['semana', 'Esta semana'], ['mes', 'Este mes'], ['personalizado', 'Personalizado'], ['todo', 'Todo']].map(([k, l]) => `<button class="${o.periodo === k ? 'on' : ''}" data-a="xSet" data-k="periodo" data-v="${k}">${l}</button>`).join('')}</div>
        ${o.periodo === 'personalizado' ? `<div class="grid2" style="margin-top:8px"><div><label class="lbl" for="x-desde">Desde</label><input id="x-desde" type="date" class="inp" value="${e(o.desde)}" data-ch="xFecha" data-k="desde"></div><div><label class="lbl" for="x-hasta">Hasta</label><input id="x-hasta" type="date" class="inp" value="${e(o.hasta)}" data-ch="xFecha" data-k="hasta"></div></div>` : ''}</div>
      <div><span class="lbl">Incluir</span>${chk('resumen', 'Hoja de resumen', 'Conteo por estado y proyecto, completadas en el periodo')}${chk('subtareas', 'Hoja de subtareas')}${chk('bitacora', 'Bitácora completa', 'Todas las notas con fecha; si no, solo la última nota por tarea')}${chk('porProyecto', 'Una hoja por proyecto')}</div>
      <div class="banner" style="background:var(--bg);padding:9px 10px;font-size:12.5px;flex-wrap:nowrap">${ic('folder', 's16')}Se descarga y se guarda una copia en ${e(M().backend?.nombre || '')}\\exportaciones\\</div>
      <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn ok" data-a="xDescargar">${ic('download', 's16')}Descargar .xlsx</button></div></div>`;
  }

  return { detalle, captura, buscar, resultados, busca, recurrente, espera, exportar };
})();
