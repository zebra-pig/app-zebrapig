<template>
    <div class="preview">
        <iframe v-if="!downloadPage.preview_media" :src="previewUrl" allowfullscreen="true"></iframe>
        <media-player v-else :media="downloadPage.preview_media" class="player" />
    </div>
</template>

<script setup>
    const { downloadPage } = defineProps(["download-page"])

    const previewUrl = computed(() => {
        return downloadPage.download_url.replaceAll("/edit", "/preview")
    })
</script>

<style lang="scss" scoped>
    iframe{
        border: 0px;
        width: 100vw;
        aspect-ratio: calc(1920/1080);
    }

    .preview{
        display: flex;
        transition: var(--color-change-transition);
        border-bottom: 2px solid var(--text-color);
    }

    .player{
        margin-top: 2px;
        width: 100vw;
    }

</style>