export default defineNuxtConfig({
  ssr: false,

  typescript: {
    shim: false,
  },

  app: {
    head: {
      title: "XYZIES Dashboard",
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/images/logos/xyzies-logo.png"
        },
        {
          rel: "shortcut icon",
          href: "/images/favicon.png"
        }
      ]
    },
  },

  build: {
    transpile: ["vuetify", "@vuepic/vue-datepicker"],
  },

  nitro: {
    serveStatic: true,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://dash3.50g.io/api/admin',
      chatApiUrl: process.env.NUXT_PUBLIC_CHAT_API_URL || 'https://dash3.50g.io/api',
      pusherKey: process.env.PUSHER_APP_KEY || 'b395ac035994ca7af583',
      pusherCluster: process.env.PUSHER_APP_CLUSTER || 'eu',
      pusherAppId: process.env.PUSHER_APP_ID || '1553073',
      pusherSecret: process.env.PUSHER_APP_SECRET || '8a20e39fc3f1ab6111af'
    }
  },

  sourcemap: { server: false, client: false },
  devServerHandlers: [],
  compatibilityDate: "2025-04-04",
});