<template>
    <theme-style :theme="theme" />
    <div class="video-landing">
        <video-heading />
        <video-introduction />
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

useHead({
    title: t('video'),
});

const theme = ref({
    backgroundColor: "#000000",
    textColor: "#ffffff",
    accentColor: "#ffffff"
});

</script>