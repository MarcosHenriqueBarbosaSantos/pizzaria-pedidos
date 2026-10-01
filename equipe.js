/* Login da equipe (cozinha e gestor). O primeiro acesso criado vira gestor; os demais são liberados por ele. */
function telaLogin(root,{titulo,precisaGestor}){
  return new Promise(resolve=>{
    const msg=(t,ok)=>{const e=root.querySelector("#lgMsg");if(e){e.textContent=t;e.style.color=ok?"var(--up)":""}};
    async function conferir(){
      const {data:{session}}=await sb.auth.getSession();
      if(!session)return form();
      const {data:papel,error}=await sb.rpc("primeiro_acesso");
      if(error)return aviso("O banco de dados ainda não está pronto ou está fora do ar. Tente de novo em instantes.",session);
      if(!papel)return aviso("Seu acesso foi criado, mas ainda não foi liberado. Peça ao gestor para liberar este e-mail na área Equipe.",session);
      if(precisaGestor&&papel!=="gestor")return aviso("Esta área é só do gestor. Seu acesso é da cozinha.",session);
      root.innerHTML="";resolve({papel,email:(session.user.email||"").toLowerCase()});
    }
    function aviso(texto,session){
      root.innerHTML=`<div class="login"><h3>${titulo}</h3><p style="margin:0">${texto}</p><p class="hint">Conectado como <span id="lgEmail"></span></p>
        <div class="row-btns"><button class="btn ghost" type="button" id="lgRetry">Tentar de novo</button><button class="btn ghost" type="button" id="lgOut">Sair</button></div></div>`;
      root.querySelector("#lgEmail").textContent=session.user.email||"";
      root.querySelector("#lgRetry").onclick=conferir;
      root.querySelector("#lgOut").onclick=async()=>{await sb.auth.signOut();form()};
    }
    function form(){
      root.innerHTML=`<form class="login" id="lgForm"><h3>${titulo}</h3>
        <label>E-mail<input type="email" id="lgMail" autocomplete="username" required></label>
        <label>Senha<input type="password" id="lgPass" autocomplete="current-password" minlength="8" required></label>
        <div class="err" id="lgMsg"></div>
        <button class="btn ok" type="submit">Entrar</button>
        <button class="btn ghost" type="button" id="lgNew">Primeiro acesso: criar minha senha</button>
        <p class="hint">O primeiro acesso criado vira o gestor. Os demais precisam ser liberados por ele.</p></form>`;
      const cred=()=>({email:root.querySelector("#lgMail").value.trim(),password:root.querySelector("#lgPass").value});
      root.querySelector("#lgForm").onsubmit=async e=>{
        e.preventDefault();msg("Entrando…",true);
        const {error}=await sb.auth.signInWithPassword(cred());
        if(error){msg(/confirm/i.test(error.message)?"Confirme seu e-mail pelo link que enviamos e tente de novo.":"E-mail ou senha incorretos.");return}
        conferir();
      };
      root.querySelector("#lgNew").onclick=async()=>{
        const c=cred();
        if(!c.email||c.password.length<8){msg("Preencha o e-mail e uma senha com pelo menos 8 caracteres.");return}
        msg("Criando acesso…",true);
        const {data,error}=await sb.auth.signUp({...c,options:{emailRedirectTo:location.origin+location.pathname}});
        if(error){msg(/registered|exists/i.test(error.message)?"Este e-mail já tem acesso. Use Entrar.":"Não foi possível criar o acesso. Tente de novo em alguns minutos.");return}
        if(data.session)conferir();else msg("Enviamos um link de confirmação para o seu e-mail. Abra o link e depois entre aqui.",true);
      };
    }
    if(!sb){root.innerHTML=`<div class="login"><h3>${titulo}</h3><p style="margin:0">Não foi possível carregar a conexão com o banco. Confira a internet e recarregue a página.</p></div>`;return}
    conferir();
  });
}
async function sair(){await sb.auth.signOut();location.reload()}
