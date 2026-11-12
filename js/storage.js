/* Almacenamiento: todo vive en una carpeta local elegida por el usuario.
   En el navegador solo se recuerda el "acceso" a la carpeta (no los datos) para no tener que elegirla cada vez. */
'use strict';

const Storage = (() => {
  const SOPORTADO = typeof window.showDirectoryPicker === 'function';

  /* ---------- Backend: carpeta real (File System Access API) ---------- */
  function fsBackend(root) {
    async function dir(parts, create) {
      let d = root;
      for (const p of parts) { if (!p) continue; d = await d.getDirectoryHandle(p, { create }); }
      return d;
    }
    function split(path) { const parts = path.split('/').filter(Boolean); return { dirs: parts.slice(0, -1), name: parts[parts.length - 1] }; }
    return {
      nombre: root.name,
      async readText(path) {
        try { const { dirs, name } = split(path); const d = await dir(dirs, false); const fh = await d.getFileHandle(name); return await (await fh.getFile()).text(); }
        catch (e) { if (e.name === 'NotFoundError' || e.name === 'TypeMismatchError') return null; throw e; }
      },
      async readBlob(path) {
        try { const { dirs, name } = split(path); const d = await dir(dirs, false); const fh = await d.getFileHandle(name); return await fh.getFile(); }
        catch (e) { if (e.name === 'NotFoundError') return null; throw e; }
      },
      async write(path, data) {
        const { dirs, name } = split(path); const d = await dir(dirs, true);
        const fh = await d.getFileHandle(name, { create: true });
        const w = await fh.createWritable(); await w.write(data); await w.close();
      },
      async list(path) {
        try {
          const d = await dir(path.split('/').filter(Boolean), false); const out = [];
          for await (const [name, h] of d.entries()) out.push({ name, kind: h.kind });
          return out;
        } catch (e) { if (e.name === 'NotFoundError') return []; throw e; }
      },
      async remove(path) {
        try { const { dirs, name } = split(path); const d = await dir(dirs, false); await d.removeEntry(name, { recursive: true }); }
        catch (e) { if (e.name !== 'NotFoundError') throw e; }
      }
    };
  }

  /* ---------- Backend en memoria (solo para pruebas / demostración) ---------- */
  function memBackend(nombre = 'memoria') {
    const files = new Map();
    return {
      nombre, _files: files, memoria: true,
      async readText(p) { const v = files.get(p); if (v == null) return null; return typeof v === 'string' ? v : await v.text(); },
      async readBlob(p) { const v = files.get(p); if (v == null) return null; return v instanceof Blob ? v : new Blob([v]); },
      async write(p, data) { files.set(p, data); },
      async list(dir) {
        const pre = dir ? dir.replace(/\/$/, '') + '/' : ''; const out = new Map();
        for (const k of files.keys()) if (k.startsWith(pre)) { const rest = k.slice(pre.length); const [first, ...more] = rest.split('/'); out.set(first, more.length ? 'directory' : 'file'); }
        return [...out].map(([name, kind]) => ({ name, kind }));
      },
      async remove(p) { for (const k of [...files.keys()]) if (k === p || k.startsWith(p + '/')) files.delete(k); }
    };
  }

  /* ---------- Recordar el acceso a la carpeta (IndexedDB, solo el "handle") ---------- */
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('mi-planner', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('h');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  async function guardarHandle(h) {
    try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('h', 'readwrite'); tx.objectStore('h').put(h, 'carpeta'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { console.warn(e); }
  }
  async function leerHandle() {
    try { const db = await idb(); return await new Promise((res) => { const tx = db.transaction('h', 'readonly'); const g = tx.objectStore('h').get('carpeta'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); }); } catch (e) { return null; }
  }
  async function olvidarHandle() {
    try { const db = await idb(); await new Promise((res) => { const tx = db.transaction('h', 'readwrite'); tx.objectStore('h').delete('carpeta'); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* nada */ }
  }

  /* Si el usuario elige la carpeta de la app (la que contiene index.html), usamos/creamos "datos" dentro. */
  async function resolverCarpetaDatos(h) {
    for await (const [name, e] of h.entries()) {
      if (name === 'index.html' && e.kind === 'file') return await h.getDirectoryHandle('datos', { create: true });
    }
    return h;
  }

  async function elegirCarpeta() {
    const h = await window.showDirectoryPicker({ id: 'mi-planner', mode: 'readwrite' });
    const datos = await resolverCarpetaDatos(h);
    await guardarHandle(datos);
    return fsBackend(datos);
  }
  async function permisoGuardado(pedir) {
    const h = await leerHandle(); if (!h) return { estado: 'ninguna' };
    const opts = { mode: 'readwrite' };
    let p = await h.queryPermission(opts);
    if (p !== 'granted' && pedir) p = await h.requestPermission(opts);
    if (p === 'granted') return { estado: 'ok', backend: fsBackend(h) };
    return { estado: 'pedir', nombre: h.name };
  }

  return { SOPORTADO, fsBackend, memBackend, elegirCarpeta, permisoGuardado, olvidarHandle };
})();
