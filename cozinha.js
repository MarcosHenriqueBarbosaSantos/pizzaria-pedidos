/* Tela da cozinha: pedidos em tempo real, aviso sonoro e comanda para impressão */
const K={pedidos:[],vistos:new Set(),primeira:true,som:store.get("k_som",true),auto:store.get("k_auto",false),fmt:store.get("k_fmt","c80"),ctx:null,t:null};
function bip(){
  if(!K.som)return;
  try{K.ctx=K.ctx||new (window.AudioContext||window.webkitAudioContext)();const t=K.ctx.currentTime;
    [0,.25,.5].forEach(d=>{const o=K.ctx.createOscillator(),g=K.ctx.createGain();o.frequency.value=880;o.connect(g);g.connect(K.ctx.destination);
      g.gain.setValueAtTime(.25,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.2);o.start(t+d);o.stop(t+d+.2)})}catch(e){}
}
const nomeItem=i=>i.nome||((i.k==="o"||Array.isArray(i.ids))?itemName(i):"Item");
function comanda(o){
  const sub=o.itens.reduce((a,i)=>a+(+i.unit||0)*(+i.qtd||1),0);
  return `<h1>TESTE</h1>
    <div class="r"><span class="big">#${o.id}</span><span>${dm(o.criado)} ${fmtHora(o.criado)}</span></div>
    <div class="big">${o.tipo==="entrega"?"ENTREGA":"RETIRADA"}</div><hr>
    <div><b>${esc(o.cliente)}</b> · ${esc(o.tel)}</div>${o.tipo==="entrega"?`<div>${esc(o.end)}</div>`:""}<hr>
    ${o.itens.map(i=>`<div><b>${+i.qtd||1}x ${esc(nomeItem(i))}</b>${i.det?`<br>&nbsp;&nbsp;${esc(i.det)}`:""}</div>`).join("")}<hr>
    <div class="r"><span>Itens</span><span>${brl(sub)}</span></div>
    ${o.desc?`<div class="r"><span>Descontos</span><span>- ${brl(o.desc)}</span></div>`:""}
    ${o.frete?`<div class="r"><span>Entrega</span><span>${brl(o.frete)}</span></div>`:""}
    <div class="r big"><span>TOTAL</span><span>${brl(o.total)}</span></div>
    <div>Pagamento: ${esc(o.pag)}</div><hr><div style="text-align:center">Confira o total antes de cobrar</div>`;
}
function imprimir(o){const a=$("#printArea");a.className=K.fmt;a.innerHTML=comanda(o);window.print()}
function renderK(){
  const p=K.pedidos;
  $("#kpis").innerHTML=`
    <div class="kpi"><span>Na fila</span><b class="num">${p.filter(o=>o.status<=1).length}</b></div>
    <div class="kpi"><span>No forno</span><b class="num">${p.filter(o=>o.status===2).length}</b></div>
    <div class="kpi"><span>Saindo ou prontos</span><b class="num">${p.filter(o=>o.status===3).length}</b></div>`;
  $("#kitchenList").innerHTML=p.length?p.map(o=>{const L=labels(o);return `
    <article class="ticket s${o.status}${o.status===0?" novo":""}">
      <div style="display:flex;justify-content:space-between;gap:8px"><strong>#${o.id} · ${esc(o.cliente)}</strong><span class="num" style="color:var(--muted)">há ${minAgo(o.criado)} min</span></div>
      <span class="pill" style="align-self:flex-start">${L[o.status]}</span>
      <ul>${o.itens.map(i=>`<li><strong>${+i.qtd||1}×</strong> ${esc(nomeItem(i))}${i.det?`<br><small style="color:var(--muted)">${esc(i.det)}</small>`:""}</li>`).join("")}</ul>
      <small style="color:var(--muted)">${o.tipo==="entrega"?"Entrega: "+esc(o.end):"Retirada no balcão"}<br>${esc(o.tel)} · ${esc(o.pag)} · <b style="color:var(--fg)">${brl(o.total)}</b></small>
      <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
        <button class="btn ok" data-kadv="${o.uid}" style="flex:1">→ ${L[o.status+1]}</button>
        <button class="btn ghost" data-kprint="${o.uid}">Imprimir</button>
        ${o.status<=1?`<button class="btn ghost" data-kcancel="${o.uid}">Cancelar</button>`:""}
      </div>
    </article>`}).join(""):`<p class="empty">Nenhum pedido ativo. Os pedidos novos aparecem aqui sozinhos.</p>`;
}
async function carregarK(){
  const {data,error}=await sb.from("pedidos").select("*").eq("cancelado",false).lt("status",4).order("criado_em",{ascending:true}).limit(200);
  if(error){$("#kMsg").textContent="Sem conexão com o banco. Tentando de novo em instantes.";return}
  $("#kMsg").textContent="";
  const lista=data.map(rowToOrder),novos=lista.filter(o=>!K.vistos.has(o.uid)&&o.status===0);
  lista.forEach(o=>K.vistos.add(o.uid));K.pedidos=lista;renderK();
  if(!K.primeira&&novos.length){bip();if(K.auto)for(const o of novos)imprimir(o)}
  K.primeira=false;
}
(async function(){
  const u=await telaLogin($("#kLogin"),{titulo:"Tela da cozinha",precisaGestor:false});
  $("#kApp").hidden=false;$("#kQuem").textContent=u.email;
  $("#k-som").checked=K.som;$("#k-auto").checked=K.auto;$("#k-fmt").value=K.fmt;
  $("#k-som").onchange=e=>{K.som=e.target.checked;store.set("k_som",K.som);if(K.som)bip()};
  $("#k-auto").onchange=e=>{K.auto=e.target.checked;store.set("k_auto",K.auto)};
  $("#k-fmt").onchange=e=>{K.fmt=e.target.value;store.set("k_fmt",K.fmt)};
  $("#kSair").onclick=sair;
  document.addEventListener("click",async e=>{
    const b=e.target.closest("button");if(!b)return;
    const achar=id=>K.pedidos.find(o=>o.uid===id);
    if(b.dataset.kprint){const o=achar(b.dataset.kprint);if(o)imprimir(o)}
    if(b.dataset.kadv){const o=achar(b.dataset.kadv);if(!o)return;b.disabled=true;
      const {error}=await sb.from("pedidos").update({status:Math.min(4,o.status+1)}).eq("id",o.uid);
      if(error){toast("Não foi possível atualizar. Tente de novo.");b.disabled=false;return}
      toast(`#${o.id}: ${labels(o)[Math.min(4,o.status+1)]}`);carregarK()}
    if(b.dataset.kcancel){
      if(!b.dataset.sure){b.dataset.sure="1";b.textContent="Confirmar cancelamento";return}
      const o=achar(b.dataset.kcancel);if(!o)return;
      const {error}=await sb.from("pedidos").update({cancelado:true}).eq("id",o.uid);
      if(error){toast("Não foi possível cancelar. Tente de novo.");return}
      toast(`Pedido #${o.id} cancelado`);carregarK()}
  });
  await carregarK();
  sb.channel("cozinha").on("postgres_changes",{event:"*",schema:"public",table:"pedidos"},()=>{clearTimeout(K.t);K.t=setTimeout(carregarK,300)}).subscribe();
  setInterval(carregarK,30000); /* reserva caso o tempo real caia; também atualiza o "há X min" */
})();
