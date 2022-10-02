import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
    meta: {
        title: process.env.APP_NAME,
        titleTemplate: '%s – ' + process.env.APP_NAME,
    },
    modules: [
        '@intlify/nuxt3',
    ],
    css: [
        '@/styles/globals.scss',
    ],
    build: {
        transpile: [ 
            'graphql',
            'troisjs', 
        ],
    },
    buildModules: [
        // https://github.com/newbeea/nuxt3-apollo-starter
        '@nuxt3/apollo-module',
    ],
    components: {
        global: true,
        dirs: ['~/components']
    },
    apollo:
    {
        clientConfigs: {
            default: {
                uri: process.env.API_GQL_ENDPOINT,
                authenticationType: 'Bearer',
            },
        },
        cookieAttributes: {}, // not used but throws error if not set ???
    },
    router: {
        mode: "history",
    },
    intlify: {
        localeDir: 'lang',
        vueI18n: {
            locale: 'de-DE',
        }
    },
    runtimeConfig: {
        public: {
            APP_NAME: process.env.APP_NAME,
            API_BEARER_TOKEN: process.env.API_BEARER_TOKEN,
            CONTENT_ENDPOINT: process.env.CONTENT_ENDPOINT,
        },
    },
});