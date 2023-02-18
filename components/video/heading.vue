<template>
    <div class="video-heading">
        {{ t('video') }}
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style scoped lang="scss">
.video-heading{
    font-size: 200px;
    font-weight: 900;
    text-shadow: 0 0 2px #000;
}
</style>