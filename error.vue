<template>
    <site-header />
    <div class="container">
        <div class="header-spacer"></div>
        <section class="wrapper thin">
            <h1>{{ $t('error') }} {{ error.statusCode }}</h1>
        </section>
    </div>
    <site-footer />
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { public: { APP_NAME } } = useRuntimeConfig();

useHead({
    title: t('error')+' – ' + APP_NAME,
})

const error = useError()

</script>

<style scoped>
.header-spacer{
    height: 60px;
}
</style>