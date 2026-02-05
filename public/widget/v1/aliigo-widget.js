"use strict";(()=>{function P(r){if(!Array.isArray(r))return;let a=[];for(let t of r){if(!t||typeof t!="object")continue;let e=t,s=e.type;if(s==="cta"){let i=typeof e.label=="string"?e.label:"",n=typeof e.url=="string"?e.url:"";i&&n&&a.push({type:"link",label:i,url:n});continue}if(s==="collect_lead"){a.push({type:"handoff",label:"Talk to a person"});continue}}return a.length?a:void 0}var z={en:{pill:r=>r?`Ask ${r}`:"Chat",title:r=>r?`${r} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:r=>r?`Pregunta a ${r}`:"Chat",title:r=>r?`Asistente de ${r}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function q(r){return(r||"").toLowerCase().startsWith("es")}function A(r,a){let e=(r||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=e[0]||(a==null?void 0:a.bg)||"#111827",i=e[1]||(a==null?void 0:a.text)||"#ffffff";return{bg:s,text:i}}function R(r){return Math.max(0,Math.min(1,r))}function K(r){let a=(r||"").trim().replace("#","");if(a.length===3){let t=parseInt(a[0]+a[0],16),e=parseInt(a[1]+a[1],16),s=parseInt(a[2]+a[2],16);return{r:t,g:e,b:s}}if(a.length===6){let t=parseInt(a.slice(0,2),16),e=parseInt(a.slice(2,4),16),s=parseInt(a.slice(4,6),16);return{r:t,g:e,b:s}}return null}function V(r,a){let t=K(r);return t?`rgba(${t.r}, ${t.g}, ${t.b}, ${R(a)})`:null}var E=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let t=document.body;this.parentElement!==t&&t.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(t,e,s){e!==s&&(this.ensureRoot(),this.render(),(t==="embed-key"||t==="api-base"||t==="session-token")&&(this.state.session=null,(t==="embed-key"||t==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let t=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(t<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},t+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let t=this.root.querySelector(".messages");if(!t||!this.pendingScroll)return;let e=this.pendingScroll;this.pendingScroll=null,e==="bottom"&&(t.scrollTop=t.scrollHeight),requestAnimationFrame(()=>{var i;let s=Math.max(0,t.scrollHeight-t.clientHeight);if(e==="bottom"){t.scrollTop=s;return}for(let n=this.state.msgs.length-1;n>=0;n--)if(((i=this.state.msgs[n])==null?void 0:i.role)==="assistant"){let o=this.root.querySelector(`#msg-${n}`);if(!o)return;let g=o.offsetTop-12;t.scrollTop=Math.max(0,Math.min(g,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let t=this.root.querySelector(".input");t==null||t.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let t="aliigo_visitor_session_v1";try{let e=localStorage.getItem(t);if(e&&e.length>=24)return e;let s=crypto.getRandomValues(new Uint8Array(16)),i=Array.from(s).map(n=>n.toString(16).padStart(2,"0")).join("");return localStorage.setItem(t,i),i}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let t=this.getEmbedKey(),e=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),i=t||e||"no-key";return`${this.STORAGE_PREFIX}:${i}:${s}`}loadPersisted(){try{let t=localStorage.getItem(this.storageKey());if(!t)return;let e=JSON.parse(t);e.theme&&(this.cachedTheme=e.theme),typeof e.brand=="string"&&(this.cachedBrand=e.brand);let s=typeof e.lastActiveAt=="number"?e.lastActiveAt:typeof e.savedAt=="number"?e.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof e.open=="boolean"&&(this.state.open=e.open),Array.isArray(e.msgs)&&(this.state.msgs=e.msgs),typeof e.conversationId=="string"&&(this.state.conversationId=e.conversationId),(e.locale==="en"||e.locale==="es")&&(this.state.locale=e.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(t=!0){try{let e=this.storageKey(),s=Date.now(),i=s,n;try{let p=localStorage.getItem(e);if(p){let l=JSON.parse(p);typeof l.savedAt=="number"&&(i=l.savedAt),typeof l.lastActiveAt=="number"&&(n=l.lastActiveAt)}}catch{}let o=t?s:n,g={savedAt:i,lastActiveAt:o,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(e,JSON.stringify(g)),this.state.msgs.length>0?this.lastActiveAtMs=t?s:o!=null?o:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let t=(this.getAttribute("variant")||"floating").toLowerCase();return t==="inline"||t==="hero"?t:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let t=(this.getAttribute("locale")||"").trim().toLowerCase();return t?t.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let t=(this.getAttribute("theme")||"").trim();if(!t)return null;try{let e=JSON.parse(t),s={};return typeof e.headerBg=="string"&&(s.headerBg=e.headerBg),typeof e.bubbleUser=="string"&&(s.bubbleUser=e.bubbleUser),typeof e.bubbleBot=="string"&&(s.bubbleBot=e.bubbleBot),typeof e.sendBg=="string"&&(s.sendBg=e.sendBg),typeof e.panelBg=="string"&&(s.panelBg=e.panelBg),typeof e.panelOpacity=="number"&&(s.panelOpacity=e.panelOpacity),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let t=this.getSessionTokenOverride(),e=this.getEmbedKey();if(!e&&!t)return null;if(this.state.session&&!t)return this.state.session;try{let s=this.getApiBase();if(t){let l=this.getLocaleOverride(),d=this.getThemeOverride(),h=this.getBrandOverride();return this.state.session={token:t,locale:l||this.state.locale,brand:(h||"").trim(),slug:"",theme:d},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=l||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let i=new URL(`${s}/api/embed/session`);i.searchParams.set("key",e),i.searchParams.set("host",window.location.hostname);let n=await fetch(i.toString(),{method:"GET"}),o=await n.json().catch(()=>({}));if(!n.ok||!o.token)return this.state.session=null,this.renderError(o.error||"Session error"),null;let p=this.getLocaleOverride()||(q(o.locale||"en")?"es":"en");return this.state.session={token:o.token,locale:p,brand:(o.brand||"").trim(),slug:(o.slug||"").trim(),theme:o.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=p,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var e;this.state.session=null;let t=await this.ensureSession();return(e=t==null?void 0:t.token)!=null?e:null}renderError(t){this.ensureRoot(),this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${t}</div></div>
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
    `}render(){var B;this.ensureRoot();let t=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!((B=this.state.session)!=null&&B.theme)&&!this.sessionHydrated){let f=t==="floating"?`wrap floating ${this.getFloatingMode()}`:t==="hero"?"wrap hero":"wrap inline",b=t==="hero"?"panel hero":t==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${f}">
            <div class="${b}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,i=this.getLocaleOverride()||this.state.locale,n=z[i],o=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},g=(o.panelBg||"").trim(),p=typeof o.panelOpacity=="number"?R(o.panelOpacity):1,l=g?V(g,p):null,d=l?`style="--panel-bg:${l};"`:"",h=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),c=A(o.headerBg,{bg:"#111827",text:"#ffffff"}),u=A(o.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),x=A(o.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),w=A(o.sendBg,{bg:"#2563eb",text:"#ffffff"}),I=t!=="floating"?!0:this.state.open,O=I,F=O&&!this.lastRenderOpen;this.lastRenderOpen=O;let H=this.getFloatingMode(),L=t==="floating"?`wrap floating ${H}`:t==="hero"?"wrap hero":"wrap inline",M=t==="hero"?"panel hero":t==="inline"?"panel inline":"panel",C=F?`${M} animate-in`:M,k=this.state.msgs,j=k.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${x.bg};--fg:${x.text};background:var(--bg);color:var(--fg);">
              ${n.welcome}
            </div>
          </div>`:k.map((f,b)=>{let m=f.role==="user",_=b===k.length-1,N=m?`--bg:${u.bg};--fg:${u.text};background:var(--bg);color:var(--fg);`:`--bg:${x.bg};--fg:${x.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${m?"user":"bot"}" id="msg-${b}">
                <div class="bubble ${m?"user":"bot"} ${_?"anim":""}" style="${N}">
                  ${D(f.content)}
                  ${!m&&Array.isArray(f.actions)&&f.actions.length?`<div class="actions">
                          ${f.actions.map(y=>y.type==="link"?`<a class="action" href="${S(y.url)}" target="_blank" rel="noopener noreferrer">${S(y.label)}</a>`:y.type==="handoff"?`<button class="action-btn" type="button" data-action="handoff" data-i="${b}">${S(y.label)}</button>`:"").join("")}
                        </div>`:""}
                </div>
              </div>`}).join("");if(t==="floating"&&!I){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${L}">
          <button class="pill" style="background:${w.bg};color:${w.text};">${n.pill(h)}</button>
        </div>
      `,this.root.querySelectorAll(".action-btn[data-action='handoff']").forEach(m=>{m.addEventListener("click",()=>{this.send("I\u2019d like a human follow-up.")})});let b=this.root.querySelector(".pill");b==null||b.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${L}">
      <div class="${C}" ${d}>
          <div class="header" style="background:${c.bg};color:${c.text};">
            <div>${n.title(h)}</div>
            ${t==="floating"?`<button class="close" aria-label="Close" style="color:${c.text};">\xD7</button>`:""}
          </div>

          <div class="body">
            <div class="messages">${j}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${n.placeholder}" />
            <button class="send" type="submit" style="background:${w.bg};color:${w.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${n.send}</button>
          </form>
        </div>
      </div>
    `;let T=this.root.querySelector(".close");T==null||T.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let $=this.root.querySelector(".form"),v=this.root.querySelector(".input");$==null||$.addEventListener("submit",f=>{f.preventDefault();let b=((v==null?void 0:v.value)||"").trim();b&&(v&&(v.value=""),this.pendingFocus=!0,this.send(b))}),this.applyPendingScroll(),this.applyPendingFocus()}async send(t){let e=this.state.session;if(e!=null&&e.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:t}],this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let s=this.getApiBase(),i=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:e.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web"})}),n=await i.json().catch(()=>({}));if(!i.ok){let g=(n.error||"").toLowerCase();if(i.status===403&&g.includes("session expired")){let p=await this.tryRefreshSessionToken();if(p){let l=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:p,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web"})}),d=await l.json().catch(()=>({}));if(l.ok){d.conversationId&&(this.state.conversationId=d.conversationId);let h=P(d.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.reply||"",actions:h}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:d.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}n.conversationId&&(this.state.conversationId=n.conversationId);let o=P(n.actions);this.state.msgs=[...this.state.msgs,{role:"assistant",content:n.reply||"",actions:o}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function S(r){return(r||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function U(r){return r.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}function D(r){var g,p;let a=S(r||""),e=U(a).split(/\r?\n/),s=l=>l.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),i=l=>s(l.join("<br/>")),n=e.findIndex(l=>/^\s*\d+\.\s+/.test(l));if(n!==-1){let l=e.slice(0,n).filter(c=>c.trim()!==""),d=[],h=[];for(let c=n;c<e.length;c++){let u=(g=e[c])!=null?g:"";if(/^\s*\d+\.\s+/.test(u)){d.push(u.replace(/^\s*\d+\.\s+/,"").trim());continue}u.trim()!==""&&h.push(u)}return d.length===0?i(e):`
      ${l.length?`<div class="lead">${i(l)}</div>`:""}
      <ol class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ol>
      ${h.length?`<div class="tail">${i(h)}</div>`:""}
    `}let o=e.findIndex(l=>/^\s*[-•]\s+/.test(l));if(o!==-1){let l=e.slice(0,o).filter(c=>c.trim()!==""),d=[],h=[];for(let c=o;c<e.length;c++){let u=(p=e[c])!=null?p:"";if(/^\s*[-•]\s+/.test(u)){d.push(u.replace(/^\s*[-•]\s+/,"").trim());continue}u.trim()!==""&&h.push(u)}return d.length===0?i(e):`
      ${l.length?`<div class="lead">${i(l)}</div>`:""}
      <ul class="list">
        ${d.map(c=>`<li>${s(c)}</li>`).join("")}
      </ul>
      ${h.length?`<div class="tail">${i(h)}</div>`:""}
    `}return i(e)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",E);})();
//# sourceMappingURL=aliigo-widget.js.map
