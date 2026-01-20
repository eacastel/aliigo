"use strict";(()=>{var S={en:{pill:s=>`Ask ${s}`,title:s=>`${s} Assistant`,welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:s=>`Pregunta a ${s}`,title:s=>`Asistente de ${s}`,welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function A(s){return(s||"").toLowerCase().startsWith("es")}function p(s,l){let t=(s||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],n=t[0]||(l==null?void 0:l.bg)||"#111827",i=t[1]||(l==null?void 0:l.text)||"#ffffff";return{bg:n,text:i}}var f=class extends HTMLElement{constructor(){super(...arguments);this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en"}}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","theme"]}connectedCallback(){this.ensureRoot(),this.render(),this.ensureSession()}attributeChangedCallback(e,t,n){t!==n&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,this.ensureSession()))}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e);return t&&typeof t=="object"?t:null}catch{return null}}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!(!t&&!e)&&!(this.state.session&&!e))try{let n=this.getApiBase();if(e){let c=this.getLocaleOverride();this.state.session={token:e,locale:c||this.state.locale,brand:"Aliigo",slug:"",theme:null},this.state.locale=c||this.state.locale,this.render();return}let i=new URL(`${n}/api/embed/session`);i.searchParams.set("key",t),i.searchParams.set("host",window.location.hostname);let r=await fetch(i.toString(),{method:"GET"}),o=await r.json().catch(()=>({}));if(!r.ok||!o.token){this.state.session=null,this.renderError(o.error||"Session error");return}let d=this.getLocaleOverride()||(A(o.locale||"en")?"es":"en");this.state.session={token:o.token,locale:d,brand:(o.brand||"Aliigo").trim(),slug:(o.slug||"").trim(),theme:o.theme||null},this.state.locale=d,this.render()}catch{this.renderError("Network error")}}renderError(e){this.ensureRoot(),this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${e}</div></div>
        </div>
      </div>
    `}css(){return`
      :host{ all: initial; display: block; height: 100%; }
      .wrap{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; box-sizing:border-box; }
      .wrap, .wrap *{ box-sizing:border-box; }

      .floating{ position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; }
      .inline{ width: 100%; height: 100%; }
      .hero{ width: 100%; height: 100%; max-width: 980px; margin: 0 auto; }


      .pill{
        border:0; cursor:pointer; font-weight:700;
        border-radius:999px; padding:12px 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      }

      .panel{
        width: 360px;
        height: 420px;
        background:#fff;
        border: 1px solid rgba(0,0,0,0.10);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0,0,0,0.28);
        display:flex;
        flex-direction:column;
      }

      .panel.inline, .panel.hero{
        width: 100%;
        max-width: 100%;
        height: 100%;
      }
      .panel.hero{ height: 100%; }

      .header{
        padding: 12px 14px;
        display:flex; align-items:center; justify-content:space-between;
        border-bottom: 1px solid rgba(0,0,0,0.08);
        font-weight: 700;
        font-size: 14px;
      }
      .close{
        border:0; background:transparent; cursor:pointer;
        font-size:18px; line-height:18px; opacity:0.8;
      }

      .body{
        flex: 1;
        min-height: 0;
        overflow: hidden;
        padding: 12px;
        display:flex;
      }
      .messages{
        flex:1;
        min-height:0;
        overflow-y:auto;
        padding-right: 6px;
      }

      .row{ margin-top: 8px; }
      .row.user{ text-align:right; }
      .row.bot{ text-align:left; }

      .bubble{
        display:inline-block;
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .form{
        flex: 0 0 auto;
        display:flex;
        gap: 8px;
        padding: 10px;
        border-top: 1px solid rgba(0,0,0,0.08);
        background:#fff;
      }
      .input{
        flex:1;
        height: 38px;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 10px;
        padding: 0 12px;
        font-size: 14px;
        outline: none;
      }
      .send{
        height: 38px;
        border:0;
        border-radius: 10px;
        padding: 0 14px;
        font-size: 14px;
        font-weight: 700;
        cursor:pointer;
      }
      .send:disabled{ opacity:0.55; cursor:not-allowed; }

      /* Responsive: fill width on small screens */
      @media (max-width: 520px){
        .floating{ left: 12px; right: 12px; bottom: 12px; }
        .panel{ width: 100%; height: 70vh; }
      }
    `}render(){this.ensureRoot();let e=this.getVariant(),t=this.state.session,n=this.getLocaleOverride()||this.state.locale,i=S[n],r={...(t==null?void 0:t.theme)||{},...this.getThemeOverride()||{}},o=p(r.headerBg,{bg:"#111827",text:"#ffffff"}),u=p(r.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),d=p(r.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),c=p(r.sendBg,{bg:"#2563eb",text:"#ffffff"}),v=(t==null?void 0:t.brand)||"Aliigo",w=e!=="floating"?!0:this.state.open,x=e==="floating"?"wrap floating":e==="hero"?"wrap hero":"wrap inline",k=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",y=this.state.msgs,$=y.length===0?`<div class="row bot"><div class="bubble bot" style="background:${d.bg};color:${d.text};">${i.welcome}</div></div>`:y.map(a=>{let h=a.role==="user",T=h?`background:${u.bg};color:${u.text};`:`background:${d.bg};color:${d.text};`;return`
                <div class="row ${h?"user":"bot"}">
                  <div class="bubble ${h?"user":"bot"}" style="${T}">${E(a.content)}</div>
                </div>
              `}).join("");if(e==="floating"&&!w){this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${x}">
          <button class="pill" style="background:${c.bg};color:${c.text};">${i.pill(v)}</button>
        </div>
      `;let a=this.root.querySelector(".pill");a==null||a.addEventListener("click",()=>{this.state.open=!0,this.render(),this.scrollToBottomSoon()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${x}">
        <div class="${k}">
          <div class="header" style="background:${o.bg};color:${o.text};">
            <div>${i.title(v)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${o.text};">\xD7</button>`:""}
          </div>

          <div class="body">
            <div class="messages">${$}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${i.placeholder}" />
            <button class="send" type="submit" style="background:${c.bg};color:${c.text};" ${this.state.busy||!(t!=null&&t.token)?"disabled":""}>${i.send}</button>
          </form>
        </div>
      </div>
    `;let b=this.root.querySelector(".close");b==null||b.addEventListener("click",()=>{this.state.open=!1,this.render()});let m=this.root.querySelector(".form"),g=this.root.querySelector(".input");m==null||m.addEventListener("submit",a=>{a.preventDefault();let h=((g==null?void 0:g.value)||"").trim();h&&(g&&(g.value=""),this.send(h))}),this.scrollToBottomSoon()}scrollToBottomSoon(){let e=this.root.querySelector(".messages");e&&requestAnimationFrame(()=>{e.scrollTop=e.scrollHeight})}async send(e){let t=this.state.session;if(t!=null&&t.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.render();try{let n=this.getApiBase(),i=await fetch(`${n}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t.token,conversationId:this.state.conversationId,message:e,locale:this.state.locale,channel:"web"})}),r=await i.json().catch(()=>({}));if(!i.ok){this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.error||"Error"}],this.state.busy=!1,this.render();return}r.conversationId&&(this.state.conversationId=r.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.reply||""}],this.state.busy=!1,this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.state.busy=!1,this.render()}}}};function E(s){return(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",f);})();
//# sourceMappingURL=aliigo-widget.js.map
