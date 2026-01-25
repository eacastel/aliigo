"use strict";(()=>{var E={en:{pill:l=>l?`Ask ${l}`:"Chat",title:l=>l?`${l} Assistant`:"Assistant",welcome:"Ask a question and we\u2019ll help right away.",placeholder:"Type your question\u2026",send:"Send"},es:{pill:l=>l?`Pregunta a ${l}`:"Chat",title:l=>l?`Asistente de ${l}`:"Asistente",welcome:"Haz tu consulta y te ayudamos al momento.",placeholder:"Escribe tu consulta\u2026",send:"Enviar"}};function I(l){return(l||"").toLowerCase().startsWith("es")}function m(l,p){let e=(l||"").trim().match(/#([0-9a-fA-F]{3}){1,2}/g)||[],s=e[0]||(p==null?void 0:p.bg)||"#111827",i=e[1]||(p==null?void 0:p.text)||"#ffffff";return{bg:s,text:i}}var w=class extends HTMLElement{constructor(){super(...arguments);this.STORAGE_TTL_MS=1800*1e3;this.STORAGE_PREFIX="aliigo_widget_v1";this.pendingScroll=null;this.expiryTimer=null;this.lastActiveAtMs=null;this.onFocus=()=>this.checkExpiryNow();this.onVis=()=>{document.hidden||this.checkExpiryNow()};this.state={open:!1,busy:!1,conversationId:null,msgs:[],session:null,locale:"en",visitorSessionId:null}}static get observedAttributes(){return["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand","start-open"]}ensureRoot(){this.shadowRoot?this.root=this.shadowRoot:this.root=this.attachShadow({mode:"open"})}connectedCallback(){if(this.ensureRoot(),this.state.visitorSessionId=this.getOrCreateVisitorSessionId(),this.loadPersisted(),this.getVariant()==="floating"&&this.state.msgs.length>0&&(this.state.open=!0,this.pendingScroll="bottom"),this.getVariant()==="floating"&&this.getFloatingMode()==="fixed"){let t=document.body;this.parentElement!==t&&t.appendChild(this)}this.getVariant()==="floating"&&this.getStartOpen()&&(this.state.open=!0,this.pendingScroll="bottom"),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVis),this.scheduleExpiryTimer(),this.render(),this.ensureSession()}disconnectedCallback(){window.removeEventListener("focus",this.onFocus),document.removeEventListener("visibilitychange",this.onVis),this.clearExpiryTimer()}attributeChangedCallback(t,e,s){e!==s&&(this.ensureRoot(),this.render(),(t==="embed-key"||t==="api-base"||t==="session-token")&&(this.state.session=null,this.ensureSession()))}clearExpiryTimer(){this.expiryTimer!=null&&(window.clearTimeout(this.expiryTimer),this.expiryTimer=null)}scheduleExpiryTimer(){if(this.clearExpiryTimer(),!this.lastActiveAtMs||this.state.msgs.length===0)return;let t=this.lastActiveAtMs+this.STORAGE_TTL_MS-Date.now();if(t<=0){this.expireConversation();return}this.expiryTimer=window.setTimeout(()=>{this.checkExpiryNow()},t+50)}checkExpiryNow(){if(!this.lastActiveAtMs||this.state.msgs.length===0)return;Date.now()-this.lastActiveAtMs>=this.STORAGE_TTL_MS?this.expireConversation():this.scheduleExpiryTimer()}expireConversation(){this.clearPersisted(),this.lastActiveAtMs=null,this.clearExpiryTimer(),this.state.msgs=[],this.state.conversationId=null,this.state.busy=!1,this.getVariant()==="floating"&&(this.state.open=!1),this.render()}applyPendingScroll(){let t=this.root.querySelector(".messages");if(!t||!this.pendingScroll)return;let e=this.pendingScroll;this.pendingScroll=null,requestAnimationFrame(()=>{var i;let s=Math.max(0,t.scrollHeight-t.clientHeight);if(e==="bottom"){t.scrollTop=s;return}for(let r=this.state.msgs.length-1;r>=0;r--)if(((i=this.state.msgs[r])==null?void 0:i.role)==="assistant"){let a=this.root.querySelector(`#msg-${r}`);if(!a)return;let d=a.offsetTop-12;t.scrollTop=Math.max(0,Math.min(d,s));return}})}getOrCreateVisitorSessionId(){let t="aliigo_visitor_session_v1";try{let e=localStorage.getItem(t);if(e&&e.length>=24)return e;let s=crypto.getRandomValues(new Uint8Array(16)),i=Array.from(s).map(r=>r.toString(16).padStart(2,"0")).join("");return localStorage.setItem(t,i),i}catch{return`${Date.now()}_${Math.random().toString(16).slice(2)}`}}storageKey(){let t=this.getEmbedKey(),e=this.getSessionTokenOverride(),s=(window.location.hostname||"").toLowerCase(),i=t||e||"no-key";return`${this.STORAGE_PREFIX}:${i}:${s}`}loadPersisted(){try{let t=localStorage.getItem(this.storageKey());if(!t)return;let e=JSON.parse(t),s=typeof e.lastActiveAt=="number"?e.lastActiveAt:typeof e.savedAt=="number"?e.savedAt:0;if(!s||Date.now()-s>this.STORAGE_TTL_MS){this.clearPersisted();return}typeof e.open=="boolean"&&(this.state.open=e.open),Array.isArray(e.msgs)&&(this.state.msgs=e.msgs),typeof e.conversationId=="string"&&(this.state.conversationId=e.conversationId),(e.locale==="en"||e.locale==="es")&&(this.state.locale=e.locale),this.state.msgs.length>0&&(this.lastActiveAtMs=s||Date.now())}catch{}}savePersisted(t=!0){try{let e=this.storageKey(),s=Date.now(),i=s,r;try{let n=localStorage.getItem(e);if(n){let o=JSON.parse(n);typeof o.savedAt=="number"&&(i=o.savedAt),typeof o.lastActiveAt=="number"&&(r=o.lastActiveAt)}}catch{}let a=t?s:r,d={savedAt:i,lastActiveAt:a,conversationId:this.state.conversationId,msgs:this.state.msgs,locale:this.state.locale,open:this.state.open};localStorage.setItem(e,JSON.stringify(d)),this.state.msgs.length>0?this.lastActiveAtMs=t?s:a!=null?a:this.lastActiveAtMs:this.lastActiveAtMs=null,this.scheduleExpiryTimer()}catch{}}clearPersisted(){try{localStorage.removeItem(this.storageKey())}catch{}}getBrandOverride(){return(this.getAttribute("brand")||"").trim()||null}getVariant(){let t=(this.getAttribute("variant")||"floating").toLowerCase();return t==="inline"||t==="hero"?t:"floating"}getEmbedKey(){return(this.getAttribute("embed-key")||"").trim()}getApiBase(){return(this.getAttribute("api-base")||"https://aliigo.com").trim().replace(/\/$/,"")}getLocaleOverride(){let t=(this.getAttribute("locale")||"").trim().toLowerCase();return t?t.startsWith("es")?"es":"en":null}getSessionTokenOverride(){return(this.getAttribute("session-token")||"").trim()||null}getThemeOverride(){let t=(this.getAttribute("theme")||"").trim();if(!t)return null;try{let e=JSON.parse(t),s={};return typeof e.headerBg=="string"&&(s.headerBg=e.headerBg),typeof e.bubbleUser=="string"&&(s.bubbleUser=e.bubbleUser),typeof e.bubbleBot=="string"&&(s.bubbleBot=e.bubbleBot),typeof e.sendBg=="string"&&(s.sendBg=e.sendBg),s}catch{return null}}getStartOpen(){return(this.getAttribute("start-open")||"").toLowerCase()==="true"}getFloatingMode(){return(this.getAttribute("floating-mode")||"").toLowerCase()==="absolute"?"absolute":"fixed"}async ensureSession(){let t=this.getSessionTokenOverride(),e=this.getEmbedKey();if(!e&&!t)return null;if(this.state.session&&!t)return this.state.session;try{let s=this.getApiBase();if(t){let o=this.getLocaleOverride(),h=this.getThemeOverride(),c=this.getBrandOverride();return this.state.session={token:t,locale:o||this.state.locale,brand:(c||"").trim(),slug:"",theme:h},this.state.locale=o||this.state.locale,this.savePersisted(!1),this.render(),this.state.session}let i=new URL(`${s}/api/embed/session`);i.searchParams.set("key",e),i.searchParams.set("host",window.location.hostname);let r=await fetch(i.toString(),{method:"GET"}),a=await r.json().catch(()=>({}));if(!r.ok||!a.token)return this.state.session=null,this.renderError(a.error||"Session error"),null;let n=this.getLocaleOverride()||(I(a.locale||"en")?"es":"en");return this.state.session={token:a.token,locale:n,brand:(a.brand||"").trim(),slug:(a.slug||"").trim(),theme:a.theme||null},this.state.locale=n,this.savePersisted(!1),this.render(),this.state.session}catch{return this.renderError("Network error"),null}}async tryRefreshSessionToken(){var e;this.state.session=null;let t=await this.ensureSession();return(e=t==null?void 0:t.token)!=null?e:null}renderError(t){this.ensureRoot(),this.root.innerHTML=`
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
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
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
        scroll-behavior: smooth;
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
        animation: message-enter 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        transform-origin: bottom center;
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
    `}render(){this.ensureRoot();let t=this.getVariant(),e=this.state.session,s=this.getLocaleOverride()||this.state.locale,i=E[s],r=this.getThemeOverride()||(e==null?void 0:e.theme)||{},a=m(r.headerBg,{bg:"#111827",text:"#ffffff"}),d=m(r.bubbleUser,{bg:"#2563eb",text:"#ffffff"}),n=m(r.bubbleBot,{bg:"#f3f4f6",text:"#111827"}),o=m(r.sendBg,{bg:"#2563eb",text:"#ffffff"}),h=(this.getBrandOverride()||(e==null?void 0:e.brand)||"").trim(),c=t!=="floating"?!0:this.state.open,g=this.getFloatingMode(),S=t==="floating"?`wrap floating ${g}`:t==="hero"?"wrap hero":"wrap inline",k=t==="hero"?"panel hero":t==="inline"?"panel inline":"panel",A=this.state.msgs,T=A.length===0?`<div class="row bot" id="msg-0">
            <div class="bubble bot" style="--bg:${n.bg};--fg:${n.text};background:var(--bg);color:var(--fg);">
              ${i.welcome}
            </div>
          </div>`:A.map((f,u)=>{let x=f.role==="user",$=x?`--bg:${d.bg};--fg:${d.text};background:var(--bg);color:var(--fg);`:`--bg:${n.bg};--fg:${n.text};background:var(--bg);color:var(--fg);`;return`<div class="row ${x?"user":"bot"}" id="msg-${u}">
                <div class="bubble ${x?"user":"bot"}" style="${$}">
                  ${L(f.content)}
                </div>
              </div>`}).join("");if(t==="floating"&&!c){if(!(!!(e!=null&&e.token)||!!this.getSessionTokenOverride())){this.root.innerHTML=`<style>${this.css()}</style>`;return}this.root.innerHTML=`
        <style>${this.css()}</style>
        <div class="${S}">
          <button class="pill" style="background:${o.bg};color:${o.text};">${i.pill(h)}</button>
        </div>
      `;let u=this.root.querySelector(".pill");u==null||u.addEventListener("click",()=>{this.state.open=!0,this.savePersisted(!1),this.pendingScroll="bottom",this.render()});return}this.root.innerHTML=`
      <style>${this.css()}</style>
      <div class="${S}">
        <div class="${k}">
          <div class="header" style="background:${a.bg};color:${a.text};">
            <div>${i.title(h)}</div>
            ${t==="floating"?`<button class="close" aria-label="Close" style="color:${a.text};">\xD7</button>`:""}
          </div>

          <div class="body">
            <div class="messages">${T}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${i.placeholder}" />
            <button class="send" type="submit" style="background:${o.bg};color:${o.text};" ${this.state.busy||!(e!=null&&e.token)?"disabled":""}>${i.send}</button>
          </form>
        </div>
      </div>
    `;let v=this.root.querySelector(".close");v==null||v.addEventListener("click",()=>{this.state.open=!1,this.savePersisted(!1),this.render()});let y=this.root.querySelector(".form"),b=this.root.querySelector(".input");y==null||y.addEventListener("submit",f=>{f.preventDefault();let u=((b==null?void 0:b.value)||"").trim();u&&(b&&(b.value=""),this.send(u))}),this.applyPendingScroll()}async send(t){let e=this.state.session;if(e!=null&&e.token){this.state.busy=!0,this.state.msgs=[...this.state.msgs,{role:"user",content:t}],this.savePersisted(!0),this.pendingScroll="bottom",this.render();try{let s=this.getApiBase(),i=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:e.token,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web"})}),r=await i.json().catch(()=>({}));if(!i.ok){let a=(r.error||"").toLowerCase();if(i.status===403&&a.includes("session expired")){let d=await this.tryRefreshSessionToken();if(d){let n=await fetch(`${s}/api/conversation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:d,conversationId:this.state.conversationId,externalRef:this.state.visitorSessionId,message:t,locale:this.state.locale,channel:"web"})}),o=await n.json().catch(()=>({}));if(n.ok){o.conversationId&&(this.state.conversationId=o.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:o.reply||""}],this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}this.state.msgs=[...this.state.msgs,{role:"assistant",content:o.error||"Error"}],this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}}this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.error||"Error"}],this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render();return}r.conversationId&&(this.state.conversationId=r.conversationId),this.state.msgs=[...this.state.msgs,{role:"assistant",content:r.reply||""}],this.state.busy=!1,this.savePersisted(!0),this.pendingScroll="lastAssistantStart",this.render()}catch{this.state.msgs=[...this.state.msgs,{role:"assistant",content:"Network error"}],this.pendingScroll="lastAssistantStart",this.state.busy=!1,this.savePersisted(!0),this.render()}}}};function M(l){return(l||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function L(l){var a,d;let t=M(l||"").split(/\r?\n/),e=n=>n.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),s=n=>e(n.join("<br/>")),i=t.findIndex(n=>/^\s*\d+\.\s+/.test(n));if(i!==-1){let n=t.slice(0,i).filter(c=>c.trim()!==""),o=[],h=[];for(let c=i;c<t.length;c++){let g=(a=t[c])!=null?a:"";if(/^\s*\d+\.\s+/.test(g)){o.push(g.replace(/^\s*\d+\.\s+/,"").trim());continue}g.trim()!==""&&h.push(g)}return o.length===0?s(t):`
      ${n.length?`<div class="lead">${s(n)}</div>`:""}
      <ol class="list">
        ${o.map(c=>`<li>${e(c)}</li>`).join("")}
      </ol>
      ${h.length?`<div class="tail">${s(h)}</div>`:""}
    `}let r=t.findIndex(n=>/^\s*[-•]\s+/.test(n));if(r!==-1){let n=t.slice(0,r).filter(c=>c.trim()!==""),o=[],h=[];for(let c=r;c<t.length;c++){let g=(d=t[c])!=null?d:"";if(/^\s*[-•]\s+/.test(g)){o.push(g.replace(/^\s*[-•]\s+/,"").trim());continue}g.trim()!==""&&h.push(g)}return o.length===0?s(t):`
      ${n.length?`<div class="lead">${s(n)}</div>`:""}
      <ul class="list">
        ${o.map(c=>`<li>${e(c)}</li>`).join("")}
      </ul>
      ${h.length?`<div class="tail">${s(h)}</div>`:""}
    `}return s(t)}customElements.get("aliigo-widget")||customElements.define("aliigo-widget",w);})();
//# sourceMappingURL=aliigo-widget.js.map
