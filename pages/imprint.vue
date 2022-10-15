<template>
    <section class="wrapper" v-if="data?.settings">
        <h1>{{ t("imprint") }}</h1>
        {{ APP_NAME }}<br>
        {{ data.settings.street }}<br>
        {{ data.settings.zip }} {{ data.settings.city }}<br>
        {{ data.settings.country }}<br><br>
        <a :href="'mailto:'+APP_NAME+'<'+data.settings.email+'>'">{{ data.settings.email }}</a><br>
        <a :href="'tel:'+data.settings.phone">{{ data.settings.phone }}</a><br>
    </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const { public: { APP_NAME } } = useRuntimeConfig();


const { data } = useSettings();

const title = computed(() => {
    return t("imprint")
})

useHead({
    title,
})

</script>