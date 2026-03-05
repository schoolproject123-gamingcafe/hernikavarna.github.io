// app.js — no server needed (uses localStorage)

const STORAGE_KEY = "hk_bookings_v1";
const CART_KEY = "hk_cart_v1";

// ---------- Data (edit these anytime) ----------
const MENU = [
  { id:"ramen", title:"Tonkotsu Ramen", price:159, category:"Japonské", desc:"Bohatý vývar, nudle, vepřové, vejce, jarní cibulka." },
  { id:"miso", title:"Miso Ramen", price:149, category:"Japonské", desc:"Miso vývar, nudle, kukuřice, vejce, sezam." },
  { id:"gyoza", title:"Gyoza (6 ks)", price:119, category:"Japonské", desc:"Opečené knedlíčky se sójovou omáčkou." },
  { id:"onigiri", title:"Onigiri", price:69, category:"Japonské", desc:"Rýžový trojúhelník – tuňák/losos." },
  { id:"takoyaki", title:"Takoyaki (6 ks)", price:129, category:"Japonské", desc:"Křupavé kuličky s chobotnicí a omáčkou." },
  { id:"yakitori", title:"Yakitori (2 špízy)", price:139, category:"Japonské", desc:"Grilované kuře se sladko-slanou glazurou." },

  { id:"miniPizza", title:"Mini Pizza (cca 10 cm)", price:89, category:"Hlavní", desc:"Malá pizza se sýrem a rajčatovou omáčkou – ideální při hraní." },
  { id:"burger", title:"Juicy Burger", price:169, category:"Hlavní", desc:"Šťavnaté hovězí, sýr, omáčka, zelenina." },
  { id:"fries", title:"Loaded Fries", price:119, category:"Hlavní", desc:"Hranolky se sýrem a toppingy." },
  { id:"nuggets", title:"Chicken Nuggets (8 ks)", price:109, category:"Snack", desc:"Křupavé nuggets + omáčka." },
  { id:"nachos", title:"Nachos + sýrový dip", price:99, category:"Snack", desc:"Chipsy se sýrovou omáčkou (na sdílení)." },

  { id:"cola", title:"Cola", price:39, category:"Pití", desc:"0.33l" },
  { id:"icedTea", title:"Ice Tea", price:39, category:"Pití", desc:"0.33l" },
  { id:"energy", title:"Energy Drink", price:59, category:"Pití", desc:"0.25l" },
  { id:"water", title:"Voda", price:29, category:"Pití", desc:"0.5l" },
];

const DEALS = [
  { id:"pc1h", title:"PC 1 hodina", type:"PC", durationMin:60, price:80, desc:"Rychlá hra – ideální na pár zápasů." },
  { id:"pc5h", title:"PC Maraton 5h", type:"PC", durationMin:300, price:300, desc:"Hraj dlouho, hraj naplno." },
  { id:"pcNight", title:"Noční pařba (22:00–06:00)", type:"PC", durationMin:480, price:400, desc:"Celá noc paření." },
  { id:"ps1h", title:"PlayStation 1 hodina", type:"PS", durationMin:60, price:100, desc:"Pohodový couch gaming." },
  { id:"vr30", title:"VR Session 30 min", type:"VR", durationMin:30, price:150, desc:"Rychlý VR zážitek." },
];

// ---------- Helpers ----------
function $(id){ return document.getElementById(id); }

function loadBookings(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveBookings(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(n){ return `${n} Kč`; }
function pad(n){ return String(n).padStart(2,"0"); }
function formatDT(d){
  const dt = new Date(d);
  return `${pad(dt.getDate())}.${pad(dt.getMonth()+1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function calcCartTotal(cart){
  return cart.reduce((s, it)=> s + it.price*it.qty, 0);
}

function getZoneMax(type){
  if(type==="PC") return 8;
  if(type==="PS") return 2;
  if(type==="VR") return 2;
  return 1;
}

function overlaps(aStart, aDur, bStart, bDur){
  const aS = new Date(aStart).getTime();
  const aE = aS + aDur*60000;
  const bS = new Date(bStart).getTime();
  const bE = bS + bDur*60000;
  return aS < bE && aE > bS;
}

function isSlotFree({zoneType, zoneNumber, startDateTime, durationMin}){
  const all = loadBookings().filter(b=> b.status !== "CANCELLED");
  return !all.some(b =>
    b.zoneType === zoneType &&
    Number(b.zoneNumber) === Number(zoneNumber) &&
    overlaps(b.startDateTime, b.durationMin, startDateTime, durationMin)
  );
}

// ---------- Menu Page ----------
function initMenuPage(){
  const catSelect = $("categorySelect");
  const list = $("menuList");

  const categories = ["Vše", ...new Set(MENU.map(x=>x.category))];
  catSelect.innerHTML = categories.map(c=> `<option value="${c}">${c}</option>`).join("");

  function render(){
    const filter = catSelect.value;
    const items = (filter==="Vše") ? MENU : MENU.filter(x=>x.category===filter);
    list.innerHTML = items.map(x=> `
      <div class="item">
        <div>
          <div class="title">${x.title}</div>
          <div class="meta">${x.category} • ${x.desc}</div>
        </div>
        <div class="row" style="justify-content:flex-end">
          <div class="price">${money(x.price)}</div>
          <button class="btn" data-add="${x.id}">Přidat</button>
        </div>
      </div>
    `).join("");
  }

  catSelect.addEventListener("change", render);
  list.addEventListener("click", (e)=>{
    const id = e.target?.dataset?.add;
    if(!id) return;
    const item = MENU.find(x=>x.id===id);
    let cart = loadCart();
    const found = cart.find(c=>c.id===id);
    if(found) found.qty += 1;
    else cart.push({ id:item.id, title:item.title, price:item.price, qty:1 });
    saveCart(cart);
    toast("Přidáno do košíku ✅", true);
    updateCartBadge();
  });

  $("clearCartBtn").addEventListener("click", ()=>{
    saveCart([]);
    toast("Košík vyčištěn ✅", true);
    updateCartBadge();
  });

  render();
  updateCartBadge();
}

// ---------- Booking Page ----------
function initBookingPage(){
  // fill zone type
  const zoneType = $("zoneType");
  zoneType.innerHTML = `
    <option value="PC">PC zóna</option>
    <option value="PS">PlayStation zóna</option>
    <option value="VR">VR zóna</option>
  `;

  // deals
  const dealSelect = $("dealSelect");
  dealSelect.innerHTML = `<option value="">Bez balíčku</option>` + DEALS.map(d =>
    `<option value="${d.id}">${d.title} • ${money(d.price)} • ${d.durationMin} min</option>`
  ).join("");

  // update zone numbers
  function refreshZones(){
    const type = zoneType.value;
    const max = getZoneMax(type);
    const zoneNumber = $("zoneNumber");
    zoneNumber.innerHTML = Array.from({length:max}, (_,i)=> `<option value="${i+1}">${type} ${i+1}</option>`).join("");
  }
  zoneType.addEventListener("change", refreshZones);
  refreshZones();

  // show cart on booking page
  renderCart();

  $("clearCartBtn").addEventListener("click", ()=>{
    saveCart([]);
    renderCart();
    toast("Košík vyčištěn ✅", true);
    updateCartBadge();
  });

  $("cartList").addEventListener("click", (e)=>{
    const act = e.target?.dataset?.act;
    const id = e.target?.dataset?.id;
    if(!act || !id) return;

    let cart = loadCart();
    const it = cart.find(x=>x.id===id);
    if(!it) return;

    if(act==="plus") it.qty += 1;
    if(act==="minus") it.qty -= 1;
    if(act==="remove") it.qty = 0;

    cart = cart.filter(x=>x.qty>0);
    saveCart(cart);
    renderCart();
    updateCartBadge();
  });

  // Submit booking
  $("submitBtn").addEventListener("click", ()=>{
    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const type = zoneType.value;
    const num = $("zoneNumber").value;

    const date = $("date").value; // YYYY-MM-DD
    const time = $("time").value; // HH:MM

    if(!name || !email){ toast("Vyplň jméno a email ❗", false); return; }
    if(!date || !time){ toast("Vyber datum a čas ❗", false); return; }

    const start = new Date(`${date}T${time}:00`);
    if(Number.isNaN(start.getTime())){ toast("Neplatný datum/čas ❗", false); return; }

    // duration from deal or default
    let durationMin = 60;
    let dealId = dealSelect.value;
    let deal = null;
    if(dealId){
      deal = DEALS.find(d=>d.id===dealId);
      durationMin = deal?.durationMin || 60;
    }

    // note about food to zone
    const notes = $("notes").value.trim() || "Jídlo připravíme a přineseme přímo do zóny.";

    // availability check
    const ok = isSlotFree({ zoneType:type, zoneNumber:num, startDateTime:start, durationMin });
    if(!ok){
      toast("Tenhle čas je už obsazený. Zkus jiný čas nebo zónu ❌", false);
      return;
    }

    const cart = loadCart();
    const foodTotal = calcCartTotal(cart);

    const booking = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      status: "NEW",
      customer: { name, email, phone },
      zoneType: type,
      zoneNumber: Number(num),
      startDateTime: start.toISOString(),
      durationMin,
      deal: deal ? { id: deal.id, title: deal.title, price: deal.price } : null,
      order: {
        items: cart,
        foodTotal,
        notes
      }
    };

    const all = loadBookings();
    all.unshift(booking);
    saveBookings(all);

    // clear cart after booking
    saveCart([]);
    renderCart();
    updateCartBadge();

    toast(`Rezervace vytvořena ✅ (${type} ${num})`, true);

    // reset fields (keep type maybe)
    $("name").value = "";
    $("email").value = "";
    $("phone").value = "";
  });

  updateCartBadge();
}

function renderCart(){
  const cartList = $("cartList");
  const cart = loadCart();
  if(!cartList) return;

  if(cart.length===0){
    cartList.innerHTML = `<div class="small">Košík je prázdný.</div>`;
    $("cartTotal").textContent = money(0);
    return;
  }

  cartList.innerHTML = cart.map(it=> `
    <div class="item">
      <div>
        <div class="title">${it.title}</div>
        <div class="meta">${money(it.price)} • množství: ${it.qty}</div>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn secondary" data-act="minus" data-id="${it.id}">-</button>
        <button class="btn secondary" data-act="plus" data-id="${it.id}">+</button>
        <button class="btn secondary" data-act="remove" data-id="${it.id}">✕</button>
      </div>
    </div>
  `).join("");

  $("cartTotal").textContent = money(calcCartTotal(cart));
}

// ---------- Home Page ----------
function initHomePage(){
  // show featured deals + quick stats
  const dealsBox = $("dealsBox");
  const featured = DEALS.slice(0,4);
  dealsBox.innerHTML = featured.map(d=> `
    <div class="item">
      <div>
        <div class="title">${d.title}</div>
        <div class="meta">${d.type} • ${d.durationMin} min • ${d.desc}</div>
      </div>
      <div class="price">${money(d.price)}</div>
    </div>
  `).join("");

  const totalBookings = loadBookings().length;
  const totalOrders = loadBookings().filter(b=> (b.order?.items?.length || 0) > 0).length;

  $("kpiBookings").textContent = totalBookings;
  $("kpiOrders").textContent = totalOrders;

  updateCartBadge();
}

// ---------- Admin Page ----------
function initAdminPage(){
  const bookings = loadBookings();
  const tbody = $("adminBody");
  const k1 = $("adminK1");
  const k2 = $("adminK2");
  const k3 = $("adminK3");

  k1.textContent = bookings.length;
  k2.textContent = bookings.filter(b=> b.zoneType==="PC").length;
  k3.textContent = bookings.filter(b=> (b.order?.items?.length || 0) > 0).length;

  if(bookings.length===0){
    tbody.innerHTML = `<tr><td colspan="6">Zatím žádné rezervace.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b=>{
    const food = b.order?.foodTotal ? money(b.order.foodTotal) : "0 Kč";
    const items = (b.order?.items || []).map(i=> `${i.title} x${i.qty}`).join(", ");
    return `
      <tr>
        <td><b>${b.customer.name}</b><div class="small">${b.customer.email}</div></td>
        <td>${b.zoneType} ${b.zoneNumber}</td>
        <td>${formatDT(b.startDateTime)}<div class="small">${b.durationMin} min</div></td>
        <td>${b.deal ? `${b.deal.title} (${money(b.deal.price)})` : "—"}</td>
        <td>${food}<div class="small">${items || "—"}</div></td>
        <td>${b.status}</td>
      </tr>
    `;
  }).join("");

  $("wipeBtn").addEventListener("click", ()=>{
    if(!confirm("Smazat všechny rezervace?")) return;
    saveBookings([]);
    toast("Smazáno ✅", true);
    setTimeout(()=> location.reload(), 400);
  });

  updateCartBadge();
}

// ---------- UI ----------
function toast(msg, good){
  const box = $("toast");
  if(!box) return;
  box.className = `toast ${good ? "good":"bad"}`;
  box.textContent = msg;
  box.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(()=> box.style.display="none", 2500);
}

function updateCartBadge(){
  const badge = document.querySelector("[data-cart-badge]");
  if(!badge) return;
  const cart = loadCart();
  const count = cart.reduce((s,x)=> s + x.qty, 0);
  badge.textContent = `Košík: ${count}`;
}

// ---------- Router ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // Identify which page we're on
  const page = document.body.dataset.page;

  if(page==="home") initHomePage();
  if(page==="menu") initMenuPage();
  if(page==="booking") initBookingPage();
  if(page==="admin") initAdminPage();

  updateCartBadge();
});
