"use strict";(()=>{function j(o){if(!Array.isArray(o))return;let a=[];for(let e of o){if(!e||typeof e!="object")continue;let t=e,s=t.type;if(s==="cta"){let r=typeof t.label=="string"?t.label:"",i=typeof t.url=="string"?t.url:"";r&&i&&a.push({type:"link",label:r,url:i});continue}if(s==="collect_lead"){let r=Array.isArray(t.fields)?t.fields.filter(n=>n==="name"||n==="email"||n==="phone"):[],i=typeof t.reason=="string"?t.reason:void 0;a.push({type:"lead_form",fields:r.length?r:["name","email"],reason:i});continue}}return a.length?a:void 0}var J={en:{pill:o=>o?`Ask ${o}`:"Chat",title:o=>o?`${o} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send",lead:{title:"Share your details",name:"Name",email:"Email",phone:"Phone",submit:"Send details",sent:"Thanks! We\u2019ll be in touch.",message:"Here are my contact details.",consent:"I agree to be contacted about my request.",consentNote:"Your information will only be used to follow up on this request."}},es:{pill:o=>o?`Pregunta a ${o}`:"Chat",title:o=>o?`Asistente de ${o}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar",lead:{title:"D\xE9janos tus datos",name:"Nombre",email:"Email",phone:"Tel\xE9fono",submit:"Enviar datos",sent:"\xA1Gracias! Te contactaremos.",message:"Aqu\xED tienes mis datos de contacto.",consent:"Acepto que me contacten sobre mi solicitud.",consentNote:"Usaremos estos datos solo para dar seguimiento a tu solicitud."}}};function X(o){return(o||"").toLowerCase().startsWith("es")}function T(o,a){let t=(o||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(a==null?void 0:a.bg)||"#111827",r=t[1]||(a==null?void 0:a.text)||"#ffffff";return{bg:s,text:r}}function _(o){return Math.max(0,Math.min(1,o))}function Q(o){let a=(o||"").trim().replace("#","");if(a.length===3){let e=parseInt(a[0]+a[0],16),t=parseInt(a[1]+a[1],16),s=parseInt(a[2]+a[2],16);return{r:e,g:t,b:s}}if(a.length===6){let e=parseInt(a.slice(0,2),16),t=parseInt(a.slice(2,4),16),s=parseInt(a.slice(4,6),16);return{r:e,g:t,b:s}}return null}function Z(o,a){let e=Q(o);return e?`rgba(${e.r}, ${e.g}, ${e.b}, ${_(a)})`:null}var O=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let e=document.body;this.parentElement!==e&&e.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,(e==="embed-key"||e==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let e=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(e<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},e+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let e=this.root.querySelector(".messages");if(!e||!this.pendingScroll)return;let t=this.pendingScroll;this.pendingScroll=null,t==="bottom"&&(e.scrollTop=e.scrollHeight),requestAnimationFrame(()=>{var r;let s=Math.max(0,e.scrollHeight-e.clientHeight);if(t==="bottom"){e.scrollTop=s;return}for(let i=this.state.msgs.length-1;i>=0;i--)if(((r=this.state.msgs[i])==null?void 0:r.role)==="assistant"){let n=this.root.querySelector(`#msg-${i}`);if(!n)return;let u=n.offsetTop-12;e.scrollTop=Math.max(0,Math.min(u,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let e=this.root.querySelector(".input");e==null||e.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let e="aliigo_visitor_session_v1";try{let t=localStorage.getItem(e);if(t&&t.length>=24)return t;let s=crypto.getRandomValues(new Uint8Array(16)),r=Array.from(s).map(i=>i.toString(16).padStart(2,"0")).join("");return localStorage.setItem(e,r),r}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let e=this.getEmbedKey(),t=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),r=e||t||"no-key";return`${this.STORAGE_PREFIX}:${r}:${s}`}loadPersisted(){try{let e=localStorage.getItem(this.storageKey());if(!e)return;let t=JSON.parse(e);t.theme&&(this.cachedTheme=t.theme),typeof t.brand=="string"&&(this.cachedBrand=t.brand);let s=typeof t.lastActiveAt=="number"?t.lastActiveAt:typeof t.savedAt=="number"?t.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof t.open=="boolean"&&(this.state.open=t.open),Array.isArray(t.msgs)&&(this.state.msgs=t.msgs),typeof t.conversationId=="string"&&(this.state.conversationId=t.conversationId),(t.locale==="en"||t.locale==="es")&&(this.state.locale=t.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(e=!0){try{let t=this.storageKey(),s=Date.now(),r=s,i;try{let m=localStorage.getItem(t);if(m){let l=JSON.parse(m);typeof l.savedAt=="number"&&(r=l.savedAt),typeof l.lastActiveAt=="number"&&(i=l.lastActiveAt)}}catch{}let n=e?s:i,u={savedAt:r,lastActiveAt:n,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(t,JSON.stringify(u)),this.state.msgs.length>0?this.lastActiveAtMs=e?s:n!=null?n:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),typeof t.panelBg=="string"&&(s.panelBg=t.panelBg),typeof t.panelOpacity=="number"&&(s.panelOpacity=t.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getHideHeader(){return(this.getAttribute("hide-header")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!t&&!e)return null;if(this.state.session&&!e)return this.state.session;try{let s=this.getApiBase();if(e){let l=this.getLocaleOverride(),p=this.getThemeOverride(),d=this.getBrandOverride();return this.state.session={token:e,locale:l||this.state.locale,brand:(d||"").trim(),slug:"",theme:p},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=l||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let r=new URL(`${s}/api/embed/session`);r.searchParams.set("key",t),r.searchParams.set("host",window.location.hostname);let i=await fetch(r.toString(),{method:"GET"}),n=await i.json().catch(()=>({}));if(!i.ok||!n.token)return this.state.session=null,this.renderError(n.error||"Session error"),null;let m=this.getLocaleOverride()||(X(n.locale||"en")?"es":"en");return this.state.session={token:n.token,locale:m,brand:(n.brand||"").trim(),slug:(n.slug||"").trim(),theme:n.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=m,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var t;this.state.session=null;let e=await this.ensureSession();return(t=e==null?void 0:e.token)!=null?t:null}renderError(e){this.ensureRoot(),this.root.innerHTML=`
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
    `}render(){var C;this.ensureRoot();let e=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((C=this.state.session)!=null&&C.theme)&&!this.sessionHydrated){let b=e==="floating"?`wrap floating ${this.getFloatingMode()}`:e==="hero"?"wrap hero":"wrap inline",h=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${b}">
            <div class="${h}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,r=this.getLocaleOverride()||this.state.locale,i=J[r],n=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},u=(n.panelBg||"").trim(),m=typeof n.panelOpacity=="number"?_(n.panelOpacity):1,l=u?Z(u,m):null,p=l?`style="--panel-bg:${l};"`:"",d=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),c=T(n.headerBg,{bg:"#111827",text:"#ffffff"}),f=T(n.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),k=T(n.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),$=T(n.sendBg,{bg:"#2563eb",text:"#ffffff"}),M=this.getHideHeader(),B=e!=="floating"?!0:this.state.open,P=B,q=P&&!this.lastRenderOpen;this.lastRenderOpen=P;let N=this.getFloatingMode(),H=e==="floating"?`wrap floating ${N}`:e==="hero"?"wrap hero":"wrap inline",R=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",F=q?`${R} animate-in`:R,z=M?`${F} no-header`:F,E=this.state.msgs,K=E.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${k.bg};--fg:${k.text};background:var(--bg);color:var(--fg);">
              ${i.welcome}
            </div>
          </div>`:E.map((b,h)=>{let y=b.role==="user",w=h===E.length-1,x=y?`--bg:${f.bg};--fg:${f.text};background:var(--bg);color:var(--fg);`:`--bg:${k.bg};--fg:${k.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${y?"user":"bot"}" id="msg-${h}">
                <div class="bubble ${y?"user":"bot"} ${w?"anim":""}" style="${x}">
                  ${te(b.content)}
                  ${!y&&Array.isArray(b.actions)&&b.actions.length?`<div class="actions">
                          ${b.actions.map(g=>{if(g.type==="link")return`<a class="action" href="${v(g.url)}" target="_blank" rel="noopener noreferrer">${v(g.label)}</a>`;if(g.type==="handoff")return`<button class="action-btn" type="button" data-action="handoff" data-i="${h}">${v(g.label)}</button>`;if(g.type==="lead_form"){let U=Array.isArray(g.fields)?g.fields:["name","email"],V=g.reason?`<div class="lead-reason">${v(g.reason)}</div>`:"",D=U.map(S=>{let G=S==="name"?i.lead.name:S==="phone"?i.lead.phone:i.lead.email,Y=S==="email"?"email":S==="phone"?"tel":"text";return`<label class="lead-field">
                                      <span class="lead-label">${v(G)}</span>
                                      <input class="lead-input" name="${S}" type="${Y}" required />
                                    </label>`}).join(""),W=`<label class="lead-consent">
                                  <input type="checkbox" name="consent" required />
                                  <span>${v(i.lead.consent)}</span>
                                </label>
                                <div class="lead-consent-note">${v(i.lead.consentNote)}</div>`;return`<form class="lead-form" data-action="lead-form">${V}${D}${W}<button class="lead-submit" type="submit">${v(i.lead.submit)}</button></form>`}return""}).join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(e==="floating"&&!B){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${H}">
          <button class="pill" style="background:${$.bg};color:${$.text};">${i.pill(d)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(y=>{y.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let h=this.root.querySelector(".pill");h==null||h.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${H}">
      <div class="${z}" ${p}>
          ${M?"":`<div class="header" style="background:${c.bg};color:${c.text};">
            <div>${i.title(d)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${c.text};">\xD7</button>`:""}
          </div>`}

          <div class="body">
            <div class="messages">${K}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${i.placeholder}" />
            <button class="send" type="submit" style="background:${$.bg};color:${$.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${i.send}</button>
          </form>
        </div>
      </div>
    `;let I=this.root.querySelector(".close");I==null||I.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let L=this.root.querySelector(".form"),A=this.root.querySelector(".input");L==null||L.addEventListener("submit",b=>{b.preventDefault();let h=((A==null?void 0:A.value)||"").trim();h&&(A&&(A.value=""),this.pendingFocus=!0,this.send(h))}),this.root.querySelectorAll(".lead-form").forEach(b=>{let h=b;h.addEventListener("submit",y=>{y.preventDefault();let w=new FormData(h),x={name:(w.get("name")||"").toString().trim(),email:(w.get("email")||"").toString().trim(),phone:(w.get("phone")||"").toString().trim(),consent:(w.get("consent")||"")==="on"};if(!x.name&&!x.email&&!x.phone||!x.consent)return;h.classList.add("sent");let g=h.querySelector(".lead-submit");g&&(g.textContent=i.lead.sent),this.send(i.lead.message,x)})}),this.applyPendingScroll(),this.applyPendingFocus()}async send(e,t){let s=this.state.session;if(s!=null&&s.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let r=this.getApiBase(),i=await fetch(`${r}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:s.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),n=await i.json().catch(()=>({}));if(!i.ok){let m=(n.error||"").toLowerCase();if(i.status===403&&m.includes("session expired")){let l=await this.tryRefreshSessionToken();if(l){let p=await fetch(`${r}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:l,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web",...t?{lead:t}:{}})}),d=await p.json().catch(()=>({}));if(p.ok){d.conversationId&&(this.state.conversationId=d.conversationId);let c=j(d.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.reply||"",actions:c}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}n.conversationId&&(this.state.conversationId=n.conversationId);let u=j(n.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.reply||"",actions:u}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function v(o){return(o||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ee(o){return o.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function te(o){var u,m;let a=v(o||""),t=ee(a).split(/\r?\n/),s=l=>l.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),r=l=>s(l.join("<br/>")),i=t.findIndex(l=>/^\s*\d+\.\s+/.test(l));if(i!==-1){let l=t.slice(0,i).filter(c=>c.trim()!==""),p=[],d=[];for(let c=i;c<t.length;c++){let f=(u=t[c])!=null?u:"";if(/^\s*\d+\.\s+/.test(f)){p.push(f.replace(/^\s*\d+\.\s+/,"").trim());continue}f.trim()!==""&&d.push(f)}return p.length===0?r(t):`
      ${l.length?`<div class="lead">${r(l)}</div>`:""}
      <ol class="list">
        ${p.map(c=>`<li>${s(c)}</li>`).join("")}
      </ol>
      ${d.length?`<div class="tail">${r(d)}</div>`:""}
    `}let n=t.findIndex(l=>/^\s*[-•]\s+/.test(l));if(n!==-1){let l=t.slice(0,n).filter(c=>c.trim()!==""),p=[],d=[];for(let c=n;c<t.length;c++){let f=(m=t[c])!=null?m:"";if(/^\s*[-•]\s+/.test(f)){p.push(f.replace(/^\s*[-•]\s+/,"").trim());continue}f.trim()!==""&&d.push(f)}return p.length===0?r(t):`
      ${l.length?`<div class="lead">${r(l)}</div>`:""}
      <ul class="list">
        ${p.map(c=>`<li>${s(c)}</li>`).join("")}
      </ul>
      ${d.length?`<div class="tail">${r(d)}</div>`:""}
    `}return r(t)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",O);})();
//# sourceMappingURL=aliigo-widget.js.map
