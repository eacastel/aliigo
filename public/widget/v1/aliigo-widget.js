"use strict";(()=>{var B={en:{pill:d=>d?`Ask ${d}`:"Chat",title:d=>d?`${d} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:d=>d?`Pregunta a ${d}`:"Chat",title:d=>d?`Asistente de ${d}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function R(d){return(d||"").toLowerCase().startsWith("es")}function m(d,u){let t=(d||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=t[0]||(u==null?void 0:u.bg)||"#111827",n=t[1]||(u==null?void 0:u.text)||"#ffffff";return{bg:s,text:n}}var S=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.lastRenderOpen=!1;this.pendingFocus=!1;this.sessionHydrated=!1;this.cachedTheme=null;this.cachedBrand="";this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let e=document.body;this.parentElement!==e&&e.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom",this.pendingFocus=!0),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.sessionHydrated=!1,this.render(),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(e,t,s){t!==s&&(this.ensureRoot(),this.render(),(e==="embed-key"||e==="api-base"||e==="session-token")&&(this.state.session=null,(e==="embed-key"||e==="session-token")&&(this.cachedTheme=null,this.cachedBrand="",this.sessionHydrated=!1),this.ensureSession().finally(()=>{this.sessionHydrated=!0,(this.state.session||!this.getEmbedKey())&&this.render()})))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let e=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(e<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},e+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let e=this.root.querySelector(".messages");if(!e||!this.pendingScroll)return;let t=this.pendingScroll;this.pendingScroll=null,t==="bottom"&&(e.scrollTop=e.scrollHeight),requestAnimationFrame(()=>{var n;let s=Math.max(0,e.scrollHeight-e.clientHeight);if(t==="bottom"){e.scrollTop=s;return}for(let i=this.state.msgs.length-1;i>=0;i--)if(((n=this.state.msgs[i])==null?void 0:n.role)==="assistant"){let o=this.root.querySelector(`#msg-${i}`);if(!o)return;let c=o.offsetTop-12;e.scrollTop=Math.max(0,Math.min(c,s));return}})}applyPendingFocus(){this.pendingFocus&&(this.pendingFocus=!1,requestAnimationFrame(()=>{let e=this.root.querySelector(".input");e==null||e.focus({preventScroll:!0})}))}getOrCreateVisitorSessionId(){let e="aliigo_visitor_session_v1";try{let t=localStorage.getItem(e);if(t&&t.length>=24)return t;let s=crypto.getRandomValues(new Uint8Array(16)),n=Array.from(s).map(i=>i.toString(16).padStart(2,"0")).join("");return localStorage.setItem(e,n),n}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let e=this.getEmbedKey(),t=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),n=e||t||"no-key";return`${this.STORAGE_PREFIX}:${n}:${s}`}loadPersisted(){try{let e=localStorage.getItem(this.storageKey());if(!e)return;let t=JSON.parse(e);t.theme&&(this.cachedTheme=t.theme),typeof t.brand=="string"&&(this.cachedBrand=t.brand);let s=typeof t.lastActiveAt=="number"?t.lastActiveAt:typeof t.savedAt=="number"?t.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof t.open=="boolean"&&(this.state.open=t.open),Array.isArray(t.msgs)&&(this.state.msgs=t.msgs),typeof t.conversationId=="string"&&(this.state.conversationId=t.conversationId),(t.locale==="en"||t.locale==="es")&&(this.state.locale=t.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(e=!0){try{let t=this.storageKey(),s=Date.now(),n=s,i;try{let r=localStorage.getItem(t);if(r){let a=JSON.parse(r);typeof a.savedAt=="number"&&(n=a.savedAt),typeof a.lastActiveAt=="number"&&(i=a.lastActiveAt)}}catch{}let o=e?s:i,c={savedAt:n,lastActiveAt:o,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open,theme:this.cachedTheme,brand:this.cachedBrand};localStorage.setItem(t,JSON.stringify(c)),this.state.msgs.length>0?this.lastActiveAtMs=e?s:o!=null?o:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let e=(this.getAttribute("variant")||"floating").toLowerCase();return e==="inline"||e==="hero"?e:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let e=(this.getAttribute("locale")||"").trim().toLowerCase();return e?e.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let e=(this.getAttribute("theme")||"").trim();if(!e)return null;try{let t=JSON.parse(e),s={};return typeof t.headerBg=="string"&&(s.headerBg=t.headerBg),typeof t.bubbleUser=="string"&&(s.bubbleUser=t.bubbleUser),typeof t.bubbleBot=="string"&&(s.bubbleBot=t.bubbleBot),typeof t.sendBg=="string"&&(s.sendBg=t.sendBg),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let e=this.getSessionTokenOverride(),t=this.getEmbedKey();if(!t&&!e)return null;if(this.state.session&&!e)return this.state.session;try{let s=this.getApiBase();if(e){let a=this.getLocaleOverride(),h=this.getThemeOverride(),l=this.getBrandOverride();return this.state.session={token:e,locale:a||this.state.locale,brand:(l||"").trim(),slug:"",theme:h},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=a||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let n=new URL(`${s}/api/embed/session`);n.searchParams.set("key",t),n.searchParams.set("host",window.location.hostname);let i=await fetch(n.toString(),{method:"GET"}),o=await i.json().catch(()=>({}));if(!i.ok||!o.token)return this.state.session=null,this.renderError(o.error||"Session error"),null;let r=this.getLocaleOverride()||(R(o.locale||"en")?"es":"en");return this.state.session={token:o.token,locale:r,brand:(o.brand||"").trim(),slug:(o.slug||"").trim(),theme:o.theme||null},this.cachedTheme=this.state.session.theme||null,this.cachedBrand=this.state.session.brand||"",this.state.locale=r,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var t;this.state.session=null;let e=await this.ensureSession();return(t=e==null?void 0:e.token)!=null?t:null}renderError(e){this.ensureRoot(),this.root.innerHTML=`
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
        background: #ffffff;
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
        background-color: #ffffff;
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
        background: #ffffff;
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
        .panel { width: 100%; height: 100%; max-height: 100%; border-radius: 0; }
        .header { padding: 12px 16px; }
        .pill { bottom: 20px; right: 20px; }
      }
    `}render(){var $;this.ensureRoot();let e=this.getVariant();if(!!this.getEmbedKey()&&!this.getThemeOverride()&&!this.cachedTheme&&!(($=this.state.session)!=null&&$.theme)&&!this.sessionHydrated){let b=e==="floating"?`wrap floating ${this.getFloatingMode()}`:e==="hero"?"wrap hero":"wrap inline",p=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel";this.root.innerHTML=`
          <style>${this.css()}</style>
          <div class="${b}">
            <div class="${p}" style="visibility:hidden"></div>
          </div>
        `;return}let s=this.state.session,n=this.getLocaleOverride()||this.state.locale,i=B[n],o=this.getThemeOverride()||(s==null?void 0:s.theme)||this.cachedTheme||{},c=(this.getBrandOverride()||(s==null?void 0:s.brand)||this.cachedBrand||"").trim(),r=m(o.headerBg,{bg:"#111827",text:"#ffffff"}),a=m(o.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),h=m(o.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),l=m(o.sendBg,{bg:"#2563eb",text:"#ffffff"}),g=e!=="floating"?!0:this.state.open,A=g,E=A&&!this.lastRenderOpen;this.lastRenderOpen=A;let I=this.getFloatingMode(),T=e==="floating"?`wrap floating ${I}`:e==="hero"?"wrap hero":"wrap inline",k=e==="hero"?"panel hero":e==="inline"?"panel inline":"panel",M=E?`${k} animate-in`:k,v=this.state.msgs,L=v.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${h.bg};--fg:${h.text};background:var(--bg);color:var(--fg);">
              ${i.welcome}
            </div>
          </div>`:v.map((b,p)=>{let w=b.role==="user",O=p===v.length-1,P=w?`--bg:${a.bg};--fg:${a.text};background:var(--bg);color:var(--fg);`:`--bg:${h.bg};--fg:${h.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${w?"user":"bot"}" id="msg-${p}">
                <div class="bubble ${w?"user":"bot"} ${O?"anim":""}" style="${P}">
                  ${H(b.content)}
                </div>
              </div>`}).join("");if(e==="floating"&&!g){if(this.lastRenderOpen=!1,!(!!(s!=null&&s.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${T}">
          <button class="pill" style="background:${l.bg};color:${l.text};">${i.pill(c)}</button>
        </div>
      `;let p=this.root.querySelector(".pill");p==null||p.addEventListener("click",()=>{this.state.open=!0,this.pendingFocus=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${T}">
        <div class="${M}">
          <div class="header" style="background:${r.bg};color:${r.text};">
            <div>${i.title(c)}</div>
            ${e==="floating"?`<button class="close" aria-label="Close" style="color:${r.text};">\xD7</button>`:""}
          </div>

          <div class="body">
            <div class="messages">${L}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${i.placeholder}" />
            <button class="send" type="submit" style="background:${l.bg};color:${l.text};" ${this.state.busy||!(s!=null&&s.token)?"disabled":""}>${i.send}</button>
          </form>
        </div>
      </div>
    `;let y=this.root.querySelector(".close");y==null||y.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let x=this.root.querySelector(".form"),f=this.root.querySelector(".input");x==null||x.addEventListener("submit",b=>{b.preventDefault();let p=((f==null?void 0:f.value)||"").trim();p&&(f&&(f.value=""),this.pendingFocus=!0,this.send(p))}),this.applyPendingScroll(),this.applyPendingFocus()}async send(e){let t=this.state.session;if(t!=null&&t.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:e}],this.pendingFocus=!0,this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let s=this.getApiBase(),n=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web"})}),i=await n.json().catch(()=>({}));if(!n.ok){let o=(i.error||"").toLowerCase();if(n.status===403&&o.includes("session expired")){let c=await this.tryRefreshSessionToken();if(c){let r=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:c,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:e,locale:this.state.locale,channel:"web"})}),a=await r.json().catch(()=>({}));if(r.ok){a.conversationId&&(this.state.conversationId=a.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:a.reply||""}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:a.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:i.error||"Error"}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}i.conversationId&&(this.state.conversationId=i.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:i.reply||""}],this.pendingFocus=!0,this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingFocus=!0,this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function F(d){return(d||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function H(d){var o,c;let e=F(d||"").split(/\r?\n/),t=r=>r.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),s=r=>t(r.join("<br/>")),n=e.findIndex(r=>/^\s*\d+\.\s+/.test(r));if(n!==-1){let r=e.slice(0,n).filter(l=>l.trim()!==""),a=[],h=[];for(let l=n;l<e.length;l++){let g=(o=e[l])!=null?o:"";if(/^\s*\d+\.\s+/.test(g)){a.push(g.replace(/^\s*\d+\.\s+/,"").trim());continue}g.trim()!==""&&h.push(g)}return a.length===0?s(e):`
      ${r.length?`<div class="lead">${s(r)}</div>`:""}
      <ol class="list">
        ${a.map(l=>`<li>${t(l)}</li>`).join("")}
      </ol>
      ${h.length?`<div class="tail">${s(h)}</div>`:""}
    `}let i=e.findIndex(r=>/^\s*[-•]\s+/.test(r));if(i!==-1){let r=e.slice(0,i).filter(l=>l.trim()!==""),a=[],h=[];for(let l=i;l<e.length;l++){let g=(c=e[l])!=null?c:"";if(/^\s*[-•]\s+/.test(g)){a.push(g.replace(/^\s*[-•]\s+/,"").trim());continue}g.trim()!==""&&h.push(g)}return a.length===0?s(e):`
      ${r.length?`<div class="lead">${s(r)}</div>`:""}
      <ul class="list">
        ${a.map(l=>`<li>${t(l)}</li>`).join("")}
      </ul>
      ${h.length?`<div class="tail">${s(h)}</div>`:""}
    `}return s(e)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",S);})();
//# sourceMappingURL=aliigo-widget.js.map
