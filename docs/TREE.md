.
├── docs
│   ├── ARCHITECTURE.md
│   ├── LOCAL_DEV.md
│   ├── SECURITY_NOTES.md
│   ├── seats-domains.md
│   ├── TODO.md
│   └── TREE.md
├── .env.local
├── eslint.config.mjs
├── .gitignore
├── .netlify
├── README.md
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── billing
│   │   │   │   └── status
│   │   │   │       └── route.ts
│   │   │   ├── conversation
│   │   │   │   └── route.ts
│   │   │   ├── embed
│   │   │   │   ├── preview-session
│   │   │   │   │   └── route.ts
│   │   │   │   └── session
│   │   │   │       └── route.ts
│   │   │   ├── meta-events
│   │   │   │   └── route.ts
│   │   │   ├── profiles
│   │   │   │   └── ensure
│   │   │   │       └── route.ts
│   │   │   ├── settings
│   │   │   │   └── business
│   │   │   │       └── route.ts
│   │   │   ├── support-token
│   │   │   │   └── route.ts
│   │   │   ├── webhooks
│   │   │   │   └── whatsapp
│   │   │   │       └── route.ts
│   │   │   └── widget
│   │   │       ├── rotate-token
│   │   │       │   └── route.ts
│   │   │       └── save
│   │   │           └── route.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── [locale]
│   │       ├── (app)
│   │       │   └── dashboard
│   │       │       ├── billing
│   │       │       │   └── page.tsx
│   │       │       ├── business
│   │       │       │   └── route.tsx
│   │       │       ├── layout.tsx
│   │       │       ├── messages
│   │       │       │   └── page.tsx
│   │       │       ├── page.tsx
│   │       │       ├── settings
│   │       │       │   ├── assistant
│   │       │       │   │   └── page.tsx
│   │       │       │   ├── business
│   │       │       │   │   └── page.tsx
│   │       │       │   └── page.tsx
│   │       │       └── widget
│   │       │           ├── advanced
│   │       │           │   └── page.tsx
│   │       │           └── page.tsx
│   │       ├── chat
│   │       │   ├── ClientEmbed.tsx
│   │       │   └── page.tsx
│   │       ├── layout.tsx
│   │       └── (public)
│   │           ├── auth
│   │           │   └── callback
│   │           │       └── page.tsx
│   │           ├── check-email
│   │           │   └── page.tsx
│   │           ├── layout.tsx
│   │           ├── legal
│   │           │   ├── aviso-legal
│   │           │   │   └── page.tsx
│   │           │   ├── cookies
│   │           │   │   └── page.tsx
│   │           │   ├── privacidad
│   │           │   │   └── page.tsx
│   │           │   └── terminos
│   │           │       └── page.tsx
│   │           ├── login
│   │           │   └── page.tsx
│   │           ├── page.tsx
│   │           ├── reset-password
│   │           │   └── page.tsx
│   │           ├── signup
│   │           │   └── page.tsx
│   │           └── update-password
│   │               └── page.tsx
│   ├── components
│   │   ├── AliigoChatWidget.tsx
│   │   ├── AliigoSupportWidget.tsx
│   │   ├── DashboardTopBar.tsx
│   │   ├── HeroRotator.tsx
│   │   ├── HomepageAssistantDemo.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── LogoutButton.tsx
│   │   ├── SiteFooter.tsx
│   │   └── SiteHeaderPublic.tsx
│   ├── i18n
│   │   ├── request.ts
│   │   └── routing.ts
│   ├── lib
│   │   ├── auth-guard.ts
│   │   ├── config.ts
│   │   ├── dashboard
│   │   │   └── settingsBusiness.ts
│   │   ├── embedGate.ts
│   │   ├── locale.ts
│   │   ├── metaHelpers.ts
│   │   ├── planLimits.ts
│   │   ├── supabaseAdmin.ts
│   │   ├── supabaseClient.ts
│   │   └── url.ts
│   ├── messages
│   │   ├── en.json
│   │   └── es.json
│   ├── proxy.ts
│   ├── types
│   │   ├── chat.ts
│   │   └── custom-elements.d.ts
│   └── widget
│       └── v1
│           └── aliigo-widget.ts
├── tailwind.config.mjs
└── tsconfig.json
