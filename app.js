const CART_KEY = "hk_cart_v1";
const THEME_KEY = "hk_theme_v1";
const LANG_KEY  = "hk_lang_v1";
const BOOKINGS_KEY = "hk_bookings_v1";

const I18N = {
  cs: { home:"Home", menu:"Menu", booking:"Rezervace", admin:"Admin", cart:"Košík", goBooking:"Přejít na rezervaci", clearCart:"Vyčistit košík", total:"Celkem:", cartEmpty:"Košík je prázdný." },
  en: { home:"Home", menu:"Menu", booking:"Booking",   admin:"Admin", cart:"Cart",  goBooking:"Go to booking",        clearCart:"Clear cart",        total:"Total:", cartEmpty:"Cart is empty." },
  uk: { home:"Головна", menu:"Меню", booking:"Бронювання", admin:"Адмін", cart:"Кошик", goBooking:"Перейти до бронювання", clearCart:"Очистити кошик", total:"Разом:", cartEmpty:"Кошик порожній." },
  vi: { home:"Trang chủ", menu:"Thực đơn", booking:"Đặt chỗ", admin:"Admin", cart:"Giỏ hàng", goBooking:"Tới đặt chỗ", clearCart:"Xoá giỏ", total:"Tổng:", cartEmpty:"Giỏ hàng trống." }
};

const DEALS = [
  { id:"pc1h", title:"PC 1 hodina", type:"PC", durationMin:60,  price:80,  desc:"Rychlá hra – ideální na pár zápasů." },
  { id:"pc5h", title:"PC Maraton 5h", type:"PC", durationMin:300, price:300, desc:"Hraj dlouho, hraj naplno." },
  { id:"pcNight", title:"Noční pařba (22:00–06:00)", type:"PC", durationMin:480, price:400, desc:"Celá noc paření." },
  { id:"ps1h", title:"PlayStation 1 hodina", type:"PS", durationMin:60, price:100, desc:"Pohodový couch gaming." },
  { id:"vr30", title:"VR Session 30 min", type:"VR", durationMin:30, price:150, desc:"Rychlý VR zážitek." }
];

function $(id){ return document.getElementById(id); }
function getLang(){ return localStorage.getItem(LANG_KEY) || "cs"; }
function t(key){
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) ? I18N[lang][key] : (I18N.cs[key] || key);
}

/* ---------- Theme ---------- */
function setTheme(theme){
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
  const btn = $("themeToggle");
  if(btn) btn.textContent = theme === "light" ? "☀️" : "🌙";
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  setTheme(saved);

  const btn = $("themeToggle");
  if(btn){
    btn.addEventListener("click", ()=>{
      const now = localStorage.getItem(THEME_KEY) || "dark";
      setTheme(now === "dark" ? "light" : "dark");
      setGamingFavicon();
      updateCartBadge();
    });
  }
}

/* ---------- Language ---------- */
function initLanguage(){
  const sel = $("langSelect");
  if(sel){
    sel.value = getLang();
    sel.addEventListener("change", ()=>{
      localStorage.setItem(LANG_KEY, sel.value);
      applyI18n();
      updateCartBadge();
      setGamingFavicon();
      refreshDynamicTexts();
    });
  }
  applyI18n();
}
function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

/* ---------- Favicon ---------- */
function setGamingFavicon(){
  const theme = localStorage.getItem(THEME_KEY) || "dark";
  const c = theme === "light" ? "#0077ff" : "#39c6ff";
  const bg = theme === "light" ? "#ffffff" : "#111111";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="${bg}"/>
    <rect x="22" y="56" width="84" height="40" rx="16" fill="none" stroke="${c}" stroke-width="8"/>
    <circle cx="44" cy="76" r="6" fill="${c}"/>
    <circle cx="84" cy="76" r="6" fill="${c}"/>
    <path d="M62 68h8v16h-8z" fill="${c}"/>
    <path d="M58 74h16v4H58z" fill="${c}"/>
  </svg>`;

  const link = $("favicon") || document.querySelector("link[rel='icon']");
  if(link) link.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ---------- Cart ---------- */
function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch{ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function money(n){ return n + " Kč"; }
function calcCartTotal(cart){ return cart.reduce((s,x)=> s + x.price*x.qty, 0); }

function updateCartBadge(){
  const badge = document.querySelector("[data-cart-badge]");
  if(!badge) return;

  const cart = loadCart();
  const count = cart.reduce((s,x)=> s + x.qty, 0);
  badge.textContent = `${t("cart")}: ${count}`;
}
/* ---------- Start ---------- */
function initHomePage(){
  // KPI counts from bookings
  const bookings = loadBookings();
  const totalBookings = bookings.length;
  const totalFoodOrders = bookings.filter(b => (b.order?.items?.length || 0) > 0).length;

  const k1 = document.getElementById("kpiBookings");
  const k2 = document.getElementById("kpiOrders");
  if(k1) k1.textContent = totalBookings;
  if(k2) k2.textContent = totalFoodOrders;

  // Render deals like the screenshot
  const box = document.getElementById("dealsBox");
  if(box){
    box.innerHTML = DEALS.slice(0,4).map(d => `
      <div class="item">
        <div>
          <div style="font-weight:900">${d.title}</div>
          <div class="small">${d.type} • ${d.durationMin} min • ${d.desc}</div>
        </div>
        <div class="price">${money(d.price)}</div>
      </div>
    `).join("");
  }
}

function renderCart(){
  const cartList = $("cartList");
  const cartTotal = $("cartTotal");
  if(!cartList || !cartTotal) return;

  const cart = loadCart();

  if(cart.length === 0){
    cartList.innerHTML = `<div class="small">${t("cartEmpty")}</div>`;
    cartTotal.textContent = money(0);
    return;
  }

  cartList.innerHTML = cart.map(it => `
    <div class="item">
      <div>
        <div><b>${it.title}</b></div>
        <div class="small">${money(it.price)} • x${it.qty}</div>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn secondary" data-act="minus" data-id="${it.id}">-</button>
        <button class="btn secondary" data-act="plus" data-id="${it.id}">+</button>
        <button class="btn secondary" data-act="remove" data-id="${it.id}">✕</button>
      </div>
    </div>
  `).join("");

  cartTotal.textContent = money(calcCartTotal(cart));
}

/* ---------- Bookings (localStorage) ---------- */
function loadBookings(){
  try{ return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]"); }
  catch{ return []; }
}
function saveBookings(list){
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}

function pad(n){ return String(n).padStart(2,"0"); }
function formatDT(iso){
  const dt = new Date(iso);
  return `${pad(dt.getDate())}.${pad(dt.getMonth()+1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function getZoneMax(type){
  if(type==="PC") return 8;
  if(type==="PS") return 2;
  if(type==="VR") return 2;
  return 1;
}
function overlaps(aStartISO, aDurMin, bStartISO, bDurMin){
  const aS = new Date(aStartISO).getTime();
  const aE = aS + aDurMin*60000;
  const bS = new Date(bStartISO).getTime();
  const bE = bS + bDurMin*60000;
  return aS < bE && aE > bS;
}
function isSlotFree(zoneType, zoneNumber, startISO, durationMin){
  const all = loadBookings().filter(b=> b.status !== "CANCELLED");
  return !all.some(b =>
    b.zoneType === zoneType &&
    Number(b.zoneNumber) === Number(zoneNumber) &&
    overlaps(b.startISO, b.durationMin, startISO, durationMin)
  );
}

/* ---------- Toast ---------- */
function toast(msg){
  const box = $("toast");
  if(!box) return;
  box.textContent = msg;
  box.style.display = "block";
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=> box.style.display="none", 2600);
}

/* ---------- Menu Page ---------- */
function initMenuPage(){
  const menuItems = [
    {id:"ramen",title:"Tonkotsu Ramen",price:159},
    {id:"miso",title:"Miso Ramen",price:149},
    {id:"gyoza",title:"Gyoza (6 ks)",price:119},
    {id:"miniPizza",title:"Mini Pizza (cca 10 cm)",price:89},
    {id:"nachos",title:"Nachos + dip",price:99},
    {id:"nuggets",title:"Nuggets (8 ks)",price:109},
    {id:"cola",title:"Cola",price:39},
    {id:"energy",title:"Energy drink",price:59}
  ];

  const list = $("menuList");
  if(list){
    list.innerHTML = menuItems.map(x=>`
      <div class="item">
        <div>
          <div><b>${x.title}</b></div>
          <div class="small">${money(x.price)}</div>
        </div>
        <button class="btn" data-add="${x.id}">Přidat</button>
      </div>
    `).join("");

    list.addEventListener("click",(e)=>{
      const id = e.target.dataset.add;
      if(!id) return;

      const item = menuItems.find(x=>x.id===id);
      let cart = loadCart();
      const found = cart.find(x=>x.id===id);

      if(found) found.qty++;
      else cart.push({ id:item.id, title:item.title, price:item.price, qty:1 });

      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  }

  const clearBtn = $("clearCartBtn");
  if(clearBtn){
    clearBtn.addEventListener("click",()=>{
      saveCart([]);
      renderCart();
      updateCartBadge();
    });
  }

  const cartList = $("cartList");
  if(cartList){
    cartList.addEventListener("click",(e)=>{
      const act = e.target.dataset.act;
      const id = e.target.dataset.id;
      if(!act || !id) return;

      let cart = loadCart();
      const item = cart.find(x=>x.id===id);
      if(!item) return;

      if(act==="plus") item.qty++;
      if(act==="minus") item.qty--;
      if(act==="remove") item.qty=0;

      cart = cart.filter(x=>x.qty>0);
      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  }

  renderCart();
  updateCartBadge();
}

/* ---------- Booking Page ---------- */
function initBookingPage(){
  // fill deals
  const dealSelect = $("dealSelect");
  if(dealSelect){
    dealSelect.innerHTML = `<option value="">Bez balíčku (60 min)</option>` + DEALS.map(d =>
      `<option value="${d.id}">${d.title} • ${money(d.price)} • ${d.durationMin} min (${d.type})</option>`
    ).join("");
  }

  // zone type options
  const zoneType = $("zoneType");
  if(zoneType){
    zoneType.innerHTML = `
      <option value="PC">PC</option>
      <option value="PS">PS</option>
      <option value="VR">VR</option>
    `;
  }

  function refreshZones(){
    const type = zoneType ? zoneType.value : "PC";
    const max = getZoneMax(type);
    const zoneNumber = $("zoneNumber");
    if(!zoneNumber) return;
    zoneNumber.innerHTML = Array.from({length:max}, (_,i)=> `<option value="${i+1}">${type} ${i+1}</option>`).join("");
  }

  if(zoneType) zoneType.addEventListener("change", refreshZones);
  refreshZones();

  // cart preview + controls
  renderCart();
  updateCartBadge();

  const cartList = $("cartList");
  if(cartList){
    cartList.addEventListener("click",(e)=>{
      const act = e.target.dataset.act;
      const id = e.target.dataset.id;
      if(!act || !id) return;

      let cart = loadCart();
      const item = cart.find(x=>x.id===id);
      if(!item) return;

      if(act==="plus") item.qty++;
      if(act==="minus") item.qty--;
      if(act==="remove") item.qty=0;

      cart = cart.filter(x=>x.qty>0);
      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  }

  const clearBtn = $("clearCartBtn");
  if(clearBtn){
    clearBtn.addEventListener("click",()=>{
      saveCart([]);
      renderCart();
      updateCartBadge();
    });
  }

  // submit booking
  const submitBtn = $("submitBookingBtn");
  if(submitBtn){
    submitBtn.addEventListener("click", ()=>{
      const name = $("nameInput")?.value?.trim();
      const email = $("emailInput")?.value?.trim();
      const note = $("notesInput")?.value?.trim() || "Jídlo připravíme a přineseme do zóny.";

      const type = $("zoneType")?.value || "PC";
      const number = Number($("zoneNumber")?.value || 1);

      const date = $("dateInput")?.value; // YYYY-MM-DD
      const time = $("timeInput")?.value; // HH:MM

      if(!name || !email){ toast("Vyplň jméno a email ❗"); return; }
      if(!date || !time){ toast("Vyber datum a čas ❗"); return; }

      const start = new Date(`${date}T${time}:00`);
      if(Number.isNaN(start.getTime())){ toast("Neplatný datum/čas ❗"); return; }

      // duration
      let durationMin = 60;
      let deal = null;
      const dealId = dealSelect ? dealSelect.value : "";
      if(dealId){
        deal = DEALS.find(d=> d.id===dealId) || null;
        durationMin = deal?.durationMin || 60;
        // optional: deal must match zone type
        if(deal && deal.type !== type){
          toast("Balíček nesedí s typem zóny (PC/PS/VR) ❗");
          return;
        }
      }

      const startISO = start.toISOString();

      if(!isSlotFree(type, number, startISO, durationMin)){
        toast("Tenhle čas je už obsazený. Zkus jiný čas nebo zónu ❌");
        return;
      }

      const cart = loadCart();
      const foodTotal = calcCartTotal(cart);

      const booking = {
        id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
        createdAtISO: new Date().toISOString(),
        status: "NEW",
        customer: { name, email },
        zoneType: type,
        zoneNumber: number,
        startISO,
        durationMin,
        deal: deal ? { id: deal.id, title: deal.title, price: deal.price } : null,
        order: {
          items: cart,
          foodTotal,
          notes: note
        }
      };

      const all = loadBookings();
      all.unshift(booking);
      saveBookings(all);

      // clear cart after booking
      saveCart([]);
      renderCart();
      updateCartBadge();

      toast(`Rezervace vytvořena ✅ ${type} ${number} • ${formatDT(startISO)}`);

      // reset inputs
      $("nameInput").value = "";
      $("emailInput").value = "";
      if($("notesInput")) $("notesInput").value = "Jídlo připravíme a přineseme do zóny.";
      if(dealSelect) dealSelect.value = "";
    });
  }
}

/* ---------- Admin Page ---------- */
function initAdminPage(){
  const tbody = $("adminBody");
  const list = loadBookings();

  if(!tbody) return;

  if(list.length === 0){
    tbody.innerHTML = `<tr><td colspan="6">Zatím žádné rezervace.</td></tr>`;
  } else {
    tbody.innerHTML = list.map(b=>{
      const items = (b.order?.items || []).map(i=> `${i.title} x${i.qty}`).join(", ");
      return `
        <tr>
          <td><b>${b.customer?.name || ""}</b><div class="small">${b.customer?.email || ""}</div></td>
          <td>${b.zoneType} ${b.zoneNumber}</td>
          <td>${formatDT(b.startISO)}<div class="small">${b.durationMin} min</div></td>
          <td>${b.deal ? `${b.deal.title} (${money(b.deal.price)})` : "—"}</td>
          <td>${money(b.order?.foodTotal || 0)}<div class="small">${items || "—"}</div><div class="small">${b.order?.notes || ""}</div></td>
          <td>${b.status}</td>
        </tr>
      `;
    }).join("");
  }

  const wipe = $("wipeBookingsBtn");
  if(wipe){
    wipe.addEventListener("click", ()=>{
      if(!confirm("Smazat všechny rezervace?")) return;
      saveBookings([]);
      toast("Smazáno ✅");
      setTimeout(()=> location.reload(), 400);
    });
  }
}

/* ---------- language-sensitive dynamic texts (optional) ---------- */
function refreshDynamicTexts(){
  // keeps cart badge correct in current language
  updateCartBadge();
}

/* ---------- Start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLanguage();
  setGamingFavicon();

  const page = document.body.dataset.page;
  if(page === "menu") initMenuPage();
  if(page === "booking") initBookingPage();
  if(page === "admin") initAdminPage();

  updateCartBadge();
});
