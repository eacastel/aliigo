"use strict";(()=>{function D(o){if(!Array.isArray(o))return;let l=[];for(let t of o){if(!t||typeof t!="object")continue;let e=t,s=e.type;if(s==="cta"){let i=typeof e.label=="string"?e.label:"",n=typeof e.url=="string"?e.url:"";i&&n&&l.push({type:"link",label:i,url:n});continue}if(s==="collect_lead"){let i=Array.isArray(e.fields)?e.fields.filter(r=>r==="name"||r==="email"||r==="phone"):[],n=typeof e.reason=="string"?e.reason:void 0;l.push({type:"lead_form",fields:i.length?i:["name","email"],reason:n});continue}}return l.length?l:void 0}var B={en:{pill:o=>o?`Ask ${o}`:"Chat",title:o=>o?`${o} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send",errors:{sessionRefreshed:"Session refreshed. Please try again.",session:"Session error",network:"Network error",generic:"Something went wrong. Please try again."},lead:{title:"Share your details",name:"Name",email:"Email",phone:"Phone",submit:"Send details",sent:"Thanks! We\u2019ll be in touch.",message:"Here are my contact details.",hiddenMessage:"Lead submitted.",followUp:"Thanks \u2014 I\u2019ve got your details. Do you have any other questions? I can share pricing, show how the widget works, or help you get set up.",consent:"I agree to be contacted about my request.",consentNote:"Your information will only be used to follow up on this request."}},es:{pill:o=>o?`Pregunta a ${o}`:"Chat",title:o=>o?`Asistente de ${o}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar",errors:{sessionRefreshed:"Sesi\xF3n actualizada. Int\xE9ntalo de nuevo.",session:"Error de sesi\xF3n",network:"Error de red",generic:"Algo sali\xF3 mal. Int\xE9ntalo de nuevo."},lead:{title:"D\xE9janos tus datos",name:"Nombre",email:"Email",phone:"Tel\xE9fono",submit:"Enviar datos",sent:"\xA1Gracias! Te contactaremos.",message:"Aqu\xED tienes mis datos de contacto.",hiddenMessage:"Datos enviados.",followUp:"Gracias \u2014 ya tengo tus datos. \xBFTienes alguna otra pregunta? Puedo compartir precios, ense\xF1arte c\xF3mo funciona el widget o ayudarte a empezar.",consent:"Acepto que me contacten sobre mi solicitud.",consentNote:"Usaremos estos datos solo para dar seguimiento a tu solicitud."}}};function X(o){return(o||"").toLowerCase().startsWith("es")}function _(o,l){let e=(o||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=e[0]||(l==null?void 0:l.bg)||"#111827",i=e[1]||(l==null?void 0:l.text)||"#ffffff";return{bg:s,text:i}}function W(o){return Math.max(0,Math.min(1,o))}function Q(o){let l=(o||"").trim().replace("#","");if(l.length===3){let t=parseInt(l[0]+l[0],16),e=parseInt(l[1]+l[1],16),s=parseInt(l[2]+l[2],16);return{r:t,g:e,b:s}}if(l.length===6){let t=parseInt(l.slice(0,2),16),e=parseInt(l.slice(2,4),16),s=parseInt(l.slice(4,6),16);return{r:t,g:e,b:s}}return null}function Z(o,l){let t=Q(o);return t?`rgba(${t.r}, ${t.g}, ${t.b}, ${W(l)})`:null}var K=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=720*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"&&!this.hasAttribute("data-no-teleport")){let t=document.body;this.parentElement!==t&&t.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(t,e,s){e!==s&&(this.ensureRoot(),this.render(),(t==="embed-key"||t==="api-base"||t==="session-token")&&(this.state.session=null,(t==="embed-key"||t==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let t=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(t<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},t+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let t=this.root.querySelector(".messages");if(!t||!this.pendingScroll)return;let e=this.pendingScroll;this.pendingScroll=null,e==="bottom"&&(t.scrollTop=t.scrollHeight),requestAnimationFrame(()=>{var i;let s=Math.max(0,t.scrollHeight-t.clientHeight);if(e==="bottom"){t.scrollTop=s;return}for(let n=this.state.msgs.length-1;n>=0;n--)if(((i=this.state.msgs[n])==null?void 0:i.role)==="assistant"){let r=this.root.querySelector(`#msg-${n}`);if(!r)return;let f=r.offsetTop-12;t.scrollTop=Math.max(0,Math.min(f,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let t=this.root.querySelector(".input");t==null||t.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let t="aliigo_visitor_session_v1";try{let e=localStorage.getItem(t);if(e&&e.length>=24)return e;let s=crypto.getRandomValues(new Uint8Array(16)),i=Array.from(s).map(n=>n.toString(16).padStart(2,"0")).join("");return localStorage.setItem(t,i),i}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let t=this.getEmbedKey(),e=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),i=t||e||"no-key";return`${this.STORAGE_PREFIX}:${i}:${s}`}loadPersisted(){try{let t=localStorage.getItem(this.storageKey());if(!t)return;let e=JSON.parse(t);e.theme&&(this.cachedTheme=e.theme),typeof e.brand=="string"&&(this.cachedBrand=e.brand);let s=typeof e.lastActiveAt=="number"?e.lastActiveAt:typeof e.savedAt=="number"?e.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof e.open=="boolean"&&(this.state.open=e.open),Array.isArray(e.msgs)&&(this.state.msgs=e.msgs),typeof e.conversationId=="string"&&(this.state.conversationId=e.conversationId),(e.locale==="en"||e.locale==="es")&&(this.state.locale=e.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(t=!0){try{let e=this.storageKey(),s=Date.now(),i=s,n;try{let u=localStorage.getItem(e);if(u){let a=JSON.parse(u);typeof a.savedAt=="number"&&(i=a.savedAt),typeof a.lastActiveAt=="number"&&(n=a.lastActiveAt)}}catch{}let r=t?s:n,f={savedAt:i,lastActiveAt:r,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(e,JSON.stringify(f)),this.state.msgs.length>0?this.lastActiveAtMs=t?s:r!=null?r:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let t=(this.getAttribute("variant")||"floating").toLowerCase();return t==="inline"||t==="hero"?t:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let t=(this.getAttribute("locale")||"").trim().toLowerCase();return t?t.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let t=(this.getAttribute("theme")||"").trim();if(!t)return null;try{let e=JSON.parse(t),s={};return typeof e.headerBg=="string"&&(s.headerBg=e.headerBg),typeof e.bubbleUser=="string"&&(s.bubbleUser=e.bubbleUser),typeof e.bubbleBot=="string"&&(s.bubbleBot=e.bubbleBot),typeof e.sendBg=="string"&&(s.sendBg=e.sendBg),typeof e.panelBg=="string"&&(s.panelBg=e.panelBg),typeof e.panelOpacity=="number"&&(s.panelOpacity=e.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getHideHeader(){return(this.getAttribute("hide-header")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let t=this.getSessionTokenOverride(),e=this.getEmbedKey();if(!e&&!t)return null;if(this.state.session&&!t)return this.state.session;try{let s=this.getApiBase();if(t){let a=this.getLocaleOverride(),d=this.getThemeOverride(),p=this.getBrandOverride();return this.state.session={token:t,locale:a||this.state.locale,brand:(p||"").trim(),slug:"",theme:d},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=a||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let i=new URL(`${s}/api/embed/session`);i.searchParams.set("key",e),i.searchParams.set("host",window.location.hostname);let n=await fetch(i.toString(),{method:"GET"}),r=await n.json().catch(()=>({}));if(!n.ok||!r.token){this.state.session=null;let a=this.getLocaleOverride()||this.state.locale,d=B[a];return this.renderError(r.error||d.errors.session),null}let u=this.getLocaleOverride()||(X(r.locale||"en")?"es":"en");return this.state.session={token:r.token,locale:u,brand:(r.brand||"").trim(),slug:(r.slug||"").trim(),theme:r.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=u,this.savePersisted(!1),this.render(),this.state.session}catch{let s=this.getLocaleOverride()||this.state.locale,i=B[s];return this.renderError(i.errors.network),null}}async tryRefreshSessionToken(){var e;this.state.session=null;let t=await this.ensureSession();return(e=t==null?void 0:t.token)!=null?e:null}async refreshSessionIfStale(){var s;this.checkExpiryNow();let t=this.lastActiveAtMs?Date.now()-this.lastActiveAtMs:0,e=1500*1e3;(t>=e||!((s=this.state.session)!=null&&s.token))&&await this.tryRefreshSessionToken()}renderError(t){this.ensureRoot();let e=this.getLocaleOverride()||this.state.locale,s=B[e];this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${t||s.errors.session}</div></div>
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
      @media (max-width: 640px) {
        .floating.fixed {
          right: 16px;
          left: auto;
          bottom: 16px;
        }
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

      .lead-form {
        margin-top: 8px;
        display: grid;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,0.08);
        background: rgba(255,255,255,0.75);
      }
      .lead-form .lead-reason { font-size: 13px; color:#374151; }
      .lead-field { display: grid; gap: 4px; }
      .lead-label { font-size: 12px; color:#6b7280; }
      .lead-input {
        height: 36px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        border-radius: 10px;
        padding: 0 10px;
        font-size: 14px;
        color: #111827;
        outline: none;
      }
      .lead-input:focus { border-color:#d1d5db; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
      .lead-submit {
        height: 36px;
        border: 0;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        background: #111827;
        color: #ffffff;
      }
      .lead-consent {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        font-size: 12px;
        color: #374151;
      }
      .lead-consent input {
        margin-top: 2px;
      }
      .lead-consent-note {
        font-size: 11px;
        color: #6b7280;
        margin-top: -2px;
      }
      .lead-form.sent .lead-input,
      .lead-form.sent .lead-submit {
        opacity: 0.6;
        pointer-events: none;
      }


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

      @media (max-width: 640px) {
        .floating.fixed { right: 16px; left: auto; bottom: 16px; }
        .floating.fixed.open {
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          padding: 0 16px;
        }
        .floating.fixed.open .panel { width: min(420px, 100%); }

        :host([mobile-fullscreen="true"]) .floating.fixed { left: 0; right: 0; bottom: 0; }

        /* Only go fullscreen if explicitly enabled */
        :host([mobile-fullscreen="true"]) .floating.fixed .panel {
          width: 100%;
          height: 100%;
          max-height: 100%;
          border-radius: 0;
        }
      }
    `}render(){var V;this.ensureRoot();let t=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((V=this.state.session)!=null&&V.theme)&&!this.sessionHydrated){let b=t==="floating"?`wrap floating ${this.getFloatingMode()}`:t==="hero"?"wrap hero":"wrap inline",h=t==="hero"?"panel hero":t==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${b}">
            <div class="${h}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,i=this.getLocaleOverride()||this.state.locale,n=B[i],r=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},f=(r.panelBg||"").trim(),u=typeof r.panelOpacity=="number"?W(r.panelOpacity):1,a=f?Z(f,u):null,d=a?`style="--panel-bg:${a};"`:"",p=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),c=_(r.headerBg,{bg:"#111827",text:"#ffffff"}),g=_(r.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),I=_(r.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),M=_(r.sendBg,{bg:"#2563eb",text:"#ffffff"}),C=this.getHideHeader(),L=t!=="floating"?!0:this.state.open,O=L,x=O&&!this.lastRenderOpen;this.lastRenderOpen=O;let j=this.getFloatingMode(),y=t==="floating"?`wrap floating ${j}${O?" open":""}`:t==="hero"?"wrap hero":"wrap inline",w=t==="hero"?"panel hero":t==="inline"?"panel inline":"panel",A=x?`${w} animate-in`:w,q=C?`${A} no-header`:A,R=this.state.msgs,G=R.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${I.bg};--fg:${I.text};background:var(--bg);color:var(--fg);">
              ${n.welcome}
            </div>
          </div>`:R.map((b,h)=>{let T=b.role==="user",P=h===R.length-1,$=T?`--bg:${g.bg};--fg:${g.text};background:var(--bg);color:var(--fg);`:`--bg:${I.bg};--fg:${I.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${T?"user":"bot"}" id="msg-${h}">
                <div class="bubble ${T?"user":"bot"} ${P?"anim":""}" style="${$}">
                  ${te(b.content)}
                  ${!T&&Array.isArray(b.actions)&&b.actions.length?`<div class="actions">
                          ${b.actions.map(m=>{if(m.type==="link")return`<a class="action" href="${S(m.url)}" target="_blank" rel="noopener noreferrer">${S(m.label)}</a>`;if(m.type==="handoff")return`<button class="action-btn" type="button" data-action="handoff" data-i="${h}">${S(m.label)}</button>`;if(m.type==="lead_form"){let H=Array.isArray(m.fields)?m.fields:["name","email"],F=m.reason?`<div class="lead-reason">${S(m.reason)}</div>`:"",v=H.map(E=>{let J=E==="name"?n.lead.name:E==="phone"?n.lead.phone:n.lead.email,Y=E==="email"?"email":E==="phone"?"tel":"text";return`<label class="lead-field">
                                      <span class="lead-label">${S(J)}</span>
                                      <input class="lead-input" name="${E}" type="${Y}" required />
                                    </label>`}).join(""),N=`<label class="lead-consent">
                                  <input type="checkbox" name="consent" required />
                                  <span>${S(n.lead.consent)}</span>
                                </label>
                                <div class="lead-consent-note">${S(n.lead.consentNote)}</div>`;return`<form class="lead-form" data-action="lead-form" data-i="${h}">
                                  ${F}
                                  ${v}
                                  ${N}
                                  <button class="lead-submit" type="submit">${S(n.lead.submit)}</button>
                                </form>`}return""}).join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(t==="floating"&&!L){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${y}">
          <button class="pill" style="background:${M.bg};color:${M.text};">${n.pill(p)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(T=>{T.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let h=this.root.querySelector(".pill");h==null||h.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${y}">
      <div class="${q}" ${d}>
          ${C?"":`<div class="header" style="background:${c.bg};color:${c.text};">
            <div>${n.title(p)}</div>
            ${t==="floating"?`<button class="close" aria-label="Close" style="color:${c.text};">\xD7</button>`:""}
          </div>`}

          <div class="body">
            <div class="messages">${G}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${n.placeholder}" />
            <button class="send" type="submit" style="background:${M.bg};color:${M.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${n.send}</button>
          </form>
        </div>
      </div>
    `;let z=this.root.querySelector(".close");z==null||z.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let U=this.root.querySelector(".form"),k=this.root.querySelector(".input");U==null||U.addEventListener("submit",b=>{b.preventDefault();let h=((k==null?void 0:k.value)||"").trim();h&&(k&&(k.value=""),window.matchMedia("(max-width: 768px)").matches&&(k==null||k.blur()),this.pendingFocus=!0,this.send(h))}),this.root.querySelectorAll(".lead-form").forEach(b=>{let h=b;h.addEventListener("submit",T=>{var F;T.preventDefault();let P=new FormData(h),$={name:(P.get("name")||"").toString().trim(),email:(P.get("email")||"").toString().trim(),phone:(P.get("phone")||"").toString().trim(),consent:(P.get("consent")||"")==="on"};if(!$.name&&!$.email&&!$.phone||!$.consent)return;if(window.matchMedia("(max-width: 768px)").matches){let v=document.activeElement;v==null||v.blur()}h.classList.add("sent");let m=h.querySelector(".lead-submit");m&&(m.textContent=n.lead.sent);let H=Number(h.dataset.i||"");if(!Number.isNaN(H)){let v=this.state.msgs[H];(F=v==null?void 0:v.actions)!=null&&F.length&&(v.actions=v.actions.filter(E=>E.type!=="lead_form"));let N=this.state.msgs.slice();N.splice(H,1),this.state.msgs=N,this.pendingScroll="bottom",this.render()}this.send(n.lead.hiddenMessage,$,n.lead.followUp,{silentUser:!0,suppressReply:!0})})}),this.applyPendingScroll(),this.applyPendingFocus()}async send(t,e,s,i){var f;let n=(f=B[this.state.locale])!=null?f:B.en;await this.refreshSessionIfStale();let r=this.state.session;if(r!=null&&r.token){this.state.busy=!0,i!=null&&i.silentUser||(this.state.msgs=[...this.state.msgs,{role:"user",content:t}]),this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let u=this.getApiBase(),a=await fetch(`${u}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:r.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web",...e?{lead:e}:{}})}),d=await a.json().catch(()=>({}));if(!a.ok){let g=(d.error||"").toLowerCase(),I=a.status===401||a.status===403,M=g.includes("session expired");if(I){let L=await this.tryRefreshSessionToken();if(L){let O=await fetch(`${u}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:L,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web",...e?{lead:e}:{}})}),x=await O.json().catch(()=>({}));if(O.ok){x.conversationId&&(this.state.conversationId=x.conversationId);let y=D(x.actions),w=e?y==null?void 0:y.filter(A=>A.type!=="lead_form"):y;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:x.reply||"",actions:w}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}if((x.error||"").toLowerCase().includes("session expired")){this.state.conversationId=null;let y=await fetch(`${u}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:L,conversationId:null,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web",...e?{lead:e}:{}})}),w=await y.json().catch(()=>({}));if(y.ok){w.conversationId&&(this.state.conversationId=w.conversationId);let A=D(w.actions),q=e?A==null?void 0:A.filter(R=>R.type!=="lead_form"):A;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:w.reply||"",actions:q}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}let j=(x.error||"").toLowerCase().includes("session expired")?n.errors.sessionRefreshed:x.error||n.errors.generic;this.state.msgs=[...this.state.msgs,{role:"assistant",content:j}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}let C=M?n.errors.sessionRefreshed:d.error||n.errors.generic;this.state.msgs=[...this.state.msgs,{role:"assistant",content:C}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}d.conversationId&&(this.state.conversationId=d.conversationId);let p=D(d.actions),c=e?p==null?void 0:p.filter(g=>g.type!=="lead_form"):p;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.reply||"",actions:c}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function S(o){return(o||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ee(o){return o.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function te(o){var f,u;let l=S(o||""),e=ee(l).split(/\r?\n/),s=a=>a.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),i=a=>s(a.join("<br/>")),n=e.findIndex(a=>/^\s*\d+\.\s+/.test(a));if(n!==-1){let a=e.slice(0,n).filter(c=>c.trim()!==""),d=[],p=[];for(let c=n;c<e.length;c++){let g=(f=e[c])!=null?f:"";if(/^\s*\d+\.\s+/.test(g)){d.push(g.replace(/^\s*\d+\.\s+/,"").trim());continue}g.trim()!==""&&p.push(g)}return d.length===0?i(e):`
      ${a.length?`<div class="lead">${i(a)}</div>`:""}
      <ol class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ol>
      ${p.length?`<div class="tail">${i(p)}</div>`:""}
    `}let r=e.findIndex(a=>/^\s*[-•]\s+/.test(a));if(r!==-1){let a=e.slice(0,r).filter(c=>c.trim()!==""),d=[],p=[];for(let c=r;c<e.length;c++){let g=(u=e[c])!=null?u:"";if(/^\s*[-•]\s+/.test(g)){d.push(g.replace(/^\s*[-•]\s+/,"").trim());continue}g.trim()!==""&&p.push(g)}return d.length===0?i(e):`
      ${a.length?`<div class="lead">${i(a)}</div>`:""}
      <ul class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ul>
      ${p.length?`<div class="tail">${i(p)}</div>`:""}
    `}return i(e)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",K);})();
//# sourceMappingURL=aliigo-widget.js.map
