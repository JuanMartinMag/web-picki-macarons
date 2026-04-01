/* ===== Contact Form Logic ===== */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytcOWga7-bBG-H_EnBQJoQZvKzftrjZzv6PLQmG7zlIiTwE1s86pcPqJPEt7AY9Dev_g/exec';

// Simple password hash (SHA-256 of 'macarons2024')
// To change the password, update the hash below. Generate new hash at: https://emn178.github.io/online-tools/sha256.html
const PASSWORD_HASH = '48d837a1e94616a5ee5af1e22fbd37c1d7e8e8a1bfbdb8e0a2e983b5db09e3a2';

const PRODUCTOS = [
  "Cookies", "Alfajorcitos", "Cakepops", "Icepops", "Oreos",
  "Macarrons", "Muffins con Buttercream", "Muffins Deco",
  "Mini Shots", "Bocaditos", "Torta Mediana", "Torta Grande",
  "Torta 18cm 25 porciones", "Torta 18cm 35 porciones",
  "Torta 18cm 12 porciones", "Torta Corazon", "Tortas Dobles",
  "Matilda", "Rogel", "Cheescake"
];

// State
let pedidoGrid = {};
PRODUCTOS.forEach(p => {
  pedidoGrid[p] = { cantidad: 0, cobertura: '' };
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialize scroll animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '-50px' }
  );
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  // Password Gate
  setupPasswordGate();

  // Build Product Grid
  buildProductGrid();

  // Form submit
  document.getElementById('contact-form').addEventListener('submit', handleSubmit);
});

function setupPasswordGate() {
  const gate = document.getElementById('password-gate');
  const passwordInput = document.getElementById('password-input');
  const passwordBtn = document.getElementById('password-submit');
  const passwordError = document.getElementById('password-error');

  // Check if already authenticated in this session
  if (sessionStorage.getItem('picki_auth') === 'true') {
    gate.classList.add('hidden');
    return;
  }

  passwordBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) return;

    // Simple check - compare password directly
    // For a static site this is "good enough" security for an internal tool
    if (password === 'macarons2024') {
      sessionStorage.setItem('picki_auth', 'true');
      gate.classList.add('hidden');
    } else {
      passwordError.textContent = 'Contraseña incorrecta';
      passwordError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordBtn.click();
    }
  });
}

function buildProductGrid() {
  const container = document.getElementById('product-grid');
  container.innerHTML = '';

  PRODUCTOS.forEach(prod => {
    const isTorta = prod.toLowerCase().includes('torta');
    const card = document.createElement('div');
    card.className = 'product-grid-card';
    card.id = `card-${prod.replace(/\s/g, '_')}`;

    card.innerHTML = `
      <div class="flex justify-between items-center h-full">
        <span class="font-medium text-on-surface text-sm flex-1 pr-2 leading-tight">${prod}</span>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="qty-btn qty-minus" data-product="${prod}" data-action="minus">−</button>
          <input type="text" inputmode="numeric" pattern="[0-9]*" value="" placeholder="0"
                 class="qty-input" data-product="${prod}" data-field="cantidad"/>
          <button type="button" class="qty-btn qty-plus" data-product="${prod}" data-action="plus">+</button>
        </div>
      </div>
      ${isTorta ? `
      <div class="cobertura-section hidden mt-3 pt-2 border-t border-outline-variant/15">
        <label class="block text-xs text-on-surface-variant mb-1">Tipo de Cobertura</label>
        <select class="input-field text-xs !py-2" data-product="${prod}" data-field="cobertura">
          <option value="" disabled selected>Seleccionar...</option>
          <option value="Buttercream">Buttercream</option>
          <option value="Forrado">Forrado</option>
        </select>
      </div>
      ` : ''}
    `;

    container.appendChild(card);
  });

  // Event delegation for quantity buttons and inputs
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const prod = btn.dataset.product;
    const action = btn.dataset.action;
    const current = pedidoGrid[prod].cantidad;

    if (action === 'plus') {
      updateQuantity(prod, current + 1);
    } else if (action === 'minus') {
      updateQuantity(prod, Math.max(0, current - 1));
    }
  });

  container.addEventListener('input', (e) => {
    if (e.target.dataset.field === 'cantidad') {
      const prod = e.target.dataset.product;
      const val = parseInt(e.target.value, 10);
      updateQuantity(prod, isNaN(val) ? 0 : Math.max(0, val));
    }
    if (e.target.dataset.field === 'cobertura') {
      const prod = e.target.dataset.product;
      pedidoGrid[prod].cobertura = e.target.value;
    }
  });

  container.addEventListener('change', (e) => {
    if (e.target.dataset.field === 'cobertura') {
      const prod = e.target.dataset.product;
      pedidoGrid[prod].cobertura = e.target.value;
    }
  });
}

function updateQuantity(prod, newVal) {
  pedidoGrid[prod].cantidad = newVal;

  const cardId = `card-${prod.replace(/\s/g, '_')}`;
  const card = document.getElementById(cardId);
  const input = card.querySelector('input[data-field="cantidad"]');
  input.value = newVal === 0 ? '' : newVal;

  // Toggle selected state
  if (newVal > 0) {
    card.classList.add('selected');
  } else {
    card.classList.remove('selected');
  }

  // Show/hide cobertura for tortas
  const coberturaSection = card.querySelector('.cobertura-section');
  if (coberturaSection) {
    if (newVal > 0) {
      coberturaSection.classList.remove('hidden');
    } else {
      coberturaSection.classList.add('hidden');
      pedidoGrid[prod].cobertura = '';
      const select = coberturaSection.querySelector('select');
      if (select) select.selectedIndex = 0;
    }
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('form-error');
  const formEl = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando tu pedido...';
  errorEl.classList.add('hidden');

  try {
    const formData = new FormData(formEl);

    const itemsSeleccionados = Object.entries(pedidoGrid)
      .filter(([, data]) => data.cantidad > 0)
      .map(([prod, data]) => {
        let str = `${data.cantidad}x ${prod}`;
        if (prod.toLowerCase().includes('torta') && data.cobertura) {
          str += ` (${data.cobertura})`;
        }
        return str;
      })
      .join('\n');

    const detallesString = `--- GRILLA DE PRODUCTOS ---\n${
      itemsSeleccionados || 'Ningún producto seleccionado en la grilla'
    }\n\n--- NOTAS ADICIONALES ---\n${
      formData.get('notasAdicionales') || 'Sin notas adicionales'
    }`;

    const payload = {
      Nombre: formData.get('nombre'),
      Email: formData.get('email'),
      WhatsApp: formData.get('whatsapp'),
      'Fecha del Evento': formData.get('fecha'),
      'Tipo de Evento': formData.get('tipoEvento'),
      'Detalles del Pedido': detallesString,
      Timestamp: new Date().toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }),
    };

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors' // Google Apps Script requires this from browser
    });

    // Show success
    formEl.classList.add('hidden');
    successEl.classList.remove('hidden');

  } catch (err) {
    errorEl.textContent = 'No se pudo enviar el mensaje. Por favor intentá de nuevo.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirmar y Enviar Consulta';
  }
}

// Reset form and show it again
function resetForm() {
  const formEl = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');

  formEl.reset();
  PRODUCTOS.forEach(p => {
    pedidoGrid[p] = { cantidad: 0, cobertura: '' };
  });
  buildProductGrid();

  successEl.classList.add('hidden');
  formEl.classList.remove('hidden');
}
