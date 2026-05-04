/* ===== Contact Form Logic ===== */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytcOWga7-bBG-H_EnBQJoQZvKzftrjZzv6PLQmG7zlIiTwE1s86pcPqJPEt7AY9Dev_g/exec';

// ─── Product Configuration ────────────────────────────────────────────────────
// tipo: undefined = estándar | 'torta' | 'sabores' | 'sabor_simple'
// deco: true = mostrar campo de deco (todos menos Macarrons)
// diametro: true = mostrar campo diámetro/tamaño (solo Matilda)
const PRODUCTOS_CONFIG = [
  { name: "Cookies",                    deco: true },
  { name: "Alfajorcitos",               deco: true },
  { name: "Cakepops",                   deco: true },
  { name: "Icepops",                    deco: true },
  { name: "Oreos",                      deco: true },
  { name: "Macarrons",                  deco: false },
  { name: "Muffins con Buttercream",    deco: true },
  { name: "Muffins Deco",               deco: true },
  {
    name: "Mini Shots",
    deco: true,
    tipo: 'sabores',
    sabores: ["Frutos rojos", "Limón", "Maracuyá", "Mouse de chocolate", "Tiramisú"]
  },
  {
    name: "Bocaditos",
    deco: true,
    tipo: 'sabores',
    sabores: ["Limón", "Brownie", "Blondie", "Rogel"]
  },
  { name: "Torta Mediana",              deco: true, tipo: 'torta' },
  { name: "Torta Grande",               deco: true, tipo: 'torta' },
  { name: "Torta 18cm 25 porciones",   deco: true, tipo: 'torta' },
  { name: "Torta 18cm 35 porciones",   deco: true, tipo: 'torta' },
  { name: "Torta 18cm 12 porciones",   deco: true, tipo: 'torta' },
  { name: "Torta Corazon",             deco: true, tipo: 'torta' },
  { name: "Tortas Dobles",             deco: true, tipo: 'torta' },
  { name: "Matilda",                   deco: true, tipo: 'torta', diametro: true },
  { name: "Rogel",                     deco: true },
  { name: "Cheescake",                 deco: true, tipo: 'sabor_simple' },
];

// ─── State ────────────────────────────────────────────────────────────────────
let pedidoGrid = {};

function initState() {
  pedidoGrid = {};
  PRODUCTOS_CONFIG.forEach(cfg => {
    const s = { deco: '' };
    if (cfg.tipo === 'sabores') {
      s.sabores = {};
      cfg.sabores.forEach(sb => { s.sabores[sb] = 0; });
    } else {
      s.cantidad = 0;
    }
    if (cfg.tipo === 'torta') {
      s.cobertura = '';
      s.sabor     = '';
      s.rellenos  = '';
    }
    if (cfg.tipo === 'sabor_simple') {
      s.sabor = '';
    }
    if (cfg.diametro) {
      s.diametro = '';
    }
    pedidoGrid[cfg.name] = s;
  });
}

function getTotalQty(cfg) {
  const s = pedidoGrid[cfg.name];
  if (cfg.tipo === 'sabores') {
    return Object.values(s.sabores).reduce((a, b) => a + b, 0);
  }
  return s.cantidad || 0;
}

// ─── Card Builder ─────────────────────────────────────────────────────────────
function buildCardHTML(cfg) {
  const p = cfg.name;
  let html = '';

  // ── Header / main qty ──
  if (cfg.tipo === 'sabores') {
    // Product name as header, then per-flavor rows
    html += `<div class="font-semibold text-on-surface text-sm mb-3 pb-2 border-b border-outline-variant/20">${p}</div>`;
    html += `<div class="space-y-2">`;
    cfg.sabores.forEach(sabor => {
      html += `
        <div class="flex items-center gap-2">
          <span class="text-xs text-on-surface-variant flex-1 leading-tight">${sabor}</span>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" class="qty-btn qty-minus" data-product="${p}" data-sabor="${sabor}" data-action="minus-sabor">−</button>
            <input type="text" inputmode="numeric" pattern="[0-9]*" value="" placeholder="0"
                   class="qty-input !w-10 text-center" data-product="${p}" data-sabor="${sabor}" data-field="sabor-qty"/>
            <button type="button" class="qty-btn qty-plus" data-product="${p}" data-sabor="${sabor}" data-action="plus-sabor">+</button>
          </div>
        </div>`;
    });
    html += `</div>`;
  } else {
    html += `
      <div class="flex justify-between items-center">
        <span class="font-medium text-on-surface text-sm flex-1 pr-2 leading-tight">${p}</span>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="qty-btn qty-minus" data-product="${p}" data-action="minus">−</button>
          <input type="text" inputmode="numeric" pattern="[0-9]*" value="" placeholder="0"
                 class="qty-input" data-product="${p}" data-field="cantidad"/>
          <button type="button" class="qty-btn qty-plus" data-product="${p}" data-action="plus">+</button>
        </div>
      </div>`;
  }

  // ── Torta extras (hidden until qty > 0) ──
  if (cfg.tipo === 'torta') {
    html += `
      <div class="torta-extras hidden mt-3 pt-3 border-t border-outline-variant/20 space-y-3">
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Cobertura</label>
          <select class="input-field !text-xs !py-2" data-product="${p}" data-field="cobertura">
            <option value="" disabled selected>Seleccionar...</option>
            <option value="Buttercream">Buttercream</option>
            <option value="Forrado">Forrado</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Sabor (bizcochuelo)</label>
          <select class="input-field !text-xs !py-2" data-product="${p}" data-field="sabor">
            <option value="" disabled selected>Seleccionar...</option>
            <option value="Vainilla">Vainilla</option>
            <option value="Chocolate">Chocolate</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Rellenos</label>
          <input type="text" class="input-field !text-xs !py-2" placeholder="Ej: dulce de leche, frutos rojos..."
                 data-product="${p}" data-field="rellenos"/>
        </div>
        ${cfg.diametro ? `
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Diámetro / Tamaño</label>
          <input type="text" class="input-field !text-xs !py-2" placeholder="Ej: 20cm, 6 porciones..."
                 data-product="${p}" data-field="diametro"/>
        </div>` : ''}
      </div>`;
  }

  // ── Sabor simple (Cheesecake) ──
  if (cfg.tipo === 'sabor_simple') {
    html += `
      <div class="sabor-extra hidden mt-3 pt-3 border-t border-outline-variant/20">
        <label class="block text-xs font-medium text-on-surface-variant mb-1">Sabor</label>
        <select class="input-field !text-xs !py-2" data-product="${p}" data-field="sabor">
          <option value="" disabled selected>Seleccionar...</option>
          <option value="Vainilla">Vainilla</option>
          <option value="Chocolate">Chocolate</option>
        </select>
      </div>`;
  }

  // ── Deco field (all except Macarrons) ──
  if (cfg.deco) {
    html += `
      <div class="mt-3">
        <input type="text" class="input-field !text-xs !py-2" placeholder="✏️ Deco / Temática..."
               data-product="${p}" data-field="deco"/>
      </div>`;
  }

  return html;
}

// ─── Build Product Grid ───────────────────────────────────────────────────────
function buildProductGrid() {
  const container = document.getElementById('product-grid');
  container.innerHTML = '';

  PRODUCTOS_CONFIG.forEach(cfg => {
    const card = document.createElement('div');
    card.className = 'product-grid-card';
    card.id = `card-${cfg.name.replace(/\s/g, '_')}`;
    card.innerHTML = buildCardHTML(cfg);
    container.appendChild(card);
  });

  // ── Event delegation ──
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const p      = btn.dataset.product;
    const action = btn.dataset.action;
    const cfg    = PRODUCTOS_CONFIG.find(c => c.name === p);

    if (action === 'plus-sabor' || action === 'minus-sabor') {
      const sabor   = btn.dataset.sabor;
      const current = pedidoGrid[p].sabores[sabor];
      const newVal  = action === 'plus-sabor' ? current + 1 : Math.max(0, current - 1);
      updateSaborQty(cfg, sabor, newVal);
    } else if (action === 'plus') {
      updateQty(cfg, pedidoGrid[p].cantidad + 1);
    } else if (action === 'minus') {
      updateQty(cfg, Math.max(0, pedidoGrid[p].cantidad - 1));
    }
  });

  container.addEventListener('input', e => {
    const { field, product: p, sabor } = e.target.dataset;
    const cfg = PRODUCTOS_CONFIG.find(c => c.name === p);
    if (!cfg) return;

    if (field === 'cantidad') {
      const v = parseInt(e.target.value, 10);
      updateQty(cfg, isNaN(v) ? 0 : Math.max(0, v));
    } else if (field === 'sabor-qty') {
      const v = parseInt(e.target.value, 10);
      updateSaborQty(cfg, sabor, isNaN(v) ? 0 : Math.max(0, v));
    } else if (['cobertura', 'sabor', 'rellenos', 'diametro', 'deco'].includes(field)) {
      pedidoGrid[p][field] = e.target.value;
    }
  });

  container.addEventListener('change', e => {
    const { field, product: p } = e.target.dataset;
    if (['cobertura', 'sabor'].includes(field) && p) {
      pedidoGrid[p][field] = e.target.value;
    }
  });
}

function updateQty(cfg, newVal) {
  const p     = cfg.name;
  const card  = document.getElementById(`card-${p.replace(/\s/g, '_')}`);
  pedidoGrid[p].cantidad = newVal;

  const input = card.querySelector('input[data-field="cantidad"]');
  if (input) input.value = newVal === 0 ? '' : newVal;

  const isSelected = newVal > 0;
  card.classList.toggle('selected', isSelected);

  // Torta extras
  const tortaExtras = card.querySelector('.torta-extras');
  if (tortaExtras) tortaExtras.classList.toggle('hidden', !isSelected);

  // Sabor simple extras
  const saborExtra = card.querySelector('.sabor-extra');
  if (saborExtra) saborExtra.classList.toggle('hidden', !isSelected);
}

function updateSaborQty(cfg, sabor, newVal) {
  const p    = cfg.name;
  const card = document.getElementById(`card-${p.replace(/\s/g, '_')}`);
  pedidoGrid[p].sabores[sabor] = newVal;

  const input = card.querySelector(`input[data-sabor="${sabor}"]`);
  if (input) input.value = newVal === 0 ? '' : newVal;

  const total = getTotalQty(cfg);
  card.classList.toggle('selected', total > 0);
}

// ─── Password Gate ────────────────────────────────────────────────────────────
function setupPasswordGate() {
  const gate          = document.getElementById('password-gate');
  const passwordInput = document.getElementById('password-input');
  const passwordBtn   = document.getElementById('password-submit');
  const passwordError = document.getElementById('password-error');

  if (sessionStorage.getItem('picki_auth') === 'true') {
    gate.classList.add('hidden');
    return;
  }

  const attempt = () => {
    const password = passwordInput.value;
    if (!password) return;
    if (password === 'macarons2024') {
      sessionStorage.setItem('picki_auth', 'true');
      gate.classList.add('hidden');
    } else {
      passwordError.textContent = 'Contraseña incorrecta';
      passwordError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  };

  passwordBtn.addEventListener('click', attempt);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); attempt(); } });
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  const errorEl   = document.getElementById('form-error');
  const formEl    = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Guardando pedido...';
  errorEl.classList.add('hidden');

  try {
    const formData = new FormData(formEl);

    // ── Build product lines ──
    const lines = [];
    PRODUCTOS_CONFIG.forEach(cfg => {
      const s     = pedidoGrid[cfg.name];
      const total = getTotalQty(cfg);
      if (total === 0) return;

      if (cfg.tipo === 'sabores') {
        let line = `${cfg.name}:`;
        cfg.sabores.forEach(sabor => {
          if (s.sabores[sabor] > 0) line += ` ${s.sabores[sabor]}x ${sabor} /`;
        });
        line = line.replace(/\/$/, '').trim();
        if (s.deco) line += ` | Deco: ${s.deco}`;
        lines.push(line);
      } else {
        let line = `${total}x ${cfg.name}`;
        if (cfg.tipo === 'torta') {
          if (s.cobertura) line += ` | Cobertura: ${s.cobertura}`;
          if (s.sabor)     line += ` | Sabor: ${s.sabor}`;
          if (s.rellenos)  line += ` | Rellenos: ${s.rellenos}`;
          if (cfg.diametro && s.diametro) line += ` | Tamaño: ${s.diametro}`;
        }
        if (cfg.tipo === 'sabor_simple' && s.sabor) line += ` | Sabor: ${s.sabor}`;
        if (s.deco) line += ` | Deco: ${s.deco}`;
        lines.push(line);
      }
    });

    // ── Ambientaciones ──
    const ambTamano  = formData.get('ambTamano')  || '';
    const ambLugar   = formData.get('ambLugar')   || '';
    const ambHorario = formData.get('ambHorario') || '';
    const ambLink    = formData.get('ambLink')    || '';

    let ambientacionStr = '';
    if (ambTamano || ambLugar || ambHorario || ambLink) {
      const parts = [];
      if (ambTamano)  parts.push(`Tamaño: ${ambTamano}`);
      if (ambLugar)   parts.push(`Lugar: ${ambLugar}`);
      if (ambHorario) parts.push(`Horario: ${ambHorario}`);
      if (ambLink)    parts.push(`Link diseño: ${ambLink}`);
      ambientacionStr = parts.join(' | ');
    }

    const detallesString = [
      '--- PRODUCTOS ---',
      lines.length ? lines.join('\n') : 'Ningún producto seleccionado',
      ambientacionStr ? `\n--- AMBIENTACIÓN ---\n${ambientacionStr}` : '',
      `\n--- NOTAS ---\n${formData.get('notasAdicionales') || 'Sin notas'}`,
    ].join('\n');

    const payload = {
      Nombre:              formData.get('nombre'),
      Email:               formData.get('email'),
      WhatsApp:            formData.get('whatsapp'),
      'Fecha del Evento':  formData.get('fecha'),
      'Tipo de Evento':    formData.get('tipoEvento'),
      'Detalles del Pedido': detallesString,
      Timestamp: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });

    formEl.classList.add('hidden');
    successEl.classList.remove('hidden');

  } catch (err) {
    errorEl.textContent = 'No se pudo enviar el mensaje. Por favor intentá de nuevo.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Guardar';
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetForm() {
  const formEl    = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');
  formEl.reset();
  initState();
  buildProductGrid();
  successEl.classList.add('hidden');
  formEl.classList.remove('hidden');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Scroll animations
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }),
    { threshold: 0.1, rootMargin: '-50px' }
  );
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  setupPasswordGate();
  initState();
  buildProductGrid();
  document.getElementById('contact-form').addEventListener('submit', handleSubmit);
});
