const WHATSAPP_NUMBER = "529984998030";
const products = window.PRODUCTS || [];

const state = {
  cart: JSON.parse(localStorage.getItem("mayaArtCart") || "{}"),
  currentProduct: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);

const productGrid = $("#productGrid");
const emptyState = $("#emptyState");
const searchInput = $("#searchInput");
const categoryFilter = $("#categoryFilter");
const overlay = $("#overlay");
const cartDrawer = $("#cartDrawer");
const productModal = $("#productModal");
const checkoutModal = $("#checkoutModal");
const toast = $("#toast");

function saveCart() {
  localStorage.setItem("mayaArtCart", JSON.stringify(state.cart));
}

function getProduct(code) {
  return products.find((p) => p.code === code);
}

function cartQuantity(code) {
  return Number(state.cart[code] || 0);
}

function totalItems() {
  return Object.values(state.cart).reduce((a, b) => a + Number(b), 0);
}

function cartTotal() {
  return Object.entries(state.cart).reduce((total, [code, quantity]) => {
    const product = getProduct(code);
    return total + (product ? product.price * quantity : 0);
  }, 0);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function setupCategories() {
  [...new Set(products.map((p) => p.category))].sort().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });
}

function renderProducts() {
  const term = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = products.filter((product) => {
    const matchesTerm = `${product.name} ${product.description} ${product.brand} ${product.code}`.toLowerCase().includes(term);
    const matchesCategory = category === "all" || product.category === category;
    return matchesTerm && matchesCategory;
  });

  productGrid.innerHTML = filtered.map((product) => {
    const lowStock = product.stock <= 2;
    return `
      <article class="product-card">
        <button class="product-image-wrap open-product" data-code="${product.code}" aria-label="Ver ${product.name}">
          <img class="product-image" src="${product.images[0]}" alt="${product.name}" loading="lazy">
          <span class="badge">${product.category}</span>
        </button>
        <div class="product-body">
          <span class="product-code">${product.code}</span>
          <h3>${product.name}</h3>
          <div class="price-row">
            <span class="price">${money(product.price)}</span>
            <span class="stock ${lowStock ? "low-stock" : ""}">${product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}</span>
          </div>
          <div class="product-actions">
            <button class="secondary-button open-product" data-code="${product.code}">Ver detalles</button>
            <button class="add-button add-one" data-code="${product.code}" ${product.stock === 0 ? "disabled" : ""} aria-label="Agregar al carrito">＋</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length !== 0);
}

function addToCart(code, amount = 1) {
  const product = getProduct(code);
  if (!product) return;
  const next = cartQuantity(code) + amount;
  if (next > product.stock) {
    showToast(`Solo hay ${product.stock} disponibles`);
    return;
  }
  state.cart[code] = next;
  saveCart();
  renderCart();
  showToast("Producto agregado");
}

function changeCartQuantity(code, amount) {
  const product = getProduct(code);
  const next = cartQuantity(code) + amount;
  if (!product) return;
  if (next <= 0) {
    delete state.cart[code];
  } else if (next <= product.stock) {
    state.cart[code] = next;
  } else {
    showToast(`Solo hay ${product.stock} disponibles`);
  }
  saveCart();
  renderCart();
}

function renderCart() {
  const entries = Object.entries(state.cart).filter(([code, qty]) => getProduct(code) && qty > 0);
  $("#cartCount").textContent = totalItems();
  $("#cartTotal").textContent = money(cartTotal());
  $("#cartEmpty").classList.toggle("hidden", entries.length > 0);
  $("#checkoutButton").disabled = entries.length === 0;

  $("#cartItems").innerHTML = entries.map(([code, quantity]) => {
    const product = getProduct(code);
    return `
      <div class="cart-item">
        <img src="${product.images[0]}" alt="${product.name}">
        <div>
          <h4>${product.name}</h4>
          <small>${money(product.price)} c/u</small>
          <div class="cart-item-controls">
            <button data-action="minus" data-code="${code}">−</button>
            <strong>${quantity}</strong>
            <button data-action="plus" data-code="${code}">＋</button>
          </div>
        </div>
        <button class="remove-item" data-action="remove" data-code="${code}" aria-label="Eliminar">✕</button>
      </div>
    `;
  }).join("");
}

function openLayer(element) {
  overlay.classList.remove("hidden");
  element.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeLayers() {
  overlay.classList.add("hidden");
  productModal.classList.add("hidden");
  checkoutModal.classList.add("hidden");
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function openCart() {
  overlay.classList.remove("hidden");
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function openProduct(code) {
  const product = getProduct(code);
  if (!product) return;
  state.currentProduct = product;
  $("#modalProductCode").textContent = product.code;
  $("#modalProductName").textContent = product.name;
  $("#modalProductDescription").textContent = product.description;
  $("#modalProductPrice").textContent = money(product.price);
  $("#modalProductStock").textContent = product.stock > 0 ? `${product.stock} disponibles` : "Agotado";
  $("#modalMainImage").src = product.images[0];
  $("#modalMainImage").alt = product.name;
  $("#modalQuantity").value = 1;
  $("#modalQuantity").max = product.stock;
  $("#modalAddButton").disabled = product.stock === 0;

  $("#thumbnailRow").innerHTML = product.images.map((image, index) => `
    <button class="thumb-button" data-image="${image}" aria-label="Ver imagen ${index + 1}">
      <img src="${image}" class="thumbnail ${index === 0 ? "active" : ""}" alt="">
    </button>
  `).join("");

  openLayer(productModal);
}

function adjustModalQuantity(amount) {
  if (!state.currentProduct) return;
  const input = $("#modalQuantity");
  const next = Math.max(1, Math.min(state.currentProduct.stock, Number(input.value || 1) + amount));
  input.value = next;
}

function buildWhatsAppMessage(formData) {
  const lines = [
    "Hola Importaciones Maya.",
    "",
    "Quisiera realizar el siguiente pedido:",
    ""
  ];

  Object.entries(state.cart).forEach(([code, quantity]) => {
    const product = getProduct(code);
    if (product && quantity > 0) {
      lines.push(`• ${product.name}`);
      lines.push(`  Código: ${product.code}`);
      lines.push(`  Cantidad: ${quantity}`);
      lines.push(`  Importe: ${money(product.price * quantity)}`);
      lines.push("");
    }
  });

  lines.push(`Total: ${money(cartTotal())}`);
  lines.push("");
  lines.push(`Nombre: ${formData.get("name")}`);
  lines.push(`Entrega: ${formData.get("delivery")}`);

  const address = formData.get("address")?.trim();
  const notes = formData.get("notes")?.trim();
  if (address) lines.push(`Dirección o referencia: ${address}`);
  if (notes) lines.push(`Observaciones: ${notes}`);

  lines.push("");
  lines.push("Quedo pendiente de confirmación de existencias.");

  return lines.join("\n");
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest(".open-product");
  if (openButton) openProduct(openButton.dataset.code);

  const addButton = event.target.closest(".add-one");
  if (addButton) addToCart(addButton.dataset.code, 1);

  const cartAction = event.target.closest("[data-action]");
  if (cartAction) {
    const { action, code } = cartAction.dataset;
    if (action === "minus") changeCartQuantity(code, -1);
    if (action === "plus") changeCartQuantity(code, 1);
    if (action === "remove") {
      delete state.cart[code];
      saveCart();
      renderCart();
    }
  }

  const thumbButton = event.target.closest(".thumb-button");
  if (thumbButton) {
    $("#modalMainImage").src = thumbButton.dataset.image;
    $$(".thumbnail").forEach((thumb) => thumb.classList.remove("active"));
    thumbButton.querySelector(".thumbnail").classList.add("active");
  }
});

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeLayers);
$("#closeProductModal").addEventListener("click", closeLayers);
$("#closeCheckoutModal").addEventListener("click", closeLayers);
overlay.addEventListener("click", closeLayers);
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
$("#decreaseModalQty").addEventListener("click", () => adjustModalQuantity(-1));
$("#increaseModalQty").addEventListener("click", () => adjustModalQuantity(1));
$("#modalAddButton").addEventListener("click", () => {
  if (!state.currentProduct) return;
  addToCart(state.currentProduct.code, Number($("#modalQuantity").value || 1));
  closeLayers();
});
$("#checkoutButton").addEventListener("click", () => {
  if (totalItems() === 0) return;
  cartDrawer.classList.remove("open");
  checkoutModal.classList.remove("hidden");
});
$("#checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (totalItems() === 0) return;
  const formData = new FormData(event.currentTarget);
  const message = buildWhatsAppMessage(formData);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLayers();
});

setupCategories();
renderProducts();
renderCart();
