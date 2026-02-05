"use strict";(()=>{function R(r){if(!Array.isArray(r))return;let a=[];for(let e of r){if(!e||typeof e!="object")continue;let t=e,s=t.type;if(s==="cta"){let i=typeof t.label=="string"?t.label:"",n=typeof t.url=="string"?t.url:"";i&&n&&a.push({type:"link",label:i,url:n});continue}if(s==="collect_lead"){a.push({type:"handoff",label:"Talk to a person"});continue}}return a.length?a:void 0}var K={en:{pill:r=>r?`Ask ${r}`:"Chat",title:r=>r?`${r} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:r=>r?`Pregunta a ${r}`:"Chat",title:r=>r?`Asistente de ${r}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function V(r){return(r||"").toLowerCase().startsWith("es")}function A(r,a){let t=(r||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(a==null?void 0:a.bg)||"#111827",i=t[1]||(a==null?void 0:a.text)||"#ffffff";return{bg:s,text:i}}function F(r){return Math.max(0,Math.min(1,r))}function U(r){let a=(r||"").trim().replace("#","");if(a.length===3){let e=parseInt(a[0]+a[0],16),t=parseInt(a[1]+a[1],16),s=parseInt(a[2]+a[2],16);return{r:e,g:t,b:s}}if(a.length===6){let e=parseInt(a.slice(0,2),16),t=parseInt(a.slice(2,4),16),s=parseInt(a.slice(4,6),16);return{r:e,g:t,b:s}}return null}function W(r,a){let e=U(r);return e?`rgba(${e.r}, ${e.g}, ${e.b}, ${F(a)})`:null}var E=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let e=document.body;this.parentElement!==e&&e.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,(e==="embed-key"||e==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let e=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(e<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},e+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let e=this.root.querySelector(".messages");if(!e||!this.pendingScroll)return;let t=this.pendingScroll;this.pendingScroll=null,t==="bottom"&&(e.scrollTop=e.scrollHeight),requestAnimationFrame(()=>{var i;let s=Math.max(0,e.scrollHeight-e.clientHeight);if(t==="bottom"){e.scrollTop=s;return}for(let n=this.state.msgs.length-1;n>=0;n--)if(((i=this.state.msgs[n])==null?void 0:i.role)==="assistant"){let o=this.root.querySelector(`#msg-${n}`);if(!o)return;let g=o.offsetTop-12;e.scrollTop=Math.max(0,Math.min(g,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let e=this.root.querySelector(".input");e==null||e.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let e="aliigo_visitor_session_v1";try{let t=localStorage.getItem(e);if(t&&t.length>=24)return t;let s=crypto.getRandomValues(new Uint8Array(16)),i=Array.from(s).map(n=>n.toString(16).padStart(2,"0")).join("");return localStorage.setItem(e,i),i}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let e=this.getEmbedKey(),t=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),i=e||t||"no-key";return`${this.STORAGE_PREFIX}:${i}:${s}`}loadPersisted(){try{let e=localStorage.getItem(this.storageKey());if(!e)return;let t=JSON.parse(e);t.theme&&(this.cachedTheme=t.theme),typeof t.brand=="string"&&(this.cachedBrand=t.brand);let s=typeof t.lastActiveAt=="number"?t.lastActiveAt:typeof t.savedAt=="number"?t.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof t.open=="boolean"&&(this.state.open=t.open),Array.isArray(t.msgs)&&(this.state.msgs=t.msgs),typeof t.conversationId=="string"&&(this.state.conversationId=t.conversationId),(t.locale==="en"||t.locale==="es")&&(this.state.locale=t.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(e=!0){try{let t=this.storageKey(),s=Date.now(),i=s,n;try{let p=localStorage.getItem(t);if(p){let l=JSON.parse(p);typeof l.savedAt=="number"&&(i=l.savedAt),typeof l.lastActiveAt=="number"&&(n=l.lastActiveAt)}}catch{}let o=e?s:n,g={savedAt:i,lastActiveAt:o,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(t,JSON.stringify(g)),this.state.msgs.length>0?this.lastActiveAtMs=e?s:o!=null?o:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),typeof t.panelBg=="string"&&(s.panelBg=t.panelBg),typeof t.panelOpacity=="number"&&(s.panelOpacity=t.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getHideHeader(){return(this.getAttribute("hide-header")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!t&&!e)return null;if(this.state.session&&!e)return this.state.session;try{let s=this.getApiBase();if(e){let l=this.getLocaleOverride(),d=this.getThemeOverride(),h=this.getBrandOverride();return this.state.session={token:e,locale:l||this.state.locale,brand:(h||"").trim(),slug:"",theme:d},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=l||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let i=new URL(`${s}/api/embed/session`);i.searchParams.set("key",t),i.searchParams.set("host",window.location.hostname);let n=await fetch(i.toString(),{method:"GET"}),o=await n.json().catch(()=>({}));if(!n.ok||!o.token)return this.state.session=null,this.renderError(o.error||"Session error"),null;let p=this.getLocaleOverride()||(V(o.locale||"en")?"es":"en");return this.state.session={token:o.token,locale:p,brand:(o.brand||"").trim(),slug:(o.slug||"").trim(),theme:o.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=p,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var t;this.state.session=null;let e=await this.ensureSession();return(t=e==null?void 0:e.token)!=null?t:null}renderError(e){this.ensureRoot(),this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${e}</div></div>
        </div>
      </div>
    `}css(){return`
      :host { all: initial; display: block; }
      :host([floating-mode="absolute"]) { position: relative; width: 100%; height: 100%; display: block; }

      .wrap {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
      }
      .wrap * { box-sizing: border-box; }

      /* --- Positioning --- */
      .floating.fixed {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 99999;
      }
      .floating.absolute {
        position: absolute;
        inset: 0;
        z-index: 99999;
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        padding: 20px;
      }
      .floating.absolute .panel {
        max-width: 100%;
        max-height: 100%;
      }
      .inline { width: 100%; }
      .hero { width: 100%; height: 100%; max-width: 100%; margin: 0 auto; }

      /* --- Pill (Launcher) --- */
      .pill {
        border: 0; cursor: pointer; font-weight: 600;
        border-radius: 99px; padding: 14px 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-size: 15px;
        display: flex; align-items: center; gap: 8px;
      }
      .pill:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
      .pill:active { transform: translateY(0); }

      /* --- Main Panel --- */
      .panel {
        width: 380px;
        height: 600px;
        max-height: 80vh;

        background: var(--panel-bg, #ffffff); /* NEW */
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
      }

      .panel.animate-in {
      animation: panel-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .panel.inline { width: 100%; max-width: 100%; height: 500px; box-shadow: none; border: 1px solid #e5e7eb; }
      .panel.hero { width: 100%; max-width: 100%; height: 100%; box-shadow: none; border: none; border-radius: 0; }
      .panel.no-header .messages { padding-top: 24px; }

      /* --- Header --- */
      .header {
        padding: 16px 20px;
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        font-weight: 600;
        font-size: 16px;
        letter-spacing: -0.01em;
      }
      .close {
        border: 0; background: transparent; cursor: pointer;
        font-size: 24px; line-height: 1; opacity: 0.6;
        padding: 4px; margin: -4px;
        transition: opacity 0.2s;
      }
      .close:hover { opacity: 1; }

      /* --- Body & Messages --- */
      .body {
        flex: 1;
        min-height: 0;
        position: relative;
        background: transparent; /* NEW */
      }
      .messages {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px;
      }

      .row {
        margin-top: 12px;
        display: flex;
        width: 100%;
      }
      .row.user { justify-content: flex-end; }
      .row.bot { justify-content: flex-start; }

      /* --- Bubbles --- */
      .bubble {
        display: block;
        position: relative;
        max-width: 85%;
        padding: 10px 16px;
        border-radius: 18px;
        font-size: 15px;
        line-height: 1.5;
        word-wrap: break-word;
        white-space: normal;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        transform-origin: bottom center;
      }

      .bubble.anim {
        animation: message-enter 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }

      .bubble.user {
        border-bottom-right-radius: 4px;
        margin-left: 40px;
      }

      .bubble.bot {
        border-bottom-left-radius: 4px;
        margin-right: 40px;
        border: 1px solid rgba(0,0,0,0.04);
      }

      .bubble strong { font-weight: 600; }
      .bubble .list { margin: 8px 0 0 0; padding-left: 18px; }
      .bubble .list li { margin: 4px 0; }

      /* --- Input Area --- */
      .form {
        flex: 0 0 auto;
        display: flex;
        gap: 10px;
        padding: 16px;
        border-top: 1px solid rgba(0,0,0,0.06);
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(6px);
      }

      /* --- Actions (buttons/links under assistant messages) --- */
      .actions { margin-top: 8px; display:flex; flex-wrap:wrap; gap:8px; }
      .action, .action-btn {
        display:inline-flex; align-items:center; justify-content:center;
        padding:10px 12px; border-radius:12px; font-weight:600; font-size:14px;
        border:1px solid rgba(0,0,0,0.10); background:#fff; color:#111827;
        text-decoration:none; cursor:pointer;
      }
      .action:hover, .action-btn:hover { border-color: rgba(0,0,0,0.18); }


      .input {
        flex: 1;
        height: 44px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 22px;
        padding: 0 16px;
        font-size: 15px;
        outline: none;
        transition: all 0.2s ease;
        color: #111827;
      }
      .input:focus {
        background: #ffffff;
        border-color: #d1d5db;
        box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
      }
      .input::placeholder { color: #9ca3af; }

      .send {
        height: 44px;
        padding: 0 20px;
        border: 0;
        border-radius: 22px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform 0.1s ease, opacity 0.2s;
      }
      .send:active { transform: scale(0.96); }
      .send:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }

      @keyframes message-enter {
        0% { opacity: 0; transform: translateY(10px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes panel-enter {
        0% { opacity: 0; transform: translateY(20px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (max-width: 480px) {
      .floating.fixed { left: 0; right: 0; bottom: 0; }

      /* Only go fullscreen if explicitly enabled */
      :host([mobile-fullscreen="true"]) .floating.fixed .panel {
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
    `}render(){var H;this.ensureRoot();let e=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((H=this.state.session)!=null&&H.theme)&&!this.sessionHydrated){let f=e==="floating"?`wrap floating ${this.getFloatingMode()}`:e==="hero"?"wrap hero":"wrap inline",b=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${f}">
            <div class="${b}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,i=this.getLocaleOverride()||this.state.locale,n=K[i],o=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},g=(o.panelBg||"").trim(),p=typeof o.panelOpacity=="number"?F(o.panelOpacity):1,l=g?W(g,p):null,d=l?`style="--panel-bg:${l};"`:"",h=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),c=A(o.headerBg,{bg:"#111827",text:"#ffffff"}),u=A(o.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),x=A(o.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),w=A(o.sendBg,{bg:"#2563eb",text:"#ffffff"}),I=this.getHideHeader(),O=e!=="floating"?!0:this.state.open,L=O,C=L&&!this.lastRenderOpen;this.lastRenderOpen=L;let j=this.getFloatingMode(),M=e==="floating"?`wrap floating ${j}`:e==="hero"?"wrap hero":"wrap inline",B=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",P=C?`${B} animate-in`:B,_=I?`${P} no-header`:P,k=this.state.msgs,N=k.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${x.bg};--fg:${x.text};background:var(--bg);color:var(--fg);">
              ${n.welcome}
            </div>
          </div>`:k.map((f,b)=>{let m=f.role==="user",z=b===k.length-1,q=m?`--bg:${u.bg};--fg:${u.text};background:var(--bg);color:var(--fg);`:`--bg:${x.bg};--fg:${x.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${m?"user":"bot"}" id="msg-${b}">
                <div class="bubble ${m?"user":"bot"} ${z?"anim":""}" style="${q}">
                  ${G(f.content)}
                  ${!m&&Array.isArray(f.actions)&&f.actions.length?`<div class="actions">
                          ${f.actions.map(y=>y.type==="link"?`<a class="action" href="${S(y.url)}" target="_blank" rel="noopener noreferrer">${S(y.label)}</a>`:y.type==="handoff"?`<button class="action-btn" type="button" data-action="handoff" data-i="${b}">${S(y.label)}</button>`:"").join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(e==="floating"&&!O){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${M}">
          <button class="pill" style="background:${w.bg};color:${w.text};">${n.pill(h)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(m=>{m.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let b=this.root.querySelector(".pill");b==null||b.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${M}">
      <div class="${_}" ${d}>
          ${I?"":`<div class="header" style="background:${c.bg};color:${c.text};">
            <div>${n.title(h)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${c.text};">\xD7</button>`:""}
          </div>`}

          <div class="body">
            <div class="messages">${N}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${n.placeholder}" />
            <button class="send" type="submit" style="background:${w.bg};color:${w.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${n.send}</button>
          </form>
        </div>
      </div>
    `;let T=this.root.querySelector(".close");T==null||T.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let $=this.root.querySelector(".form"),v=this.root.querySelector(".input");$==null||$.addEventListener("submit",f=>{f.preventDefault();let b=((v==null?void 0:v.value)||"").trim();b&&(v&&(v.value=""),this.pendingFocus=!0,this.send(b))}),this.applyPendingScroll(),this.applyPendingFocus()}async send(e){let t=this.state.session;if(t!=null&&t.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let s=this.getApiBase(),i=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web"})}),n=await i.json().catch(()=>({}));if(!i.ok){let g=(n.error||"").toLowerCase();if(i.status===403&&g.includes("session expired")){let p=await this.tryRefreshSessionToken();if(p){let l=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:p,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web"})}),d=await l.json().catch(()=>({}));if(l.ok){d.conversationId&&(this.state.conversationId=d.conversationId);let h=R(d.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.reply||"",actions:h}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}n.conversationId&&(this.state.conversationId=n.conversationId);let o=R(n.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.reply||"",actions:o}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function S(r){return(r||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function D(r){return r.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function G(r){var g,p;let a=S(r||""),t=D(a).split(/\r?\n/),s=l=>l.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),i=l=>s(l.join("<br/>")),n=t.findIndex(l=>/^\s*\d+\.\s+/.test(l));if(n!==-1){let l=t.slice(0,n).filter(c=>c.trim()!==""),d=[],h=[];for(let c=n;c<t.length;c++){let u=(g=t[c])!=null?g:"";if(/^\s*\d+\.\s+/.test(u)){d.push(u.replace(/^\s*\d+\.\s+/,"").trim());continue}u.trim()!==""&&h.push(u)}return d.length===0?i(t):`
      ${l.length?`<div class="lead">${i(l)}</div>`:""}
      <ol class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ol>
      ${h.length?`<div class="tail">${i(h)}</div>`:""}
    `}let o=t.findIndex(l=>/^\s*[-•]\s+/.test(l));if(o!==-1){let l=t.slice(0,o).filter(c=>c.trim()!==""),d=[],h=[];for(let c=o;c<t.length;c++){let u=(p=t[c])!=null?p:"";if(/^\s*[-•]\s+/.test(u)){d.push(u.replace(/^\s*[-•]\s+/,"").trim());continue}u.trim()!==""&&h.push(u)}return d.length===0?i(t):`
      ${l.length?`<div class="lead">${i(l)}</div>`:""}
      <ul class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ul>
      ${h.length?`<div class="tail">${i(h)}</div>`:""}
    `}return i(t)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",E);})();
//# sourceMappingURL=aliigo-widget.js.map
