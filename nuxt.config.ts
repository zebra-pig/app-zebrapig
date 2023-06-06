
// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
    app: {
        head: {
            title: process.env.APP_NAME,
            titleTemplate: '%s – ' + process.env.APP_NAME,
        }
    },
    modules: [
        '@nuxtjs/i18n',
        // https://nuxt-graphql-client.web.app/
        'nuxt-graphql-client',
    ],
    // @ts-ignore
    content: {
        dev: process.env.APP_ENV == 'local'
    },
    css: [
        '@/styles/globals.scss',
    ],
    experimental: {
        writeEarlyHints: false,
    },
    components: {
        global: true,
        dirs: ['~/components']
    },
    i18n: {
        baseUrl: process.env.BASE_URL,
        strategy: 'prefix_except_default',
        defaultLocale: "en",
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
            useCookie: true,
            cookieKey: 'i18n_redirected',
            //redirectOn: 'root',
        },
        langDir: "./lang",
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