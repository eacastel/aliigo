// src/i18n/routing.ts

import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation'; 

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es',

  localeDetection: false,
  pathnames: {
    '/': '/',
    '/pricing': {
      en: '/pricing',
      es: '/precios'
    },
    '/signup': {
      en: '/signup',
      es: '/registro'
    },
    '/login': {
      en: '/login',
      es: '/iniciar-sesion'
    },
    '/reset-password': {
      en: '/reset-password',
      es: '/restablecer-contrasena'
    },
    '/update-password': {
      en: '/update-password',
      es: '/actualizar-contrasena'
    },
    '/check-email': {
      en: '/check-email',
      es: '/revisar-correo'
    },
    '/why-aliigo': {
      en: '/why-aliigo',
      es: '/por-que-aliigo'
    },
    '/lp/website-ai-assistant': {
      en: '/lp/website-ai-assistant',
      es: '/lp/asistente-web-ia'
    },
    '/founder': {
      en: '/founder',
      es: '/fundador'
    },
    '/dashboard': {
      en: '/dashboard',
      es: '/dashboard'
    },
    '/dashboard/widget': {
      en: '/dashboard/widget',
      es: '/dashboard/widget'
    },
    '/dashboard/widget/advanced': {
      en: '/dashboard/widget/advanced',
      es: '/dashboard/widget/advanced'
    },
    '/dashboard/messages': {
      en: '/dashboard/messages',
      es: '/dashboard/messages'
    },
    '/dashboard/help': {
      en: '/dashboard/help',
      es: '/dashboard/help'
    },
    '/dashboard/billing': {
      en: '/dashboard/billing',
      es: '/dashboard/billing'
    },
    '/dashboard/settings/business': {
      en: '/dashboard/settings/business',
      es: '/dashboard/settings/business'
    },
    '/dashboard/settings/assistant': {
      en: '/dashboard/settings/assistant',
      es: '/dashboard/settings/assistant'
    },
    '/legal/aviso-legal': {
      en: '/legal/aviso-legal',
      es: '/legal/aviso-legal'
    },
    '/legal/privacidad': {
      en: '/legal/privacidad',
      es: '/legal/privacidad'
    },
    '/legal/cookies': {
      en: '/legal/cookies',
      es: '/legal/cookies'
    },
    '/legal/terminos': {
      en: '/legal/terminos',
      es: '/legal/terminos'
    },
    '/legal/subscription-agreement': {
      en: '/legal/subscription-agreement',
      es: '/legal/subscription-agreement'
    },
    '/legal/dpa': {
      en: '/legal/dpa',
      es: '/legal/dpa'
    },
    '/legal/subprocessors': {
      en: '/legal/subprocessors',
      es: '/legal/subprocessors'
    }
  }
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
