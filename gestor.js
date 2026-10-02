/* ===================== ÁREA DO GESTOR ===================== */
/* Custos de exemplo: troque pelos valores reais em "Custos e ficha técnica" */
const CUSTOS_PADRAO={
  sabor:Object.fromEntries(MENU.map(m=>[m.id,Math.round(m.preco*m.c*10)/10])),
  borda:{sem:0,catupiry:4.5,cheddar:4.5,chocolate:5,creamcheese:5.5,mussarela:5,provolone:6,vulcao:7},embalagem:2.9,motoboy:6,cartao:3.2,ifood:23,cashback:CASHBACK,
  fixos:[["Aluguel",5500],["Salários e encargos",16000],["Luz, gás e água",2800],["Internet e sistemas",350],["Contador",600],["Promoções e brindes",800],["Outros",1450]]};
function mergeCustos(x){const d=JSON.parse(JSON.stringify(CUSTOS_PADRAO));if(!x)return d;
  return Object.assign(d,x,{sabor:Object.assign(d.sabor,x.sabor||{}),borda:Object.assign(d.borda,x.borda||{})})}
function salvarCustos(){sb.from("config").upsert({chave:"custos",valor:G.custos,atualizado_em:new Date().toISOString()}).then(({error})=>{if(error)toast("Não foi possível salvar os custos. Tente de novo.")})}
const G={unlocked:false,fonte:null,dias:30,gran:"dia",metrica:"pizzas",
  custos:mergeCustos(null),allFl:false,pedidos:[],email:"",draft:[],_ex:null,_t:null};
const state={tab:"gestor"};
/* ---------- fontes de dados ---------- */
function realSales(){return G.pedidos}
const itemOk=i=>i&&["p","b","o"].includes(i.k)&&Number.isFinite(+i.qtd)&&Number.isFinite(+i.unit)&&(i.k==="o"||(Array.isArray(i.ids)&&i.ids.length>0));
async function carregarPedidos(aviso){
  const desde=new Date(Date.now()-400*DAY).toISOString();let todos=[],de=0;
  for(;;){
    const {data,error}=await sb.from("pedidos").select("numero,criado_em,canal,tipo,pagamento,pag_tipo,frete,desconto,total,itens,origem_id").eq("cancelado",false).gte("criado_em",desde).order("criado_em",{ascending:true}).range(de,de+999);
    if(error){toast("Não foi possível ler os pedidos. Confira a internet.");return}
    todos=todos.concat(data);if(data.length<1000)break;de+=1000;
  }
  G.pedidos=todos.map(r=>({id:r.origem_id||"p"+r.numero,ts:Date.parse(r.criado_em),canal:r.canal,tipo:r.tipo,pag:r.pag_tipo||r.pagamento,frete:+r.frete||0,desc:+r.desconto||0,total:+r.total||0,
    itens:(Array.isArray(r.itens)?r.itens:[]).filter(itemOk).map(i=>({...i,qtd:+i.qtd,unit:+i.unit}))}));
  if($("#gDash"))renderDash();
  if(aviso)toast("Dados atualizados");
}
/* Vendas de exemplo geradas por sorteio fixo (sempre as mesmas no mesmo dia) */
function exampleSales(){
  const key=new Date().toDateString();if(G._ex&&G._ex.key===key)return G._ex.list;
  let s=20260807;
  const rnd=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const pick=arr=>{let tot=0;for(const a of arr)tot+=a[1];let r=rnd()*tot;for(const a of arr){r-=a[1];if(r<=0)return a[0]}return arr[arr.length-1][0]};
  const now=Date.now(),t0=new Date(sod(now)),start=new Date(t0.getFullYear(),t0.getMonth()-4,1);
  const total=Math.max(1,Math.round((t0-start)/DAY)),base=[27,10,11,13,15,30,38];
  const sab=MENU.filter(m=>m.pizza).map(m=>[m.id,m.w]),beb=MENU.filter(m=>!m.pizza).map(m=>[m.id,m.w]);
  const tam=[["broto",8],["media",22],["grande",52],["gigante",18]];
  const list=[];let n=0;
  for(let d=new Date(start);d<=t0;d.setDate(d.getDate()+1)){
    const i=Math.round((d-start)/DAY),q=Math.round(base[d.getDay()]*(0.86+0.2*i/total)*(0.82+rnd()*0.36));
    for(let k=0;k<q;k++){
      const h=pick([[18,5],[19,22],[20,32],[21,26],[22,15]]);
      const ts=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,Math.floor(rnd()*60)).getTime();
      const canal=pick([["iFood",38],["WhatsApp",34],["App",18],["Balcão",10]]);
      const tipo=canal==="Balcão"?"retirada":(rnd()<0.86?"entrega":"retirada");
      const pag=canal==="iFood"?"iFood (online)":pick([["Pix",45],["Cartão",35],["Dinheiro",20]]);
      const itens=[],np=pick([[1,68],[2,27],[3,5]]);
      for(let p=0;p<np;p++){
        const size=pick(tam),ids=[pick(sab)];
        const mx=sizeOf(size).maxSabores;
        if(mx>1&&rnd()<0.38){const b=pick(sab);if(b!==ids[0])ids.push(b);if(mx>2&&rnd()<0.18){const c3=pick(sab);if(!ids.includes(c3))ids.push(c3)}}
        const massa=pick([["fina",30],["media",55],["grossa",15]]);
        const borda=rnd()<0.3?pick([["catupiry",46],["cheddar",18],["chocolate",8],["creamcheese",8],["mussarela",6],["provolone",4],["vulcao",10]]):"sem";
        let unit=pizzaPrice(size,ids,borda,massa),promo;
        if(size==="grande"&&ids.every(x=>byId(x).cat==="Tradicionais")){
          const extra=unit-sizePrice(Math.max(...ids.map(x=>byId(x).preco)),1),wd=d.getDay();
          if(wd>=2&&wd<=4&&rnd()<0.4){promo="terca";unit=68.9+extra}
          else if(ids.every(x=>byId(x).preco>=76.9)&&rnd()<0.3){promo="combo";unit=89.9+extra}
        }
        itens.push({k:"p",ids,size,borda,massa,qtd:1,unit,promo});
        if(promo==="combo")itens.push({k:"b",ids:[pick(REFRIS.map(r=>[r,byId(r).w]))],qtd:1,unit:0,promo:"combo"});
      }
      if(rnd()<0.45){const b=pick(beb);itens.push({k:"b",ids:[b],qtd:1,unit:byId(b).preco})}
      const frete=tipo==="entrega"?TAXA_ENTREGA:0,sub=itens.reduce((a,x)=>a+x.unit*x.qtd,0);
      if(ts<=now)list.push({id:"ex"+(n++),ts,canal,tipo,pag,frete,desc:0,total:sub+frete,itens});
    }
  }
  G._ex={key,list};return list;
}
const gSales=()=>G.fonte==="exemplo"?exampleSales():realSales();

/* ---------- contas ---------- */
function avgPizzaCost(c){const ids=MENU.filter(m=>m.pizza).map(m=>m.id);return ids.reduce((a,i)=>a+(+c.sabor[i]||0),0)/ids.length}
function pizzaCost(it,c,id,avg){return ((c.sabor[id]??avg)*sizeOf(it.size).mult+(+c.borda[it.borda]||0)+(+c.embalagem||0))}
function saleCost(s,c,avg){
  let cmv=0;
  for(const it of s.itens){
    if(it.k==="p")cmv+=it.ids.reduce((a,id)=>a+pizzaCost(it,c,id,avg),0)/it.ids.length*it.qtd;
    else if(it.k==="b")cmv+=(+c.sabor[it.ids[0]]||0)*it.qtd;
    else cmv+=it.unit*it.qtd*0.35;
  }
  return {cmv,motoboy:s.tipo==="entrega"?+c.motoboy||0:0,ifood:s.canal==="iFood"?s.total*(+c.ifood||0)/100:0,cartao:/^Cart/.test(s.pag)?s.total*(+c.cartao||0)/100:0,cash:s.canal==="App"?Math.max(0,s.total-s.frete)*(+c.cashback||0)/100:0};
}
function metrics(sales,from,to,c,first){
  const m={pedidos:0,pizzas:0,fat:0,cmv:0,motoboy:0,ifood:0,cartao:0,cash:0},avg=avgPizzaCost(c);
  for(const s of sales){
    if(s.ts<from||s.ts>to)continue;
    const k=saleCost(s,c,avg);m.pedidos++;m.pizzas+=pizzasDe(s);m.fat+=s.total;m.cmv+=k.cmv;m.motoboy+=k.motoboy;m.ifood+=k.ifood;m.cartao+=k.cartao;m.cash+=k.cash;
  }
  m.variaveis=m.cmv+m.motoboy+m.ifood+m.cartao+m.cash;m.mc=m.fat-m.variaveis;
  m.fixosMes=c.fixos.reduce((a,f)=>a+(+f[1]||0),0);
  const ini=Math.max(from,sod(first??from));
  m.dias=Math.max(1,Math.round((sod(to)-ini)/DAY)+1);
  m.fixos=m.fixosMes*m.dias/30;m.lucro=m.mc-m.fixos;
  m.ticket=m.pedidos?m.fat/m.pedidos:0;m.porDia=m.pizzas/m.dias;m.ritmo=m.porDia*30;
  m.mcPizza=m.pizzas?m.mc/m.pizzas:0;m.pe=m.mcPizza>0?m.fixosMes/m.mcPizza:Infinity;
  return m;
}
/* Período = últimos N dias completos (até ontem). Sem vendas antes de hoje, usa o dia de hoje. */
function periodo(sales){
  const now=Date.now(),t0=sod(now),first=sales.reduce((a,s)=>Math.min(a,s.ts),Infinity);
  const to=first<t0?t0-1:now,from=addDays(sod(to),-(G.dias-1));
  return {now,t0,first,from,to,pFrom:addDays(from,-G.dias),pTo:from-1};
}

/* ---------- painel ---------- */
function seg(name,opts,cur){return `<div class="seg" role="group">${opts.map(o=>`<button type="button" data-g="${name}" data-v="${o[0]}" aria-pressed="${String(o[0])===String(cur)}">${o[1]}</button>`).join("")}</div>`}
function renderGestor(){
  if(!G.fonte)G.fonte=store.get("fonte",null)||(realSales().length?"reais":"exemplo");
  $("#gestorBody").innerHTML=`
    <div class="g-head"><h2 class="sec" style="margin-top:6px">Vendas e pedidos</h2><div class="row-btns"><button class="btn ghost" id="gReload">Atualizar</button><button class="btn ghost" id="gLock">Sair</button></div></div>
    <div class="g-filters">
      <div><span class="g-lab">Dados</span><span id="segFonte"></span></div>
      <div><span class="g-lab">Período</span><span id="segDias"></span></div>
    </div>
    <div class="g-note" id="gNote">Estes são <strong>dados de exemplo</strong>, gerados para demonstração. Troque para “Reais” para ver os pedidos feitos no site e as vendas lançadas aqui.</div>
    <div id="gDash"></div>
    <details class="g" id="detCustos"><summary>Custos e ficha técnica</summary><div class="body" id="gCustos"></div></details>
    <details class="g" id="detVenda"><summary>Lançar venda, importar e exportar</summary><div class="body" id="gVenda"></div></details>`;
  renderCustos();renderVenda();renderDash();
  $("#gLock").onclick=sair;$("#gReload").onclick=()=>carregarPedidos(true);
}
function delta(cur,prev,ok){
  if(!ok||!prev)return `<span class="delta flat">sem período anterior</span>`;
  const p=(cur-prev)/Math.abs(prev)*100;
  if(Math.abs(p)<0.5)return `<span class="delta flat">igual aos ${G.dias} dias anteriores</span>`;
  return `<span class="delta ${p>0?"up":"down"}">${p>0?"▲ +":"▼ −"}${Math.abs(p).toFixed(0)}% vs ${G.dias} dias anteriores</span>`;
}
function renderDash(){
  $("#segFonte").innerHTML=seg("fonte",[["exemplo","Exemplo"],["reais","Reais"]],G.fonte);
  $("#segDias").innerHTML=seg("dias",[[7,"7 dias"],[30,"30 dias"],[90,"90 dias"]],G.dias);
  $("#gNote").hidden=G.fonte!=="exemplo";
  const sales=gSales(),el=$("#gDash"),c=G.custos;
  if(!sales.length){el.innerHTML=`<div class="panel"><p class="empty">Ainda não há pedidos reais no banco.<br>Os pedidos feitos no site aparecem aqui sozinhos. Você também pode lançar uma venda ou importar um CSV logo abaixo.</p></div>`;return}
  const P=periodo(sales),m=metrics(sales,P.from,P.to,c,P.first),p=metrics(sales,P.pFrom,P.pTo,c,P.first);
  if(!m.pedidos){el.innerHTML=`<div class="panel"><p class="empty">Nenhuma venda entre ${dm(P.from)} e ${dm(P.to)}.<br>Escolha um período maior ou lance as vendas logo abaixo.</p></div>`;return}
  const cmp=p.pedidos>0&&P.first<P.pFrom+DAY;
  const hoje=sales.filter(s=>s.ts>=P.t0),hp=hoje.reduce((a,s)=>a+pizzasDe(s),0),hf=hoje.reduce((a,s)=>a+s.total,0);
  const inP=sales.filter(s=>s.ts>=P.from&&s.ts<=P.to);
  const ok=m.lucro>=0,scale=Math.max(m.ritmo,isFinite(m.pe)?m.pe:0)*1.15||1;
  const pePct=isFinite(m.pe)?Math.min(100,m.pe/scale*100):100;
  const margem=m.fat?m.lucro/m.fat*100:0,pouco=m.dias<7||m.pedidos<20;

  /* sabores */
  const avg=avgPizzaCost(c),fl={};
  for(const s of inP)for(const it of s.itens)if(it.k==="p")for(const id of it.ids){
    const f=fl[id]||(fl[id]={q:0,rev:0,cost:0}),sh=it.qtd/it.ids.length;
    f.q+=sh;f.rev+=it.unit*sh;f.cost+=pizzaCost(it,c,id,avg)*sh;
  }
  const flv=Object.entries(fl).sort((a,b)=>b[1].q-a[1].q),fmax=flv.length?flv[0][1].q:1;
  /* promoções: quanto cada uma vende e quanto sobra por pizza, contra a pizza sem promoção */
  const pr={};
  for(const s of inP)for(const it of s.itens){
    const b=pr[it.promo||"sem"]||(pr[it.promo||"sem"]={q:0,rev:0,cost:0});
    if(it.k==="p"){b.q+=it.qtd;b.rev+=it.unit*it.qtd;b.cost+=it.ids.reduce((a,id)=>a+pizzaCost(it,c,id,avg),0)/it.ids.length*it.qtd}
    else if(it.promo&&it.k==="b")b.cost+=(+c.sabor[it.ids[0]]||0)*it.qtd;
  }
  const prL=[["sem","Sem promoção"]].concat(PROMOS.map(x=>[x.id,x.nome])).filter(x=>pr[x[0]]&&pr[x[0]].q>0);
  /* canais, tamanhos */
  const can={},tam={};
  for(const s of inP){const k=can[s.canal]||(can[s.canal]={n:0,fat:0});k.n++;k.fat+=s.total;
    for(const it of s.itens)if(it.k==="p")tam[it.size]=(tam[it.size]||0)+it.qtd}
  const canL=Object.entries(can).sort((a,b)=>b[1].fat-a[1].fat),cmax=canL.length?canL[0][1].fat:1;
  const tamL=SIZES.map(z=>[z.nome,tam[z.id]||0]),tmax=Math.max(1,...tamL.map(t=>t[1]));
  /* mapa de calor: média de pizzas por dia da semana e hora */
  const grid=Array.from({length:7},()=>[0,0,0,0,0]),occ=[0,0,0,0,0,0,0];
  for(let d=Math.max(P.from,sod(P.first));d<=P.to;d=addDays(d,1))occ[new Date(d).getDay()]++;
  for(const s of inP){const d=new Date(s.ts);grid[d.getDay()][Math.min(22,Math.max(18,d.getHours()))-18]+=pizzasDe(s)}
  let hmax=0;const ordem=[1,2,3,4,5,6,0],nomes=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const med=ordem.map(w=>grid[w].map(v=>{const x=occ[w]?v/occ[w]:0;hmax=Math.max(hmax,x);return x}));
  const cell=v=>`<div class="c s${v<=0?1:Math.max(1,Math.ceil(v/hmax*5))}" title="${v.toFixed(1)} pizzas em média">${v>=10?v.toFixed(0):v.toFixed(1).replace(".",",")}</div>`;
  const pct=v=>m.fat?(v/m.fat*100).toFixed(0)+"%":"–";
  const dre=(l,v,cls)=>`<tr class="${cls||""}"><td>${l}</td><td>${brl0(v).replace("-","−")}</td><td>${pct(cls?v:Math.abs(v)).replace("-","−")}</td></tr>`;

  el.innerHTML=`
    <div class="today"><span>Hoje até agora: <b>${pl(hp,"pizza","pizzas")}</b></span><span><b>${pl(hoje.length,"pedido","pedidos")}</b></span><span><b>${brl0(hf)}</b> em vendas</span></div>
    <div class="verdict">
      <h3>${pouco?"Ainda é cedo para dizer se vale a pena":ok?"As vendas estão pagando as contas":"As vendas não estão pagando as contas"} <span class="vb ${pouco?"neu":ok?"ok":"bad"}">${pouco?"Poucos dados":ok?"✓ Com lucro":"⚠ No prejuízo"}</span></h3>
      <p>${pouco?`Há só ${pl(m.dias,"dia","dias")} de vendas registradas. Com pelo menos 7 dias e 20 pedidos a conta fica confiável. `:""}De ${dm(Math.max(P.from,sod(P.first)))} a ${dm(P.to)} saíram <strong>${pl(m.pizzas,"pizza","pizzas")}</strong>, cerca de ${m.porDia.toFixed(1).replace(".",",")} por dia. ${isFinite(m.pe)?`Para pagar todos os custos fixos são necessárias <strong>${int(m.pe)} pizzas por mês</strong> (${int(Math.ceil(m.pe/30))} por dia).`:"Cada pizza está saindo por menos do que custa, então nenhum volume paga os custos fixos."} Cada pizza vendida deixa em média ${brl(m.mcPizza)} depois dos custos dela.</p>
      <div class="meter ${pouco||m.ritmo>=m.pe?"":"bad"}"><i style="width:${Math.min(100,m.ritmo/scale*100)}%"></i>${isFinite(m.pe)?`<b style="left:${pePct}%"></b><span style="left:${Math.min(88,Math.max(12,pePct))}%">Ponto de equilíbrio: ${int(m.pe)}</span>`:""}</div>
      <div class="meter-lab"><span>Ritmo atual: <strong style="color:var(--fg)">${int(m.ritmo)} pizzas por mês</strong></span><span>${isFinite(m.pe)?(m.ritmo>=m.pe?`${int(m.ritmo-m.pe)} pizzas acima do necessário`:`Faltam ${int(m.pe-m.ritmo)} pizzas por mês`):""}</span></div>
    </div>
    <div class="tiles">
      <div class="tile big"><span>Pizzas vendidas</span><b>${int(m.pizzas)}</b>${delta(m.pizzas,p.pizzas,cmp)}</div>
      <div class="tile"><span>Pizzas por dia (média)</span><b>${m.porDia.toFixed(1).replace(".",",")}</b><span>${pl(m.pedidos,"pedido","pedidos")} no período</span></div>
      <div class="tile"><span>Faturamento</span><b>${brl0(m.fat)}</b>${delta(m.fat,p.fat,cmp)}</div>
      <div class="tile"><span>Ticket médio por pedido</span><b>${brl(m.ticket)}</b>${delta(m.ticket,p.ticket,cmp)}</div>
      <div class="tile"><span>Lucro estimado</span><b>${brl0(m.lucro).replace("-","−")}</b><span>${pouco?"ainda sem base suficiente":"margem de "+margem.toFixed(0)+"%"}</span>${delta(m.lucro,p.lucro,cmp)}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h3 id="chTitle"></h3><p class="sub" id="chSub"></p></div>
        <div class="segs">${seg("metrica",[["pizzas","Pizzas"],["fat","Faturamento"]],G.metrica)}${seg("gran",[["dia","Dia"],["semana","Semana"],["mes","Mês"]],G.gran)}</div></div>
      <div class="chart" id="gChart"></div>
    </div>
    <div class="cols2">
      <div class="panel"><h3>Para onde vai o dinheiro</h3><p class="sub">Resultado estimado do período, com os custos cadastrados</p>
        <div class="tbl-wrap"><table class="g"><thead><tr><th>Linha</th><th>Valor</th><th>% das vendas</th></tr></thead><tbody>
          ${dre("Faturamento",m.fat,"subt")}${dre("− Ingredientes e embalagem",-m.cmv)}${dre("− Motoboy",-m.motoboy)}${dre("− Comissão do iFood",-m.ifood)}${dre("− Taxa de cartão",-m.cartao)}${dre("− Cashback dado no app",-m.cash)}
          ${dre("= Sobra para as contas fixas",m.mc,"subt")}${dre(`− Custos fixos (${pl(m.dias,"dia","dias")})`,-m.fixos)}${dre("= Lucro estimado",m.lucro,"res")}
        </tbody></table></div></div>
      <div class="panel"><h3>Dias e horários de pico</h3><p class="sub">Média de pizzas por hora em cada dia da semana</p>
        <div class="heat"><div></div>${[18,19,20,21,22].map(h=>`<div class="hh">${h}h</div>`).join("")}
          ${ordem.map((w,i)=>`<div class="hd">${nomes[w]}</div>${med[i].map(cell).join("")}`).join("")}</div>
        <div class="heat-key">menos <i style="background:var(--h1)"></i><i style="background:var(--h2)"></i><i style="background:var(--h3)"></i><i style="background:var(--h4)"></i><i style="background:var(--h5)"></i> mais</div></div>
    </div>
    <div class="panel"><h3>Sabores: o que mais sai e o que mais sobra</h3><p class="sub">Pizza meio a meio conta metade para cada sabor</p>
      <div class="tbl-wrap"><table class="g"><thead><tr><th>Sabor</th><th>Pizzas</th><th>Receita</th><th>Sobra por pizza</th><th>Margem</th></tr></thead><tbody>
      ${(G.allFl?flv:flv.slice(0,15)).map(([id,f])=>`<tr><td>${esc((byId(id)||{nome:id}).nome)}<span class="ibar" style="width:${Math.max(2,f.q/fmax*90)}px"></span></td><td>${int(f.q)}</td><td>${brl0(f.rev)}</td><td>${brl((f.rev-f.cost)/f.q)}</td><td>${((f.rev-f.cost)/f.rev*100).toFixed(0)}%</td></tr>`).join("")||`<tr><td colspan="5">Nenhuma pizza no período.</td></tr>`}
      </tbody></table></div>${flv.length>15?`<div class="row-btns" style="margin-top:10px"><button class="btn ghost" type="button" data-g="allFl" data-v="${G.allFl?"":"1"}">${G.allFl?"Mostrar só os 15 mais vendidos":`Ver todos os ${flv.length} sabores`}</button></div>`:""}</div>
    <div class="panel"><h3>Promoções e combos</h3><p class="sub">Quanto cada promoção vende e quanto sobra por pizza, comparado com a pizza sem promoção. No combo, o custo do refrigerante já está descontado.</p>
      <div class="tbl-wrap"><table class="g"><thead><tr><th>Tipo de venda</th><th>Pizzas</th><th>% das pizzas</th><th>Receita</th><th>Sobra por pizza</th></tr></thead><tbody>
      ${prL.map(([id,n])=>{const b=pr[id];return `<tr><td>${n}</td><td>${int(b.q)}</td><td>${(b.q/m.pizzas*100).toFixed(0)}%</td><td>${brl0(b.rev)}</td><td>${brl((b.rev-b.cost)/b.q)}</td></tr>`}).join("")}
      </tbody></table></div></div>
    <div class="cols2">
      <div class="panel"><h3>De onde vêm os pedidos</h3><p class="sub">Faturamento por canal de venda</p>
        <div class="blist">${canL.map(([n,v])=>`<span>${esc(n)}</span><span class="trk"><i style="width:${v.fat/cmax*100}%"></i></span><span class="v">${brl0(v.fat)} · ${pl(v.n,"pedido","pedidos")}</span>`).join("")}</div></div>
      <div class="panel"><h3>Tamanhos que mais saem</h3><p class="sub">Quantidade de pizzas por tamanho</p>
        <div class="blist">${tamL.map(([n,v])=>`<span>${n}</span><span class="trk"><i style="width:${v/tmax*100}%"></i></span><span class="v">${pl(v,"pizza","pizzas")}</span>`).join("")}</div></div>
    </div>
    <div class="panel"><h3>Últimos pedidos</h3><p class="sub">Os 8 mais recentes, de todos os canais</p>
      <div class="tbl-wrap"><table class="g"><thead><tr><th>Quando</th><th class="l">Canal</th><th class="l">Itens</th><th class="l">Pagamento</th><th>Total</th></tr></thead><tbody>
      ${sales.slice().sort((a,b)=>b.ts-a.ts).slice(0,8).map(s=>`<tr><td>${dm(s.ts)} ${fmtHora(s.ts)}</td><td class="l">${esc(s.canal)} · ${s.tipo}</td><td class="l wrap">${s.itens.map(i=>i.qtd+"× "+esc(itemName(i))).join("; ")}</td><td class="l">${esc(s.pag)}</td><td>${brl(s.total)}</td></tr>`).join("")}
      </tbody></table></div></div>`;
  drawChart(sales);
}

/* ---------- gráfico de vendas por dia, semana ou mês ---------- */
function chartBuckets(sales){
  const now=Date.now(),t0=sod(now),val=s=>G.metrica==="pizzas"?pizzasDe(s):s.total;
  const keyOf=ts=>{const d=new Date(sod(ts));if(G.gran==="semana")d.setDate(d.getDate()-((d.getDay()+6)%7));else if(G.gran==="mes")d.setDate(1);return d.getTime()};
  const next=k=>{const d=new Date(k);if(G.gran==="dia")d.setDate(d.getDate()+1);else if(G.gran==="semana")d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1);return d.getTime()};
  let from;
  if(G.gran==="dia")from=addDays(t0,-G.dias);
  else if(G.gran==="semana")from=keyOf(addDays(t0,-77));
  else{const d=new Date(t0);d.setDate(1);d.setMonth(d.getMonth()-11);from=d.getTime()}
  const map=new Map();
  for(let k=keyOf(from);k<=t0;k=next(k))map.set(k,{k,value:0,end:next(k)});
  for(const s of sales){if(s.ts<from||s.ts>now)continue;const b=map.get(keyOf(s.ts));if(b)b.value+=val(s)}
  let bs=[...map.values()];
  if(G.gran!=="dia"){const i=bs.findIndex(b=>b.value>0);if(i>0)bs=bs.slice(i)}
  const mes=k=>new Date(k).toLocaleDateString("pt-BR",{month:"short"}).replace(".","");
  for(const b of bs){
    b.partial=b.end>now;
    if(G.gran==="dia"){b.label=dm(b.k);b.tip=new Date(b.k).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"})}
    else if(G.gran==="semana"){b.label=dm(b.k);b.tip=`Semana de ${dm(b.k)} a ${dm(b.end-1)}`}
    else{b.label=mes(b.k);b.tip=new Date(b.k).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
  }
  return bs;
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(Math.max(x,1e-9)))),f=x/p;return Math.max(1,(f<=1?1:f<=2?2:f<=5?5:10)*p)}
function drawChart(sales){
  const el=$("#gChart");if(!el)return;
  const bs=chartBuckets(sales),piz=G.metrica==="pizzas",fmt=piz?v=>pl(v,"pizza","pizzas"):v=>brl0(v);
  const ax=piz?v=>int(v):v=>v>=1000?"R$ "+(v/1000).toLocaleString("pt-BR")+" mil":"R$ "+int(v);
  $("#chTitle").textContent=(piz?"Pizzas vendidas":"Faturamento")+(G.gran==="dia"?" por dia":G.gran==="semana"?" por semana":" por mês");
  $("#chSub").textContent=(G.gran==="dia"?`Últimos ${G.dias} dias e hoje`:G.gran==="semana"?"Últimas 12 semanas":"Últimos 12 meses com vendas")+". Barra mais clara: período ainda em andamento.";
  const W=Math.max(280,el.clientWidth),H=250,ml=piz?36:66,mr=8,mt=20,mb=26,iw=W-ml-mr,ih=H-mt-mb;
  const max=Math.max(1,...bs.map(b=>b.value)),step=niceStep(max/4),top=Math.ceil(max/step)*step;
  const slot=iw/bs.length,bw=Math.max(1.5,Math.min(24,slot-2)),y=v=>mt+ih-v/top*ih;
  let g="";
  for(let t=0;t<=top+1e-9;t+=step)g+=`<line x1="${ml}" x2="${W-mr}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${ml-6}" y="${y(t)+4}" text-anchor="end" class="ax">${ax(t)}</text>`;
  const every=Math.ceil(46/slot),imax=bs.reduce((a,b,i)=>b.value>bs[a].value?i:a,0);
  bs.forEach((b,i)=>{
    const x=ml+slot*i+(slot-bw)/2,h=b.value/top*ih,r=Math.min(4,bw/2,h),yy=mt+ih-h;
    if(h>0)g+=`<path data-i="${i}" d="M${x},${mt+ih}V${yy+r}Q${x},${yy} ${x+r},${yy}H${x+bw-r}Q${x+bw},${yy} ${x+bw},${yy+r}V${mt+ih}Z" fill="var(--mark)" opacity="${b.partial?.45:1}"/>`;
    if((bs.length-1-i)%every===0)g+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" class="ax">${b.label}</text>`;
    if(i===imax&&b.value>0)g+=`<text x="${Math.min(W-mr-34,Math.max(ml+30,x+bw/2))}" y="${yy-6}" text-anchor="middle" class="axv">${fmt(b.value)}</text>`;
  });
  g+=`<line x1="${ml}" x2="${W-mr}" y1="${mt+ih}" y2="${mt+ih}" stroke="var(--muted)" stroke-width="1"/>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${$("#chTitle").textContent}">${g}</svg><div class="tip" hidden></div>`;
  const svg=el.querySelector("svg"),tip=el.querySelector(".tip"),bars=svg.querySelectorAll("path");
  const leave=()=>{tip.hidden=true;bars.forEach(p=>p.removeAttribute("fill-opacity"))};
  const move=e=>{
    const r=svg.getBoundingClientRect(),i=Math.floor(((e.clientX-r.left)/r.width*W-ml)/slot);
    if(i<0||i>=bs.length){leave();return}
    bars.forEach(p=>p.setAttribute("fill-opacity",p.dataset.i==i?1:.45));
    const b=bs[i];tip.hidden=false;tip.textContent=`${b.tip}: ${fmt(b.value)}${b.partial?" (parcial)":""}`;
    tip.style.left=Math.min(r.width-80,Math.max(80,(ml+slot*i+slot/2)/W*r.width))+"px";tip.style.top=Math.max(34,y(b.value)/H*r.height)+"px";
  };
  svg.addEventListener("pointermove",move);svg.addEventListener("pointerdown",move);svg.addEventListener("pointerleave",leave);
}

/* ---------- custos ---------- */
function renderCustos(){
  const c=G.custos,inp=(id,label,v,stepv)=>`<label>${label}<input type="number" id="${id}" min="0" step="${stepv||0.1}" value="${v}"></label>`;
  $("#gCustos").innerHTML=`
    <p class="hint">Valores de exemplo. Troque pelos custos reais da pizzaria: o painel refaz as contas na hora.</p>
    <h4>Custo dos ingredientes por pizza grande (R$)</h4>
    <div class="cgrid">${MENU.filter(m=>m.pizza).map(m=>inp("c-s-"+m.id,esc(m.nome)+` (vende a ${brl(m.preco)})`,c.sabor[m.id]??0)).join("")}</div>
    <h4>Custo de compra das bebidas (R$)</h4>
    <div class="cgrid">${MENU.filter(m=>!m.pizza).map(m=>inp("c-s-"+m.id,esc(m.nome)+` (vende a ${brl(m.preco)})`,c.sabor[m.id]??0)).join("")}</div>
    <h4>Custos por pedido</h4>
    <div class="cgrid">${inp("c-embalagem","Caixa e embalagem por pizza (R$)",c.embalagem)}${inp("c-motoboy","Motoboy por entrega (R$)",c.motoboy)}${inp("c-cartao","Taxa da maquininha (%)",c.cartao)}${inp("c-ifood","Comissão do iFood (%)",c.ifood)}${inp("c-cashback","Cashback no app (%)",c.cashback)}
      ${BORDAS.filter(b=>b.id!=="sem").map(b=>inp("c-b-"+b.id,"Recheio da borda de "+b.nome.toLowerCase()+" (R$)",c.borda[b.id]??0)).join("")}</div>
    <h4>Custos fixos do mês (R$)</h4>
    <div class="cgrid">${c.fixos.map((f,i)=>inp("c-f-"+i,esc(f[0]),f[1],10)).join("")}</div>
    <div class="row-btns"><button class="btn ghost" type="button" id="cReset">Voltar aos valores de exemplo</button><span class="hint">Custos fixos somam <strong id="cTot"></strong> por mês.</span></div>`;
  const tot=()=>$("#cTot").textContent=brl0(G.custos.fixos.reduce((a,f)=>a+(+f[1]||0),0));tot();
  $("#gCustos").onchange=e=>{
    const t=e.target,id=t.id||"",v=Math.max(0,parseFloat(t.value)||0);
    if(id.startsWith("c-s-"))c.sabor[id.slice(4)]=v;else if(id.startsWith("c-b-"))c.borda[id.slice(4)]=v;
    else if(id.startsWith("c-f-"))c.fixos[+id.slice(4)][1]=v;else if(id.startsWith("c-"))c[id.slice(2)]=v;else return;
    salvarCustos();tot();renderDash();
  };
  $("#cReset").onclick=()=>{G.custos=JSON.parse(JSON.stringify(CUSTOS_PADRAO));salvarCustos();renderCustos();renderDash();toast("Custos de exemplo restaurados")};
}

/* ---------- lançar venda, importar e exportar ---------- */
const CSV_HEAD="pedido;data;hora;canal;tipo;pagamento;item;tamanho;borda;qtd;valor_unit;frete;desconto";
function toCSV(sales){
  const n=v=>(+v||0).toFixed(2).replace(".",",");
  return [CSV_HEAD].concat(sales.flatMap(s=>{const d=new Date(s.ts);return s.itens.map(it=>[s.id,d.toLocaleDateString("pt-BR"),d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),s.canal,s.tipo,s.pag,
    it.k==="p"?it.ids.map(i=>(byId(i)||{nome:i}).nome).join(" / "):itemName(it),it.k==="p"?sizeOf(it.size).nome:"",it.k==="p"?(BORDAS.find(b=>b.id===it.borda)||BORDAS[0]).nome:"",it.qtd,n(it.unit),n(s.frete),n(s.desc)].join(";"))})).join("\n");
}
function importCSV(txt){
  const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length<2)return {n:0,err:"O arquivo precisa ter o cabeçalho e pelo menos uma linha de venda."};
  const sep=lines[0].includes(";")?";":",",head=lines[0].toLowerCase().split(sep).map(h=>h.trim());
  for(const need of ["data","item","valor_unit"])if(!head.includes(need))return {n:0,err:`Falta a coluna “${need}”. Use o cabeçalho: ${CSV_HEAD}`};
  const num=x=>{x=String(x||"").replace(/[R$\s]/g,"");if(x.includes(","))x=x.replace(/\./g,"").replace(",",".");return parseFloat(x)||0};
  const low=x=>String(x||"").trim().toLowerCase();
  const dt=(d,h)=>{let m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d),y,mo,da;if(m){da=+m[1];mo=+m[2];y=+m[3]}else if((m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(d))){y=+m[1];mo=+m[2];da=+m[3]}else return 0;
    const t=/^(\d{1,2}):(\d{2})/.exec(h||"")||[0,20,0];return new Date(y,mo-1,da,+t[1],+t[2]).getTime()};
  const map=new Map();let unk=0,bad=0;
  lines.slice(1).forEach((l,li)=>{
    const f=l.split(sep).map(x=>x.trim()),get=n=>{const i=head.indexOf(n);return i>=0?f[i]||"":""};
    const pid=get("pedido")||"linha"+li;if(G.pedidos.some(x=>x.id===pid))return; /* já está no banco */
    let s=map.get(pid);
    if(!s){const ts=dt(get("data"),get("hora"));if(!ts){bad++;return}
      s={id:"csv"+pid,ts,canal:get("canal")||"Importado",tipo:/retir/i.test(get("tipo"))?"retirada":"entrega",pag:get("pagamento")||"Não informado",frete:num(get("frete")),desc:num(get("desconto")),itens:[],total:0};map.set(pid,s)}
    const ms=get("item").split("/").map(n=>MENU.find(m=>low(m.nome)===low(n))).filter(Boolean),qtd=Math.max(1,parseInt(get("qtd"))||1),unit=num(get("valor_unit"));
    if(ms.length&&ms[0].pizza)s.itens.push({k:"p",ids:ms.filter(m=>m.pizza).map(m=>m.id),size:(SIZES.find(z=>low(z.nome)===low(get("tamanho")))||SIZES[2]).id,borda:(BORDAS.find(b=>low(b.nome)===low(get("borda")))||BORDAS[0]).id,qtd,unit});
    else if(ms.length)s.itens.push({k:"b",ids:[ms[0].id],qtd,unit});
    else{unk++;s.itens.push({k:"o",nome:get("item")||"Item",qtd,unit})}
  });
  const novos=[...map.values()];
  for(const s of novos)s.total=Math.max(0,s.itens.reduce((a,i)=>a+i.unit*i.qtd,0)-s.desc+s.frete);
  return {n:novos.length,unk,bad,novos};
}
function renderVenda(){
  const d=new Date(),pad=n=>String(n).padStart(2,"0"),op=(arr,f)=>arr.map(f).join("");
  $("#gVenda").innerHTML=`
    <h4>Lançar uma venda do WhatsApp, balcão ou iFood</h4>
    <div class="cgrid">
      <label>Data<input type="date" id="v-data" value="${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}"></label>
      <label>Hora<input type="time" id="v-hora" value="${pad(d.getHours())}:${pad(d.getMinutes())}"></label>
      <label>Canal<select id="v-canal">${op(["WhatsApp","Balcão","iFood","Telefone","App"],x=>`<option>${x}</option>`)}</select></label>
      <label>Entrega ou retirada<select id="v-tipo"><option value="entrega">Entrega</option><option value="retirada">Retirada</option></select></label>
      <label>Pagamento<select id="v-pag">${op(["Pix","Cartão","Dinheiro","iFood (online)"],x=>`<option>${x}</option>`)}</select></label>
    </div>
    <div class="cgrid">
      <label>Item<select id="v-item">${op(MENU,m=>`<option value="${m.id}">${esc(m.nome)}</option>`)}</select></label>
      <label>2º sabor (opcional)<select id="v-item2"><option value="">Sem 2º sabor</option>${op(MENU.filter(m=>m.pizza),m=>`<option value="${m.id}">${esc(m.nome)}</option>`)}</select></label>
      <label>Tamanho<select id="v-size">${op(SIZES,z=>`<option value="${z.id}" ${z.id==="grande"?"selected":""}>${z.nome}</option>`)}</select></label>
      <label>Borda<select id="v-borda">${op(BORDAS,b=>`<option value="${b.id}">${b.nome}</option>`)}</select></label>
      <label>Quantidade<input type="number" id="v-qtd" min="1" step="1" value="1"></label>
    </div>
    <div class="row-btns"><button class="btn ghost" type="button" id="v-add">Adicionar item</button><button class="btn ok" type="button" id="v-save">Salvar venda</button><button class="btn ghost" type="button" id="v-undo">Desfazer última venda lançada</button><span class="err" id="v-err"></span></div>
    <ul id="v-list"></ul>
    <h4>Exportar e importar (CSV)</h4>
    <p class="hint">O arquivo usa o cabeçalho <code>${CSV_HEAD}</code>. Serve de backup e abre no Excel, Power BI ou Python.</p>
    <div class="row-btns"><button class="btn ghost" type="button" id="csvCopy">Copiar vendas reais em CSV</button><input type="file" id="csvFile" accept=".csv,text/csv,text/plain" aria-label="Arquivo CSV para importar"></div>
    <textarea class="csv" id="csvBox" placeholder="Ou cole aqui as linhas do CSV e clique em Importar" aria-label="Conteúdo CSV"></textarea>
    <div class="row-btns"><button class="btn ghost" type="button" id="csvImport">Importar o que está na caixa</button><span class="hint" id="csvMsg"></span></div>`;
  const list=()=>{const tot=G.draft.reduce((a,i)=>a+i.unit*i.qtd,0);$("#v-list").innerHTML=G.draft.map(i=>`<li>${i.qtd}× ${esc(itemName(i))}: ${brl(i.unit*i.qtd)}</li>`).join("")+(G.draft.length?`<li><strong>Itens: ${brl(tot)}</strong></li>`:"")};
  list();
  $("#v-add").onclick=()=>{
    const m=byId($("#v-item").value),qtd=Math.max(1,parseInt($("#v-qtd").value)||1);
    if(m.pizza){const size=$("#v-size").value,borda=$("#v-borda").value,ids=[m.id],b=$("#v-item2").value;
      if(b&&b!==m.id&&sizeOf(size).maxSabores>1)ids.push(b);
      G.draft.push({k:"p",ids,size,borda,qtd,unit:pizzaPrice(size,ids,borda)})}
    else G.draft.push({k:"b",ids:[m.id],qtd,unit:m.preco});
    $("#v-err").textContent="";list();
  };
  $("#v-save").onclick=()=>{
    if(!G.draft.length){$("#v-err").textContent="Adicione pelo menos um item antes de salvar.";return}
    const [y,mo,da]=($("#v-data").value||"").split("-").map(Number),[h,mi]=($("#v-hora").value||"20:00").split(":").map(Number);
    if(!y){$("#v-err").textContent="Informe a data da venda.";return}
    const tipo=$("#v-tipo").value,frete=tipo==="entrega"?TAXA_ENTREGA:0,sub=G.draft.reduce((a,i)=>a+i.unit*i.qtd,0);
    const linha={origem_id:"m"+Date.now(),criado_em:new Date(y,mo-1,da,h||0,mi||0).toISOString(),canal:$("#v-canal").value,tipo,pagamento:$("#v-pag").value,pag_tipo:$("#v-pag").value,
      frete,desconto:0,total:Math.round((sub+frete)*100)/100,status:4,itens:G.draft};
    sb.from("pedidos").insert(linha).then(({error})=>{
      if(error){$("#v-err").textContent="Não foi possível salvar a venda. Tente de novo.";return}
      G.draft=[];G.fonte="reais";store.set("fonte","reais");list();carregarPedidos();toast("Venda salva")});
  };
  $("#v-undo").onclick=async()=>{
    const {data,error}=await sb.from("pedidos").select("id").like("origem_id","m%").order("origem_id",{ascending:false}).limit(1);
    if(error||!data.length){$("#v-err").textContent="Não há venda lançada para desfazer.";return}
    const r=await sb.from("pedidos").delete().eq("id",data[0].id);
    if(r.error){$("#v-err").textContent="Não foi possível desfazer. Tente de novo.";return}
    carregarPedidos();toast("Última venda lançada removida");
  };
  $("#csvCopy").onclick=()=>{
    const txt=toCSV(realSales()),box=$("#csvBox");box.value=txt;
    navigator.clipboard.writeText(txt).then(()=>toast("CSV copiado")).catch(()=>{box.focus();box.select();toast("CSV na caixa: copie com Ctrl+C")});
  };
  const run=async txt=>{const r=importCSV(txt);
    if(r.err){$("#csvMsg").textContent=r.err;return}
    const linhas=r.novos.map(s=>({origem_id:s.id,criado_em:new Date(s.ts).toISOString(),canal:s.canal,tipo:s.tipo,pagamento:s.pag,pag_tipo:s.pag,frete:s.frete,desconto:s.desc,total:Math.round(s.total*100)/100,status:4,itens:s.itens}));
    for(let i=0;i<linhas.length;i+=200){
      const {error}=await sb.from("pedidos").upsert(linhas.slice(i,i+200),{onConflict:"origem_id"});
      if(error){$("#csvMsg").textContent="A importação parou no meio. Confira a internet e importe de novo; nada fica duplicado.";return}
    }
    $("#csvMsg").textContent=`${r.n} vendas importadas.`+(r.unk?` ${r.unk} itens fora do cardápio entraram como “outros”.`:"")+(r.bad?` ${r.bad} linhas sem data válida foram ignoradas.`:"");
    G.fonte="reais";store.set("fonte","reais");carregarPedidos()};
  $("#csvImport").onclick=()=>run($("#csvBox").value);
  $("#csvFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>run(String(rd.result));rd.readAsText(f)};
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-g]");if(!b||!G.unlocked)return;
  const k=b.dataset.g,v=b.dataset.v;
  if(k==="dias")G.dias=+v;else if(k==="allFl")G.allFl=!!v;else G[k]=v;
  if(k==="fonte")store.set("fonte",v);
  if(k==="gran"||k==="metrica"){document.querySelectorAll(`button[data-g="${k}"]`).forEach(x=>x.setAttribute("aria-pressed",x.dataset.v===v));drawChart(gSales())}
  else renderDash();
});
let gRz;window.addEventListener("resize",()=>{clearTimeout(gRz);gRz=setTimeout(()=>{if(state.tab==="gestor"&&G.unlocked&&$("#gChart"))drawChart(gSales())},150)});

/* ===================== AVALIAÇÃO GOOGLE (QR + NFC) ===================== */
function reviewLink(v){
  v=v.trim(); if(!v) return "";
  if(/^https?:\/\//i.test(v)) return v;
  if(/^(g\.page|maps\.app\.goo\.gl|search\.google\.com)/i.test(v)) return "https://"+v;
  return "https://search.google.com/local/writereview?placeid="+encodeURIComponent(v);
}
function genQR(){
  const link=reviewLink($("#rv-input").value);
  $("#rv-cardname").textContent=$("#rv-nome").value||"Teste";
  if(!link){$("#rv-err").textContent="Cole o link de avaliação ou o Place ID para gerar o QR code.";return}
  $("#rv-err").textContent=""; $("#rv-link").textContent=link;
  const box=$("#rv-qr"); box.innerHTML="";
  if(typeof QRCode==="undefined"){$("#rv-err").textContent="Não foi possível carregar o gerador de QR. Recarregue a página.";return}
  new QRCode(box,{text:link,width:200,height:200,colorDark:"#173d2a",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
}
function initReview(){
  if(!$("#rv-input").value) $("#rv-input").value="ChIJEXEMPLO-troque-pelo-seu-place-id";
  $("#rv-nome").value=$("#rv-nome").value==="Forno da Vila"?"Teste":$("#rv-nome").value;
  $("#rv-gen").onclick=genQR;
  $("#rv-copy").onclick=()=>{const l=reviewLink($("#rv-input").value);if(!l)return;
    navigator.clipboard.writeText(l).then(()=>toast("Link copiado")).catch(()=>{const r=document.createRange();r.selectNodeContents($("#rv-link"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Link selecionado, use Ctrl+C")})};
  genQR();
}
/* ---------- equipe ---------- */
async function renderEquipe(){
  const el=$("#gEquipe"),{data,error}=await sb.from("equipe").select("user_id,email,papel,criado_em").order("criado_em");
  if(error){el.textContent="Não foi possível ler a equipe.";return}
  el.innerHTML=`<p class="hint">Cada pessoa cria o próprio acesso na tela de login (botão “Primeiro acesso”) e confirma o e-mail. Depois você libera o e-mail dela aqui.</p>
    <div class="tbl-wrap"><table class="g"><thead><tr><th>E-mail</th><th class="l">Acesso</th><th></th></tr></thead><tbody>
    ${data.map(m=>`<tr><td>${esc(m.email)}</td><td class="l">${m.papel==="gestor"?"Gestor":"Cozinha"}</td><td>${m.email===G.email?"você":`<button class="btn ghost" type="button" data-rm="${m.user_id}">Remover</button>`}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="cgrid"><label>E-mail da pessoa<input type="email" id="eq-mail"></label><label>Acesso<select id="eq-papel"><option value="cozinha">Cozinha</option><option value="gestor">Gestor</option></select></label></div>
    <div class="row-btns"><button class="btn ok" type="button" id="eq-add">Liberar acesso</button><span class="err" id="eq-msg"></span></div>`;
  $("#eq-add").onclick=async()=>{
    const email=$("#eq-mail").value.trim();if(!email){$("#eq-msg").textContent="Informe o e-mail.";return}
    const {error}=await sb.rpc("liberar_acesso",{p_email:email,p_papel:$("#eq-papel").value});
    if(error){$("#eq-msg").textContent=error.code==="22023"?error.message:"Não foi possível liberar. Tente de novo.";return}
    toast("Acesso liberado");renderEquipe();
  };
  el.querySelectorAll("[data-rm]").forEach(b=>b.onclick=async()=>{
    if(!b.dataset.sure){b.dataset.sure="1";b.textContent="Confirmar remoção";return}
    const {error}=await sb.rpc("remover_acesso",{p_user:b.dataset.rm});
    if(error){toast("Não foi possível remover.");return}
    toast("Acesso removido");renderEquipe();
  });
}
/* ---------- início ---------- */
(async function(){
  const u=await telaLogin($("#gestorBody"),{titulo:"App do gestor",precisaGestor:true});
  G.unlocked=true;G.email=u.email;
  const cfg=await sb.from("config").select("valor").eq("chave","custos").maybeSingle();
  G.custos=mergeCustos(cfg.data&&cfg.data.valor);
  await carregarPedidos();
  renderGestor();$("#extras").hidden=false;initReview();renderEquipe();
  sb.channel("gestor").on("postgres_changes",{event:"*",schema:"public",table:"pedidos"},()=>{clearTimeout(G._t);G._t=setTimeout(()=>carregarPedidos(),1500)}).subscribe();
})();
