/* Configuração do banco (chave pública: pode ficar no site; as regras de acesso ficam no banco) */
const SB_URL="https://wwmfkvcwamlyeqiohlig.supabase.co";
const SB_KEY="sb_publishable_zCDfB8yEY-lng5EMhMP5GA_CITWfYLT";
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY):null;
const WHATS="5511990268455"; /* WhatsApp da pizzaria, com 55 e DDD */

/* ===================== DADOS ===================== */
const SIZES = [
  {id:"broto", nome:"Broto", cm:25, fatias:4, mult:0.68, maxSabores:1},
  {id:"media", nome:"Média", cm:30, fatias:6, mult:0.85, maxSabores:2},
  {id:"grande", nome:"Grande", cm:35, fatias:8, mult:1.0, maxSabores:3},
  {id:"gigante", nome:"Gigante", cm:40, fatias:12, mult:1.3, maxSabores:3},
];
const FORMAS = [
  {id:"pizza", nome:"Pizza tradicional"},
  {id:"calzone", nome:"Calzone"},
  {id:"frita", nome:"Pizza frita crocante"},
];
const MASSAS = [
  {id:"fina", nome:"Massa fina", preco:0},
  {id:"media", nome:"Massa média", preco:0},
  {id:"grossa", nome:"Massa grossa", preco:5},
];
const BORDAS = [
  {id:"sem", nome:"Sem borda", preco:0},
  {id:"catupiry", nome:"Catupiry", preco:15},
  {id:"cheddar", nome:"Cheddar", preco:15},
  {id:"chocolate", nome:"Chocolate", preco:15},
  {id:"creamcheese", nome:"Cream cheese", preco:15},
  {id:"mussarela", nome:"Mussarela", preco:15},
  {id:"provolone", nome:"Provolone", preco:15},
  {id:"vulcao", nome:"Vulcão", preco:18},
];
const CATS = ["Tradicionais","Especiais","Doces","Bebidas"];
/* [id, categoria, nome, descrição, preço da grande, custo estimado (fração do preço), peso nas vendas de exemplo, selo] */
const MENU = [
  ["mussarela","Tradicionais","Mussarela","Mussarela e tomate",68.9,.28,14],
  ["calabresa","Tradicionais","Calabresa","Calabresa e cebola",68.9,.28,18,"Mais pedida"],
  ["baiana","Tradicionais","Baiana","Calabresa moída, ovos, cebola e pimenta calabresa",76.9,.29,4],
  ["brocolis","Tradicionais","Brócolis","Mussarela e brócolis",78.9,.29,3],
  ["abobrinha","Tradicionais","Abobrinha","Mussarela, abobrinha italiana e parmesão",78.9,.29,2,"Vegetariana"],
  ["frango","Tradicionais","Frango com Catupiry","Frango desfiado com catupiry",79.9,.31,13],
  ["toscana","Tradicionais","Toscana","Mussarela e calabresa moída",79.9,.29,5],
  ["doisqueijos","Tradicionais","Dois Queijos","Mussarela e catupiry",79.9,.31,4],
  ["bacon","Tradicionais","Bacon","Mussarela e bacon",79.9,.31,5],
  ["milho","Tradicionais","Milho","Milho e mussarela",79.9,.27,3],
  ["alho","Tradicionais","Alho","Mussarela e alho frito",79.9,.27,3],
  ["vegetariana","Tradicionais","Vegetariana","Brócolis, tomate, milho, rúcula e abobrinha",79.9,.28,3,"Vegetariana"],
  ["napolitana","Tradicionais","Napolitana","Mussarela, parmesão e rodelas de tomate",80.9,.30,4],
  ["palmito","Tradicionais","Palmito","Palmito coberto com mussarela",80.9,.33,3],
  ["escarola","Tradicionais","Escarola","Escarola ao azeite, mussarela e bacon",80.9,.30,2],
  ["portuguesa","Tradicionais","Portuguesa","Mussarela, presunto, ovos, cebola e ervilha",82.9,.31,12],
  ["atum","Tradicionais","Atum","Atum e cebola",82.9,.34,4],
  ["caipira","Tradicionais","Caipira","Frango desfiado, milho, bacon e catupiry",82.9,.32,4],
  ["lombo","Tradicionais","Lombo com Catupiry","Lombo canadense com catupiry",82.9,.33,4],
  ["tresqueijos","Tradicionais","Três Queijos","Mussarela, provolone e catupiry",82.9,.33,3],
  ["quatroq","Tradicionais","Quatro Queijos","Mussarela, provolone, parmesão e catupiry",83.9,.34,8],
  ["bauru","Tradicionais","Bauru","Mussarela, presunto e tomate",85.9,.31,3],
  ["peru","Tradicionais","Peito de Peru","Peito de peru com mussarela",87.9,.35,2],
  ["rucula","Tradicionais","Rúcula","Mussarela de búfala, rúcula e tomate seco",89.9,.37,3,"Vegetariana"],
  ["americana","Tradicionais","Americana","Lombo, champignon, cebola, mussarela, palmito e bacon",89.9,.35,2],
  ["margherita","Especiais","Marguerita de Búfala","Mussarela de búfala, tomate e manjericão",89.9,.36,9,"Vegetariana"],
  ["catupiryesp","Especiais","Catupiry Especial","Catupiry, bacon e gorgonzola",89.9,.35,2],
  ["atumesp","Especiais","Atum Especial","Atum sólido, brócolis, cebola, mussarela e bacon",89.9,.36,2],
  ["francesa","Especiais","Francesa","Mussarela, presunto, bacon e champignon",89.9,.33,2],
  ["pepperoni","Especiais","Pepperoni","Pepperoni com mussarela",92.9,.35,10],
  ["frangoesp","Especiais","Frango Especial","Frango desfiado, milho, bacon, palmito e catupiry",92.9,.34,5],
  ["brocolisesp","Especiais","Brócolis Especial","Mussarela, brócolis, bacon, alho frito e catupiry",92.9,.33,3],
  ["cincoq","Especiais","Cinco Queijos","Mussarela, catupiry, parmesão, provolone e gorgonzola",92.9,.36,4],
  ["lomboesp","Especiais","Lombo Especial","Lombo, palmito, catupiry, cebola e bacon",92.9,.35,2],
  ["palmitoesp","Especiais","Palmito Especial","Mussarela de búfala, palmito, catupiry e manjericão",95.9,.37,2],
  ["alcachofra","Especiais","Alcachofra","Alcachofra refogada com mussarela de búfala",95.9,.38,1],
  ["carneseca","Especiais","Carne Seca","Carne seca desfiada com catupiry",99.9,.38,5],
  ["brigadeiro","Doces","Brigadeiro","Chocolate ao leite, granulado e cereja",73.9,.26,4],
  ["bananachoc","Doces","Banana com Chocolate","Banana e chocolate ao leite",73.9,.25,2],
  ["prestigio","Doces","Prestígio","Chocolate e coco ralado",73.9,.26,2],
  ["confeitos","Doces","Chocolate com Confeitos","Chocolate ao leite com confeitos coloridos",73.9,.27,1],
  ["romeu","Doces","Romeu e Julieta","Goiabada e mussarela",73.9,.26,3],
  ["banana","Doces","Banana com Canela","Banana, leite condensado, açúcar e canela",71.9,.23,2],
  ["doceleite","Doces","Doce de Leite","Banana, doce de leite e canela",71.9,.25,1],
  ["coca2","Bebidas","Coca-Cola 2 L","Garrafa gelada",18,.58,40],
  ["cocazero2","Bebidas","Coca-Cola Zero 2 L","Garrafa gelada",18,.58,10],
  ["guarana15","Bebidas","Guaraná Antarctica 1,5 L","Garrafa gelada",15,.55,18],
  ["fanta2","Bebidas","Fanta Laranja 2 L","Garrafa gelada",17,.56,8],
  ["sprite2","Bebidas","Sprite 2 L","Garrafa gelada",18,.58,4],
  ["cocalata","Bebidas","Coca-Cola lata","350 ml",7.5,.45,8],
  ["guaranalata","Bebidas","Guaraná Antarctica lata","350 ml",7,.45,4],
  ["suco","Bebidas","Suco natural 500 ml","Sabores do dia",12.5,.38,6],
  ["agua","Bebidas","Água sem gás 510 ml","",4,.35,4],
  ["aguagas","Bebidas","Água com gás 510 ml","",5,.35,2],
].map(([id,cat,nome,desc,preco,c,w,tag],i)=>({id,cat,nome,desc,preco,c,w,tag,pizza:cat!=="Bebidas",
  cor:(cat==="Bebidas"?["#4a7a8c","#6a1f1a","#2f6b3a","#d9861f"]:cat==="Doces"?["#5a3526","#a33b4f","#c7932e"]:["#b5412b","#d49a2a","#3f7a45","#9a6b2f","#8c4a36","#c98a3a"])[i%(cat==="Bebidas"?4:cat==="Doces"?3:6)]}));
const CUPONS = {"PRIMEIRA10":{tipo:"pct",valor:10,desc:"10% no primeiro pedido"},"FRETEGRATIS":{tipo:"frete",valor:0,desc:"Entrega grátis"}};
const TAXA_ENTREGA = 7.9, PEDIDO_MIN = 35;
const CASHBACK = 3; /* % do valor dos itens que volta como saldo para o próximo pedido */
const REFRIS = ["coca2","cocazero2","guarana15","fanta2","sprite2"];
const PROMOS = [
  {id:"combo", nome:"Combo Campeão", desc:"Pizza grande Tradicional com refrigerante incluso", preco:89.9, refri:true, dias:null, lista:()=>MENU.filter(m=>m.cat==="Tradicionais"&&m.preco>=76.9)},
  {id:"terca", nome:"Terça a Quinta", desc:"Qualquer pizza grande Tradicional pelo preço da mais simples", preco:68.9, refri:false, dias:[2,3,4], lista:()=>MENU.filter(m=>m.cat==="Tradicionais")},
];
const promoAtiva=p=>!p.dias||p.dias.includes(new Date().getDay());
const STATUS = ["Recebido","Em preparo","No forno","Saiu para entrega","Entregue"];
const STATUS_RET = ["Recebido","Em preparo","No forno","Pronto p/ retirada","Retirado"];

const store = {
  get(k,d){try{const v=localStorage.getItem("suc4_"+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem("suc4_"+k,JSON.stringify(v))}catch(e){}}
};

/* ===================== UTIL ===================== */
const $=s=>document.querySelector(s);
const brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const byId=id=>MENU.find(m=>m.id===id);
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;$("#toastRoot").appendChild(t);setTimeout(()=>t.remove(),2200)}
function initials(n){return n.split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("")||n[0]}

/* Pizza com vários sabores: vale o sabor de maior valor. Borda e massa grossa somam por cima. */
const sizePrice=(base,mult)=>Math.round(base*mult)-0.1; /* preços terminam em ,90 */
function pizzaPrice(sizeId, sabores, bordaId, massaId){
  const size=SIZES.find(s=>s.id===sizeId);
  const base=Math.max(...sabores.map(id=>byId(id).preco));
  const borda=BORDAS.find(b=>b.id===bordaId);
  return sizePrice(base,size.mult)+borda.preco+((MASSAS.find(x=>x.id===massaId)||{preco:0}).preco);
}

const fmtHora=ts=>new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const minAgo=ts=>Math.max(0,Math.round((Date.now()-ts)/60000));
const labels=o=>o.tipo==="retirada"?STATUS_RET:STATUS;
const DAY=864e5;
const sod=ts=>{const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime()};
const addDays=(ts,n)=>{const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime()};
const int=v=>Math.round(v).toLocaleString("pt-BR");
const pl=(n,um,varios)=>int(n)+" "+(Math.round(n)===1?um:varios);
const brl0=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const dm=ts=>new Date(ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const pinHash=p=>{let h=5381;for(const ch of p)h=((h*33)^ch.charCodeAt(0))>>>0;return String(h)};
const sizeOf=id=>SIZES.find(x=>x.id===id)||SIZES[2];
const pizzasDe=s=>s.itens.reduce((a,i)=>a+(i.k==="p"?i.qtd:0),0);
function itemName(it){
  if(it.k==="p")return sizeOf(it.size).nome+" · "+it.ids.map(i=>(byId(i)||{nome:i}).nome).join(" / ");
  if(it.k==="b")return (byId(it.ids[0])||{nome:it.ids[0]}).nome;
  return it.nome||"Item";
}

/* linha do banco -> pedido usado nas telas; descarta itens malformados */
function rowToOrder(r){
  return {uid:r.id,id:r.numero,criado:Date.parse(r.criado_em),cliente:r.cliente_nome||"",tel:r.cliente_tel||"",tipo:r.tipo,end:r.endereco||"",pag:r.pagamento||"",canal:r.canal,
    frete:+r.frete||0,desc:+r.desconto||0,total:+r.total||0,status:r.status,cancelado:r.cancelado,itens:(Array.isArray(r.itens)?r.itens:[]).filter(i=>i&&typeof i==="object")};
}
