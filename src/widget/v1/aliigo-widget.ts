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

type WidgetState = {
  open: boolean;
  busy: boolean;
  conversationId: string | null;
  msgs: Msg[];
  session: SessionPayload | null;
  locale: "en" | "es";
  visitorSessionId: string | null;
};

const UI = {
  en: {
    pill: (brand: string) => (brand ? `Ask ${brand}` : "Chat"),
    title: (brand: string) => (brand ? `${brand} Assistant` : "Assistant"),
    welcome: "Ask a question and we’ll help right away.",
    placeholder: "Type your question…",
    send: "Send",
  },
  es: {
    pill: (brand: string) => (brand ? `Pregunta a ${brand}` : "Chat"),
    title: (brand: string) => (brand ? `Asistente de ${brand}` : "Asistente"),
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

class AliigoWidget extends HTMLElement {
  private root!: ShadowRoot;

  private STORAGE_TTL_MS = 30 * 60 * 1000;
  private STORAGE_PREFIX = "aliigo_widget_v1";

  private pendingScroll: "bottom" | "lastAssistantStart" | null = null;

  // TTL enforcement even without page refresh
  private expiryTimer: number | null = null;
  private lastActiveAtMs: number | null = null;

  private lastRenderOpen = false;
  private pendingFocus = false;

  private onFocus = () => this.checkExpiryNow();
  private onVis = () => {
    if (!document.hidden) this.checkExpiryNow();
  };

  private state: WidgetState = {
    open: false,
    busy: false,
    conversationId: null,
    msgs: [],
    session: null,
    locale: "en",
    visitorSessionId: null,
  };

  static get observedAttributes() {
    return [
      "variant", "embed-key", "api-base", "locale", "session-token",
      "floating-mode", "theme", "brand",
      "start-open",
    ];
  }

  private ensureRoot() {
    if (!this.shadowRoot) {
      this.root = this.attachShadow({ mode: "open" });
    } else {
      this.root = this.shadowRoot;
    }
  }

  connectedCallback() {
    this.ensureRoot();
    this.state.visitorSessionId = this.getOrCreateVisitorSessionId();

    // restore transcript + conversationId (if within TTL)
    this.loadPersisted();

    // If we have recent persisted messages, auto-open on refresh (floating only)
    if (this.getVariant() === "floating" && this.state.msgs.length > 0) {
      this.state.open = true;
      this.pendingScroll = "bottom";
      this.pendingFocus = true;
    }

    // If client embed (fixed mode), move to <body> so it's truly viewport-fixed.
    if (this.getVariant() === "floating" && this.getFloatingMode() === "fixed") {
      const host = document.body;
      if (this.parentElement !== host) host.appendChild(this);
    }

    if (this.getVariant() === "floating" && this.getStartOpen()) {
      this.state.open = true;
      this.pendingScroll = "bottom";
      this.pendingFocus = true;
    }

    // Enforce TTL even when the tab stays open
    window.addEventListener("focus", this.onFocus);
    document.addEventListener("visibilitychange", this.onVis);
    this.scheduleExpiryTimer();

    this.render();
    void this.ensureSession();
  }

  disconnectedCallback() {
    window.removeEventListener("focus", this.onFocus);
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearExpiryTimer();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    // attributeChangedCallback can run before connectedCallback
    this.ensureRoot();

    // Always rerender
    this.render();

    // Only refetch session if these change
    if (name === "embed-key" || name === "api-base" || name === "session-token") {
      this.state.session = null; // force refresh
      void this.ensureSession();
    }
  }

  private clearExpiryTimer() {
    if (this.expiryTimer != null) {
      window.clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private scheduleExpiryTimer() {
    this.clearExpiryTimer();

    // Only enforce TTL if we have a conversation transcript to expire
    if (!this.lastActiveAtMs || this.state.msgs.length === 0) return;

    const msLeft = this.lastActiveAtMs + this.STORAGE_TTL_MS - Date.now();
    if (msLeft <= 0) {
      this.expireConversation();
      return;
    }

    // Add a tiny buffer so we don't race exact millisecond boundaries
    this.expiryTimer = window.setTimeout(() => {
      this.checkExpiryNow();
    }, msLeft + 50);
  }

  private checkExpiryNow() {
    if (!this.lastActiveAtMs || this.state.msgs.length === 0) return;

    const idleMs = Date.now() - this.lastActiveAtMs;
    if (idleMs >= this.STORAGE_TTL_MS) {
      this.expireConversation();
    } else {
      this.scheduleExpiryTimer();
    }
  }

  private expireConversation() {
    // Clear persisted transcript and reset in-memory conversation
    this.clearPersisted();
    this.lastActiveAtMs = null;
    this.clearExpiryTimer();

    this.state.msgs = [];
    this.state.conversationId = null;
    this.state.busy = false;

    // For floating widgets, close on expiry
    if (this.getVariant() === "floating") {
      this.state.open = false;
    }

    this.render();
  }

  private applyPendingScroll() {
    const messages = this.root.querySelector(".messages") as HTMLDivElement | null;
    if (!messages || !this.pendingScroll) return;

    const mode = this.pendingScroll;
    this.pendingScroll = null;

    requestAnimationFrame(() => {
      const max = Math.max(0, messages.scrollHeight - messages.clientHeight);

      if (mode === "bottom") {
        messages.scrollTop = max;
        return;
      }

      // lastAssistantStart => jump to last assistant message top (with a little offset)
      for (let i = this.state.msgs.length - 1; i >= 0; i--) {
        if (this.state.msgs[i]?.role === "assistant") {
          const el = this.root.querySelector(`#msg-${i}`) as HTMLElement | null;
          if (!el) return;

          const desired = el.offsetTop - 12;
          messages.scrollTop = Math.max(0, Math.min(desired, max));
          return;
        }
      }
    });
  }

  private applyPendingFocus() {
    if (!this.pendingFocus) return;
    this.pendingFocus = false;

    requestAnimationFrame(() => {
      const input = this.root.querySelector(".input") as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
    });
  }


  private getOrCreateVisitorSessionId() {
    const k = "aliigo_visitor_session_v1";
    try {
      const existing = localStorage.getItem(k);
      if (existing && existing.length >= 24) return existing;

      const rnd = crypto.getRandomValues(new Uint8Array(16));
      const id = Array.from(rnd).map((b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(k, id);
      return id;
    } catch {
      // last resort (no storage): per-page random
      return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  }

  private storageKey() {
    // embed-key is stable for real embeds; session-token covers dashboard preview
    const embedKey = this.getEmbedKey();
    const overrideToken = this.getSessionTokenOverride();
    const host = (window.location.hostname || "").toLowerCase();
    const key = embedKey || overrideToken || "no-key";
    return `${this.STORAGE_PREFIX}:${key}:${host}`;
  }

  private loadPersisted() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        savedAt?: number;
        lastActiveAt?: number;
        open?: boolean;
        conversationId?: string | null;
        msgs?: Msg[];
        locale?: "en" | "es";
      };

      const lastActive =
        typeof parsed.lastActiveAt === "number"
          ? parsed.lastActiveAt
          : typeof parsed.savedAt === "number"
            ? parsed.savedAt
            : 0;

      if (!lastActive || Date.now() - lastActive > this.STORAGE_TTL_MS) {
        this.clearPersisted();
        return;
      }

      if (typeof parsed.open === "boolean") this.state.open = parsed.open;
      if (Array.isArray(parsed.msgs)) this.state.msgs = parsed.msgs;
      if (typeof parsed.conversationId === "string") this.state.conversationId = parsed.conversationId;
      if (parsed.locale === "en" || parsed.locale === "es") this.state.locale = parsed.locale;

      // Track last active for live TTL expiry
      if (this.state.msgs.length > 0) {
        this.lastActiveAtMs = lastActive || Date.now();
      }
    } catch {
      // ignore
    }
  }

  private savePersisted(touch: boolean = true) {
    try {
      const k = this.storageKey();
      const now = Date.now();

      // Preserve original savedAt if it exists
      let savedAt = now;

      // Preserve previous lastActiveAt if touch=false
      let prevLastActiveAt: number | undefined = undefined;

      try {
        const prevRaw = localStorage.getItem(k);
        if (prevRaw) {
          const prev = JSON.parse(prevRaw) as { savedAt?: number; lastActiveAt?: number };
          if (typeof prev.savedAt === "number") savedAt = prev.savedAt;
          if (typeof prev.lastActiveAt === "number") prevLastActiveAt = prev.lastActiveAt;
        }
      } catch {
        // ignore parse issues
      }

      const nextLastActiveAt = touch ? now : prevLastActiveAt;

      const payload = {
        savedAt,
        lastActiveAt: nextLastActiveAt,
        conversationId: this.state.conversationId,
        msgs: this.state.msgs,
        locale: this.state.locale,
        open: this.state.open,
      };

      localStorage.setItem(k, JSON.stringify(payload));

      // update live TTL tracking
      if (this.state.msgs.length > 0) {
        this.lastActiveAtMs = touch ? now : (nextLastActiveAt ?? this.lastActiveAtMs);
      } else {
        this.lastActiveAtMs = null;
      }

      this.scheduleExpiryTimer();
    } catch {
      // ignore storage failures
    }
  }

  private clearPersisted() {
    try {
      localStorage.removeItem(this.storageKey());
    } catch {}
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

  private async ensureSession(): Promise<SessionPayload | null> {
    const overrideToken = this.getSessionTokenOverride();
    const embedKey = this.getEmbedKey();
    if (!embedKey && !overrideToken) return null;

    // If we already have a session and it's still compatible with overrides, don’t thrash
    if (this.state.session && !overrideToken) return this.state.session;

    try {
      const apiBase = this.getApiBase();

      if (overrideToken) {
        const localeOverride = this.getLocaleOverride();
        const themeOverride = this.getThemeOverride();
        const brandOverride = this.getBrandOverride();

        this.state.session = {
          token: overrideToken,
          locale: localeOverride || this.state.locale,
          brand: (brandOverride || "").trim(),
          slug: "",
          theme: themeOverride,
        };

        this.state.locale = localeOverride || this.state.locale;
        this.savePersisted(false);
        this.render();
        return this.state.session;
      }

      const url = new URL(`${apiBase}/api/embed/session`);
      url.searchParams.set("key", embedKey);
      url.searchParams.set("host", window.location.hostname);

      const res = await fetch(url.toString(), { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as Partial<SessionPayload> & { error?: string };

      if (!res.ok || !data.token) {
        this.state.session = null;
        this.renderError(data.error || "Session error");
        return null;
      }

      const localeOverride = this.getLocaleOverride();
      const locale = localeOverride || (isEs(data.locale || "en") ? "es" : "en");

      this.state.session = {
        token: data.token,
        locale,
        brand: (data.brand || "").trim(),
        slug: (data.slug || "").trim(),
        theme: (data.theme as Theme | null) || null,
      };

      this.state.locale = locale;
      this.savePersisted(false);
      this.render();
      return this.state.session;
    } catch {
      this.renderError("Network error");
      return null;
    }
  }

  private async tryRefreshSessionToken(): Promise<string | null> {
    this.state.session = null;
    const s = await this.ensureSession();
    return s?.token ?? null;
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

    const brand = (this.getBrandOverride() || session?.brand || "").trim();

    const open = variant !== "floating" ? true : this.state.open;

    const openNow = open;
    const animateIn = openNow && !this.lastRenderOpen;
    this.lastRenderOpen = openNow;

    const floatingMode = this.getFloatingMode();
    const wrapperClass =
      variant === "floating"
        ? `wrap floating ${floatingMode}`
        : variant === "hero"
          ? "wrap hero"
          : "wrap inline";

    const basePanelClass =
      variant === "hero" ? "panel hero" : variant === "inline" ? "panel inline" : "panel";

    const panelClass = animateIn ? `${basePanelClass} animate-in` : basePanelClass;


    const msgs = this.state.msgs;
    const messagesHtml =
      msgs.length === 0
        ? `<div class="row bot" id="msg-0">
            <div class="bubble bot anim" style="--bg:${bot.bg};--fg:${bot.text};background:var(--bg);color:var(--fg);">
              ${t.welcome}
            </div>
          </div>`
        : msgs
            .map((m, i) => {
              const isUser = m.role === "user";
              const isLast = i === msgs.length - 1;
              const bubbleStyle = isUser
                ? `--bg:${user.bg};--fg:${user.text};background:var(--bg);color:var(--fg);`
                : `--bg:${bot.bg};--fg:${bot.text};background:var(--bg);color:var(--fg);`;

              return `<div class="row ${isUser ? "user" : "bot"}" id="msg-${i}">
                <div class="bubble ${isUser ? "user" : "bot"} ${isLast ? "anim" : ""}" style="${bubbleStyle}">
                  ${formatMessageHtml(m.content)}
                </div>
              </div>`;
            })
            .join("");

    // floating closed => pill only
    if (variant === "floating" && !open) {
      this.lastRenderOpen = false;
      const hasToken = !!session?.token || !!this.getSessionTokenOverride();
      if (!hasToken) {
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
        this.pendingFocus = true;
        this.savePersisted(false);
        this.pendingScroll = "bottom";
        this.render();
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
      this.savePersisted(false);
      this.render();
    });

    const form = this.root.querySelector(".form") as HTMLFormElement | null;
    const input = this.root.querySelector(".input") as HTMLInputElement | null;

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (input?.value || "").trim();
      if (!v) return;
      if (input) input.value = "";
      this.pendingFocus = true;
      void this.send(v);
    });

    this.applyPendingScroll();
    this.applyPendingFocus();
  }

  private async send(content: string) {
    const session = this.state.session;
    if (!session?.token) return;

    this.state.busy = true;
    this.state.msgs = [...this.state.msgs, { role: "user", content }];
    this.pendingFocus = true;
    this.savePersisted(true);
    this.pendingScroll = "bottom";
    this.render();

    try {
      const apiBase = this.getApiBase();
      const res = await fetch(`${apiBase}/api/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: session.token,
          conversationId: this.state.conversationId,
          externalRef: this.state.visitorSessionId,
          message: content,
          locale: this.state.locale,
          channel: "web",
        }),
      });

      const raw = (await res.json().catch(() => ({}))) as {
        conversationId?: string;
        reply?: string;
        error?: string;
        locale?: string;
      };

      if (!res.ok) {
        const errText = (raw.error || "").toLowerCase();

        // Auto-recover from "Session expired" once (refresh token, retry)
        if (res.status === 403 && errText.includes("session expired")) {
          const fresh = await this.tryRefreshSessionToken();

          if (fresh) {
            const retry = await fetch(`${apiBase}/api/conversation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: fresh,
                conversationId: this.state.conversationId,
                externalRef: this.state.visitorSessionId,
                message: content,
                locale: this.state.locale,
                channel: "web",
              }),
            });

            const raw2 = (await retry.json().catch(() => ({}))) as {
              conversationId?: string;
              reply?: string;
              error?: string;
              locale?: string;
            };

            if (retry.ok) {
              if (raw2.conversationId) this.state.conversationId = raw2.conversationId;
              this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw2.reply || "" }];
              this.pendingFocus = true;
              this.state.busy = false;
              this.savePersisted(true);
              this.pendingScroll = "lastAssistantStart";
              this.render();
              return;
            }

            // retry failed
            this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw2.error || "Error" }];
            this.pendingFocus = true;
            this.state.busy = false;
            this.savePersisted(true);
            this.pendingScroll = "lastAssistantStart";
            this.render();
            return;
          }
        }

        // default error path
        this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw.error || "Error" }];
        this.pendingFocus = true;
        this.state.busy = false;
        this.savePersisted(true);
        this.pendingScroll = "lastAssistantStart";
        this.render();
        return;
      }

      if (raw.conversationId) this.state.conversationId = raw.conversationId;
      this.state.msgs = [...this.state.msgs, { role: "assistant", content: raw.reply || "" }];
      this.pendingFocus = true;
      this.state.busy = false;
      this.savePersisted(true);
      this.pendingScroll = "lastAssistantStart";
      this.render();
    } catch {
      this.state.msgs = [...this.state.msgs, { role: "assistant", content: "Network error" }];
      this.pendingFocus = true;
      this.pendingScroll = "lastAssistantStart";
      this.state.busy = false;
      this.savePersisted(true);
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

function formatMessageHtml(raw: string) {
  const escaped = escapeHtml(raw || "");
  const lines = escaped.split(/\r?\n/);

  const inline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const joinLines = (arr: string[]) => inline(arr.join("<br/>"));

  // ---------- Numbered list ----------
  const firstNumIdx = lines.findIndex((l) => /^\s*\d+\.\s+/.test(l));
  if (firstNumIdx !== -1) {
    const leadLines = lines.slice(0, firstNumIdx).filter((l) => l.trim() !== "");

    const items: string[] = [];
    const tailLines: string[] = [];

    for (let i = firstNumIdx; i < lines.length; i++) {
      const l = lines[i] ?? "";
      if (/^\s*\d+\.\s+/.test(l)) {
        items.push(l.replace(/^\s*\d+\.\s+/, "").trim());
        continue;
      }
      if (l.trim() === "") continue;
      tailLines.push(l);
    }

    if (items.length === 0) return joinLines(lines);

    return `
      ${leadLines.length ? `<div class="lead">${joinLines(leadLines)}</div>` : ""}
      <ol class="list">
        ${items.map((it) => `<li>${inline(it)}</li>`).join("")}
      </ol>
      ${tailLines.length ? `<div class="tail">${joinLines(tailLines)}</div>` : ""}
    `;
  }

  // ---------- Bulleted list ----------
  const firstBulIdx = lines.findIndex((l) => /^\s*[-•]\s+/.test(l));
  if (firstBulIdx !== -1) {
    const leadLines = lines.slice(0, firstBulIdx).filter((l) => l.trim() !== "");

    const items: string[] = [];
    const tailLines: string[] = [];

    for (let i = firstBulIdx; i < lines.length; i++) {
      const l = lines[i] ?? "";
      if (/^\s*[-•]\s+/.test(l)) {
        items.push(l.replace(/^\s*[-•]\s+/, "").trim());
        continue;
      }
      if (l.trim() === "") continue;
      tailLines.push(l);
    }

    if (items.length === 0) return joinLines(lines);

    return `
      ${leadLines.length ? `<div class="lead">${joinLines(leadLines)}</div>` : ""}
      <ul class="list">
        ${items.map((it) => `<li>${inline(it)}</li>`).join("")}
      </ul>
      ${tailLines.length ? `<div class="tail">${joinLines(tailLines)}</div>` : ""}
    `;
  }

  // ---------- Fallback ----------
  return joinLines(lines);
}

if (!customElements.get("aliigo-widget")) {
  customElements.define("aliigo-widget", AliigoWidget);
}
