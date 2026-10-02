/* Site de pedidos do cliente: grava o pedido no banco e acompanha o status */
let state={tab:"menu",cat:"Todas",q:"",cart:store.get("cart",[]),orders:store.get("orders",[]),cupom:null};
function save(){store.set("cart",state.cart);store.set("orders",state.orders)}

/* ===================== CARDÁPIO ===================== */
function renderCats(){
  $("#cats").innerHTML=["Todas","Promoções",...CATS].map(c=>`<button aria-pressed="${state.cat===c}" data-cat="${c}">${c}</button>`).join("");
}
function promoCards(){
  return `<h2 class="sec">Promoções e combos</h2><div class="grid">${PROMOS.map(p=>{const on=promoAtiva(p);return `
    <article class="item"><div class="dot" style="background:var(--tomato)" aria-hidden="true">%</div><div class="info">
      <span class="tag">${p.dias?"Terça, quarta e quinta":"Todos os dias"}</span><h3>${p.nome}</h3><p>${p.desc}</p>
      <div class="row"><span class="price num">${brl(p.preco)}</span><button class="btn" data-promo="${p.id}" ${on?"":"disabled"}>${on?"Montar":"Volta na terça"}</button></div></div></article>`}).join("")}
    <article class="item"><div class="dot" style="background:var(--basil);color:var(--bg)" aria-hidden="true">R$</div><div class="info">
      <span class="tag">Em toda compra</span><h3>Dinheiro de volta</h3><p>${CASHBACK}% do valor dos itens vira saldo para usar no próximo pedido.</p>
      <div class="row"><span class="price num"><small>seu saldo</small>${brl(store.get("cashback",0))}</span></div></div></article></div>`;
}
function renderMenu(){
  const q=state.q.trim().toLowerCase();
  const html=((state.cat==="Todas"||state.cat==="Promoções")&&!q?promoCards():"")+CATS.filter(c=>state.cat==="Todas"||state.cat===c).map(c=>{
    const items=MENU.filter(m=>m.cat===c&&(!q||(m.nome+" "+m.desc).toLowerCase().includes(q)));
    if(!items.length) return "";
    return `<h2 class="sec">${c}</h2><div class="grid">${items.map(m=>`
      <article class="item">
        <div class="dot" style="background:${m.cor}" aria-hidden="true">${initials(m.nome)}</div>
        <div class="info">
          ${m.tag?`<span class="tag">${m.tag}</span>`:""}
          <h3>${esc(m.nome)}</h3>
          ${m.desc?`<p>${esc(m.desc)}</p>`:""}
          <div class="row">
            <span class="price num">${m.pizza?"<small>a partir de</small>"+brl(sizePrice(m.preco,SIZES[0].mult)):brl(m.preco)}</span>
            <button class="btn" data-add="${m.id}">${m.pizza?"Montar":"Adicionar"}</button>
          </div>
        </div>
      </article>`).join("")}</div>`;
  }).join("");
  $("#menuList").innerHTML=html||`<p class="empty">Nenhum item encontrado para “${esc(state.q)}”.</p>`;
}

/* ===================== MONTAR PIZZA ===================== */
function fixCombo(){ /* refrigerante grátis só acompanha pizza de combo */
  const n=state.cart.filter(c=>c.promo==="combo"&&c.k==="p").reduce((a,c)=>a+c.qtd,0),r=state.cart.filter(c=>c.promo==="combo"&&c.k==="b");
  let tot=r.reduce((a,c)=>a+c.qtd,0);
  for(const c of r.slice().reverse()){if(tot<=n)break;const cut=Math.min(c.qtd,tot-n);c.qtd-=cut;tot-=cut}
  state.cart=state.cart.filter(c=>c.qtd>0);
}
function openBuilder(id,promo){
  const pizzas=promo?promo.lista():MENU.filter(x=>x.pizza);
  if(promo)id=(pizzas.find(x=>x.id==="frango")||pizzas[0]).id;
  const m=promo?{nome:promo.nome,desc:promo.desc,pizza:true}:byId(id);
  if(!m.pizza){addToCart({tipo:"bebida",k:"b",ids:[id],id,nome:m.nome,det:"",unit:m.preco,qtd:1});toast(m.nome+" adicionado");return}
  let cfg={size:"grande",forma:"pizza",sabores:[id],massa:"media",borda:"sem",refri:REFRIS[0],qtd:1,obs:""};
  const rg=(name,list,cur,sub)=>`<div class="opts">${list.map(o=>`<div class="opt"><input type="radio" name="${name}" id="${name}-${o.id}" value="${o.id}" ${cur===o.id?"checked":""}><label for="${name}-${o.id}"><strong>${o.nome}</strong>${sub(o)}</label></div>`).join("")}</div>`;
  const draw=()=>{
    const old=document.querySelector("#modalRoot .sheet"),top=old?old.scrollTop:0;
    const size=SIZES.find(s=>s.id===cfg.size);
    cfg.sabores=cfg.sabores.slice(0,size.maxSabores);
    const cheio=pizzaPrice(cfg.size,cfg.sabores,cfg.borda,cfg.massa);
    const price=promo?promo.preco+cheio-sizePrice(Math.max(...cfg.sabores.map(i=>byId(i).preco)),size.mult):cheio;
    const eco=promo?cheio+(promo.refri?byId(cfg.refri).preco:0)-price:0;
    const saborSel=[];
    for(let i=0;i<size.maxSabores;i++){
      saborSel.push(`<label style="display:flex;flex-direction:column;gap:4px;font-size:.85rem;font-weight:600">${i===0?"1º sabor":(i+1)+"º sabor (opcional)"}
        <select id="sabor${i}" data-i="${i}">${i>0?`<option value="">Sem ${i+1}º sabor</option>`:""}
        ${pizzas.map(p=>`<option value="${p.id}" ${cfg.sabores[i]===p.id?"selected":""}>${p.nome}${promo?"":` (${brl(sizePrice(p.preco,size.mult))})`}</option>`).join("")}</select></label>`);
    }
    $("#modalRoot").innerHTML=`<div class="overlay" id="ov"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="bt">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px"><div><h3 id="bt">${esc(m.nome)}</h3><p style="margin:0;color:var(--muted)">${esc(m.desc)}</p></div><button class="x" id="closeM" aria-label="Fechar">×</button></div>
      ${promo?`<fieldset><legend>Tamanho</legend><p class="hint">Grande, 35 cm, 8 fatias. As promoções valem para a pizza grande.</p></fieldset>`
        :`<fieldset><legend>Tamanho · obrigatório</legend>${rg("size",SIZES,cfg.size,s=>`<small>${s.cm} cm · ${s.fatias} fatias</small><small>até ${s.maxSabores} sabor${s.maxSabores>1?"es":""}</small>`)}</fieldset>`}
      <fieldset><legend>Preparo · obrigatório</legend>${rg("forma",FORMAS,cfg.forma,()=>"")}</fieldset>
      <fieldset><legend>Sabores · ${size.maxSabores>1?`de 1 a ${size.maxSabores}${promo?"":", vale o de maior valor"}`:"1 sabor"}</legend><div style="display:grid;gap:8px">${saborSel.join("")}</div></fieldset>
      ${promo&&promo.refri?`<fieldset><legend>Refrigerante do combo · obrigatório</legend>${rg("refri",REFRIS.map(byId),cfg.refri,()=>`<small>incluso</small>`)}</fieldset>`:""}
      <fieldset><legend>Massa · obrigatório</legend>${rg("massa",MASSAS,cfg.massa,o=>`<small>${o.preco?"+ "+brl(o.preco):"sem acréscimo"}</small>`)}</fieldset>
      <fieldset><legend>Borda recheada · opcional</legend>${rg("borda",BORDAS,cfg.borda,b=>`<small>${b.preco?"+ "+brl(b.preco):"sem acréscimo"}</small>`)}</fieldset>
      <fieldset><legend>Alguma observação?</legend><textarea id="obs" rows="2" maxlength="100" placeholder="Ex.: sem cebola, bem assada">${esc(cfg.obs)}</textarea></fieldset>
      <p class="hint" style="margin:14px 0 0">${eco>0.05?`Você economiza ${brl(eco)} nesta promoção. `:""}Ganha ${brl(price*cfg.qtd*CASHBACK/100)} de cashback.</p>
      <div class="sheet-foot">
        <div class="qty"><button id="qm" aria-label="Diminuir">−</button><span class="num" id="qv">${cfg.qtd}</span><button id="qp" aria-label="Aumentar">+</button></div>
        <button class="btn" id="addP">Adicionar · <span class="num">${brl(price*cfg.qtd)}</span></button>
      </div></div></div>`;
    document.querySelector("#modalRoot .sheet").scrollTop=top;
    $("#ov").onclick=e=>{if(e.target.id==="ov")close()};
    $("#closeM").onclick=close;
    ["size","forma","massa","borda","refri"].forEach(n=>document.querySelectorAll(`input[name=${n}]`).forEach(r=>r.onchange=()=>{cfg[n]=r.value;draw()}));
    document.querySelectorAll('select[id^=sabor]').forEach(s=>s.onchange=()=>{
      const arr=[];document.querySelectorAll('select[id^=sabor]').forEach(x=>{if(x.value&&!arr.includes(x.value))arr.push(x.value)});
      cfg.sabores=arr.length?arr:[id];draw()});
    $("#obs").oninput=e=>cfg.obs=e.target.value;
    $("#qm").onclick=()=>{cfg.qtd=Math.max(1,cfg.qtd-1);draw()};
    $("#qp").onclick=()=>{cfg.qtd=Math.min(10,cfg.qtd+1);draw()};
    $("#addP").onclick=()=>{
      const s=SIZES.find(x=>x.id===cfg.size),b=BORDAS.find(x=>x.id===cfg.borda),f=FORMAS.find(x=>x.id===cfg.forma),ma=MASSAS.find(x=>x.id===cfg.massa);
      addToCart({tipo:"pizza",k:"p",ids:cfg.sabores.slice(),size:cfg.size,borda:cfg.borda,massa:cfg.massa,forma:cfg.forma,promo:promo?promo.id:undefined,
        nome:`${promo?promo.nome+" · ":""}${s.nome} · ${cfg.sabores.map(i=>byId(i).nome).join(" / ")}`,
        det:[cfg.forma!=="pizza"?f.nome:"",ma.nome,b.id!=="sem"?"Borda de "+b.nome.toLowerCase():"Sem borda",cfg.obs.trim()].filter(Boolean).join(" · "),
        unit:price,qtd:cfg.qtd});
      if(promo&&promo.refri)addToCart({tipo:"bebida",k:"b",ids:[cfg.refri],promo:"combo",nome:"Refrigerante do combo · "+byId(cfg.refri).nome,det:"",unit:0,qtd:cfg.qtd});
      close();toast(promo?promo.nome+" adicionado ao carrinho":"Pizza adicionada ao carrinho");
    };
  };
  const close=()=>{$("#modalRoot").innerHTML="";document.removeEventListener("keydown",esc1)};
  const esc1=e=>{if(e.key==="Escape")close()};
  document.addEventListener("keydown",esc1);
  draw();
}

/* ===================== CARRINHO ===================== */
function addToCart(item){
  const same=state.cart.find(c=>c.nome===item.nome&&c.det===item.det&&c.unit===item.unit);
  if(same) same.qtd+=item.qtd; else state.cart.push({...item,key:Date.now()+Math.random()});
  save();updateCount();
}
function updateCount(){$("#cartCount").textContent=state.cart.reduce((a,c)=>a+c.qtd,0)}
function totals(tipo,usarCash){
  const sub=state.cart.reduce((a,c)=>a+c.unit*c.qtd,0);
  let frete=tipo==="retirada"?0:TAXA_ENTREGA, desc=0;
  if(state.cupom){const c=CUPONS[state.cupom];if(c.tipo==="pct")desc=sub*c.valor/100;if(c.tipo==="frete")frete=0}
  const saldo=store.get("cashback",0),cash=usarCash?Math.min(saldo,Math.max(0,sub-desc)):0;
  return {sub,frete,desc,cash,saldo,ganha:Math.max(0,sub-desc-cash)*CASHBACK/100,total:Math.max(0,sub-desc-cash+frete)};
}

function openCart(step="cart"){
  let ck=Object.assign({tipo:"entrega",nome:"",tel:"",end:"",num:"",comp:"",pag:"Pix",troco:""},store.get("perfil",{}));
  const draw=()=>{
    fixCombo();save();updateCount();
    const t=totals(ck.tipo,ck.usarCash);
    let body="";
    if(step==="cart"){
      body=state.cart.length?state.cart.map(c=>`
        <div class="line"><div class="l-info"><strong>${esc(c.nome)}</strong>${c.det?`<span>${esc(c.det)}</span>`:""}
          <div class="qty" style="margin-top:6px"><button data-dec="${c.key}" aria-label="Diminuir">−</button><span class="num">${c.qtd}</span><button data-inc="${c.key}" aria-label="Aumentar">+</button></div></div>
          <div class="num price">${brl(c.unit*c.qtd)}</div></div>`).join("")
        +`<div style="margin-top:14px"><label for="cupom" style="font-size:.85rem;font-weight:600">Cupom</label>
          <div class="coupon"><input type="text" id="cupom" placeholder="PRIMEIRA10" value="${state.cupom||""}"><button class="btn ghost" id="apCupom">Aplicar</button></div>
          <div class="err" id="cupErr">${state.cupom?"✓ "+CUPONS[state.cupom].desc:""}</div></div>`
        :`<p class="empty">Seu carrinho está vazio.<br>Escolha uma pizza no cardápio.</p>`;
    } else {
      body=`<div class="form-grid">
        <div class="full opts" style="grid-template-columns:1fr 1fr">
          <div class="opt"><input type="radio" name="tipo" id="tp-e" value="entrega" ${ck.tipo==="entrega"?"checked":""}><label for="tp-e"><strong>Entrega</strong><small>40–55 min</small></label></div>
          <div class="opt"><input type="radio" name="tipo" id="tp-r" value="retirada" ${ck.tipo==="retirada"?"checked":""}><label for="tp-r"><strong>Retirar</strong><small>25 min · sem taxa</small></label></div>
        </div>
        <label>Nome<input type="text" id="f-nome" value="${esc(ck.nome)}" autocomplete="name"></label>
        <label>WhatsApp<input type="tel" id="f-tel" value="${esc(ck.tel)}" placeholder="(11) 90000-0000" autocomplete="tel"></label>
        ${ck.tipo==="entrega"?`
        <label class="full">Endereço<input type="text" id="f-end" value="${esc(ck.end)}" placeholder="Rua / avenida" autocomplete="street-address"></label>
        <label>Número<input type="text" id="f-num" value="${esc(ck.num)}"></label>
        <label>Complemento<input type="text" id="f-comp" value="${esc(ck.comp)}" placeholder="Apto, bloco"></label>`:""}
        <label class="full">Pagamento<select id="f-pag">${["Pix","Cartão na entrega","Dinheiro"].map(p=>`<option ${ck.pag===p?"selected":""}>${p}</option>`).join("")}</select></label>
        ${t.saldo>0?`<label class="full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="f-cash" ${ck.usarCash?"checked":""}> Usar meu saldo de cashback (${brl(t.saldo)})</label>`:""}
        ${ck.pag==="Dinheiro"?`<label class="full">Troco para quanto?<input type="number" id="f-troco" min="0" step="1" value="${esc(ck.troco)}" placeholder="Ex.: 100"></label>`:""}
      </div><div class="err" id="ckErr"></div>`;
    }
    const minOk=t.sub>=PEDIDO_MIN;
    $("#drawerRoot").innerHTML=`<div class="overlay" id="dov" style="background:rgba(20,12,10,.4)"></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dh">
        <div class="drawer-head"><h3 id="dh">${step==="cart"?"Seu carrinho":"Finalizar pedido"}</h3><button class="x" id="closeD" aria-label="Fechar">×</button></div>
        <div class="drawer-body">${body}</div>
        ${state.cart.length?`<div class="drawer-foot">
          <div class="sum num"><span>Subtotal</span><span>${brl(t.sub)}</span></div>
          ${t.desc?`<div class="sum num" style="color:var(--basil)"><span>Desconto</span><span>− ${brl(t.desc)}</span></div>`:""}
          ${t.cash?`<div class="sum num" style="color:var(--basil)"><span>Cashback usado</span><span>− ${brl(t.cash)}</span></div>`:""}
          <div class="sum num"><span>${ck.tipo==="retirada"?"Retirada":"Entrega"}</span><span>${t.frete?brl(t.frete):"Grátis"}</span></div>
          <div class="sum total num"><span>Total</span><span>${brl(t.total)}</span></div>
          <div class="hint">Você ganha ${brl(t.ganha)} de cashback neste pedido.</div>
          ${!minOk?`<div class="err">Pedido mínimo de ${brl(PEDIDO_MIN)}. Faltam ${brl(PEDIDO_MIN-t.sub)}.</div>`:""}
          ${step==="cart"?`<button class="btn" id="goCk" ${minOk?"":"disabled"}>Continuar</button>`
            :`<div style="display:flex;gap:8px"><button class="btn ghost" id="back">Voltar</button><button class="btn ok" id="place" style="flex:1" ${minOk?"":"disabled"}>Confirmar pedido · ${brl(t.total)}</button></div>`}
        </div>`:""}
      </aside>`;
    const close=()=>{$("#drawerRoot").innerHTML=""};
    $("#dov").onclick=close;$("#closeD").onclick=close;
    document.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{state.cart.find(c=>c.key==b.dataset.inc).qtd++;save();updateCount();draw()});
    document.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>{const c=state.cart.find(c=>c.key==b.dataset.dec);c.qtd--;if(c.qtd<=0)state.cart=state.cart.filter(x=>x!==c);save();updateCount();draw()});
    const ap=$("#apCupom");if(ap)ap.onclick=()=>{const v=$("#cupom").value.trim().toUpperCase();if(!v){state.cupom=null;draw();return}
      if(CUPONS[v]){state.cupom=v;draw()}else{$("#cupErr").textContent="Cupom não encontrado. Confira o código."}};
    const g=$("#goCk");if(g)g.onclick=()=>{step="checkout";draw()};
    const bk=$("#back");if(bk)bk.onclick=()=>{step="cart";draw()};
    const grab=()=>{["nome","tel","end","num","comp","troco"].forEach(k=>{const el=$("#f-"+k);if(el)ck[k]=el.value});const p=$("#f-pag");if(p)ck.pag=p.value;const cb=$("#f-cash");if(cb)ck.usarCash=cb.checked};
    const fc=$("#f-cash");if(fc)fc.onchange=()=>{grab();draw()};
    document.querySelectorAll("input[name=tipo]").forEach(r=>r.onchange=()=>{grab();ck.tipo=r.value;draw()});
    const fp=$("#f-pag");if(fp)fp.onchange=()=>{grab();draw()};
    const pl=$("#place");if(pl)pl.onclick=async()=>{
      grab();
      const errs=[];
      if(ck.nome.trim().length<2)errs.push("informe seu nome");
      if(ck.tel.replace(/\D/g,"").length<10)errs.push("informe um WhatsApp com DDD");
      if(ck.tipo==="entrega"&&(!ck.end.trim()||!ck.num.trim()))errs.push("preencha endereço e número");
      if(ck.pag==="Dinheiro"&&ck.troco&&Number(ck.troco)<t.total)errs.push("o troco precisa ser maior que o total");
      if(errs.length){$("#ckErr").textContent="Para continuar, "+errs.join(", ")+".";return}
      const itens=state.cart.map(c=>({nome:c.nome,det:c.det,qtd:c.qtd,unit:c.unit,k:c.k,ids:c.ids,size:c.size,borda:c.borda,massa:c.massa,forma:c.forma,promo:c.promo}));
      const end=ck.tipo==="entrega"?`${ck.end}, ${ck.num}${ck.comp?" – "+ck.comp:""}`:"";
      const pag=ck.pag+(ck.pag==="Dinheiro"&&ck.troco?` (troco p/ ${brl(Number(ck.troco))})`:"");
      if(!sb){$("#ckErr").textContent="Não foi possível conectar ao sistema de pedidos. Recarregue a página.";return}
      pl.disabled=true;pl.textContent="Enviando pedido…";
      const {data,error}=await sb.rpc("criar_pedido",{p:{cliente_nome:ck.nome.trim(),cliente_tel:ck.tel,tipo:ck.tipo,endereco:end,pagamento:pag,pag_tipo:ck.pag,
        frete:t.frete,desconto:Math.round((t.desc+t.cash)*100)/100,total:Math.round(t.total*100)/100,itens}});
      if(error||!data){
        pl.disabled=false;pl.textContent=`Confirmar pedido · ${brl(t.total)}`;
        $("#ckErr").textContent=error&&error.code==="22023"?error.message:"Não foi possível enviar o pedido. Confira a internet e tente de novo.";return}
      const id=data.numero;
      state.orders.unshift({id,token:data.token,criado:Date.now(),cliente:ck.nome.trim(),tel:ck.tel,tipo:ck.tipo,end,pag,status:0,cancelado:false,itens,total:t.total});
      state.orders=state.orders.slice(0,30);
      store.set("cashback",Math.round((t.saldo-t.cash+t.ganha)*100)/100);
      state.cart=[];state.cupom=null;save();updateCount();close();
      setTab("orders");toast(`Pedido #${id} recebido pela pizzaria. Você ganhou ${brl(t.ganha)} de cashback`);
    };
  };
  draw();
}

/* ===================== MEUS PEDIDOS ===================== */
function renderOrders(){
  const list=state.orders;
  $("#ordersList").innerHTML=list.length?list.map(o=>{
    const L=labels(o);
    return `<article class="order">
      <div class="order-head"><h3>Pedido #${o.id}</h3><span class="num" style="color:var(--muted)">${dm(o.criado)} ${fmtHora(o.criado)} · ${brl(o.total)}</span></div>
      ${o.cancelado?`<p class="err" style="margin:10px 0">Pedido cancelado pela pizzaria. Fale com a gente pelo WhatsApp.</p>`
        :`<div class="track">${L.map((s,i)=>`<div class="step ${i<o.status?"done":i===o.status?"now":""}"><div class="bar"></div><span>${s}</span></div>`).join("")}</div>`}
      <div style="font-size:.9rem">${o.tipo==="entrega"?"Entrega em "+esc(o.end):"Retirada no balcão"} · ${esc(o.pag)}</div>
      <ul>${o.itens.map(i=>`<li>${i.qtd}× ${esc(i.nome)}${i.det?" — "+esc(i.det):""}</li>`).join("")}</ul>
      ${!o.cancelado&&o.status<4?`<p style="margin:10px 0 0;font-size:.85rem;color:var(--muted)">A cozinha atualiza o status. Esta tela confere sozinha a cada 20 segundos.</p>`:""}
      <a class="wa" style="margin-top:12px" href="${waOrderLink(o)}" target="_blank" rel="noopener">Enviar pedido pelo WhatsApp</a>
    </article>`}).join(""):`<p class="empty">Você ainda não fez pedidos.</p>`;
}
function waOrderLink(o){
  const txt=[`*Pedido #${o.id} – Teste*`,...o.itens.map(i=>`${i.qtd}x ${i.nome}${i.det?" ("+i.det+")":""} – ${brl(i.unit*i.qtd)}`),
    `Total: ${brl(o.total)}`,`Cliente: ${o.cliente}${o.tel?" – "+o.tel:""}`,
    o.tipo==="entrega"?`Entrega: ${o.end}`:"Vou retirar no balcão",`Pagamento: ${o.pag}`].join("\n");
  return `https://wa.me/${WHATS}?text=${encodeURIComponent(txt)}`;
}
async function atualizarStatus(){
  const ab=state.orders.filter(o=>o.token&&!o.cancelado&&o.status<4).slice(0,15);
  if(!ab.length||!sb)return;
  const {data,error}=await sb.rpc("acompanhar_pedidos",{p_tokens:ab.map(o=>o.token)});
  if(error||!data)return;
  let mudou=false;
  for(const r of data){const o=state.orders.find(x=>x.token===r.token);
    if(o&&(o.status!==r.status||!!o.cancelado!==r.cancelado)){o.status=r.status;o.cancelado=r.cancelado;mudou=true}}
  if(mudou){save();if(state.tab==="orders")renderOrders()}
}
/* ===================== NAVEGAÇÃO ===================== */
function setTab(t){
  state.tab=t;
  document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t));
  ["menu","orders","perfil"].forEach(x=>$("#tab-"+x).hidden=x!==t);
  if(t==="menu")renderMenu();
  if(t==="perfil")$("#p-cash").textContent=brl(store.get("cashback",0));
  if(t==="orders"){renderOrders();atualizarStatus()}
}
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.tab)setTab(t.dataset.tab);
  if(t.dataset.jump){state.cat="Todas";renderCats();renderMenu();$("#cats").scrollIntoView({behavior:"smooth",block:"start"})}
  if(t.dataset.cat){state.cat=t.dataset.cat;renderCats();renderMenu()}
  if(t.dataset.add)openBuilder(t.dataset.add);
  if(t.dataset.promo)openBuilder(null,PROMOS.find(p=>p.id===t.dataset.promo));
});
$("#openCart").onclick=()=>openCart();
$("#search").oninput=e=>{state.q=e.target.value;renderMenu()};
(function(){const d=new Date(),m=d.getHours()*60+d.getMinutes(),open=m>=18*60&&m<23*60;
  const p=$("#openPill");if(!open){p.classList.remove("open");p.textContent="Fechado · abre às 18h (pedidos agendados)"}})();
(function(){
  const campos=["nome","tel","end","num","comp"],fill=()=>{const p=store.get("perfil",{});campos.forEach(k=>$("#p-"+k).value=p[k]||"")};
  fill();
  $("#perfilForm").onsubmit=e=>{e.preventDefault();const p={};campos.forEach(k=>p[k]=$("#p-"+k).value.trim());store.set("perfil",p);toast("Dados salvos")};
  $("#p-clear").onclick=()=>{try{localStorage.removeItem("suc4_perfil")}catch(e){}fill();toast("Dados apagados")};
})();
renderCats();renderMenu();updateCount();
setInterval(()=>{if(state.tab==="orders"&&!document.hidden)atualizarStatus()},20000);
