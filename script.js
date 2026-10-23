'use strict';

/* =========================================================
   TEMPLATE TIENDA WHATSAPP · Lógica del sitio
   Cada página (.html) indica su vista en <body data-pagina="...">
   Páginas: inicio · marcas · marca · producto · gracias · 404
   Los datos (marcas, precios, WhatsApp) están en datos.js
   ========================================================= */

/* ---------- 3. UTILIDADES ---------- */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const normalizar = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const slug = (s) => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const precio = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- 4. CATÁLOGO EN MEMORIA ---------- */
const PRODUCTOS = [];
MARCAS.forEach((m) => {
  TIPOS.forEach((t, ti) => {
    CATALOGO[m.id][ti].forEach(([nombre, miles]) => {
      const nombreCompleto = `${m.nombre} ${nombre}`;
      PRODUCTOS.push({
        id: slug(nombreCompleto),
        marca: m.id,
        tipo: t.id,
        nombre,
        nombreCompleto,
        precio: miles * 1000 + 900,
      });
    });
  });
});

const PROD = Object.fromEntries(PRODUCTOS.map((p) => [p.id, p]));
const MARCA_POR_ID = Object.fromEntries(MARCAS.map((m) => [m.id, m]));
const TIPO_POR_ID = Object.fromEntries(TIPOS.map((t) => [t.id, t]));
const MAS_VENDIDOS = MAS_VENDIDOS_NOMBRES.map((n) => PROD[slug(n)]).filter(Boolean);

/* ---------- 5. IMÁGENES ----------
   Coloca las fotos en la carpeta /images con el nombre del producto:
     images/brisa-camiseta-basica.jpg        -> foto principal
     images/brisa-camiseta-basica-negro.jpg -> (opcional) foto en ese color
     images/brisa-camiseta-basica-2.jpg ... -4 -> (opcional) fotos extra de la galería
     images/hero.jpg                        -> (opcional) imagen del banner de inicio
   Si una foto no existe, se muestra una silueta de prenda.
   En la consola del navegador escribe listarImagenes() para ver todos los nombres. */
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="130" viewBox="0 0 140 130" fill="none">' +
  '<path d="M46 8L70 18L94 8L124 28L112 54L98 46V120H42V46L28 54L16 28Z" fill="#CFCFC9"/>' +
  '<path d="M46 8Q70 36 94 8L70 18Z" fill="#B3B3AB"/></svg>'
);

const rutaImg = (nombre) => `${CONFIG.carpetaImagenes}${nombre}.${CONFIG.extensionImagen}`;

/* Todas las rutas posibles de una foto: primero la extensión principal y luego las alternas */
const rutasImg = (nombre) => [CONFIG.extensionImagen, ...CONFIG.extensionesAlternas]
  .filter((ext, i, a) => a.indexOf(ext) === i)
  .map((ext) => `${CONFIG.carpetaImagenes}${nombre}.${ext}`);

function candidatas(p, { color = null, vista = 0 } = {}) {
  const lista = [];
  if (vista > 0) lista.push(...rutasImg(`${p.id}-${vista + 1}`));
  else if (color) lista.push(...rutasImg(`${p.id}-${color}`));
  lista.push(...rutasImg(p.id));
  return lista;
}

/* ocultar: si ninguna ruta existe, oculta la miniatura en vez de mostrar la silueta */
function imgDesdeLista(lista, alt, eager = false, ocultar = false) {
  const [primera, ...resto] = lista;
  return `<img src="${esc(primera)}" data-fallback="${esc(resto.join('|'))}" alt="${esc(alt)}" ` +
    `${ocultar ? 'data-ocultar="1" ' : ''}loading="${eager ? 'eager' : 'lazy'}" decoding="async" onerror="imgError(this)">`;
}

const imgProducto = (p, opts = {}) => imgDesdeLista(candidatas(p, opts), opts.alt ?? p.nombreCompleto, opts.eager);

window.imgError = function (img) {
  const resto = (img.dataset.fallback || '').split('|').filter(Boolean);
  if (resto.length) {
    img.dataset.fallback = resto.slice(1).join('|');
    img.src = resto[0];
  } else if (img.dataset.ocultar) {
    img.onerror = null;
    const caja = img.closest('.thumb');
    if (caja) caja.hidden = true;
  } else {
    img.onerror = null;
    img.src = PLACEHOLDER;
    img.classList.add('is-placeholder');
  }
};

window.listarImagenes = function () {
  const nombres = PRODUCTOS.map((p) => `${p.id}.${CONFIG.extensionImagen}`);
  nombres.push(`hero.${CONFIG.extensionImagen}`);
  console.log(`Fotos principales (${nombres.length}) en la carpeta ${CONFIG.carpetaImagenes}:\n` + nombres.join('\n'));
  return nombres;
};

/* En la consola escribe verificarImagenes() para ver cuáles fotos ya cargaron y cuáles faltan */
window.verificarImagenes = function () {
  const nombres = PRODUCTOS.map((p) => p.id).concat('hero');
  const existe = (nombre) => new Promise((ok) => {
    const rutas = rutasImg(nombre);
    const probar = (i) => {
      if (i >= rutas.length) return ok(false);
      const im = new Image();
      im.onload = () => ok(true);
      im.onerror = () => probar(i + 1);
      im.src = rutas[i];
    };
    probar(0);
  });
  return Promise.all(nombres.map(existe)).then((res) => {
    const faltan = nombres.filter((_, i) => !res[i]);
    console.log(`Fotos encontradas: ${nombres.length - faltan.length} de ${nombres.length}`);
    if (faltan.length) console.log('Faltan:\n' + faltan.map((n) => `${n}.${CONFIG.extensionImagen}`).join('\n'));
    return faltan;
  });
};

/* ---------- 6. COMPONENTES ---------- */
/* Tallas de un producto: las de su categoría (TALLAS_POR_TIPO) o, si no hay, las generales */
const tallasDe = (p) => ((typeof TALLAS_POR_TIPO !== 'undefined' && TALLAS_POR_TIPO[p.tipo]) || TALLAS).map(String);

/* "camisetas, pantalones y buzos" a partir de TIPOS */
function listaTipos() {
  const n = TIPOS.map((t) => t.nombre.toLowerCase());
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n.join('');
}

/* "A, B, C y D" a partir de MARCAS */
function listaMarcas() {
  const n = MARCAS.map((m) => m.nombre);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n.join('');
}

function tarjeta(p, { etiqueta = 'marca', badge = false } = {}) {
  const label = etiqueta === 'tipo' ? TIPO_POR_ID[p.tipo].nombre : MARCA_POR_ID[p.marca].nombre;
  return `
    <a class="card" href="producto.html?id=${p.id}">
      <div class="card-img">${imgProducto(p)}${badge ? '<span class="badge">Más vendido</span>' : ''}</div>
      <p class="card-label">${esc(label.toUpperCase())}</p>
      <h3 class="card-name">${esc(p.nombre)}</h3>
      <p class="card-price">${precio(p.precio)}</p>
    </a>`;
}

const app = $('#app');

function montar(html, titulo) {
  app.onclick = null;
  app.innerHTML = html;
  document.title = titulo ? `${titulo} | ${CONFIG.tienda}` : `${CONFIG.tienda} | ${CONFIG.eslogan}`;
}

/* ---------- 7. VISTAS ---------- */
function vistaInicio() {
  montar(`
    <section class="hero">
      <div class="wrap">
        <div>
          <p class="hero-kicker">${esc(TEXTOS.heroKicker)}</p>
          <h1>${esc(TEXTOS.heroTitulo)}</h1>
          <p class="hero-text">${esc(TEXTOS.heroTexto.replace('{marcas}', listaMarcas()))}</p>
          <a class="btn btn-accent" href="marcas.html">Ver marcas y productos</a>
        </div>
        <div class="hero-media">${imgDesdeLista(rutasImg('hero'), CONFIG.eslogan, true)}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div>
            <h2>${esc(TEXTOS.masVendidos)}</h2>
            <p>${esc(TEXTOS.masVendidosSub)}</p>
          </div>
        </div>
        <div class="grid">${MAS_VENDIDOS.map((p, i) => tarjeta(p, { badge: i < 3 })).join('')}</div>
      </div>
    </section>

    <section class="section soft">
      <div class="wrap">
        <div class="section-head"><h2>Explora por categoría</h2></div>
        <div class="model-grid">
          ${TIPOS.map((t) => `<a class="model-tile" href="marcas.html?tipo=${t.id}">${esc(t.nombre)}</a>`).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Así pides</h2></div>
        <ol class="steps">
          <li><strong>Elige tu producto</strong><span>Explora por marca o por categoría.</span></li>
          <li><strong>Selecciona color y talla</strong><span>Revisa el precio y ajusta la cantidad.</span></li>
          <li><strong>Envía tu pedido por WhatsApp</strong><span>Te confirmamos disponibilidad y entrega.</span></li>
        </ol>
      </div>
    </section>`, null);
}

function vistaMarcas(tipoId) {
  const tipo = TIPO_POR_ID[tipoId] || null;
  const chips = [
    `<a class="chip ${!tipo ? 'is-active' : ''}" href="marcas.html">Todos</a>`,
    ...TIPOS.map((t) => `<a class="chip ${tipo && tipo.id === t.id ? 'is-active' : ''}" href="marcas.html?tipo=${t.id}">${esc(t.nombre)}</a>`),
  ].join('');

  const secciones = MARCAS.map((m, i) => {
    const lista = tipo
      ? PRODUCTOS.filter((p) => p.marca === m.id && p.tipo === tipo.id).slice(0, 4)
      : TIPOS.map((t) => PRODUCTOS.find((p) => p.marca === m.id && p.tipo === t.id));
    const total = PRODUCTOS.filter((p) => p.marca === m.id).length;
    return `
      <section class="section tight ${i % 2 === 0 ? 'soft' : ''}">
        <div class="wrap">
          <div class="section-head">
            <h2>${esc(m.nombre)}</h2>
            <a class="link-accent" href="marca.html?id=${m.id}">Ver los ${total} productos →</a>
          </div>
          <div class="grid">${lista.map((p) => tarjeta(p, { etiqueta: 'tipo' })).join('')}</div>
        </div>
      </section>`;
  }).join('');

  montar(`
    <section class="intro">
      <div class="wrap">
        <h1>Marcas y productos</h1>
        <p>Elige una marca y encuentra ${esc(listaTipos())}.</p>
        <div class="chips" role="group" aria-label="Filtrar por categoría">${chips}</div>
      </div>
    </section>
    ${secciones}`, tipo ? tipo.nombre : 'Marcas y productos');
}

function vistaMarca(marcaId, params) {
  const marca = MARCA_POR_ID[marcaId];
  const total = PRODUCTOS.filter((p) => p.marca === marcaId).length;
  const est = {
    tipo: TIPO_POR_ID[params.get('tipo')] ? params.get('tipo') : 'todos',
    q: params.get('q') || '',
    orden: ['precio-asc', 'precio-desc', 'nombre'].includes(params.get('orden')) ? params.get('orden') : 'relevancia',
  };

  montar(`
    <section class="brand-hero">
      <div class="wrap">
        <div>
          <p class="kicker">MARCA</p>
          <h1>${esc(marca.nombre)}</h1>
          <p>${total} productos · ${esc(listaTipos())}</p>
        </div>
        <a class="btn btn-ghost-light" href="marcas.html">← Volver a marcas</a>
      </div>
    </section>

    <section class="intro" style="padding-top:32px">
      <div class="wrap">
        <div class="chips" role="group" aria-label="Filtrar por categoría">
          <button class="chip" type="button" data-tipo="todos">Todos</button>
          ${TIPOS.map((t) => `<button class="chip" type="button" data-tipo="${t.id}">${esc(t.nombre)}</button>`).join('')}
        </div>
        <div class="toolbar">
          <span class="count" id="cuenta"></span>
          <div class="toolbar-tools">
            <input class="field" id="buscar" type="search" placeholder="Buscar en ${esc(marca.nombre)}" aria-label="Buscar producto" value="${esc(est.q)}">
            <select class="field" id="orden" aria-label="Ordenar por">
              <option value="relevancia">Orden sugerido</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <div id="resultados"></div>`, marca.nombre);

  $('#orden').value = est.orden;

  function filtrar() {
    let lista = PRODUCTOS.filter((p) => p.marca === marcaId);
    if (est.tipo !== 'todos') lista = lista.filter((p) => p.tipo === est.tipo);
    const q = normalizar(est.q);
    if (q) lista = lista.filter((p) => normalizar(p.nombre).includes(q));
    if (est.orden === 'precio-asc') lista = lista.slice().sort((a, b) => a.precio - b.precio);
    if (est.orden === 'precio-desc') lista = lista.slice().sort((a, b) => b.precio - a.precio);
    if (est.orden === 'nombre') lista = lista.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
    return lista;
  }

  function pintar() {
    const lista = filtrar();
    $('#cuenta').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
    $$('[data-tipo]').forEach((b) => {
      const activo = b.dataset.tipo === est.tipo;
      b.classList.toggle('is-active', activo);
      b.setAttribute('aria-pressed', String(activo));
    });

    let html;
    if (!lista.length) {
      html = `<section class="section tight"><div class="wrap"><div class="empty"><strong>No encontramos productos</strong>Prueba con otra búsqueda o cambia la categoría.</div></div></section>`;
    } else if (est.tipo === 'todos' && !est.q && est.orden === 'relevancia') {
      html = TIPOS.map((t, i) => {
        const items = lista.filter((p) => p.tipo === t.id);
        return `
          <section class="section tight ${i % 2 === 1 ? 'soft' : ''}">
            <div class="wrap">
              <div class="section-head">
                <h2 class="sm">${esc(t.nombre)}</h2>
                <span class="count">${items.length} productos</span>
              </div>
              <div class="grid">${items.map((p) => tarjeta(p, { etiqueta: 'tipo' })).join('')}</div>
            </div>
          </section>`;
      }).join('');
    } else {
      html = `<section class="section tight"><div class="wrap"><div class="grid">${lista.map((p) => tarjeta(p, { etiqueta: 'tipo' })).join('')}</div></div></section>`;
    }
    $('#resultados').innerHTML = html;

    const qs = new URLSearchParams();
    if (est.tipo !== 'todos') qs.set('tipo', est.tipo);
    if (est.q) qs.set('q', est.q);
    if (est.orden !== 'relevancia') qs.set('orden', est.orden);
    const texto = qs.toString();
    history.replaceState(null, '', `marca.html?id=${marcaId}${texto ? '&' + texto : ''}`);
  }

  app.onclick = (e) => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    est.tipo = b.dataset.tipo;
    pintar();
  };
  $('#buscar').addEventListener('input', debounce((e) => { est.q = e.target.value; pintar(); }));
  $('#orden').addEventListener('change', (e) => { est.orden = e.target.value; pintar(); });
  pintar();
}

function vistaProducto(p) {
  const marca = MARCA_POR_ID[p.marca];
  const tipo = TIPO_POR_ID[p.tipo];
  const est = { color: COLORES[0].id, talla: null, cantidad: 1, vista: 0 };

  let relacionados = PRODUCTOS.filter((x) => x.marca === p.marca && x.tipo === p.tipo && x.id !== p.id);
  if (relacionados.length < 4) {
    relacionados = relacionados.concat(PRODUCTOS.filter((x) => x.marca === p.marca && x.tipo !== p.tipo));
  }
  relacionados = relacionados.slice(0, 4);

  const waIcon = '<svg class="wa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>';

  montar(`
    <div class="wrap">
      <nav class="crumbs" aria-label="Ruta de navegación">
        <a href="index.html">Inicio</a> / <a href="marca.html?id=${marca.id}">${esc(marca.nombre)}</a> /
        <a href="marca.html?id=${marca.id}&tipo=${tipo.id}">${esc(tipo.nombre)}</a> /
        <span aria-current="page">${esc(p.nombre)}</span>
      </nav>

      <div class="product">
        <div>
          <div class="gallery-main" id="galeria"></div>
          <div class="thumbs" id="miniaturas">
            ${[0, 1, 2, 3].map((v) => `
              <button class="thumb" type="button" data-vista="${v}" aria-pressed="${v === 0}" aria-label="Ver imagen ${v + 1}">
                ${v === 0
                  ? imgProducto(p, { alt: '' })
                  : imgDesdeLista(rutasImg(`${p.id}-${v + 1}`), '', false, true)}
              </button>`).join('')}
          </div>
        </div>

        <div>
          <p class="p-kicker">${esc(marca.nombre.toUpperCase())} · ${esc(tipo.nombre.toUpperCase())}</p>
          <h1 class="p-name">${esc(p.nombre)}</h1>
          <p class="p-price">${precio(p.precio)}</p>
          <p class="p-desc">${esc(DESCRIPCIONES[p.tipo])}</p>

          <div class="opt">
            <p class="opt-label" id="lbl-color">Color: ${esc(COLORES[0].nombre)}</p>
            <div class="swatches" id="colores" role="group" aria-labelledby="lbl-color">
              ${COLORES.map((c, i) => `
                <button class="swatch" type="button" data-color="${c.id}" aria-pressed="${i === 0}" aria-label="${esc(c.nombre)}">
                  <i style="background:${c.hex}"></i>
                </button>`).join('')}
            </div>
          </div>

          <div class="opt">
            <p class="opt-label" id="lbl-talla">Talla: elige una</p>
            <div class="sizes" id="tallas" role="group" aria-labelledby="lbl-talla">
              ${tallasDe(p).map((t) => `<button class="size" type="button" data-talla="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}
            </div>
            <p class="opt-error" id="error" role="alert"></p>
          </div>

          <div class="opt">
            <p class="opt-label">Cantidad</p>
            <div class="qty">
              <button type="button" data-qty="-1" aria-label="Quitar uno">−</button>
              <output id="cantidad" aria-live="polite">1</output>
              <button type="button" data-qty="1" aria-label="Agregar uno">+</button>
            </div>
          </div>

          <div class="total-row"><span>Total</span><strong id="total">${precio(p.precio)}</strong></div>
          <button class="btn btn-wa btn-block" id="pedir" type="button">${waIcon} Pedir por WhatsApp</button>
          <p class="p-note">Se abrirá WhatsApp con tu pedido: producto, color y talla seleccionados.</p>
        </div>
      </div>
    </div>

    <section class="section soft">
      <div class="wrap">
        <div class="section-head"><h2 class="sm">También te puede gustar</h2></div>
        <div class="grid">${relacionados.map((r) => tarjeta(r, { etiqueta: 'tipo' })).join('')}</div>
      </div>
    </section>`, p.nombreCompleto);

  const colorActual = () => COLORES.find((c) => c.id === est.color);

  function pintarGaleria() {
    $('#galeria').innerHTML = imgProducto(p, {
      color: est.color,
      vista: est.vista,
      eager: true,
      alt: `${p.nombreCompleto} en color ${colorActual().nombre.toLowerCase()}`,
    });
    $$('[data-vista]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.vista) === est.vista)));
  }

  function pintarOpciones() {
    $('#lbl-color').textContent = `Color: ${colorActual().nombre}`;
    $$('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === est.color)));
    $('#lbl-talla').textContent = est.talla ? `Talla: ${est.talla}` : 'Talla: elige una';
    $$('[data-talla]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.talla === est.talla)));
    $('#cantidad').textContent = est.cantidad;
    $('#total').textContent = precio(p.precio * est.cantidad);
  }

  function pedir() {
    if (!est.talla) {
      $('#error').textContent = 'Selecciona una talla para continuar.';
      $('#lbl-talla').classList.add('error');
      $('#tallas').scrollIntoView({ block: 'center', behavior: 'smooth' });
      const primera = $('[data-talla]');
      if (primera) primera.focus({ preventScroll: true });
      return;
    }
    const total = p.precio * est.cantidad;
    const mensaje = [
      `Hola ${CONFIG.tienda}, quiero hacer un pedido:`,
      '',
      `• Producto: ${p.nombreCompleto}`,
      `• Categoría: ${tipo.nombre}`,
      `• Color: ${colorActual().nombre}`,
      `• Talla: ${est.talla}`,
      `• Cantidad: ${est.cantidad}`,
      `• Precio unitario: ${precio(p.precio)}`,
      `• Total: ${precio(total)}`,
      '',
      '¿Tienen disponibilidad?',
    ].join('\n');
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;

    try {
      sessionStorage.setItem('pedido', JSON.stringify({
        producto: p.nombreCompleto, tipo: tipo.nombre, color: colorActual().nombre,
        talla: est.talla, cantidad: est.cantidad, total: precio(total), url,
      }));
    } catch (_) { /* sin almacenamiento disponible: se muestra la página sin resumen */ }

    window.open(url, '_blank', 'noopener');
    location.href = 'gracias.html';
  }

  app.onclick = (e) => {
    const color = e.target.closest('[data-color]');
    const talla = e.target.closest('[data-talla]');
    const vista = e.target.closest('[data-vista]');
    const qty = e.target.closest('[data-qty]');

    if (color) { est.color = color.dataset.color; est.vista = 0; pintarGaleria(); pintarOpciones(); }
    else if (talla) {
      est.talla = talla.dataset.talla;
      $('#error').textContent = '';
      $('#lbl-talla').classList.remove('error');
      pintarOpciones();
    }
    else if (vista) { est.vista = Number(vista.dataset.vista); pintarGaleria(); }
    else if (qty) { est.cantidad = Math.min(10, Math.max(1, est.cantidad + Number(qty.dataset.qty))); pintarOpciones(); }
    else if (e.target.closest('#pedir')) pedir();
  };

  pintarGaleria();
}

function vistaGracias() {
  let pedido = null;
  try { pedido = JSON.parse(sessionStorage.getItem('pedido')); } catch (_) { pedido = null; }

  const resumen = pedido ? `
    <div class="order-box">
      <dl>
        <dt>Producto</dt><dd>${esc(pedido.producto)}</dd>
        <dt>Color</dt><dd>${esc(pedido.color)}</dd>
        <dt>Talla</dt><dd>${esc(pedido.talla)}</dd>
        <dt>Cantidad</dt><dd>${esc(pedido.cantidad)}</dd>
        <dt>Total</dt><dd>${esc(pedido.total)}</dd>
      </dl>
    </div>` : '';

  const mensaje = pedido
    ? 'Ya abrimos WhatsApp con tu pedido. Envía el mensaje y te responderemos en breve para confirmar disponibilidad y entrega.'
    : 'Te responderemos por WhatsApp en breve para confirmar disponibilidad y entrega.';

  montar(`
    <section class="thanks">
      <div class="wrap">
        <div class="thanks-inner">
          <div class="check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h1>¡Gracias por tu solicitud!</h1>
          <p>${esc(mensaje)}</p>
          ${resumen}
          <div class="thanks-actions">
            <a class="btn btn-dark" href="index.html">Volver a la página de inicio</a>
            ${pedido ? `<a class="btn btn-ghost-dark" href="${esc(pedido.url)}" target="_blank" rel="noopener">Abrir WhatsApp otra vez</a>` : ''}
          </div>
        </div>
      </div>
    </section>`, 'Gracias por tu solicitud');
}

function vista404() {
  montar(`
    <section class="thanks">
      <div class="wrap">
        <div class="thanks-inner">
          <h1>No encontramos esa página</h1>
          <p>El enlace puede estar mal escrito o el producto ya no está disponible.</p>
          <a class="btn btn-dark" href="index.html">Volver a la página de inicio</a>
        </div>
      </div>
    </section>`, 'Página no encontrada');
}

/* ---------- 8. PÁGINA ACTUAL ---------- */
const PARAMS = new URLSearchParams(location.search);

function iniciarPagina() {
  const pagina = document.body.dataset.pagina;
  const id = PARAMS.get('id');
  let activo = '';

  if (pagina === 'inicio') { vistaInicio(); activo = 'inicio'; }
  else if (pagina === 'marcas') { vistaMarcas(PARAMS.get('tipo')); }
  else if (pagina === 'marca' && MARCA_POR_ID[id]) { vistaMarca(id, PARAMS); activo = id; }
  else if (pagina === 'producto' && PROD[id]) { vistaProducto(PROD[id]); activo = PROD[id].marca; }
  else if (pagina === 'gracias') { vistaGracias(); }
  else { vista404(); }

  $$('[data-nav]').forEach((enlace) => {
    const on = enlace.dataset.nav === activo;
    enlace.classList.toggle('is-active', on);
    if (on) enlace.setAttribute('aria-current', 'page'); else enlace.removeAttribute('aria-current');
  });
}

/* ---------- 8b. CABECERA Y PIE (se generan aquí: no hay que repetirlos en cada .html) ---------- */
function pintarLayout() {
  $('#cabecera').innerHTML = `
    <header class="site-header">
      <div class="wrap">
        <a class="logo" href="index.html" aria-label="Ir al inicio"></a>
        <nav class="nav" id="menu" aria-label="Principal">
          <a href="index.html" data-nav="inicio">Inicio</a>
        </nav>
        <div class="header-actions">
          <a class="wa-pill" id="wa-header" href="#" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
            <span>WhatsApp</span>
          </a>
          <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menú">
            <span></span>
          </button>
        </div>
      </div>
    </header>`;
  $('#pie').innerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <strong id="footer-nombre"></strong>
        <p>${esc(TEXTOS.pie)}</p>
      </div>
    </footer>`;
}
pintarLayout();

/* ---------- 9. MENÚ MÓVIL ---------- */
const menu = $('#menu');
const burger = $('#burger');

function cerrarMenu() {
  menu.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Abrir menú');
}

burger.addEventListener('click', () => {
  const abierto = menu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(abierto));
  burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });

/* ---------- 10. ARRANQUE ---------- */
$('.logo').textContent = CONFIG.tienda.toUpperCase();
$('#footer-nombre').textContent = CONFIG.tienda.toUpperCase();
menu.insertAdjacentHTML('beforeend', MARCAS.map((m) => `<a href="marca.html?id=${esc(m.id)}" data-nav="${esc(m.id)}">${esc(m.nombre)}</a>`).join(''));

$('#wa-header').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('Hola, quiero información sobre sus productos.')}`;
$('.skip').addEventListener('click', (e) => { e.preventDefault(); app.focus(); });

if (CONFIG.whatsapp === '573000000000') {
  console.warn('Plantilla: cambia CONFIG.whatsapp en script.js por tu número real de WhatsApp.');
}

iniciarPagina();
