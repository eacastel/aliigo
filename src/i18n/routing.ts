// src/i18n/routing.ts

import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation'; 

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es',

  localeDetection: true,
  localeCookie: { name: 'NEXT_LOCALE' },
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
    }
  }
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
