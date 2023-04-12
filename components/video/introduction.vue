<template>

    <div class="video-introduction">
        <b>{{ t('video_introduction_bold') }}</b>
        {{ t('video_introduction') }}
    </div>
</template>

<script setup>
    const { t } = useI18n();
</script>

<style lang="scss">

.video-introduction{
    padding: 40px;
    font-size: 2em;
}
</style>