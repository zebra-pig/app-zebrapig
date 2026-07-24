// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    compatibilityDate: '2026-07-24',

    app: {
        head: {
            title: process.env.APP_NAME,
            titleTemplate: '%s – ' + process.env.APP_NAME,
        }
    },

    // Deploy target: Cloudflare Workers (worker `zebrapig-web-client-production`).
    // The `cloudflare_module` preset emits `.output/server/index.mjs` + static
    // assets in `.output/public`, which `wrangler deploy` ships (see
    // wrangler.jsonc). Server sourcemaps are the biggest bundle cost and are
    // never shipped to the edge, so disable them.
    nitro: {
        preset: 'cloudflare_module',
    },
    sourcemap: {
        server: false,
    },

    modules: [
        '@nuxtjs/i18n',
        // https://nuxt-graphql-client.web.app/
        'nuxt-graphql-client',
    ],
    css: [
        '@/styles/globals.scss',
    ],
    components: {
        global: true,
        dirs: ['~/components']
    },
    build: {
        transpile: ['wide-align']
    },
    i18n: {
        baseUrl: process.env.BASE_URL,
        strategy: 'prefix_except_default',
        defaultLocale: "en",
        // @nuxtjs/i18n v9 resolves langDir relative to the i18n restructure
        // dir (<rootDir>/i18n); "../lang" keeps the existing lang/ folder.
        langDir: "../lang",
        locales: [
            {
                code: "de",
                iso: "de-CH",
                file: "de.json"
            },
            {
                code: "en",
                iso: "en-US",
                file: "en.json"
            },
            {
                code: "fr",
                iso: "fr-CH",
                file: "fr.json"
            },
            {
                code: "zh",
                iso: "zh-CN",
                file: "zh.json"
            }
        ],
        detectBrowserLanguage: {
            alwaysRedirect: true,
            useCookie: true,
            cookieKey: 'selectedLocale',
            fallbackLocale: 'de'
        },
    },
    runtimeConfig: {
        GQL_PRIVATE_TOKEN: process.env.GQL_PRIVATE_TOKEN,
        public: {
            APP_NAME: process.env.APP_NAME,
            CONTENT_ENDPOINT: process.env.CONTENT_ENDPOINT,
            GQL_HOST: process.env.GQL_HOST,
            GQL_TOKEN: process.env.GQL_TOKEN,

            'graphql-client': {
                clients: {
                    default: {
                        host: process.env.GQL_HOST!,
                        token: process.env.GQL_TOKEN,
                        retainToken: true
                    },
                }
            }
        },
    }
});
