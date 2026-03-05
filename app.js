const CART_KEY = "hk_cart_v1";

function $(id){
  return document.getElementById(id);
}

function loadCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  }catch{
    return [];
  }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(n){
  return n + " Kč";
}

function calcCartTotal(cart){
  return cart.reduce((s,x)=> s + x.price*x.qty,0);
}

function updateCartBadge(){
  const badge = document.querySelector("[data-cart-badge]");
  if(!badge) return;

  const cart = loadCart();
  const count = cart.reduce((s,x)=> s + x.qty,0);

  badge.textContent = "Košík: " + count;
}

function renderCart(){
  const cartList = $("cartList");
  const cartTotal = $("cartTotal");

  if(!cartList || !cartTotal) return;

  const cart = loadCart();

  if(cart.length === 0){
    cartList.innerHTML = `<div class="small">Košík je prázdný.</div>`;
    cartTotal.textContent = "0 Kč";
    return;
  }

  cartList.innerHTML = cart.map(it => `
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

  cartTotal.textContent = money(calcCartTotal(cart));
}

function initMenuPage(){

  const menuItems = [
    {id:"ramen",title:"Tonkotsu Ramen",price:159},
    {id:"pizza",title:"Mini Pizza",price:89},
    {id:"burger",title:"Juicy Burger",price:169},
    {id:"fries",title:"Loaded Fries",price:119},
    {id:"nachos",title:"Nachos",price:99},
    {id:"cola",title:"Cola",price:39}
  ];

  const list = $("menuList");

  if(list){
    list.innerHTML = menuItems.map(x=>`
      <div class="item">
        <div>
          <div class="title">${x.title}</div>
        </div>
        <div class="row">
          <div class="price">${money(x.price)}</div>
          <button class="btn" data-add="${x.id}">Přidat</button>
        </div>
      </div>
    `).join("");

    list.addEventListener("click",(e)=>{
      const id = e.target.dataset.add;
      if(!id) return;

      const item = menuItems.find(x=>x.id===id);

      let cart = loadCart();

      const found = cart.find(x=>x.id===id);

      if(found){
        found.qty++;
      }else{
        cart.push({
          id:item.id,
          title:item.title,
          price:item.price,
          qty:1
        });
      }

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

document.addEventListener("DOMContentLoaded",()=>{

  const page = document.body.dataset.page;

  if(page==="menu"){
    initMenuPage();
  }

  updateCartBadge();
});
