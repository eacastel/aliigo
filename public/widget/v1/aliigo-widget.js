"use strict";(()=>{function z(o){if(!Array.isArray(o))return;let a=[];for(let e of o){if(!e||typeof e!="object")continue;let t=e,s=t.type;if(s==="cta"){let n=typeof t.label=="string"?t.label:"",i=typeof t.url=="string"?t.url:"";n&&i&&a.push({type:"link",label:n,url:i});continue}if(s==="collect_lead"){let n=Array.isArray(t.fields)?t.fields.filter(r=>r==="name"||r==="email"||r==="phone"):[],i=typeof t.reason=="string"?t.reason:void 0;a.push({type:"lead_form",fields:n.length?n:["name","email"],reason:i});continue}}return a.length?a:void 0}var J={en:{pill:o=>o?`Ask ${o}`:"Chat",title:o=>o?`${o} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send",lead:{title:"Share your details",name:"Name",email:"Email",phone:"Phone",submit:"Send details",sent:"Thanks! We\u2019ll be in touch.",message:"Here are my contact details.",followUp:"Thanks \u2014 I\u2019ve got your details. Do you have any other questions? I can share pricing, show how the widget works, or help you get set up.",consent:"I agree to be contacted about my request.",consentNote:"Your information will only be used to follow up on this request."}},es:{pill:o=>o?`Pregunta a ${o}`:"Chat",title:o=>o?`Asistente de ${o}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar",lead:{title:"D\xE9janos tus datos",name:"Nombre",email:"Email",phone:"Tel\xE9fono",submit:"Enviar datos",sent:"\xA1Gracias! Te contactaremos.",message:"Aqu\xED tienes mis datos de contacto.",followUp:"Gracias \u2014 ya tengo tus datos. \xBFTienes alguna otra pregunta? Puedo compartir precios, ense\xF1arte c\xF3mo funciona el widget o ayudarte a empezar.",consent:"Acepto que me contacten sobre mi solicitud.",consentNote:"Usaremos estos datos solo para dar seguimiento a tu solicitud."}}};function X(o){return(o||"").toLowerCase().startsWith("es")}function L(o,a){let t=(o||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(a==null?void 0:a.bg)||"#111827",n=t[1]||(a==null?void 0:a.text)||"#ffffff";return{bg:s,text:n}}function U(o){return Math.max(0,Math.min(1,o))}function Q(o){let a=(o||"").trim().replace("#","");if(a.length===3){let e=parseInt(a[0]+a[0],16),t=parseInt(a[1]+a[1],16),s=parseInt(a[2]+a[2],16);return{r:e,g:t,b:s}}if(a.length===6){let e=parseInt(a.slice(0,2),16),t=parseInt(a.slice(2,4),16),s=parseInt(a.slice(4,6),16);return{r:e,g:t,b:s}}return null}function Z(o,a){let e=Q(o);return e?`rgba(${e.r}, ${e.g}, ${e.b}, ${U(a)})`:null}var H=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let e=document.body;this.parentElement!==e&&e.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,(e==="embed-key"||e==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let e=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(e<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},e+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let e=this.root.querySelector(".messages");if(!e||!this.pendingScroll)return;let t=this.pendingScroll;this.pendingScroll=null,t==="bottom"&&(e.scrollTop=e.scrollHeight),requestAnimationFrame(()=>{var n;let s=Math.max(0,e.scrollHeight-e.clientHeight);if(t==="bottom"){e.scrollTop=s;return}for(let i=this.state.msgs.length-1;i>=0;i--)if(((n=this.state.msgs[i])==null?void 0:n.role)==="assistant"){let r=this.root.querySelector(`#msg-${i}`);if(!r)return;let h=r.offsetTop-12;e.scrollTop=Math.max(0,Math.min(h,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let e=this.root.querySelector(".input");e==null||e.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let e="aliigo_visitor_session_v1";try{let t=localStorage.getItem(e);if(t&&t.length>=24)return t;let s=crypto.getRandomValues(new Uint8Array(16)),n=Array.from(s).map(i=>i.toString(16).padStart(2,"0")).join("");return localStorage.setItem(e,n),n}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let e=this.getEmbedKey(),t=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),n=e||t||"no-key";return`${this.STORAGE_PREFIX}:${n}:${s}`}loadPersisted(){try{let e=localStorage.getItem(this.storageKey());if(!e)return;let t=JSON.parse(e);t.theme&&(this.cachedTheme=t.theme),typeof t.brand=="string"&&(this.cachedBrand=t.brand);let s=typeof t.lastActiveAt=="number"?t.lastActiveAt:typeof t.savedAt=="number"?t.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof t.open=="boolean"&&(this.state.open=t.open),Array.isArray(t.msgs)&&(this.state.msgs=t.msgs),typeof t.conversationId=="string"&&(this.state.conversationId=t.conversationId),(t.locale==="en"||t.locale==="es")&&(this.state.locale=t.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(e=!0){try{let t=this.storageKey(),s=Date.now(),n=s,i;try{let f=localStorage.getItem(t);if(f){let l=JSON.parse(f);typeof l.savedAt=="number"&&(n=l.savedAt),typeof l.lastActiveAt=="number"&&(i=l.lastActiveAt)}}catch{}let r=e?s:i,h={savedAt:n,lastActiveAt:r,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(t,JSON.stringify(h)),this.state.msgs.length>0?this.lastActiveAtMs=e?s:r!=null?r:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),typeof t.panelBg=="string"&&(s.panelBg=t.panelBg),typeof t.panelOpacity=="number"&&(s.panelOpacity=t.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getHideHeader(){return(this.getAttribute("hide-header")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!t&&!e)return null;if(this.state.session&&!e)return this.state.session;try{let s=this.getApiBase();if(e){let l=this.getLocaleOverride(),g=this.getThemeOverride(),p=this.getBrandOverride();return this.state.session={token:e,locale:l||this.state.locale,brand:(p||"").trim(),slug:"",theme:g},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=l||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let n=new URL(`${s}/api/embed/session`);n.searchParams.set("key",t),n.searchParams.set("host",window.location.hostname);let i=await fetch(n.toString(),{method:"GET"}),r=await i.json().catch(()=>({}));if(!i.ok||!r.token)return this.state.session=null,this.renderError(r.error||"Session error"),null;let f=this.getLocaleOverride()||(X(r.locale||"en")?"es":"en");return this.state.session={token:r.token,locale:f,brand:(r.brand||"").trim(),slug:(r.slug||"").trim(),theme:r.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=f,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var t;this.state.session=null;let e=await this.ensureSession();return(t=e==null?void 0:e.token)!=null?t:null}renderError(e){this.ensureRoot(),this.root.innerHTML=`
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
    `}render(){var q;this.ensureRoot();let e=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((q=this.state.session)!=null&&q.theme)&&!this.sessionHydrated){let b=e==="floating"?`wrap floating ${this.getFloatingMode()}`:e==="hero"?"wrap hero":"wrap inline",d=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${b}">
            <div class="${d}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,n=this.getLocaleOverride()||this.state.locale,i=J[n],r=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},h=(r.panelBg||"").trim(),f=typeof r.panelOpacity=="number"?U(r.panelOpacity):1,l=h?Z(h,f):null,g=l?`style="--panel-bg:${l};"`:"",p=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),c=L(r.headerBg,{bg:"#111827",text:"#ffffff"}),u=L(r.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),$=L(r.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),T=L(r.sendBg,{bg:"#2563eb",text:"#ffffff"}),F=this.getHideHeader(),R=e!=="floating"?!0:this.state.open,C=R,D=C&&!this.lastRenderOpen;this.lastRenderOpen=C;let K=this.getFloatingMode(),N=e==="floating"?`wrap floating ${K}`:e==="hero"?"wrap hero":"wrap inline",_=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",j=D?`${_} animate-in`:_,V=F?`${j} no-header`:j,O=this.state.msgs,W=O.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${$.bg};--fg:${$.text};background:var(--bg);color:var(--fg);">
              ${i.welcome}
            </div>
          </div>`:O.map((b,d)=>{let y=b.role==="user",A=d===O.length-1,x=y?`--bg:${u.bg};--fg:${u.text};background:var(--bg);color:var(--fg);`:`--bg:${$.bg};--fg:${$.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${y?"user":"bot"}" id="msg-${d}">
                <div class="bubble ${y?"user":"bot"} ${A?"anim":""}" style="${x}">
                  ${te(b.content)}
                  ${!y&&Array.isArray(b.actions)&&b.actions.length?`<div class="actions">
                          ${b.actions.map(m=>{if(m.type==="link")return`<a class="action" href="${v(m.url)}" target="_blank" rel="noopener noreferrer">${v(m.label)}</a>`;if(m.type==="handoff")return`<button class="action-btn" type="button" data-action="handoff" data-i="${d}">${v(m.label)}</button>`;if(m.type==="lead_form"){let E=Array.isArray(m.fields)?m.fields:["name","email"],I=m.reason?`<div class="lead-reason">${v(m.reason)}</div>`:"",w=E.map(k=>{let G=k==="name"?i.lead.name:k==="phone"?i.lead.phone:i.lead.email,Y=k==="email"?"email":k==="phone"?"tel":"text";return`<label class="lead-field">
                                      <span class="lead-label">${v(G)}</span>
                                      <input class="lead-input" name="${k}" type="${Y}" required />
                                    </label>`}).join(""),B=`<label class="lead-consent">
                                  <input type="checkbox" name="consent" required />
                                  <span>${v(i.lead.consent)}</span>
                                </label>
                                <div class="lead-consent-note">${v(i.lead.consentNote)}</div>`;return`<form class="lead-form" data-action="lead-form" data-i="${d}">
                                  ${I}
                                  ${w}
                                  ${B}
                                  <button class="lead-submit" type="submit">${v(i.lead.submit)}</button>
                                </form>`}return""}).join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(e==="floating"&&!R){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${N}">
          <button class="pill" style="background:${T.bg};color:${T.text};">${i.pill(p)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(y=>{y.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let d=this.root.querySelector(".pill");d==null||d.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${N}">
      <div class="${V}" ${g}>
          ${F?"":`<div class="header" style="background:${c.bg};color:${c.text};">
            <div>${i.title(p)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${c.text};">\xD7</button>`:""}
          </div>`}

          <div class="body">
            <div class="messages">${W}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${i.placeholder}" />
            <button class="send" type="submit" style="background:${T.bg};color:${T.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${i.send}</button>
          </form>
        </div>
      </div>
    `;let M=this.root.querySelector(".close");M==null||M.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let P=this.root.querySelector(".form"),S=this.root.querySelector(".input");P==null||P.addEventListener("submit",b=>{b.preventDefault();let d=((S==null?void 0:S.value)||"").trim();d&&(S&&(S.value=""),this.pendingFocus=!0,this.send(d))}),this.root.querySelectorAll(".lead-form").forEach(b=>{let d=b;d.addEventListener("submit",y=>{var I;y.preventDefault();let A=new FormData(d),x={name:(A.get("name")||"").toString().trim(),email:(A.get("email")||"").toString().trim(),phone:(A.get("phone")||"").toString().trim(),consent:(A.get("consent")||"")==="on"};if(!x.name&&!x.email&&!x.phone||!x.consent)return;d.classList.add("sent");let m=d.querySelector(".lead-submit");m&&(m.textContent=i.lead.sent);let E=Number(d.dataset.i||"");if(!Number.isNaN(E)){let w=this.state.msgs[E];(I=w==null?void 0:w.actions)!=null&&I.length&&(w.actions=w.actions.filter(B=>B.type!=="lead_form"),this.state.msgs=[...this.state.msgs],this.pendingScroll="bottom",this.render())}this.send(i.lead.message,x,i.lead.followUp)})}),this.applyPendingScroll(),this.applyPendingFocus()}async send(e,t,s){let n=this.state.session;if(n!=null&&n.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let i=this.getApiBase(),r=await fetch(`${i}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:n.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),h=await r.json().catch(()=>({}));if(!r.ok){let l=(h.error||"").toLowerCase();if(r.status===403&&l.includes("session expired")){let g=await this.tryRefreshSessionToken();if(g){let p=await fetch(`${i}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:g,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),c=await p.json().catch(()=>({}));if(p.ok){c.conversationId&&(this.state.conversationId=c.conversationId);let u=z(c.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:c.reply||"",actions:u}],s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:c.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:h.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}h.conversationId&&(this.state.conversationId=h.conversationId);let f=z(h.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:h.reply||"",actions:f}],s&&(this.state.msgs=[...this.state.msgs,{role:"assistant",content:s}]),this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function v(o){return(o||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ee(o){return o.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function te(o){var h,f;let a=v(o||""),t=ee(a).split(/\r?\n/),s=l=>l.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),n=l=>s(l.join("<br/>")),i=t.findIndex(l=>/^\s*\d+\.\s+/.test(l));if(i!==-1){let l=t.slice(0,i).filter(c=>c.trim()!==""),g=[],p=[];for(let c=i;c<t.length;c++){let u=(h=t[c])!=null?h:"";if(/^\s*\d+\.\s+/.test(u)){g.push(u.replace(/^\s*\d+\.\s+/,"").trim());continue}u.trim()!==""&&p.push(u)}return g.length===0?n(t):`
      ${l.length?`<div class="lead">${n(l)}</div>`:""}
      <ol class="list">
        ${g.map(c=>`<li>${s(c)}</li>`).join("")}
      </ol>
      ${p.length?`<div class="tail">${n(p)}</div>`:""}
    `}let r=t.findIndex(l=>/^\s*[-•]\s+/.test(l));if(r!==-1){let l=t.slice(0,r).filter(c=>c.trim()!==""),g=[],p=[];for(let c=r;c<t.length;c++){let u=(f=t[c])!=null?f:"";if(/^\s*[-•]\s+/.test(u)){g.push(u.replace(/^\s*[-•]\s+/,"").trim());continue}u.trim()!==""&&p.push(u)}return g.length===0?n(t):`
      ${l.length?`<div class="lead">${n(l)}</div>`:""}
      <ul class="list">
        ${g.map(c=>`<li>${s(c)}</li>`).join("")}
      </ul>
      ${p.length?`<div class="tail">${n(p)}</div>`:""}
    `}return n(t)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",H);})();
//# sourceMappingURL=aliigo-widget.js.map
