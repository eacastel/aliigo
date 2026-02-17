"use strict";(()=>{function D(o){if(!Array.isArray(o))return;let a=[];for(let e of o){if(!e||typeof e!="object")continue;let t=e,s=t.type;if(s==="cta"){let i=typeof t.label=="string"?t.label:"",r=typeof t.url=="string"?t.url:"";i&&r&&a.push({type:"link",label:i,url:r});continue}if(s==="collect_lead"){let i=Array.isArray(t.fields)?t.fields.filter(n=>n==="name"||n==="email"||n==="phone"):[],r=typeof t.reason=="string"?t.reason:void 0;a.push({type:"lead_form",fields:i.length?i:["name","email"],reason:r});continue}}return a.length?a:void 0}var P={en:{pill:o=>o?`Ask ${o}`:"Chat",title:o=>o?`${o} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send",errors:{sessionRefreshed:"Session refreshed. Please try again.",session:"Session error",network:"Network error",generic:"Something went wrong. Please try again."},lead:{title:"Share your details",name:"Name",email:"Email",phone:"Phone",submit:"Send details",sent:"Thanks! We\u2019ll be in touch.",message:"Here are my contact details.",hiddenMessage:"Lead submitted.",followUp:"Thanks \u2014 I\u2019ve got your details. Do you have any other questions? I can share pricing, show how the widget works, or help you get set up.",consent:"I agree to be contacted about my request.",consentNote:"Your information will only be used to follow up on this request."}},es:{pill:o=>o?`Pregunta a ${o}`:"Chat",title:o=>o?`Asistente de ${o}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar",errors:{sessionRefreshed:"Sesi\xF3n actualizada. Int\xE9ntalo de nuevo.",session:"Error de sesi\xF3n",network:"Error de red",generic:"Algo sali\xF3 mal. Int\xE9ntalo de nuevo."},lead:{title:"D\xE9janos tus datos",name:"Nombre",email:"Email",phone:"Tel\xE9fono",submit:"Enviar datos",sent:"\xA1Gracias! Te contactaremos.",message:"Aqu\xED tienes mis datos de contacto.",hiddenMessage:"Datos enviados.",followUp:"Gracias \u2014 ya tengo tus datos. \xBFTienes alguna otra pregunta? Puedo compartir precios, ense\xF1arte c\xF3mo funciona el widget o ayudarte a empezar.",consent:"Acepto que me contacten sobre mi solicitud.",consentNote:"Usaremos estos datos solo para dar seguimiento a tu solicitud."}}};function te(o){return(o||"").toLowerCase().startsWith("es")}function q(o,a){let t=(o||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(a==null?void 0:a.bg)||"#111827",i=t[1]||(a==null?void 0:a.text)||"#ffffff";return{bg:s,text:i}}function J(o){return Math.max(0,Math.min(1,o))}function se(o){let a=(o||"").trim().replace("#","");if(a.length===3){let e=parseInt(a[0]+a[0],16),t=parseInt(a[1]+a[1],16),s=parseInt(a[2]+a[2],16);return{r:e,g:t,b:s}}if(a.length===6){let e=parseInt(a.slice(0,2),16),t=parseInt(a.slice(2,4),16),s=parseInt(a.slice(4,6),16);return{r:e,g:t,b:s}}return null}function ie(o,a){let e=se(o);return e?`rgba(${e.r}, ${e.g}, ${e.b}, ${J(a)})`:null}var K=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=720*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","show-branding","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"&&!this.hasAttribute("data-no-teleport")){let e=document.body;this.parentElement!==e&&e.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,(e==="embed-key"||e==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let e=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(e<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},e+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let e=this.root.querySelector(".messages");if(!e||!this.pendingScroll)return;let t=this.pendingScroll;this.pendingScroll=null,t==="bottom"&&(e.scrollTop=e.scrollHeight),requestAnimationFrame(()=>{var i;let s=Math.max(0,e.scrollHeight-e.clientHeight);if(t==="bottom"){e.scrollTop=s;return}for(let r=this.state.msgs.length-1;r>=0;r--)if(((i=this.state.msgs[r])==null?void 0:i.role)==="assistant"){let n=this.root.querySelector(`#msg-${r}`);if(!n)return;let l=n.offsetTop-12;e.scrollTop=Math.max(0,Math.min(l,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let e=this.root.querySelector(".input");e==null||e.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let e="aliigo_visitor_session_v1";try{let t=localStorage.getItem(e);if(t&&t.length>=24)return t;let s=crypto.getRandomValues(new Uint8Array(16)),i=Array.from(s).map(r=>r.toString(16).padStart(2,"0")).join("");return localStorage.setItem(e,i),i}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let e=this.getEmbedKey(),t=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),i=e||t||"no-key";return`${this.STORAGE_PREFIX}:${i}:${s}`}loadPersisted(){try{let e=localStorage.getItem(this.storageKey());if(!e)return;let t=JSON.parse(e);t.theme&&(this.cachedTheme=t.theme),typeof t.brand=="string"&&(this.cachedBrand=t.brand);let s=typeof t.lastActiveAt=="number"?t.lastActiveAt:typeof t.savedAt=="number"?t.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof t.open=="boolean"&&(this.state.open=t.open),Array.isArray(t.msgs)&&(this.state.msgs=t.msgs),typeof t.conversationId=="string"&&(this.state.conversationId=t.conversationId),(t.locale==="en"||t.locale==="es")&&(this.state.locale=t.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(e=!0){try{let t=this.storageKey(),s=Date.now(),i=s,r;try{let m=localStorage.getItem(t);if(m){let c=JSON.parse(m);typeof c.savedAt=="number"&&(i=c.savedAt),typeof c.lastActiveAt=="number"&&(r=c.lastActiveAt)}}catch{}let n=e?s:r,l={savedAt:i,lastActiveAt:n,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(t,JSON.stringify(l)),this.state.msgs.length>0?this.lastActiveAtMs=e?s:n!=null?n:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}detectWebsiteLocale(){var e;try{let t=(document.documentElement.lang||"").toLowerCase();if(t.startsWith("es"))return"es";if(t.startsWith("en"))return"en";let s=(((e=document.querySelector('meta[property="og:locale"],meta[name="og:locale"]'))==null?void 0:e.getAttribute("content"))||"").toLowerCase();if(s.startsWith("es"))return"es";if(s.startsWith("en"))return"en";let i=window.location.pathname.toLowerCase();if(/(^|\/)es(\/|$)/.test(i))return"es";if(/(^|\/)en(\/|$)/.test(i))return"en"}catch{}return null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),typeof t.panelBg=="string"&&(s.panelBg=t.panelBg),typeof t.panelOpacity=="number"&&(s.panelOpacity=t.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getShowBrandingOverride(){let e=(this.getAttribute("show-branding")||"").trim().toLowerCase();return e?e==="true"?!0:e==="false"?!1:null:null}getHideHeader(){return(this.getAttribute("hide-header")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){var s;let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!t&&!e)return null;if(this.state.session&&!e)return this.state.session;try{let i=this.getApiBase();if(e){let h=this.getLocaleOverride(),S=this.getThemeOverride(),k=this.getBrandOverride();return this.state.session={token:e,locale:h||this.state.locale,brand:(k||"").trim(),slug:"",theme:S,show_branding:(s=this.getShowBrandingOverride())!=null?s:!1,locale_auto:!1},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=h||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let r=new URL(`${i}/api/embed/session`);r.searchParams.set("key",t),r.searchParams.set("host",window.location.hostname);let n=await fetch(r.toString(),{method:"GET"}),l=await n.json().catch(()=>({}));if(!n.ok||!l.token){this.state.session=null;let h=this.getLocaleOverride()||this.state.locale,S=P[h];return this.renderError(l.error||S.errors.session),null}let m=this.getLocaleOverride(),c=te(l.locale||"en")?"es":"en",p=!!l.locale_auto,f=p?this.detectWebsiteLocale():null,d=m||f||c;return this.state.session={token:l.token,locale:d,brand:(l.brand||"").trim(),slug:(l.slug||"").trim(),theme:l.theme||null,show_branding:!!l.show_branding,locale_auto:p},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=d,this.savePersisted(!1),this.render(),this.state.session}catch{let i=this.getLocaleOverride()||this.state.locale,r=P[i];return this.renderError(r.errors.network),null}}async tryRefreshSessionToken(){var t;this.state.session=null;let e=await this.ensureSession();return(t=e==null?void 0:e.token)!=null?t:null}async refreshSessionIfStale(){var s;this.checkExpiryNow();let e=this.lastActiveAtMs?Date.now()-this.lastActiveAtMs:0,t=1500*1e3;(e>=t||!((s=this.state.session)!=null&&s.token))&&await this.tryRefreshSessionToken()}renderError(e){this.ensureRoot();let t=this.getLocaleOverride()||this.state.locale,s=P[t];this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${e||s.errors.session}</div></div>
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

      .powered-wrap {
        flex: 0 0 auto;
        border-top: 1px solid rgba(255,255,255,0.14);
        background: #0b0b0c;
        padding: 12px 12px 8px;
        display: flex;
        justify-content: flex-end;
      }
      .powered-link {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        text-decoration: none;
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .powered-prefix {
        color: #d4d4d8;
        font-weight: 500;
        font-style: italic;
      }
      .powered-logo {
        width: 64px;
        height: 21px;
        object-fit: contain;
        display: inline-block;
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
    `}render(){var V,G;this.ensureRoot();let e=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((V=this.state.session)!=null&&V.theme)&&!this.sessionHydrated){let u=e==="floating"?`wrap floating ${this.getFloatingMode()}`:e==="hero"?"wrap hero":"wrap inline",g=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${u}">
            <div class="${g}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,i=this.getLocaleOverride(),r=i||this.state.locale;if(!i&&(s!=null&&s.locale_auto)){let u=this.detectWebsiteLocale();u&&u!==r&&(r=u,this.state.locale=u)}let n=P[r],l=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},m=(l.panelBg||"").trim(),c=typeof l.panelOpacity=="number"?J(l.panelOpacity):1,p=m?ie(m,c):null,f=p?`style="--panel-bg:${p};"`:"",d=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),h=q(l.headerBg,{bg:"#111827",text:"#ffffff"}),S=q(l.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),k=q(l.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),M=q(l.sendBg,{bg:"#2563eb",text:"#ffffff"}),O=this.getHideHeader(),_=(G=this.getShowBrandingOverride())!=null?G:!!(s!=null&&s.show_branding),y=e!=="floating"?!0:this.state.open,R=y,x=R&&!this.lastRenderOpen;this.lastRenderOpen=R;let $=this.getFloatingMode(),w=e==="floating"?`wrap floating ${$}${R?" open":""}`:e==="hero"?"wrap hero":"wrap inline",C=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",F=x?`${C} animate-in`:C,Y=O?`${F} no-header`:F,z=this.state.msgs,X=z.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${k.bg};--fg:${k.text};background:var(--bg);color:var(--fg);">
              ${n.welcome}
            </div>
          </div>`:z.map((u,g)=>{let E=u.role==="user",B=g===z.length-1,L=E?`--bg:${S.bg};--fg:${S.text};background:var(--bg);color:var(--fg);`:`--bg:${k.bg};--fg:${k.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${E?"user":"bot"}" id="msg-${g}">
                <div class="bubble ${E?"user":"bot"} ${B?"anim":""}" style="${L}">
                  ${re(u.content)}
                  ${!E&&Array.isArray(u.actions)&&u.actions.length?`<div class="actions">
                          ${u.actions.map(b=>{if(b.type==="link")return`<a class="action" href="${A(b.url)}" target="_blank" rel="noopener noreferrer">${A(b.label)}</a>`;if(b.type==="handoff")return`<button class="action-btn" type="button" data-action="handoff" data-i="${g}">${A(b.label)}</button>`;if(b.type==="lead_form"){let H=Array.isArray(b.fields)?b.fields:["name","email"],j=b.reason?`<div class="lead-reason">${A(b.reason)}</div>`:"",v=H.map(I=>{let Z=I==="name"?n.lead.name:I==="phone"?n.lead.phone:n.lead.email,ee=I==="email"?"email":I==="phone"?"tel":"text";return`<label class="lead-field">
                                      <span class="lead-label">${A(Z)}</span>
                                      <input class="lead-input" name="${I}" type="${ee}" required />
                                    </label>`}).join(""),N=`<label class="lead-consent">
                                  <input type="checkbox" name="consent" required />
                                  <span>${A(n.lead.consent)}</span>
                                </label>
                                <div class="lead-consent-note">${A(n.lead.consentNote)}</div>`;return`<form class="lead-form" data-action="lead-form" data-i="${g}">
                                  ${j}
                                  ${v}
                                  ${N}
                                  <button class="lead-submit" type="submit">${A(n.lead.submit)}</button>
                                </form>`}return""}).join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(e==="floating"&&!y){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${w}">
          <button class="pill" style="background:${M.bg};color:${M.text};">${n.pill(d)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(E=>{E.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let g=this.root.querySelector(".pill");g==null||g.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}let Q=`${this.getApiBase()}/widget/v1/aliigo.svg`;this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${w}">
      <div class="${Y}" ${f}>
          ${O?"":`<div class="header" style="background:${h.bg};color:${h.text};">
            <div>${n.title(d)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${h.text};">\xD7</button>`:""}
          </div>`}

          <div class="body">
            <div class="messages">${X}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${n.placeholder}" />
            <button class="send" type="submit" style="background:${M.bg};color:${M.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${n.send}</button>
          </form>
          ${_?`<div class="powered-wrap">
            <a class="powered-link" href="https://aliigo.com" target="_blank" rel="noopener noreferrer">
              <span class="powered-prefix">Powered by</span>
              <img class="powered-logo" src="${Q}" alt="Aliigo logo" />
            </a>
          </div>`:""}
        </div>
      </div>
    `;let U=this.root.querySelector(".close");U==null||U.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let W=this.root.querySelector(".form"),T=this.root.querySelector(".input");W==null||W.addEventListener("submit",u=>{u.preventDefault();let g=((T==null?void 0:T.value)||"").trim();g&&(T&&(T.value=""),window.matchMedia("(max-width: 768px)").matches&&(T==null||T.blur()),this.pendingFocus=!0,this.send(g))}),this.root.querySelectorAll(".lead-form").forEach(u=>{let g=u;g.addEventListener("submit",E=>{var j;E.preventDefault();let B=new FormData(g),L={name:(B.get("name")||"").toString().trim(),email:(B.get("email")||"").toString().trim(),phone:(B.get("phone")||"").toString().trim(),consent:(B.get("consent")||"")==="on"};if(!L.name&&!L.email&&!L.phone||!L.consent)return;if(window.matchMedia("(max-width: 768px)").matches){let v=document.activeElement;v==null||v.blur()}g.classList.add("sent");let b=g.querySelector(".lead-submit");b&&(b.textContent=n.lead.sent);let H=Number(g.dataset.i||"");if(!Number.isNaN(H)){let v=this.state.msgs[H];(j=v==null?void 0:v.actions)!=null&&j.length&&(v.actions=v.actions.filter(I=>I.type!=="lead_form"));let N=this.state.msgs.slice();N.splice(H,1),this.state.msgs=N,this.pendingScroll="bottom",this.render()}this.send(n.lead.hiddenMessage,L,n.lead.followUp,{silentUser:!0,suppressReply:!0})})}),this.applyPendingScroll(),this.applyPendingFocus()}async send(e,t,s,i){var l;let r=(l=P[this.state.locale])!=null?l:P.en;await this.refreshSessionIfStale();let n=this.state.session;if(n!=null&&n.token){this.state.busy=!0,i!=null&&i.silentUser||(this.state.msgs=[...this.state.msgs,{role:"user",content:e}]),this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let m=this.getApiBase(),c=await fetch(`${m}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:n.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),p=await c.json().catch(()=>({}));if(!c.ok){let h=(p.error||"").toLowerCase(),S=c.status===401||c.status===403,k=h.includes("session expired");if(S){let O=await this.tryRefreshSessionToken();if(O){let _=await fetch(`${m}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:O,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),y=await _.json().catch(()=>({}));if(_.ok){y.conversationId&&(this.state.conversationId=y.conversationId);let x=D(y.actions),$=t?x==null?void 0:x.filter(w=>w.type!=="lead_form"):x;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:y.reply||"",actions:$}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}if((y.error||"").toLowerCase().includes("session expired")){this.state.conversationId=null;let x=await fetch(`${m}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:O,conversationId:null,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),$=await x.json().catch(()=>({}));if(x.ok){$.conversationId&&(this.state.conversationId=$.conversationId);let w=D($.actions),C=t?w==null?void 0:w.filter(F=>F.type!=="lead_form"):w;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:$.reply||"",actions:C}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}let R=(y.error||"").toLowerCase().includes("session expired")?r.errors.sessionRefreshed:y.error||r.errors.generic;this.state.msgs=[...this.state.msgs,{role:"assistant",content:R}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}let M=k?r.errors.sessionRefreshed:p.error||r.errors.generic;this.state.msgs=[...this.state.msgs,{role:"assistant",content:M}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}p.conversationId&&(this.state.conversationId=p.conversationId);let f=D(p.actions),d=t?f==null?void 0:f.filter(h=>h.type!=="lead_form"):f;i!=null&&i.suppressReply||(this.state.msgs=[...this.state.msgs,{role:"assistant",content:p.reply||"",actions:d}]),s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function A(o){return(o||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ne(o){return o.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function re(o){var l,m;let a=A(o||""),t=ne(a).split(/\r?\n/),s=c=>c.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),i=c=>s(c.join("<br/>")),r=t.findIndex(c=>/^\s*\d+\.\s+/.test(c));if(r!==-1){let c=t.slice(0,r).filter(d=>d.trim()!==""),p=[],f=[];for(let d=r;d<t.length;d++){let h=(l=t[d])!=null?l:"";if(/^\s*\d+\.\s+/.test(h)){p.push(h.replace(/^\s*\d+\.\s+/,"").trim());continue}h.trim()!==""&&f.push(h)}return p.length===0?i(t):`
      ${c.length?`<div class="lead">${i(c)}</div>`:""}
      <ol class="list">
        ${p.map(d=>`<li>${s(d)}</li>`).join("")}
      </ol>
      ${f.length?`<div class="tail">${i(f)}</div>`:""}
    `}let n=t.findIndex(c=>/^\s*[-•]\s+/.test(c));if(n!==-1){let c=t.slice(0,n).filter(d=>d.trim()!==""),p=[],f=[];for(let d=n;d<t.length;d++){let h=(m=t[d])!=null?m:"";if(/^\s*[-•]\s+/.test(h)){p.push(h.replace(/^\s*[-•]\s+/,"").trim());continue}h.trim()!==""&&f.push(h)}return p.length===0?i(t):`
      ${c.length?`<div class="lead">${i(c)}</div>`:""}
      <ul class="list">
        ${p.map(d=>`<li>${s(d)}</li>`).join("")}
      </ul>
      ${f.length?`<div class="tail">${i(f)}</div>`:""}
    `}return i(t)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",K);})();
//# sourceMappingURL=aliigo-widget.js.map
