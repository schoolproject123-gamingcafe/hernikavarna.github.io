const CART_KEY = "hk_cart_v1";
const THEME_KEY = "hk_theme_v1";
const LANG_KEY  = "hk_lang_v1";

const I18N = {
  cs: { home:"Home", menu:"Menu", booking:"Rezervace", admin:"Admin", cart:"Košík", goBooking:"Přejít na rezervaci", clearCart:"Vyčistit košík", total:"Celkem:", cartEmpty:"Košík je prázdný." },
  en: { home:"Home", menu:"Menu", booking:"Booking",   admin:"Admin", cart:"Cart",  goBooking:"Go to booking",        clearCart:"Clear cart",        total:"Total:", cartEmpty:"Cart is empty." },
  uk: { home:"Головна", menu:"Меню", booking:"Бронювання", admin:"Адмін", cart:"Кошик", goBooking:"Перейти до бронювання", clearCart:"Очистити кошик", total:"Разом:", cartEmpty:"Кошик порожній." },
  vi: { home:"Trang chủ", menu:"Thực đơn", booking:"Đặt chỗ", admin:"Admin", cart:"Giỏ hàng", goBooking:"Tới đặt chỗ", clearCart:"Xoá giỏ", total:"Tổng:", cartEmpty:"Giỏ hàng trống." }
};

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

/* ---------- Favicon (gaming icon) ---------- */
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
        <button class="btn" data-add="${x.id}">${t("add") || "Přidat"}</button>
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

  // translate buttons on this page too
  applyI18n();
  renderCart();
  updateCartBadge();
}

/* ---------- Start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLanguage();
  setGamingFavicon();

  const page = document.body.dataset.page;
  if(page === "menu") initMenuPage();

  updateCartBadge();
});
