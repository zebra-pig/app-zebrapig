
// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
    meta: {
        title: process.env.APP_NAME,
        titleTemplate: '%s – ' + process.env.APP_NAME,
    },
    modules: [
        '@intlify/nuxt3',
        // https://nuxt-graphql-client.web.app/
        'nuxt-graphql-client',
    ],
    css: [
        '@/styles/globals.scss',
    ],
    experimental: {
        writeEarlyHints: false,
    },
    // build: {
    //     transpile: [ 
    //         'graphql',
    //         'troisjs', 
    //     ],
    // },
    components: {
        global: true,
        dirs: ['~/components']
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
            CONTENT_ENDPOINT: process.env.CONTENT_ENDPOINT,
            GQL_HOST: process.env.GQL_HOST,
            GQL_TOKEN: process.env.GQL_TOKEN,
           
            'graphql-client': {
                clients: {
                    default: {
                        host: process.env.GQL_HOST,
                        token: process.env.GQL_TOKEN,
                        retainToken: true
                    },
                    
                }
            }
        },
    },
});