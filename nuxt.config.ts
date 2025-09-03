// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  css: ['~/assets/css/global.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  components: {
    global: true,
    dirs: ["~/components", "~/composables"],
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  modules: ['@nuxtjs/strapi', '@pinia/nuxt', '@nuxt/icon', '@primevue/nuxt-module', '@vueuse/nuxt'],

  primevue: {
    options: {
      theme: {
        preset: Aura
      }
    }
  },

  strapi: {
    url: process.env.STATE_ENV === 'dev' ? 'http://localhost:1337' : 'https://meet-api.baza.expert',
    prefix: '/api',
    admin: '/admin',
    version: 'v5',
    cookie: {},
    cookieName: 'strapi_jwt'
  },
  runtimeConfig: {
        public: {
            API:
                process.env.BASE_URL_API || '',
            FRONT:
                process.env.STATE_FRONT === 'prod' ? 'https://meet.baza.expert': 'http://localhost:3000',
            WS:
                process.env.BASE_URL_WS || '',
            IO:
                process.env.BASE_URL_IO || '',
        },
    },

})