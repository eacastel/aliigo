// src/widget/v1/aliigo-widget.ts

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Theme = {
  headerBg?: string;   // "#111827 #ffffff"
  bubbleUser?: string; // "#2563eb #ffffff"
  bubbleBot?: string;  // "#f3f4f6 #111827"
  sendBg?: string;     // "#2563eb #ffffff"
};

type SessionPayload = {
  token: string;
  locale: "en" | "es";
  brand: string;
  slug: string;
  theme: Theme | null;
};

const UI = {
  en: {
    pill: (brand: string) => `Ask ${brand}`,
    title: (brand: string) => `${brand} Assistant`,
    welcome: "Ask a question and we’ll help right away.",
    placeholder: "Type your question…",
    send: "Send",
  },
  es: {
    pill: (brand: string) => `Pregunta a ${brand}`,
    title: (brand: string) => `Asistente de ${brand}`,
    welcome: "Haz tu consulta y te ayudamos al momento.",
    placeholder: "Escribe tu consulta…",
    send: "Enviar",
  },
} as const;

function isEs(locale: string) {
  return (locale || "").toLowerCase().startsWith("es");
}

function splitPair(v?: string, defaults?: { bg: string; text: string }) {
  const s = (v || "").trim();
  const m = s.match(/#([0-9a-fA-F]{3}){1,2}/g) || [];
  const bg = m[0] || defaults?.bg || "#111827";
  const text = m[1] || defaults?.text || "#ffffff";
  return { bg, text };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

class AliigoWidget extends HTMLElement {
  private root!: ShadowRoot;

  private ensureRoot() {
    if (!this.shadowRoot) {
      this.root = this.attachShadow({ mode: "open" });
    } else {
      this.root = this.shadowRoot;
    }
  }
  
  private state = {
    open: false,
    busy: false,
    conversationId: null as string | null,
    msgs: [] as Msg[],
    session: null as SessionPayload | null,
    locale: "en" as "en" | "es",
  };

 static get observedAttributes() {
  return ["variant","embed-key","api-base","locale","session-token","floating-mode","theme","brand"];

}


  connectedCallback() {
    // IMPORTANT: don't call attachShadow here directly anymore
    // because attributeChangedCallback may have already created it.
    this.ensureRoot();

    // If client embed: ensure we're attached to <html> to avoid transformed ancestors
    if (this.getVariant() === "floating" && this.getFloatingMode() === "fixed") {
      const host = document.documentElement;
      if (this.parentElement !== host) host.appendChild(this);
    }

    if (this.getVariant() === "floating" && this.getStartOpen()) {
      this.state.open = true;
    }

    this.render();
    void this.ensureSession();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    // IMPORTANT: attributeChangedCallback can run before connectedCallback
    this.ensureRoot();

    // Always rerender
    this.render();

    // Only refetch session if these change
    if (name === "embed-key" || name === "api-base" || name === "session-token") {
      this.state.session = null; // force refresh
      void this.ensureSession();
    }
  }

  private getBrandOverride(): string | null {
    const b = (this.getAttribute("brand") || "").trim();
    return b || null;
  }

  private getVariant(): "floating" | "inline" | "hero" {
    const v = (this.getAttribute("variant") || "floating").toLowerCase();
    if (v === "inline" || v === "hero") return v;
    return "floating";
  }

  private getEmbedKey() {
    return (this.getAttribute("embed-key") || "").trim();
  }

  private getApiBase() {
    return (this.getAttribute("api-base") || "https://aliigo.com").trim().replace(/\/$/, "");
  }

  private getLocaleOverride(): "en" | "es" | null {
    const v = (this.getAttribute("locale") || "").trim().toLowerCase();
    if (!v) return null;
    return v.startsWith("es") ? "es" : "en";
  }

  private getSessionTokenOverride(): string | null {
    const t = (this.getAttribute("session-token") || "").trim();
    return t || null;
  }

  private getThemeOverride(): Theme | null {
    const raw = (this.getAttribute("theme") || "").trim();
    if (!raw) return null;

    try {
      const o = JSON.parse(raw) as Partial<Theme>;
      const out: Theme = {};

      if (typeof o.headerBg === "string") out.headerBg = o.headerBg;
      if (typeof o.bubbleUser === "string") out.bubbleUser = o.bubbleUser;
      if (typeof o.bubbleBot === "string") out.bubbleBot = o.bubbleBot;
      if (typeof o.sendBg === "string") out.sendBg = o.sendBg;

      return out;
    } catch {
      return null;
    }
  }

  private getStartOpen(): boolean {
    return (this.getAttribute("start-open") || "").toLowerCase() === "true";
  }

  private getFloatingMode(): "fixed" | "absolute" {
    const v = (this.getAttribute("floating-mode") || "").toLowerCase();
    return v === "absolute" ? "absolute" : "fixed";
  }

  
  private async ensureSession() {
    // If dashboard preview already minted a token, skip session endpoint
    const overrideToken = this.getSessionTokenOverride();
    const embedKey = this.getEmbedKey();
    if (!embedKey && !overrideToken) return;

    // If we already have a session and it's still compatible with overrides, don’t thrash
    if (this.state.session && !overrideToken) return;

    try {
      const apiBase = this.getApiBase();

      if (overrideToken) {
        const localeOverride = this.getLocaleOverride();
        const themeOverride = this.getThemeOverride();
        const brandOverride = this.getBrandOverride();

        this.state.session = {
          token: overrideToken,
          locale: localeOverride || this.state.locale,
          brand: (brandOverride || "Aliigo").trim(),
          slug: "",
          theme: themeOverride,
        };

        this.state.locale = localeOverride || this.state.locale;
        this.render();
        return;
      }

      const url = new URL(`${apiBase}/api/embed/session`);
      url.searchParams.set("key", embedKey);
      // pass host for clarity; server will validate using Origin anyway
      url.searchParams.set("host", window.location.hostname);

      const res = await fetch(url.toString(), { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as Partial<SessionPayload> & { error?: string };

      if (!res.ok || !data.token) {
        // fail closed: widget won’t operate
        this.state.session = null;
        this.renderError(data.error || "Session error");
        return;
      }

      const localeOverride = this.getLocaleOverride();
      const locale = localeOverride || (isEs(data.locale || "en") ? "es" : "en");

      this.state.session = {
        token: data.token,
        locale,
        brand: (data.brand || "Aliigo").trim(),
        slug: (data.slug || "").trim(),
        theme: (data.theme as Theme | null) || null,
      };
      this.state.locale = locale;
      this.render();
    } catch {
      this.renderError("Network error");
    }
  }

  private renderError(msg: string) {
    this.ensureRoot();
    this.root.innerHTML = `
      <style>${this.css()}</style>
      <div class="wrap inline">
        <div class="panel">
          <div class="header">Aliigo</div>
          <div class="body"><div class="bubble bot">${msg}</div></div>
        </div>
      </div>
    `;
  }

  private css() {
  return `
    :host{ all: initial; display:block; height:100%; }
    :host([floating-mode="absolute"]){ position:relative; width:100%; height:100%; }

    .wrap{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; box-sizing:border-box; height:100%; }
    .wrap, .wrap *{ box-sizing:border-box; }

    .floating.fixed{ position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; }
    .floating.absolute{
      position: absolute;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      padding: 16px;
    }
    .floating.absolute .panel{
      max-width: calc(100% - 32px);
      max-height: calc(100% - 32px);
    }

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
      max-width: 100%;
      max-height: 100%;
    }

    .panel.inline{ width:100%; max-width:100%; }
    .panel.hero{ width:100%; max-width:100%; height:100%; } /* ✅ key fix */

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

    .floating.fixed{ top:auto !important; left:auto !important; }
  `;
}


  private render() {
    this.ensureRoot();
    const variant = this.getVariant();
    const session = this.state.session;
    const locale = this.getLocaleOverride() || this.state.locale;
    const t = UI[locale];

    const theme = this.getThemeOverride() || session?.theme || {};
    const header = splitPair(theme.headerBg, { bg: "#111827", text: "#ffffff" });
    const user = splitPair(theme.bubbleUser, { bg: "#2563eb", text: "#ffffff" });
    const bot = splitPair(theme.bubbleBot, { bg: "#f3f4f6", text: "#111827" });
    const send = splitPair(theme.sendBg, { bg: "#2563eb", text: "#ffffff" });

    const brand = (session?.brand || "").trim();

    const open = variant !== "floating" ? true : this.state.open;

    const floatingMode = this.getFloatingMode(); 
    const wrapperClass =
      variant === "floating"
        ? `wrap floating ${floatingMode}`
        : variant === "hero"
          ? "wrap hero"
          : "wrap inline";
    const panelClass = variant === "hero" ? "panel hero" : variant === "inline" ? "panel inline" : "panel";

    // Build messages html
    const msgs = this.state.msgs;
    const messagesHtml =
      msgs.length === 0
        ? `<div class="row bot"><div class="bubble bot" style="background:${bot.bg};color:${bot.text};">${t.welcome}</div></div>`
        : msgs
            .map((m) => {
              const isUser = m.role === "user";
              const bubbleStyle = isUser
                ? `background:${user.bg};color:${user.text};`
                : `background:${bot.bg};color:${bot.text};`;
              return `
                <div class="row ${isUser ? "user" : "bot"}">
                  <div class="bubble ${isUser ? "user" : "bot"}" style="${bubbleStyle}">${escapeHtml(m.content)}</div>
                </div>
              `;
            })
            .join("");

    // floating closed => pill only
    if (variant === "floating" && !open) {
      
      const themeOverride = this.getThemeOverride();
      if ((!session?.token || !brand) && !themeOverride) {
        this.root.innerHTML = `<style>${this.css()}</style>`;
        return;
      }

      this.root.innerHTML = `
        <style>${this.css()}</style>
        <div class="${wrapperClass}">
          <button class="pill" style="background:${send.bg};color:${send.text};">${t.pill(brand)}</button>
        </div>
      `;
      const btn = this.root.querySelector(".pill") as HTMLButtonElement | null;
      btn?.addEventListener("click", () => {
        this.state.open = true;
        this.render();
        this.scrollToBottomSoon();
      });
      return;
    }

    this.root.innerHTML = `
      <style>${this.css()}</style>
      <div class="${wrapperClass}">
        <div class="${panelClass}">
          <div class="header" style="background:${header.bg};color:${header.text};">
            <div>${t.title(brand)}</div>
            ${variant === "floating" ? `<button class="close" aria-label="Close" style="color:${header.text};">×</button>` : ``}
          </div>

          <div class="body">
            <div class="messages">${messagesHtml}<div id="bottom"></div></div>
          </div>

          <form class="form">
            <input class="input" placeholder="${t.placeholder}" />
            <button class="send" type="submit" style="background:${send.bg};color:${send.text};" ${this.state.busy || !session?.token ? "disabled" : ""}>${t.send}</button>
          </form>
        </div>
      </div>
    `;

    const close = this.root.querySelector(".close") as HTMLButtonElement | null;
    close?.addEventListener("click", () => {
      this.state.open = false;
      this.render();
    });

    const form = this.root.querySelector(".form") as HTMLFormElement | null;
    const input = this.root.querySelector(".input") as HTMLInputElement | null;

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (input?.value || "").trim();
      if (!v) return;
      if (input) input.value = "";
      void this.send(v);
    });

    this.scrollToBottomSoon();
  }

  private scrollToBottomSoon() {
    const messages = this.root.querySelector(".messages") as HTMLDivElement | null;
    if (!messages) return;
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  private async send(content: string) {
    const session = this.state.session;
    if (!session?.token) return;

    this.state.busy = true;
    this.state.msgs = [...this.state.msgs, { role: "user", content }];
    this.render();

    try {
      const apiBase = this.getApiBase();
      const res = await fetch(`${apiBase}/api/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: session.token,
          conversationId: this.state.conversationId,
          message: content,
          locale: this.state.locale,
          channel: "web",
        }),
      });

      const raw = (await res.json().catch(() => ({}))) as { conversationId?: string; reply?: string; error?: string; locale?: string };

      if (!res.ok) {
        this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw.error || "Error" }];
        this.state.busy = false;
        this.render();
        return;
      }

      if (raw.conversationId) this.state.conversationId = raw.conversationId;
      this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw.reply || "" }];
      this.state.busy = false;
      this.render();
    } catch {
      this.state.msgs = [...this.state.msgs, { role: "assistant", content: "Network error" }];
      this.state.busy = false;
      this.render();
    }
  }
}

function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (!customElements.get("aliigo-widget")) {
  customElements.define("aliigo-widget", AliigoWidget);
}
