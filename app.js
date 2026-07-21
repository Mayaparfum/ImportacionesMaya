
const $ = (s) => document.querySelector(s);
const money = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n);
const DISCOUNT_MIN = 500;
const DISCOUNT_RATE = 0.05;
let cart = JSON.parse(localStorage.getItem("mayaCart") || "{}");

const productGrid=$("#productGrid"), searchInput=$("#searchInput"), categoryFilter=$("#categoryFilter");
const cartDrawer=$("#cartDrawer"), overlay=$("#overlay"), cartItems=$("#cartItems"), cartEmpty=$("#cartEmpty");
const checkoutModal=$("#checkoutModal");

function normalize(t){return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function categories(){
  [...new Set(PRODUCTS.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,"es")).forEach(c=>{
    const o=document.createElement("option");o.value=c;o.textContent=c;categoryFilter.appendChild(o);
  });
}
function imageHTML(p, cls="product-image"){
  return p.image ? `<img class="${cls}" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.outerHTML='<div class=&quot;image-fallback&quot;>📚</div>'">`
                 : `<div class="image-fallback">📚</div>`;
}
function renderProducts(){
  const q=normalize(searchInput.value), cat=categoryFilter.value;
  const filtered=PRODUCTS.filter(p=>(cat==="all"||p.category===cat)&&(!q||normalize(`${p.name} ${p.code}`).includes(q)));
  $("#resultsCount").textContent=`${filtered.length} productos`;
  productGrid.innerHTML=filtered.map(p=>`
    <article class="product-card">
      <div class="product-image-wrap">${imageHTML(p)}</div>
      <div class="product-body">
        <span class="category-pill">${p.category}</span>
        <h3 class="product-name" title="${p.name.replace(/"/g,"&quot;")}">${p.name}</h3>
        <span class="product-code">Código: ${p.code}</span>
        <span class="product-meta">Venta por ${p.soldBy}${p.unitsPerPackage>1?` · ${p.unitsPerPackage} unidades por paquete`:""}</span>
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          <button class="add-button" data-code="${p.code}" type="button">Agregar</button>
        </div>
      </div>
    </article>`).join("");
  $("#emptyState").classList.toggle("hidden",filtered.length>0);
}
function saveCart(){localStorage.setItem("mayaCart",JSON.stringify(cart))}
function add(code,qty=1){cart[code]=(cart[code]||0)+qty;saveCart();renderCart();toast("Producto agregado al carrito")}
function changeQty(code,delta){cart[code]=(cart[code]||0)+delta;if(cart[code]<=0)delete cart[code];saveCart();renderCart()}
function totals(){
  let subtotal=0,count=0;
  Object.entries(cart).forEach(([code,qty])=>{const p=PRODUCTS.find(x=>x.code===code);if(p){subtotal+=p.price*qty;count+=qty}});
  const discount=subtotal>=DISCOUNT_MIN?subtotal*DISCOUNT_RATE:0;
  return {subtotal,discount,total:subtotal-discount,count};
}
function renderCart(){
  const entries=Object.entries(cart).map(([code,qty])=>({p:PRODUCTS.find(x=>x.code===code),qty})).filter(x=>x.p);
  cartItems.innerHTML=entries.map(({p,qty})=>`
    <div class="cart-item">
      <div>${imageHTML(p,"")}</div>
      <div>
        <h4>${p.name}</h4><small>${money(p.price)} c/u</small>
        <div class="cart-item-controls">
          <button data-action="minus" data-code="${p.code}">−</button><strong>${qty}</strong>
          <button data-action="plus" data-code="${p.code}">+</button>
        </div>
      </div>
      <button class="remove-item" data-action="remove" data-code="${p.code}">Eliminar</button>
    </div>`).join("");
  const t=totals();
  $("#cartCount").textContent=t.count;
  $("#cartSubtotal").textContent=money(t.subtotal);
  $("#cartDiscount").textContent=`-${money(t.discount)}`;
  $("#cartTotal").textContent=money(t.total);
  cartEmpty.classList.toggle("hidden",entries.length>0);
  $("#discountRow").classList.toggle("inactive",t.discount===0);
  const pct=Math.min(100,(t.subtotal/DISCOUNT_MIN)*100);
  $("#discountProgress").style.width=pct+"%";
  $("#discountMessage").textContent=t.subtotal>=DISCOUNT_MIN
    ? "¡Descuento del 5% aplicado automáticamente!"
    : `Te faltan ${money(DISCOUNT_MIN-t.subtotal)} para obtener 5% de descuento.`;
}
function openCart(){cartDrawer.classList.add("open");cartDrawer.setAttribute("aria-hidden","false");overlay.classList.remove("hidden")}
function closeAll(){cartDrawer.classList.remove("open");cartDrawer.setAttribute("aria-hidden","true");checkoutModal.classList.add("hidden");overlay.classList.add("hidden")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.remove("hidden");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.add("hidden"),1800)}
function openCheckout(){if(!totals().count)return toast("Agrega al menos un producto");cartDrawer.classList.remove("open");checkoutModal.classList.remove("hidden");overlay.classList.remove("hidden")}
function whatsappMessage(data){
  const t=totals();
  const lines=["Hola, quiero realizar el siguiente pedido:",""];
  Object.entries(cart).forEach(([code,qty])=>{const p=PRODUCTS.find(x=>x.code===code);if(p)lines.push(`• ${qty} x ${p.name} (${code}) — ${money(p.price*qty)}`)});
  lines.push("",`Subtotal: ${money(t.subtotal)}`);
  if(t.discount>0)lines.push(`Descuento regreso a clases (5%): -${money(t.discount)}`);
  lines.push(`TOTAL: ${money(t.total)}`,"",`Nombre: ${data.name}`,`Entrega: ${data.delivery}`);
  if(data.address)lines.push(`Dirección/referencia: ${data.address}`);
  if(data.notes)lines.push(`Observaciones: ${data.notes}`);
  return encodeURIComponent(lines.join("\n"));
}
productGrid.addEventListener("click",e=>{const b=e.target.closest("[data-code]");if(b)add(b.dataset.code)});
cartItems.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const c=b.dataset.code;if(b.dataset.action==="plus")changeQty(c,1);if(b.dataset.action==="minus")changeQty(c,-1);if(b.dataset.action==="remove"){delete cart[c];saveCart();renderCart()}});
searchInput.addEventListener("input",renderProducts);categoryFilter.addEventListener("change",renderProducts);
$("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeAll);overlay.addEventListener("click",closeAll);
$("#checkoutButton").addEventListener("click",openCheckout);$("#closeCheckoutModal").addEventListener("click",closeAll);
$("#checkoutForm").addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));window.open(`https://wa.me/529984998030?text=${whatsappMessage(data)}`,"_blank")});
categories();renderProducts();renderCart();
