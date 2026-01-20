"use strict";(()=>{var A={en:{pill:i=>`Ask ${i}`,title:i=>`${i} Assistant`,welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:i=>`Pregunta a ${i}`,title:i=>`Asistente de ${i}`,welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function B(i){return(i||"").toLowerCase().startsWith("es")}function p(i,l){let t=(i||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(l==null?void 0:l.bg)||"#111827",o=t[1]||(l==null?void 0:l.text)||"#ffffff";return{bg:s,text:o}}var v=class extends HTMLElement{constructor(){super(...arguments);this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en"}}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","theme","start-open","floating-mode"]}connectedCallback(){this.root=this.attachShadow({mode:"open"}),this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0),this.render(),this.ensureSession()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,this.ensureSession()))}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!(!t&&!e)&&!(this.state.session&&!e))try{let s=this.getApiBase();if(e){let c=this.getLocaleOverride(),b=this.getThemeOverride();this.state.session={token:e,locale:c||this.state.locale,brand:"Aliigo",slug:"",theme:b},this.state.locale=c||this.state.locale,this.render();return}let o=new URL(`${s}/api/embed/session`);o.searchParams.set("key",t),o.searchParams.set("host",window.location.hostname);let r=await fetch(o.toString(),{method:"GET"}),n=await r.json().catch(()=>({}));if(!r.ok||!n.token){this.state.session=null,this.renderError(n.error||"Session error");return}let d=this.getLocaleOverride()||(B(n.locale||"en")?"es":"en");this.state.session={token:n.token,locale:d,brand:(n.brand||"Aliigo").trim(),slug:(n.slug||"").trim(),theme:n.theme||null},this.state.locale=d,this.render()}catch{this.renderError("Network error")}}renderError(e){this.ensureRoot(),this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${e}</div></div>
        </div>
      </div>
    `}css(){return`
    :host{ all: initial; display:block; height:100%; }

    .wrap{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; box-sizing:border-box; height:100%; }
    .wrap, .wrap *{ box-sizing:border-box; }

    /* floating can be fixed (client sites) or absolute (dashboard preview container) */
    .floating.fixed{ position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; }
    .floating.absolute{ position: absolute; right: 16px; bottom: 16px; z-index: 2147483647; }

    .inline{ width: 100%; height:auto; }
    .hero{ width: 100%; height:100%; max-width: 100%; margin: 0 auto; }

    .pill{
      border:0; cursor:pointer; font-weight:700;
      border-radius:999px; padding:12px 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      transition: background-color .18s ease, color .18s ease;
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

    .panel.inline{ width:100%; max-width:100%; }
    .panel.hero{ width:100%; max-width:100%; height:100%; } /* \u2705 key fix */

    .header{
      padding: 12px 14px;
      display:flex; align-items:center; justify-content:space-between;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      font-weight: 700;
      font-size: 14px;
      transition: background-color .18s ease, color .18s ease;
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
      transition: background-color .18s ease, color .18s ease;
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
      transition: background-color .18s ease, color .18s ease;
    }
    .send:disabled{ opacity:0.55; cursor:not-allowed; }

    @media (max-width: 520px){
      .floating.fixed{ left: 12px; right: 12px; bottom: 12px; }
      .panel{ width: 100%; height: 70vh; }
    }
  `}render(){this.ensureRoot();let e=this.getVariant(),t=this.state.session,s=this.getLocaleOverride()||this.state.locale,o=A[s],r=this.getThemeOverride()||(t==null?void 0:t.theme)||{},n=p(r.headerBg,{bg:"#111827",text:"#ffffff"}),u=p(r.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),d=p(r.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),c=p(r.sendBg,{bg:"#2563eb",text:"#ffffff"}),b=(t==null?void 0:t.brand)||"Aliigo",w=e!=="floating"?!0:this.state.open,k=this.getFloatingMode(),x=e==="floating"?`wrap floating ${k}`:e==="hero"?"wrap hero":"wrap inline",$=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",y=this.state.msgs,S=y.length===0?`<div class="row bot"><div class="bubble bot" style="background:${d.bg};color:${d.text};">${o.welcome}</div></div>`:y.map(a=>{let h=a.role==="user",T=h?`background:${u.bg};color:${u.text};`:`background:${d.bg};color:${d.text};`;return`
                <div class="row ${h?"user":"bot"}">
                  <div class="bubble ${h?"user":"bot"}" style="${T}">${L(a.content)}</div>
                </div>
              `}).join("");if(e==="floating"&&!w){this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${x}">
          <button class="pill" style="background:${c.bg};color:${c.text};">${o.pill(b)}</button>
        </div>
      `;let a=this.root.querySelector(".pill");a==null||a.addEventListener("click",()=>{this.state.open=!0,this.render(),this.scrollToBottomSoon()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${x}">
        <div class="${$}">
          <div class="header" style="background:${n.bg};color:${n.text};">
            <div>${o.title(b)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${n.text};">\xD7</button>`:""}
          </div>

          <div class="body">
            <div class="messages">${S}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${o.placeholder}" />
            <button class="send" type="submit" style="background:${c.bg};color:${c.text};" ${this.state.busy||!(t!=null&&t.token)?"disabled":""}>${o.send}</button>
          </form>
        </div>
      </div>
    `;let f=this.root.querySelector(".close");f==null||f.addEventListener("click",()=>{this.state.open=!1,this.render()});let m=this.root.querySelector(".form"),g=this.root.querySelector(".input");m==null||m.addEventListener("submit",a=>{a.preventDefault();let h=((g==null?void 0:g.value)||"").trim();h&&(g&&(g.value=""),this.send(h))}),this.scrollToBottomSoon()}scrollToBottomSoon(){let e=this.root.querySelector(".messages");e&&requestAnimationFrame(()=>{e.scrollTop=e.scrollHeight})}async send(e){let t=this.state.session;if(t!=null&&t.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.render();try{let s=this.getApiBase(),o=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t.token,conversationId:this.state.conversationId,message:e,locale:this.state.locale,channel:"web"})}),r=await o.json().catch(()=>({}));if(!o.ok){this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.error||"Error"}],this.state.busy=!1,this.render();return}r.conversationId&&(this.state.conversationId=r.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.reply||""}],this.state.busy=!1,this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.state.busy=!1,this.render()}}}};function L(i){return(i||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",v);})();
//# sourceMappingURL=aliigo-widget.js.map
